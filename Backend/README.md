# OilSpill-Attribution — Backend README

> **Status:** Final backend handoff/documentation draft  
> **Purpose:** Run the trained SAR oil-spill + ship models and provide structured output to the Drift/AIS attribution system.

---

# 1. What This Backend Does

The backend converts an uploaded SAR image into:

1. **Oil-spill segmentation**
2. **Conditional ship detection**
3. **Annotated output image**
4. **CSV output**
5. **Optional JSON output**
6. **Structured input for Drift/AIS vessel attribution**

The core pipeline is:

```text
User
  |
  | SAR image + optional metadata
  v
FastAPI /predict
  |
  v
U-Net + ResNet34
Oil-spill segmentation
  |
  +--------------------------+
  |                          |
  | No oil                   | Oil detected
  v                          v
Return valid result       YOLO11n
                           Ship detection
                              |
                              v
                    Annotated PNG + CSV/JSON
                              |
                              v
                       Drift / AIS
                              |
                              v
                    Vessel candidate ranking
```

## Important behaviour

### No oil detected

This is a **valid result**, not a failure.

```text
oil_detected = false
ship_count = 0
```

The backend should still return the requested machine-readable output and an annotated PNG.

### Oil detected, no ships detected

Also a valid result.

```text
oil_detected = true
ship_count = 0
```

The backend must not crash just because YOLO did not detect a ship.

### Oil detected + ships detected

The backend returns the oil result, ship detections, coordinates when legitimately available, and the annotated image.

---

# 2. Repository Structure

The relevant project structure is:

```text
OilSpill-Attribution/
│
├── Backend/
│   ├── demo-data/
│   │   ├── DARTIS/
│   │   │   ├── DARTIS_2019.tab
│   │   │   └── sample DARTIS images
│   │   │
│   │   ├── OSSDD/
│   │   │   └── sample OSSDD images
│   │   │
│   │   └── SOS/
│   │       └── sample SOS images
│   │
│   ├── fallback/
│   │   ├── combined_inference_results.csv
│   │   ├── oil_predictions.csv
│   │   └── ship_predictions.csv
│   │
│   ├── models/
│   │   ├── oil-model.pt
│   │   └── ship-model.pt
│   │
│   ├── outputs/
│   │
│   ├── inference.py
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
│
├── Drift/
│   ├── ais/
│   ├── matching/
│   ├── drift/
│   ├── attribution.py
│   ├── run_ml_ais.py
│   └── test_ml_to_ais.py
│
├── Frontend/
│   └── frontend implementation is handled separately
│
└── ...
```

---

# 3. Files Added / Modified During Integration

This section exists so a developer or AI coding agent knows what was intentionally introduced.

## Backend files

### `Backend/inference.py`

The runtime ML inference engine.

Responsibilities:

```text
load oil model
load ship model
detect oil
detect ships conditionally
create oil/ship annotations
create machine-readable results
save annotated output image
```

Primary flow:

```text
image
  ↓
oil model
  ↓
if oil:
    ship model
  ↓
result
```

---

### `Backend/main.py`

FastAPI application.

Responsibilities:

```text
HTTP API
file upload
metadata parsing
calling inference
serving output files
calling Drift/AIS attribution
```

Main routes:

```text
GET  /
GET  /health

POST /predict
POST /attribute

GET  /results/{request_id}.png
GET  /results/{request_id}.csv
GET  /results/{request_id}.json
GET  /results/{request_id}_attribution.csv
```

---

### `Backend/requirements.txt`

Combined runtime dependencies for:

```text
ML
FastAPI
image processing
AIS
Drift
matching
visualization
```

---

# 4. Drift / AIS Integration Files

## `Drift/attribution.py`

Utility for reading ML results and producing a simpler AIS candidate ranking from spatial/temporal information.

It is useful as a standalone utility.

The project's **existing `Drift/matching/VesselMatcher` remains the main matching implementation** for the integrated Drift pipeline.

Do not create a second incompatible matching algorithm without a specific reason.

---

## `Drift/run_ml_ais.py`

