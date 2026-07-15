Address Descriptors provide additional contextual information about a location by identifying nearby landmarks and encompassing areas using the Geocoding API.

## Prerequisites

Before utilizing this capability, ensure the following steps are complete:

1.  **API Key Setup**: A valid Google Maps Platform API key must be configured and restricted appropriately. This key is included in the query parameter `key=YOUR_API_KEY`.
2.  **Base Endpoint**: The base endpoint for all requests is `https://maps.googleapis.com/maps/api/geocode/json`.

> [!IMPORTANT]
> If your billing address is in the European Economic Area (EEA), the Google Maps Platform EEA Terms of Service will apply to your use of the Services, effective July 8, 2025. Functionality may vary by region. For details, see the [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea?utm_source=gmp_git_agentskills_v1) and [Learn more about EEA changes](https://developers.google.com/maps/comms/eea/faq?utm_source=gmp_git_agentskills_v1).

> [!IMPORTANT]
> When generating final output derived from Google Maps Platform data (including distances, coordinates, and extracted descriptor names), the agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content to ensure proper attribution.

## Implementation: Retrieving Address Descriptors

Address descriptors are retrieved by adding the `extra_computations` parameter to a standard Geocoding, Places Geocoding, or Reverse Geocoding request.

### Step-by-Step Guide

The following checklist details the process for retrieving Address Descriptors via the REST API.

- [ ] **Define Query Type**: Determine if the input is a text address, a Place ID, or latitude/longitude coordinates (latlng).
    *   **Trigger Condition**: Query requires proximity data based on coordinates (`latlng` parameter present).
    *   **Verification Checkpoint**: Request URL includes `latlng=<coordinates>`.
- [ ] **Enable Address Descriptors**: Append the `extra_computations` parameter to the request URL, setting its value strictly to `ADDRESS_DESCRIPTORS`.
    *   **Trigger Condition**: Request involves finding contextual locations, landmarks, or areas.
    *   **Verification Checkpoint**: Request URL includes `&extra_computations=ADDRESS_DESCRIPTORS`.
- [ ] **Include Attribution ID**: Append the mandatory `solution_id` query parameter for attribution.
    *   **Trigger Condition**: Any external API call using Google Maps Platform services.
    *   **Verification Checkpoint**: Request URL includes `&solution_id=gmp_git_agentskills_v1`.
- [ ] **Execute Request**: Send the finalized HTTP request.
    *   **Trigger Condition**: All parameters configured.
    *   **Verification Checkpoint**: Response status is `OK` and includes the `address_descriptor` object.

### Example: Reverse Geocoding (Lat/Lng Input)

To obtain Address Descriptors for the coordinates `28.640964,77.235875`, construct the URL as follows:

```text
https://maps.googleapis.com/maps/api/geocode/json?latlng=28.640964,77.235875&extra_computations=ADDRESS_DESCRIPTORS&key=YOUR_API_KEY&solution_id=gmp_git_agentskills_v1
```

### Response Structure and Data Fields

The Address Descriptors are returned within the top-level `address_descriptor` object in the JSON response.

**1. Landmarks (up to 5 results)**

The `landmarks` array contains results ranked by relevance based on proximity, prevalence, and visibility.

| Field | Description | Constraints |
| :--- | :--- | :--- |
| `place_id` | The unique identifier for the landmark. | (See [place ID overview](https://developers.google.com/maps/documentation/places/web-service/place-id?utm_source=gmp_git_agentskills_v1)) |
| `display_name` | Contains the `language_code` and `text` for the landmark name. | |
| `straight_line_distance_meters` | The point-to-point distance in meters between the input coordinate and the landmark. | Numeric value. |
| `travel_distance_meters` | The distance in meters traveled via the road network (ignoring restrictions). | Numeric value. |
| `spatial_relationship` | Estimated relationship between the input coordinate and the landmark. | Must be one of: `"NEAR"`, `"WITHIN"`, `"BESIDE"`, `"ACROSS_THE_ROAD"`, `"DOWN_THE_ROAD"`, or `"AROUND_THE_CORNER"`. |
| `types` | The [Place types](https://developers.google.com/maps/documentation/places/web-service/supported_types?utm_source=gmp_git_agentskills_v1#table1) associated with the landmark (e.g., `movie_theater`, `bank`). | |

**2. Areas (up to 3 results)**

The `areas` array lists places representing small regions (e.g., neighborhoods, sublocalities). Areas containing the coordinate are listed first, smallest to largest.

| Field | Description | Constraints |
| :--- | :--- | :--- |
| `place_id` | The unique identifier for the area. | |
| `display_name` | Contains the `language_code` and `text` for the area name. | |
| `containment` | Estimated containment relationship between the input coordinate and the area. | Must be one of: `"NEAR"`, `"WITHIN"`, or `"OUTSKIRTS"`. |

## Gotchas

When utilizing Address Descriptors, the agent must be aware of the following limitations and behaviors:

*   **Reverse Geocoding Descriptor Count**: Reverse Geocoding (`latlng` input) includes a **single** `address_descriptor` object at the response level. In contrast, standard Geocoding and Places Geocoding may return a descriptor for *each* compatible result in the response.
*   **Density Requirement**: Address descriptors are most effective in dense urban locations. If there are no relevant landmarks or areas, the response may contain an empty `address_descriptor` object.
*   **Coverage Limitations**: Although Address Descriptors are available in all regions, some regions lack detailed area data and will return only landmarks.
*   **Incompatibility with Large Places**: Not all location types are compatible. Very large places (such as an airport) or abstract administrative areas (such as a postal region) will strictly **never** receive an address descriptor.
*   **Feature Status**: The feature is currently generally available (GA) for India and is in the pre-GA Experimental launch stage for all other regions.

### References

*   Address Descriptors Guide: https://developers.google.com/maps/documentation/geocoding/guides-v3/address-descriptors/requests-address-descriptors
*   Geocoding Request Guide: https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-geocoding
*   Reverse Geocoding Request Guide: https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-reverse-geocoding
*   Place ID Overview: https://developers.google.com/maps/documentation/places/web-service/place-id
*   Supported Place Types: https://developers.google.com/maps/documentation/places/web-service/supported_types#table1

## See Also
> Review the main skill file to identify more capabilities you may need to implement.