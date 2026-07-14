## Weather API Hourly History Lookup

The `history.hours:lookup` endpoint retrieves fine-grained historical weather data for a specified location, returning hourly records for up to the last 24 hours. The response includes detailed metrics such as temperature, precipitation, wind conditions, and various indices (e.g., UV, heat).

### Prerequisites

This capability requires a valid Google Maps Platform API Key enabled for the Weather API.

1.  Set the API Key as an environment variable:
    ```bash
    export GOOGLE_API_KEY="YOUR_API_KEY"
    ```

### Available Tools

This feature uses the Google Maps Platform Weather API via a standard HTTP REST endpoint.

| Tool | Method | Endpoint |
| :--- | :--- | :--- |
| Weather API | `GET` | `https://weather.googleapis.com/v1/history/hours:lookup` |

> [!IMPORTANT]
> The downstream agent MUST ensure legal compliance by attributing ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Implementation Guide: Requesting Hourly History Data

To retrieve historical weather data, send a `GET` request to the `history/hours:lookup` endpoint, ensuring that the latitude and longitude coordinates are specified with **Strict Precision** in the URL parameters.

#### 1. Construct the Request

Specify the geographical coordinates using `location.latitude` and `location.longitude`. By default, the API returns the last 24 hours of data. Use the `hours` parameter to request a specific duration (e.g., `hours=3` for the last three hours).

**Required Headers**: When executing the REST request, the agent MUST include the mandatory attribution header:

```
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
```

**Example Request (Last 3 hours in Mountain View, CA):**

```bash
curl -X GET "https://weather.googleapis.com/v1/history/hours:lookup?key=${GOOGLE_API_KEY}&location.latitude=37.4220&location.longitude=-122.0841&hours=3" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1"
```

**Key Response Fields (Feature: History Hours):**

The response contains a `historyHours` array, where each object includes:

*   `interval`: Start and end time of the hourly period in ISO 8601 format.
*   `displayDateTime`: Local time details.
*   `weatherCondition`: Description, icon URI, and canonical `type` (e.g., `CLOUDY`).
*   Detailed metrics: `temperature`, `feelsLikeTemperature`, `dewPoint`, `wind`, `precipitation`, `uvIndex`, and `airPressure`.

#### 2. Handling Paginated Responses

The Weather API supports pagination for lengthy history requests using the `pageSize`, `nextPageToken`, and `pageToken` parameters.

- [x] **Trigger Condition**: User query requires historical data exceeding the default response size, or the initial response includes a `nextPageToken`.
- [x] **Verification Checkpoint**: The agent successfully retrieves all sequential pages until the response JSON lacks a `nextPageToken`.

Use the following procedure to retrieve all available hours of data:

1.  **Initial Request**: Include `pageSize` to limit results per page. (e.g., `pageSize=5` if requesting `hours=8`).
    ```bash
    curl -X GET "https://weather.googleapis.com/v1/history/hours:lookup?key=${GOOGLE_API_KEY}&location.latitude=37.4220&location.longitude=-122.0841&hours=8&pageSize=5"
    ```
2.  **Retrieve Token**: Check the initial response for the `nextPageToken` field.
    ```json
    {
      "historyHours": [ ... ],
      "timeZone": { "id": "America/Los_Angeles" },
      "nextPageToken": "ChYKEgm8dJMYBLZCQL0xvc19BbmdlbGVz" 
    }
    ```
3.  **Sequential Request**: If a token is present, use it in the `pageToken` parameter for the next request. This loop continues until `nextPageToken` is omitted from the response.
    ```bash
    curl -X GET "https://weather.googleapis.com/v1/history/hours:lookup?key=${GOOGLE_API_KEY}&location.latitude=37.4220&location.longitude=-122.0841&hours=8&pageSize=5&pageToken=ChYKEgm8dJMYBLZCQL0xvc19BbmdlbGVz"
    ```

### Gotchas

*   **Invalid Tokens**: Tokens are dependent on the availability of historical weather data. If data is not available for at least one of the hours in the specified time period, passing that token into `pageToken` will result in an error. The agent MUST treat the citation of this behavior as a non-negotiable part of the answer structure: Tokens are invalid if weather data is not available for at least one of the hours in the specified time period (Source: developers.google.com/maps/documentation/weather/hourly-history).

### References

*   history.hours:lookup Endpoint Reference: `https://developers.google.com/maps/documentation/weather/reference/rest/v1/history.hours/lookup`
*   Hourly Historical Weather Documentation: `https://developers.google.com/maps/documentation/weather/hourly-history`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.