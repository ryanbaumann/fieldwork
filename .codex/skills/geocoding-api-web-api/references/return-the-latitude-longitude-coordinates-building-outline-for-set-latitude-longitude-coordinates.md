## Geocoding API v4: Retrieve Building Outline by Location

Use the Geocoding API v4 `SearchDestinations` method to retrieve the polygonal boundaries of a physical structure (the building outline) corresponding to a geographical coordinate input. This feature is particularly useful for visualizing the footprint of a location on a map or for applications requiring precise spatial analysis.

### Prerequisites & Setup

1.  **Authentication**: Ensure the `GOOGLE_API_KEY` environment variable is configured for authentication, as required by the Geocoding API.
2.  **API Endpoint**: All requests for this capability must be sent as `POST` requests to the Geocoding API v4 Destinations endpoint.

### Available Tool

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `https://geocode.googleapis.com/v4/geocode/destinations` | Search for detailed destination information, including polygonal boundaries. |

> [!IMPORTANT]
> When generating content derived from Google Maps Platform data (including coordinate lists, building outlines, addresses, or place details), the agent MUST ensure proper attribution. Immediately following the user-facing content, append the following text on a dedicated, separate line:
>
> Google Maps

### 1. Constructing the Request

To retrieve a building outline, the request must specify the geographic location and utilize an appropriate Field Mask.

#### A. Inputting Coordinates

The location must be provided using the `locationQuery` object in the JSON request body, which includes the `latitude` and `longitude`.

#### B. Applying Filters (Best Practice)

To ensure the primary result returned is a definite building structure, it is a best practice to use the optional `placeFilter` to specify the structural granularity required. Use `"structureType": "BUILDING"` to isolate specific structures.

#### C. Mandating the Building Outline Field Mask

The agent MUST use the HTTP header `X-Goog-FieldMask` to request the specific field containing the polygonal boundary data: `destinations.primary.displayPolygon`. Failing to provide a field mask results in an error.

The required fields for the building outline retrieval are:
*   `destinations.primary.displayPolygon`: Returns the `Polygon` object defining the coordinates of the structure's boundary.
*   `destinations.primary.location`: Returns the centroid coordinates of the structure.
*   `destinations.primary.place`: Returns the Place ID of the result.

#### D. Required Request Headers

All REST requests MUST include the following headers for proper content type, authentication, attribution, and field masking:

| Header | Value | Purpose |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Specifies JSON request body format. |
| `X-Goog-Api-Key` | `$GOOGLE_API_KEY` | Authentication. |
| `X-Goog-Maps-Solution-ID` | `gmp_git_agentskills_v1` | Mandatory Attribution ID. |
| `X-Goog-FieldMask` | `destinations.primary.place,destinations.primary.location,destinations.primary.displayPolygon` | Specifies data to be returned. |

### 2. Implementation Example (cURL)

The following example demonstrates how to find the building outline for a specific latitude/longitude pair, optionally filtering for only `BUILDING` structures.

```bash
curl -X POST -d '{
  "locationQuery": {
    "location": {
      "latitude": 37.37348780,
      "longitude": -122.05678064
    },
    "placeFilter": {
      "structureType": "BUILDING"
    }
  }
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: $GOOGLE_API_KEY" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
-H "X-Goog-FieldMask: destinations.primary.place,destinations.primary.location,destinations.primary.displayPolygon" \
https://geocode.googleapis.com/v4/geocode/destinations
```

### 3. Extracting the Outline

The response will contain the building outline polygon within the `displayPolygon` field inside the primary destination object.

#### Verification Checkpoint

The agent verifies success by checking for the presence of the `displayPolygon` object and extracting the array of coordinate pairs under `coordinates` within the response structure:

