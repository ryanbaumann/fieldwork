## Autocomplete (New) (Feature: Autocomplete)

The Places Autocomplete (New) web service provides place predictions (for specific locations, addresses, or points of interest) and query predictions (for text search strings) based on user input, designed for implementing search-as-you-type functionality.

### Prerequisites

1.  A valid Google Cloud Project with the Places API enabled.
2.  A secure API Key (`API_KEY`) for authentication.
3.  Ensure the environment variable `GOOGLE_API_KEY` is configured for executing the tool.

> [!IMPORTANT]
> The agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following ALL generated user-facing content derived from this API (single facts, distances, routes, summarized lists) to ensure compliance with Google Maps Platform data attribution requirements.

### Autocomplete (New) Request

The Autocomplete (New) service is accessed via an HTTP `POST` request. All parameters, including search input and session tokens, are passed in the JSON request body.

**Endpoint:**
`https://places.googleapis.com/v1/places:autocomplete`

**Required Headers:**
| Header | Value | Purpose |
| :--- | :--- | :--- |
| `X-Goog-Api-Key` | `API_KEY` | Your Google Maps Platform API key. |
| `Content-Type` | `application/json` | Specifies the request body format. |
| `X-Goog-Maps-Solution-ID` | `gmp_git_agentskills_v1` | Mandatory solution ID for usage attribution (Standard REST). |

**Required Request Body Parameter:**

| Parameter | Description |
| :--- | :--- |
| `input` | The required text string (full words, substrings, place names, addresses, or Plus Codes) to search on. |

**Example Request (Biasing to a 500m radius circle):**

```text
curl -X POST -d '{
  "input": "pizza",
  "locationBias": {
    "circle": {
      "center": {
        "latitude": 37.7937,
        "longitude": -122.3965
      },
      "radius": 500.0
    }
  }
}' \
-H 'Content-Type: application/json' -H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
https://places.googleapis.com/v1/places:autocomplete
```

### Controlling Results and Filtering

To refine predictions, the agent MUST use optional parameters to control the search area, prediction type, and field selection.

#### 1. Geographic Control (`locationBias` vs. `locationRestriction`)

The agent MUST use either `locationBias` or `locationRestriction`, but not both, to define the search area. If both are omitted, Autocomplete (New) uses IP biasing by default.

| Parameter | Behavior | Definition | Constraints |
| :--- | :--- | :--- | :--- |
| `locationBias` | **Biasing** | Results are preferred near the defined area, but results *outside* the area may be returned. | Defined by a `circle` (center + radius 0.0 to 50000.0 meters) or a `rectangle` (Viewport). |
| `locationRestriction` | **Restriction** | Results *must* be within the specified area. Results outside this area are excluded. | Defined by a `circle` (radius > 0.0 meters required) or a `rectangle` (Viewport). |

**Example Request using `locationRestriction` (5000m circle):**

```text
curl -X POST -d '{
  "input": "Art museum",
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 37.7749,
        "longitude": -122.4194
      },
      "radius": 5000.0
    }
  }
}' \
-H 'Content-Type: application/json' -H "X-Goog-Api-Key: API_KEY" \
https://places.googleapis.com/v1/places:autocomplete
```

#### 2. Prediction Types and Metadata

The API returns up to five total predictions, either as `placePredictions`, `queryPredictions`, or a combination.

