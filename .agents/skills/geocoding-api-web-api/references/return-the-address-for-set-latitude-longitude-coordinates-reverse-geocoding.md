# Geocoding API: Reverse Geocoding (Web API)

The process of Reverse Geocoding translates a geographical location (latitude and longitude coordinates) into a human-readable address. This functionality is provided via a standard REST endpoint.

## Prerequisites and Setup

1.  **Authentication**: Requests require an API key to identify your application for quota management. Ensure the execution environment has access to a valid `GOOGLE_API_KEY`.
2.  **Endpoint**: The standard Geocoding API endpoint is used for reverse geocoding requests.

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Implementation Guide

Use the `latlng` parameter in a GET request to the Geocoding API endpoint. The coordinates must be specified as a comma-separated string (e.g., `40.714224,-73.961452`) with **no space** between the latitude and longitude values.

### 1. Basic Reverse Geocoding Request

The request requires the coordinates (`latlng`) and your API key (`key`).

**REST Request Structure (JSON Output)**

```http
GET https://maps.googleapis.com/maps/api/geocode/json?latlng=40.714224,-73.961452&key=YOUR_API_KEY
```

**HTTP Headers (Mandatory Attribution)**

All REST calls must include the following header for solution tracking:

```
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
```

### 2. Request Parameters

