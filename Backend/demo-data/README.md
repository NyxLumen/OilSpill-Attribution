# OilSpill-Attribution — Backend Handoff Guide

This document is the **implementation and integration guide for the `Backend/` folder**.

It is intended for:

- Human developers
- Frontend developers
- Drift/AIS developers
- AI coding agents (Cursor, Copilot, Claude Code, Codex, etc.)

The backend is an **inference service**. It is not a training service.

---

# 0. READ THIS FIRST

The intended workflow is:

```text
User uploads SAR image
        +
optional metadata
        +
requested output format
        |
        v
   FastAPI /predict
        |
        v
 U-Net + ResNet34
 Oil-spill segmentation
        |
        v
   Oil detected?
     /           NO          YES
   |            |
   |            v
   |        YOLO11n
   |        Ship detection
   |            |
   +------>----+
            |
            v
   Annotated image
   + CSV and/or JSON
            |
            v
       Drift / AIS
            |
            v
   Vessel attribution
```

## Critical behaviour

- **Oil detection happens first.**
- YOLO ship detection runs **only if oil is detected**.
- `oil_detected = false` is a valid result, not an error.
- `oil_detected = true` and `ship_count = 0` is also a valid result.
- Missing metadata must not stop ML inference.
- Never fabricate latitude/longitude.
- Never retrain or replace the supplied checkpoints unless explicitly requested.
- The raw uploaded image must never be overwritten.

---

# 1. CURRENT BACKEND STRUCTURE

The current backend is organized as:

```text
Backend/
├── demo-data/
│   ├── DARTIS/
│   │   ├── DARTIS_2019.tab
│   │   └── sample DARTIS images
│   │
│   ├── OSSDD/
│   │   └── sample OSSDD images
│   │
│   └── SOS/
│       └── sample SOS images
│
├── fallback/
│   ├── combined_inference_results.csv
│   ├── oil_predictions.csv
│   └── ship_predictions.csv
│
├── models/
│   ├── oil-model.pt
│   └── ship-model.pt
│
├── outputs/
│
├── inference.py
├── main.py
└── requirements.txt
```

The repository already contains the backend implementation files and fallback directory. Keep this structure unless there is a specific integration reason to change it.

---

# 2. WHAT THE BACKEND IS RESPONSIBLE FOR

The backend is responsible for:

```text
1. Accepting SAR image uploads
2. Accepting optional metadata
3. Running oil-spill segmentation
4. Running ship detection only when appropriate
5. Producing an annotated image
6. Producing CSV
7. Optionally producing JSON
8. Exposing result files to the frontend
9. Providing structured output to Drift/AIS
```

The backend is **not** responsible for:

```text
- training the models
- downloading full training datasets
- running the complete AIS system
- replacing the Drift physics/matching subsystem
- inventing missing geospatial information
```

---

# 3. TRAINED MODELS

There are two runtime checkpoints.

## 3.1 Oil-spill model

Architecture:

```text
U-Net
Encoder: ResNet34
Input: single-channel SAR
Output: oil-spill segmentation
```

Runtime checkpoint:

```text
Backend/models/oil-model.pt
```

Original Kaggle development checkpoint:

```text
/kaggle/input/models/siddhug01/unet-rs34/pytorch/default/1/unet_resnet34_hardnegative_finetuned (1).pt
```

Approximate size:

```text
93.37 MB
```

---

## 3.2 Ship detection model

Architecture:

```text
YOLO11n
Class: ship
```

Runtime checkpoint:

```text
Backend/models/ship-model.pt
```

Original Kaggle training checkpoint:

```text
/kaggle/working/ossdd_ship_training/ship_detector_final/weights/best.pt
```

Approximate size:

```text
5.20 MB
```

Development split:

```text
2000 training images
200 validation images
```

Previously observed validation result:

```text
Precision : ~0.811
Recall    : ~0.758
mAP50     : ~0.807
mAP50-95  : ~0.342
```

Do not replace the supplied checkpoint just because another YOLO model gives visually similar validation outputs.

---

# 4. EXACT TRAINING NOTEBOOKS

These are the **authoritative notebook versions** for the production checkpoints.

## 4.1 Oil Model — U-Net + ResNet34

Exact Kaggle notebook version:

