import os
import sys
import torch
import numpy as np
import matplotlib.pyplot as plt
from torch.utils.data import DataLoader
from torchvision.models import resnet50
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

# ============================================================
# PROJECT ROOT SETUP
# ============================================================
PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)
sys.path.insert(0, PROJECT_ROOT)

from preprocessing.dataset import ChestXrayDataset
from preprocessing.transforms import val_transform
from federated.config import DATASET_PATHS, DEVICE, NUM_CLASSES, BATCH_SIZE

OUTPUT_DIR = os.path.join(PROJECT_ROOT, "results", "visualizations")
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# LOAD MODEL FROM CHECKPOINT
# ============================================================
def load_model(checkpoint_path):
    """
    Loads ResNet-50 architecture and maps saved checkpoint weights.
    """
    model = resnet50(weights=None)
    model.fc = torch.nn.Linear(model.fc.in_features, NUM_CLASSES)

    checkpoint = torch.load(checkpoint_path, map_location=DEVICE)
    if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
        state_dict = checkpoint["state_dict"]
    else:
        state_dict = checkpoint

    # Clean any module prefixes if present
    cleaned_dict = {}
    for k, v in state_dict.items():
        if k.startswith("module."):
            cleaned_dict[k.replace("module.", "", 1)] = v
        else:
            cleaned_dict[k] = v

    model.load_state_dict(cleaned_dict)
    model = model.to(DEVICE)
    model.eval()
    return model


# ============================================================
# PLOT CONFUSION MATRIX
# ============================================================
def plot_matrix(cm, class_names, title, output_filename):
    """
    Renders and saves a publication-quality confusion matrix.
    """
    fig, ax = plt.subplots(figsize=(6, 5), dpi=300)
    cax = ax.imshow(cm, interpolation="nearest", cmap="viridis")

    cbar = fig.colorbar(cax, fraction=0.046, pad=0.04)
    cbar.set_label("Number of test images", fontsize=10, labelpad=10)

    tick_marks = np.arange(len(class_names))
    ax.set_xticks(tick_marks)
    ax.set_xticklabels(class_names, fontsize=10, fontweight="bold")
    ax.set_yticks(tick_marks)
    ax.set_yticklabels(class_names, fontsize=10, fontweight="bold")

    ax.set_title(title, fontsize=12, pad=12, fontweight="bold")
    ax.set_ylabel("Actual Label", fontsize=10, labelpad=8)
    ax.set_xlabel("Predicted Label", fontsize=10, labelpad=8)

    # Annotate counts inside matrix cells
    threshold = cm.max() / 2.0 if cm.max() > 0 else 1
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            val = cm[i, j]
            text_color = "white" if val < threshold else "black"
            ax.text(
                j, i, f"{val}",
                ha="center", va="center",
                color=text_color,
                fontsize=13,
                fontweight="bold"
            )

    plt.tight_layout()
    save_path = os.path.join(OUTPUT_DIR, output_filename)
    plt.savefig(save_path, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"Saved figure: {save_path}")
    return save_path


