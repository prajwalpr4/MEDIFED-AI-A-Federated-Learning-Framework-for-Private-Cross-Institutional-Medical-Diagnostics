"""
MEDIFED AI — FastAPI Application Entry Point.

Provides:
  GET  /health            — Model status, device, uptime
  POST /predict           — X-ray inference + Grad-CAM
  GET  /metrics           — Verified research metrics
  GET  /federation/rounds — Training round timeline
  GET  /federation/clients — Client metadata
"""

import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.config import (
    CORS_ORIGINS,
    MAX_UPLOAD_SIZE,
    ALLOWED_MIME_TYPES,
    DEVICE,
    MODEL_CHECKPOINT_PATH,
    VERIFIED_METRICS,
)
from api.schemas import (
    HealthResponse,
    PredictionResponse,
    MetricsResponse,
    FederationRoundsResponse,
    FederationClientsResponse,
    ClientInfo,
    ErrorResponse,
)
from api.inference_service import inference_service

# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-20s | %(levelname)-7s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("medifed.api")

# ============================================================
# APPLICATION LIFESPAN
# ============================================================

_start_time = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup, cleanup on shutdown."""
    global _start_time
    _start_time = time.time()

    logger.info("=" * 60)
    logger.info("  MEDIFED AI — Federated Medical Intelligence")
    logger.info("  FastAPI ML Microservice Starting...")
    logger.info("=" * 60)

    try:
        inference_service.load_model()
        logger.info("🚀 Service ready for inference requests.")
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        # Service starts in degraded mode

    yield

    logger.info("Shutting down MEDIFED AI service.")


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="MEDIFED AI — ML Microservice",
    description=(
        "Federated Medical Intelligence inference API. "
        "Wraps the ResNet-50 global model trained via FedProx "
        "for chest X-ray pneumonia classification with Grad-CAM explainability."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ENDPOINTS
# ============================================================

@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Service health check",
)
async def health():
    """Returns model status, device, checkpoint info, and uptime."""
    return HealthResponse(
        status="healthy" if inference_service.is_loaded else "degraded",
        model_loaded=inference_service.is_loaded,
        device=str(DEVICE),
        checkpoint=MODEL_CHECKPOINT_PATH.name if inference_service.is_loaded else "none",
        uptime_seconds=round(inference_service.uptime_seconds, 1),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post(
    "/predict",
    response_model=PredictionResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    tags=["Inference"],
    summary="Analyze chest X-ray image",
)
async def predict(file: UploadFile = File(..., description="Chest X-ray image (JPEG or PNG)")):
    """
    Accepts a chest X-ray image, runs CLAHE preprocessing,
    ResNet-50 inference, and Grad-CAM heatmap generation.
    Returns predicted class, probabilities, and visualization.
    """
    # Validate model is loaded
    if not inference_service.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Service is in degraded mode."
        )

    # Validate content type
    content_type = file.content_type
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {content_type}. Allowed: JPEG, PNG."
        )

    # Read and validate file size
    image_bytes = await file.read()
    if len(image_bytes) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {len(image_bytes) / (1024*1024):.1f} MB. Maximum: 10 MB."
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="Empty file uploaded."
        )

    # Validate magic bytes (JPEG: FF D8 FF, PNG: 89 50 4E 47)
    if image_bytes[:3] == b'\xff\xd8\xff':
        pass  # Valid JPEG
    elif image_bytes[:4] == b'\x89PNG':
        pass  # Valid PNG
    else:
        raise HTTPException(
            status_code=400,
            detail="File content does not match a valid JPEG or PNG image."
        )

    try:
        result = inference_service.run_inference(image_bytes)
        return PredictionResponse(**result)
    except Exception as e:
        logger.error(f"Inference failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Inference failed: {str(e)}"
        )


@app.get(
    "/metrics",
    response_model=MetricsResponse,
    tags=["Research"],
    summary="Verified research performance metrics",
)
async def metrics():
    """Returns verified research metrics from the journal paper."""
    return MetricsResponse(**VERIFIED_METRICS)


@app.get(
    "/federation/rounds",
    response_model=FederationRoundsResponse,
    tags=["Research"],
    summary="Federation training round timeline",
)
async def federation_rounds():
    """Returns checkpoint timeline and communication round details."""
    rounds_data = []
    for round_key, round_metrics in VERIFIED_METRICS["rounds"].items():
        round_num = int(round_key.split("_")[1])
        entry = {
            "round": round_num,
            "checkpoint": f"global_round_{round_num:02d}.pth",
            "pooled_metrics": round_metrics.get("pooled", {}),
        }
        if "confusion_matrix" in round_metrics:
            entry["confusion_matrix"] = round_metrics["confusion_matrix"]
        if "validation_accuracy" in round_metrics:
            entry["validation_accuracy"] = round_metrics["validation_accuracy"]
        rounds_data.append(entry)

    return FederationRoundsResponse(
        total_rounds=VERIFIED_METRICS["total_rounds"],
        strategy=VERIFIED_METRICS["federation"]["strategy"],
        mu=VERIFIED_METRICS["federation"]["mu"],
        rounds=rounds_data,
    )


@app.get(
    "/federation/clients",
    response_model=FederationClientsResponse,
    tags=["Research"],
    summary="Federation client metadata",
)
async def federation_clients():
    """Returns metadata for the three hospital clients."""
    clients = [
        ClientInfo(
            client_id="client_1",
            name="Hospital A — Kaggle Pediatric Center",
            dataset_source="Kaggle Chest X-ray (Kermany et al., 2018)",
            train_size=5216,
            test_size=624,
            characteristics="Largest cohort, well-balanced, pediatric population"
        ),
        ClientInfo(
            client_id="client_2",
            name="Hospital B — Chittagong Medical Center",
            dataset_source="Chittagong Medical College Hospital Dataset",
            train_size=560,
            test_size=110,
            characteristics="Smallest cohort, domain shift, adult population, non-IID"
        ),
        ClientInfo(
            client_id="client_3",
            name="Hospital C — Bhopal Memorial Research Centre",
            dataset_source="Bhopal Memorial Hospital Research Dataset",
            train_size=3050,
            test_size=513,
            characteristics="Mixed demographics, industrial exposure cohort"
        ),
    ]

    return FederationClientsResponse(
        num_clients=3,
        clients=clients,
    )


# ============================================================
# MAIN ENTRY POINT
# ============================================================

if __name__ == "__main__":
    import uvicorn
    from api.config import API_HOST, API_PORT

    uvicorn.run(
        "api.main:app",
        host=API_HOST,
        port=API_PORT,
        reload=True,
        log_level="info",
    )
