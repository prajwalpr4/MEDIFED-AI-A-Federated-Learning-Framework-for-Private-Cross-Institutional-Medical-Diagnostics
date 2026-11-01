"""
MEDIFED AI — Singleton Inference Service.

Wraps the existing ResNet-50 model, CLAHE preprocessing, and Grad-CAM
without any code duplication. Imports directly from the project modules.
"""

import io
import sys
import time
import base64
import logging
import numpy as np

import cv2
import torch
from PIL import Image
from torchvision import transforms
from pathlib import Path

# Add project root to sys.path so we can import existing modules
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from api.config import (
    MODEL_CHECKPOINT_PATH,
    DEVICE,
    NUM_CLASSES,
    CLASS_NAMES,
    CLAHE_CLIP_LIMIT,
    CLAHE_TILE_GRID_SIZE,
    IMAGENET_MEAN,
    IMAGENET_STD,
    INPUT_SIZE,
)

# Import existing project modules directly
from preprocessing.transforms import CLAHETransform
from explainability.gradcam import load_model, predict, generate_gradcam

logger = logging.getLogger("medifed.inference")


class InferenceService:
    """
    Singleton service that manages the ResNet-50 model lifecycle
    and provides inference + Grad-CAM generation.

    Uses the EXACT same model loading, preprocessing, and Grad-CAM
    functions from the existing project code to ensure zero regressions.
    """

    _instance = None
    _model = None
    _is_loaded = False
    _load_time = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self) -> None:
        """Load the federated ResNet-50 model from checkpoint."""
        if self._is_loaded:
            logger.info("Model already loaded, skipping reload.")
            return

        checkpoint_path = str(MODEL_CHECKPOINT_PATH)
        logger.info(f"Loading model from: {checkpoint_path}")
        logger.info(f"Device: {DEVICE}")

        if not MODEL_CHECKPOINT_PATH.exists():
            raise FileNotFoundError(
                f"Model checkpoint not found: {checkpoint_path}"
            )

        # Use the existing load_model function from gradcam.py
        self._model = load_model(checkpoint_path, DEVICE)
        self._is_loaded = True
        self._load_time = time.time()

        logger.info("✅ Model loaded successfully.")

    @property
    def model(self):
        if not self._is_loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        return self._model

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    @property
    def uptime_seconds(self) -> float:
        if self._load_time is None:
            return 0.0
        return time.time() - self._load_time

    def preprocess_image(self, image_bytes: bytes) -> tuple:
        """
        Preprocess an uploaded image using the EXACT same pipeline
        as the existing project (CLAHE + resize + ImageNet normalize).

        Returns:
            (input_tensor, original_pil_image)
        """
        # Open image
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Build the same transform pipeline as val_transform in transforms.py
        clahe_transform = CLAHETransform(
            clip_limit=CLAHE_CLIP_LIMIT,
            tile_grid_size=CLAHE_TILE_GRID_SIZE
        )

        inference_transform = transforms.Compose([
            clahe_transform,
            transforms.Resize(INPUT_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=IMAGENET_MEAN,
                std=IMAGENET_STD
            )
        ])

        # Apply transform
        input_tensor = inference_transform(pil_image).unsqueeze(0).to(DEVICE)

        return input_tensor, pil_image

    def run_inference(self, image_bytes: bytes) -> dict:
        """
        Execute full inference pipeline:
        1. CLAHE preprocessing
        2. ResNet-50 forward pass
        3. Grad-CAM heatmap generation
        4. Encode results as base64

        Returns dict matching PredictionResponse schema.
        """
        start_time = time.time()

        # Step 1: Preprocess
        input_tensor, original_pil = self.preprocess_image(image_bytes)

        # Step 2: Predict using existing predict() function
        predicted_class_idx, confidence, probabilities = predict(
            self.model, input_tensor
        )

        # Step 3: Generate Grad-CAM using existing function
        gradcam_visualization = generate_gradcam(
            self.model,
            input_tensor,
            original_pil,
            predicted_class_idx
        )

        # Step 4: Encode Grad-CAM as base64 JPEG
        gradcam_pil = Image.fromarray(gradcam_visualization)
        gradcam_buffer = io.BytesIO()
        gradcam_pil.save(gradcam_buffer, format="JPEG", quality=90)
        gradcam_base64 = (
            "data:image/jpeg;base64,"
            + base64.b64encode(gradcam_buffer.getvalue()).decode("utf-8")
        )

        # Step 5: Encode preprocessed original as base64
        original_resized = original_pil.resize(INPUT_SIZE)
        original_buffer = io.BytesIO()
        original_resized.save(original_buffer, format="JPEG", quality=90)
        original_base64 = (
            "data:image/jpeg;base64,"
            + base64.b64encode(original_buffer.getvalue()).decode("utf-8")
        )

        elapsed_ms = (time.time() - start_time) * 1000

        # Build response
        probs = probabilities[0].cpu().numpy()
        result = {
            "predicted_class": CLASS_NAMES[predicted_class_idx],
            "probabilities": {
                "NORMAL": round(float(probs[0]), 4),
                "PNEUMONIA": round(float(probs[1]), 4),
            },
            "confidence": round(float(confidence), 4),
            "gradcam_base64": gradcam_base64,
            "original_base64": original_base64,
            "model_checkpoint": MODEL_CHECKPOINT_PATH.name,
            "inference_time_ms": round(elapsed_ms, 1),
        }

        logger.info(
            f"Inference: {result['predicted_class']} "
            f"(confidence={result['confidence']:.4f}, "
            f"time={result['inference_time_ms']:.1f}ms)"
        )

        return result


# Module-level singleton
inference_service = InferenceService()
