# CHAPTER 5: IMPLEMENTATION

---

## 5.1 INSTALLATION STEPS

This section provides an exhaustive, step-by-step engineering and deployment guide for the **MEDIFED AI** federated medical diagnostic framework. The platform consists of a distributed architecture comprising:
1. **Core Machine Learning & Federated Learning Engine**: Built with PyTorch, Torchvision, OpenCV, and Flower (`flwr`).
2. **FastAPI Asynchronous Inference Microservice**: Serving the global ResNet-50 checkpoint and real-time Layer4 Grad-CAM spatial heatmap hooks over RESTful endpoints.
3. **Multi-Tenant Supabase Cloud Infrastructure**: PostgreSQL relational database with Row-Level Security (RLS) policies and S3-compatible cloud object storage buckets for isolated hospital silos.
4. **MEDIFED AI Enterprise Clinical Portal**: Full-stack Next.js 16 (App Router), React 19, and Tailwind CSS responsive interface with live Grad-CAM visual opacity blending and Google Gemini 2.5 Flash clinical diagnosis synthesis.
5. **Interactive Fallback Streamlit Suite**: Standalone physician inspection dashboard for legacy or low-compute hospital terminals.

---

### 5.1.1 System Requirements & Hardware Specifications

Before installing the platform, ensure the target host machine meets the following computational and environmental requirements:

#### 1. Hardware Specifications
- **Central Processing Unit (CPU)**: Minimum 4 Cores (Intel Core i5 / AMD Ryzen 5 or higher); 8+ Cores recommended for parallel local client simulations.
- **Random Access Memory (RAM)**:
  - Minimum: 16 GB DDR4/DDR5.
  - Recommended: 32 GB DDR4/DDR5 (necessary when caching multi-client preprocessed radiograph tensors).
- **Graphics Processing Unit (GPU)**:
  - Minimum: NVIDIA GeForce GTX 1660 Ti / RTX 3050 (4 GB VRAM).
  - Recommended: NVIDIA RTX 3060 / 3080 / 4090, A100, or V100 with at least 8 GB VRAM supporting CUDA compute capability $\ge 7.0$.
  - *Note*: CPU-only fallback execution is fully supported for testing via PyTorch's native dynamic device selector (`device = "cuda" if torch.cuda.is_available() else "cpu"`).
- **Persistent Disk Storage**: Minimum 20 GB of free solid-state drive (SSD) storage for dataset partitions, virtual environments, node dependencies, and model checkpoints.

#### 2. Software & Operating System Requirements
- **Operating System**: Windows 10/11 (64-bit), Ubuntu Linux 20.04/22.04 LTS, or macOS 13+ (Apple Silicon supported via MPS).
- **Python Runtime**: Python version `3.10` or `3.11` (Python 3.11.x 64-bit recommended).
- **Node.js Runtime**: Node.js `v18.18.0` or `v20.x` LTS with Node Package Manager (`npm` v9+ or `pnpm` v8+).
- **Git Version Control**: Git version 2.35 or higher.
- **NVIDIA Drivers & CUDA Toolkit**: CUDA 11.8 or 12.1 with corresponding cuDNN v8.x+ (for hardware acceleration).

---

### 5.1.2 Repository Structure & Preparation

Clone the project repository to your local drive and inspect the root workspace:

```powershell
# Clone the repository
git clone https://github.com/prajwalpr4/MEDIFED-AI-A-Federated-Learning-Framework-for-Private-Cross-Institutional-Medical-Diagnostics.git

# Navigate to the project root directory
cd "MEDIFED-AI-A-Federated-Learning-Framework-for-Private-Cross-Institutional-Medical-Diagnostics"
```

The unified workspace contains the following architectural layout:

```text
Federated-Medical-Diagnostics/
├── api/                             # FastAPI Machine Learning Microservice
│   ├── config.py                    # Microservice parameters, CORS, and paths
│   ├── inference_service.py         # Singleton model manager and Grad-CAM executor
│   ├── main.py                      # FastAPI routes (/predict, /health, /metrics)
│   └── schemas.py                   # Pydantic validation models
├── evaluation/                      # Model benchmark & matrix evaluation scripts
│   ├── compare_models.py            # Centralized vs Federated benchmark metrics
│   ├── confusion_matrix.py          # Multi-class and client-wise confusion matrices
│   └── evaluate_global_model.py     # Independent hold-out validation script
├── explainability/                  # Clinical XAI & Heatmap Synthesis
│   ├── app.py                       # Standalone Streamlit clinical prototype
│   └── gradcam.py                   # PyTorch Layer4 Grad-CAM activation hooks
├── federated/                       # Flower (flwr) Federated Learning Architecture
│   ├── client/                      # Local client code with FedProx loss
│   │   └── client.py                # Flower NumPyClient with proximal regularization
│   ├── server/                      # Central Coordinator Aggregation
│   │   └── server.py                # FedAvg/FedProx server saving global rounds
│   └── config.py                    # Hyperparameters (mu, epochs, lr, batch_size)
├── frontend/                        # MEDIFED AI Next.js 16 Web Portal
│   ├── public/                      # Static assets, research gallery images
│   ├── src/
│   │   ├── app/                     # Next.js App Router endpoints & layouts
│   │   │   ├── api/                 # Next.js edge & node proxy routes
│   │   │   │   ├── ai/clinical-summary/ # Google Gemini 2.5 Flash route
│   │   │   │   └── cases/save/      # Authorized Supabase save route
│   │   │   ├── auth/sign-in/        # Zero-scroll clinical authentication portal
│   │   │   ├── hospital/            # Hospital node command centers & analyzer
│   │   │   │   ├── analyze/         # Live radiograph ingestion & Grad-CAM viewer
│   │   │   │   ├── cases/           # Multi-tenant isolated case registry
│   │   │   │   └── dashboard/       # Institutional analytics dashboard
│   │   │   └── admin/               # Global coordinator overview & metrics
│   │   ├── components/              # Reusable React 19 UI components
│   │   └── lib/                     # Supabase client, auth context, API client
│   ├── .env.local                   # Frontend environment secrets
│   └── package.json                 # Node dependencies
├── models/                          # ResNet-50 definition & stored weights
│   ├── checkpoints/federated/       # Global round checkpoints (rounds 01, 02, 03)
│   └── resnet_model.py              # PyTorch ResNet-50 binary transfer architecture
├── preprocessing/                   # Medical image preprocessing pipeline
│   ├── dataset.py                   # PyTorch Dataset implementation
│   ├── save_preprocessed.py         # OCR masking & CLAHE offline preparation
│   └── transforms.py                # CLAHE transform & standard normalizations
├── supabase/                        # Database migrations & SQL deployment
│   ├── all_in_one_setup.sql         # 1-Click complete database & storage deployment
│   └── migrations/                  # Incremental schema evolution scripts (001-005)
├── requirements.txt                 # Python pip dependency manifest
└── README.md                        # Project documentation and quickstart
```

