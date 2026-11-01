import os
import sys

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)
sys.path.insert(0, PROJECT_ROOT)

import torch

from torch.utils.data import DataLoader, random_split, Subset
from torchvision.models import resnet50

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

from preprocessing.dataset import ChestXrayDataset
from preprocessing.transforms import train_transform, val_transform


# ============================================================
# CONFIGURATION
# ============================================================

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

NUM_CLASSES = 2
BATCH_SIZE = 16
NUM_ROUNDS = 3

# IMPORTANT:
# Must be the SAME seed used during training
RANDOM_SEED = 42

DATASET_PATHS = {
    1: "datasets/client1_kaggle",
    2: "datasets/client2_chittagong",
    3: "datasets/client3_bhopal",
}


# ============================================================
# CREATE SAME VALIDATION SPLIT
# ============================================================

def create_validation_dataset(dataset_root):

    train_path = os.path.join(
        dataset_root,
        "train"
    )

    # Dataset only used to obtain the same indices
    full_dataset = ChestXrayDataset(
        root_dir=train_path,
        transform=train_transform
    )

    total_size = len(full_dataset)

    train_size = int(0.8 * total_size)
    validation_size = total_size - train_size

    generator = torch.Generator().manual_seed(
        RANDOM_SEED
    )

    train_subset, validation_subset = random_split(
        full_dataset,
        [train_size, validation_size],
        generator=generator
    )

    # IMPORTANT:
    # Create a second dataset with val_transform
    # and use exactly the same validation indices.
    validation_full_dataset = ChestXrayDataset(
        root_dir=train_path,
        transform=val_transform
    )

    validation_dataset = Subset(
        validation_full_dataset,
        validation_subset.indices
    )

    return validation_dataset


# ============================================================
# LOAD GLOBAL MODEL
# ============================================================

def load_global_model(checkpoint_path):

    model = resnet50(weights=None)

    model.fc = torch.nn.Linear(
        model.fc.in_features,
        NUM_CLASSES
    )

    checkpoint = torch.load(
        checkpoint_path,
        map_location=DEVICE
    )

    if (
        isinstance(checkpoint, dict)
        and "state_dict" in checkpoint
    ):
        state_dict = checkpoint["state_dict"]
    else:
        state_dict = checkpoint

    model.load_state_dict(state_dict)

    model = model.to(DEVICE)
    model.eval()

    return model


# ============================================================
# EVALUATE ONE GLOBAL ROUND
# ============================================================

