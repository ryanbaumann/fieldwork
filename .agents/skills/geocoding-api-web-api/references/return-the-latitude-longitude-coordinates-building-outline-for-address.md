# Geocoding API v4: Retrieve Building Outline (Destination Search)

The Geocoding API v4 `SearchDestinations` method provides hyperlocal context for a location, including the `displayPolygon`, which represents the physical boundary or outline of a structure like a building (`structureType: "BUILDING"`).

## Prerequisites and Setup

1.  **Authentication**: A valid Google Maps Platform API key is required. This key must be included in the `X-Goog-Api-Key` HTTP header.
2.  **Endpoint**: The functionality is accessed via the REST endpoint: `https://geocode.googleapis.com/v4/geocode/destinations`.
3.  **Authentication Scope**: If using OAuth 2.0, the token must be assigned the scope `https://www.googleapis.com/auth/maps-platform.geocode`.

> [!IMPORTANT]
> When providing any output content derived from Google Maps Platform data (including coordinates, addresses, or polygons), the agent MUST ensure legal compliance by appending the attribution text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content.

## Step-by-Step Guide: Extracting Building Outlines

The primary step is making an HTTP POST request to the Destinations endpoint, providing one source location (address, Place ID, or coordinates) and mandating the return of the `displayPolygon` using a Field Mask.

### 1. Construct the Request Body

Specify the target location using exactly one of the three required parameters (Required parameters):

| Input Type | JSON Request Body Structure | Notes |
| :--- | :--- | :--- |
| **Place ID** | `{"place": "places/ChIJY8sv5-i2j4AR_S6BlDDR42w"}` | Recommended for specificity. |
| **Unstructured Address** | `{"addressQuery": {"addressQuery": "601 S Bernardo Ave, Sunnyvale, CA 94087, USA"}}` | Address search does not resolve unstructured strings that don't represent a specific address. |
| **Location (Lat/Lng)** | `{"locationQuery": {"location": {"latitude": 37.37348780, "longitude": -122.05678064}}}` | Use this instead of passing coordinates as an `addressQuery` string. |

### 2. Enforce Field Mask for Polygon Retrieval

To efficiently retrieve the building outline, the request **MUST** include the `X-Goog-FieldMask` header (Required parameters). To obtain the primary destination's polygon, specify the path `destinations.primary.displayPolygon`.

```bash
# Example: Requesting the building outline for a Place ID
curl -X POST -d '{"place": "places/ChIJY8sv5-i2j4AR_S6BlDDR42w"}' \
  -H 'Content-Type: application/json' \
  -H "X-Goog-Api-Key: API_KEY" \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  -H "X-Goog-FieldMask: destinations.primary.displayPolygon,destinations.primary.location" \
  https://geocode.googleapis.com/v4/geocode/destinations
```

### 3. Extract the Coordinates from the Response

The building outline is returned as a GeoJSON `Polygon` structure within the `primary` object of the `destinations` array.

#### Structure of the `displayPolygon` Object

The response field is `displayPolygon` within the `primary` destination (Feature: Geocoding API v4 Destinations):

```json
"displayPolygon": {
  "type": "Polygon",
  "coordinates": [
    [
      [
        -122.056930138027,
        37.3735253692531
      ],
      // ... more coordinate pairs defining the outline
      [
        -122.056930138027,
        37.3735253692531
      ]
    ]
  ]
}
```

The `coordinates` field contains an array of linear rings (polygons), where each ring is an array of `[longitude, latitude]` pairs, following the GeoJSON standard.

## Advanced Usage: Filtering for Building Types

To explicitly ensure the result is a recognizable building and not a larger complex, use the `placeFilter` option with `structureType: "BUILDING"` in conjunction with a `locationQuery`.

```bash
# Example: Filter for a BUILDING structure type near coordinates
curl -X POST -d '{
  "locationQuery": {
    "location": {
      "latitude": 37.37348780,
      "longitude": -122.05678064
    },
    "placeFilter": {
      "structureType": "BUILDING"
    }
  },
  "languageCode": "en"
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
-H "X-Goog-FieldMask: destinations.primary.displayPolygon" \
https://geocode.googleapis.com/v4/geocode/destinations
```

## Gotchas

*   **Non-Navigable Places**: The `SearchDestinations` method only works for places that can have a navigational destination. Requests for large political entities (e.g., "USA", "New York City"), administrative areas, or historical names will not return usable destination data. (Note: the address or place ID you use to search for a destination must represent a place that can have a navigational destination.)
*   **Place ID Restrictions**: Place IDs inferred from address ranges (e.g., "10-20 Main St") or Plus Codes are not supported (Supported Place IDs). Only specific, navigable destinations (like `establishment`, `premise`, `street_address`) are supported.
*   **Field Mask Requirement**: Failing to provide a valid `X-Goog-FieldMask` header will result in an error, as there is no default list of returned fields in the response (Required parameters).

### References

*   [Search destinations request](https://developers.google.com/maps/documentation/geocoding/reference/rest/v4/geocode.destinations/searchDestinations?utm_source=gmp_git_agentskills_v1#request-body)
*   [SearchDestinations method](https://developers.google.com/maps/documentation/geocoding/reference/rest/v4/geocode.destinations/searchDestinations?utm_source=gmp_git_agentskills_v1)
*   [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea?utm_source=gmp_git_agentskills_v1)
*   [Learn more about EEA](https://developers.google.com/maps/comms/eea/faq?utm_source=gmp_git_agentskills_v1)
*   [Choose fields to return](https://developers.google.com/maps/documentation/geocoding/choose-fields?utm_source=gmp_git_agentskills_v1)
*   [Use OAuth](https://developers.google.com/maps/documentation/geocoding/oauth-token?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.

### Error & Exception Handling

When making requests to the Geocoding API v4 Destinations endpoint, robust handling of network issues and rate limits is essential. The recommended server-side implementation should incorporate mechanisms for retry logic, exponential backoff, and specific API error differentiation.

#### Recommended Retry and Exception Pattern

The standard library client (for server-side proxy implementations) defines specific HTTP status codes and API responses that should trigger retry attempts with exponential backoff. This ensures transient network failures or rate limit exhaustion are handled gracefully.

**1. Retriable Statuses and Mechanism:**

Requests failing with the following HTTP status codes should be retried using exponential backoff logic (e.g., waiting `0.5 * 1.5 ^ (retry_counter - 1)` seconds before the next attempt):

| HTTP Status Code | Description | Exception Triggered |
| :--- | :--- | :--- |
| 500 | Internal Server Error | `HTTPError` (Retriable) |
| 503 | Service Unavailable | `HTTPError` (Retriable) |
| 504 | Gateway Timeout | `HTTPError` (Retriable) |

**2. Query Limit Handling:**

If the API returns a status indicating the query rate limit has been exceeded, this should also be treated as a retriable condition, subject to the client's configuration (`retry_over_query_limit`).

| API Status | Description | Exception Triggered |
| :--- | :--- | :--- |
| OVER_QUERY_LIMIT | Client exceeded usage quota | `_OverQueryLimit` (Retriable)

```python
# Relevant exception types demonstrating retriable conditions

class ApiError(Exception):
    # ... Handles errors returned by the API status field

class HTTPError(TransportError):
    """An unexpected HTTP error occurred."""
    # 500, 503, 504 statuses are typically retriable.

class _RetriableRequest(Exception):
    """Signifies that the request can be retried."""
    pass

class _OverQueryLimit(ApiError, _RetriableRequest):
    """Signifies that the request failed because the client exceeded its query rate limit."""
    pass
```
