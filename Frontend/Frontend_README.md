# OilSpill-Attribution — Frontend README

This document is the handoff guide for the **Frontend developer and the AI coding agent** responsible for building the frontend.

The frontend should **not implement or retrain the ML models**.

The backend already provides the ML inference API.

The frontend's job is to provide a clean interface for:

```text
SAR image upload
      ↓
optional metadata
      ↓
POST /predict
      ↓
annotated image + detection data
      ↓
optional AIS attribution
      ↓
POST /attribute
      ↓
ranked vessel candidates
```

---

# 1. FRONTEND RESPONSIBILITY

The frontend is responsible for:

```text
✅ image upload UI
✅ optional metadata input
✅ output-format selection
✅ API calls to Backend
✅ loading/error states
✅ displaying annotated SAR image
✅ displaying oil detection information
✅ displaying ship detection information
✅ downloading CSV/JSON
✅ AIS attribution UI
✅ displaying ranked vessel candidates
✅ configurable backend URL
```

The frontend is NOT responsible for:

```text
❌ running PyTorch
❌ running U-Net
❌ running YOLO
❌ retraining models
❌ downloading Kaggle datasets
❌ reading model checkpoints
❌ reproducing Drift physics
❌ implementing AIS trajectory processing in JavaScript
❌ calculating coordinates from the annotated PNG
```

---

# 2. RECOMMENDED STACK

There is currently no frontend implementation to preserve.

Recommended stack:

```text
React
Vite
JavaScript or TypeScript
native fetch()
```

Keep dependencies minimal.

Suggested initial setup:

```bash
npm create vite@latest Frontend -- --template react
cd Frontend
npm install
```

Optional icon package:

```bash
npm install lucide-react
```

Do not add a state-management framework unless the frontend actually needs one.

---

# 3. REPOSITORY RELATIONSHIP

The frontend communicates with the existing backend.

Conceptually:

```text
OilSpill-Attribution/
│
├── Backend/
│   ├── main.py
│   ├── inference.py
│   ├── models/
│   └── ...
│
├── Drift/
│   ├── ais/
│   ├── matching/
│   ├── attribution.py
│   └── run_ml_ais.py
│
└── Frontend/
    └── React application
```

Do not move the models into the frontend.

---

# 4. BACKEND BASE URL

The frontend must never scatter a hardcoded backend URL throughout the code.

Use an environment variable.

For local development:

```text
VITE_API_URL=http://127.0.0.1:8000
```

Create:

```text
Frontend/.env
```

with:

```text
VITE_API_URL=http://127.0.0.1:8000
```

In code:

```javascript
const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000";
```

For cloud deployment:

```text
VITE_API_URL=https://your-backend-domain
```

Only this configuration should need to change.

---

# 5. REQUIRED USER FLOW

The main UI should follow:

```text
1. Select SAR image
2. Show image/file preview
3. Optional metadata
4. Select CSV / JSON / Both
5. Click Analyze
6. Show loading state
7. Call POST /predict
8. Display annotated output image
9. Display oil/ship results
10. Offer CSV/JSON downloads
11. If enough geographic/time information exists,
    allow AIS attribution
12. User supplies AIS CSV
13. Call POST /attribute
14. Display ranked vessel candidates
```

---

# 6. SUGGESTED UI

The first screen can be:

```text
┌───────────────────────────────────────────────────┐
│              OILSPILL ATTRIBUTION                 │
│                                                   │
│  Upload SAR image                                 │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │       Drag & drop / Choose image            │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  Metadata (optional)                              │
│                                                   │
│  Source:             [.........................]  │
│  Acquisition time:   [.........................]  │
│  Latitude:           [........]                   │
│  Longitude:          [........]                   │
│  Place:              [.........................]  │
│                                                   │
│  Output:                                           │
│  ( ) CSV   ( ) JSON   ( ) BOTH                    │
│                                                   │
│              [ ANALYZE IMAGE ]                    │
└───────────────────────────────────────────────────┘
```

After prediction:

