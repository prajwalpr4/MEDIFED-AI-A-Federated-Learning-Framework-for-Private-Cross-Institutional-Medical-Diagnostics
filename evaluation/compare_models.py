import os
import matplotlib.pyplot as plt
import numpy as np

# Create output directory
OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "results",
    "visualizations"
)
os.makedirs(OUTPUT_DIR, exist_ok=True)


def plot_global_rounds_performance():
    """
    Plots Figure 4 from the paper:
    Accuracy, precision, recall, and F1-score of the global model across three federated rounds.
    """
    # Rounds and Metric Names
    rounds = ["Round 1", "Round 2", "Round 3"]
    metrics = ["Accuracy", "Precision", "Recall", "F1-score"]

    # Exact metrics from Table VI & Fig 4
    # Round 1: 80.59%, 81.25%, 85.81%, 83.47%
    # Round 2: 80.03%, 83.12%, 81.60%, 82.35%
    # Round 3: 81.40%, 86.25%, 80.20%, 83.11%
    data = np.array([
        [80.59, 81.25, 85.81, 83.47],  # Round 1
        [80.03, 83.12, 81.60, 82.35],  # Round 2
        [81.40, 86.25, 80.20, 83.11]   # Round 3
    ])

    colors = ["#4285F4", "#FBBC05", "#34A853", "#EA4335"]  # Blue, Orange/Yellow, Green, Red

    x = np.arange(len(rounds))
    bar_width = 0.18

    fig, ax = plt.subplots(figsize=(9, 6), dpi=300)

    # Plot bars for each metric
    for i, (metric, color) in enumerate(zip(metrics, colors)):
        offsets = x + (i - 1.5) * bar_width
        bars = ax.bar(
            offsets,
            data[:, i],
            width=bar_width,
            label=metric,
            color=color,
            edgecolor="none"
        )

        # Add text labels on top of bars
        for bar in bars:
            height = bar.get_height()
            ax.annotate(
                f"{height:.2f}",
                xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 3),  # 3 points vertical offset
                textcoords="offset points",
                ha="center", va="bottom",
                fontsize=7.5,
                fontweight="bold"
            )

    ax.set_title("Global Model Performance Across Federated Rounds", fontsize=13, pad=14, fontweight="bold")
    ax.set_ylabel("Score (%)", fontsize=11, labelpad=8)
    ax.set_xticks(x)
    ax.set_xticklabels(rounds, fontsize=10, fontweight="bold")
    ax.set_ylim(0, 105)
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    ax.legend(loc="upper right", framealpha=0.9, fontsize=9)

    plt.tight_layout()
    output_path = os.path.join(OUTPUT_DIR, "fig4_performance_rounds.png")
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_path}")
    return output_path


def plot_client_wise_performance():
    """
    Plots Client-Wise Performance in Round 3 (Table VII from the paper):
    Client 1 (Kaggle), Client 2 (Chittagong), Client 3 (Bhopal)
    """
    clients = ["Client 1 (Kaggle)", "Client 2 (Chittagong)", "Client 3 (Bhopal)"]
    metrics = ["Accuracy", "Precision", "Recall", "F1-score"]

    # Exact metrics from Table VII
    # Client 1: 85.42%, 81.21%, 99.74%, 89.53%
    # Client 2: 45.45%, 100.00%, 9.09%, 16.67%
    # Client 3: 84.21%, 99.44%, 68.75%, 81.29%
    data = np.array([
        [85.42, 81.21, 99.74, 89.53],
        [45.45, 100.00, 9.09, 16.67],
        [84.21, 99.44, 68.75, 81.29]
    ])

    colors = ["#4285F4", "#FBBC05", "#34A853", "#EA4335"]

    x = np.arange(len(clients))
    bar_width = 0.18

    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)

    for i, (metric, color) in enumerate(zip(metrics, colors)):
        offsets = x + (i - 1.5) * bar_width
        bars = ax.bar(
            offsets,
            data[:, i],
            width=bar_width,
            label=metric,
            color=color,
            edgecolor="none"
        )

        for bar in bars:
            height = bar.get_height()
            ax.annotate(
                f"{height:.1f}%",
                xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 3),
                textcoords="offset points",
                ha="center", va="bottom",
                fontsize=7.5,
                fontweight="bold"
            )

    ax.set_title("Client-Wise Performance in Round 3 (Table VII)", fontsize=13, pad=14, fontweight="bold")
    ax.set_ylabel("Score (%)", fontsize=11, labelpad=8)
    ax.set_xticks(x)
    ax.set_xticklabels(clients, fontsize=10, fontweight="bold")
    ax.set_ylim(0, 115)
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    ax.legend(loc="upper right", framealpha=0.9, fontsize=9)

    plt.tight_layout()
    output_path = os.path.join(OUTPUT_DIR, "client_performance_round3.png")
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_path}")
    return output_path


