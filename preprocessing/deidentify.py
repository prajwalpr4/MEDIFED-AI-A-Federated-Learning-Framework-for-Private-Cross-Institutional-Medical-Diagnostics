import os
import cv2
import easyocr


# ============================================================
# OCR READER
# ============================================================

# Create OCR reader only once.
# This prevents loading EasyOCR again for every image.

reader = None


def get_reader():

    global reader

    if reader is None:

        print("Initializing OCR...")

        reader = easyocr.Reader(
            ["en"],
            gpu=False
        )

    return reader


# ============================================================
# DE-IDENTIFY IMAGE
# ============================================================

def deidentify_image(
    input_path,
    output_path
):
    """
    Detect visible text anywhere in the chest X-ray,
    mask detected text, and create an
    original-vs-de-identified comparison image.

    This function keeps the original behavior of the
    existing project.
    """

    # ========================================================
    # READ ORIGINAL
    # ========================================================

    original = cv2.imread(
        input_path
    )

    if original is None:

        raise FileNotFoundError(
            f"Could not read image: {input_path}"
        )


    # ========================================================
    # COPY ORIGINAL
    # ========================================================

    deidentified = original.copy()


    # ========================================================
    # OCR
    # ========================================================

    ocr_reader = get_reader()

    print(
        f"Detecting text: "
        f"{os.path.basename(input_path)}"
    )

    detections = ocr_reader.readtext(
        original
    )

    print(
        f"Text regions detected: "
        f"{len(detections)}"
    )


    # ========================================================
    # MASK TEXT
    # ========================================================

    for detection in detections:

        bounding_box = detection[0]

        detected_text = detection[1]

        confidence = detection[2]


        print(
            f"Detected: '{detected_text}' "
            f"(confidence={confidence:.2f})"
        )


        # ----------------------------------------------------
        # Ignore low-confidence detections
        # ----------------------------------------------------

        if confidence < 0.30:

            continue


        # ----------------------------------------------------
        # Get bounding box coordinates
        # ----------------------------------------------------

        x_coordinates = [

            int(point[0])

            for point in bounding_box

        ]


        y_coordinates = [

            int(point[1])

            for point in bounding_box

        ]


        x1 = max(
            0,
            min(x_coordinates)
        )


        y1 = max(
            0,
            min(y_coordinates)
        )


        x2 = min(
            original.shape[1],
            max(x_coordinates)
        )


        y2 = min(
            original.shape[0],
            max(y_coordinates)
        )


        # ----------------------------------------------------
        # Padding
        # ----------------------------------------------------

        padding = 5


        x1 = max(
            0,
            x1 - padding
        )


        y1 = max(
            0,
            y1 - padding
        )


        x2 = min(
            original.shape[1],
            x2 + padding
        )


        y2 = min(
            original.shape[0],
            y2 + padding
        )


        # ----------------------------------------------------
        # Mask detected text
        # ----------------------------------------------------

        deidentified[
            y1:y2,
            x1:x2
        ] = 0


    # ========================================================
    # CREATE COMPARISON
    # ========================================================

    comparison_width = 600


    original_height = int(
        original.shape[0]
        * comparison_width
        / original.shape[1]
    )


    original_resized = cv2.resize(
        original,
        (
            comparison_width,
            original_height
        )
    )


    deidentified_resized = cv2.resize(
        deidentified,
        (
            comparison_width,
            original_height
        )
    )


    # ========================================================
    # ADD TITLES
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


    cv2.putText(
        original_panel,
        "ORIGINAL",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.1,
        (255, 255, 255),
        2,
        cv2.LINE_AA
    )


    cv2.putText(
        deidentified_panel,
        "DE-IDENTIFIED",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.1,
        (255, 255, 255),
        2,
        cv2.LINE_AA
    )


    # ========================================================
    # SIDE-BY-SIDE COMPARISON
    # ========================================================

    comparison = cv2.hconcat(
        [
            original_panel,
            deidentified_panel
        ]
    )


    # ========================================================
    # SAVE COMPARISON
    # ========================================================

    output_dir = os.path.dirname(
        output_path
    )


    if output_dir:

        os.makedirs(
            output_dir,
            exist_ok=True
        )


    cv2.imwrite(
        output_path,
        comparison
    )


    print()
    print(
        "DE-IDENTIFICATION COMPARISON CREATED"
    )

    print(
        f"Original  : {input_path}"
    )

    print(
        f"Comparison: {output_path}"
    )


    # ========================================================
    # RETURN DE-IDENTIFIED IMAGE
    # ========================================================

    return deidentified


# ============================================================
# DE-IDENTIFY AND SAVE MASKED IMAGE
# ============================================================

def deidentify_and_save(
    input_path,
    output_path
):
    """
    De-identify an image and save ONLY the masked
    de-identified image.

    This is used by the Client 2 preprocessing pipeline.
    """

    original = cv2.imread(
        input_path
    )

    if original is None:

        raise FileNotFoundError(
            f"Could not read image: {input_path}"
        )


    deidentified = original.copy()


    # ========================================================
    # OCR
    # ========================================================

    ocr_reader = get_reader()


    detections = ocr_reader.readtext(
        original
    )


    print(
        f"Text regions detected: "
        f"{len(detections)}"
    )


    # ========================================================
    # MASK TEXT
    # ========================================================

    for detection in detections:

        bounding_box = detection[0]

        detected_text = detection[1]

        confidence = detection[2]


        print(
            f"Detected: '{detected_text}' "
            f"(confidence={confidence:.2f})"
        )


        if confidence < 0.30:

            continue


        x_coordinates = [

            int(point[0])

            for point in bounding_box

        ]


        y_coordinates = [

            int(point[1])

            for point in bounding_box

        ]


        x1 = max(
            0,
            min(x_coordinates)
        )


        y1 = max(
            0,
            min(y_coordinates)
        )


        x2 = min(
            original.shape[1],
            max(x_coordinates)
        )


        y2 = min(
            original.shape[0],
            max(y_coordinates)
        )


        # ----------------------------------------------------
        # Padding
        # ----------------------------------------------------

        padding = 5


        x1 = max(
            0,
            x1 - padding
        )


        y1 = max(
            0,
            y1 - padding
        )


        x2 = min(
            original.shape[1],
            x2 + padding
        )


        y2 = min(
            original.shape[0],
            y2 + padding
        )


        # ----------------------------------------------------
        # Mask
        # ----------------------------------------------------

        deidentified[
            y1:y2,
            x1:x2
        ] = 0


    # ========================================================
    # SAVE MASKED IMAGE
    # ========================================================

    output_dir = os.path.dirname(
        output_path
    )


    if output_dir:

        os.makedirs(
            output_dir,
            exist_ok=True
        )


    success = cv2.imwrite(
        output_path,
        deidentified
    )


    if not success:

        raise RuntimeError(
            f"Could not save de-identified image: "
            f"{output_path}"
        )


    return deidentified


# ============================================================
# TEST ONE IMAGE
# ============================================================

if __name__ == "__main__":

    input_image = (
        r"datasets\client2_chittagong"
        r"\test\NORMAL\01.jpg"
    )


    output_image = (
        r"results\deidentified"
        r"\client2_01_comparison.jpg"
    )


    deidentify_image(
        input_image,
        output_image
    )