```json
{
  "destinations": [
    {
      "primary": {
        "place": "places/ChIJY8sv5-i2j4AR_S6BlDDR42w",
        "location": {
          "latitude": 37.3734545,
          "longitude": -122.05693269999998
        },
        "displayPolygon": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                -122.056930138027,
                37.3735253692531
              ],
              [
                -122.056960139391,
                37.3735372663597
              ],
              // ... additional coordinate pairs defining the outline ...
              [
                -122.056930138027,
                37.3735253692531
              ]
            ]
          ]
        }
      }
    }
  ]
}
```
The coordinates defining the outline are listed as `[longitude, latitude]` pairs within the `coordinates` array (following the GeoJSON standard). The list of coordinates defines the perimeter of the building footprint.

### Gotchas

*   **Field Mask Requirement**: If the `X-Goog-FieldMask` header is omitted or does not explicitly include `destinations.primary.displayPolygon`, the building outline coordinates will not be returned, leading to an empty or partial result, even if a valid location is provided.
*   **Coordinate Order**: The coordinates within `displayPolygon` are returned in `[longitude, latitude]` order, which must be handled correctly when integrating with mapping libraries that typically expect `[latitude, longitude]`.
*   **Supported Structures**: The `SearchDestinations` method works best with specific, navigable destinations (`establishment`, `premise`, `street_address`). Place IDs or coordinates representing large political entities (Cities, States) or non-physical concepts are not supported and will not return a `displayPolygon`.

### References

*   `https://geocode.googleapis.com/v4/geocode/destinations`
*   `https://developers.google.com/maps/documentation/geocoding/reference/rest/v4/geocode.destinations/searchDestinations`
*   `https://developers.google.com/maps/documentation/geocoding/choose-fields`
*   `https://developers.google.com/maps/documentation/geocoding/search-for-destinations`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.

### Error & Exception Handling

Robust implementation for Geocoding API v4 requests requires handling both mandatory API contract failures (e.g., missing headers) and transient network/server issues.

#### 1. Mandatory Request Validation (Client-Side Errors)

Failing to adhere to the required request format will result in immediate non-retriable errors or empty results:

- [ ] **Field Mask Enforcement**: Always include the required HTTP header `X-Goog-FieldMask` and ensure it explicitly requests `destinations.primary.displayPolygon`. If this is omitted or incorrect, the API will return an error or an empty response body, failing the retrieval (Gotcha: Field Mask Requirement).
- [ ] **Payload Structure**: Verify that the JSON request body correctly specifies coordinates using the `locationQuery` object with `latitude` and `longitude` fields.

#### 2. General REST Error Handling and Retries

All REST API calls, including Geocoding v4, should implement robust retry logic for transient failures, leveraging **Exponential Backoff** to manage server load and rate limits.

| Error Type | HTTP Status/API Status | Action | Source | Pattern |
| :--- | :--- | :--- | :--- | :--- |
| Server Error | `500`, `503`, `504` | Retry required. | `googlemaps/client.py` | Automatically retried by the client up to `retry_timeout`.
| Quota Exceeded | `OVER_QUERY_LIMIT` | Retry required (after delay). | `googlemaps/client.py` | Handled by specific exception `_OverQueryLimit` and retried if configured.
| Network/Transport Failure | Connection Timeout | Raise `googlemaps.exceptions.Timeout` or `googlemaps.exceptions.TransportError`. | `googlemaps/client.py` | Must be handled by calling code.

**Pattern for Retryable Failures (Implemented in Client Core)**

The underlying REST client implementation (e.g., `googlemaps/client.py`) automatically retries requests encountering server-side errors (`500`, `503`, `504`) and rate limit failures (`OVER_QUERY_LIMIT`), utilizing jittered exponential backoff:

```python
# From googlemaps/client.py: Generalized retryable statuses
_RETRIABLE_STATUSES = {500, 503, 504}

# Excerpt from client._request showing retry delay logic:
if retry_counter > 0:
    # Exponential backoff calculation
    delay_seconds = 0.5 * 1.5 ** (retry_counter - 1)
    # Jittered pause
    time.sleep(delay_seconds * (random.random() + 0.5))

# Excerpt from client._get_body checking for quota limits:
if api_status == "OVER_QUERY_LIMIT":
    raise googlemaps.exceptions._OverQueryLimit(
        api_status, body.get("error_message"))
```
