import os
import sys

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)
sys.path.insert(0, PROJECT_ROOT)

import torch
from torch.utils.data import DataLoader
from torchvision.models import resnet50

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

from preprocessing.dataset import ChestXrayDataset
from preprocessing.transforms import val_transform


# ============================================================
# CONFIGURATION
# ============================================================

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

NUM_CLASSES = 2
BATCH_SIZE = 16
NUM_ROUNDS = 3

DATASET_PATHS = {
    1: "datasets/client1_kaggle",
    2: "datasets/client2_chittagong",
    3: "datasets/client3_bhopal",
}


# ============================================================
# LOAD GLOBAL MODEL
# ============================================================

def load_global_model(checkpoint_path):

    model = resnet50(weights=None)

    # NORMAL = 0
    # PNEUMONIA = 1
    model.fc = torch.nn.Linear(
        model.fc.in_features,
        NUM_CLASSES
    )

    checkpoint = torch.load(
        checkpoint_path,
        map_location=DEVICE
    )

    # Support checkpoint containing state_dict
    if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
        state_dict = checkpoint["state_dict"]
    else:
        state_dict = checkpoint

    model.load_state_dict(state_dict)

    model = model.to(DEVICE)
    model.eval()

    return model


# ============================================================
# EVALUATE ONE ROUND
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
        print("Checkpoint not found. Skipping this round.")
        return None

    # Load model
    model = load_global_model(checkpoint_path)

    print("Model loaded successfully.")

    all_true = []
    all_pred = []

    # ========================================================
    # EVALUATE EACH CLIENT'S ORIGINAL TEST DATA
    # ========================================================

    for client_id, dataset_root in DATASET_PATHS.items():

        test_path = os.path.join(
            dataset_root,
            "test"
        )

        print(f"\nClient {client_id}")
        print(f"Test path: {test_path}")

        if not os.path.exists(test_path):
            print("Test folder not found. Skipping client.")
            continue

        # IMPORTANT:
        # Original test images are used.
        # Preprocessing is applied dynamically.
        test_dataset = ChestXrayDataset(
            root_dir=test_path,
            transform=val_transform
        )

        test_loader = DataLoader(
            test_dataset,
            batch_size=BATCH_SIZE,
            shuffle=False,
            num_workers=0
        )

        print(f"Test images: {len(test_dataset)}")

        y_true = []
        y_pred = []

        with torch.no_grad():

            for images, labels in test_loader:

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

        # Add client results to overall results
        all_true.extend(y_true)
        all_pred.extend(y_pred)

        # Client metrics
        client_accuracy = accuracy_score(
            y_true,
            y_pred
        )

        client_precision = precision_score(
            y_true,
            y_pred,
            zero_division=0
        )

        client_recall = recall_score(
            y_true,
            y_pred,
            zero_division=0
        )

        client_f1 = f1_score(
            y_true,
            y_pred,
            zero_division=0
        )

        print(
            f"Accuracy  : {client_accuracy * 100:.2f}%"
        )
        print(
            f"Precision : {client_precision * 100:.2f}%"
        )
        print(
            f"Recall    : {client_recall * 100:.2f}%"
        )
        print(
            f"F1-score  : {client_f1 * 100:.2f}%"
        )

        print("Confusion Matrix:")
        print(
            confusion_matrix(
                y_true,
                y_pred
            )
        )

    # ========================================================
    # OVERALL GLOBAL MODEL PERFORMANCE
    # ========================================================

    if len(all_true) == 0:
        print("No test data available.")
        return None

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
    print(f"ROUND {round_number} - OVERALL PERFORMANCE")
    print("-" * 80)

    print(
        f"Total test images : {len(all_true)}"
    )
    print(
        f"Accuracy          : {accuracy * 100:.2f}%"
    )
    print(
        f"Precision         : {precision * 100:.2f}%"
    )
    print(
        f"Recall            : {recall * 100:.2f}%"
    )
    print(
        f"F1-score          : {f1 * 100:.2f}%"
    )

    print("\nOverall Confusion Matrix:")
    print(cm)

    return {
        "round": round_number,
        "accuracy": accuracy * 100,
        "precision": precision * 100,
        "recall": recall * 100,
        "f1": f1 * 100
    }


# ============================================================
# EVALUATE ALL 3 ROUNDS
# ============================================================

print("\n")
print("=" * 80)
print("FEDERATED GLOBAL MODEL EVALUATION")
print("=" * 80)

print(f"Device       : {DEVICE}")
print(f"Total rounds : {NUM_ROUNDS}")
print("Test data    : Original client test datasets")
print("Preprocessing: Dynamic val_transform")

results = []

for round_number in range(1, NUM_ROUNDS + 1):

    result = evaluate_round(round_number)

    if result is not None:
        results.append(result)


# ============================================================
# FINAL COMPARISON
# ============================================================

print("\n\n")
print("=" * 80)
print("COMPARISON OF GLOBAL MODEL CHECKPOINTS")
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
# BEST ROUND
# ============================================================

if results:

    best_accuracy = max(
        results,
        key=lambda x: x["accuracy"]
    )

    print("\n" + "=" * 80)
    print("BEST GLOBAL MODEL")
    print("=" * 80)

    print(
        f"Best Round   : Round {best_accuracy['round']}"
    )

    print(
        f"Accuracy     : "
        f"{best_accuracy['accuracy']:.2f}%"
    )

    print(
        f"Precision    : "
        f"{best_accuracy['precision']:.2f}%"
    )

    print(
        f"Recall       : "
        f"{best_accuracy['recall']:.2f}%"
    )

    print(
        f"F1-score     : "
        f"{best_accuracy['f1']:.2f}%"
    )

print("\n" + "=" * 80)
print("EVALUATION COMPLETE")
print("=" * 80)