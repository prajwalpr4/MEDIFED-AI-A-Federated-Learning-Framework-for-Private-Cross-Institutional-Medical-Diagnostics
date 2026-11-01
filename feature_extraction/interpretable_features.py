import os
import sys

import cv2
import numpy as np
import torch
from PIL import Image

# ============================================================
# PROJECT ROOT
# ============================================================

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

sys.path.insert(0, PROJECT_ROOT)

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
    "PNEUMONIA",
    "IMG-20251102-WA0154.jpg"
)

# ============================================================
# LOAD MODEL
# ============================================================

print("=" * 65)
print("CLIENT 2 — HUMAN-READABLE FEATURE ANALYSIS")
print("=" * 65)

print("Device:", DEVICE)

model = create_resnet50(
    num_classes=2,
    pretrained=False
)

checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE
)

model.load_state_dict(checkpoint)

model = model.to(DEVICE)
model.eval()

print("Global model loaded.")

# ============================================================
# LOAD IMAGE
# ============================================================

image = Image.open(
    IMAGE_PATH
).convert("RGB")

print()
print("Image:", IMAGE_PATH)
print("Original size:", image.size)

# ============================================================
# BASIC IMAGE ANALYSIS
# ============================================================

image_array = np.array(image)

gray = cv2.cvtColor(
    image_array,
    cv2.COLOR_RGB2GRAY
)

# Normalize intensity
gray_normalized = gray.astype(
    np.float32
) / 255.0

mean_intensity = np.mean(
    gray_normalized
)

contrast = np.std(
    gray_normalized
)

# ============================================================
# TEXTURE ANALYSIS
# ============================================================

laplacian = cv2.Laplacian(
    gray_normalized,
    cv2.CV_32F
)

texture_variation = np.std(
    laplacian
)

# ============================================================
# LEFT-RIGHT ASYMMETRY
# ============================================================

height, width = gray_normalized.shape

left_half = gray_normalized[
    :,
    :width // 2
]

right_half = gray_normalized[
    :,
    width // 2:
]

# Make both halves same width
minimum_width = min(
    left_half.shape[1],
    right_half.shape[1]
)

left_half = left_half[
    :,
    :minimum_width
]

right_half = right_half[
    :,
    :minimum_width
]

asymmetry = np.mean(
    np.abs(
        left_half - right_half
    )
)

# ============================================================
# HIGH-INTENSITY REGION ANALYSIS
# ============================================================

threshold = np.percentile(
    gray_normalized,
    90
)

high_intensity_mask = (
    gray_normalized >= threshold
).astype(np.uint8)

num_labels, labels, statistics, centroids = cv2.connectedComponentsWithStats(
    high_intensity_mask,
    connectivity=8
)

# Ignore background
region_count = 0

for i in range(1, num_labels):

    area = statistics[
        i,
        cv2.CC_STAT_AREA
    ]

    if area > 100:
        region_count += 1

# ============================================================
# CLASSIFY FEATURE LEVELS
# ============================================================

def level_from_value(
    value,
    low_threshold,
    high_threshold
):

    if value < low_threshold:
        return "LOW"

    elif value < high_threshold:
        return "MODERATE"

    else:
        return "HIGH"


density_level = level_from_value(
    mean_intensity,
    0.35,
    0.65
)

contrast_level = level_from_value(
    contrast,
    0.15,
    0.30
)

texture_level = level_from_value(
    texture_variation,
    0.03,
    0.08
)

asymmetry_level = level_from_value(
    asymmetry,
    0.05,
    0.12
)

# ============================================================
# DISTRIBUTION
# ============================================================

left_activity = np.mean(
    left_half
)

right_activity = np.mean(
    right_half
)

difference = abs(
    left_activity -
    right_activity
)

if difference < 0.05:

    distribution = "BALANCED"

elif left_activity > right_activity:

    distribution = "LEFT-DOMINANT"

else:

    distribution = "RIGHT-DOMINANT"

# ============================================================
# MODEL PREDICTION
# ============================================================

input_tensor = train_transform(
    image
)

input_tensor = input_tensor.unsqueeze(
    0
).to(DEVICE)

with torch.no_grad():

    outputs = model(
        input_tensor
    )

probabilities = torch.softmax(
    outputs,
    dim=1
)

predicted_class = torch.argmax(
    probabilities,
    dim=1
).item()

class_names = [
    "NORMAL",
    "PNEUMONIA"
]

prediction = class_names[
    predicted_class
]

confidence = (
    probabilities[
        0,
        predicted_class
    ].item()
    * 100
)

normal_probability = (
    probabilities[0, 0].item()
    * 100
)

pneumonia_probability = (
    probabilities[0, 1].item()
    * 100
)

# ============================================================
# HUMAN-READABLE OUTPUT
# ============================================================

print()
print("=" * 65)
print("IMAGE-DERIVED FEATURES")
print("=" * 65)

print(
    f"Mean intensity          : "
    f"{mean_intensity:.4f}"
)

print(
    f"Contrast                : "
    f"{contrast:.4f}"
)

print(
    f"Texture variation       : "
    f"{texture_variation:.4f}"
)

print(
    f"Left-right asymmetry    : "
    f"{asymmetry:.4f}"
)

print(
    f"High-intensity regions  : "
    f"{region_count}"
)

print()
print("=" * 65)
print("HUMAN-READABLE INTERPRETATION")
print("=" * 65)

print(
    f"Intensity / density     : "
    f"{density_level}"
)

print(
    f"Contrast                : "
    f"{contrast_level}"
)

print(
    f"Texture variation       : "
    f"{texture_level}"
)

print(
    f"Left-right asymmetry    : "
    f"{asymmetry_level}"
)

print(
    f"Distribution            : "
    f"{distribution}"
)

print(
    f"High-intensity regions  : "
    f"{region_count}"
)

print()
print("=" * 65)
print("MODEL PREDICTION")
print("=" * 65)

print(
    f"Prediction              : "
    f"{prediction}"
)

print(
    f"Confidence              : "
    f"{confidence:.2f}%"
)

print(
    f"Normal probability      : "
    f"{normal_probability:.2f}%"
)

print(
    f"Pneumonia probability   : "
    f"{pneumonia_probability:.2f}%"
)

print()
print("=" * 65)
print("ANALYSIS COMPLETED")
print("=" * 65)