Main ML → Drift → AIS integration entry point.

The intended flow:

```text
Backend ML result
       |
       v
oil location + acquisition time
       |
       v
backward Drift simulation
       |
       v
AIS cleaning
       |
       v
AIS trajectory reconstruction
       |
       v
existing VesselMatcher
       |
       v
ranked vessels
```

---

## `Drift/test_ml_to_ais.py`

Integration test.

It verifies the software connection using controlled synthetic AIS data:

```text
ML result
   ↓
Drift
   ↓
synthetic AIS
   ↓
trajectory reconstruction
   ↓
VesselMatcher
   ↓
ranked candidates
```

**Synthetic AIS is for software/integration testing only. It is not real attribution evidence.**

---

# 5. Trained Models

## 5.1 Oil-Spill Model

Architecture:

```text
U-Net
Encoder: ResNet34
Input: single-channel SAR
Task: oil-spill segmentation
```

Runtime model:

```text
Backend/models/oil-model.pt
```

Historical Kaggle checkpoint path:

```text
/kaggle/input/models/siddhug01/unet-rs34/pytorch/default/1/unet_resnet34_hardnegative_finetuned (1).pt
```

### Exact training notebook

```text
https://www.kaggle.com/code/siddhug01/finetuned-model-1-unet-rsnet34/notebook?scriptVersionId=345791019
```

Use this exact notebook version as the reference for:

```text
training code
dataset references
preprocessing
validation
loss curves
statistics
prediction examples
model outputs
```

---

## 5.2 Ship Detection Model

Architecture:

```text
YOLO11n
Task: ship detection
```

Runtime model:

```text
Backend/models/ship-model.pt
```

Historical Kaggle checkpoint:

```text
/kaggle/working/ossdd_ship_training/ship_detector_final/weights/best.pt
```

### Exact training notebook

```text
https://www.kaggle.com/code/siddhug01/notebook2ecd87b3ee/notebook?scriptVersionId=345833637
```

Use this exact notebook version as the reference for:

```text
OSSDD/OpenSARShip preparation
training
epoch output
validation
prediction examples
metrics
graphs
checkpoint output
```

Previously observed validation figures:

```text
Precision : ~0.811
Recall    : ~0.758
mAP50     : ~0.807
mAP50-95  : ~0.342
```

The ship model was trained using the OSSDD workflow with:

```text
2000 training images
200 validation images
```

---

# 6. Notebook Outputs / Where To Look When Something Looks Wrong

The two exact notebooks above contain more than the model checkpoints.

Inspect their output folders for:

```text
validation images
prediction images
epoch-by-epoch output
loss curves
validation graphs
metrics
statistics
checkpoint/output artifacts
```

When an inference result looks unexpected:

```text
1. Inspect the relevant notebook version.
2. Inspect validation/prediction outputs.
3. Compare preprocessing/model settings.
4. Check whether the current output is actually different.
5. Only then modify runtime inference code.
```

Do not make Kaggle a runtime dependency.

```text
Kaggle = research / training / evaluation record
GitHub Backend = production inference code
```

---

# 7. Git LFS — REQUIRED FOR THE MODELS

The large `.pt` model checkpoints are stored using **Git LFS**.

Before running the backend:

```bash
git lfs install
git lfs pull
```

## Fresh clone — Windows

PowerShell:

```powershell
git lfs install

git clone https://github.com/hanu-w/OilSpill-Attribution.git

cd OilSpill-Attribution

git lfs pull
```

Verify:

```powershell
Get-Item Backend\models\oil-model.pt
Get-Item Backend\models\ship-model.pt
```

---

## Fresh clone — Linux

```bash
git lfs install

git clone https://github.com/hanu-w/OilSpill-Attribution.git

cd OilSpill-Attribution

git lfs pull
```

Verify:

```bash
ls -lh Backend/models/
```

---

## Fresh clone — macOS

```bash
git lfs install

git clone https://github.com/hanu-w/OilSpill-Attribution.git

cd OilSpill-Attribution

git lfs pull
```

Verify:

```bash
ls -lh Backend/models/
```

