import os
import sys
import cv2
import numpy as np

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
# IMPORTS
# ============================================================

from PIL import Image
from torchvision import transforms

from preprocessing.transforms import CLAHETransform
from preprocessing.deidentify import deidentify_image, deidentify_and_save


# ============================================================
# CLIENT CONFIGURATION
# ============================================================

CLIENTS = {
    1: "client1_kaggle",
    2: "client2_chittagong",
    3: "client3_bhopal"
}


# ============================================================
# DE-IDENTIFICATION SETTINGS
# ============================================================

# De-identification is applied ONLY to Client 2
DEIDENTIFY_CLIENT_ID = 2

# Only this class is used to create the demonstration image
DEMO_CLASS = "NORMAL"


# ============================================================
# PREPROCESSING
# ============================================================

# IMPORTANT:
# De-identification is handled separately.
# This transform only performs:
#
# 1. CLAHE
# 2. Resize to 224 x 224
#
# This avoids applying de-identification twice.

preprocess = transforms.Compose([

    # CLAHE contrast enhancement
    CLAHETransform(),

    # ResNet-50 input size
    transforms.Resize(
        (224, 224)
    )
])


# ============================================================
# PROCESS ONE IMAGE
# ============================================================

def process_image(
    source_file,
    output_file,
    use_deidentification=False
):
    """
    Process one X-ray image.

    Client 1 / Client 3:
        Original
          ↓
        CLAHE
          ↓
        Resize 224x224
          ↓
        Save

    Client 2:
        Original
          ↓
        OCR De-identification
          ↓
        CLAHE
          ↓
        Resize 224x224
          ↓
        Save
    """

    # ========================================================
    # 1. Open original image
    # ========================================================

    original_image = Image.open(
        source_file
    ).convert("RGB")


    # ========================================================
    # 2. De-identification
    # ========================================================

    if use_deidentification:

        # ----------------------------------------------------
        # Temporary directory
        # ----------------------------------------------------

        temp_dir = os.path.join(
            PROJECT_ROOT,
            "results",
            "temp_deidentified"
        )

        os.makedirs(
            temp_dir,
            exist_ok=True
        )


        # ----------------------------------------------------
        # Create unique temporary filename
        # ----------------------------------------------------

        base_name = os.path.splitext(
            os.path.basename(source_file)
        )[0]

        temp_file = os.path.join(
            temp_dir,
            base_name + "_deidentified.jpg"
        )


        # ----------------------------------------------------
        # Run OCR de-identification
        #
        # IMPORTANT:
        # We do NOT create a comparison image here.
        # This function is called for every Client 2 image.
        # ----------------------------------------------------

        deidentify_and_save(
            input_path=source_file,
            output_path=temp_file
        )


        # ----------------------------------------------------
        # Open de-identified image
        # ----------------------------------------------------

        image_for_preprocessing = Image.open(
            temp_file
        ).convert("RGB")


    else:

        # ====================================================
        # Client 1 / Client 3
        # ====================================================

        image_for_preprocessing = original_image


    # ========================================================
    # 3. CLAHE + Resize
    # ========================================================

    processed_image = preprocess(
        image_for_preprocessing
    )


    # ========================================================
    # 4. Create output directory
    # ========================================================

    output_directory = os.path.dirname(
        output_file
    )

    os.makedirs(
        output_directory,
        exist_ok=True
    )


    # ========================================================
    # 5. Save final processed image
    # ========================================================

    processed_image.save(
        output_file,
        quality=95
    )


    # ========================================================
    # 6. Remove temporary de-identified image
    # ========================================================

    if use_deidentification:

        try:
            os.remove(temp_file)
        except OSError:
            pass


    return (
        original_image,
        processed_image
    )


# ============================================================
# CREATE CLIENT 2 DE-IDENTIFICATION COMPARISON
# ============================================================

