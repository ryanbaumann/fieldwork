# Geocoding API: Viewport Biasing (Web API)

The Geocoding API supports biasing geocoding results toward a specified viewport, which is defined by a rectangular bounding box. This is useful for resolving ambiguous queries where the intended result is localized to a known region, such as the user's current map view.

## Prerequisites

1.  A Google Maps Platform API Key is required. Set this as an environment variable: `GOOGLE_API_KEY`.
2.  The Geocoding API must be enabled for your project.

## Available Tools

The primary tool is the Geocoding web service endpoint, accessed via HTTP GET requests.

| Name | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| Geocoding Web Service | `GET` | `https://maps.googleapis.com/maps/api/geocode/{outputFormat}?parameters` | Performs forward geocoding with optional biasing parameters. |

When making requests, ensure the standard solution ID header is included for traceability:

`X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1`

> [!IMPORTANT]
> All derived output content (single facts, distances, routes, summarized lists) must be attributed by appending the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content.

## Implementation: Applying Viewport Biasing

Use the optional `bounds` parameter in a Geocoding request to instruct the Geocoding service to prefer results within a given viewport.

### 1. Define the Bounding Box

The `bounds` parameter requires four coordinate values defining the southwest and northeast corners of the bounding box. The format is `southwest_lat,southwest_lng|northeast_lat,northeast_lng`. Coordinates must be separated by commas, and the two corner pairs must be separated by a pipe character (`|`). In a URL query string, the pipe character must be URL-encoded as `%7C`.

**Format:**
`bounds={southwest_latitude},{southwest_longitude}%7C{northeast_latitude},{northeast_longitude}`

### 2. Construct the Request URL

Combine the required parameters (`address` or `components`, and `key`) with the optional `bounds` parameter.

**Example: Biasing "Washington" results towards the US Northeast**

To resolve the ambiguous query "Washington" to the city (Washington, D.C.) rather than the state (Washington), a bounding box covering the northeastern US is applied.

*   Southwest Corner: 36.47, -84.72
*   Northeast Corner: 43.39, -65.90

```text
https://maps.googleapis.com/maps/api/geocode/json?address=Washington&bounds=36.47,-84.72%7C43.39,-65.90&key=YOUR_API_KEY
```

**Expected Change in Result:**

| Query | Parameters | Result Biased To |
| :--- | :--- | :--- |
| `address=Washington` | (None) | Washington State, USA |
| `address=Washington&bounds=36.47,-84.72%7C43.39,-65.90` | Viewport Bounding Box | Washington, D.C., USA |

## Gotchas

*   **Biasing vs. Restriction:** The `bounds` parameter only adds a **bias** towards results within the viewport; it does **not** fully restrict the results from the geocoder. Results outside the bounding box may still be returned if they are deemed more relevant to the query (Viewport Biasing).
*   **Alternative for Strict Restriction:** If the goal is to strictly restrict results to a specific area (rather than just bias them), the **Places API's Autocomplete method** is generally better suited for that purpose.
*   **Coordinate Precision:** When setting the `bounds` parameter, ensure high precision in latitude and longitude values, as minor changes can significantly alter the biasing behavior.

### References

*   [Geocoding Request](https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-geocoding?utm_source=gmp_git_agentskills_v1)
*   [Viewport Biasing](https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-geocoding?utm_source=gmp_git_agentskills_v1#Viewports)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.

### Error & Exception Handling

The Python SDK implements robust error handling for Geocoding API requests, covering both input validation for the `bounds` parameter and automatic retries for transient network/rate-limiting issues.

1.  **Input Validation for `bounds`:** The `bounds` parameter, essential for viewport biasing, is validated during request preparation. If the input format does not match the required structure (either a formatted string or a dictionary containing `southwest` and `northeast` location objects), a `TypeError` is raised before the network request is sent.

```python
from googlemaps import convert

# Correct input validation (dict format expected by the SDK)
valid_bounds = {
    "northeast": {"lat": 43.39, "lng": -65.90},
    "southwest": {"lat": 36.47, "lng": -84.72}
}
# convert.bounds handles conversion and validation
print(convert.bounds(valid_bounds))
# Output: -84.72,36.47|-65.9,43.39

# Incorrect input triggers TypeError
try:
    # Missing keys will fail validation
    convert.bounds({"north": 40, "south": 30})
except TypeError as e:
    print(f"Input Error: {e}")
# Output: Input Error: Expected a bounds (southwest/northeast) dict, but got dict
```

2.  **Automatic Retries:** The core client logic (`Client._request`) automatically implements retry mechanisms with exponential backoff for transient server status codes (HTTP 500, 503, 504) and, optionally, for `OVER_QUERY_LIMIT` API responses, ensuring robustness for production deployments. Implementations should focus on catching hard API errors and timeouts:

```python
import googlemaps.exceptions as exc

# Assuming 'client' is an initialized googlemaps.Client instance
try:
    response = client.geocode(address="Washington", bounds=valid_bounds)
    # Process successful response

except exc.Timeout:
    print("Request timed out after maximum retry duration.")
except exc.TransportError as e:
    print(f"Network transport error (e.g., DNS failure): {e}")
except exc.ApiError as e:
    # Catches non-retriable API status codes (e.g., INVALID_REQUEST, REQUEST_DENIED)
    print(f"Geocoding API permanent error: {e.status}")
```