Expected:

```text
Backend/models/oil-model.pt
Backend/models/ship-model.pt
```

### If a model appears suspiciously small

It may be an LFS pointer rather than the real checkpoint.

Run:

```bash
git lfs pull
```

before debugging PyTorch or `inference.py`.

---

# 8. Dataset Sources

The ML workflow uses three major data sources:

```text
SOS
DARTIS 2019
OSSDD / OpenSARShip
```

## SOS

Used in the oil-spill model research/training/evaluation workflow.

Representative sample images:

```text
Backend/demo-data/SOS/
```

The complete SOS dataset is not required at runtime.

---

## DARTIS 2019

Used for:

```text
oil-spill research
transfer testing
image/time metadata
geospatial metadata
fallback/demo cases
```

Repository metadata:

```text
Backend/demo-data/DARTIS/DARTIS_2019.tab
```

Historical development path:

```text
/kaggle/input/datasets/siddhug01/dartis-2019/DARTIS_2019.tab
```

The inspected metadata contained approximately:

```text
5515 metadata rows
3655 unique images
```

Relevant metadata includes:

```text
image filename
start/end acquisition time
patch dimensions
patch corner latitude/longitude
object pixel coordinates
```

Important coordinate fields include:

```text
patch_ul_lon
patch_ul_lat
patch_ur_lon
patch_ur_lat
patch_br_lon
patch_br_lat
patch_bl_lon
patch_bl_lat

obj_patchloc_xmin
obj_patchloc_ymin
obj_patchloc_xmax
obj_patchloc_ymax
```

---

## OSSDD / OpenSARShip

Used for:

```text
ship detector training/evaluation
ship detection samples
```

Repository samples:

```text
Backend/demo-data/OSSDD/
```

The full training dataset is not required to run inference.

---

# 9. Important Geospatial Rule

A pixel coordinate is **not** automatically a latitude/longitude.

For example:

```text
x = 320
y = 250
```

does NOT mean:

```text
latitude = 320
longitude = 250
```

For a DARTIS image with valid patch geometry:

```text
ship pixel position
       +
DARTIS patch geometry
       ↓
approximate geographic position
```

For a georeferenced Sentinel-1 product:

```text
pixel position
       +
valid product geospatial metadata
       ↓
geographic position
```

For an unreferenced OSSDD chip:

```text
ship pixel position
       ↓
no trustworthy latitude/longitude
```

Never invent coordinates.

---

# 10. User Input

The intended prediction request contains:

```text
file
metadata (optional)
output_format
```

Supported image types:

```text
JPG
JPEG
PNG
TIF
TIFF
```

Example metadata:

```json
{
  "source": "DARTIS",
  "acquisition_time": "2019-01-10T15:56:11Z",
  "acquisition_end_time": "2019-01-10T15:56:35Z",
  "latitude": 31.64,
  "longitude": 31.12,
  "place": "Eastern Mediterranean Sea"
}
```

Metadata is optional.

Image-only input is valid.

If metadata is missing:

```text
run ML anyway
preserve missing fields as null/unavailable
```

The backend may also use the DARTIS `.tab` file when an uploaded filename genuinely matches a DARTIS record.

---

# 11. `POST /predict`

Endpoint:

```text
POST /predict
```

Local URL:

```text
http://127.0.0.1:8000/predict
```

Multipart form:

```text
file=<SAR image>
metadata=<optional JSON string>
output_format=csv|json|both
```

Example:

```bash
curl -X POST \
  -F "file=@sample.jpg" \
  -F 'metadata={"source":"DARTIS","place":"Eastern Mediterranean Sea"}' \
  -F "output_format=both" \
  http://127.0.0.1:8000/predict
```

Expected response shape:

```json
{
  "status": "success",
  "request_id": "abc123",
  "filename": "sample.jpg",
  "source": "DARTIS",
  "acquisition_time": "2019-01-10T15:56:11Z",
  "place": "Eastern Mediterranean Sea",
  "oil_detected": true,
  "oil_confidence": 0.87,
  "oil_latitude": 31.64,
  "oil_longitude": 31.12,
  "ship_count": 2,
  "output_format": "both",
  "image_url": "/results/abc123.png",
  "csv_url": "/results/abc123.csv",
  "json_url": "/results/abc123.json"
}
```

