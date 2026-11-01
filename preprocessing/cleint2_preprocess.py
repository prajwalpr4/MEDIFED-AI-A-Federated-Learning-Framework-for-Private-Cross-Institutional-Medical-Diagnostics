import os
import sys
import cv2
import numpy as np

from PIL import Image
from torchvision import transforms


# ============================================================
# PROJECT ROOT
# ============================================================

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

sys.path.insert(
    0,
    PROJECT_ROOT
)


# ============================================================
# IMPORTS
# ============================================================

from preprocessing.transforms import CLAHETransform

from preprocessing.deidentify import (
    deidentify_and_save
)


# ============================================================
# CLIENT 2
# ============================================================

CLIENT_NAME = "client2_chittagong"


SOURCE_ROOT = os.path.join(
    PROJECT_ROOT,
    "datasets",
    CLIENT_NAME
)


OUTPUT_ROOT = os.path.join(
    PROJECT_ROOT,
    "datasets",
    "preprocessed",
    CLIENT_NAME
)


RESULTS_ROOT = os.path.join(
    PROJECT_ROOT,
    "results",
    "deidentified"
)


TEMP_ROOT = os.path.join(
    PROJECT_ROOT,
    "results",
    "temp_client2"
)


# ============================================================
# PREPROCESSING
# ============================================================

preprocess = transforms.Compose([

    # CLAHE
    CLAHETransform(),

    # Resize
    transforms.Resize(
        (224, 224)
    )
])


# ============================================================
# PROCESS ONE IMAGE
# ============================================================

def process_image(
    source_file,
    output_file
):

    # --------------------------------------------------------
    # Temporary de-identified image
    # --------------------------------------------------------

    os.makedirs(
        TEMP_ROOT,
        exist_ok=True
    )


    filename = os.path.basename(
        source_file
    )


    name, _ = os.path.splitext(
        filename
    )


    temp_file = os.path.join(
        TEMP_ROOT,
        name + "_deidentified.jpg"
    )


    # ========================================================
    # DE-IDENTIFICATION
    # ========================================================

    deidentify_and_save(
        input_path=source_file,
        output_path=temp_file
    )


    # ========================================================
    # OPEN DE-IDENTIFIED IMAGE
    # ========================================================

    image = Image.open(
        temp_file
    ).convert("RGB")


    # ========================================================
    # CLAHE + RESIZE
    # ========================================================

    processed = preprocess(
        image
    )


    # ========================================================
    # SAVE
    # ========================================================

    os.makedirs(
        os.path.dirname(output_file),
        exist_ok=True
    )


    processed.save(
        output_file,
        quality=95
    )


    # ========================================================
    # CLEAN TEMP FILE
    # ========================================================

    try:

        os.remove(
            temp_file
        )

    except OSError:

        pass


# ============================================================
# PROCESS CLIENT 2
# ============================================================

def process_client2():

    print()
    print("=" * 70)

    print(
        "PROCESSING CLIENT 2 ONLY"
    )

    print("=" * 70)

    print()
    print(
        f"Source:"
    )

    print(
        SOURCE_ROOT
    )

    print()
    print(
        f"Output:"
    )

    print(
        OUTPUT_ROOT
    )

    print()
    print(
        "Pipeline:"
    )

    print(
        "Original"
    )

    print(
        "   ↓"
    )

    print(
        "OCR De-identification"
    )

    print(
        "   ↓"
    )

    print(
        "CLAHE"
    )

    print(
        "   ↓"
    )

    print(
        "Resize 224 × 224"
    )

    print()


    total_processed = 0


    # ========================================================
    # TRAIN / TEST
    # ========================================================

    for split in [
        "train",
        "test"
    ]:


        source_split = os.path.join(
            SOURCE_ROOT,
            split
        )


        output_split = os.path.join(
            OUTPUT_ROOT,
            split
        )


        if not os.path.isdir(
            source_split
        ):

            print(
                f"WARNING: "
                f"{source_split} not found."
            )

            continue


        # ====================================================
        # NORMAL / PNEUMONIA
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
                    f"WARNING: "
                    f"{source_class} not found."
                )

                continue


            os.makedirs(
                output_class,
                exist_ok=True
            )


            # =================================================
            # IMAGE LIST
            # =================================================

            files = [

                f

                for f in os.listdir(
                    source_class
                )

                if f.lower().endswith(
                    (
                        ".jpg",
                        ".jpeg",
                        ".png",
                        ".bmp"
                    )
                )
            ]


            files.sort()


            print()
            print(
                f"{split}/{class_name}: "
                f"{len(files)} images"
            )


            # =================================================
            # PROCESS
            # =================================================

            for index, filename in enumerate(
                files,
                start=1
            ):


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
                        output_file
                    )


                    total_processed += 1


                    # Progress
                    if (
                        index == 1
                        or index % 10 == 0
                        or index == len(files)
                    ):

                        print(
                            f"Processed "
                            f"{index}/{len(files)}"
                        )


                except Exception as e:

                    print()

                    print(
                        f"ERROR: {filename}"
                    )

                    print(
                        f"       {e}"
                    )


    print()
    print("=" * 70)

    print(
        "CLIENT 2 PROCESSING COMPLETED"
    )

    print("=" * 70)

    print()

    print(
        f"Total processed: "
        f"{total_processed}"
    )

    print()

    print(
        "Updated dataset:"
    )

    print(
        OUTPUT_ROOT
    )


