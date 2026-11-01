import torch
import numpy as np

from torchvision.models import resnet50

from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image


# ============================================================
# CONFIGURATION
# ============================================================

NUM_CLASSES = 2

CLASS_NAMES = {
    0: "NORMAL",
    1: "PNEUMONIA"
}


# ============================================================
# LOAD RESNET-50 MODEL
# ============================================================

def load_model(checkpoint_path, device):

    # Create ResNet-50 without ImageNet weights
    model = resnet50(weights=None)

    # Change final layer for 2 classes
    model.fc = torch.nn.Linear(
        model.fc.in_features,
        NUM_CLASSES
    )

    # Load trained federated model
    checkpoint = torch.load(
        checkpoint_path,
        map_location=device
    )

    # Handle checkpoint format
    if (
        isinstance(checkpoint, dict)
        and "state_dict" in checkpoint
    ):
        state_dict = checkpoint["state_dict"]
    else:
        state_dict = checkpoint

    # Remove "module." if present
    cleaned_state_dict = {}

    for key, value in state_dict.items():

        if key.startswith("module."):
            key = key.replace(
                "module.",
                "",
                1
            )

        cleaned_state_dict[key] = value

    model.load_state_dict(
        cleaned_state_dict
    )

    model = model.to(device)

    model.eval()

    return model


# ============================================================
# PREDICTION
# ============================================================

def predict(model, input_tensor):

    with torch.no_grad():

        output = model(
            input_tensor
        )

        probabilities = torch.softmax(
            output,
            dim=1
        )

        predicted_class = torch.argmax(
            probabilities,
            dim=1
        ).item()

        confidence = probabilities[
            0,
            predicted_class
        ].item()

    return (
        predicted_class,
        confidence,
        probabilities
    )


# ============================================================
# GRAD-CAM
# ============================================================

def generate_gradcam(
    model,
    input_tensor,
    original_image,
    predicted_class
):

    # Last convolutional block of ResNet-50
    target_layers = [
        model.layer4[-1]
    ]

    # Create Grad-CAM
    cam = GradCAM(
        model=model,
        target_layers=target_layers
    )

    # Explain the predicted class
    targets = [
        ClassifierOutputTarget(
            predicted_class
        )
    ]

    # Generate CAM
    grayscale_cam = cam(
        input_tensor=input_tensor,
        targets=targets
    )[0]

    # Resize original image to model size
    resized_image = original_image.resize(
        (224, 224)
    )

    # Convert to NumPy
    rgb_image = np.array(
        resized_image
    ).astype(
        np.float32
    ) / 255.0

    # Create heatmap overlay
    visualization = show_cam_on_image(
        rgb_image,
        grayscale_cam,
        use_rgb=True
    )

    return visualization