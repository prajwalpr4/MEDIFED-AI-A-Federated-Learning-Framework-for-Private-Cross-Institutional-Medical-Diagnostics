import os
import torch


# ============================================================
# PROJECT ROOT
# ============================================================

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)


# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


# ============================================================
# MODEL
# ============================================================

NUM_CLASSES = 2

MODEL_NAME = "ResNet-50"


# ============================================================
# LOCAL TRAINING
# ============================================================

LOCAL_EPOCHS = 3

BATCH_SIZE = 16

LEARNING_RATE = 0.00005

WEIGHT_DECAY = 1e-4


# ============================================================
# FEDPROX
# ============================================================

FEDPROX_ENABLED = True

FEDPROX_MU = 0.01


# ============================================================
# TLS
# ============================================================

TLS_ENABLED = True


# ============================================================
# SECURE AGGREGATION
# ============================================================

SECURE_AGGREGATION_ENABLED = False


# ============================================================
# FEDERATED CONFIGURATION
# ============================================================

NUM_ROUNDS = 3

ROUNDS = NUM_ROUNDS

NUM_CLIENTS = 3

MIN_FIT_CLIENTS = 3

MIN_EVALUATE_CLIENTS = 0

MIN_AVAILABLE_CLIENTS = 3

MIN_CLIENTS = MIN_AVAILABLE_CLIENTS


# ============================================================
# SERVER
# ============================================================

SERVER_ADDRESS = "localhost:8080"


# ============================================================
# DATASETS
# ============================================================

DATASET_PATHS = {

    1: os.path.join(
        PROJECT_ROOT,
        "datasets",
        "client1_kaggle"
    ),

    2: os.path.join(
        PROJECT_ROOT,
        "datasets",
        "client2_chittagong"
    ),

    3: os.path.join(
        PROJECT_ROOT,
        "datasets",
        "client3_bhopal"
    ),
}


# ============================================================
# DATASET FOLDERS
# ============================================================

TRAIN_FOLDER_NAME = "train"

VALIDATION_FOLDER_NAME = "val"

TEST_FOLDER_NAME = "test"


# ============================================================
# CHECKPOINT DIRECTORIES
# ============================================================

CENTRALIZED_CHECKPOINT_DIR = os.path.join(
    PROJECT_ROOT,
    "models",
    "checkpoints",
    "centralized"
)

FEDERATED_CHECKPOINT_DIR = os.path.join(
    PROJECT_ROOT,
    "models",
    "checkpoints",
    "federated"
)

CHECKPOINT_DIR = os.path.join(
    PROJECT_ROOT,
    "models",
    "checkpoints"
)


os.makedirs(
    CENTRALIZED_CHECKPOINT_DIR,
    exist_ok=True
)

os.makedirs(
    FEDERATED_CHECKPOINT_DIR,
    exist_ok=True
)

os.makedirs(
    CHECKPOINT_DIR,
    exist_ok=True
)


# ============================================================
# MODEL PATHS
# ============================================================

CENTRALIZED_MODEL_PATH = os.path.join(
    CENTRALIZED_CHECKPOINT_DIR,
    "resnet50_pneumonia_best.pth"
)

FEDERATED_MODEL_PATH = os.path.join(
    FEDERATED_CHECKPOINT_DIR,
    "federated_global_model_best.pth"
)

GLOBAL_CHECKPOINT_PATH = FEDERATED_MODEL_PATH


# ============================================================
# TLS PATHS
# ============================================================

SECURITY_DIR = os.path.join(
    PROJECT_ROOT,
    "security",
    "certs"
)

CA_CERT_DIR = os.path.join(
    SECURITY_DIR,
    "ca"
)

SERVER_CERT_DIR = SECURITY_DIR

CLIENT_CERT_DIR = os.path.join(
    SECURITY_DIR,
    "client"
)


CA_CERT_PATH = os.path.join(
    CA_CERT_DIR,
    "ca.crt"
)

SERVER_CERT_PATH = os.path.join(
    SERVER_CERT_DIR,
    "server.crt"
)

SERVER_KEY_PATH = os.path.join(
    SERVER_CERT_DIR,
    "server.key"
)

CLIENT_CERT_PATH = os.path.join(
    CLIENT_CERT_DIR,
    "client.crt"
)

CLIENT_KEY_PATH = os.path.join(
    CLIENT_CERT_DIR,
    "client.key"
)


# ============================================================
# CREATE SECURITY DIRECTORIES
# ============================================================

os.makedirs(
    CA_CERT_DIR,
    exist_ok=True
)

os.makedirs(
    CLIENT_CERT_DIR,
    exist_ok=True
)


# ============================================================
# CONFIGURATION SUMMARY
# ============================================================

print()
print("=" * 75)
print("FEDERATED LEARNING CONFIGURATION")
print("=" * 75)

print("Project root:", PROJECT_ROOT)
print("Device:", DEVICE)
print("Model:", MODEL_NAME)
print("Classes:", NUM_CLASSES)

print()
print("Local epochs:", LOCAL_EPOCHS)
print("Batch size:", BATCH_SIZE)
print("Learning rate:", LEARNING_RATE)
print("Weight decay:", WEIGHT_DECAY)

print()
print("FedProx:", FEDPROX_ENABLED)
print("FedProx mu:", FEDPROX_MU)

print()
print("TLS:", TLS_ENABLED)

print()
print("Federated rounds:", NUM_ROUNDS)
print("Clients:", NUM_CLIENTS)

print()
print("Server:", SERVER_ADDRESS)

print("=" * 75)