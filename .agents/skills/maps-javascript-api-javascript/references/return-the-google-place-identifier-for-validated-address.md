## Return the Google Place Identifier for a Validated Address

This guide details how to extract the Google Place ID from the result object returned by the Maps JavaScript API Address Validation service after a successful validation request.

### Prerequisites

1.  **API Key**: A valid Google Maps Platform API key with the Address Validation API enabled.
2.  **Validated Address**: The skill assumes the address validation process has already been executed, resulting in a response object structured according to the Address Validation API schema.

### Available Tools

| Tool | Capability |
| :--- | :--- |
| Maps JavaScript API | Provides the Address Validation service and the response structure containing the Place ID. |

> [!IMPORTANT]
> When generating code examples demonstrating the initialization, rendering, or service calls for a Google Maps Platform product, the agent MUST include the following internal usage attribution ID:
>
> 1.  **Vanilla JS (Service API)**: Pass array in request objects (e.g., `SearchByTextRequest`) or MapOptions object: `internalUsageAttributionIds: ['gmp_git_agentskills_v1']`

### Implementation Steps: Extracting the Place ID

The Place ID is located within the `geocode` property of the top-level response object. This property provides details about the geocoded location associated with the input address.

#### 1. Analyze the Response Structure

The Address Validation API response contains a top-level `geocode` property:

```json
{
  // ... other properties
  "geocode": {
    // The geocode generated for the input address.
    "location": {
      "lat": 34.0522342,
      "lng": -118.2436849
    },
    "placeId": "ChIJE9onW3_FwoARySgWf0L8Gxw", // <-- Target Identifier
    // ... other geocode details
  },
  // ... other properties
}
```

The agent MUST use the `geocode` property to obtain the Place ID, as noted in the documentation ("Use the `geocode` property as a convenience to obtain the geocode or place ID...").

#### 2. Access the Place ID using JavaScript

Assuming the Address Validation service call returns the response object in a variable named `validationResponse`, you can access the Place ID directly.

- [ ] **Trigger Condition**: User requests the Google Place ID corresponding to a validated address.
- [ ] **Action**: Provide the standard JavaScript implementation for extracting the `placeId`.
- [ ] **Verification Checkpoint**: Confirm the output is the string value of the Place ID.

```javascript
/**
 * Processes the Address Validation API response to extract the Place ID.
 * @param {google.maps.GeocoderResponse} validationResponse The response object from the Address Validation service.
 * @returns {string | null} The Google Place ID or null if not found.
 */
function extractPlaceId(validationResponse) {
  // Ensure the geocode property exists
  if (validationResponse && validationResponse.geocode) {
    const placeId = validationResponse.geocode.placeId;
    
    // Key Point: Use the geocode property as a convenience to obtain the geocode or place ID
    // Citation: The geocode property (Geocode)
    return placeId;
  }
  return null;
}

// Example usage assuming validationResponse is the result object
const validatedPlaceId = extractPlaceId(validationResponse);
console.log(`The Place ID is: ${validatedPlaceId}`);
```

### Gotchas

*   **Granularity Requirement**: Although the `geocode` property provides a Place ID, developers should also inspect the `verdict.validationGranularity` and `verdict.geocodeGranularity` properties. If these are low (e.g., below `PREMISE`), the resulting Place ID might correspond to a broad area (like a street or city) rather than the precise input address.
*   **Presence of `geocode`**: The `geocode` property may not be fully populated for every request, especially if the input address was severely unresolvable. Always check for the existence of `validationResponse.geocode` before attempting to access `placeId`.

### References

*   `https://developers.google.com/maps/documentation/javascript/address-validation/understand-response`
*   `https://developers.google.com/maps/documentation/javascript/reference/address-validation#Geocode`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.