def evaluate_round(round_number):

    checkpoint_path = (
        f"models/checkpoints/federated/"
        f"global_round_{round_number:02d}.pth"
    )

    print("\n" + "=" * 80)
    print(f"GLOBAL MODEL - ROUND {round_number}")
    print("=" * 80)

    print(f"Checkpoint: {checkpoint_path}")

    if not os.path.exists(checkpoint_path):

        print("Checkpoint not found. Skipping.")

        return None

    model = load_global_model(
        checkpoint_path
    )

    print("Model loaded successfully.")

    all_true = []
    all_pred = []

    # ========================================================
    # CLIENT VALIDATION DATA
    # ========================================================

    for client_id, dataset_root in DATASET_PATHS.items():

        print("\n" + "-" * 80)
        print(f"CLIENT {client_id}")
        print("-" * 80)

        validation_dataset = create_validation_dataset(
            dataset_root
        )

        validation_loader = DataLoader(
            validation_dataset,
            batch_size=BATCH_SIZE,
            shuffle=False,
            num_workers=0
        )

        print(
            f"Validation images: "
            f"{len(validation_dataset)}"
        )

        y_true = []
        y_pred = []

        # ----------------------------------------------------
        # Prediction
        # ----------------------------------------------------

        with torch.no_grad():

            for images, labels in validation_loader:

                images = images.to(DEVICE)

                outputs = model(images)

                predictions = torch.argmax(
                    outputs,
                    dim=1
                )

                y_true.extend(
                    labels.cpu().numpy()
                )

                y_pred.extend(
                    predictions.cpu().numpy()
                )

        # ----------------------------------------------------
        # Client validation metrics
        # ----------------------------------------------------

        accuracy = accuracy_score(
            y_true,
            y_pred
        )

        precision = precision_score(
            y_true,
            y_pred,
            zero_division=0
        )

        recall = recall_score(
            y_true,
            y_pred,
            zero_division=0
        )

        f1 = f1_score(
            y_true,
            y_pred,
            zero_division=0
        )

        print(
            f"Accuracy  : {accuracy * 100:.2f}%"
        )

        print(
            f"Precision : {precision * 100:.2f}%"
        )

        print(
            f"Recall    : {recall * 100:.2f}%"
        )

        print(
            f"F1-score  : {f1 * 100:.2f}%"
        )

        print("\nConfusion Matrix:")

        print(
            confusion_matrix(
                y_true,
                y_pred
            )
        )

        # Add to global validation results
        all_true.extend(y_true)
        all_pred.extend(y_pred)

    # ========================================================
    # OVERALL VALIDATION PERFORMANCE
    # ========================================================

    accuracy = accuracy_score(
        all_true,
        all_pred
    )

    precision = precision_score(
        all_true,
        all_pred,
        zero_division=0
    )

    recall = recall_score(
        all_true,
        all_pred,
        zero_division=0
    )

    f1 = f1_score(
        all_true,
        all_pred,
        zero_division=0
    )

    cm = confusion_matrix(
        all_true,
        all_pred
    )

    print("\n" + "-" * 80)
    print(
        f"ROUND {round_number} - "
        "OVERALL VALIDATION PERFORMANCE"
    )
    print("-" * 80)

    print(
        f"Total validation images : "
        f"{len(all_true)}"
    )

    print(
        f"Accuracy                : "
        f"{accuracy * 100:.2f}%"
    )

    print(
        f"Precision               : "
        f"{precision * 100:.2f}%"
    )

    print(
        f"Recall                  : "
        f"{recall * 100:.2f}%"
    )

    print(
        f"F1-score                : "
        f"{f1 * 100:.2f}%"
    )

    print("\nOverall Validation Confusion Matrix:")

    print(cm)

    return {
        "round": round_number,
        "accuracy": accuracy * 100,
        "precision": precision * 100,
        "recall": recall * 100,
        "f1": f1 * 100
    }


# ============================================================
# MAIN
# ============================================================

print("\n")

print("=" * 80)
print("FEDERATED GLOBAL MODEL - VALIDATION EVALUATION")
print("=" * 80)

print(f"Device       : {DEVICE}")
print(f"Total rounds : {NUM_ROUNDS}")
print("Split        : 80% Train / 20% Validation")
print(f"Random seed  : {RANDOM_SEED}")
print("Data         : Original client train folders")
print("Preprocessing: Dynamic val_transform")


results = []

for round_number in range(
    1,
    NUM_ROUNDS + 1
):

    result = evaluate_round(
        round_number
    )

    if result is not None:
        results.append(result)


# ============================================================
# VALIDATION COMPARISON TABLE
# ============================================================

print("\n\n")

print("=" * 80)
print("GLOBAL VALIDATION PERFORMANCE BY ROUND")
print("=" * 80)

print(
    f"{'Round':<10}"
    f"{'Accuracy':<15}"
    f"{'Precision':<15}"
    f"{'Recall':<15}"
    f"{'F1-score':<15}"
)

print("-" * 70)

for result in results:

    print(
        f"{result['round']:<10}"
        f"{result['accuracy']:<15.2f}"
        f"{result['precision']:<15.2f}"
        f"{result['recall']:<15.2f}"
        f"{result['f1']:<15.2f}"
    )


# ============================================================
# BEST VALIDATION ROUND
# ============================================================

if results:

    best = max(
        results,
        key=lambda x: x["accuracy"]
    )

    print("\n" + "=" * 80)
    print("BEST GLOBAL MODEL ON VALIDATION DATA")
    print("=" * 80)

    print(
        f"Best Round : Round {best['round']}"
    )

    print(
        f"Accuracy   : {best['accuracy']:.2f}%"
    )

    print(
        f"Precision  : {best['precision']:.2f}%"
    )

    print(
        f"Recall     : {best['recall']:.2f}%"
    )

    print(
        f"F1-score   : {best['f1']:.2f}%"
    )

print("\n" + "=" * 80)
print("VALIDATION EVALUATION COMPLETE")
print("=" * 80)