```text
https://www.kaggle.com/code/siddhug01/finetuned-model-1-unet-rsnet34/notebook?scriptVersionId=345791019
```

This notebook contains/reference the oil-model work, including the SOS/DARTIS experiments, training configuration, evaluation, visual outputs, graphs, statistics and checkpoint artifacts.

Use this exact version when you need to understand how the oil model was trained or why a result differs from the expected behaviour.

---

## 4.2 Ship Model — YOLO11n

Exact Kaggle notebook version:

```text
https://www.kaggle.com/code/siddhug01/notebook2ecd87b3ee/notebook?scriptVersionId=345833637
```

This notebook contains the OSSDD/OpenSARShip ship-detector preparation, training output, epoch information, validation statistics, graphs, prediction examples and checkpoint artifacts.

Use this exact version when investigating the ship model.

---

# 5. NOTEBOOK OUTPUTS / VISUAL EVIDENCE

The notebooks are not just training scripts.

Their output folders contain useful evidence such as:

```text
- validation images
- prediction images
- per-epoch outputs
- loss curves
- validation graphs
- training statistics
- metrics
- checkpoint information
- sample detections
```

When an inference result looks wrong:

```text
1. Inspect the relevant notebook.
2. Inspect the validation/prediction outputs.
3. Compare the current behaviour with the saved experiment.
4. Only then modify runtime inference code.
```

Do not use a new training run as the first debugging step.

---

# 6. DATASETS USED IN THE ML WORK

The ML work involves three major data sources:

```text
1. SOS
2. DARTIS 2019
3. OSSDD / OpenSARShip
```

These datasets have different purposes.

```text
SOS
  → oil-spill research/training/evaluation

DARTIS 2019
  → oil-spill research
  → transfer testing
  → acquisition/time metadata
  → geographic metadata
  → demo/fallback cases

OSSDD / OpenSARShip
  → ship detector training/evaluation
```

## Important

The full datasets are **not required to run the backend**.

The repository contains representative sample images under:

```text
Backend/demo-data/
```

These are for:

```text
testing
debugging
documentation
AI-agent verification
demonstration
```

Do not make the API download gigabytes of training data at startup.

---

# 7. DARTIS

Repository metadata:

```text
Backend/demo-data/DARTIS/DARTIS_2019.tab
```

Historical Kaggle path:

```text
/kaggle/input/datasets/siddhug01/dartis-2019/DARTIS_2019.tab
```

The inspected metadata contained:

```text
5515 metadata rows
3655 unique images
```

Subset counts observed during development:

```text
nw = 1939
ow = 990
oc = 375
nc = 351
```

DARTIS metadata contains information including:

```text
image filename
start acquisition time
end acquisition time

patch width
patch height

patch UL latitude/longitude
patch UR latitude/longitude
patch BR latitude/longitude
patch BL latitude/longitude

object pixel coordinates
```

Relevant fields include:

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

For a matching DARTIS image:

```text
detected pixel coordinate
        +
DARTIS patch corner geometry
        ↓
approximate latitude/longitude
```

Do not use DARTIS metadata for unrelated images.

---

# 8. OSSDD / OpenSARShip

OSSSD/OpenSARShip is used for ship detection.

The runtime does not require the full dataset.

The repository contains only representative sample images.

The ship model produces image-space information such as:

```text
x1
y1
x2
y2
center_x
center_y
confidence
```

These are pixel coordinates.

They are NOT automatically:

```text
latitude
longitude
```

Do not fabricate geospatial coordinates from an OSSDD pixel box.

For geographic AIS matching, valid external scene metadata is required.

---

# 9. SOS

SOS is part of the oil-spill training/evaluation workflow.

Representative images are stored in:

```text
Backend/demo-data/SOS/
```

The full dataset is not required by the runtime.

Use the exact oil-model notebook above for the dataset source and training/evaluation details.

---

# 10. WHAT THE USER INPUTS

The preferred API input is:

```text
1. SAR image
2. optional metadata
3. requested output format
```

Supported image extensions:

```text
.jpg
.jpeg
.png
.tif
.tiff
```

The `metadata` field is optional.

Example:

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

A user may provide only:

```text
image
```

and inference must still run.

---

# 11. METADATA BEHAVIOUR

If metadata is supplied:

```text
use it
```

If metadata is missing:

```text
continue inference
```

