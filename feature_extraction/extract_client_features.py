import os
import sys

import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import models

# ============================================================
# PROJECT ROOT
# ============================================================

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

sys.path.insert(0, PROJECT_ROOT)

# ============================================================
# IMPORT OUR MODEL AND TRANSFORM
# ============================================================

from models.resnet_model import create_resnet50
from preprocessing.transforms import train_transform

# ============================================================
# SETTINGS
# ============================================================

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

MODEL_PATH = os.path.join(
    PROJECT_ROOT,
    "models",
    "checkpoints",
    "federated",
    "global_round_03.pth"
)

IMAGE_PATH = os.path.join(
    PROJECT_ROOT,
    "datasets",
    "client2_chittagong",
    "test",
    "NORMAL",
    "01.jpg"
)

# ============================================================
# LOAD MODEL
# ============================================================

print("=" * 60)
print("CLIENT 2 — FEATURE EXTRACTION")
print("=" * 60)

print("Device:", DEVICE)

model = create_resnet50(
    num_classes=2,
    pretrained=False
)

checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE
)

model.load_state_dict(
    checkpoint
)

model = model.to(DEVICE)

model.eval()

print("Global model loaded:")
print(MODEL_PATH)

# ============================================================
# LOAD IMAGE
# ============================================================

image = Image.open(
    IMAGE_PATH
).convert("RGB")

print()
print("Image:")
print(IMAGE_PATH)

print(
    "Original image size:",
    image.size
)

# ============================================================
# PREPROCESS
# ============================================================

input_tensor = train_transform(image)

print()
print(
    "Preprocessed shape:",
    input_tensor.shape
)

print(
    "Preprocessed dtype:",
    input_tensor.dtype
)

input_tensor = input_tensor.unsqueeze(0)

input_tensor = input_tensor.to(DEVICE)

# ============================================================
# FEATURE EXTRACTION
# ============================================================

features = None


def capture_features(
    module,
    input,
    output
):
    global features

    features = output.detach()


# ResNet-50 final convolutional layer
hook = model.layer4.register_forward_hook(
    capture_features
)

# ============================================================
# FORWARD PASS
# ============================================================

with torch.no_grad():

    outputs = model(
        input_tensor
    )

hook.remove()

# ============================================================
# FEATURE INFORMATION
# ============================================================

print()
print("=" * 60)
print("DEEP FEATURE EXTRACTION")
print("=" * 60)

print(
    "Feature map shape:",
    features.shape
)

# Global average pooling
feature_vector = F.adaptive_avg_pool2d(
    features,
    (1, 1)
)

feature_vector = feature_vector.flatten(
    start_dim=1
)

print(
    "Feature vector shape:",
    feature_vector.shape
)

print(
    "Feature dimension:",
    feature_vector.shape[1]
)

# ============================================================
# SHOW FIRST 10 FEATURES
# ============================================================

print()
print("First 10 learned features:")

print(
    feature_vector[0, :10].cpu().numpy()
)

# ============================================================
# CLASSIFICATION
# ============================================================

probabilities = torch.softmax(
    outputs,
    dim=1
)

predicted_class = torch.argmax(
    probabilities,
    dim=1
).item()

confidence = (
    probabilities[0, predicted_class]
    .item()
    * 100
)

class_names = [
    "NORMAL",
    "PNEUMONIA"
]

print()
print("=" * 60)
print("PREDICTION")
print("=" * 60)

print(
    "Prediction:",
    class_names[predicted_class]
)

print(
    "Confidence:",
    f"{confidence:.2f}%"
)

print()
print("NORMAL probability:",
      f"{probabilities[0, 0].item() * 100:.2f}%")

print(
    "PNEUMONIA probability:",
    f"{probabilities[0, 1].item() * 100:.2f}%"
)

print()
print("=" * 60)
print("FEATURE EXTRACTION COMPLETED")
print("=" * 60)