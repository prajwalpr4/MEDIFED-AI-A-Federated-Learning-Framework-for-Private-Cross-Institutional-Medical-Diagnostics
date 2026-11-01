import os
import sys
import argparse
from pathlib import Path

# ============================================================
# PROJECT ROOT
# ============================================================

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

sys.path.insert(
    0,
    PROJECT_ROOT
)

import torch
import torch.nn as nn
import flwr as fl

from torch.utils.data import DataLoader, random_split, Subset

from models.resnet_model import create_resnet50
from preprocessing.dataset import ChestXrayDataset
from preprocessing.transforms import train_transform, val_transform

from federated.config import (
    DEVICE,
    LOCAL_EPOCHS,
    BATCH_SIZE,
    LEARNING_RATE,
    WEIGHT_DECAY,
    SERVER_ADDRESS,
    DATASET_PATHS,
    NUM_CLASSES,
    FEDPROX_MU,
    FEDPROX_ENABLED,
)


# ============================================================
# ARGUMENTS
# ============================================================

parser = argparse.ArgumentParser()

parser.add_argument(
    "--client-id",
    type=int,
    required=True,
    choices=[1, 2, 3]
)

args = parser.parse_args()

CLIENT_ID = args.client_id


# ============================================================
# CLIENT INFORMATION
# ============================================================

CLIENT_NAMES = {
    1: "Kaggle",
    2: "Chittagong",
    3: "Bhopal"
}

CLIENT_NAME = CLIENT_NAMES[CLIENT_ID]


# ============================================================
# DATASET
# ============================================================

CLIENT_ROOT = DATASET_PATHS[CLIENT_ID]

TRAIN_PATH = os.path.join(
    CLIENT_ROOT,
    "train"
)


# ============================================================
# STARTUP
# ============================================================

print()

print("=" * 75)

print(
    "FEDERATED MEDICAL DIAGNOSIS CLIENT"
)

print("=" * 75)

print(
    "Client ID:",
    CLIENT_ID
)

print(
    "Client source:",
    CLIENT_NAME
)

print(
    "Device:",
    DEVICE
)

print(
    "Local epochs:",
    LOCAL_EPOCHS
)

print(
    "Batch size:",
    BATCH_SIZE
)

print(
    "Learning rate:",
    LEARNING_RATE
)

print(
    "Weight decay:",
    WEIGHT_DECAY
)

print(
    "FedProx:",
    FEDPROX_ENABLED
)

print(
    "FedProx mu:",
    FEDPROX_MU
)

print()

print(
    "Training path:"
)

print(
    TRAIN_PATH
)


# ============================================================
# DATASET CHECK
# ============================================================

if not os.path.exists(TRAIN_PATH):

    raise FileNotFoundError(
        f"Training dataset not found:\n{TRAIN_PATH}"
    )


# ============================================================
# DYNAMIC TRAIN / VALIDATION SPLIT
# ============================================================

# Read the existing training folder only.
# No validation folder is created.

full_dataset = ChestXrayDataset(
    root_dir=TRAIN_PATH,
    transform=train_transform
)


if len(full_dataset) == 0:

    raise RuntimeError(
        f"No images found:\n{TRAIN_PATH}"
    )


# ------------------------------------------------------------
# 80% TRAINING / 20% VALIDATION
# ------------------------------------------------------------

train_size = int(
    0.8 * len(full_dataset)
)

val_size = (
    len(full_dataset)
    - train_size
)


# ------------------------------------------------------------
# FIXED RANDOM SEED
# ------------------------------------------------------------

# This makes the train/validation split
# reproducible across runs.

generator = torch.Generator().manual_seed(42)


train_subset, val_subset = random_split(
    range(len(full_dataset)),
    [
        train_size,
        val_size
    ],
    generator=generator
)


train_indices = train_subset.indices

val_indices = val_subset.indices


# ------------------------------------------------------------
# TRAINING DATASET
# ------------------------------------------------------------

# Training uses train_transform.
# This includes data augmentation.

train_dataset = Subset(
    full_dataset,
    train_indices
)


# ------------------------------------------------------------
# VALIDATION DATASET
# ------------------------------------------------------------

# Create another dataset pointing to the same
# physical train folder.
#
# Only the held-out validation indices are used.
#
# val_transform does NOT use random augmentation.

validation_full_dataset = ChestXrayDataset(
    root_dir=TRAIN_PATH,
    transform=val_transform
)


val_dataset = Subset(
    validation_full_dataset,
    val_indices
)


# ============================================================
# DATA LOADERS
# ============================================================

local_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=0,
    pin_memory=False
)


val_loader = DataLoader(
    val_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0,
    pin_memory=False
)


# ============================================================
# DATASET INFORMATION
# ============================================================