def create_deidentification_comparison(
    source_file,
    comparison_file
):
    """
    Creates ONE Original vs De-identified comparison
    for Client 2.

    This image is ONLY for visualization/documentation.
    It is NOT used for training.
    """

    print()
    print("=" * 70)
    print("CLIENT 2 DE-IDENTIFICATION VISUALIZATION")
    print("=" * 70)

    print(
        f"Sample image: {source_file}"
    )


    # ========================================================
    # Read original
    # ========================================================

    original = cv2.imread(
        source_file
    )

    if original is None:

        print(
            "ERROR: Could not read original image."
        )

        return


    # ========================================================
    # Temporary directory
    # ========================================================

    temp_dir = os.path.join(
        PROJECT_ROOT,
        "results",
        "temp_deidentified"
    )

    os.makedirs(
        temp_dir,
        exist_ok=True
    )


    temp_masked = os.path.join(
        temp_dir,
        "client2_demo_deidentified.jpg"
    )


    # ========================================================
    # De-identify sample
    # ========================================================

    deidentify_and_save(
        input_path=source_file,
        output_path=temp_masked
    )


    # ========================================================
    # Read de-identified image
    # ========================================================

    deidentified = cv2.imread(
        temp_masked
    )

    if deidentified is None:

        print(
            "ERROR: Could not read de-identified image."
        )

        return


    # ========================================================
    # Resize for display
    # ========================================================

    display_width = 500

    display_height = int(
        original.shape[0]
        * display_width
        / original.shape[1]
    )


    original_resized = cv2.resize(
        original,
        (
            display_width,
            display_height
        )
    )


    deidentified_resized = cv2.resize(
        deidentified,
        (
            display_width,
            display_height
        )
    )


    # ========================================================
    # Add title area
    # ========================================================

    title_height = 60


    original_panel = cv2.copyMakeBorder(
        original_resized,
        title_height,
        0,
        0,
        0,
        cv2.BORDER_CONSTANT,
        value=(0, 0, 0)
    )


    deidentified_panel = cv2.copyMakeBorder(
        deidentified_resized,
        title_height,
        0,
        0,
        0,
        cv2.BORDER_CONSTANT,
        value=(0, 0, 0)
    )


    # ========================================================
    # Add titles
    # ========================================================

    cv2.putText(
        original_panel,
        "ORIGINAL",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.0,
        (255, 255, 255),
        2,
        cv2.LINE_AA
    )


    cv2.putText(
        deidentified_panel,
        "DE-IDENTIFIED",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.0,
        (255, 255, 255),
        2,
        cv2.LINE_AA
    )


    # ========================================================
    # Create side-by-side comparison
    # ========================================================

    comparison = np.hstack(
        [
            original_panel,
            deidentified_panel
        ]
    )


    # ========================================================
    # Create output directory
    # ========================================================

    comparison_directory = os.path.dirname(
        comparison_file
    )

    os.makedirs(
        comparison_directory,
        exist_ok=True
    )


    # ========================================================
    # Save comparison
    # ========================================================

    cv2.imwrite(
        comparison_file,
        comparison
    )


    print()
    print(
        "Comparison saved to:"
    )

    print(
        comparison_file
    )


    # ========================================================
    # Open comparison on Windows
    # ========================================================

    try:

        os.startfile(
            comparison_file
        )

        print(
            "Comparison image opened."
        )

    except Exception:

        print(
            "Could not open image automatically."
        )


    # ========================================================
    # Cleanup
    # ========================================================

    try:
        os.remove(temp_masked)
    except OSError:
        pass


# ============================================================
# FIND CLIENT 2 DEMO IMAGE
# ============================================================

def find_client2_demo():

    """
    Find the first NORMAL test image from Client 2.
    """

    client_name = CLIENTS[
        DEIDENTIFY_CLIENT_ID
    ]


    demo_directory = os.path.join(
        PROJECT_ROOT,
        "datasets",
        client_name,
        "test",
        DEMO_CLASS
    )


    if not os.path.isdir(
        demo_directory
    ):

        return None


    files = [

        filename

        for filename in os.listdir(
            demo_directory
        )

        if filename.lower().endswith(
            (
                ".jpg",
                ".jpeg",
                ".png",
                ".bmp"
            )
        )
    ]


    if len(files) == 0:

        return None


    files.sort()


    return os.path.join(
        demo_directory,
        files[0]
    )


# ============================================================
# PROCESS ONE CLIENT
# ============================================================