# ============================================================
# CREATE ONE COMPARISON
# ============================================================

def create_comparison():

    print()
    print("=" * 70)

    print(
        "CREATING ONE CLIENT 2 COMPARISON"
    )

    print("=" * 70)


    # --------------------------------------------------------
    # Find sample
    # --------------------------------------------------------

    demo_directory = os.path.join(
        SOURCE_ROOT,
        "test",
        "NORMAL"
    )


    if not os.path.isdir(
        demo_directory
    ):

        print(
            "Client 2 test/NORMAL not found."
        )

        return


    files = [

        f

        for f in os.listdir(
            demo_directory
        )

        if f.lower().endswith(
            (
                ".jpg",
                ".jpeg",
                ".png",
                ".bmp"
            )
        )
    ]


    files.sort()


    if not files:

        print(
            "No sample image found."
        )

        return


    source_file = os.path.join(
        demo_directory,
        files[0]
    )


    # ========================================================
    # Temporary de-identified image
    # ========================================================

    os.makedirs(
        TEMP_ROOT,
        exist_ok=True
    )


    temp_file = os.path.join(
        TEMP_ROOT,
        "comparison_deidentified.jpg"
    )


    # ========================================================
    # DE-IDENTIFY
    # ========================================================

    deidentify_and_save(
        input_path=source_file,
        output_path=temp_file
    )


    # ========================================================
    # READ IMAGES
    # ========================================================

    original = cv2.imread(
        source_file
    )


    deidentified = cv2.imread(
        temp_file
    )


    if original is None:

        print(
            "Could not read original image."
        )

        return


    if deidentified is None:

        print(
            "Could not read de-identified image."
        )

        return


    # ========================================================
    # RESIZE
    # ========================================================

    width = 500


    height = int(
        original.shape[0]
        * width
        / original.shape[1]
    )


    original = cv2.resize(
        original,
        (
            width,
            height
        )
    )


    deidentified = cv2.resize(
        deidentified,
        (
            width,
            height
        )
    )


    # ========================================================
    # TITLE SPACE
    # ========================================================

    title_height = 60


    original_panel = cv2.copyMakeBorder(
        original,
        title_height,
        0,
        0,
        0,
        cv2.BORDER_CONSTANT,
        value=(0, 0, 0)
    )


    deidentified_panel = cv2.copyMakeBorder(
        deidentified,
        title_height,
        0,
        0,
        0,
        cv2.BORDER_CONSTANT,
        value=(0, 0, 0)
    )


    # ========================================================
    # TITLES
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
    # COMBINE
    # ========================================================

    comparison = cv2.hconcat(
        [
            original_panel,
            deidentified_panel
        ]
    )


    # ========================================================
    # SAVE
    # ========================================================

    os.makedirs(
        RESULTS_ROOT,
        exist_ok=True
    )


    comparison_file = os.path.join(
        RESULTS_ROOT,
        "client2_deidentification_comparison.jpg"
    )


    cv2.imwrite(
        comparison_file,
        comparison
    )


    print()
    print(
        "Comparison saved:"
    )

    print(
        comparison_file
    )


    # ========================================================
    # OPEN
    # ========================================================

    try:

        os.startfile(
            comparison_file
        )

    except Exception:

        pass


    # ========================================================
    # CLEANUP
    # ========================================================

    try:

        os.remove(
            temp_file
        )

    except OSError:

        pass


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 70)

    print(
        "CLIENT 2 PREPROCESSING"
    )

    print("=" * 70)

    print()
    print(
        "Client 1: NOT TOUCHED"
    )

    print(
        "Client 2: DE-IDENTIFICATION + CLAHE + RESIZE"
    )

    print(
        "Client 3: NOT TOUCHED"
    )

    print()


    # --------------------------------------------------------
    # Process Client 2
    # --------------------------------------------------------

    process_client2()


    # --------------------------------------------------------
    # Create ONE comparison
    # --------------------------------------------------------

    create_comparison()


    print()
    print("=" * 70)

    print(
        "CLIENT 2 PIPELINE FINISHED"
    )

    print("=" * 70)

    print()
    print(
        "Processed data:"
    )

    print(
        OUTPUT_ROOT
    )

    print()
    print(
        "Comparison:"
    )

    print(
        os.path.join(
            RESULTS_ROOT,
            "client2_deidentification_comparison.jpg"
        )
    )