## Address Descriptors (Geocoding API)

Address Descriptors enhance standard Geocoding, Reverse Geocoding, and Places Geocoding results by providing structured information about nearby landmarks and contained areas, along with precise distance metrics and spatial relationship descriptions.

### Prerequisites

To use this feature, the agent must ensure that:
1.  A valid Google Maps Platform API key is configured. (Requires access to `GOOGLE_API_KEY` environment variable).
2.  The Geocoding API is enabled for the project.

### Available Tools (REST API)

| Function | Endpoint | Required Parameters | Solution ID Header |
| :--- | :--- | :--- | :--- |
| Geocoding | `https://maps.googleapis.com/maps/api/geocode/json` | `address`, `extra_computations=ADDRESS_DESCRIPTORS`, `key` | `X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1` |
| Reverse Geocoding | `https://maps.googleapis.com/maps/api/geocode/json` | `latlng`, `extra_computations=ADDRESS_DESCRIPTORS`, `key` | `X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1` |
| Places Geocoding | `https://maps.googleapis.com/maps/api/geocode/json` | `place_id`, `extra_computations=ADDRESS_DESCRIPTORS`, `key` | `X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1` |

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Implementation Guide

To retrieve Address Descriptors, append the `extra_computations` parameter to the standard request, setting its value to `ADDRESS_DESCRIPTORS`. Ensure the solution ID header is included in the request.

#### Checklist for Address Descriptor Request

- [ ] Select the appropriate request type: Geocoding (for address), Places Geocoding (for Place ID), or Reverse Geocoding (for coordinates).
- [ ] Append the mandatory parameter: `extra_computations=ADDRESS_DESCRIPTORS`.
- [ ] Set the standard request parameters (e.g., `address`, `place_id`, or `latlng`).
- [ ] Include the API Key.

**1. Geocoding Example (Address to Descriptors)**

Use this when the input is a human-readable address. The descriptor is returned for each compatible result in the response.

```
GET https://maps.googleapis.com/maps/api/geocode/json?address=4118,+Kalan+Mehal+Chandni+Chowk,+New+Delhi&extra_computations=ADDRESS_DESCRIPTORS&key=YOUR_API_KEY
```

**2. Places Geocoding Example (Place ID to Descriptors)**

Use this when the input is a Google Place ID. The descriptor is returned for each compatible result in the response.

```
GET https://maps.googleapis.com/maps/api/geocode/json?place_id=ChIJyxAX8Bj9DDkRgBfAnBYa66Q&extra_computations=ADDRESS_DESCRIPTORS&key=YOUR_API_KEY
```

**3. Reverse Geocoding Example (Coordinates to Descriptors)**

Use this when the input is a latitude/longitude pair. Reverse Geocoding includes a single address descriptor at the response level.

```
GET https://maps.googleapis.com/maps/api/geocode/json?latlng=28.640964,77.235875&extra_computations=ADDRESS_DESCRIPTORS&key=YOUR_API_KEY
```
***

### Understanding the Response Structure

The `address_descriptor` object contains two main arrays: `landmarks` and `areas`.

#### A. Landmarks Array

The `landmarks` array contains up to 5 results ranked by relevance (based on proximity, prevalence, and visibility).

| Field Name | Description / Constraint |
| :--- | :--- |
| `place_id` | The unique identifier for the landmark. |
| `display_name` | Human-readable name, including `language_code` and `text`. |
| `straight_line_distance_meters` | The Euclidean distance (point-to-point) between the input coordinate and the landmark (meters). |
| `travel_distance_meters` | The distance traveled via the road network between the input coordinate and the landmark (meters). |
| `types` | The specific Place types for the landmark (e.g., `bank`, `movie_theater`). |
| `spatial_relationship` | The estimated relationship between the input coordinate and the landmark (Section Response). |

**Spatial Relationship Values (Landmarks):**

The agent MUST use the precise definition when describing the spatial context:
*   `"NEAR"`: The default relationship when none other applies.
*   `"WITHIN"`: The input coordinate is contained within the bounds of the structure associated with the landmark.
*   `"BESIDE"`: The input coordinate is directly adjacent to the landmark or its access point.
*   `"ACROSS_THE_ROAD"`: The input coordinate is directly opposite the landmark across the route.
*   `"DOWN_THE_ROAD"`: The input coordinate is along the same route as the landmark, but not `"BESIDES"` or `"ACROSS_THE_ROAD"`.
*   `"AROUND_THE_CORNER"`: The input coordinate is along a perpendicular route to the landmark (restricted to a single turn).
*   `"BEHIND"`: The input coordinate is spatially close to the landmark, but far from its access point.

#### B. Areas Array

The `areas` array contains up to 3 responses, representing small regions like neighborhoods or complexes. Areas that contain the requested coordinate are listed first, ordered from smallest to largest.

| Field Name | Description / Constraint |
| :--- | :--- |
| `place_id` | The unique identifier for the area. |
| `display_name` | Human-readable name, including `language_code` and `text`. |
| `containment` | The estimated containment relationship between the input coordinate and the area (Section Response). |

**Containment Relationship Values (Areas):**

*   `"NEAR"`: The default relationship when none other applies.
*   `"WITHIN"`: The input coordinate is close to the center of the area.
*   `"OUTSKIRTS"`: The input coordinate is close to the edge of the area.

### Gotchas

1.  **Response Completeness:** If the location is sparse (not in a dense location), or if there are no relevant landmarks or areas nearby, the `address_descriptor` field may be returned but the arrays (`landmarks` or `areas`) may be empty (Note).
2.  **Compatibility Limits:** Very large places (e.g., an airport) or regional areas (e.g., a postal region) will never receive an address descriptor (Note).
3.  **Reverse Geocoding Structure:** Unlike standard Geocoding or Places Geocoding which return descriptors per result, Reverse Geocoding returns only a single `address_descriptor` at the top response level (Note).
4.  **Feature Status:** This feature is generally available ("GA") only for India and is in the pre-GA Experimental launch stage for all other regions (Section Coverage). Developers in other regions may provide feedback via email to `address-descriptors-feedback@google.com`.

### References
https://developers.google.com/maps/documentation/geocoding/guides-v3/address-descriptors/requests-address-descriptors
https://maps.googleapis.com/maps/api/geocode/json?address=4118,+Kalan+Mehal+Chandni+Chowk,+New+Delhi&extra_computations=ADDRESS_DESCRIPTORS&key=YOUR_API_KEY
https://maps.googleapis.com/maps/api/geocode/json?place_id=ChIJyxAX8Bj9DDkRgBfAnBYa66Q&extra_computations=ADDRESS_DESCRIPTORS&key=YOUR_API_KEY
https://maps.googleapis.com/maps/api/geocode/json?latlng=28.640964,77.235875&extra_computations=ADDRESS_DESCRIPTORS&key=YOUR_API_KEY
https://developers.google.com/maps/documentation/places/web-service/place-id
https://developers.google.com/maps/documentation/places/web-service/supported_types#table1
https://developers.google.com/maps/documentation/geocoding/guides-v3/address-descriptors/coverage
https://cloud.google.com/terms/maps-platform/eea

## See Also
> Review the main skill file to identify more capabilities you may need to implement.