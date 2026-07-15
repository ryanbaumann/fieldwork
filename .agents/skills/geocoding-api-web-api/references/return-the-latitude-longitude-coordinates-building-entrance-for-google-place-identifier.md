## Geocoding API: Retrieve Entrance Coordinates for a Place

The `SearchDestinations` method (Feature: Geocoding API) provides granular location data, including the precise latitude and longitude of building entrances for a given place. This is crucial for navigation and last-mile delivery applications.

### Prerequisites

1.  **API Key**: A valid Google Maps Platform API key must be enabled for the Geocoding API. Set the API key as an environment variable (`GOOGLE_API_KEY`) or similar secure mechanism.
2.  **Input Requirement**: The input must be a Place ID, address, or coordinate pair representing a place that can have a navigational destination (e.g., buildings, apartments). Place IDs representing large areas (localities, administrative areas) or address ranges are generally not supported by this method.
3.  **Supported Place IDs**: Ensure the Place ID provided represents a navigable entity. Supported types include `establishment`, `point_of_interest`, `premise`, `street_address`, and `subpremise`.

### Available Tools

| Tool | Capability | Endpoint | Protocol |
| :--- | :--- | :--- | :--- |
| `geocode.destinations` | SearchDestinations | `https://geocode.googleapis.com/v4/geocode/destinations` | REST (POST) |

### Implementation Guide: Extracting Entrance Locations

To retrieve entrance coordinates for a specific Place ID, follow these steps:

#### 1. Construct the Request Body

The request uses an HTTP POST method and requires a JSON body specifying the target location. To search by Place ID, include the `place` field.

**Trigger Condition**: User provides a Place ID (e.g., `ChIJY8sv5-i2j4AR_S6BlDDR42w`).
**Verification Checkpoint**: The request body contains the Place ID prefixed with `places/`.

```json
{
  "place": "places/PLACE_ID_HERE"
}
```

#### 2. Define Request Headers

Three headers are mandatory for API access and technical compliance:

1.  `X-Goog-Api-Key`: Your API key.
2.  `Content-Type`: Must be `application/json`.
3.  `X-Goog-FieldMask`: Must be specified to prevent errors and optimize performance.
4.  `X-Goog-Maps-Solution-ID`: Mandatory attribution header.

```text
-H "X-Goog-Api-Key: API_KEY" \
-H "Content-Type: application/json" \
-H "X-Goog-FieldMask: destinations.entrances.location,destinations.entrances.tags" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1"
```

#### 3. Execute the API Call

Send the POST request to the Destinations endpoint. Note the use of the highly specific field mask to retrieve only the required entrance location and tag data.

**Example Request (using `curl`)**

```bash
curl -X POST -d '{"place": "places/ChIJY8sv5-i2j4AR_S6BlDDR42w"}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: YOUR_API_KEY" \
-H "X-Goog-FieldMask: destinations.entrances.location,destinations.entrances.tags" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
https://geocode.googleapis.com/v4/geocode/destinations
```

#### 4. Extract Entrance Coordinates

The response will contain an array of destinations. Extract the `entrances` array from the primary destination object (`destinations[0]`). Each entrance object contains a `location` (with `latitude` and `longitude`) and an optional `tags` array.

**Checklist for Entrance Identification:**

- [ ] Identify the primary destination object in the response body (`destinations[0]`).
- [ ] Iterate through the `entrances` array within the primary destination.
- [ ] For each entry, extract the `location.latitude` and `location.longitude` coordinate pair.
- [ ] Check `tags[]` for the value `"PREFERRED"`.
- [ ] Prioritize returning coordinates for entrances tagged as `"PREFERRED"`, as these indicate the entrance most likely providing physical access to the destination place itself, rather than another location within the same building/complex.

**Example Response Snippet (Focused on Entrances)**

```json
{
  "destinations": [
    {
      "entrances": [
        {
          "location": {
            "latitude": 37.3735328,
            "longitude": -122.05694879999999
          },
          "tags": [
            "PREFERRED"
          ]
        }
        // ... potentially other entrances
      ]
    }
  ]
}
```