# ============================================================
# LIVE EVALUATION & MATRIX GENERATION
# ============================================================
def run_live_evaluation(round_number=3):
    checkpoint_path = os.path.join(
        PROJECT_ROOT,
        "models",
        "checkpoints",
        "federated",
        f"global_round_{round_number:02d}.pth"
    )

    print("=" * 75)
    print(f"DYNAMIC CONFUSION MATRIX GENERATION (ROUND {round_number})")
    print("=" * 75)
    print(f"Device: {DEVICE}")
    print(f"Checkpoint: {checkpoint_path}")

    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Model checkpoint not found: {checkpoint_path}")

    model = load_model(checkpoint_path)
    print("Global model loaded successfully into memory.\n")

    class_names = ["NORMAL", "PNEUMONIA"]
    all_true = []
    all_pred = []
    client_results = {}

    # Run inference across each client's real test dataset
    for client_id, dataset_root in DATASET_PATHS.items():
        client_name = {1: "Kaggle", 2: "Chittagong", 3: "Bhopal"}.get(client_id, f"Client {client_id}")
        test_path = os.path.join(dataset_root, "test")

        print(f"--- Running Inference on Client {client_id} ({client_name}) ---")
        print(f"Test directory: {test_path}")

        if not os.path.exists(test_path):
            print(f"Warning: Directory {test_path} does not exist. Skipping.")
            continue

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

        y_true_client = []
        y_pred_client = []

        with torch.no_grad():
            for images, labels in test_loader:
                images = images.to(DEVICE)
                outputs = model(images)
                preds = torch.argmax(outputs, dim=1)

                y_true_client.extend(labels.cpu().numpy())
                y_pred_client.extend(preds.cpu().numpy())

        y_true_client = np.array(y_true_client)
        y_pred_client = np.array(y_pred_client)

        cm_client = confusion_matrix(y_true_client, y_pred_client, labels=[0, 1])
        acc = accuracy_score(y_true_client, y_pred_client)
        prec = precision_score(y_true_client, y_pred_client, zero_division=0)
        rec = recall_score(y_true_client, y_pred_client, zero_division=0)
        f1 = f1_score(y_true_client, y_pred_client, zero_division=0)

        print(f"Images evaluated : {len(y_true_client)}")
        print(f"Accuracy         : {acc * 100:.2f}%")
        print(f"Precision        : {prec * 100:.2f}%")
        print(f"Recall           : {rec * 100:.2f}%")
        print(f"F1-Score         : {f1 * 100:.2f}%")
        print("Confusion Matrix :")
        print(cm_client)
        print()

        # Plot individual client confusion matrix
        plot_matrix(
            cm_client,
            class_names,
            title=f"Client {client_id} ({client_name}) - Round {round_number}",
            output_filename=f"live_confusion_matrix_client{client_id}.png"
        )

        all_true.extend(y_true_client)
        all_pred.extend(y_pred_client)
        client_results[client_id] = {
            "cm": cm_client,
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1": f1
        }

    # Cumulative pooled confusion matrix
    all_true = np.array(all_true)
    all_pred = np.array(all_pred)
    cm_pooled = confusion_matrix(all_true, all_pred, labels=[0, 1])

    pooled_acc = accuracy_score(all_true, all_pred)
    pooled_prec = precision_score(all_true, all_pred, zero_division=0)
    pooled_rec = recall_score(all_true, all_pred, zero_division=0)
    pooled_f1 = f1_score(all_true, all_pred, zero_division=0)

    print("=" * 75)
    print(f"POOLED EVALUATION RESULTS (ALL {len(all_true)} TEST IMAGES)")
    print("=" * 75)
    print(f"Pooled Accuracy  : {pooled_acc * 100:.2f}%")
    print(f"Pooled Precision : {pooled_prec * 100:.2f}%")
    print(f"Pooled Recall    : {pooled_rec * 100:.2f}%")
    print(f"Pooled F1-Score  : {pooled_f1 * 100:.2f}%")
    print("\nPooled Confusion Matrix (C):")
    print(cm_pooled)
    print(f"TN: {cm_pooled[0,0]}, FP: {cm_pooled[0,1]}")
    print(f"FN: {cm_pooled[1,0]}, TP: {cm_pooled[1,1]}")

    # Plot pooled confusion matrix
    plot_matrix(
        cm_pooled,
        class_names,
        title=f"Pooled Confusion Matrix - Round {round_number}",
        output_filename=f"live_pooled_confusion_matrix_round{round_number}.png"
    )

    # Save to the standard name used by the paper as well
    plot_matrix(
        cm_pooled,
        class_names,
        title=f"Pooled Confusion Matrix - Round {round_number}",
        output_filename="fig7_confusion_matrix.png"
    )

    print("\nDynamic confusion matrix generation completed successfully!")
    return cm_pooled, client_results


if __name__ == "__main__":
    # Execute live inference for the final federated round (Round 3)
    run_live_evaluation(round_number=3)
