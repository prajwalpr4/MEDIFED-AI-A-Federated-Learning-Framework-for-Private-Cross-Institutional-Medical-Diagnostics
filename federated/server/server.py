import os
import sys
from pathlib import Path

import torch
import flwr as fl

from flwr.common import (
    ndarrays_to_parameters,
    parameters_to_ndarrays
)


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


# ============================================================
# IMPORTS
# ============================================================

from models.resnet_model import create_resnet50

from federated.config import (
    NUM_CLASSES,
    NUM_ROUNDS,
    MIN_CLIENTS,
    FEDERATED_CHECKPOINT_DIR
)


# ============================================================
# SERVER
# ============================================================

SERVER_ADDRESS = "0.0.0.0:8080"


print()
print("=" * 75)
print("FEDERATED LEARNING SERVER")
print("=" * 75)


# ============================================================
# INITIAL GLOBAL MODEL
# ============================================================

print(
    "Creating pretrained global ResNet-50..."
)


global_model = create_resnet50(
    num_classes=NUM_CLASSES,
    pretrained=True
)


print(
    "Global model created."
)


# ============================================================
# INITIAL PARAMETERS
# ============================================================

initial_parameters = (
    ndarrays_to_parameters(

        [
            value.detach()
            .cpu()
            .numpy()

            for value
            in global_model.state_dict().values()
        ]
    )
)


# ============================================================
# FEDAVG STRATEGY
# ============================================================

class CheckpointFedAvg(
    fl.server.strategy.FedAvg
):

    def aggregate_fit(
        self,
        server_round,
        results,
        failures
    ):

        print()
        print("=" * 75)
        print(
            f"FEDERATED ROUND {server_round}"
        )
        print("=" * 75)

        print(
            "Client results:",
            len(results)
        )

        print(
            "Client failures:",
            len(failures)
        )


        # ----------------------------------------------------
        # Standard FedAvg
        # ----------------------------------------------------

        aggregated_parameters, metrics = (
            super().aggregate_fit(
                server_round,
                results,
                failures
            )
        )


        if aggregated_parameters is None:

            print(
                "Aggregation failed."
            )

            return (
                aggregated_parameters,
                metrics
            )


        # ----------------------------------------------------
        # Convert parameters
        # ----------------------------------------------------

        ndarrays = (
            parameters_to_ndarrays(
                aggregated_parameters
            )
        )


        # ----------------------------------------------------
        # Update global model
        # ----------------------------------------------------

        current_state = (
            global_model.state_dict()
        )


        updated_state = {}


        for (
            (key, old_value),
            new_value
        ) in zip(
            current_state.items(),
            ndarrays
        ):

            updated_state[key] = (
                torch.tensor(
                    new_value,
                    dtype=old_value.dtype
                )
            )


        global_model.load_state_dict(
            updated_state,
            strict=True
        )


        # ----------------------------------------------------
        # Save checkpoint
        # ----------------------------------------------------

        checkpoint_path = os.path.join(
            FEDERATED_CHECKPOINT_DIR,
            f"global_round_{server_round:02d}.pth"
        )


        torch.save(
            global_model.state_dict(),
            checkpoint_path
        )


        print()
        print(
            "GLOBAL MODEL SAVED"
        )

        print(
            "Round:",
            server_round
        )

        print(
            "Checkpoint:",
            checkpoint_path
        )


        return (
            aggregated_parameters,
            metrics
        )


# ============================================================
# STRATEGY
# ============================================================

strategy = CheckpointFedAvg(

    fraction_fit=1.0,

    fraction_evaluate=0.0,

    min_fit_clients=MIN_CLIENTS,

    min_evaluate_clients=0,

    min_available_clients=MIN_CLIENTS,

    initial_parameters=initial_parameters
)


# ============================================================
# TLS
# ============================================================

CERT_DIR = (
    Path(PROJECT_ROOT)
    / "security"
    / "certs"
)


CA_CERT = (
    CERT_DIR
    / "ca"
    / "ca.crt"
)


SERVER_CERT = (
    CERT_DIR
    / "server.crt"
)


SERVER_KEY = (
    CERT_DIR
    / "server.key"
)


with open(
    CA_CERT,
    "rb"
) as f:

    ca_certificate = f.read()


with open(
    SERVER_CERT,
    "rb"
) as f:

    server_certificate = f.read()


with open(
    SERVER_KEY,
    "rb"
) as f:

    server_private_key = f.read()


TLS_CERTIFICATES = (

    ca_certificate,

    server_certificate,

    server_private_key
)


# ============================================================
# START
# ============================================================

print()
print("=" * 75)
print("STARTING FEDERATED SERVER")
print("=" * 75)

print(
    "Address:",
    SERVER_ADDRESS
)

print(
    "Rounds:",
    NUM_ROUNDS
)

print(
    "Required clients:",
    MIN_CLIENTS
)

print()
print(
    "Waiting for 3 clients..."
)


fl.server.start_server(

    server_address=
        SERVER_ADDRESS,

    config=
        fl.server.ServerConfig(
            num_rounds=NUM_ROUNDS
        ),

    strategy=
        strategy,

    certificates=
        TLS_CERTIFICATES
)