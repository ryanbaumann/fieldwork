## Pollen API: Five-Day Forecast Lookup (Feature: Pollen Forecast)

The **Pollen Forecast** capability retrieves up to five days of daily pollen information, including the Universal Pollen Index (UPI) category, health recommendations, and detailed information about relevant plants (PlantInfo) and pollen types (PollenTypeInfo) for a specified geographic coordinate.

### Prerequisites

1.  **API Key**: A valid Google Maps Platform API key must be enabled for the Pollen API.
2.  **Authentication**: Requests are authenticated via a query parameter: `?key=YOUR_API_KEY`. It is recommended to manage the API key securely using an environment variable (`GOOGLE_API_KEY`).

### Available Tools

| Tool Name | Operation | Description |
| :--- | :--- | :--- |
| `web_request` | `GET` | Perform an HTTP GET request to the Pollen API `forecast:lookup` endpoint. |

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) from this service by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Request Structure and Parameters

The Pollen API Forecast is accessed via the `forecast:lookup` REST endpoint.

**Endpoint:**
`https://pollen.googleapis.com/v1/forecast:lookup`

**Mandatory Request Parameters (Query String):**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | string | Your API key. |
| `location.latitude` | float | The latitude of the location (e.g., `32.32`). **STRICT PRECISION MANDATE**: Must preserve exact numeric value. |
| `location.longitude` | float | The longitude of the location (e.g., `35.32`). **STRICT PRECISION MANDATE**: Must preserve exact numeric value. |
| `days` | integer | The number of forecast days requested (maximum 5). |

**Optional Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `languageCode` | string | Sets the IETF BCP-47 language code to translate fields like `displayName` and `healthRecommendations` (e.g., `fr`). |
| `plantsDescription` | boolean/integer | If set to `false` or `0`, removes the detailed plant description (`PlantDescription` object) from the response. Default is `true`. |
| `pageSize` | integer | Sets the number of daily forecasts returned per response. If requested days exceed this limit, pagination is required. |
| `pageToken` | string | Token used to retrieve the next page of results when pagination is active. |

**Mandatory Attribution Header (REST/Web APIs):**

When generating the request, ensure the following custom HTTP header is included for attribution tracing:
`X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1`

### Implementation Steps: Retrieving the Forecast

1.  **Identify Intent**:
    - [ ] **Trigger Condition**: User query requests pollen forecast or allergy index for a specific location and time frame.
    - [ ] **Verification Checkpoint**: Coordinates (lat/lng) and desired forecast duration (1-5 days) are captured.

2.  **Construct Request**: Build the API request URL using the base endpoint, the `GOOGLE_API_KEY`, and the required `location.latitude`, `location.longitude`, and `days` parameters, ensuring strict precision for coordinates.

3.  **Handle Pagination Loop**:
    - [ ] **Trigger Condition**: The user requested a multi-day forecast (`days` > 1) and either `pageSize` was explicitly set low, or the previous response contained a `nextPageToken`.
    - [ ] **Action**: If a `nextPageToken` is present in the response, immediately inform the user that only partial data was returned (e.g., "Day 1 of 4").
    - [ ] **Action**: To retrieve the next day's forecast, execute a subsequent GET request including the previous response's `pageToken` value in the query string.
    - [ ] **Verification Checkpoint**: Repeat the request process until the `nextPageToken` is absent from the response body, indicating the end of the requested forecast data.

4.  **Process and Present Data**:
    - [ ] Iterate through the `dailyInfo` array in the JSON response.
    - [ ] For each day, summarize the `pollenTypeInfo` (GRASS, TREE, WEED), detailing the Universal Pollen Index (`UPI`) `category` (e.g., "Very Low," "Low") and corresponding `healthRecommendations`.
    - [ ] If detailed plant information is requested, summarize the `plantInfo`, including cross-reaction details from the `plantDescription` object.

**Example Request (CURL):**

```bash
curl -X GET "https://pollen.googleapis.com/v1/forecast:lookup?key=${GOOGLE_API_KEY}&location.longitude=35.32&location.latitude=32.32&days=3&languageCode=fr" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1"
```

### Gotchas

1.  **Maximum Forecast Duration**: The `days` parameter can request a maximum of 5 days of forecast data.
2.  **Pagination Best Practice**: If `pageSize` is specified and limits the daily results (e.g., `pageSize=1` with `days=4`), the response will contain a `nextPageToken`. When querying for multi-day forecasts, the agent MUST check for this token and execute sequential requests using the `pageToken` parameter to retrieve the complete forecast.
3.  **Conditional Data Fields**: When a specific pollen type or plant is out of season and the pollen count is low, the `indexInfo` object (containing the UPI value and category) is **omitted** from the response for that specific entry. The agent should handle the potential absence of this object gracefully when summarizing plant or pollen type information.

### References

*   Forecast Endpoint Documentation: https://developers.google.com/maps/documentation/pollen/forecast
*   Forecast Lookup Reference: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup
*   Query Parameters Reference: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#query-parameters
*   DayInfo Object Structure: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#dayinfo
*   PollenTypeInfo Object Structure: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#pollentypeinfo
*   PlantInfo Object Structure: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#plantinfo

## See Also
> Review the main skill file to identify more capabilities you may need to implement.