---

# 12. Prediction Result Files

Given:

```text
request_id = abc123
```

the backend can provide:

```text
/results/abc123.png
/results/abc123.csv
/results/abc123.json
```

depending on requested output format.

## Annotated PNG

The output image is for human/frontend display.

Convention:

```text
RED  = oil region / oil bounding box
BLUE = ship detection boxes
```

The raw upload must never be overwritten.

---

# 13. CSV Contract

CSV is the preferred handoff format for Drift/AIS.

Relevant fields include:

```text
request_id
filename
source

acquisition_time
acquisition_end_time
place

image_width
image_height

oil_detected
oil_confidence
oil_mean_probability
oil_pixels

oil_bbox_x1
oil_bbox_y1
oil_bbox_x2
oil_bbox_y2

oil_centroid_x
oil_centroid_y
oil_latitude
oil_longitude

ship_count
```

For each ship:

```text
ship_N_confidence
ship_N_x1
ship_N_y1
ship_N_x2
ship_N_y2
ship_N_center_x
ship_N_center_y
ship_N_latitude
ship_N_longitude
```

Geographic fields may be null/blank where valid georeferencing is unavailable.

Do not treat raw detector confidence as a calibrated probability.

---

# 14. JSON Contract

JSON contains the same logical information in structured form.

Example:

```json
{
  "request_id": "abc123",
  "input": {
    "filename": "scene.jpg",
    "width": 512,
    "height": 512
  },
  "metadata": {
    "source": "DARTIS",
    "acquisition_time": "2019-01-10T15:56:11Z",
    "place": "Eastern Mediterranean Sea"
  },
  "oil": {
    "detected": true,
    "confidence": 0.87,
    "pixels": 18234,
    "centroid": {
      "x": 341.2,
      "y": 287.4,
      "latitude": 31.64,
      "longitude": 31.12
    }
  },
  "ships": [
    {
      "id": 1,
      "confidence": 0.81,
      "bbox": {
        "x1": 421,
        "y1": 180,
        "x2": 447,
        "y2": 205
      },
      "center": {
        "x": 434,
        "y": 192,
        "latitude": 31.63,
        "longitude": 31.11
      }
    }
  ]
}
```

CSV and JSON should be derived from the same inference result.

---

# 15. `POST /attribute`

This endpoint connects the ML result to the Drift/AIS subsystem.

Endpoint:

```text
POST /attribute
```

Inputs:

```text
ml_result = CSV or JSON generated by /predict
ais_file  = AIS CSV
backtrack_hours = integer
```

Optional:

```text
current_file
wind_file
```

Conceptually:

```text
ML result
    +
AIS CSV
    +
optional current/wind
        ↓
Drift backtracking
        ↓
AIS cleaning
        ↓
trajectory reconstruction
        ↓
existing VesselMatcher
        ↓
ranked candidate vessels
```

Example request:

```bash
curl -X POST \
  -F "ml_result=@Backend/outputs/abc123.csv" \
  -F "ais_file=@ais.csv" \
  -F "backtrack_hours=12" \
  http://127.0.0.1:8000/attribute
```

If valid candidates are found, the response contains a top candidate and a CSV URL.

Example:

```json
{
  "status": "success",
  "request_id": "xyz789",
  "candidate_count": 4,
  "top_candidate": {
    "rank": 1,
    "mmsi": "123456789",
    "vessel_type": "tanker",
    "composite_score": 0.89,
    "spatial_score": 0.92,
    "temporal_score": 0.88,
    "course_score": 0.50,
    "mean_distance_km": 3.2,
    "min_distance_km": 1.1
  },
  "csv_url": "/results/xyz789_attribution.csv"
}
```

If no candidate meets the filters:

```json
{
  "status": "no_candidates",
  "candidate_count": 0
}
```

That is not an API crash.

---

