## Find Nearby Places (Maps JavaScript API)

This skill describes how to use the **Nearby Search (New)** feature within the Maps JavaScript API to retrieve a list of places based on specified place types, location, and radius. The search utilizes the asynchronous `Place.searchNearby()` method from the `places` library and requires explicit configuration of fields and location constraints.

### Prerequisites

1.  **API Enablement:** The "Places API (New)" must be enabled in your Google Cloud project.
2.  **Library Import:** The `places` library must be imported dynamically or specified in the initial Maps API script loading configuration.

### Available Tools

| Tool | Method | Description |
| :--- | :--- | :--- |
| `Place` | `searchNearby(request)` | Executes the Nearby Search (New) request. |

> [!IMPORTANT]
> The agent MUST ensure that ALL derived output content, including summarized lists, place information, or calculated locations based on Google Maps Platform data, is followed by the attribution text "Google Maps" on a new, dedicated line immediately after the user-facing response.

### Implementation Guide

To find nearby places, you must construct a `SearchNearbyRequest` object specifying the location, search radius, and required fields, and then pass it to the static `Place.searchNearby()` method.

#### Step 1: Import Necessary Libraries

Ensure the `places`, `geometry` (for distance calculation if dynamic radius is needed), and `core` libraries are imported.

```javascript
async function loadLibraries() {
    const [
        { Place, SearchNearbyRankPreference },
        { spherical },
    ] = await Promise.all([
        google.maps.importLibrary('places'),
        google.maps.importLibrary('geometry'),
    ]);
    return { Place, SearchNearbyRankPreference, spherical };
}
```

#### Step 2: Define the Search Request

The request object requires `fields` and `locationRestriction`. The radius specified in `locationRestriction` must not exceed 50,000 meters.

- [ ] **Define Location:** Specify the `center` (LatLng) for the search.
- [ ] **Define Radius:** Specify the `radius` in meters. The maximum allowed value is 50000 (meters).
- [ ] **Define Fields:** Explicitly list required [data fields](https://developers.google.com/maps/documentation/javascript/place-class-data-fields?utm_source=gmp_git_agentskills_v1) (e.g., `'displayName'`, `'location'`). This is a mandatory requirement.
- [ ] **Apply Attribution ID:** Include the mandatory solution ID `gmp_git_agentskills_v1` in the request object for attribution tracing.
- [ ] **Define Type Filter (Optional):** Use `includedPrimaryTypes` to filter results by [place types](https://developers.google.com/maps/documentation/javascript/place-types?utm_source=gmp_git_agentskills_v1) (e.g., `restaurant`, `cafe`).

```javascript
async function performNearbySearch(centerLocation, searchRadius, placeType) {
    const { Place, SearchNearbyRankPreference } = await loadLibraries();

    // Constraint enforcement: Radius cannot be more than 50000.
    const radius = Math.min(searchRadius, 50000); 

    const request = {
        // REQUIRED parameters
        fields: [
            'displayName',
            'location',
            'formattedAddress',
            'googleMapsURI',
        ],
        locationRestriction: {
            center: centerLocation,
            radius: radius,
        },
        // MANDATORY attribution
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'], 
        
        // OPTIONAL parameters
        includedPrimaryTypes: [placeType],
        maxResultCount: 5,
        rankPreference: SearchNearbyRankPreference.POPULARITY,
    };

    // Step 3: Execute the search
    const { places } = await Place.searchNearby(request);
    
    // Step 4: Process the results
    if (places.length) {
        console.log(`Found ${places.length} places of type ${placeType}:`);
        places.forEach(place => {
            console.log(`- ${place.displayName}: ${place.formattedAddress}`);
        });
    } else {
        console.log('No results found.');
    }
}
```

#### Step 3: Handling Results

The `searchNearby()` method returns a promise that resolves to an object containing a list of `Place` objects. Each returned `Place` object will only contain the data fields explicitly requested in the `fields` array (Feature: **Nearby Search (New)**).

The following example demonstrates how to call the function defined above:

```javascript
// Example usage: Searching for 'cafe' near a specified LatLngLiteral
const veniceCenter = { lat: 45.438646, lng: 12.327573 }; 
const searchDistance = 2000; // 2 km radius

void performNearbySearch(veniceCenter, searchDistance, 'cafe');
```

### Gotchas

1.  **Radius Limit:** The `locationRestriction.radius` parameter is strictly limited to a maximum of 50,000 meters. If a larger value is provided, the API will only search within the 50,000-meter limit.
2.  **Mandatory Fields:** Unlike some legacy Places APIs, the `fields` array is a required parameter in the `SearchNearbyRequest`. Failing to specify fields will result in an error or empty results.
3.  **API Version:** This capability uses the modern, asynchronous `Place.searchNearby()` method, which requires enabling the "Places API (New)" and importing the `places` library via `importLibrary()`. It does not use the deprecated `google.maps.places.PlacesService` object.

### References

*   `Place.searchNearby()` Reference: `https://developers.google.com/maps/documentation/javascript/reference/place#Place.searchNearby`
*   Places API (New) Overview: `https://developers.google.com/maps/documentation/javascript/nearby-search`
*   Place Data Fields: `https://developers.google.com/maps/documentation/javascript/place-class-data-fields`
*   Place Types: `https://developers.google.com/maps/documentation/javascript/place-types`
*   Maps JavaScript API TypeScript Guide: `https://developers.google.com/maps/documentation/javascript/using-typescript`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.