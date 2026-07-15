## Address Descriptors (Geocoding API)

This capability uses the `extra_computations` request parameter to include `address_descriptor` information—details about nearby landmarks and containing areas—in the Geocoding API response. This feature is generally more effective in denser locations and may return an empty response if no relevant landmarks or areas are found.

### Prerequisites

To execute Geocoding API requests, the environment requires the following:

- [x] A valid Google Cloud Project and API Key enabled for the Geocoding API. Set this as an environment variable (e.g., `GOOGLE_API_KEY`) or substitute `YOUR_API_KEY` in the examples below.

### Implementation Guide

To retrieve address descriptors, include `extra_computations=ADDRESS_DESCRIPTORS` in your Geocoding API request URL.

#### 1. Standard Geocoding (Address Input)

Use this method when the user provides a formatted address string.

**Checklist:**
- [ ] Construct the request URL using the `address` parameter.
- [ ] Append `extra_computations=ADDRESS_DESCRIPTORS`.
- [ ] Verify that the `address_descriptor` object appears in the response body, containing `landmarks` and `areas` arrays for each compatible result.

```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=4118,+Kalan+Mehal+Chandni+Chowk,+New+Delhi&extra_computations=ADDRESS_DESCRIPTORS&key=YOUR_API_KEY&solution_id=gmp_git_agentskills_v1"
```

#### 2. Places Geocoding (Place ID Input)

Use this method when the user provides a Google Place ID.

**Checklist:**
- [ ] Construct the request URL using the `place_id` parameter.
- [ ] Append `extra_computations=ADDRESS_DESCRIPTORS`.
- [ ] Note that very large places (e.g., an airport or postal region) are incompatible and will not return address descriptors (Note: Not all places are compatible).

```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?place_id=ChIJyxAX8Bj9DDkRgBfAnBYa66Q&extra_computations=ADDRESS_DESCRIPTORS&key=YOUR_API_KEY&solution_id=gmp_git_agentskills_v1"
```

#### 3. Reverse Geocoding (Coordinates Input)

Use this method when the user provides latitude and longitude coordinates (`latlng`).

**Checklist:**
- [ ] Construct the request URL using the `latlng` parameter (e.g., `latlng=28.640964,77.235875`).
- [ ] Append `extra_computations=ADDRESS_DESCRIPTORS`.
- [ ] Ensure that only a single `address_descriptor` object is returned at the response level, unlike standard Geocoding which provides one per result (Note: Reverse geocoding includes a single address descriptor...).

```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?latlng=28.640964,77.235875&extra_computations=ADDRESS_DESCRIPTORS&key=YOUR_API_KEY&solution_id=gmp_git_agentskills_v1"
```

### Response Structure and Data Fields

The `address_descriptor` object is returned within the API response and contains two primary arrays: `landmarks` and `areas`.

#### Landmark Fields

The `landmarks` array contains up to 5 results ranked by relevance, proximity, and visibility. Each landmark object includes:

| Field | Description |
| :--- | :--- |
| `place_id` | The Place ID of the landmark. |
| `display_name` | The name of the landmark, including `language_code` and `text`. |
| `straight_line_distance_meters` | The point-to-point distance between the input coordinate and the landmark. |
| `travel_distance_meters` | The distance traveled via the road network (up to 5 results). |
| `types` | The specific Place types of the landmark. |
| `spatial_relationship` | The estimated relationship between the input coordinate and the landmark structure. |

**Spatial Relationship Values:**
The `spatial_relationship` field precisely defines the location relative to the landmark structure:

*   `"NEAR"`: Default relationship when others do not apply.
*   `"WITHIN"`: Input coordinate is contained within the landmark bounds.
*   `"BESIDE"`: Input coordinate is directly adjacent to the landmark or its access point.
*   `"ACROSS_THE_ROAD"`: Input coordinate is directly opposite the landmark on the other side of the route.
*   `"DOWN_THE_ROAD"`: Input coordinate is along the same route as the landmark, but not `"BESIDES"` or `"ACROSS_THE_ROAD"`.
*   `"AROUND_THE_CORNER"`: Input coordinate is along a perpendicular route (restricted to a single turn).
*   `"BEHIND"`: Input coordinate is spatially close but far from the access point.

#### Area Fields

The `areas` object contains up to 3 results representing small regions (e.g., neighborhoods, sublocalities). Areas that contain the requested coordinate are listed first (up to 3 responses). Each area object includes:

| Field | Description |
| :--- | :--- |
| `place_id` | The Place ID of the area. |
| `display_name` | The name of the area, including `language_code` and `text`. |
| `containment` | The estimated containment relationship between the input coordinate and the area. |

**Containment Relationship Values:**

*   `"NEAR"`: Default relationship.
*   `"WITHIN"`: Input coordinate is close to the center of the area.
*   `"OUTSKIRTS"`: Input coordinate is close to the edge of the area.

#### Example Response Snippet