def plot_validation_vs_test():
    """
    Plots comparison between validation performance (Fig 5) and test performance (Fig 6)
    across rounds.
    """
    rounds = ["Round 1", "Round 2", "Round 3"]

    # Accuracy trajectory
    val_acc = [84.77, 87.89, 90.04]   # From Fig 5
    test_acc = [80.59, 80.03, 81.40]  # From Fig 6

    # F1 trajectory
    val_f1 = [85.20, 87.62, 89.57]
    test_f1 = [83.47, 82.35, 83.11]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5), dpi=300)

    # Accuracy Plot
    ax1.plot(rounds, val_acc, marker="o", color="#2ecc71", linewidth=2.5, label="Validation Accuracy")
    ax1.plot(rounds, test_acc, marker="s", color="#3498db", linewidth=2.5, linestyle="--", label="Test Accuracy")
    for r, v in zip(rounds, val_acc):
        ax1.annotate(f"{v:.1f}%", (r, v), textcoords="offset points", xytext=(0, 6), ha="center", fontweight="bold")
    for r, v in zip(rounds, test_acc):
        ax1.annotate(f"{v:.1f}%", (r, v), textcoords="offset points", xytext=(0, -12), ha="center", fontweight="bold")
    ax1.set_title("Global Accuracy Trajectory", fontsize=11, fontweight="bold")
    ax1.set_ylabel("Accuracy (%)", fontsize=10)
    ax1.set_ylim(75, 95)
    ax1.grid(True, linestyle="--", alpha=0.5)
    ax1.legend(loc="lower right")

    # F1-Score Plot
    ax2.plot(rounds, val_f1, marker="o", color="#e67e22", linewidth=2.5, label="Validation F1")
    ax2.plot(rounds, test_f1, marker="s", color="#e74c3c", linewidth=2.5, linestyle="--", label="Test F1")
    for r, v in zip(rounds, val_f1):
        ax2.annotate(f"{v:.1f}%", (r, v), textcoords="offset points", xytext=(0, 6), ha="center", fontweight="bold")
    for r, v in zip(rounds, test_f1):
        ax2.annotate(f"{v:.1f}%", (r, v), textcoords="offset points", xytext=(0, -12), ha="center", fontweight="bold")
    ax2.set_title("Global F1-Score Trajectory", fontsize=11, fontweight="bold")
    ax2.set_ylabel("F1-Score (%)", fontsize=10)
    ax2.set_ylim(75, 95)
    ax2.grid(True, linestyle="--", alpha=0.5)
    ax2.legend(loc="lower right")

    plt.tight_layout()
    output_path = os.path.join(OUTPUT_DIR, "validation_vs_test_trajectory.png")
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_path}")
    return output_path


if __name__ == "__main__":
    print("Generating Figure 4: Global Performance across Rounds...")
    plot_global_rounds_performance()

    print("\nGenerating Client-Wise Performance in Round 3...")
    plot_client_wise_performance()

    print("\nGenerating Validation vs Test Trajectory...")
    plot_validation_vs_test()

    print("\nAll performance graphs generated successfully!")
