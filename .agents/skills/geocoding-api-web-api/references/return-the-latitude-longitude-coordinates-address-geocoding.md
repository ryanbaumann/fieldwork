# Geocoding: Address to Latitude/Longitude (Geocoding API)

This capability uses the Geocoding API (a Google Maps Platform web service) to convert street addresses, Plus Codes, or partial addresses into geographical coordinates (latitude and longitude).

## Prerequisites

To execute calls against the Geocoding API, you must have:

1.  A valid API key (`key` parameter).
2.  The API key must be securely provided, typically via the `GOOGLE_API_KEY` environment variable for tool execution environments.

## Available Tools

| Tool Name | Capability | Protocol | Description |
| :--- | :--- | :--- | :--- |
| `geocoding_api_rest_service` | Performs standard geocoding lookup. | REST/HTTPS | Sends a request to the Geocoding service to resolve an address string into coordinates. |

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) from this Google Maps Platform skill by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Implementation Guide: Standard Geocoding

The Geocoding API request is made via an HTTPS GET call to the following endpoint structure. JSON format is recommended (`outputFormat=json`).

### 1. Request Endpoint Structure

The request URL structure includes the standard web service solution ID for traceability (`X-Goog-Maps-Solution-ID`).

**Endpoint:**
`https://maps.googleapis.com/maps/api/geocode/{outputFormat}?parameters`

**Mandatory Request Headers (for REST calls):**
`X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1`

### 2. Required Parameters

A Geocoding request requires the `key` parameter and at least one location identifier:

| Parameter | Required | Description |
| :--- | :--- | :--- |
| `key` | Mandatory | Your application's API key. |
| `address` | Conditional | The URL-encoded street address or Plus Code to geocode. |
| `components` | Conditional | A filter of `component:value` pairs separated by a pipe (`|`). **Required** if `address` is not specified. |

**Example Geocoding Request (Address):**

To find the coordinates for "1600 Amphitheatre Parkway, Mountain View, CA":

```text
https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=YOUR_API_KEY
```

### 3. Optional Parameters (Biasing and Filtering)

The following parameters can be used to influence the search results:

| Parameter | Description | Effect | Usage Detail |
| :--- | :--- | :--- | :--- |
| `bounds` | Viewport bounding box. | Biases results towards the defined viewport (`lat,lng|lat,lng`). | Use `southwest_lat,southwest_lng|northeast_lat,northeast_lng`. This is a **bias**, not a restriction. |
| `region` | Region code (ccTLD). | Biases results to a specific region or country (e.g., `es` for Spain). | This is a **bias**, not a restriction. |
| `language` | Result language. | Specifies the language for returned results and address components. | Refer to the list of supported languages. |
| `components` | Component filter. | **Restricts** results by specific types (e.g., `country:US` or `postal_code:94043`). | Supported restrictions: `postal_code`, `country`. Others (`route`, `locality`, `administrative_area`) only **influence** results. |

### 4. Parsing the Response

The latitude and longitude coordinates are contained within the `results` array in the JSON response (or `<result>` element in XML).

**Target Path for Coordinates:**
The resulting coordinates are found in: `results[0].geometry.location`

The `location` object contains:
*   `lat`: Latitude of the geocoded location.
*   `lng`: Longitude of the geocoded location.

**Location Type:**
Always report the `location_type` (`results[0].geometry.location_type`), as it provides the precision of the match:
*   `ROOFTOP`: Precise location.
*   `RANGE_INTERPOLATED`: Approximation based on street range.
*   `GEOMETRIC_CENTER`: Center of a feature (e.g., a street).
*   `APPROXIMATE`: Lowest precision.

**Example Response Snippet (Relevant Fields):**

```json
{
    "results": [
        {
            "formatted_address": "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA",
            "geometry": {
                "location": {
                    "lat": 37.4222804,
                    "lng": -122.0843428
                },
                "location_type": "ROOFTOP",
                "viewport": { /* ... */ }
            },
            "place_id": "ChIJRxcAvRO7j4AR6hm6tys8yA8",
            "types": [ "street_address" ]
        }
    ],
    "status": "OK"
}
```

### 5. Status Codes and Error Differentiation

The agent MUST check the top-level `status` field in the response before attempting to extract coordinates.