```text
┌───────────────────────────────────────────────────┐
│                 ANALYSIS RESULT                   │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │                                             │  │
│  │       ANNOTATED SAR IMAGE                  │  │
│  │                                             │  │
│  │       RED  = oil                           │  │
│  │       BLUE = ships                         │  │
│  │                                             │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  Oil detected: YES                                │
│  Oil confidence: 0.87                             │
│  Ships detected: 3                                │
│  Acquisition time: ...                            │
│  Location: ...                                    │
│                                                   │
│  [ Download CSV ] [ Download JSON ]              │
│                                                   │
│              AIS ATTRIBUTION                      │
│                                                   │
│  AIS file: [ Choose CSV ]                         │
│  Backtrack: [ 12 ] hours                          │
│                                                   │
│          [ RUN AIS ATTRIBUTION ]                  │
└───────────────────────────────────────────────────┘
```

---

# 7. IMAGE UPLOAD

Accepted backend formats:

```text
JPG
JPEG
PNG
TIF
TIFF
```

Use a standard file input:

```html
<input
    type="file"
    accept=".jpg,.jpeg,.png,.tif,.tiff"
/>
```

Do not convert the image into JSON/base64 unless there is a specific requirement.

Send the original file using `FormData`.

---

# 8. `POST /predict`

Backend endpoint:

```text
POST /predict
```

Local:

```text
http://127.0.0.1:8000/predict
```

Input:

```text
multipart/form-data
```

Fields:

```text
file
metadata
output_format
```

Example:

```javascript
const formData = new FormData();

formData.append(
    "file",
    selectedFile
);

formData.append(
    "metadata",
    JSON.stringify({
        source: "DARTIS",
        acquisition_time: "2019-01-10T15:56:11Z",
        latitude: 31.64,
        longitude: 31.12,
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
```

Do not manually set the `Content-Type` header when using `FormData`.

The browser supplies the multipart boundary.

---

# 9. METADATA INPUT

All metadata is optional.

Suggested fields:

```text
source
acquisition_time
acquisition_end_time
latitude
longitude
place
```

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

The user may submit:

```text
image only
```

The frontend must not require metadata.

When information is unavailable, display:

```text
Unavailable
```

Do not invent values.

---

# 10. OUTPUT FORMAT

The user can select:

```text
CSV
JSON
BOTH
```

Values sent to the backend:

```text
csv
json
both
```

The annotated PNG is generated by the backend regardless of this selection.

---

# 11. `/predict` RESPONSE

Typical response:

```json
{
  "status": "success",
  "request_id": "abc123",
  "filename": "scene.jpg",
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

Build absolute URLs in the frontend:

```javascript
const imageUrl =
    `${API_BASE_URL}${result.image_url}`;

const csvUrl =
    result.csv_url
        ? `${API_BASE_URL}${result.csv_url}`
        : null;

const jsonUrl =
    result.json_url
        ? `${API_BASE_URL}${result.json_url}`
        : null;
```

---

# 12. DISPLAY THE ANNOTATED IMAGE

The backend output image is already annotated.

Convention:

```text
RED  = oil region
BLUE = ship bounding boxes
```

Display the backend image directly:

```jsx
<img
    src={imageUrl}
    alt="Annotated SAR inference"
/>
```

Do not attempt to re-detect ships or oil from the displayed image.

Use the CSV/JSON for structured information.

---

# 13. DISPLAY THE RESULT

Show at minimum:

```text
Oil detected
Oil confidence
Ship count
Acquisition time
Source
Place
Oil latitude
Oil longitude
```

Example:

```text
Oil detected: YES
Oil confidence: 0.87
Ships detected: 2
Source: DARTIS
Acquisition: 2019-01-10T15:56:11Z
Place: Eastern Mediterranean Sea
```

For unavailable data:

```text
Place: Unavailable
```

---

# 14. NORMAL NO-OIL RESULT

The frontend must support:

```json
{
  "oil_detected": false,
  "ship_count": 0
}
```

Display something like:

```text
Oil detected: NO

No oil spill was detected in this scene.

Ship detection was skipped because the
two-stage pipeline only runs YOLO when oil
is detected.
```

Do not display this as an application error.

---

# 15. NORMAL NO-SHIP RESULT

The frontend must also support:

```text
oil_detected = true
ship_count = 0
```

Display:

```text
Oil detected: YES
Ships detected: 0