def process_client(
    client_id,
    client_name
):

    # ========================================================
    # Source dataset
    # ========================================================

    source_root = os.path.join(
        PROJECT_ROOT,
        "datasets",
        client_name
    )


    # ========================================================
    # Output dataset
    # ========================================================

    output_root = os.path.join(
        PROJECT_ROOT,
        "datasets",
        "preprocessed",
        client_name
    )


    # ========================================================
    # Check whether de-identification is required
    # ========================================================

    use_deidentification = (
        client_id == DEIDENTIFY_CLIENT_ID
    )


    print()
    print("=" * 70)

    print(
        f"PROCESSING CLIENT {client_id}"
    )

    print(
        f"Dataset: {client_name}"
    )

    if use_deidentification:

        print(
            "De-identification: ENABLED"
        )

    else:

        print(
            "De-identification: DISABLED"
        )

    print("=" * 70)


    total_processed = 0


    # ========================================================
    # Train and test
    # ========================================================

    for split in [
        "train",
        "test"
    ]:


        source_split = os.path.join(
            source_root,
            split
        )


        output_split = os.path.join(
            output_root,
            split
        )


        # ====================================================
        # Check source directory
        # ====================================================

        if not os.path.isdir(
            source_split
        ):

            print(
                f"WARNING: Missing directory:"
            )

            print(
                source_split
            )

            continue


        # ====================================================
        # NORMAL and PNEUMONIA
        # ====================================================

        for class_name in [
            "NORMAL",
            "PNEUMONIA"
        ]:


            source_class = os.path.join(
                source_split,
                class_name
            )


            output_class = os.path.join(
                output_split,
                class_name
            )


            if not os.path.isdir(
                source_class
            ):

                print(
                    f"WARNING: Missing:"
                )

                print(
                    source_class
                )

                continue


            os.makedirs(
                output_class,
                exist_ok=True
            )


            # =================================================
            # Find images
            # =================================================

            files = [

                filename

                for filename in os.listdir(
                    source_class
                )

                if filename.lower().endswith(
                    (
                        ".jpg",
                        ".jpeg",
                        ".png",
                        ".bmp"
                    )
                )
            ]


            files.sort()


            print(
                f"{split}/{class_name}: "
                f"{len(files)} images"
            )


            # =================================================
            # Process images
            # =================================================

            for filename in files:


                source_file = os.path.join(
                    source_class,
                    filename
                )


                output_file = os.path.join(
                    output_class,
                    filename
                )


                try:

                    process_image(
                        source_file,
                        output_file,
                        use_deidentification
                    )


                    total_processed += 1


                except Exception as e:

                    print()
                    print(
                        "ERROR processing:"
                    )

                    print(
                        source_file
                    )

                    print(
                        f"Error: {e}"
                    )


    # ========================================================
    # Client completed
    # ========================================================

    print()
    print(
        f"Client {client_id} completed."
    )

    print(
        f"Total processed: {total_processed}"
    )


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":


    print()
    print("=" * 70)

    print(
        "FEDERATED MEDICAL DIAGNOSTICS"
    )

    print(
        "PREPROCESSING PIPELINE"
    )

    print("=" * 70)


    print()
    print(
        "Pipeline:"
    )

    print(
        "Client 1 → CLAHE → Resize 224×224"
    )

    print(
        "Client 2 → De-identification → CLAHE → Resize 224×224"
    )

    print(
        "Client 3 → CLAHE → Resize 224×224"
    )


    print()
    print(
        "Starting preprocessing..."
    )


    # ========================================================
    # PROCESS ALL CLIENTS
    # ========================================================

    for client_id, client_name in CLIENTS.items():

        process_client(
            client_id,
            client_name
        )


    # ========================================================
    # CLIENT 2 COMPARISON ONLY
    # ========================================================

    print()
    print("=" * 70)

    print(
        "CREATING CLIENT 2 DE-IDENTIFICATION COMPARISON"
    )

    print("=" * 70)


    demo_image = find_client2_demo()


    if demo_image is not None:


        comparison_file = os.path.join(
            PROJECT_ROOT,
            "results",
            "deidentified",
            "client2_deidentification_comparison.jpg"
        )


        create_deidentification_comparison(
            demo_image,
            comparison_file
        )


    else:

        print(
            "Client 2 demo image not found."
        )


    # ========================================================
    # FINAL MESSAGE
    # ========================================================

    print()
    print("=" * 70)

    print(
        "ALL CLIENTS PREPROCESSED"
    )

    print("=" * 70)


    print()
    print(
        "Processed dataset:"
    )

    print(
        os.path.join(
            PROJECT_ROOT,
            "datasets",
            "preprocessed"
        )
    )


    print()
    print(
        "Client 2 comparison:"
    )

    print(
        os.path.join(
            PROJECT_ROOT,
            "results",
            "deidentified",
            "client2_deidentification_comparison.jpg"
        )
    )