---

### 5.1.3 Python Virtual Environment & Dependency Installation

To prevent library conflicts and ensure strict reproducibility, configure an isolated Python virtual environment:

#### Step 1: Create and Activate Virtual Environment

**On Windows (PowerShell):**
```powershell
# Create virtual environment named .venv
python -m venv .venv

# If script execution is restricted on Windows, enable RemoteSigned:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# Activate the virtual environment
.\.venv\Scripts\Activate.ps1
```

**On Linux / macOS (Bash/Zsh):**
```bash
# Create virtual environment
python3 -m venv .venv

# Activate the virtual environment
source .venv/bin/activate
```

#### Step 2: Upgrade Pip and Build Tools
```powershell
python -m pip install --upgrade pip setuptools wheel
```

#### Step 3: Install Core ML & Microservice Dependencies
Execute the pip installation targeting `requirements.txt`:
```powershell
pip install -r requirements.txt
```

#### Verification of Critical Dependencies:
Ensure key packages are correctly resolved:
```powershell
python -c "import torch, torchvision, flwr, cv2, fastapi; print(f'PyTorch: {torch.__version__} | CUDA Available: {torch.cuda.is_available()} | Flower: {flwr.__version__}')"
```
*Expected Output:*
```text
PyTorch: 2.x.x+cu121 | CUDA Available: True | Flower: 1.x.x
```

---

### 5.1.4 Supabase Cloud Database & Storage Setup

MEDIFED AI utilizes Supabase (managed PostgreSQL and S3-compatible cloud storage) to achieve strict multi-tenant isolation across Hospital A, Hospital B, and Hospital C.