| Parameter | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `latlng` | Coordinates (string) | Required | The latitude and longitude coordinates specifying the location for which a human-readable address is desired. Must be `latitude,longitude`. |
| `key` | String | Required | Your application's API key. |
| `language` | String | Optional | The language in which to return results. If not supplied, the geocoder attempts to use the preferred language (e.g., `Accept-Language` header). (See: [list of supported languages](https://developers.google.com/maps/faq?utm_source=gmp_git_agentskills_v1#languagesupport)). |
| `region` | String | Optional | The region code, specified as a ccTLD two-character value (e.g., `us`, `uk`). |
| `result_type` | String | Optional | Filters the results by one or more address types (e.g., `street_address|locality`). This acts as a post-search filter, discarding results that do not match the specified type(s). |
| `location_type` | String | Optional | Filters results by location accuracy (e.g., `ROOFTOP|APPROXIMATE`). This also acts as a post-search filter. |
| `extra_computations` | String | Optional | Specifies additional features to include in the response, such as `ADDRESS_DESCRIPTORS` or `BUILDING_AND_ENTRANCES`. Use multiple parameters for multiple features. |

### 3. Filtering Results by Type

The Geocoding API supports filtering reverse geocoding results using `result_type` (the type of address) and `location_type` (the accuracy of the location data). If both are used, the API returns only results matching both filters.

**Supported Location Types:**

| Value | Description |
| :--- | :--- |
| `ROOFTOP` | Returns addresses with street address precision. |
| `RANGE_INTERPOLATED` | Returns addresses that reflect an approximation interpolated between two precise points. |
| `GEOMETRIC_CENTER` | Returns geometric centers of a location (e.g., polyline or polygon). |
| `APPROXIMATE` | Returns addresses characterized as approximate. |

**Example: Filtering for Rooftop Street Addresses**

This example queries the coordinates `40.714224,-73.961452` and filters for results that are both `ROOFTOP` accurate and identified as a `street_address`.

```http
GET https://maps.googleapis.com/maps/api/geocode/json?latlng=40.714224,-73.961452&location_type=ROOFTOP&result_type=street_address&key=YOUR_API_KEY
```

### 4. Reading the Response

Reverse geocoding returns a standard Geocoding response object containing a `results` array. Each result contains:

*   `formatted_address`: The full, human-readable address string (e.g., "277 Bedford Avenue, Brooklyn, NY 11211, USA").
*   `address_components`: Detailed breakdown of the address (street number, route, city, etc.).
*   `types`: An array indicating the address type (e.g., `street_address`, `locality`, `country`).
*   `geometry`: Location data, including the precise `location` coordinates and the `location_type`.
*   `plus_code`: An encoded location reference derived from the coordinates (Plus codes).

## Gotchas

*   **Precision is an Estimate**: Reverse geocoding is inherently an estimate. The Geocoder attempts to find the closest *addressable* location. If no match is found within a certain tolerance, it returns `ZERO_RESULTS`.
*   **Coordinate Formatting**: When passing coordinates in the `latlng` parameter, strictly ensure there is **no space** between the latitude and longitude values (e.g., `40.714224,-73.961452`).
*   **Filter Behavior**: The `result_type` and `location_type` parameters act as **post-search filters**, meaning the API fetches all possible results first, then discards those that do not match the specified type or accuracy.
*   **Plus Codes**: Although Plus Codes are often returned, the API does not guarantee their presence in every response.

### Mandatory Operational Checklist (Error Handling)

- [ ] When discussing why a request failed or returned unexpected results, the agent MUST explicitly cite the relevant status code and its meaning (Section: Reverse geocoding status codes).
  - Use **`ZERO_RESULTS`** if the request was successful but returned no addresses (e.g., coordinates in a remote location).
  - Use **`REQUEST_DENIED`** if the request fails, especially if filters (`result_type` or `location_type`) were used without a valid API key.
  - Use **`INVALID_REQUEST`** if the required `latlng` parameter is missing or filters are invalid.

### References

*   **Geocoding API Documentation**: `https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-reverse-geocoding`
*   **Address Descriptors Guide**: `https://developers.google.com/maps/documentation/geocoding/guides-v3/address-descriptors/requests-address-descriptors`
*   **Building Attributes Guide**: `https://developers.google.com/maps/documentation/geocoding/guides-v3/building-attributes`
*   **Geocoding Responses Statuses**: `https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-geocoding`
*   **Plus Codes Info**: `https://plus.codes`
*   **Supported Languages**: `https://developers.google.com/maps/faq#languagesupport`
*   **API Key Guide**: `https://developers.google.com/maps/documentation/geocoding/guides-v3/get-api-key`
*   **EEA Terms**: `https://cloud.google.com/terms/maps-platform/eea`
*   **EEA FAQ**: `https://developers.google.com/maps/comms/eea/faq`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.

### Error & Exception Handling

Reverse Geocoding requests must distinguish between HTTP transport errors, successful responses with no results, and definitive API failures. The core client implementation explicitly handles these status conditions by inspecting both the HTTP status code and the `status` field in the JSON response body.

Note the explicit handling of `ZERO_RESULTS` as a successful (HTTP 200) outcome, indicating that no addressable location was found near the coordinates, fulfilling the operational checklist mandate.

#### Status Code Validation Pattern

```python
# Pattern derived from googlemaps/client.py: _get_body logic

import requests

# Assuming a successful HTTP response
response = requests.get(API_URL)

if response.status_code != 200:
    # Use HTTP status to detect transport issues or generic client-level errors.
    # For instance, a 403 or 429 usually indicates a REQUEST_DENIED type failure.
    print(f"HTTP Error: {response.status_code}")
    # Raise HTTPError or handle retries
    exit(1)

body = response.json()
api_status = body.get("status")

if api_status == "OK":
    # Request successful and data available
    results = body.get("results", [])
    print(f"Found {len(results)} reverse geocode results.")

elif api_status == "ZERO_RESULTS":
    # Per the checklist, request successful but returned no addresses (e.g., coordinates in a remote location).
    print("Successful query, but zero results found.")

elif api_status == "OVER_QUERY_LIMIT":
    # Maps to the REQUEST_DENIED behavior for rate limit issues.
    print(f"Critical Error: Quota or Rate Limit Exceeded. Status: {api_status}")

elif api_status == "INVALID_REQUEST":
    # Per the checklist, required parameters (like `latlng`) are missing or improperly formatted.
    print(f"Error: Invalid parameter provided. Status: {api_status}")

else:
    # Catch other API errors like REQUEST_DENIED (e.g., invalid API key)
    error_message = body.get("error_message", "Unknown error.")
    print(f"API Failure ({api_status}): {error_message}")
```
