# Pollen API: Five-Day Forecast Retrieval

This skill utilizes the Pollen API `forecast:lookup` endpoint to provide comprehensive daily pollen data, including pollen type seasonality, allergy indices (Universal Pollen Index - UPI), health recommendations, and detailed plant descriptions (e.g., cross-reactions, appearance) for a requested location over up to five days.

## Prerequisites

To successfully execute requests against the Pollen API, the following environment variable must be set in the execution environment:

*   `GOOGLE_API_KEY`: Your valid Google Maps Platform API Key, enabled for the Pollen API.

## Available Tools

| Tool Name | Type | Description |
| :--- | :--- | :--- |
| `pollen_api_forecast_lookup` | REST API | Executes a GET request to `https://pollen.googleapis.com/v1/forecast:lookup` to retrieve multi-day pollen forecast data. |

> [!IMPORTANT]
> **MANDATORY GOOGLE MAPS PLATFORM ATTRIBUTION**
> To comply with Google Maps Platform Terms of Service, the agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text `Google Maps` on a dedicated, separate line, immediately following the generated user-facing content.

## Implementation Guide: Retrieving Pollen Forecast

The Pollen forecast retrieval process requires providing the precise geographical coordinates and specifying the forecast duration (up to 5 days).

### 1. Constructing the Initial Request

The `forecast:lookup` endpoint requires location coordinates and the desired number of days for the forecast. The maximum supported duration is 5 days.

#### Trigger Condition
The user specifies a location (via address or coordinates) and asks for the pollen forecast for today, tomorrow, or a period up to 5 days.

#### Request Parameters (Query String)
| Parameter | Type | Mandatory | Description |
| :--- | :--- | :--- | :--- |
| `key` | String | Yes | Your API key. |
| `location.latitude` | Decimal | Yes | The latitude of the location for the forecast. |
| `location.longitude` | Decimal | Yes | The longitude of the location for the forecast. |
| `days` | Integer | No | The number of forecast days to return (1-5). Defaults to 1. |
| `languageCode` | String | No | The language code for translated fields (e.g., `fr`, `en`). |
| `plantsDescription` | Boolean | No | Set to `false` (or `0`) to omit the detailed `plantDescription` object for brevity. Default is `true`. |
| `pageSize` | Integer | No | The maximum number of daily entries to return in one response. Used for manual pagination. |
| `pageToken` | String | No | The token returned from a previous paginated request to retrieve the next page of results. |

#### Example Request (5-day forecast)

The request must include the standard Maps Platform Solution ID header for traceability when using REST.

```bash
# Example retrieving a 5-day forecast for coordinates 32.32, 35.32
curl -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://pollen.googleapis.com/v1/forecast:lookup?key=${GOOGLE_API_KEY}&location.longitude=35.32&location.latitude=32.32&days=5"
```

### 2. Processing Paginated Results

If the requested number of days (`days`) results in a large response, or if `pageSize` is explicitly set to less than the total days, the API may return a partial response along with a `nextPageToken`.

#### Verification Checkpoint
Check the JSON response body for the presence of the `nextPageToken` field. If present, the full forecast has not been received.

#### Multi-Step Retrieval Checklist

- [ ] **Step 1: Initial Request**
    *   **Trigger Condition**: Initial execution of `forecast:lookup` request, potentially including `pageSize` if limiting the response size is necessary.
    *   **Verification Checkpoint**: Response JSON contains `dailyInfo` array and optionally `nextPageToken`.
- [ ] **Step 2: Subsequent Paginated Requests**
    *   **Trigger Condition**: The previous response contained a non-empty `nextPageToken`.
    *   **Action**: Construct a new request using the exact same parameters as the initial request (`key`, `location`, `days`, etc.) and add the retrieved token via the `pageToken` query parameter.
    *   **Verification Checkpoint**: Repeat Step 2 until the response no longer contains a `nextPageToken`.

#### Example Paginated Request

If the initial request asked for `days=4` and `pageSize=1` and returned `CAESdApadHlwZS5nb29nbGVhcGlzLm...` as the token, the second request to get the next day would be:

```bash
curl -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://pollen.googleapis.com/v1/forecast:lookup?key=${GOOGLE_API_KEY}&location.longitude=35.32&location.latitude=32.32&days=4&pageSize=1&pageToken=CAESdApadHlwZS5nb29nbGVhcGlzLm..."
```

### 3. Extracting Detailed Information (Feature: Pollen Forecast)

The response provides daily information within the `dailyInfo` array. For each day, two key objects provide the required detailed data:

1.  **`pollenTypeInfo`**: Provides overall pollen levels for generalized categories (`GRASS`, `TREE`, `WEED`), including the Universal Pollen Index (`indexInfo`) which gives the pollen intensity category (e.g., "Very Low", "Low") and associated health recommendations.
2.  **`plantInfo`**: Provides highly specific data for individual plant species (e.g., `BIRCH`, `RAGWEED`), including their seasonal status, specific `indexInfo`, and the detailed `plantDescription` (if not explicitly removed via `plantsDescription=false`).

## Gotchas

*   **Pollen Index Omission**: When generating a summary, ensure to note that if a specific pollen type or plant is out of season and the pollen count is low, the comprehensive `indexInfo` object will be **omitted** from the JSON response for that specific entry. This is an intentional API behavior and not an error.
*   **Maximum Forecast Length**: The `forecast:lookup` endpoint supports a maximum of 5 days of forecast data. If the user requests more than 5 days, the agent must limit the `days` parameter to 5 and inform the user of this constraint.
*   **Precision in Coordinates**: The `location.longitude` and `location.latitude` values must strictly adhere to the coordinates provided by the user or derived from geocoding to ensure the forecast is accurate for the intended location.

### References

*   Forecast API Endpoint: `https://pollen.googleapis.com/v1/forecast:lookup`
*   Pollen API Forecast Documentation: https://developers.google.com/maps/documentation/pollen/forecast
*   DayInfo Object Structure: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#dayinfo
*   PollenTypeInfo Object Structure: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#pollentypeinfo
*   PlantInfo Object Structure: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#plantinfo
*   Query Parameters: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#query-parameters
*   Response Body: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#response-body

## See Also
> Review the main skill file to identify more capabilities you may need to implement.