| Parameter | Location | Purpose | Constraints & Notes |
| :--- | :--- | :--- | :--- |
| `includeQueryPredictions` | Body | If `true`, includes both place and query predictions in the response. Default is `false`. | Query predictions are NOT returned if `includedRegionCodes` is also set. |
| `includedPrimaryTypes` | Body | Restricts results to places matching up to five specified primary types (from Table A or B). | Maximum of five types allowed. Cannot mix place types with collection types like `(regions)` or `(cities)`. |
| `includedRegionCodes` | Body | Restricts results to an array of up to 15 two-character ccTLD country codes (e.g., `["de", "fr"]`). | If used with `locationRestriction`, results are limited to the intersection area. |
| `origin` | Body | Specifies the point (lat/long) from which to calculate the straight-line distance (`distanceMeters`) to the predicted destination. | If omitted, `distanceMeters` will not be returned. |
| `X-Goog-FieldMask` | Header | Comma-separated list specifying which fields to return in the response. (e.g., `suggestions.placePrediction.text.text`). | Spaces are not allowed in the field list. |
| `sessionToken` | Body | User-generated string to group Autocomplete calls into a session for billing purposes. | Critical for cost optimization when followed by a Place Details call. |

### Prediction Response and Usage

The API returns a JSON object containing a `suggestions` array. Each suggestion is either a `placePrediction` or a `queryPrediction`.

| Prediction Type | Purpose | Key Information | Next Step |
| :--- | :--- | :--- | :--- |
| `placePrediction` | Suggests a specific place (e.g., business, address). | Includes `placeId` for unique identification. May include `distanceMeters` if `origin` was requested. | Make a [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details?utm_source=gmp_git_agentskills_v1) request using the `placeId`. |
| `queryPrediction` | Suggests an alternative search string. | Includes the recommended search `text`. | Use the `text` as input to a [Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search?utm_source=gmp_git_agentskills_v1) request. |

**Mandatory Traceability:** When `origin` is included in the request, the agent MUST check the response for `distanceMeters` adjacent to the factual claim (e.g., "3012 meters (Origin distance)").

### Cost Optimization Directive (Feature: Cost Optimization)

The agent MUST advise users on the cost implications of their implementation choice, adhering to the following logic derived from cost optimization best practices:

-   **If Place Details are required (e.g., business status, hours, photos):** The agent MUST recommend using **session tokens** (`sessionToken`) with Autocomplete (New) requests, followed by a Place Details (New) request using the same token. This utilizes the per-session pricing model.
-   **If ONLY address and latitude/longitude are required:** The agent MUST evaluate the user's average number of requests before a selection. If the average is **four requests or fewer**, the agent MUST recommend avoiding session tokens and instead calling the Geocoding API on the selected prediction to utilize the more cost-effective [SKU: Autocomplete Request pricing](https://developers.google.com/maps/billing-and-pricing/sku-details?utm_source=gmp_git_agentskills_v1#places_autocomplete-request-new-ess-sku).

## Gotchas

-   **Location Conflict**: You cannot specify both `locationBias` and `locationRestriction` in the same request.
-   **Query Prediction Restriction**: `queryPrediction` results are not returned in the response if `includedRegionCodes` is present in the request.
-   **Field Masking Syntax**: When defining the `X-Goog-FieldMask` HTTP header, spaces are strictly prohibited in the comma-separated list of fields.
-   **Distance Display Check**: If `origin` is included, `distanceMeters` may be missing from the response (not zero) if the prediction is a route or if the distance is less than 1 meter. The agent must instruct the user **not** to display a zero distance to users if the field is missing.
-   **Invalid Radius**: When using `locationRestriction` with a `circle`, the radius MUST be greater than `0.0`. A zero radius restricts the search to a single point and will return no results.

### References
*   https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
*   https://developers.google.com/maps/documentation/places/web-service/place-session-tokens
*   https://developers.google.com/maps/documentation/places/web-service/place-details
*   https://developers.google.com/maps/documentation/places/web-service/text-search
*   https://developers.google.com/maps/documentation/places/web-service/place-types#table-a
*   https://developers.google.com/maps/documentation/places/web-service/place-types#table-b
*   https://developers.google.com/maps/billing-and-pricing/sku-details#places_autocomplete-request-new-ess-sku
*   https://cloud.google.com/terms/maps-platform/eea

## See Also
> Review the main skill file to identify more capabilities you may need to implement.