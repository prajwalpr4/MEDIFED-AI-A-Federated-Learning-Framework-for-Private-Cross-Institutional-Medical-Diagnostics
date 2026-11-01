import sys
from pathlib import Path

import streamlit as st
import torch
import numpy as np
from PIL import Image


# ============================================================
# PROJECT ROOT
# ============================================================

PROJECT_ROOT = Path(
    __file__
).resolve().parents[1]

sys.path.insert(
    0,
    str(PROJECT_ROOT)
)


# ============================================================
# IMPORT PROJECT MODULES
# ============================================================

from preprocessing.transforms import val_transform

from explainability.gradcam import (
    load_model,
    predict,
    generate_gradcam,
    CLASS_NAMES
)


# ============================================================
# CONFIGURATION
# ============================================================

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)

CHECKPOINT_PATH = (
    PROJECT_ROOT
    / "models"
    / "checkpoints"
    / "federated"
    / "global_round_03.pth"
)


# ============================================================
# STREAMLIT PAGE
# ============================================================

st.set_page_config(
    page_title="Pneumonia Explainable AI",
    page_icon="🩺",
    layout="wide"
)


# ============================================================
# TITLE
# ============================================================

st.title(
    "🩺 Pneumonia Detection & Explainable AI"
)

st.write(
    "Upload a chest X-ray image to obtain "
    "the prediction and Grad-CAM explanation "
    "from the federated ResNet-50 model."
)

st.info(
    "Model: Federated ResNet-50 | "
    "Checkpoint: Global Round 3 | "
    "Explainability: Grad-CAM"
)


# ============================================================
# LOAD MODEL
# ============================================================

@st.cache_resource
def get_model():

    return load_model(
        str(CHECKPOINT_PATH),
        DEVICE
    )


# ============================================================
# CHECK CHECKPOINT
# ============================================================

if not CHECKPOINT_PATH.exists():

    st.error(
        "Federated model checkpoint was not found:\n\n"
        f"{CHECKPOINT_PATH}"
    )

    st.stop()


# ============================================================
# LOAD MODEL
# ============================================================

try:

    model = get_model()

except Exception as e:

    st.error(
        f"Error loading model: {e}"
    )

    st.stop()


# ============================================================
# IMAGE UPLOAD
# ============================================================

st.subheader(
    "Upload Chest X-ray"
)

uploaded_file = st.file_uploader(
    "Choose an X-ray image",
    type=[
        "jpg",
        "jpeg",
        "png"
    ]
)


# ============================================================
# PROCESS IMAGE
# ============================================================

if uploaded_file is not None:

    # --------------------------------------------------------
    # Read image
    # --------------------------------------------------------

    original_image = Image.open(
        uploaded_file
    ).convert("RGB")

    # --------------------------------------------------------
    # Display original image
    # --------------------------------------------------------

    st.subheader(
        "Input Image"
    )

    st.image(
        original_image,
        caption="Uploaded Chest X-ray",
        width=500
    )

    # --------------------------------------------------------
    # Apply same validation preprocessing
    # --------------------------------------------------------

    input_tensor = val_transform(
        original_image
    )

    input_tensor = input_tensor.unsqueeze(
        0
    ).to(DEVICE)

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    predicted_class, confidence, probabilities = predict(
        model,
        input_tensor
    )

    predicted_label = CLASS_NAMES[
        predicted_class
    ]

    # --------------------------------------------------------
    # Prediction result
    # --------------------------------------------------------

    st.subheader(
        "Prediction Result"
    )

    col1, col2 = st.columns(2)

    with col1:

        st.metric(
            "Predicted Class",
            predicted_label
        )

    with col2:

        st.metric(
            "Confidence",
            f"{confidence * 100:.2f}%"
        )

    # --------------------------------------------------------
    # Probability details
    # --------------------------------------------------------

    st.subheader(
        "Class Probabilities"
    )

    normal_probability = (
        probabilities[0, 0].item()
    )

    pneumonia_probability = (
        probabilities[0, 1].item()
    )

    col1, col2 = st.columns(2)

    with col1:

        st.write(
            f"**NORMAL:** "
            f"{normal_probability * 100:.2f}%"
        )

        st.progress(
            normal_probability
        )

    with col2:

        st.write(
            f"**PNEUMONIA:** "
            f"{pneumonia_probability * 100:.2f}%"
        )

        st.progress(
            pneumonia_probability
        )

    # --------------------------------------------------------
    # Grad-CAM
    # --------------------------------------------------------

    st.subheader(
        "Grad-CAM Explainability"
    )

    st.write(
        "The heatmap highlights the regions "
        "of the X-ray that contributed to the "
        "model's prediction."
    )

    try:

        gradcam_image = generate_gradcam(
            model=model,
            input_tensor=input_tensor,
            original_image=original_image,
            predicted_class=predicted_class
        )

        # ----------------------------------------------------
        # Display original + Grad-CAM
        # ----------------------------------------------------

        col1, col2 = st.columns(2)

        with col1:

            st.image(
                original_image,
                caption="Original X-ray",
                use_container_width=True
            )

        with col2:

            st.image(
                gradcam_image,
                caption="Grad-CAM Heatmap",
                use_container_width=True
            )

        # ----------------------------------------------------
        # Download Grad-CAM image
        # ----------------------------------------------------

        from PIL import Image as PILImage
        import io

        result_image = PILImage.fromarray(
            np.array(gradcam_image)
        )

        image_buffer = io.BytesIO()

        result_image.save(
            image_buffer,
            format="JPEG"
        )

        st.download_button(
            label="⬇️ Download Grad-CAM Result",
            data=image_buffer.getvalue(),
            file_name="gradcam_result.jpg",
            mime="image/jpeg"
        )

    except Exception as e:

        st.error(
            f"Grad-CAM generation failed: {e}"
        )


# ============================================================
# FOOTER
# ============================================================

st.markdown("---")

st.caption(
    "ResNet-50 | Federated Learning | "
    "Grad-CAM Explainability"
)