# 16. AIS Input Requirements

At minimum, AIS input must provide:

```text
mmsi
timestamp
latitude
longitude
```

Better AIS data may also include:

```text
sog
cog
heading
vessel_type
```

Example:

```csv
mmsi,timestamp,latitude,longitude,sog,cog,heading,vessel_type
123456789,2019-01-10T14:00:00Z,31.61,31.10,8.2,74.1,76.0,tanker
123456789,2019-01-10T14:15:00Z,31.62,31.11,8.1,73.9,75.0,tanker
123456789,2019-01-10T14:30:00Z,31.63,31.12,8.0,74.5,76.0,tanker
```

The existing AIS cleaner performs validation and cleaning before trajectory reconstruction.

---

# 17. Drift / AIS Responsibilities

## Backend

Responsible for:

```text
image inference
oil segmentation
ship detection
metadata handling
result generation
```

## Drift

Responsible for:

```text
backward particle simulation
current/wind forcing where supplied
trajectory generation
```

## AIS

Responsible for:

```text
AIS cleaning
trajectory reconstruction
interpolation
```

## Matching

Responsible for:

```text
candidate vessel scoring
candidate ranking
```

The components should remain separated.

---

# 18. Candidate Vessel Interpretation

The existing vessel matcher combines:

```text
spatial score
temporal score
course score
```

with the project's configured weighting.

The output contains:

```text
rank
mmsi
vessel_type
composite_score
spatial_score
temporal_score
course_score
mean_distance_km
min_distance_km
n_matches
```

The highest-ranked candidate should be described as:

> **Highest-ranked candidate based on the available spatial, temporal and trajectory evidence.**

Do **not** describe it as scientifically proven to have caused the spill.

---

# 19. Local Hosting

The simplest competition deployment is everything on one machine:

```text
Frontend
   |
localhost
   |
FastAPI
   |
models
   |
Drift/AIS
```

No Kaggle or Lightning connection is required at runtime.

---

# 20. Python Environment — Windows

## PowerShell

From repository root:

```powershell
cd Backend

python -m venv .venv

.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip

pip install -r requirements.txt
```

Start:

```powershell
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

## Windows CMD

```cmd
cd Backend

python -m venv .venv

.venv\Scripts\activate

python -m pip install --upgrade pip

pip install -r requirements.txt

python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

If PowerShell blocks activation, use Command Prompt or activate the environment using the appropriate local execution-policy configuration.

---

# 21. Python Environment — Linux

```bash
cd Backend

python3 -m venv .venv

source .venv/bin/activate

python -m pip install --upgrade pip

pip install -r requirements.txt
```

Start:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

---

# 22. Python Environment — macOS

```bash
cd Backend

python3 -m venv .venv

source .venv/bin/activate

python -m pip install --upgrade pip

pip install -r requirements.txt
```

Start:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

---

# 23. Health Check

Open:

```text
http://127.0.0.1:8000/health
```

Expected:

```json
{
  "status": "ok"
}
```

Interactive FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

The `/docs` page can be used to inspect and manually call:

```text
GET  /health
POST /predict
POST /attribute
```

---

# 24. CPU and NVIDIA GPU

The inference implementation is designed to use:

```text
CUDA when available
otherwise CPU
```

Therefore:

```text
NVIDIA CUDA-capable machine
    → GPU inference

CPU-only machine
    → CPU inference
```

CPU execution is supported.

GPU execution is preferable for faster repeated inference.

Do not make CUDA mandatory unless the deployment specifically requires it.

---

# 25. Cloud Hosting

The backend can be deployed on:

```text
CPU VM
or
NVIDIA GPU VM
```

Architecture:

```text
Frontend
    |
HTTPS
    |
FastAPI
    |
models
    |
results
```

The machine must have:

```text
Python
backend dependencies
Git LFS model files
```

For GPU deployment:

```text
NVIDIA GPU
+
compatible CUDA/PyTorch environment
```

For CPU deployment:

```text
CPU
+
CPU-compatible PyTorch
```

The frontend should use a configurable API base URL, e.g.:

