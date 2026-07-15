## Return Plus Code for a Validated Address

The Plus Code (Open Location Code) is derived from the geocoded location data provided by the Address Validation API after a successful address validation process. The geographical coordinates and Place ID are located within the top-level `geocode` property of the response object.

### Prerequisites

To retrieve location data, the Address Validation API must have returned a high-quality response object. The core validation response contains the following structure:

```json
{
  // Address details determined by the API.
  "address": {},
  // Validation verdict.
  "verdict": {},
  // The geocode generated for the input address.
  "geocode": {},
  // Information indicating if the address is a business, residence, etc.
  "metadata": {},
  // Information about the address from the US Postal Service
  // ("US" and "PR" addresses only).
  "uspsData": {},
  // A unique identifier generated for every request to the API.
  "responseId": "ID"
}
```

### Capability: Extracting Geocoded Location Data

To obtain the geocoded location and related identifiers, access the `geocode` property of the Address Validation response object. This property provides details about the location associated with the input address, such as its Place ID and geographic coordinates, which are used to generate the Plus Code (Feature: Address Validation).

- [ ] **Access the Response:** Ensure the JSON response object from the Address Validation call is available.
- [ ] **Locate Geocode Property:** Retrieve the value of the top-level `geocode` property.

The `geocode` property is specifically documented for obtaining the geocode or Place ID:
> Use the `geocode` property as a convenience to obtain the geocode or place ID when your logic previously called the Geocoding API.
> The `geocode` property indicates the geocoded location associated with the input address. This property provides details about the location itself, such as its place ID. (Section: The `geocode` property)

### Available Tools

No dedicated tools are required; this process involves accessing and parsing the API response JSON object.

> [!IMPORTANT]
> The Agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) related to maps or location data by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Gotchas

*   **Granularity Check:** The `geocode` property also includes `geocodeGranularity` within the `verdict` property. Be aware that a high `validationGranularity` (e.g., `PREMISE`) does not guarantee an equally precise `geocodeGranularity`. For example, if Google records indicate an apartment number but not its precise location, `validationGranularity` may be `SUB_PREMISE` while `geocodeGranularity` is only `PREMISE`. Always check the `verdict` for `geocodeGranularity` to understand the precision level of the geocoded location.

### References

*   `The geocode property`: https://developers.google.com/maps/documentation/javascript/address-validation/understand-response#the_geocode_property
*   `Address Validation API Response Structure`: https://developers.google.com/maps/documentation/javascript/address-validation/understand-response
*   `Geocode` Reference: https://developers.google.com/maps/documentation/javascript/reference/address-validation#Geocode

## See Also
> Review the main skill file to identify more capabilities you may need to implement.