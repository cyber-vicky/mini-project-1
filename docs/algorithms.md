# CivicConnect Algorithms

## 1. Rule-Based/NLP Classification
**Purpose**: Automatically categorize a reported issue based on text analysis.
**Input**: Issue Title, Issue Description
**Processing**: 
- A predefined dictionary maps categories (e.g., `POTHOLE`) to relevant keywords (`pothole`, `crater`, `road`).
- The text is tokenized and scanned against the dictionary.
- A score is generated based on keyword frequency.
- Confidence is calculated based on the maximum score achieved.
**Output**: 
- `category` (e.g., 'POTHOLE')
- `confidence` (e.g., 0.85)
- `matchedKeywords` (e.g., ['pothole', 'road'])
**Example**: "There is a huge pothole on the main road." -> Maps to `POTHOLE` with high confidence.

## 2. Weighted Priority Scoring
**Purpose**: Determine the urgency and severity of an issue to prioritize municipal response.
**Input**: Predicted Category, Description, Nearby Reports Count
**Processing**:
- Extracts urgency keywords ('urgent', 'accident', 'danger').
- Extracts public impact keywords ('main road', 'school', 'hospital').
- Assigns base severity based on the category (e.g., 'WATER_LEAKAGE' is higher severity).
- Calculates a weighted score: `(Severity * 0.3) + (Urgency * 0.2) + (Impact * 0.2) + (Nearby * 0.15) + (Location Sensitivity * 0.15)`.
**Output**: `priority` (LOW, MEDIUM, HIGH, CRITICAL) and the numeric `score` (0-100).
**Example**: An issue with "urgent" and "school" keywords will heavily skew towards a CRITICAL priority.

## 3. Duplicate Detection
**Purpose**: Prevent municipal workers from addressing the exact same issue multiple times.
**Input**: New Issue Data (Category, Coordinates, Description, Timestamp).
**Processing**:
- Filters existing issues within a 7-day time window.
- Filters issues within a 500-meter geographic radius using the Haversine formula.
- Calculates Jaccard token similarity (Intersection over Union) of the descriptions to gauge textual similarity.
**Output**: `isDuplicate` (boolean), `duplicateScore` (percentage), `duplicateOf` (Issue ID).
**Example**: Two "Drainage" complaints reported 100 meters apart on the same day with 80% text similarity will be flagged as duplicates.

## 4. Department Routing
**Purpose**: Automatically route issues to the correct municipal department.
**Input**: Issue Category.
**Processing**:
- A deterministic mapping routes known categories to department IDs.
- Examples: `POTHOLE` -> `Public Works`, `GARBAGE` -> `Sanitation`.
**Output**: `recommendedDepartmentId`.

## 5. Hotspot Detection
**Purpose**: Identify geographic areas with high complaint density.
**Input**: All Active Issues Coordinates.
**Processing**:
- Divides the map into a geographic grid (~500m precision).
- Aggregates the number of active issues per grid cell.
- Filters out low-density cells.
**Output**: Array of hotspot coordinates with complaint counts.