## Gotchas

*   **Mandatory FieldMask**: If the `X-Goog-FieldMask` header is omitted, the API will return an error. Using `X-Goog-FieldMask: *` is acceptable for testing, but specifying only the required fields (`destinations.entrances.location, destinations.entrances.tags`) is the recommended best practice for optimization.
*   **Unsupported Place Types**: Requests for entities like cities, regions, or abstract routes will fail or yield unexpected results. The Place ID must correspond to a physical, navigable location (e.g., a building or specific premises).
*   **Entrance Tags**: The existence of an entrance in the response does not guarantee access to the target business/place. Always check for the `"PREFERRED"` tag; if present, the entrance likely leads directly to the primary place. If the place is inside a larger complex (e.g., a store in a mall), non-preferred entrances may lead to other parts of the complex.

### References

*   SearchDestinations Method: `https://developers.google.com/maps/documentation/geocoding/reference/rest/v4/geocode.destinations/searchDestinations`
*   Search Destinations Request Body: `https://developers.google.com/maps/documentation/geocoding/reference/rest/v4/geocode.destinations/searchDestinations#request-body`
*   Entrance Field Description: `https://developers.google.com/maps/documentation/geocoding/reference/rest/v4/geocode.destinations/searchDestinations#entrances`
*   Choose Fields to Return (FieldMask): `https://developers.google.com/maps/documentation/geocoding/choose-fields`
*   Supported Place ID Types: `https://developers.google.com/maps/documentation/geocoding/search-for-destinations#supported_place_ids`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.

### Error & Exception Handling

When implementing the `SearchDestinations` method using the REST API, robust error handling, rate limit mitigation, and exponential backoff for transient failures are mandatory operational best practices, especially given the strict nature of the required `X-Goog-FieldMask`.

#### 1. Handling API Status and Field Mask Errors

The `SearchDestinations` endpoint requires specific headers, including the mandatory `X-Goog-FieldMask`. Failure to provide this field will result in an immediate API error (as noted in the Gotchas section). The recommended fields for extraction are explicitly:

```text
destinations.entrances.location,destinations.entrances.tags
```

Ensure client logic checks for HTTP status codes outside of 200 (like 400 for bad request/missing headers) and inspects the response body for API-specific error messages.

#### 2. Transport and Rate Limit Retries (Exponential Backoff)

For general REST API robustness, transport failures (timeouts, connection issues) and server errors (HTTP 500, 503, 504) must be handled with retries incorporating exponential backoff and jitter. The underlying client infrastructure should implement a mechanism similar to the following to ensure resilience and compliance with rate limiting guidelines.

**Mandatory Operational Best Practice:**
- [ ] Implement exponential backoff for retryable errors (HTTP 500, 503, 504) and potential `OVER_QUERY_LIMIT` responses, incorporating jitter (randomized delay) to prevent resource contention, as demonstrated in the Python client logic.

**Base Retry Logic (Conceptual Snippet from Client):**

```python
# General retryable HTTP status codes
_RETRIABLE_STATUSES = {500, 503, 504}

# --- Inside the request handler ---

if response.status_code in _RETRIABLE_STATUSES:
    # Recurse and retry request
    return self._request(url, params, first_request_time, retry_counter + 1, ...)

# Exponential Backoff Implementation with Jitter
if retry_counter > 0:
    # Increase sleep time by 1.5x per iteration, starting at 0.5s
    delay_seconds = 0.5 * 1.5 ** (retry_counter - 1)

    # Jitter (randomize) this value by 50% and pause.
    time.sleep(delay_seconds * (random.random() + 0.5))
```

**Core Exceptions for Client Implementation:**

```python
# Key exceptions used for robust client-side error differentiation:
class ApiError(Exception): ...
class TransportError(Exception): ...
class HTTPError(TransportError): ...
class Timeout(Exception): ...

# Specific exception for rate limiting, indicating a retriable condition:
class _OverQueryLimit(ApiError, _RetriableRequest): ...
```
