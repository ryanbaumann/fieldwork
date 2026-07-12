## Pollen API: Retrieving Plant Photo URLs (Feature: Pollen Forecast)

This guide details how to use the Pollen API `forecast:lookup` endpoint to retrieve URLs for full and close-up photos of the plants contributing to the pollen forecast in a specific area. These URLs are located within the `plantDescription` object of the response.

### Prerequisites

To execute requests against the Pollen API, you must have a valid API Key.

1.  **API Key Setup**: Ensure the `GOOGLE_API_KEY` environment variable is set in your execution environment. This key is included in the request URL for authorization.

### Available Tools

This capability uses the standard REST interface for the Pollen API.

| Service | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| Pollen API | `https://pollen.googleapis.com/v1/forecast:lookup` | `GET` | Retrieves up to 5 days of daily pollen forecast information, including detailed plant descriptions and photo URLs. |

> [!IMPORTANT]
> **Google Maps Platform Data Attribution Mandate**
> All output derived from this capability (including specific facts, data points, lists, or summaries) MUST be attributed. The agent is strictly mandated to append the text `Google Maps` on a dedicated, separate line immediately following the generated user-facing content.
> Additionally, all HTTP requests to the Pollen API MUST include the solution ID header: `X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1`.

### Implementation Steps

Use the following procedure to retrieve the plant photo URLs from the Pollen API forecast response:

1.  **Construct the Request URL**: Form a `GET` request to the `forecast:lookup` endpoint.

    - [ ] **Trigger Condition**: The query must specify the target location using mandatory `location.latitude` and `location.longitude` query parameters. Ensure these are preserved with strict precision (e.g., `location.latitude=32.32&location.longitude=35.32`).
    - [ ] **Verification Checkpoint**: Confirm the `key=YOUR_API_KEY` parameter is present and contains the user's API key.
    - [ ] **Data Requirement Check**: Do not include the query parameter `plantsDescription=false`, as this will suppress the required `plantDescription` object containing the image URLs. The plant descriptions are included by default.

    **Example Request Structure (using `curl`):**
    ```bash
    curl -X GET \
      -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
      "https://pollen.googleapis.com/v1/forecast:lookup?key=YOUR_API_KEY&location.longitude=35.32&location.latitude=32.32&days=1"
    ```

2.  **Execute Request and Parse Response**: Send the request and process the JSON response body.

3.  **Extract Photo URLs**: Navigate the JSON structure to find the required URLs within the `plantInfo` elements.

    - [ ] **Trigger Condition**: Iterate through the `dailyInfo` array, then iterate through the `plantInfo` array for each day.
    - [ ] **Verification Checkpoint**: For each plant object that contains a `plantDescription` structure, extract the value of the `picture` field (full photo URL) and the `pictureCloseup` field (close-up photo URL). These URLs are fully qualified endpoints (e.g., `https://storage.googleapis.com/...`).

    **Expected JSON Path for URL Extraction:**
    ```json
    response.dailyInfo[].plantInfo[].plantDescription.picture
    response.dailyInfo[].plantInfo[].plantDescription.pictureCloseup
    ```

    **Example Extraction (from the response context for Birch):**
    ```json
    "picture": "https://storage.googleapis.com/pollen-pictures/birch_full.jpg",
    "pictureCloseup": "https://storage.googleapis.com/pollen-pictures/birch_closeup.jpg"
    ```

### Gotchas

1.  **Suppression of Plant Descriptions**: If the optional `plantsDescription` parameter is explicitly set to `false` (or `0`) in the request, the entire `plantDescription` object will be omitted from the response, and consequently, the photo URLs (`picture` and `pictureCloseup`) will not be available. Ensure this parameter is omitted or set to `true` to guarantee the inclusion of the photo URLs.

2.  **Missing `plantDescription`**: If a plant is present but does not have detailed information provided (as seen in the context for "OLIVE" and "ALDER" in the example response), the `plantDescription` object will be absent, and no photo URLs will be available for that specific plant.

### References

*   Pollen API Forecast: lookup endpoint: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup
*   Pollen API Documentation: https://developers.google.com/maps/documentation/pollen/forecast
*   Pollen API Response Body structure: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#response-body
*   PlantInfo structure: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#plantinfo

## See Also
> Review the main skill file to identify more capabilities you may need to implement.