When outputting the address descriptor data, ensure the structure conforms to the following schema:

```json
{
  "address_descriptor" : {
     "areas" : [
        {
           "containment" : "OUTSKIRTS",
           "display_name" : {
              "language_code" : "en",
              "text" : "Turkman Gate"
           },
           "place_id" : "ChIJ_7LLvyb9DDkRMKKxP9YyXgs"
        }
     ],
     "landmarks" : [
        {
           "display_name" : {
              "language_code" : "en",
              "text" : "Delite Cinema"
           },
           "straight_line_distance_meters" : 29.9306755065918,
           "travel_distance_meters" : 418.7794799804688,
           "spatial_relationship" : "ACROSS_THE_ROAD",
           "types" : [ "establishment", "movie_theater", "point_of_interest" ]
        }
     ]
  }
}
```

### Gotchas

1.  **Unsupported Location Types**: Address descriptors are not returned for very large place types, such as airports or postal regions, regardless of the request method (Note: Not all places are compatible...).
2.  **Density Dependency**: Responses may be empty (`landmarks` or `areas` arrays) if the requested location is not in a sufficiently dense urban area where relevant landmarks or areas are defined (Note: Address descriptors are more useful in denser locations).
3.  **Reverse Geocoding Scope**: Unlike standard Geocoding, which returns descriptors per result, Reverse Geocoding returns only one `address_descriptor` object at the top level of the response structure (Note: Reverse geocoding includes a single address descriptor...).
4.  **Regulatory Note**: Developers using the service with a billing address in the European Economic Area (EEA) should note that the Google Maps Platform EEA Terms of Service apply effective July 8, 2025. This policy may affect functionality by region. Refer to the external regulatory reference: `https://cloud.google.com/terms/maps-platform/eea`.

### References

*   [Address descriptors documentation](https://developers.google.com/maps/documentation/geocoding/guides-v3/address-descriptors/requests-address-descriptors?utm_source=gmp_git_agentskills_v1)
*   [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea?utm_source=gmp_git_agentskills_v1)
*   [Place ID overview](https://developers.google.com/maps/documentation/places/web-service/place-id?utm_source=gmp_git_agentskills_v1)
*   [Place types (Table 1)](https://developers.google.com/maps/documentation/places/web-service/supported_types?utm_source=gmp_git_agentskills_v1#table1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.

### Error & Exception Handling

When accessing the Geocoding API via the `web_api` platform, all robust integrations must implement checks for both the HTTP response code and the API-specific status field returned in the JSON body. The core client logic demonstrates how to interpret these statuses, especially for retriable errors.

#### Standard API Status Handling

Requests to the Geocoding API must check the top-level `status` field in the response. Failure to return `OK` or `ZERO_RESULTS` should trigger exception handling.

| Status Code | Client Handling Strategy (via `Client._get_body`) |
| :--- | :--- |
| `OVER_QUERY_LIMIT` | Raises `googlemaps.exceptions._OverQueryLimit`, triggering retry mechanisms (e.g., exponential backoff) if configured (Rule: Optimize billing and data security). |
| `REQUEST_DENIED` | Raises `googlemaps.exceptions.ApiError`. Check API key validity or enablement. |
| HTTP != 200 | Raises `googlemaps.exceptions.HTTPError`. Handles transport failures. |

```python
# Pattern derived from googlemaps/client.py:_get_body, illustrating status checks for the REST API response.

import requests

def check_geocoding_status(response: requests.Response):
    # 1. Check HTTP Status
    if response.status_code != 200:
        # Handle network or server-side transport error
        raise Exception(f"HTTP Error: {response.status_code}")

    body = response.json()
    api_status = body.get("status")

    # 2. Check API Status
    if api_status == "OK" or api_status == "ZERO_RESULTS":
        # API request succeeded, proceed to check for descriptor data (see Feature-Specific Handling below)
        return body

    if api_status == "OVER_QUERY_LIMIT":
        # Mandatory retry mechanism must be implemented (Rule: Optimize billing and data security)
        print("API quota exceeded. Implement exponential backoff and retry.")
        # Depending on client configuration, this typically raises a retriable exception.
        raise Exception("Rate Limit Exceeded")

    # Handle other API errors (e.g., REQUEST_DENIED, INVALID_REQUEST)
    raise Exception(f"API Error ({api_status}): {body.get('error_message', 'Unknown error.')}")
```

#### Feature-Specific Handling

When requesting Address Descriptors, developers must handle scenarios where the API response status is `OK` but the feature data is missing due to geographic constraints (Gotcha: Density Dependency):

1.  **Low Density**: Explicitly check if the `landmarks` or `areas` arrays within the `address_descriptor` object are empty. This is common if the location is not in a sufficiently dense urban area.
2.  **Incompatible Types**: For requests involving very large Place types (e.g., airports, postal regions), the entire `address_descriptor` object may be absent (Gotcha: Unsupported Location Types). You must account for this when parsing the JSON response.