print()

print("=" * 75)

print(
    "DYNAMIC TRAIN / VALIDATION SPLIT"
)

print("=" * 75)

print(
    "Total images:",
    len(full_dataset)
)

print(
    "Training images:",
    len(train_dataset)
)

print(
    "Validation images:",
    len(val_dataset)
)

print(
    "Training batches:",
    len(local_loader)
)

print(
    "Validation batches:",
    len(val_loader)
)

print("=" * 75)


# ============================================================
# MODEL
# ============================================================

print()

print(
    "Creating ResNet-50..."
)


model = create_resnet50(
    num_classes=NUM_CLASSES,
    pretrained=True
)


model = model.to(
    DEVICE
)


print(
    "Model ready."
)


# ============================================================
# LOSS
# ============================================================

criterion = nn.CrossEntropyLoss()


# ============================================================
# PARAMETER FUNCTIONS
# ============================================================

def get_parameters():

    return [
        value.detach()
        .cpu()
        .numpy()

        for value
        in model.state_dict().values()
    ]


def set_parameters(parameters):

    current_state = (
        model.state_dict()
    )

    new_state = {}


    for (
        (key, old_value),
        new_value

    ) in zip(
        current_state.items(),
        parameters
    ):

        new_state[key] = torch.as_tensor(
            new_value,
            dtype=old_value.dtype,
            device=old_value.device
        )


    model.load_state_dict(
        new_state,
        strict=True
    )


def get_trainable_snapshot():

    return [
        parameter.detach().clone()

        for parameter
        in model.parameters()

        if parameter.requires_grad
    ]


# ============================================================
# FLOWER CLIENT
# ============================================================

