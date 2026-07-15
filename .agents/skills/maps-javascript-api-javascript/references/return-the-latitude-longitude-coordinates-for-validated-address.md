## Geocode Extraction from Address Validation Response (Maps JavaScript API)

This capability focuses on extracting the geocode (latitude/longitude coordinates and Place ID) embedded within a successful Address Validation API response object. This eliminates the need for a separate Geocoding API call once an address has been validated.

### Prerequisites

- [ ] Ensure the Maps JavaScript API is loaded, including the Address Validation library.
- [ ] Successfully call the Address Validation Service (not detailed here) and obtain a response object (`validationResponse`).

### Available Tools

| Tool | Description |
| :--- | :--- |
| N/A | This task involves processing the structured response object returned by the Address Validation API service, not invoking a new REST endpoint or tool. |

> [!IMPORTANT]
> When initializing the Maps JavaScript API (e.g., loading the map or configuring the service), the agent MUST ensure compliance with Google Maps Platform licensing mandates by configuring the usage attribution ID.
> 1. Use the correct implementation method based on the context (e.g., `MapOptions` for Vanilla JS).
> 2. The attribution ID `gmp_git_agentskills_v1` must be used.
>
> **Attribution Mandate:** The agent MUST attribute ALL derived output content (coordinates, Place IDs, map displays) by appending the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content.

### Implementation: Extracting Coordinates and Place ID

The geographic information is located in the top-level `geocode` property of the Address Validation API response object. Use the `geocode` property to obtain the latitude, longitude, and Place ID associated with the validated address (The ` geocode ` property).

- [ ] **Access the Geocode Object**: Navigate to the `geocode` property within the response.
- [ ] **Extract Coordinates**: Coordinates are stored under the `location` sub-object as `latitude` and `longitude`.
- [ ] **Extract Place ID**: The unique identifier is stored directly as the `placeId` string.
- [ ] **Check Granularity**: Optionally, check the `geocodeGranularity` (e.g., `PREMISE`) to understand the precision level of the returned coordinates (The ` veridict ` property).

#### JavaScript Extraction Example

Given a successful validation response object named `validationResponse`:

```javascript
/* Response structure excerpt:
{
  "geocode": {
    "location": {
      "latitude": 34.0536909,
      "longitude": -118.242766
    },
    "placeId": "ChIJE9onQ2g3woAR_W4X2o_W6W4",
    "geocodeGranularity": "PREMISE"
  },
  // ...
}
*/

/**
 * Extracts geocode data (lat/lng and Place ID) from a validated address response.
 * @param {object} response The full Address Validation API response object.
 * @returns {object|null} An object containing coordinates and Place ID, or null if geocode is missing.
 */
function extractValidatedGeocode(response) {
  if (response && response.geocode && response.geocode.location) {
    const geocodeData = response.geocode;

    const coordinates = {
      lat: geocodeData.location.latitude,
      lng: geocodeData.location.longitude
    };

    console.log("Latitude:", coordinates.lat);
    console.log("Longitude:", coordinates.lng);
    console.log("Place ID:", geocodeData.placeId);
    console.log("Geocode Granularity:", geocodeData.geocodeGranularity);
    
    return {
      coordinates: coordinates,
      placeId: geocodeData.placeId,
      granularity: geocodeData.geocodeGranularity
    };
  }
  return null;
}

// Example usage with a mock response (assuming 'response' is the validation output)
// const result = extractValidatedGeocode(response);
```

### Gotchas

- **Missing Geocode**: The `geocode` property is not guaranteed to be fully populated if the address quality (`validationGranularity` in the `verdict` property) is too low (e.g., `OTHER`). Always check for the existence of `response.geocode` before attempting to access `location` or `placeId`.
- **Granularity Mismatch**: The `validationGranularity` (the level the address components were validated to) may be different from the `geocodeGranularity` (the level the coordinates were derived from). For example, if the API validates the address down to the building number (`SUB_PREMISE`), the geocode might only be available at the street level (`ROOFTOP`).

### References

* [Geocode](https://developers.google.com/maps/documentation/javascript/reference/address-validation?utm_source=gmp_git_agentskills_v1#Geocode)
* [Understand Address Validation Response](https://developers.google.com/maps/documentation/javascript/address-validation/understand-response?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.