Unavailable fields should remain:

```text
null
```

or blank in CSV.

The backend may attempt a DARTIS filename lookup when the uploaded image is actually a matching DARTIS image.

For example:

```text
uploaded image
      ↓
filename
      ↓
DARTIS_2019.tab
      ↓
matching record?
```

If there is a valid matching record, the backend can obtain:

```text
acquisition time
DARTIS patch geometry
source
```

Never assign DARTIS coordinates to arbitrary images.

---

# 12. INFERENCE PIPELINE

## Stage 1 — Oil model

The oil model:

```text
U-Net + ResNet34
```

performs segmentation.

The current prototype preprocessing is:

```text
grayscale
→ resize 256x256
→ normalize [0,1]
→ transform approximately to [-1,1]
→ model
→ threshold
→ connected-component filtering
→ restore mask to input resolution
```

Current prototype configuration:

```text
OIL_THRESHOLD = 0.55
OIL_MIN_AREA = 20
```

These settings should not be silently changed.

---

## Stage 2 — Ship model

If:

```text
oil_detected == true
```

run:

```text
YOLO11n
```

Current prototype settings:

```text
confidence = 0.25
IoU        = 0.50
image size = 640
```

If:

```text
oil_detected == false
```

then:

```text
YOLO is NOT run
ship_count = 0
```

---

# 13. NORMAL / VALID OUTCOMES

## Case A — No oil

```text
oil_detected = false
ship_count = 0
```

This is a valid inference.

Still produce:

```text
annotated image
CSV and/or JSON
```

Do not throw an exception.

---

## Case B — Oil detected, no ships

```text
oil_detected = true
ship_count = 0
```

This is also valid.

The image should show the oil result.

Do not treat "no ship" as an API failure.

---

## Case C — Oil detected and ships detected

```text
oil_detected = true
ship_count > 0
```

The output should contain:

```text
oil result
ship detections
annotated image
CSV and/or JSON
```

---

# 14. ANNOTATED IMAGE

The backend always generates an annotated PNG.

The raw upload is not modified.

Current visual convention:

```text
RED  = oil region / oil bounding box
BLUE = ship bounding boxes
```

Example:

```text
+--------------------------------------+
|                                      |
|       RED OIL REGION                 |
|       +--------------------+         |
|       |                    |         |
|       |      OIL SLICK     |         |
|       |                    |         |
|       +--------------------+         |
|                         +--------+   |
|                         | SHIP .81|   |
|                         +--------+   |
|                                      |
|              +--------+              |
|              | SHIP .76|              |
|              +--------+              |
|                                      |
+--------------------------------------+
```

The image should visibly mark:

```text
oil slick / oil region
oil bounding box when available
ship bounding boxes
ship confidence
```

This PNG is intended for the frontend/human user.

---

# 15. CSV OUTPUT

CSV is the preferred downstream format for Drift/AIS.

At minimum, it should contain information corresponding to:

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

Geographic fields are allowed to be null/blank when geospatial metadata is unavailable.

Never insert fake coordinates.

Do not describe raw model confidence as a calibrated probability unless calibration has actually been performed.

---

# 16. JSON OUTPUT

JSON contains the same logical information as the CSV.

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

CSV and JSON must come from the same canonical inference result.

Do not maintain separate inference logic for CSV and JSON.

---

# 17. OUTPUT FORMAT

The API supports:

```text
csv
json
both
```

Examples:

```text
output_format=csv
```

```text
output_format=json
```

```text
output_format=both
```

The annotated PNG is generated in all cases because the frontend needs a visual result.

---

# 18. API ENDPOINTS

## Health

```text
GET /health
```

Local:

```text
http://127.0.0.1:8000/health
```

Expected:

```json
{
  "status": "ok"
}
```

---

## Prediction

```text
POST /predict
```

Local:

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
curl -X POST   -F "file=@sample.jpg"   -F 'metadata={"source":"DARTIS","place":"Eastern Mediterranean Sea"}'   -F "output_format=both"   http://127.0.0.1:8000/predict
```

Example response:

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
  "ship_count": 2,
  "output_format": "both",
  "image_url": "/results/abc123.png",
  "csv_url": "/results/abc123.csv",
  "json_url": "/results/abc123.json"
}
```

Result endpoints:

