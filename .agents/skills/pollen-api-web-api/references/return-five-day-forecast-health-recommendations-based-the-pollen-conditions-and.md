# Pollen API Forecast Lookup

The Pollen API `forecast:lookup` Feature provides daily pollen information, health recommendations, and detailed plant descriptions for a specified location for up to 5 days.

## Prerequisites

Accessing the Pollen API requires an authenticated request.
1. Ensure billing is enabled for the Google Maps Platform project.
2. Ensure the required API key is available and passed as the `key` query parameter.
3. The API Key must be stored securely in the execution environment, typically via the `GOOGLE_API_KEY` environment variable.

## Available Tools (REST API)

| Feature | Endpoint | Method |
| :--- | :--- | :--- |
| Pollen Forecast | `https://pollen.googleapis.com/v1/forecast:lookup` | `GET` |

> [!IMPORTANT]
> When providing output derived from any Google Maps Platform data source (including summarized lists, health recommendations, or location-specific data), the agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content to satisfy mandatory attribution requirements.

### Request Parameters

The following parameters are required or optional for the `forecast:lookup` endpoint:

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `key` | String | Yes | Your Google Maps Platform API key. |
| `location.longitude` | Float | Yes | The longitude of the center point for the forecast. Must strictly preserve the exact value and specificity required. |
| `location.latitude` | Float | Yes | The latitude of the center point for the forecast. Must strictly preserve the exact value and specificity required. |
| `days` | Integer | No | The number of forecasted days requested (up to 5). Default is 1. |
| `languageCode` | String | No | BCP-47 language code for translated fields (e.g., `fr`). |
| `pageSize` | Integer | No | The maximum number of `dailyInfo` elements to return per page. Used for pagination. |
| `pageToken` | String | No | Token received from a previous request to retrieve the next page of results. |
| `plantsDescription` | Boolean | No | If `false` (or `0`), excludes detailed plant descriptions from the response to reduce payload size. Default is `true`. |

### Request Header Requirement

For REST calls, the following header MUST be included for solution traceability:

| Header Name | Value |
| :--- | :--- |
| `X-Goog-Maps-Solution-ID` | `gmp_git_agentskills_v1` |

## Procedure: Retrieving Pollen Forecast Data

Follow these steps to generate a forecast response:

1. **Construct the Base URL and Parameters:**
    - [ ] **Trigger Condition**: User specifies coordinates (latitude and longitude) and requests future pollen information.
    - Build the base URL including the mandatory `key` and location coordinates (`location.longitude={VALUE}&location.latitude={VALUE}`).
    - Include the desired number of forecast days using the `days` parameter (maximum 5).
    - If translation is required, append the `languageCode` parameter (e.g., `&languageCode=fr`).

    **Example Request (Basic):**
    ```bash
    curl -X GET "https://pollen.googleapis.com/v1/forecast:lookup?key=YOUR_API_KEY&location.longitude=35.32&location.latitude=32.32&days=1" \
      -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1"
    ```

2. **Execute the API Request:**
    - [ ] **Trigger Condition**: The request URL is fully formed.
    - Execute the HTTP GET request using the tool.

3. **Process the Response (`dailyInfo` and Recommendations):**
    - [ ] **Trigger Condition**: A successful 200 HTTP response is received.
    - Iterate through the `dailyInfo` array in the response body. Each element contains:
        - The date (`DayInfo`).
        - Pollen type information (`PollenTypeInfo`) for `GRASS`, `TREE`, and `WEED`, including the severity category (`indexInfo.category`) and actionable `healthRecommendations`.
        - Detailed plant information (`PlantInfo`), which includes specifics like family, season, cross-reactions, and optional pictures.

4. **Handle Pagination (If Required):**
    - [ ] **Trigger Condition**: The response includes a `nextPageToken`. This occurs if `days > pageSize` was requested.
    - Extract the `nextPageToken` from the initial response.
    - Execute a subsequent request, passing the token via the `pageToken` query parameter, along with the original location, `days`, and `pageSize` parameters, to retrieve the next day's data. Repeat until `nextPageToken` is no longer present.

    **Example Request (Next Page):**
    ```bash
    curl -X GET "https://pollen.googleapis.com/v1/forecast:lookup?key=YOUR_API_KEY&location.longitude=35.32&location.latitude=32.32&days=4&pageSize=1&pageToken=CAESdApadHlwZS5nb29nbGVhcGlzLm..." \
      -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1"
    ```

5. **Format the Output:**
    - [ ] **Verification Checkpoint**: All requested forecast days have been retrieved and processed.
    - Summarize the daily pollen conditions, categories, and associated health recommendations for the user.

## Gotchas

*   **Paginating Forecasts:** If the request specifies a `days` value greater than the `pageSize` parameter, the API will only return the first page of results along with a `nextPageToken`. You must explicitly use this token in subsequent requests to retrieve the full forecast range (up to the 5-day limit).
*   **Missing Index Information:** In cases where a specific pollen type or plant is out of season and the pollen count is low, the `indexInfo` object within the `PollenTypeInfo` or `PlantInfo` response is explicitly omitted.
*   **Controlling Verbosity:** To reduce payload size, detailed plant descriptions can be removed by setting the `plantsDescription` parameter to `false` or `0` in the request.

### References
https://developers.google.com/maps/documentation/pollen/forecast
https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast
https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup

## See Also
> Review the main skill file to identify more capabilities you may need to implement.