class MedicalClient(
    fl.client.NumPyClient
):


    # ========================================================
    # GET PARAMETERS
    # ========================================================

    def get_parameters(
        self,
        config
    ):

        return get_parameters()


    # ========================================================
    # SET PARAMETERS
    # ========================================================

    def set_parameters(
        self,
        parameters
    ):

        set_parameters(
            parameters
        )


    # ========================================================
    # FIT
    # ========================================================

    def fit(
        self,
        parameters,
        config
    ):

        print()

        print(
            "=" * 75
        )

        print(
            f"CLIENT {CLIENT_ID} - ROUND TRAINING"
        )

        print(
            "=" * 75
        )


        # ----------------------------------------------------
        # RECEIVE GLOBAL MODEL
        # ----------------------------------------------------

        self.set_parameters(
            parameters
        )


        # ----------------------------------------------------
        # SNAPSHOT GLOBAL MODEL
        # ----------------------------------------------------

        global_parameters = (
            get_trainable_snapshot()
        )


        # ----------------------------------------------------
        # FRESH OPTIMIZER EVERY ROUND
        # ----------------------------------------------------

        optimizer = torch.optim.AdamW(
            model.parameters(),
            lr=LEARNING_RATE,
            weight_decay=WEIGHT_DECAY
        )


        model.train()


        final_loss = 0.0

        final_accuracy = 0.0


        # ====================================================
        # LOCAL EPOCHS
        # ====================================================

        for epoch in range(
            LOCAL_EPOCHS
        ):

            running_loss = 0.0

            total_samples = 0

            total_correct = 0


            print()

            print(
                f"Client {CLIENT_ID} "
                f"- Epoch {epoch + 1}/{LOCAL_EPOCHS}"
            )


            # ------------------------------------------------
            # BATCH LOOP
            # ------------------------------------------------

            for images, labels in local_loader:


                images = images.to(
                    DEVICE
                )


                labels = labels.to(
                    DEVICE
                )


                optimizer.zero_grad()


                # ------------------------------------------------
                # FORWARD
                # ------------------------------------------------

                outputs = model(
                    images
                )


                classification_loss = (
                    criterion(
                        outputs,
                        labels
                    )
                )


                # ------------------------------------------------
                # FEDPROX
                # ------------------------------------------------

                proximal_term = torch.tensor(
                    0.0,
                    device=DEVICE
                )


                if FEDPROX_ENABLED:

                    current_parameters = [
                        parameter

                        for parameter
                        in model.parameters()

                        if parameter.requires_grad
                    ]


                    for (
                        local_parameter,
                        global_parameter

                    ) in zip(
                        current_parameters,
                        global_parameters
                    ):

                        proximal_term += torch.sum(
                            (
                                local_parameter
                                -
                                global_parameter
                            ) ** 2
                        )


                # ------------------------------------------------
                # TOTAL LOSS
                # ------------------------------------------------

                if FEDPROX_ENABLED:

                    loss = (
                        classification_loss

                        +

                        (
                            FEDPROX_MU / 2.0
                        )

                        *

                        proximal_term
                    )

                else:

                    loss = classification_loss


                # ------------------------------------------------
                # BACKPROPAGATION
                # ------------------------------------------------

                loss.backward()


                # ------------------------------------------------
                # GRADIENT CLIPPING
                # ------------------------------------------------

                torch.nn.utils.clip_grad_norm_(
                    model.parameters(),
                    max_norm=5.0
                )


                optimizer.step()


                # ------------------------------------------------
                # STATISTICS
                # ------------------------------------------------

                predictions = torch.argmax(
                    outputs,
                    dim=1
                )


                batch_size = (
                    labels.size(0)
                )


                total_samples += (
                    batch_size
                )


                total_correct += (
                    predictions == labels
                ).sum().item()


                running_loss += (
                    loss.item()
                    *
                    batch_size
                )


            # ====================================================
            # EPOCH RESULTS
            # ====================================================

            if total_samples > 0:

                final_loss = (
                    running_loss
                    /
                    total_samples
                )


                final_accuracy = (
                    total_correct
                    /
                    total_samples
                )

            else:

                final_loss = 0.0

                final_accuracy = 0.0


            print(
                f"Loss: {final_loss:.4f}"
            )


            print(
                f"Accuracy: "
                f"{final_accuracy * 100:.2f}%"
            )


        # ====================================================
        # VALIDATION
        # ====================================================

        # Validation is performed only after
        # local training is complete.
        #
        # The validation images are not used
        # to update model weights.

        model.eval()


        val_running_loss = 0.0

        val_total_samples = 0

        val_total_correct = 0


        with torch.no_grad():

            for images, labels in val_loader:


                images = images.to(
                    DEVICE
                )


                labels = labels.to(
                    DEVICE
                )


                outputs = model(
                    images
                )


                validation_batch_loss = (
                    criterion(
                        outputs,
                        labels
                    )
                )


                predictions = torch.argmax(
                    outputs,
                    dim=1
                )


                batch_size = (
                    labels.size(0)
                )


                val_running_loss += (
                    validation_batch_loss.item()
                    *
                    batch_size
                )


                val_total_samples += (
                    batch_size
                )


                val_total_correct += (
                    predictions == labels
                ).sum().item()


        if val_total_samples > 0:

            val_loss = (
                val_running_loss
                /
                val_total_samples
            )


            val_accuracy = (
                val_total_correct
                /
                val_total_samples
            )

        else:

            val_loss = 0.0

            val_accuracy = 0.0


        print()

        print(
            f"Validation Loss: "
            f"{val_loss:.4f}"
        )


        print(
            f"Validation Accuracy: "
            f"{val_accuracy * 100:.2f}%"
        )


        # Return to training mode.
        model.train()


        # ====================================================
        # SEND MODEL
        # ====================================================

        updated_parameters = (
            get_parameters()
        )


        print()

        print(
            f"Client {CLIENT_ID} training "
            f"completed."
        )


        print(
            f"Final local accuracy: "
            f"{final_accuracy * 100:.2f}%"
        )


        print(
            f"Final validation accuracy: "
            f"{val_accuracy * 100:.2f}%"
        )


        return (

            updated_parameters,

            len(train_dataset),

            {

                "local_loss":
                    float(final_loss),


                "local_accuracy":
                    float(final_accuracy),


                "validation_loss":
                    float(val_loss),


                "validation_accuracy":
                    float(val_accuracy),


                "client_id":
                    float(CLIENT_ID),


                "fedprox_mu":
                    float(FEDPROX_MU),


                "tls_enabled":
                    1.0,


                "secure_aggregation":
                    0.0

            }

        )


# ============================================================
# START CLIENT
# ============================================================

if __name__ == "__main__":


    print()

    print(
        "=" * 75
    )


    print(
        f"CONNECTING CLIENT {CLIENT_ID}"
    )


    print(
        "=" * 75
    )


    print(
        "Server:",
        SERVER_ADDRESS
    )


    # --------------------------------------------------------
    # TLS CA
    # --------------------------------------------------------

    CA_CERT = (

        Path(PROJECT_ROOT)

        / "security"

        / "certs"

        / "ca"

        / "ca.crt"
    )


    if not CA_CERT.exists():

        raise FileNotFoundError(
            f"CA certificate not found:\n{CA_CERT}"
        )


    with open(
        CA_CERT,
        "rb"
    ) as f:

        root_certificate = (
            f.read()
        )


    print(
        "TLS certificate loaded."
    )


    # --------------------------------------------------------
    # START FLOWER CLIENT
    # --------------------------------------------------------

    fl.client.start_client(

        server_address=
            SERVER_ADDRESS,

        client=
            MedicalClient().to_client(),

        root_certificates=
            root_certificate
    )