#### Step 1: Create a Free Supabase Project
1. Navigate to [https://supabase.com](https://supabase.com) and log in or register.
2. Click **New Project**.
3. Set the Project Name: `MEDIFED-AI-Diagnostics`.
4. Choose a strong Database Password and select your nearest geographical region.
5. Wait approximately 2 minutes for cluster provisioning.

#### Step 2: Execute 1-Click Database & Storage Schema
1. In the Supabase Dashboard, select **SQL Editor** from the left-hand navigation pane.
2. Click **New Query**.
3. Open the file **`supabase/all_in_one_setup.sql`** located in your cloned repository.
4. Copy the entire file contents and paste them into the SQL Editor.
5. Click **Run** (or press <kbd>Ctrl</kbd> + <kbd>Enter</kbd>).

*What this script automatically establishes in a single atomic transaction:*
- **UUID Extension**: Generates cryptographic UUIDv4 keys.
- **Relational Tables**:
  - `hospitals`: Stores participating hospital metadata (Hospitals A, B, and C).
  - `profiles`: Role-based authentication records (`admin` vs. `hospital_user`).
  - `cases_hospital_a`: Isolated diagnostic cases table for Hospital A (Kaggle Pediatric).
  - `cases_hospital_b`: Isolated diagnostic cases table for Hospital B (Chittagong Medical).
  - `cases_hospital_c`: Isolated diagnostic cases table for Hospital C (Bhopal Memorial).
  - `cases`: Fallback unified table.
  - `audit_logs`: Immutable clinical compliance tracking table.
- **Dedicated Cloud Storage Buckets**:
  - `hospital-a-cases`: Private storage partition for Hospital A raw & Grad-CAM scans.
  - `hospital-b-cases`: Private storage partition for Hospital B raw & Grad-CAM scans.
  - `hospital-c-cases`: Private storage partition for Hospital C raw & Grad-CAM scans.
- **Row-Level Security (RLS)**: Enforces zero cross-hospital tenant leakage while granting read/write authorization.
- **Baseline Seed Data**: Pre-populates institutional cohort identifiers and initial test cases.

#### Step 3: Retrieve Supabase API Credentials
1. In your Supabase dashboard, click the **Settings** (gear) icon $\rightarrow$ **API**.
2. Copy the following keys:
   - **Project URL**: `https://<your-project-id>.supabase.co`
   - **Project API Keys &rarr; `anon` `public`**: Anonymous client public key.
   - **Project API Keys &rarr; `service_role` `secret`**: Elevated server key (used by Next.js API routes).

---

### 5.1.5 Frontend Environment Configuration

Configure the Next.js frontend environment variables to connect the user interface to Supabase and the FastAPI backend:

1. Open or create the file `frontend/.env.local`.
2. Populate the parameters as shown below:

```env
# ============================================================
# MEDIFED AI — Frontend Local Environment (.env.local)
# ============================================================

# Supabase URL & Public Anonymous Key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key

# Supabase Service Role Key (Used exclusively by server-side API routes)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-service-role-key

# FastAPI Microservice URL (Default: Port 8000)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Google Gemini API Key (Enables live Gemini 2.5 Flash diagnostic conclusions)
# Get a free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
```

---

### 5.1.6 Running the Application Services

To operate the full federated clinical intelligence system, launch two concurrent terminal instances:

#### Terminal 1: Launch FastAPI ML Microservice (Backend)
Open a terminal in the project root directory with the Python virtual environment activated:

```powershell
# Ensure virtual environment is active
.\.venv\Scripts\Activate.ps1

# Start the uvicorn ASGI server on port 8000
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

*Verification Indicators:*
- Console will print:
  ```text
  INFO:     MEDIFED AI — ML Microservice Starting...
  INFO:     Loading model from: models/checkpoints/federated/global_round_03.pth
  INFO:     Device: cuda (or cpu)
  INFO:     ✅ Model loaded successfully.
  INFO:     Application startup complete. Uvicorn running on http://0.0.0.0:8000
  ```
- **Health Endpoint**: Open `http://localhost:8000/health` &rarr; Returns `{"status": "healthy", "model_loaded": true}`.
- **Swagger Documentation**: Open `http://localhost:8000/docs` to inspect the live OpenAPI schema.

#### Terminal 2: Launch Next.js Enterprise Web Portal (Frontend)
Open a second terminal window and navigate into the `frontend/` folder:

```powershell
# Navigate to frontend directory
cd frontend

# Install Node.js package dependencies
npm install

# Start the Next.js development server
npm run dev
```

*Verification Indicators:*
- Console will print:
  ```text
  ▲ Next.js 16.0.x
  - Local:        http://localhost:3000
  - Environments: .env.local
  ✓ Ready in 1400ms
  ```
- Open `http://localhost:3000` in any web browser to access the live portal.

---

### 5.1.7 Verification & End-to-End Workflow Testing

To verify that the complete pipeline is fully functional from image ingestion to cloud database persistence:

1. **Access Portal**: Open `http://localhost:3000` in your browser.
2. **Authenticate**: Click **Sign In to Clinical Portal** (`/auth/sign-in`). Select any of the pre-configured clinical evaluator profiles (e.g., **Hospital A Clinician**).
3. **Launch Analyzer**: Navigate to **Analyze X-Ray** (`/hospital/analyze`).
4. **Run Inference**:
   - Click one of the pre-loaded 1-Click Research Test Scans (e.g. *Hospital A Scan 1 - PNEUMONIA*), or drag-and-drop a DICOM-export JPEG/PNG radiograph.
   - Click **Run Federated Model Inference**.
   - Observe the real-time execution steps: CLAHE filtering &rarr; ResNet-50 tensor forward pass &rarr; Grad-CAM backward pass.
5. **Inspect Visual Explainability**:
   - Adjust the **Heatmap Overlay Blend** slider (0% to 100%) to inspect the exact Layer4 activation concentration over pulmonary consolidations.
6. **Review Gemini AI Diagnostic Conclusion**:
   - Confirm that the **AI Diagnostic Conclusion & Radiologic Impression** card generates live via **Gemini 2.5 Flash**, rendering:
     - 🩺 Primary Diagnostic Impression
     - 🔬 Radiological & Grad-CAM Spatial Correlation
     - 📋 Recommended Clinical Next Steps
7. **Persist to Cloud Registry**:
   - Enter optional notes in **Clinician Impression & Notes**.
   - Click **Save Diagnostic Case to Hospital Registry**.
   - Confirm that the record is stored in your designated Supabase table (`cases_hospital_a`) with full isolation and that the radiograph images are saved in bucket `hospital-a-cases`.
8. **Inspect Case Registry & Formal Report**:
   - Navigate to **Case Registry** (`/hospital/cases`).
   - Click **AI Lens** (`/hospital/cases/[id]/explain`) to examine historical gradient maps.
   - Click **Print Clinical Report** (`/hospital/cases/[id]/report`) to preview the formal printable PDF document.

---

### 5.1.8 Troubleshooting & Common Installation Issues

| Issue / Error Symptom | Root Cause | Resolution Step |
| :--- | :--- | :--- |
| `WinError 10013: An attempt was made to access a socket in a way forbidden by its access permissions` | Port 8000 is occupied by a orphaned background process or Windows service. | Kill process using port 8000: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force` or run uvicorn on `--port 8001`. |
| `torch.cuda.OutOfMemoryError: CUDA out of memory` | GPU VRAM exceeded during local client training or multi-batch evaluation. | In `federated/config.py`, reduce `BATCH_SIZE` from 32 to 16 or 8. Enable gradient accumulation or run on CPU with `DEVICE = "cpu"`. |
| `HTTP 404: models/gemini-1.5-flash is not found for API version v1beta` | Google AI Studio updated model names to Gemini 2.5 series. | Ensure `api/ai/clinical-summary/route.ts` specifies `models/gemini-2.5-flash:generateContent`. |
| `Supabase Storage Upload Error: Bucket not found` | Storage buckets not initialized in Supabase project. | Re-run `supabase/all_in_one_setup.sql` in Supabase SQL editor to create `hospital-a-cases`, `hospital-b-cases`, and `hospital-c-cases`. |
| `Broken radiograph thumbnails on Case Registry` | Passing transient browser `blob:http://...` URLs to server storage instead of Base64 buffers. | Handled automatically in `AnalyzePage` via `FileReader.readAsDataURL` converting selected files to true base64 URIs before cloud dispatch. |

---
---

## 5.2 PSEUDO CODE FOR THE MODULES

This section provides formal algorithmic specifications and structured pseudo-code for the five essential computational modules powering the MEDIFED AI platform:
- **Module 1**: Automated OCR De-Identification and Adaptive CLAHE Preprocessing.
- **Module 2**: Federated Client Local Optimization with Proximal Regularization (FedProx).
- **Module 3**: Federated Central Aggregation Server and Global Checkpointing.
- **Module 4**: Explainable AI (XAI) via PyTorch Layer4 Grad-CAM Synthesis.
- **Module 5**: Asynchronous REST Microservice and Multi-Modal Gemini AI Diagnostic Synthesis.

---

### 5.2.1 Module 1: Automated OCR De-Identification & Adaptive CLAHE Preprocessing

#### Purpose & Mathematical Formulation
Raw chest radiographs collected from legacy hospital archives often contain burned-in demographic text (patient name, age, scan date) that risks violating privacy laws and causes convolutional neural networks to learn superficial shortcut artifacts. 

Module 1 performs two sequential operations:
1. **OCR Text Masking**: An optical character recognition model scans the pixel matrix $\mathbf{I}_{\text{raw}} \in \mathbb{R}^{H \times W \times C}$. For any bounding box $B_i = (x_{\min}, y_{\min}, x_{\max}, y_{\max})$ detected with confidence $c_i \ge \tau_{\text{ocr}}$ ($\tau_{\text{ocr}} = 0.30$), all pixel intensities are masked to zero:
   $$\mathbf{I}_{\text{deid}}(x, y) = 0 \quad \forall (x, y) \in B_i$$
2. **Contrast Limited Adaptive Histogram Equalization (CLAHE)**: Converts the image to single-channel luminance, partitions it into non-overlapping contextual grid tiles of size $8 \times 8$, and computes local histograms. To prevent noise over-amplification in uniform pulmonary regions, histogram counts exceeding clip limit $\beta = 2.0$ are redistributed uniformly across all bins prior to cumulative distribution function (CDF) mapping.

#### Algorithmic Pseudo-Code

```text
================================================================================
ALGORITHM 1: Radiograph OCR De-Identification & Adaptive CLAHE Normalization
================================================================================
INPUT:
    I_raw          : Raw Input Radiograph Image Matrix of size (H x W x C)
    tau_ocr        : Text Detection Confidence Threshold (Default = 0.30)
    clip_limit     : CLAHE Histogram Clipping Limit beta (Default = 2.0)
    tile_grid_size : Contextual Tile Partition Grid (Default = 8 x 8)
    target_dim     : Model Input Spatial Resolution (Default = 224 x 224)
    mu_norm        : ImageNet Mean Channel Vector [0.485, 0.456, 0.406]
    sigma_norm     : ImageNet Std Dev Channel Vector [0.229, 0.224, 0.225]

OUTPUT:
    T_norm         : Normalized Input Tensor of size (3 x 224 x 224) ready for CNN

PROCEDURE:
1:  Initialize OCR_Engine with EasyOCR(languages=['en'])
2:  Initialize CLAHE_Engine with cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
3:  
4:  // ── Step 1: Text Detection and Demographics Masking ──
5:  detected_regions ← OCR_Engine.readtext(I_raw)
6:  I_deid ← Clone(I_raw)
7:  
8:  FOR EACH (bbox, text_string, confidence) IN detected_regions DO:
9:      IF confidence >= tau_ocr THEN:
10:         [x_min, y_min, x_max, y_max] ← ExtractBoundingCoordinates(bbox)
11:         // Zero out bounding box to obscure burned-in demographic data
12:         FOR x FROM x_min TO x_max DO:
13:             FOR y FROM y_min TO y_max DO:
14:                 I_deid[y, x, :] ← 0
15:             END FOR
16:         END FOR
17:     END IF
18: END FOR
19: 
20: // ── Step 2: Grayscale Conversion & CLAHE Enhancement ──
21: IF I_deid.channels == 3 THEN:
22:     I_gray ← ConvertColor(I_deid, RGB_TO_GRAY)
23: ELSE:
24:     I_gray ← I_deid
25: END IF
26: 
27: I_clahe ← CLAHE_Engine.apply(I_gray)
28: 
29: // ── Step 3: Reconstruction, Resizing & Tensor Normalization ──
30: I_enhanced_rgb ← ConvertColor(I_clahe, GRAY_TO_RGB)
31: I_resized ← BilinearInterpolate(I_enhanced_rgb, target_dim=(224, 224))
32: 
33: // Scale dynamic range to [0.0, 1.0]
34: T_float ← ToFloat32(I_resized) / 255.0
35: 
36: // Apply Channel-wise Z-Score Normalization
37: FOR channel c FROM 0 TO 2 DO:
38:     T_norm[c, :, :] ← (T_float[:, :, c] - mu_norm[c]) / sigma_norm[c]
39: END FOR
40: 
41: RETURN T_norm
================================================================================
```

---

### 5.2.2 Module 2: Federated Client Local Optimization with Proximal Regularization (FedProx)

#### Purpose & Mathematical Formulation
Under statistical heterogeneity (non-IID clinical client partitions across pediatric and adult cohorts), naive gradient averaging causes local weights to diverge from the global consensus. FedProx stabilizes client convergence by augmenting the local empirical cross-entropy loss $\mathcal{L}_k(w)$ with a quadratic proximal penalty parameterized by $\mu$:

$$\min_{w \in \mathbb{R}^d} F_k(w; w_t) = \mathcal{L}_k(w) + \frac{\mu}{2} \|w - w_t\|_2^2$$

where:
- $\mathcal{L}_k(w) = -\frac{1}{|\mathcal{B}|} \sum_{(x_i, y_i) \in \mathcal{B}} \left[ y_i \log \hat{y}_i + (1 - y_i) \log (1 - \hat{y}_i) \right]$
- $\frac{\mu}{2} \|w - w_t\|_2^2 = \frac{\mu}{2} \sum_{l=1}^L \sum_{p} (w^{(l)}_{p} - w_{t, p}^{(l)})^2$ restricts local weights $w$ from drifting excessively far from the round-$t$ global checkpoint $w_t$.

#### Algorithmic Pseudo-Code

```text
================================================================================
ALGORITHM 2: Federated Local Client Optimization with FedProx Regularization
================================================================================
INPUT:
    k              : Client Identifier (1 = Kaggle, 2 = Chittagong, 3 = Bhopal)
    w_t            : Global Model Checkpoint Parameters received from Coordinator
    D_k_train      : Local Client Training Radiograph Dataset
    E_local        : Number of Local Epochs per Round (Default = 1)
    B              : Local Batch Size (Default = 32)
    eta            : Learning Rate for AdamW Optimizer (Default = 0.0001)
    weight_decay   : L2 Weight Decay Regularization (Default = 0.0001)
    mu_prox        : FedProx Proximal Regularization Coefficient (Default = 0.01)

OUTPUT:
    w_k_updated    : Updated Local Parameter State Vector
    num_samples    : Number of Local Training Samples processed (|D_k_train|)
    train_metrics  : Dictionary of Round Loss and Accuracy Metrics

PROCEDURE:
1:  // ── Step 1: Initialize Model with Global Weights ──
2:  model_k ← InstantiateResNet50(num_classes=2)
3:  model_k.load_parameters(w_t)
4:  
5:  // Retain a frozen snapshot of the global parameters for proximal penalty
6:  w_global_snapshot ← DeepCopyParameters(model_k.trainable_parameters())
7:  
8:  optimizer ← AdamW(model_k.parameters(), lr=eta, weight_decay=weight_decay)
9:  criterion ← CrossEntropyLoss()
10: data_loader ← CreateDataLoader(D_k_train, batch_size=B, shuffle=True)
11: 
12: model_k.train()
13: total_samples ← Length(D_k_train)
14: accumulated_loss ← 0.0
15: correct_predictions ← 0
16: 
17: // ── Step 2: Local Epoch Training Loop ──
18: FOR epoch FROM 1 TO E_local DO:
19:     FOR EACH (batch_images, batch_labels) IN data_loader DO:
20:         batch_images ← batch_images.to(DEVICE)
21:         batch_labels ← batch_labels.to(DEVICE)
22:         
23:         optimizer.zero_grad()
24:         
25:         // Forward Pass
26:         logits ← model_k(batch_images)
27:         classification_loss ← criterion(logits, batch_labels)
28:         
29:         // Compute FedProx Quadratic Proximal Penalty Term
30:         proximal_term ← 0.0
31:         current_trainable_params ← model_k.trainable_parameters()
32:         
33:         FOR EACH (w_local, w_global) IN Zip(current_trainable_params, w_global_snapshot) DO:
34:             proximal_term ← proximal_term + Sum((w_local - w_global) ** 2)
35:         END FOR
36:         
37:         // Formulate Total Regularized Objective
38:         total_objective_loss ← classification_loss + (mu_prox / 2.0) * proximal_term
39:         
40:         // Backward Pass & Optimizer Step
41:         total_objective_loss.backward()
42:         optimizer.step()
43:         
44:         accumulated_loss ← accumulated_loss + (classification_loss.item() * batch_images.size(0))
45:         predictions ← ArgMax(logits, dim=1)
46:         correct_predictions ← correct_predictions + CountMatches(predictions, batch_labels)
47:     END FOR
48: END FOR
49: 
50: // ── Step 3: Package Updated Weights for Transmission ──
51: w_k_updated ← ExtractNumPyArrays(model_k.parameters())
52: train_metrics ← {
53:     "train_loss": accumulated_loss / total_samples,
54:     "train_accuracy": correct_predictions / total_samples
55: }
56: 
57: RETURN w_k_updated, total_samples, train_metrics
================================================================================
```

---

### 5.2.3 Module 3: Federated Central Aggregation Server & Global Checkpointing

#### Purpose & Mathematical Formulation
The central aggregation coordinator orchestrates communication rounds $t = 1, 2, \dots, T$. In each round:
1. The server broadcasts global model $w_t$ to all active participating client nodes.
2. Clients execute local FedProx updates and report back parameter vectors $w_k^{t+1}$ alongside local sample volumes $n_k$.
3. The server computes the federated weighted average proportional to client dataset representation:

$$w_{t+1} = \sum_{k=1}^K \frac{n_k}{N} w_k^{t+1} \quad \text{where} \quad N = \sum_{k=1}^K n_k$$

4. The global parameter checkpoint $w_{t+1}$ is serialized to disk (`global_round_XX.pth`) and dispatched for subsequent rounds or production inference.

#### Algorithmic Pseudo-Code

```text
================================================================================
ALGORITHM 3: Federated Coordinator Parameter Aggregation & Checkpoint Generation
================================================================================
INPUT:
    T_rounds       : Total Number of Federated Communication Rounds (Default = 3)
    K_clients      : Total Number of Participating Hospitals (K = 3)
    min_clients    : Minimum Active Hospital Quorum Required (Default = 3)
    checkpoint_dir : Directory to serialize model checkpoints ("models/checkpoints/federated")

OUTPUT:
    w_final        : Final Converged Global Model Parameter Set (Round 3)

PROCEDURE:
1:  // ── Step 1: Initialize Global Model ──
2:  global_resnet ← InstantiateResNet50(num_classes=2, pretrained=True)
3:  w_global ← ExtractNumPyArrays(global_resnet.parameters())
4:  EnsureDirectoryExists(checkpoint_dir)
5:  
6:  // ── Step 2: Federated Communication Rounds Loop ──
7:  FOR round t FROM 1 TO T_rounds DO:
8:      PRINT("==================================================")
9:      PRINT("STARTING FEDERATED ROUND: ", t, " OF ", T_rounds)
10:     PRINT("==================================================")
11:     
12:     // Await client check-in quorum
13:     connected_clients ← Server.AwaitQuorum(min_quorum=min_clients)
14:     
15:     // Broadcast global parameters w_global to all connected hospital nodes
16:     client_results ← []
17:     PARALLEL FOR EACH client_k IN connected_clients DO:
18:         w_k_updated, n_k, metrics_k ← client_k.fit(w_global, round_config={"round": t})
19:         client_results.append((w_k_updated, n_k, metrics_k))
20:     END PARALLEL FOR
21:     
22:     // ── Step 3: Sample-Weighted Federated Aggregation ──
23:     total_training_samples ← Sum([n_k FOR (_, n_k, _) IN client_results])
24:     num_layers ← Length(w_global)
25:     w_aggregated ← [ZerosLike(layer) FOR layer IN w_global]
26:     
27:     FOR layer_idx FROM 0 TO (num_layers - 1) DO:
28:         FOR EACH (w_k_updated, n_k, _) IN client_results DO:
29:             weight_ratio ← n_k / total_training_samples
30:             w_aggregated[layer_idx] ← w_aggregated[layer_idx] + (weight_ratio * w_k_updated[layer_idx])
31:         END FOR
32:     END FOR
33:     
34:     w_global ← w_aggregated
35:     
36:     // ── Step 4: Update Global PyTorch Architecture & Save Checkpoint ──
37:     AssignParametersToModel(global_resnet, w_global)
38:     checkpoint_filename ← Format("{}/global_round_{:02d}.pth", checkpoint_dir, t)
39:     torch.save(global_resnet.state_dict(), checkpoint_filename)
40:     
41:     PRINT("Global model checkpoint successfully serialized to: ", checkpoint_filename)
42: END FOR
43: 
44: RETURN w_global
================================================================================
```

---

### 5.2.4 Module 4: Explainable AI (XAI) via PyTorch Layer4 Grad-CAM Synthesis

#### Purpose & Mathematical Formulation
To convert the black-box ResNet-50 predictions into transparent radiological exhibits, Module 4 executes Gradient-weighted Class Activation Mapping (Grad-CAM) targeting the final convolutional bottleneck stage (`model.layer4[-1]`):

1. **Forward Pass**: Evaluates class score $y^c$ for the target diagnostic class $c \in \{\text{NORMAL}, \text{PNEUMONIA}\}$.
2. **Backward Gradient Hook**: Extracts gradients of $y^c$ with respect to spatial feature activation maps $A^k \in \mathbb{R}^{u \times v}$ of the target layer:
   $$\frac{\partial y^c}{\partial A^k_{i, j}}$$
3. **Neuron Importance Weights ($\alpha_k^c$)**: Computed via global average pooling over spatial dimensions $(u \times v = 7 \times 7)$:
   $$\alpha_k^c = \frac{1}{u \cdot v} \sum_{i=1}^u \sum_{j=1}^v \frac{\partial y^c}{\partial A^k_{i, j}}$$
4. **Rectified Linear Activation Map**: Linear combination of feature maps weighted by $\alpha_k^c$, followed by a $\text{ReLU}$ gate to isolate features that positively correlate with the diagnosis:
   $$L^c_{\text{Grad-CAM}} = \text{ReLU}\left( \sum_k \alpha_k^c A^k \right)$$
5. **Alpha Blending**: The heatmap is upscaled via bilinear interpolation to match the native radiograph resolution $(224 \times 224)$ and mapped through the OpenCV `COLORMAP_JET` spectrum:
   $$\mathbf{I}_{\text{composite}} = (1 - \gamma) \cdot \mathbf{I}_{\text{raw}} + \gamma \cdot \mathbf{H}_{\text{jet}}$$
   where $\gamma \in [0.0, 1.0]$ represents the physician's interactive blend opacity.

#### Algorithmic Pseudo-Code

```text
================================================================================
ALGORITHM 4: PyTorch Layer4 Grad-CAM Spatial Heatmap Synthesis
================================================================================
INPUT:
    model          : Trained ResNet-50 PyTorch Model loaded in evaluation mode
    input_tensor   : Preprocessed Radiograph Tensor of size (1 x 3 x 224 x 224)
    raw_pil_image  : Original Patient Radiograph PIL Image
    blend_alpha    : Heatmap Opacity Alpha Coefficient (Default = 0.65)

OUTPUT:
    predicted_class : Diagnostic Outcome Label ("NORMAL" or "PNEUMONIA")
    confidence      : Model Decision Confidence Score in range [0.0, 1.0]
    probabilities   : Normalized Softmax Probability Distribution Vector
    composite_image : Combined Radiograph with Grad-CAM Color Heatmap Overlay

PROCEDURE:
1:  target_layer ← model.layer4[-1]   // Final 2048-channel residual bottleneck block
2:  activations ← []
3:  gradients ← []
4:  
5:  // Register PyTorch Forward & Backward Hooks
6:  hook_fwd ← target_layer.register_forward_hook(
7:      FUNCTION(module, input, output): activations.append(output)
8:  )
9:  hook_bwd ← target_layer.register_full_backward_hook(
10:     FUNCTION(module, grad_input, grad_output): gradients.append(grad_output[0])
11: )
12: 
13: // ── Step 1: Forward Pass & Softmax Inference ──
14: logits ← model(input_tensor)
15: probabilities ← Softmax(logits, dim=1)
16: predicted_class_idx ← ArgMax(probabilities, dim=1).item()
17: confidence ← probabilities[0, predicted_class_idx].item()
18: predicted_class ← ("PNEUMONIA" IF predicted_class_idx == 1 ELSE "NORMAL")
19: 
20: // ── Step 2: Backward Pass for Target Diagnostic Class ──
21: model.zero_grad()
22: target_score ← logits[0, predicted_class_idx]
23: target_score.backward(retain_graph=True)
24: 
25: // Remove hooks to prevent memory leakage
26: hook_fwd.remove()
27: hook_bwd.remove()
28: 
29: // ── Step 3: Compute Neuron Importance Weights (alpha) ──
30: grad_tensor ← gradients[0]      // Size: (1, 2048, 7, 7)
31: act_tensor ← activations[0]      // Size: (1, 2048, 7, 7)
32: 
33: // Global Average Pooling over spatial dimensions (height, width)
34: alpha_weights ← Mean(grad_tensor, dimensions=[2, 3])  // Size: (1, 2048)
35: 
36: // ── Step 4: Weighted Linear Combination & ReLU Gating ──
37: cam_map ← Zeros(shape=(7, 7))
38: FOR channel k FROM 0 TO 2047 DO:
39:     cam_map ← cam_map + (alpha_weights[0, k] * act_tensor[0, k, :, :])
40: END FOR
41: 
42: cam_map ← Maximum(cam_map, 0.0)   // Apply ReLU to isolate positive evidence
43: cam_normalized ← (cam_map - Min(cam_map)) / (Max(cam_map) - Min(cam_map) + 1e-8)
44: 
45: // ── Step 5: Bilinear Upsampling & Jet Color Mapping ──
46: cam_resized ← ResizeBilinear(cam_normalized, target_size=(224, 224))
47: heatmap_color ← ApplyColorMap(ToUint8(cam_resized * 255), COLORMAP_JET)
48: 
49: // Normalize raw image to float32 matrix
50: base_rgb ← ToFloat32(Resize(raw_pil_image, size=(224, 224))) / 255.0
51: heatmap_rgb ← ToFloat32(heatmap_color) / 255.0
52: 
53: // Synthesize Final Alpha-Blended Visualization
54: composite_image ← (1.0 - blend_alpha) * base_rgb + blend_alpha * heatmap_rgb
55: composite_image ← Clamp(composite_image, 0.0, 1.0)
56: 
57: RETURN predicted_class, confidence, probabilities, composite_image
================================================================================
```

---

### 5.2.5 Module 5: Asynchronous REST Microservice & Gemini 2.5 Flash Clinical Synthesis

#### Purpose & Multi-Modal LLM Formulation
Module 5 integrates the PyTorch machine learning microservice (`api/main.py`) with Google's multi-modal **Gemini 2.5 Flash** large language model (`/api/ai/clinical-summary`). 

When an inference request is posted:
1. The FastAPI microservice evaluates the scan via Module 4, returning diagnostic metrics and Base64-encoded Grad-CAM heatmaps.
2. The Next.js AI pipeline constructs a multi-modal prompt containing:
   - Quantitative ResNet-50 metrics: Predicted class, model confidence, class probabilities.
   - Spatial Layer4 activation context.
   - The radiograph image transmitted as Base64 `inline_data`.
3. Gemini 2.5 Flash acts as a board-certified thoracic radiologist assistant, producing structured diagnostic impressions, spatial heatmap correlations, and clinical next steps. If network limits or missing API keys occur, a deterministic medical synthesis engine provides immediate clinical continuity without system failure.

#### Algorithmic Pseudo-Code

```text
================================================================================
ALGORITHM 5: Asynchronous ML Microservice & Multi-Modal Gemini Clinical Synthesis
================================================================================
INPUT:
    file_upload    : Multipart binary radiograph file received from frontend client
    gemini_api_key : Google Gemini Developer API Key (from environment or client)
    use_image_data : Boolean flag indicating whether to transmit Base64 image payload

OUTPUT:
    JSON_Response  : Formatted response containing diagnostic metrics, Grad-CAM, 
                     and Gemini AI structured radiologic interpretation

PROCEDURE:
// ─────────────────────────────────────────────────────────────────────────────
// PART A: FastAPI Microservice (Python Backend on Port 8000)
// ─────────────────────────────────────────────────────────────────────────────
1:  START_ASYNC_ENDPOINT POST /predict(file: UploadFile):
2:      ValidateContentType(file.content_type, allowed=['image/jpeg', 'image/png'])
3:      raw_bytes ← AWAIT file.read()
4:      
5:      t_start ← HighResolutionTimer()
6:      pil_image ← Image.open(BytesIO(raw_bytes)).convert("RGB")
7:      
8:      // Apply CLAHE and normalization transforms (Module 1)
9:      input_tensor ← TransformPipeline(pil_image).unsqueeze(0).to(DEVICE)
10:     
11:     // Execute Inference and Grad-CAM Synthesis (Module 4)
12:     pred_class, conf, probs, gradcam_matrix ← GenerateGradCAM(
13:         model=InferenceService.model,
14:         input_tensor=input_tensor,
15:         raw_image=pil_image
16:     )
17:     t_inference ← (HighResolutionTimer() - t_start) * 1000.0 // in ms
18:     
19:     RETURN JSON {
20:         "predicted_class": pred_class,
21:         "confidence": conf,
22:         "probabilities": {"NORMAL": probs[0], "PNEUMONIA": probs[1]},
23:         "gradcam_base64": EncodeBase64(gradcam_matrix),
24:         "original_base64": EncodeBase64(pil_image),
25:         "inference_time_ms": t_inference
26:     }
27: END_ASYNC_ENDPOINT

// ─────────────────────────────────────────────────────────────────────────────
// PART B: Multi-Modal Gemini 2.5 Flash Synthesis (Next.js API Route)
// ─────────────────────────────────────────────────────────────────────────────
28: START_ASYNC_ENDPOINT POST /api/ai/clinical-summary(request_body):
29:     pred_class ← request_body.predicted_class
30:     conf ← request_body.confidence
31:     p_norm ← request_body.normal_probability
32:     p_pneu ← request_body.pneumonia_probability
33:     img_base64 ← request_body.imageBase64
34:     
35:     // Resolve Gemini API key dynamically
36:     api_key ← ResolveApiKey(request_body.clientApiKey, ENV["GEMINI_API_KEY"])
37:     
38:     IF api_key IS NULL OR api_key == "" THEN:
39:         // Seamless Autonomous Clinical Synthesis Fallback
40:         fallback_summary ← GenerateDeterministicClinicalSummary(pred_class, conf, p_norm, p_pneu)
41:         RETURN JSON {
42:             "conclusion": fallback_summary,
43:             "source": "clinical_synthesizer",
44:             "model": "Autonomous ResNet-50 Synthesis Engine"
45:         }
46:     END IF
47:     
48:     // Construct Thoracic Radiologist System & Clinical Prompt
49:     prompt_text ← FormatPrompt("""
50:         You are an expert board-certified thoracic radiologist for MEDIFED AI.
51:         Analyze this chest radiograph and the quantitative ResNet-50 federated findings:
52:         - Predicted Classification: {pred_class}
53:         - Model Overall Confidence: {conf * 100:.2f}%
54:         - Pneumonia Probability: {p_pneu * 100:.2f}% | Normal Probability: {p_norm * 100:.2f}%
55:         Synthesize an authoritative clinical diagnostic conclusion with three clear sections:
56:         🩺 PRIMARY DIAGNOSTIC IMPRESSION: (2-3 concise sentences)
57:         🔬 RADIOLOGICAL & GRAD-CAM CORRELATION: (Spatial consolidation and Layer4 heatmap focus)
58:         📋 RECOMMENDED CLINICAL NEXT STEPS: (Auscultation, vitals, inflammatory panel, culture)
59:     """)
60:     
61:     parts_list ← [{"text": prompt_text}]
62:     IF use_image_data AND img_base64 IS NOT NULL THEN:
63:         parts_list.append({
64:             "inline_data": {
65:                 "mime_type": "image/jpeg",
66:                 "data": StripBase64Header(img_base64)
67:             }
68:         })
69:     END IF
70:     
71:     gemini_url ← "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + api_key
72:     
73:     TRY:
74:         http_response ← AWAIT HTTPS_POST(
75:             url=gemini_url,
76:             body={"contents": [{"parts": parts_list}], "generationConfig": {"temperature": 0.2, "maxOutputTokens": 600}}
77:         )
78:         gemini_json ← ParseJSON(http_response.body)
79:         conclusion_text ← gemini_json.candidates[0].content.parts[0].text
80:         
81:         RETURN JSON {
82:             "conclusion": Trim(conclusion_text),
83:             "source": "gemini",
84:             "model": "Gemini 2.5 Flash"
85:         }
86:     CATCH network_or_api_error:
87:         // Graceful fallback prevents frontend outage
88:         fallback_summary ← GenerateDeterministicClinicalSummary(pred_class, conf, p_norm, p_pneu)
89:         RETURN JSON {
90:             "conclusion": fallback_summary,
91:             "source": "clinical_synthesizer",
92:             "model": "Autonomous ResNet-50 Synthesis Engine (Fallback)"
93:         }
94:     END TRY
95: END_ASYNC_ENDPOINT
================================================================================
```

---
*End of Chapter 5: Implementation Document.*
