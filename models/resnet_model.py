import torch.nn as nn
from torchvision.models import resnet50, ResNet50_Weights


def create_resnet50(num_classes=2, pretrained=True):
    """
    Create ResNet-50 for chest X-ray classification.

    Class 0 = NORMAL
    Class 1 = PNEUMONIA
    """

    if pretrained:
        weights = ResNet50_Weights.DEFAULT
    else:
        weights = None

    model = resnet50(weights=weights)

    # Replace ImageNet's 1000-class classifier
    # with our 2-class pneumonia classifier.
    in_features = model.fc.in_features

    model.fc = nn.Linear(
        in_features,
        num_classes
    )

    return model