```text
VITE_API_URL=http://127.0.0.1:8000
```

and change this to the cloud URL when deployed remotely.

---

# 26. Demo / Sample Data

Representative samples are included in:

```text
Backend/demo-data/SOS/
Backend/demo-data/DARTIS/
Backend/demo-data/OSSDD/
```

The purpose is:

```text
quick testing
debugging
demonstration
AI-agent verification
```

The full training datasets are not required for runtime.

The DARTIS directory also contains:

```text
DARTIS_2019.tab
```

for metadata/coordinate testing.

---

# 27. Fallback Data

The repository contains:

```text
Backend/fallback/
├── combined_inference_results.csv
├── oil_predictions.csv
└── ship_predictions.csv
```

These are useful for:

```text
deterministic demo
precomputed examples
debugging
fallback
```

They are not a replacement for live model inference on a new uploaded image.

A fallback implementation should preserve the same output semantics as the live API.

---

# 28. Testing / Troubleshooting

Testing does not have to be done immediately.

Use the following procedure when:

```text
a teammate says the backend fails
a model does not load
an AI agent changed code
frontend integration fails
a result looks suspicious
```

## Step 1 — Git LFS

```bash
git lfs install
git lfs pull
```

Verify:

```text
Backend/models/oil-model.pt
Backend/models/ship-model.pt
```

---

## Step 2 — Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

If FastAPI reports:

```text
Form data requires "python-multipart"
```

install:

```bash
pip install python-multipart
```

---

## Step 3 — Model import

From `Backend/`:

```bash
python -c "import inference; print('MODEL IMPORT OK')"
```

Expected:

```text
Loading SIH models on ...
Oil model loaded
Ship model loaded
MODEL IMPORT OK
```

If model import fails:

```text
1. Check model files.
2. Check Git LFS.
3. Check Python environment.
4. Check package versions.
5. Read the traceback.
```

Do not retrain as the first response.

---

## Step 4 — Start FastAPI

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

---

## Step 5 — Health

```text
http://127.0.0.1:8000/health
```

Expected:

```json
{"status":"ok"}
```

---

## Step 6 — Prediction without metadata

Use one of:

```text
Backend/demo-data/SOS/
Backend/demo-data/DARTIS/
Backend/demo-data/OSSDD/
```

Call `/predict` without metadata.

Verify:

```text
HTTP 200
inference completes
PNG generated
CSV/JSON generated as requested
```

---

## Step 7 — Prediction with metadata

Send:

```json
{
  "source": "DARTIS",
  "acquisition_time": "2019-01-10T15:56:11Z",
  "place": "Eastern Mediterranean Sea"
}
```

Verify those values are preserved in the result.

---

## Step 8 — No-oil case

Verify:

```text
oil_detected = false
ship_count = 0
request succeeds
```

---

## Step 9 — No-ship case

Verify:

```text
oil_detected = true
ship_count = 0
request succeeds
```

---

## Step 10 — DARTIS case

Use a matching image from:

```text
Backend/demo-data/DARTIS/
```

Verify:

```text
filename matching
acquisition time
patch geometry
valid coordinate calculation
```

Only use the DARTIS metadata for the correct DARTIS image.

---

## Step 11 — Attribution

After obtaining a valid ML CSV/JSON:

```bash
python Drift/run_ml_ais.py \
  --ml-result Backend/outputs/<request_id>.csv \
  --ais Drift/data/ais/ais.csv \
  --output Drift/results/<request_id>_attribution.csv
```

For a controlled software test, use the synthetic AIS workflow.

---

# 29. AI Coding Agent Instructions

Give an AI coding agent the following rules before allowing it to modify the repository.

## First inspect

```text
Backend/main.py
Backend/inference.py
Backend/requirements.txt
Backend/models/
Backend/demo-data/
Backend/fallback/

Drift/ais/
Drift/matching/
Drift/attribution.py
Drift/run_ml_ais.py
Drift/test_ml_to_ais.py
```

Then read this README completely.

## Do not automatically

