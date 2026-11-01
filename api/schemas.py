"""
MEDIFED AI — Pydantic v2 request/response schemas.
"""

from pydantic import BaseModel, Field
from typing import Dict, Optional
from datetime import datetime


class HealthResponse(BaseModel):
    """Response schema for GET /health."""
    status: str = Field(description="Service status: 'healthy' or 'degraded'")
    model_loaded: bool = Field(description="Whether the ResNet-50 model is loaded")
    device: str = Field(description="Compute device: 'cuda' or 'cpu'")
    checkpoint: str = Field(description="Loaded checkpoint filename")
    uptime_seconds: float = Field(description="Service uptime in seconds")
    timestamp: str = Field(description="Current server timestamp (ISO 8601)")


class PredictionResponse(BaseModel):
    """Response schema for POST /predict."""
    predicted_class: str = Field(description="NORMAL or PNEUMONIA")
    probabilities: Dict[str, float] = Field(description="Class probabilities")
    confidence: float = Field(description="Confidence of predicted class")
    gradcam_base64: str = Field(description="Base64-encoded Grad-CAM heatmap JPEG")
    original_base64: str = Field(description="Base64-encoded preprocessed original JPEG")
    model_checkpoint: str = Field(description="Checkpoint used for inference")
    inference_time_ms: float = Field(description="Total inference time in milliseconds")


class MetricsResponse(BaseModel):
    """Response schema for GET /metrics."""
    model: str
    strategy: str
    optimizer: str
    total_rounds: int
    test_set_size: int
    rounds: dict
    client_wise_round_3: dict
    federation: dict


class FederationRoundsResponse(BaseModel):
    """Response schema for GET /federation/rounds."""
    total_rounds: int
    strategy: str
    mu: float
    rounds: list


class ClientInfo(BaseModel):
    """Single client metadata."""
    client_id: str
    name: str
    dataset_source: str
    train_size: int
    test_size: int
    characteristics: str


class FederationClientsResponse(BaseModel):
    """Response schema for GET /federation/clients."""
    num_clients: int
    clients: list[ClientInfo]


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
    error_code: Optional[str] = None
