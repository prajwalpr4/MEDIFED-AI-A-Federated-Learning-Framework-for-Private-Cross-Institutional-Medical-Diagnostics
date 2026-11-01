import cv2
import numpy as np

from PIL import Image
from torchvision import transforms


# ============================================================
# CLAHE TRANSFORM
# ============================================================

class CLAHETransform:

    def __init__(
        self,
        clip_limit=2.0,
        tile_grid_size=(8, 8)
    ):
        self.clahe = cv2.createCLAHE(
            clipLimit=clip_limit,
            tileGridSize=tile_grid_size
        )

    def __call__(self, image):

        image = np.array(image)

        if image.ndim == 3:
            image = cv2.cvtColor(
                image,
                cv2.COLOR_RGB2GRAY
            )

        image = image.astype(np.uint8)

        image = self.clahe.apply(image)

        image = cv2.cvtColor(
            image,
            cv2.COLOR_GRAY2RGB
        )

        return Image.fromarray(image)


# ============================================================
# TRAIN TRANSFORM
# ============================================================

train_transform = transforms.Compose([

    CLAHETransform(
        clip_limit=2.0,
        tile_grid_size=(8, 8)
    ),

    transforms.Resize(
        (224, 224)
    ),

    transforms.RandomHorizontalFlip(
        p=0.5
    ),

    transforms.RandomRotation(
        degrees=5
    ),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[
            0.485,
            0.456,
            0.406
        ],
        std=[
            0.229,
            0.224,
            0.225
        ]
    )
])


# ============================================================
# VALIDATION / TEST TRANSFORM
# ============================================================

val_transform = transforms.Compose([

    CLAHETransform(
        clip_limit=2.0,
        tile_grid_size=(8, 8)
    ),

    transforms.Resize(
        (224, 224)
    ),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[
            0.485,
            0.456,
            0.406
        ],
        std=[
            0.229,
            0.224,
            0.225
        ]
    )
])