```text
GET /results/{request_id}.png
GET /results/{request_id}.csv
GET /results/{request_id}.json
```

---

# 19. FRONTEND INTEGRATION

Example frontend request:

```javascript
const formData = new FormData();

formData.append(
    "file",
    selectedFile
);

formData.append(
    "output_format",
    "both"
);

formData.append(
    "metadata",
    JSON.stringify({
        source: "DARTIS",
        acquisition_time: "2019-01-10T15:56:11Z",
        place: "Eastern Mediterranean Sea"
    })
);

const response = await fetch(
    "http://127.0.0.1:8000/predict",
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

const BASE_URL =
    "http://127.0.0.1:8000";

const imageURL =
    BASE_URL + result.image_url;

const csvURL =
    result.csv_url
        ? BASE_URL + result.csv_url
        : null;

const jsonURL =
    result.json_url
        ? BASE_URL + result.json_url
        : null;
```

Display:

```text
imageURL
```

to the user.

Use:

```text
csvURL
```

for the downstream Drift/AIS system.

---

# 20. DRIFT / AIS INTEGRATION

The ML backend should not duplicate the existing Drift subsystem.

The intended interface is:

```text
Backend
   |
   | CSV / structured result
   v
Drift
   |
   +-- AIS
   +-- matching
   +-- physics
   +-- backtracking
   |
   v
candidate vessel ranking
```

The backend should provide, where legitimately available:

```text
oil detection
oil location
ship detections
ship pixel coordinates
ship geographic coordinates
detection confidence
acquisition time
scene/source metadata
```

The Drift/AIS layer is responsible for:

```text
AIS track matching
temporal filtering
spatial filtering
drift/backtracking
candidate ranking
```

---

# 21. GEOSPATIAL RULES

A pixel coordinate is not a geographic coordinate.

For example:

```text
ship_center_x = 300
ship_center_y = 240
```

does not mean:

```text
latitude = 300
longitude = 240
```

For DARTIS:

```text
pixel position
+
DARTIS patch corners
→
approximate lat/lon
```

For a georeferenced Sentinel-1 product:

```text
pixel position
+
valid geospatial metadata
→
geographic coordinate
```

For an unreferenced OSSDD chip:

```text
pixel position
→
no trustworthy lat/lon
```

Never fabricate missing geographic information.

---

# 22. FALLBACK SYSTEM

Existing fallback files:

```text
Backend/fallback/
├── combined_inference_results.csv
├── oil_predictions.csv
└── ship_predictions.csv
```

These are precomputed DARTIS inference/evaluation results.

Use them for:

```text
deterministic demo
evaluation
debugging
fallback
```

They are not the source of truth for a new uploaded image.

For future deterministic demo cases, keep the same logical result schema as `/predict`.

---

# 23. DEMO DATA

Representative sample images are already under:

```text
Backend/demo-data/SOS/
Backend/demo-data/DARTIS/
Backend/demo-data/OSSSD/
```

Use these first when an agent or developer needs to test.

DARTIS also contains:

```text
Backend/demo-data/DARTIS/DARTIS_2019.tab
```

The notebook output folders contain additional visual material such as:

```text
validation images
prediction images
epoch graphs
loss curves
validation metrics
training statistics
checkpoint information
```

These are useful for understanding expected model behaviour.

---

# 24. LOCAL HOSTING

Recommended competition setup:

```text
Same laptop
│
├── Frontend
│
├── FastAPI backend
│
└── trained models
```

Create environment:

```bash
cd Backend
python -m venv .venv
```

Windows:

```powershell
.venv\Scriptsctivate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Install:

```bash
pip install -r requirements.txt
```

Start API:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Frontend calls:

```text
http://127.0.0.1:8000/predict
```

---

# 25. CPU VS NVIDIA GPU

The inference code automatically chooses:

```text
CUDA if available
otherwise CPU
```

Therefore:

```text
NVIDIA CUDA GPU
    → GPU inference

No CUDA GPU
    → CPU inference