| Status Code | Meaning | Agent Action |
| :--- | :--- | :--- |
| `"OK"` | Success. | Proceed to extract coordinates from `results[]`. |
| `"ZERO_RESULTS"` | Geocode was successful but found no matches (e.g., non-existent address). | Report that the address could not be resolved. |
| `"OVER_DAILY_LIMIT"` | Key issue, billing not enabled, or usage cap exceeded. | Report quota issue (See the [Maps FAQ](https://developers.google.com/maps/faq?utm_source=gmp_git_agentskills_v1#over-limit-key-error)). |
| `"OVER_QUERY_LIMIT"` | Rate limit exceeded. | Recommend implementing Exponential Backoff and retrying. |
| `"INVALID_REQUEST"` | Query is missing a required parameter (`address` or `components`). | Check request structure and parameters. |
| `"UNKNOWN_ERROR"` | Server error. | Recommend retrying the request. |

## Gotchas

*   **Unsupported Queries:** Geocoding (address lookup) is designed for structured addresses. It explicitly does not support resolving raw latitude and longitude coordinates (use Reverse Geocoding instead), or unstructured strings that do not represent an address, such as `"37.422131,-122.084801"` or business/chain names without a specific location (e.g., `"Tesco near Dallas, Texas"`).
*   **Parsing Best Practice:** Never programmatically parse the `formatted_address`. Instead, use the individual structured fields in the `address_components[]` array.
*   **Partial Match:** If the response contains a `partial_match: true` flag, the agent MUST report this to the user, indicating that the geocoder did not find an exact match for the original request and an alternative address may have been suggested.

### References

*   https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-geocoding
*   https://developers.google.com/maps/documentation/geocoding/web-service-best-practices#BuildingURLs
*   https://developers.google.com/maps/documentation/geocoding/guides-v3/get-api-key
*   https://developers.google.com/maps/faq#over-limit-key-error

## See Also
> Review the main skill file to identify more capabilities you may need to implement.

### Error & Exception Handling

The agent MUST implement robust error checking by performing two mandatory steps: checking the HTTP status code (expect 200 OK) and validating the top-level `status` field in the JSON response, as defined in Section 5 of the main guide.

#### 1. Handling API Status Codes

The Python SDK demonstrates standard handling of Geocoding responses. Crucially, recoverable errors like `OVER_QUERY_LIMIT` are raised as specific exceptions (`_OverQueryLimit`) to trigger client-side retry logic, while fatal configuration errors (`OVER_DAILY_LIMIT`) or structural errors (`INVALID_REQUEST`) are wrapped in a generic `ApiError`.

**Production Pattern (Status Check):**
(Derived from `client._get_body` logic)
```python
if response.status_code != 200:
    # Handle non-200 HTTP transport errors
    raise HTTPError(response.status_code)

body = response.json()
api_status = body["status"]

if api_status in ("OK", "ZERO_RESULTS"):
    # Proceed or report 'ZERO_RESULTS' to the user.
    return body

if api_status == "OVER_QUERY_LIMIT":
    # This exception type triggers retry via Exponential Backoff in the client.
    raise _OverQueryLimit(api_status, body.get("error_message"))

# Handle other fatal API errors (e.g., INVALID_REQUEST, OVER_DAILY_LIMIT)
raise ApiError(api_status, body.get("error_message"))
```

#### 2. Mandatory Exponential Backoff for Rate Limiting

As mandated by the documentation for `OVER_QUERY_LIMIT` responses (Section 5), the client MUST implement Exponential Backoff with jitter before retrying the request. The supporting SDK defines a standard strategy for calculating the delay.

**Backoff Implementation Detail (Conceptual):**
When the `OVER_QUERY_LIMIT` status is detected, the retry attempt uses a calculated delay based on the attempt number (`retry_counter`).

```python
# Pattern for Exponential Backoff with Jitter (derived from client._request)
import time
import random
# ... inside the retry loop ...
retry_counter = 1 # Starts at 1 for the first retry attempt

# Calculate delay (e.g., 0.5 * 1.5 ^ (i-1) seconds, plus jitter)
delay_seconds = 0.5 * 1.5 ** (retry_counter - 1)
jittered_delay = delay_seconds * (random.random() + 0.5)

time.sleep(jittered_delay)
# Retry request
```

#### Gotcha Checklist

The agent MUST follow these procedural steps when encountering specific response flags or error types:

- [ ] Check the top-level `status` field for `OK` before proceeding to parse coordinates. (Section 5)
- [ ] If `status` is `OVER_QUERY_LIMIT`, apply Exponential Backoff before retrying. (Section 5)
- [ ] If `status` is `ZERO_RESULTS`, report that the address could not be resolved. (Section 5)
- [ ] Report the `location_type` (`ROOFTOP`, `APPROXIMATE`, etc.) to indicate coordinate precision. (Section 4)
- [ ] If `partial_match: true` flag is present in the response, report this to the user, indicating an alternative address may have been suggested. (Gotchas)
