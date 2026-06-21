# Pollen API: Five-Day Forecast Lookup

This skill provides instructions for using the `forecast:lookup` endpoint of the Pollen API to retrieve comprehensive daily pollen information for up to five days for a given geographic coordinate.

## 1. Prerequisites and Setup

1.  **API Key**: Ensure you have a valid Google Maps Platform API key enabled for the Pollen API.
2.  **Environment Variables**: Set the API key as a globally accessible environment variable.

```bash
export GOOGLE_API_KEY="YOUR_API_KEY"
```

## 2. Available Tools (REST API)

The pollen forecast is retrieved using a standard HTTP GET request.

| Name | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `forecast:lookup` | `GET` | `https://pollen.googleapis.com/v1/forecast:lookup` | Retrieves daily pollen information for a specific location. |

> [!IMPORTANT]
> **MANDATORY DATA ATTRIBUTION REQUIREMENT**
> All output content derived from the Pollen API (facts, index values, health recommendations, seasonal details) MUST be attributed. The agent MUST append the text `Google Maps` on a dedicated, separate line immediately following the user-facing content derived from this skill. Furthermore, when executing the REST API call, the agent MUST include the solution ID header:
> `X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1`

## 3. Implementation: Requesting a Forecast

To get the pollen forecast, construct a GET request specifying the location and the desired number of days (up to 5).

### 3.1. Required Parameters

The request requires the geographic coordinates of the target location.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | string | Your API Key. |
| `location.latitude` | float | Latitude of the location (e.g., `32.32`). |
| `location.longitude` | float | Longitude of the location (e.g., `35.32`). |

### 3.2. Optional Control Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `days` | integer | The number of forecast days requested (1-5). Defaults to 1 if omitted. |
| `languageCode` | string | Language code for translated fields (e.g., `fr`). |
| `plantsDescription` | boolean | Set to `false` to omit the detailed plant description fields (`plantDescription`) from the response. Defaults to `true`. |
| `pageSize` | integer | The maximum number of daily forecast entries to return per response page. Used for manual pagination. |

### 3.3. Forecast Request Checklist

Use this checklist when constructing the request to ensure all necessary data is gathered:

- [ ] **Trigger Condition**: User requests pollen forecast for a location/date range (up to 5 days).
- [ ] Determine the coordinates (`location.latitude`, `location.longitude`) from the user query.
- [ ] Determine the number of days (`days`, max 5). If unspecified, set `days=1`.
- [ ] If required, set `languageCode` and `plantsDescription`.
- [ ] Execute the GET request, including the solution ID header (if using a client library) or ensuring it's appended (if using `curl` or similar command-line tool, typically as `&solution_id=gmp_git_agentskills_v1` for URL parameters if headers are not explicitly supported for the platform).

#### Example Request (3-day forecast, standard output)

```bash
curl -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://pollen.googleapis.com/v1/forecast:lookup?key=${GOOGLE_API_KEY}&location.longitude=35.32&location.latitude=32.32&days=3"
```

## 4. Response Structure and Data Extraction

The response body contains the `dailyInfo` array, where each element represents a day in the forecast.

Key objects within the `dailyInfo` array (Section: response-body):
1.  **`DayInfo`**: Contains the forecast date, `PollenTypeInfo`, and `PlantInfo`.
2.  **`PollenTypeInfo`**: Provides seasonality, the `Universal Pollen Index` (`UPI`) value (0-5) and category (`Very Low` to `Very High`), color representation, and associated `healthRecommendations` for major pollen types (`GRASS`, `TREE`, `WEED`).
3.  **`PlantInfo`**: Details specific plants (e.g., `BIRCH`, `RAGWEED`), their individual UPI, descriptions (if `plantsDescription` is not set to `false`), and cross-reactions.

### 4.1. Handling Pagination (Multi-Day Requests)

If you request a forecast spanning multiple days (e.g., `days=4`) but restrict the results using `pageSize=1`, the response will only contain the first page and include a `nextPageToken`.

- [ ] **Trigger Condition**: Request uses `pageSize` parameter AND `days > pageSize`.
- [ ] If the initial response contains `nextPageToken`, subsequent requests MUST use the `pageToken` query parameter with the received token to fetch the next day's data.
- [ ] **Verification Checkpoint**: Continue fetching pages until the `nextPageToken` is omitted from the response, indicating the end of the requested forecast period.

#### Example Pagination Flow:

1.  Initial request (e.g., `days=4&pageSize=1`) returns the first day and `nextPageToken`.
2.  Second request uses the token:

```bash
curl -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://pollen.googleapis.com/v1/forecast:lookup?key=${GOOGLE_API_KEY}&location.longitude=35.32&location.latitude=32.32&days=4&pageSize=1&pageToken=CAESdApadHlwZS5nb29nbGVhcGlzLm..."
```
**(Mandatory Operational Best Practice)**: When discussing multi-day forecasts or data retrieval using `pageSize`, the agent MUST explicitly mention the requirement to check for and utilize the `nextPageToken` mechanism for continuous data retrieval.

## 5. Gotchas

1.  **Index Omission**: The `indexInfo` object is conditionally omitted from the response if a pollen type or plant is out of season and the corresponding pollen count is low. If parsing pollen index values, ensure robust handling for missing `indexInfo` fields.
2.  **Coordinate Precision**: When providing `location.longitude` and `location.latitude`, ensure the coordinates maintain the necessary decimal precision required for the location to ensure strict compliance and correct data retrieval.

### References

*   Forecast Endpoint: https://developers.google.com/maps/documentation/pollen/forecast
*   Query Parameters: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#query-parameters
*   Response Body Structure: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#response-body
*   DayInfo Object: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#dayinfo
*   PollenTypeInfo Object: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#pollentypeinfo
*   PlantInfo Object: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#plantinfo

## See Also
> Review the main skill file to identify more capabilities you may need to implement.