```

CPU execution is supported and is acceptable for low-volume demonstrations.

An NVIDIA GPU is preferable for faster inference when available.

Do not make CUDA mandatory.

---

# 26. CLOUD HOSTING

The same FastAPI application can be deployed to:

```text
CPU cloud VM
or
NVIDIA GPU cloud VM
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
CSV + PNG
```

The cloud machine must have:

```text
Python
required packages
model checkpoints
```

For GPU deployment, use a CUDA-compatible NVIDIA environment and a compatible PyTorch build.

Cloud hosting is optional.

For the competition, local hosting is the simplest fail-safe because it avoids:

```text
cloud quota
cloud GPU availability
internet failures
external port forwarding
```

---

# 27. MODEL PATH RULE

The following are historical Kaggle paths:

```text
/kaggle/input/...
/kaggle/working/...
```

Do NOT hardcode them into production code.

Runtime model paths are:

```text
Backend/models/oil-model.pt
Backend/models/ship-model.pt
```

Always resolve runtime paths relative to the backend repository.

---

# 28. OPTIONAL TESTING

The team does not need to run every test during initial development.

Run these when:

```text
backend fails
models do not load
someone changes inference code
an AI agent needs to verify its work
```

## Test 1 — dependency installation

```bash
cd Backend
pip install -r requirements.txt
```

If multipart upload support is missing:

```bash
pip install python-multipart
```

---

## Test 2 — model loading

```bash
python -c "import inference; print('MODEL IMPORT OK')"
```

Expected:

```text
Loading SIH models on ...
✅ Oil model loaded
✅ Ship model loaded
MODEL IMPORT OK
```

If this fails:

```text
1. verify the model files
2. verify Python environment
3. install requirements
4. inspect traceback
```

Do not retrain.

---

## Test 3 — API startup

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Expected:

```text
Application startup complete.
Uvicorn running on http://127.0.0.1:8000
```

---

## Test 4 — health

Open:

```text
http://127.0.0.1:8000/health
```

Expected:

```json
{"status":"ok"}
```

If this fails:

```text
check that uvicorn is running
check port 8000
read the traceback
```

---

## Test 5 — image-only inference

Use a sample image from:

```text
Backend/demo-data/DARTIS/
Backend/demo-data/SOS/
Backend/demo-data/OSSSD/
```

Do not provide metadata.

Verify:

```text
HTTP 200
ML inference completes
annotated image generated
CSV/JSON generated as requested
```

---

## Test 6 — metadata inference

Provide metadata such as:

```json
{
  "source": "DARTIS",
  "acquisition_time": "2019-01-10T15:56:11Z",
  "place": "Eastern Mediterranean Sea"
}
```

Verify that the supplied fields appear in the result.

---

## Test 7 — no-oil case

Use a sample that produces:

```text
oil_detected = false
```

Verify:

```text
request succeeds
ship_count = 0
PNG generated
CSV/JSON generated
```

---

## Test 8 — oil-positive case

Use a known oil-positive sample.

Verify:

```text
oil_detected = true
```

and then verify that the ship stage runs.

---

## Test 9 — oil-positive/no-ship case

Use an oil-positive scene where no ship is confidently detected.

Expected:

```text
oil_detected = true
ship_count = 0
request succeeds
```

This is not an error.

---

## Test 10 — DARTIS metadata case

Use:

```text
Backend/demo-data/DARTIS/<image>.jpg
```

and verify that the filename can be matched to:

```text
Backend/demo-data/DARTIS/DARTIS_2019.tab
```

When the scene and metadata genuinely match, verify:

```text
acquisition time
patch geometry
coordinates where justified
```

---

## Test 11 — OSSDD case

Use:

```text
Backend/demo-data/OSSSD/<image>
```

Verify:

```text
ship bounding boxes
confidence
annotated image
CSV/JSON
```

Remember:

```text
OSSDD pixel coordinates are not automatically geographic coordinates.
```

---

# 29. HOW AN AI CODING AGENT SHOULD DEBUG

When an agent is told:

```text
"The backend does not work."
```

it should use this sequence:

```text
1. Inspect repository tree.
2. Inspect Backend/main.py.
3. Inspect Backend/inference.py.
4. Inspect Backend/requirements.txt.
5. Check model files.
6. Install dependencies.
7. Test model import.
8. Start FastAPI.
9. Test /health.
10. Test /predict with demo-data.
11. Inspect generated PNG.
12. Inspect CSV/JSON.
13. Compare behaviour with notebook outputs.
14. Only then change code.
```

Do not immediately retrain.

Do not replace the models.

Do not rewrite the application from scratch.

---

# 30. AI CODING-AGENT HARD RULES

## NEVER AUTOMATICALLY

```text
❌ retrain oil model
❌ retrain ship model
❌ replace trained checkpoints
❌ download full datasets at runtime
❌ use /kaggle/... paths in production
❌ run YOLO before oil detection
❌ treat no-oil as failure
❌ treat no-ship as failure
❌ fabricate coordinates
❌ overwrite uploaded images
❌ silently change CSV schema
❌ duplicate Drift physics inside Backend
```

## ALWAYS

```text
✅ inspect existing code first
✅ use repository-relative paths
✅ preserve oil -> ship order
✅ accept optional metadata
✅ generate annotated PNG
✅ generate CSV
✅ support JSON when requested
✅ preserve fallback data
✅ preserve DARTIS metadata handling
✅ keep Drift separated
✅ verify changes using demo data
```

---

# 31. DEMO / DOCUMENTATION OUTPUTS

For documentation, it is useful to keep:

```text
docs/
└── assets/
    ├── sample_input.png
    ├── sample_oil_output.png
    └── sample_oil_ship_output.png
