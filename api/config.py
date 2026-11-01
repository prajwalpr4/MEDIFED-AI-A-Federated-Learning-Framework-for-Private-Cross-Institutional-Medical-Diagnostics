"""
MEDIFED AI — Configuration for FastAPI ML Microservice.

Resolves model checkpoint path, device, and API settings.
All paths are relative to the project root (parent of api/).
"""

import os
import torch
from pathlib import Path

# ============================================================
# PATH RESOLUTION
# ============================================================

# Project root is one level above api/
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Model checkpoint
MODEL_CHECKPOINT_PATH = PROJECT_ROOT / "models" / "checkpoints" / "federated" / "global_round_03.pth"

# Test datasets (for /metrics verification)
DATASETS_DIR = PROJECT_ROOT / "datasets"

# ============================================================
# DEVICE RESOLUTION
# ============================================================

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ============================================================
# MODEL CONFIGURATION
# ============================================================

NUM_CLASSES = 2

CLASS_NAMES = {
    0: "NORMAL",
    1: "PNEUMONIA"
}

# CLAHE parameters (must match training exactly)
CLAHE_CLIP_LIMIT = 2.0
CLAHE_TILE_GRID_SIZE = (8, 8)

# ImageNet normalization (must match training exactly)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# Input image size
INPUT_SIZE = (224, 224)

# ============================================================
# API CONFIGURATION
# ============================================================

API_HOST = os.environ.get("API_HOST", "0.0.0.0")
API_PORT = int(os.environ.get("API_PORT", "8000"))

# CORS origins (Next.js dev server)
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
]

# Maximum upload file size (10 MB)
MAX_UPLOAD_SIZE = 10 * 1024 * 1024

# Allowed image MIME types
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png"}

# ============================================================
# VERIFIED RESEARCH METRICS (from journal_paper.tex)
# ============================================================

VERIFIED_METRICS = {
    "model": "ResNet-50 (ImageNet pretrained)",
    "strategy": "FedProx (μ=0.01)",
    "optimizer": "AdamW",
    "total_rounds": 3,
    "test_set_size": 1247,
    "rounds": {
        "round_1": {
            "pooled": {
                "accuracy": 0.6032,
                "precision": 0.6219,
                "recall": 0.8301,
                "f1_score": 0.7113
            }
        },
        "round_2": {
            "pooled": {
                "accuracy": 0.7282,
                "precision": 0.7704,
                "recall": 0.7810,
                "f1_score": 0.7757
            }
        },
        "round_3": {
            "pooled": {
                "accuracy": 0.8140,
                "precision": 0.8625,
                "recall": 0.8020,
                "f1_score": 0.8311
            },
            "validation_accuracy": 0.9004,
            "confusion_matrix": {
                "TN": 444, "FP": 91,
                "FN": 141, "TP": 571
            },
            "specificity": 0.8300,
            "sensitivity": 0.8020
        }
    },
    "client_wise_round_3": {
        "client_1_kaggle": {
            "name": "Hospital A — Kaggle Pediatric Center",
            "dataset_size": 624,
            "accuracy": 0.8542,
            "precision": 0.8121,
            "recall": 0.9974,
            "f1_score": 0.8953
        },
        "client_2_chittagong": {
            "name": "Hospital B — Chittagong Medical Center",
            "dataset_size": 110,
            "accuracy": 0.4545,
            "precision": 1.0000,
            "recall": 0.0909,
            "f1_score": 0.1667
        },
        "client_3_bhopal": {
            "name": "Hospital C — Bhopal Memorial Research Centre",
            "dataset_size": 513,
            "accuracy": 0.8421,
            "precision": 0.9944,
            "recall": 0.6875,
            "f1_score": 0.8129
        }
    },
    "federation": {
        "num_clients": 3,
        "communication_rounds": 3,
        "local_epochs_per_round": 3,
        "strategy": "FedProx",
        "mu": 0.01,
        "optimizer": "AdamW",
        "learning_rate": 0.0001,
        "batch_size": 32,
        "security": "TLS 1.3 mutual authentication",
        "backbone": "ResNet-50 (ImageNet initialized)"
    }
}