```text
retrain the models
replace model checkpoints
download full datasets at runtime
use /kaggle/... paths in production
require Kaggle for inference
require Lightning for inference
run YOLO before oil detection
treat no-oil as an exception
treat no-ship as an exception
fabricate geographic coordinates
overwrite raw uploaded images
rewrite Drift physics without a specific need
create a competing AIS matcher unnecessarily
```

## Do

```text
use repository-relative model paths
preserve oil -> ship order
accept optional metadata
produce PNG output
produce CSV output
support JSON
preserve fallback data
preserve DARTIS metadata logic
use the existing Drift matcher
keep synthetic AIS clearly marked as synthetic
test with demo-data when debugging
```

---

# 30. Frontend Integration Instructions

The frontend is a separate project.

The frontend should **not run the models in the browser**.

The frontend communicates with the FastAPI backend.

## Local backend URL

```text
http://127.0.0.1:8000
```

Do not hardcode this URL throughout the frontend.

Use an environment variable:

```text
VITE_API_URL=http://127.0.0.1:8000
```

For cloud deployment:

```text
VITE_API_URL=https://<hosted-backend>
```

---

## Frontend prediction flow

```text
Select SAR image
      ↓
Optional metadata
      ↓
POST /predict
      ↓
Display annotated PNG
      ↓
Display:
  oil detected
  oil confidence
  acquisition time
  place
  coordinates
  ship count
      ↓
Download CSV/JSON
```

The annotated image should be displayed directly.

Use CSV/JSON for structured data.

Do not try to infer coordinates by reading pixels from the PNG.

---

## Frontend attribution flow

After `/predict`, if the result has sufficient:

```text
acquisition time
oil latitude
oil longitude
```

the UI may expose:

```text
Run AIS Attribution
```

Then:

```text
ML result
+
AIS CSV
+
optional current/wind
        ↓
POST /attribute
        ↓
ranked vessel candidates
```

Display:

```text
rank
MMSI
vessel type
composite score
spatial score
temporal score
course score
mean distance
minimum distance
```

Do not call the top-ranked vessel a proven source.

---

# 31. AI Agent Frontend Build Instructions

The frontend agent should:

```text
1. Read this README.
2. Inspect the repository structure.
3. Inspect Backend/main.py.
4. Implement the UI around /predict and /attribute.
5. Keep API URLs configurable.
6. Display the annotated PNG from the backend.
7. Display structured result fields.
8. Provide CSV/JSON download buttons.
9. Provide an AIS attribution action.
10. Keep frontend inference-free.
```

The frontend agent should not:

```text
rewrite Backend
retrain models
move model files
download Kaggle datasets
duplicate Python inference logic
```

---

# 32. Example Frontend Request

Generic JavaScript:

```javascript
const formData = new FormData();

formData.append("file", selectedFile);

formData.append(
    "metadata",
    JSON.stringify({
        source: "DARTIS",
        acquisition_time: "2019-01-10T15:56:11Z",
        place: "Eastern Mediterranean Sea"
    })
);

formData.append(
    "output_format",
    "both"
);

const response = await fetch(
    `${API_BASE_URL}/predict`,
    {
        method: "POST",
        body: formData
    }
);

if (!response.ok) {
    throw new Error(
        `Inference failed: ${response.status}`
    );
}

const result = await response.json();

const imageURL =
    `${API_BASE_URL}${result.image_url}`;

const csvURL =
    result.csv_url
        ? `${API_BASE_URL}${result.csv_url}`
        : null;

const jsonURL =
    result.json_url
        ? `${API_BASE_URL}${result.json_url}`
        : null;
```

---

# 33. Important Runtime Path Rules

Historical Kaggle paths:

```text
/kaggle/input/...
/kaggle/working/...
```

must not be used as production runtime paths.

Production runtime paths are repository-relative:

```text
Backend/models/oil-model.pt
Backend/models/ship-model.pt
```

The backend must work after cloning the repository and pulling Git LFS objects.

---

# 34. Important Model Checkpoint Rule

The repository contains the trained models.

Do not replace them because:

