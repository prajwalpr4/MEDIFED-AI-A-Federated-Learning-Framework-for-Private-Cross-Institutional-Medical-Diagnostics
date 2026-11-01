import os
import sys
import torch
import torch.nn.functional as F
import numpy as np
import matplotlib.pyplot as plt
from sklearn.manifold import TSNE
from sklearn.decomposition import PCA
from torch.utils.data import DataLoader, Subset

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from models.resnet_model import create_resnet50
from preprocessing.dataset import ChestXrayDataset
from preprocessing.transforms import val_transform
from federated.config import DATASET_PATHS, DEVICE

OUTPUT_DIR = os.path.join(PROJECT_ROOT, "results", "visualizations")
os.makedirs(OUTPUT_DIR, exist_ok=True)

MODEL_PATH = os.path.join(
    PROJECT_ROOT,
    "models",
    "checkpoints",
    "federated",
    "global_round_03.pth"
)


def extract_latent_features(max_samples_per_client=100):
    """
    Extract 2048-dimensional latent representations from the penultimate
    layer of the federated ResNet-50 model across test sets.
    """
    print("=" * 70)
    print("EXTRACTING RESNET-50 LATENT FEATURES (2048-D)")
    print("=" * 70)
    print(f"Device: {DEVICE}")
    print(f"Loading checkpoint: {MODEL_PATH}")

    # Load Model
    model = create_resnet50(num_classes=2, pretrained=False)
    checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
    if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
        state_dict = checkpoint["state_dict"]
    else:
        state_dict = checkpoint
    model.load_state_dict(state_dict)
    model = model.to(DEVICE)
    model.eval()

    all_features = []
    all_labels = []
    all_clients = []

    for client_id, client_path in DATASET_PATHS.items():
        test_dir = os.path.join(client_path, "test")
        if not os.path.exists(test_dir):
            continue

        dataset = ChestXrayDataset(root_dir=test_dir, transform=val_transform)
        total_len = len(dataset)

        # Sample for fast, balanced visualization
        if total_len > max_samples_per_client:
            indices = np.random.RandomState(42).choice(
                total_len, max_samples_per_client, replace=False
            )
            dataset = Subset(dataset, indices)

        loader = DataLoader(dataset, batch_size=16, shuffle=False)

        print(f"Client {client_id}: Extracting features for {len(dataset)} samples...")

        # Feature hook on layer4
        features_batch = []

        def hook_fn(module, input, output):
            features_batch.append(output)

        hook = model.layer4.register_forward_hook(hook_fn)

        with torch.no_grad():
            for images, labels in loader:
                images = images.to(DEVICE)
                features_batch.clear()
                _ = model(images)

                # Global average pool: (B, 2048, 7, 7) -> (B, 2048)
                f_map = features_batch[0]
                pooled = F.adaptive_avg_pool2d(f_map, (1, 1)).flatten(start_dim=1)

                all_features.append(pooled.cpu().numpy())
                all_labels.extend(labels.numpy())
                all_clients.extend([client_id] * len(labels))

        hook.remove()

    vectors_2048d = np.vstack(all_features)
    labels = np.array(all_labels)
    clients = np.array(all_clients)

    print(f"\nTotal extracted feature vectors: {vectors_2048d.shape}")
    return vectors_2048d, labels, clients


def plot_tsne(vectors_2048d, labels):
    """
    Computes and plots 2D t-SNE of ResNet-50 latent space.
    """
    print("\nComputing t-SNE projection...")
    tsne = TSNE(n_components=2, perplexity=30, random_state=42, max_iter=1000)
    embeddings_2d = tsne.fit_transform(vectors_2048d)

    plt.figure(figsize=(8, 6), dpi=300)

    # Class 0: NORMAL (Blue), Class 1: PNEUMONIA (Red)
    scatter = plt.scatter(
        embeddings_2d[:, 0],
        embeddings_2d[:, 1],
        c=labels,
        cmap="coolwarm",
        alpha=0.75,
        edgecolors="none",
        s=40
    )

    cbar = plt.colorbar(scatter, ticks=[0, 1])
    cbar.ax.set_yticklabels(["0: NORMAL", "1: PNEUMONIA"], fontsize=10)
    cbar.set_label("Diagnostic Class", fontsize=10, labelpad=8)

    plt.title("ResNet-50 Latent Feature Representation (t-SNE)", fontsize=12, fontweight="bold", pad=12)
    plt.xlabel("t-SNE Dimension 1", fontsize=10)
    plt.ylabel("t-SNE Dimension 2", fontsize=10)
    plt.grid(True, linestyle="--", alpha=0.3)

    plt.tight_layout()
    out_path = os.path.join(OUTPUT_DIR, "resnet50_latent_tsne.png")
    plt.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"Saved: {out_path}")


def plot_pca(vectors_2048d, labels):
    """
    Computes and plots 2D PCA of ResNet-50 latent space.
    """
    print("\nComputing PCA projection...")
    pca = PCA(n_components=2, random_state=42)
    embeddings_2d = pca.fit_transform(vectors_2048d)

    plt.figure(figsize=(8, 6), dpi=300)

    scatter = plt.scatter(
        embeddings_2d[:, 0],
        embeddings_2d[:, 1],
        c=labels,
        cmap="coolwarm",
        alpha=0.75,
        edgecolors="none",
        s=40
    )

    cbar = plt.colorbar(scatter, ticks=[0, 1])
    cbar.ax.set_yticklabels(["0: NORMAL", "1: PNEUMONIA"], fontsize=10)
    cbar.set_label("Diagnostic Class", fontsize=10, labelpad=8)

    exp_var = pca.explained_variance_ratio_ * 100
    plt.title("ResNet-50 Latent Feature Representation (PCA)", fontsize=12, fontweight="bold", pad=12)
    plt.xlabel(f"PC 1 ({exp_var[0]:.1f}% variance)", fontsize=10)
    plt.ylabel(f"PC 2 ({exp_var[1]:.1f}% variance)", fontsize=10)
    plt.grid(True, linestyle="--", alpha=0.3)

    plt.tight_layout()
    out_path = os.path.join(OUTPUT_DIR, "resnet50_latent_pca.png")
    plt.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"Saved: {out_path}")


if __name__ == "__main__":
    if not os.path.exists(MODEL_PATH):
        print(f"Checkpoint not found at: {MODEL_PATH}")
        sys.exit(1)

    vectors, labels, clients = extract_latent_features(max_samples_per_client=80)
    plot_tsne(vectors, labels)
    plot_pca(vectors, labels)
    print("\nLatent feature projections completed successfully!")
