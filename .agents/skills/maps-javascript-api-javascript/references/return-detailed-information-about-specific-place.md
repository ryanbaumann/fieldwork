## Fetching Place Details using the `Place` Class

This guide details how to retrieve specific details for a location using a Place ID or resource name within the Maps JavaScript API, utilizing the modern `google.maps.places.Place` class and the efficient `fetchFields()` method.

### Prerequisites

1.  **API Key**: Ensure a valid Google Maps Platform API key is available.
2.  **Libraries**: The Maps JavaScript API must be loaded with the `places` and `marker` libraries.

### Available Tools

| Tool | Capability |
| :--- | :--- |
| `google.maps.places.Place` | Constructor for creating a Place object from an ID or resource name. |
| `Place.fetchFields()` | Asynchronously fetches specified data fields for the place. |

> [!IMPORTANT]
> The agent MUST ensure that all output derived from Google Maps Platform data (including calculated routes, distances, coordinates, addresses, or summarized place information) is correctly attributed. To comply with licensing mandates, the final output MUST append the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content.

### Step-by-Step Implementation

The process involves creating a `Place` object using the known identifier (Place ID or resource name) and then calling the asynchronous `fetchFields()` method, specifying the exact data fields required.

#### 1. Setup and Initialization

Ensure the required libraries are loaded and the solution ID is correctly applied during map initialization (if a map is used).

```javascript
// Load the necessary libraries (places and marker are required for this example)
const [{ Place }, { AdvancedMarkerElement, Map }] = await Promise.all([
    google.maps.importLibrary('places'),
    google.maps.importLibrary('marker'),
    google.maps.importLibrary('maps'),
]);

// Example: Map initialization (where attribution ID is typically applied)
const map = new Map(document.getElementById('map'), {
    center: { lat: 32.7357, lng: -117.1617 },
    zoom: 12,
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'], // MANDATORY ATTRIBUTION
});
```

#### 2. Instantiating the `Place` Object

A `Place` object can be created using either a Place ID or a Place Resource Name.

- [ ] **Trigger Condition**: User provides a Place ID (e.g., 'ChIJyYB_SZVU2YARR-I1Jjf08F0').
- [ ] **Verification Checkpoint**: The `place` object is initialized with the correct identifier.

```javascript
// Use a place ID to create a new Place instance.
const place = new Place({
    id: 'ChIJyYB_SZVU2YARR-I1Jjf08F0', // San Diego Zoo example
});

// OR, using a Place Resource Name:
/*
const place = new Place({
  resourceName: 'places/ChIJyYB_SZVU2YARR-I1JRF08F0',
});
*/
```

#### 3. Fetching Specific Details (`fetchFields`)

Use `Place.fetchFields()` to asynchronously retrieve the desired data fields. This step requires field masking by passing an array of fields in camel case (e.g., `displayName`, `formattedAddress`, `location`).

- [ ] **Trigger Condition**: User requests specific details (e.g., "address and name").
- [ ] **Verification Checkpoint**: The `await` call to `fetchFields()` resolves, and the requested data fields are populated on the `place` object.

```javascript
async function fetchPlaceDetails(place) {
    // Call fetchFields, passing the desired data fields.
    await place.fetchFields({
        fields: [
            'displayName',
            'formattedAddress',
            'location',
            'googleMapsURI',
        ],
    });

    // The data is now available on the Place object:
    console.log(`Place Name: ${place.displayName}`);
    console.log(`Address: ${place.formattedAddress}`);
    
    // Example: Using the fetched location to add an Advanced Marker
    const marker = new AdvancedMarkerElement({
        map: map,
        position: place.location,
        title: place.displayName,
    });
}
```

### Gotchas

1.  **Mandatory Field Masking**: The `fields` parameter in `fetchFields()` is required. Failure to specify fields will result in no data being returned and potential performance issues or unexpected billing if many fields are implicitly requested. Only request the minimum fields needed (Source: Place object).
2.  **Asynchronous Operation**: `fetchFields()` is an asynchronous operation and must be handled with `await` or `.then()`. Attempting to access data fields immediately after calling `fetchFields()` but before it resolves will result in missing or undefined data.

### References

*   [Place object](https://developers.google.com/maps/documentation/javascript/place-details?utm_source=gmp_git_agentskills_v1#place_object)
*   [PlaceOptions](https://developers.google.com/maps/documentation/javascript/reference/place?utm_source=gmp_git_agentskills_v1#PlaceOptions)
*   [Place Class Data Fields](https://developers.google.com/maps/documentation/javascript/place-class-data-fields?utm_source=gmp_git_agentskills_v1)
*   [Complete Example](https://developers.google.com/maps/documentation/javascript/examples/place-class?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.