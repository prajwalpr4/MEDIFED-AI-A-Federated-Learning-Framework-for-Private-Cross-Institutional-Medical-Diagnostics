import os

from PIL import Image
from torch.utils.data import Dataset


class ChestXrayDataset(Dataset):

    def __init__(
        self,
        root_dir,
        transform=None
    ):
        self.root_dir = root_dir
        self.transform = transform

        self.samples = []

        # Class mapping
        self.class_to_idx = {
            "NORMAL": 0,
            "PNEUMONIA": 1
        }

        # ----------------------------------------------------
        # Read NORMAL and PNEUMONIA folders
        # ----------------------------------------------------

        for class_name, label in self.class_to_idx.items():

            class_dir = os.path.join(
                self.root_dir,
                class_name
            )

            if not os.path.isdir(class_dir):
                continue

            for filename in os.listdir(class_dir):

                file_path = os.path.join(
                    class_dir,
                    filename
                )

                # Accept common image formats
                if filename.lower().endswith(
                    (
                        ".jpg",
                        ".jpeg",
                        ".png",
                        ".bmp"
                    )
                ):
                    self.samples.append(
                        (
                            file_path,
                            label
                        )
                    )

        # ----------------------------------------------------
        # Make sure dataset is not empty
        # ----------------------------------------------------

        if len(self.samples) == 0:

            raise RuntimeError(
                f"No X-ray images found in: "
                f"{self.root_dir}\n"
                f"Expected folders:\n"
                f"  NORMAL/\n"
                f"  PNEUMONIA/"
            )

    # ========================================================
    # DATASET LENGTH
    # ========================================================

    def __len__(self):

        return len(self.samples)

    # ========================================================
    # GET ONE SAMPLE
    # ========================================================

    def __getitem__(self, index):

        image_path, label = self.samples[index]

        # Open image
        image = Image.open(
            image_path
        ).convert("RGB")

        # Apply preprocessing
        if self.transform is not None:

            image = self.transform(
                image
            )

        return image, label