No ship was confidently detected in the scene.
```

This is a valid result.

---

# 16. DOWNLOAD BUTTONS

Use the URLs supplied by the backend.

Example:

```jsx
{result.csv_url && (
    <a
        href={`${API_BASE_URL}${result.csv_url}`}
        download
    >
        Download CSV
    </a>
)}
```

For JSON:

```jsx
{result.json_url && (
    <a
        href={`${API_BASE_URL}${result.json_url}`}
        download
    >
        Download JSON
    </a>
)}
```

The frontend should not reconstruct or generate the CSV itself.

---

# 17. AIS ATTRIBUTION

The attribution stage is separate from `/predict`.

After prediction, the user may choose:

```text
Run AIS Attribution
```

Only enable/use this workflow when the available ML result contains enough information for geographic/time-based attribution.

Minimum important fields:

```text
acquisition_time
oil_latitude
oil_longitude
```

The frontend should not invent these fields.

---

# 18. `POST /attribute`

Endpoint:

```text
POST /attribute
```

Input:

```text
ml_result
ais_file
backtrack_hours
```

Optional:

```text
current_file
wind_file
```

Example:

```javascript
const formData = new FormData();

formData.append(
    "ml_result",
    mlResultFile
);

formData.append(
    "ais_file",
    aisFile
);

formData.append(
    "backtrack_hours",
    "12"
);

const response = await fetch(
    `${API_BASE_URL}/attribute`,
    {
        method: "POST",
        body: formData
    }
);
```

If the frontend already has the CSV produced by `/predict`, it may submit that file to `/attribute`.

Do not manually reproduce the CSV structure in JavaScript.

---

# 19. ATTRIBUTION RESPONSE

Successful response:

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

If there are no candidates:

```json
{
  "status": "no_candidates",
  "candidate_count": 0
}
```

This is not an application error.

---

# 20. ATTRIBUTION TABLE

Display:

```text
Rank
MMSI
Vessel type
Composite score
Spatial score
Temporal score
Course score
Mean distance
Minimum distance
```

Example:

```text
┌──────┬───────────┬─────────┬────────┬──────────┐
│ Rank │ MMSI      │ Type    │ Score  │ Distance │
├──────┼───────────┼─────────┼────────┼──────────┤
│ 1    │ 123456789 │ tanker  │ 0.89   │ 3.2 km  │
│ 2    │ 987654321 │ cargo   │ 0.68   │ 8.7 km  │
│ 3    │ 555555555 │ fishing │ 0.51   │ 12.1 km │
└──────┴───────────┴─────────┴────────┴──────────┘
```

Provide a download link:

```text
Download attribution CSV
```

---

# 21. IMPORTANT ATTRIBUTION LANGUAGE

The frontend must not say:

```text
"This ship caused the spill."
```

Use:

```text
"Highest-ranked candidate"
```

or:

```text
"Most likely candidate based on available spatial,
temporal and trajectory evidence."
```

The system is a candidate-ranking system, not proof of causality.

---

# 22. LOADING STATES

The UI should clearly distinguish:

```text
Uploading image...
Running oil segmentation...
Detecting ships...
Preparing results...
```

For attribution:

```text
Loading AIS...
Running drift backtracking...
Reconstructing trajectories...
Matching vessels...
Ranking candidates...
```

Do not freeze the page without feedback.

---

# 23. ERROR HANDLING

The frontend must handle at least:

```text
400 → invalid input
404 → result not found
500 → backend/inference failure
network failure → backend unavailable
```

Example:

```javascript
if (!response.ok) {

    let message =
        `Request failed: ${response.status}`;

    try {

        const data =
            await response.json();

        if (data.detail) {
            message = data.detail;
        }

    } catch {
        // Keep default error.
    }

    throw new Error(message);
}
```

Display the error to the user.

Do not silently fail.

---

# 24. BACKEND UNAVAILABLE

Show a clear message such as:

```text
Backend unavailable.

Start the FastAPI server and verify:

http://127.0.0.1:8000/health
```

The frontend should not attempt to run the model itself as a fallback.

The project has a separate backend fallback-data mechanism.

---

# 25. FRONTEND PROJECT STRUCTURE

A reasonable structure:

```text
Frontend/
├── src/
│   ├── components/
│   │   ├── UploadPanel.jsx
│   │   ├── MetadataForm.jsx
│   │   ├── ResultPanel.jsx
│   │   └── AttributionTable.jsx
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .env
├── package.json
├── vite.config.js
└── README.md
```

The exact organization may differ, but keep API logic separated from presentation where practical.

---

# 26. FRONTEND API SERVICE

Keep API calls in one place.

Example:

```javascript
const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000";


export async function analyzeImage({
    file,
    metadata = {},
    outputFormat = "both",
}) {

    const formData = new FormData();

    formData.append(
        "file",
        file
    );

    formData.append(
        "metadata",
        JSON.stringify(metadata)
    );

    formData.append(
        "output_format",
        outputFormat
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

    const result =
        await response.json();

    return {
        ...result,

        imageUrl:
            result.image_url
                ? `${API_BASE_URL}${result.image_url}`
                : null,

        csvUrl:
            result.csv_url
                ? `${API_BASE_URL}${result.csv_url}`
                : null,

        jsonUrl:
            result.json_url
                ? `${API_BASE_URL}${result.json_url}`
                : null,
    };
}
```

---

# 27. CORS

The current development backend is configured to allow frontend requests from different local origins.

Typical setup:

```text
Frontend:
http://localhost:5173

Backend:
http://127.0.0.1:8000
```

Do not add browser-side CORS workarounds.

If production deployment changes the backend CORS policy, fix CORS at the backend/server level.

---

# 28. RUNNING THE FRONTEND

From `Frontend/`:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Typical Vite development URL:

```text
http://localhost:5173
```

The backend should separately be running at:

```text
http://127.0.0.1:8000
```

---

# 29. LOCAL DEVELOPMENT

Recommended competition development setup:

```text
Browser
  |
  v
React/Vite Frontend
  |
  | HTTP
  v
FastAPI Backend
  |
  +-- U-Net + ResNet34
  +-- YOLO11n
  |
  v
Drift / AIS
```

The browser does not need access to the model files.

---

# 30. CLOUD FRONTEND

When the backend is deployed remotely:

```text
Frontend
   |
HTTPS
   |
Hosted Backend
```

Set:

```text
VITE_API_URL=https://your-backend-domain
```

Rebuild the frontend.

Do not change API implementation just because the backend moved from localhost to the cloud.

---

# 31. RESPONSIVE DESIGN

The UI should work on:

```text
laptop
desktop
competition projector/display
```

Prioritize the demonstration view.

The annotated SAR image should remain large and easy to inspect.

The most important information should be visible without opening developer tools.

---

# 32. DEMO MODE / SAMPLE IMAGES

The backend repository contains representative examples:

```text
Backend/demo-data/SOS/
Backend/demo-data/DARTIS/
Backend/demo-data/OSSDD/
```

The frontend may provide:

```text
Load sample
```

buttons/dropdowns for these files, but this is optional.

Do not make the frontend download the complete datasets.

The Kaggle notebooks contain additional validation/prediction images and graphs.

Kaggle links:

### Oil model

```text
https://www.kaggle.com/code/siddhug01/finetuned-model-1-unet-rsnet34/notebook?scriptVersionId=345791019
```

### Ship model

```text
https://www.kaggle.com/code/siddhug01/notebook2ecd87b3ee/notebook?scriptVersionId=345833637
```

These notebook links are for research/training/evaluation reference, not frontend runtime dependencies.

---

# 33. WHAT THE FRONTEND SHOULD SHOW ABOUT MODEL PROVENANCE

A small "About model" section can show:

```text
Oil model:
U-Net + ResNet34

Ship model:
YOLO11n

Datasets:
SOS
DARTIS 2019
OSSDD / OpenSARShip
```

Do not expose unnecessary internal filesystem paths in the public UI.

---

# 34. AI CODING AGENT — BEFORE WRITING CODE

The AI agent should first read:

```text
Frontend/README.md

Backend/README.md
Backend/main.py
Backend/inference.py

Drift/run_ml_ais.py
Drift/attribution.py
```

Then inspect the repository.

There is no previous frontend implementation to preserve.

---

# 35. AI CODING AGENT — DO NOT

```text
❌ run PyTorch in the browser
❌ copy `.pt` files into src/
❌ download Kaggle datasets
❌ retrain models
❌ rewrite Backend
❌ rewrite Drift
❌ implement an independent AIS matcher
❌ calculate fake geographic coordinates
❌ fabricate metadata
❌ parse image colours to infer detections
❌ use hardcoded result data as live inference
❌ claim that rank 1 proves causality
```

---

# 36. AI CODING AGENT — DO

```text
✅ use the existing Backend API
✅ keep API base URL configurable
✅ use FormData for uploads
✅ support optional metadata
✅ support csv/json/both
✅ display backend PNG directly
✅ use CSV/JSON for structured values
✅ provide clear loading states
✅ handle no-oil cases
✅ handle no-ship cases
✅ handle missing metadata
✅ provide AIS attribution UI
✅ display ranked candidates
✅ provide attribution CSV download
```

---

# 37. FRONTEND TEST CHECKLIST

The frontend agent should verify:

```text
[ ] app starts
[ ] backend URL is configurable
[ ] image picker works
[ ] JPG works
[ ] PNG works
[ ] TIFF works if browser/backend combination supports the upload
[ ] optional metadata works
[ ] image-only request works
[ ] CSV selection works
[ ] JSON selection works
[ ] BOTH selection works
[ ] loading state works
[ ] annotated PNG displays
[ ] oil result displays
[ ] ship count displays
[ ] metadata displays
[ ] CSV download works
[ ] JSON download works
[ ] no-oil result displays correctly
[ ] no-ship result displays correctly
[ ] backend error displays correctly
[ ] AIS file selection works
[ ] /attribute request works
[ ] ranked candidates display
[ ] attribution CSV downloads
```

---

# 38. END-TO-END FRONTEND TEST

Use this sequence:

```text
1. Start Backend
2. Verify /health
3. Start Frontend
4. Open browser
5. Upload a demo SAR image
6. Click Analyze
7. Wait for /predict
8. Display annotated PNG
9. Display detection information
10. Download CSV
11. Select an AIS file
12. Run attribution
13. Display ranked candidates
14. Download attribution CSV
```

The expected architecture is:

```text
Browser
   ↓
POST /predict
   ↓
Backend
   ↓
PNG + CSV/JSON
   ↓
Browser
   ↓
POST /attribute
   ↓
Drift + AIS + VesselMatcher
   ↓
ranked candidates
```

---

# 39. FINAL FRONTEND CONTRACT

The frontend should provide a simple user experience:

```text
UPLOAD
   ↓
ANALYZE
   ↓
SEE OIL + SHIPS
   ↓
DOWNLOAD RESULTS
   ↓
RUN AIS ATTRIBUTION
   ↓
SEE RANKED VESSELS
```

The user should not have to understand:

```text
PyTorch
U-Net
YOLO
DARTIS metadata parsing
particle simulation
AIS interpolation
trajectory scoring
```

Those are backend/ML/Drift responsibilities.

---

# 40. FINAL HANDOFF TO THE FRONTEND DEVELOPER

Build the frontend around these existing backend contracts:

```text
GET /health

POST /predict
    file
    metadata
    output_format

GET /results/{request_id}.png
GET /results/{request_id}.csv
GET /results/{request_id}.json

POST /attribute
    ml_result
    ais_file
    backtrack_hours
    optional current_file
    optional wind_file

GET /results/{request_id}_attribution.csv
```

Do not change these contracts casually.

If the frontend requires additional fields, discuss the change with the Backend owner rather than silently changing the API.

---

# 41. FINAL COMPETITION PRINCIPLE

The frontend is the presentation layer.

It should make this pipeline understandable:

```text
SAR image
   ↓
Oil detected?
   ↓
Ships detected?
   ↓
Annotated scene
   ↓
Structured result
   ↓
AIS attribution
   ↓
Ranked candidate vessels
```

Keep the interface simple, fast and reliable.

The models already exist.

The backend already exists.

The Drift/AIS subsystem already exists.

The frontend's job is to **connect them cleanly and present the evidence clearly**.