```text
another architecture is smaller
another checkpoint has a similar visual output
another YOLO version is available
```

Any checkpoint change should be an explicit experiment followed by validation.

The competition runtime should use the supplied checkpoints unless there is a demonstrated failure.

---

# 35. Competition Deployment Recommendation

For the simplest presentation:

```text
One laptop
│
├── Frontend
├── FastAPI Backend
├── U-Net + ResNet34 checkpoint
├── YOLO11n checkpoint
└── Drift/AIS code
```

Advantages:

```text
no cloud dependency
no external API dependency for ML
simple debugging
works offline once dependencies/models are installed
```

If the laptop has an NVIDIA GPU, use it.

Otherwise use CPU.

Cloud deployment is a secondary option.

---

# 36. Final End-to-End Architecture

```text
                         USER
                          |
                          v
                  +---------------+
                  |   FRONTEND    |
                  +-------+-------+
                          |
                          | image + metadata
                          v
                  +---------------+
                  | FASTAPI       |
                  | /predict      |
                  +-------+-------+
                          |
                          v
               +----------------------+
               | U-Net + ResNet34     |
               | Oil segmentation     |
               +----------+-----------+
                          |
                    Oil detected?
                    /           \
                  NO             YES
                  |               |
                  |               v
                  |       +---------------+
                  |       | YOLO11n       |
                  |       | Ship detector |
                  |       +-------+-------+
                  |               |
                  +-------+-------+
                          |
                          v
                 PNG + CSV / JSON
                          |
                          v
                  +---------------+
                  | Drift bridge  |
                  +-------+-------+
                          |
                          v
                  Backward Drift
                          |
                          v
                    AIS tracks
                          |
                          v
                  VesselMatcher
                          |
                          v
                 Ranked candidates
                          |
                          v
                    FRONTEND
```

---

# 37. Final Handoff Checklist

## Backend

```text
[ ] model files pulled through Git LFS
[ ] oil-model.pt present
[ ] ship-model.pt present
[ ] requirements.txt installed
[ ] inference.py present
[ ] main.py present
[ ] /health available
[ ] /predict available
[ ] /attribute available
[ ] result PNG route available
[ ] result CSV route available
[ ] result JSON route available
[ ] attribution CSV route available
```

## Data

```text
[ ] SOS sample data present
[ ] DARTIS sample data present
[ ] DARTIS_2019.tab present
[ ] OSSDD sample data present
[ ] fallback CSVs present
```

## Drift/AIS

```text
[ ] run_ml_ais.py present
[ ] attribution.py present
[ ] test_ml_to_ais.py present
[ ] AIS cleaner available
[ ] trajectory reconstruction available
[ ] VesselMatcher available
```

## Frontend

```text
[ ] frontend calls /predict
[ ] annotated image displayed
[ ] metadata displayed
[ ] CSV/JSON downloadable
[ ] frontend can call /attribute
[ ] candidate vessels displayed
[ ] backend URL configurable
```

---

# 38. FINAL DEVELOPMENT RULE

The purpose of this repository is **not** to rebuild the ML research.

The purpose is to make the trained models usable in the competition system:

```text
UPLOAD
  ↓
OIL DETECTION
  ↓
SHIP DETECTION
  ↓
MARKED IMAGE
  ↓
CSV / JSON
  ↓
DRIFT
  ↓
AIS
  ↓
VESSEL CANDIDATE RANKING
```

Use the exact Kaggle notebook versions as the training/evaluation references:

### Oil model

```text
https://www.kaggle.com/code/siddhug01/finetuned-model-1-unet-rsnet34/notebook?scriptVersionId=345791019
```

### Ship model

```text
https://www.kaggle.com/code/siddhug01/notebook2ecd87b3ee/notebook?scriptVersionId=345833637
```

Use the supplied checkpoints in `Backend/models/`.

Use the sample data in `Backend/demo-data/`.

Use the fallback CSVs when a deterministic demo is required.

Keep Frontend, Backend, Drift and AIS responsibilities separated.

**Do not claim attribution as certainty. The system produces ranked candidate vessels based on the available evidence.**