```

Recommended examples:

```text
sample_input.png
    raw SAR image

sample_oil_output.png
    raw SAR + RED oil region

sample_oil_ship_output.png
    raw SAR + RED oil region + BLUE ship boxes
```

Use real inference outputs.

Do not create fake screenshots.

---

# 32. FINAL SYSTEM CONTRACT

```text
INPUT
=====
SAR image
optional metadata
output format


PROCESS
=======
U-Net + ResNet34
       ↓
oil detection
       ↓
if oil:
    YOLO11n ship detection


OUTPUT
======
annotated PNG
CSV
optional JSON


DOWNSTREAM
==========
CSV / structured result
       ↓
Drift
       ↓
AIS
       ↓
vessel attribution
```

A successful request does not require oil or ships to be found.

A successful request means:

```text
the image was processed
+
the available detections were returned
+
the requested outputs were generated
```

---

# 33. TEAM HANDOFF CHECKLIST

Before frontend integration:

```text
[ ] models exist
[ ] requirements install
[ ] inference.py loads
[ ] main.py starts
[ ] /health works
[ ] /predict works without metadata
[ ] /predict works with metadata
[ ] no-oil case succeeds
[ ] no-ship case succeeds
[ ] annotated PNG is correct
[ ] CSV is correct
[ ] JSON is correct when requested
[ ] DARTIS metadata lookup works where applicable
[ ] fallback remains available
```

Before Drift/AIS integration:

```text
[ ] CSV schema agreed
[ ] acquisition time is available when supplied
[ ] geographic values are only populated when justified
[ ] ship pixel coordinates are available
[ ] ship geographic coordinates are available only for georeferenced scenes
[ ] Drift can consume the structured result
```

Before the competition:

```text
[ ] run on actual presentation laptop
[ ] verify CPU path
[ ] verify GPU path if available
[ ] keep deterministic fallback cases
[ ] keep annotated example images
[ ] do not depend on Kaggle
[ ] do not depend on Lightning
```

---

# 34. MODEL / DATA PROVENANCE SUMMARY

```text
OIL MODEL
---------
U-Net + ResNet34

Notebook:
https://www.kaggle.com/code/siddhug01/finetuned-model-1-unet-rsnet34/notebook?scriptVersionId=345791019

Runtime:
Backend/models/oil-model.pt


SHIP MODEL
----------
YOLO11n

Notebook:
https://www.kaggle.com/code/siddhug01/notebook2ecd87b3ee/notebook?scriptVersionId=345833637

Runtime:
Backend/models/ship-model.pt


RESEARCH DATA
-------------
SOS
DARTIS 2019
OSSDD / OpenSARShip
```

---

# 35. FINAL MESSAGE FOR DEVELOPERS AND AGENTS

The job is **not** to rebuild the ML research.

The job is to make the existing trained models usable:

```text
UPLOAD
   ↓
INFER
   ↓
MARK OIL + SHIPS
   ↓
EXPORT CSV / JSON
   ↓
PASS STRUCTURED DATA TO DRIFT/AIS
```

Use the supplied model checkpoints and exact Kaggle notebook versions as the source of truth.

When there is a problem, inspect the existing implementation and the notebook outputs before making architectural changes.
