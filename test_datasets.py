import os

from federated.config import DATASET_PATHS


print("=" * 70)
print("CLIENT TRAIN / TEST DISTRIBUTION")
print("=" * 70)


for client_id in [1, 2, 3]:

    print()
    print(f"CLIENT {client_id}")
    print("=" * 50)

    for split in ["train", "test"]:

        split_path = os.path.join(
            DATASET_PATHS[client_id],
            split
        )

        normal_path = os.path.join(
            split_path,
            "NORMAL"
        )

        pneumonia_path = os.path.join(
            split_path,
            "PNEUMONIA"
        )

        normal_count = len([
            f for f in os.listdir(normal_path)
            if f.lower().endswith(
                (".jpg", ".jpeg", ".png", ".bmp")
            )
        ])

        pneumonia_count = len([
            f for f in os.listdir(pneumonia_path)
            if f.lower().endswith(
                (".jpg", ".jpeg", ".png", ".bmp")
            )
        ])

        total = normal_count + pneumonia_count

        print()
        print(split.upper())

        print("  NORMAL:", normal_count)

        print("  PNEUMONIA:", pneumonia_count)

        print("  TOTAL:", total)