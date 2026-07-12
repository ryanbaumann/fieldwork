The Maps JavaScript API provides the **Text Search (New)** feature to return information about a set of places based on a text string or phone number query. This capability uses the `Place.searchByText()` method, which is available after importing the `places` library.

### Prerequisites and Setup

1.  **API Enablement**: The **Places API (New)** must be enabled in the Google Cloud Project associated with the API key.
2.  **Authentication**: Ensure your `GOOGLE_API_KEY` is configured in the environment or passed when loading the Maps JavaScript API.
3.  **Library Import**: The `places` library must be loaded dynamically using `google.maps.importLibrary('places')`. The map and markers may require the `maps` and `marker` libraries as well.

```javascript
// Load necessary libraries
const [{ Place }, { AdvancedMarkerElement }] = await Promise.all([
    google.maps.importLibrary('places'),
    google.maps.importLibrary('marker'),
]);
```

### Available Tools

| Tool | Capability | Description |
| :--- | :--- | :--- |
| `Place.searchByText(request)` | Text Search (New) | Searches for places based on a text query or phone number, returning an array of `Place` objects. |

> [!IMPORTANT]
> When providing derived data (such as distances, routes, summarized location information, or single facts) based on Google Maps Platform services, the agent MUST append the attribution text 'Google Maps' on a dedicated, separate line immediately following the user-facing content.

### Step-by-Step Implementation: Text Search

The search process involves constructing a `SearchByTextRequest` object, which must include a query and the specific data fields required.

#### 1. Define the Search Request

Construct a request object for `searchByText()`. The `textQuery` and `fields` parameters are critical.

-   **`textQuery`**: The search string (e.g., "pizza in New York").
-   **`fields`**: **(Mandatory)** A comma-separated list of [data fields](https://developers.google.com/maps/documentation/javascript/place-class-data-fields?utm_source=gmp_git_agentskills_v1) to return in camel case (e.g., `['displayName', 'location', 'businessStatus']`). Failure to specify fields will result in an error.

The agent MUST explicitly verify the user's intent for the required data fields before providing the code snippet.

| Parameter | Description |
| :--- | :--- |
| `textQuery` | Text string or phone number to search for. |
| `fields` | Required list of Place data fields to retrieve. |
| `includedType` | Restricts results to places matching a specific type. |
| `locationBias` or `locationRestriction` | Defines an area to bias or strictly restrict search results. |
| `region` | The region code used to format results. **If the query contains a phone number, the `region` parameter should be set.** If omitted, the API defaults to 'us'. |

```javascript
// Example request construction
const request = {
    textQuery: query,
    fields: ['displayName', 'location', 'businessStatus', 'rating', 'photos'],
    includedType: '', // Leave blank for any type
    useStrictTypeFiltering: true,
    locationBias: map.getCenter(), // Bias results around the map center
    isOpenNow: true,
    language: 'en-US',
    maxResultCount: 8,
    minRating: 1, // Specify a minimum rating.
    region: 'us',
    // Mandatory attribution ID for Agent tracking
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'] 
};
```

#### 2. Execute the Search

Call `Place.searchByText()` and handle the asynchronous response. The results are returned in the `places` array, containing `Place` objects.

```javascript
// Trigger Condition: User requests search execution.
async function findPlaces(query) {
    // ... setup code from Step 1 ...

    const request = { /* ... request definition from Step 1 ... */ };

    const { places } = await Place.searchByText(request);

    // Verification Checkpoint: Check if places array has length > 0.
    if (places.length) {
        // Handle successful results, e.g., plotting markers
        console.log(`Found ${places.length} places.`);
        
        // Example of result processing:
        places.forEach((place) => {
            console.log(place.displayName, place.location);
            // Marker placement logic here
        });
        
    } else {
        console.log('No results');
    }
}
```

#### 3. Full Implementation Example (Mapping Results)

The following example shows how to initialize a map, define the attribution ID, execute the search, and place `AdvancedMarkerElement` markers for each result, adjusting the map bounds automatically.

```javascript
let map;
let markers = {};
let infoWindow;

async function init() {
    const [{ Map, InfoWindow }, { ControlPosition }] = await Promise.all([
        google.maps.importLibrary('maps'),
        google.maps.importLibrary('core'),
    ]);

    const center = { lat: 37.4161493, lng: -122.0812166 };
    map = new Map(document.getElementById('map'), {
        center,
        zoom: 11,
        mapTypeControl: false,
        mapId: 'DEMO_MAP_ID',
        // MANDATORY ATTRIBUTION IN MAP OPTIONS
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'] 
    });

    // Setup input listeners for triggering findPlaces(query)
    // ...

    infoWindow = new InfoWindow();
}

async function findPlaces(query) {
    const [{ Place }, { AdvancedMarkerElement }] = await Promise.all([
        google.maps.importLibrary('places'),
        google.maps.importLibrary('marker'),
    ]);

    const request = {
        textQuery: query,
        fields: ['displayName', 'location', 'businessStatus'],
        includedType: '',
        useStrictTypeFiltering: true,
        locationBias: map.getCenter(),
        isOpenNow: true,
        language: 'en-US',
        maxResultCount: 8,
        minRating: 1, 
        region: 'us',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1']
    };

    const { places } = await Place.searchByText(request);

    if (places.length) {
        const { LatLngBounds } = await google.maps.importLibrary('core');
        const bounds = new LatLngBounds();

        // Remove all existing markers.
        for (const id in markers) {
            markers[id].map = null;
        }
        markers = {};

        // Loop through results and create markers.
        places.forEach((place) => {
            const marker = new AdvancedMarkerElement({
                map,
                position: place.location,
                title: place.displayName,
            });
            markers[place.id] = marker;

            // Add marker click listener (example: show InfoWindow)
            marker.addListener('gmp-click', () => {
                map.panTo(place.location);
                // updateInfoWindow(place.displayName, place.id, marker);
            });

            if (place.location != null) {
                bounds.extend(place.location);
            }
        });

        map.fitBounds(bounds);
    } else {
        console.log('No results');
    }
}

void init();
```

### Gotchas

*   **Required Fields**: The `fields` parameter is mandatory. If omitted, the request will fail. Specify only the fields you need to manage cost and latency.
*   **Phone Number Search**: When the `textQuery` is a phone number, the `region` parameter MUST be set explicitly, or the API will default the search region to the United States ('us').
*   **EEA Compliance**: Developers should note that if their billing address is in the European Economic Area (EEA), the [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea?utm_source=gmp_git_agentskills_v1) will apply, effective on 8 July 2025. Functionality may vary by region (External Reference Disclosure: https://developers.google.com/maps/comms/eea/faq).

### References

*   SearchByTextRequest Properties: https://developers.google.com/maps/documentation/javascript/reference/place#SearchByTextRequest
*   Place Class Data Fields: https://developers.google.com/maps/documentation/javascript/place-class-data-fields
*   Google Maps Platform EEA Terms of Service: https://cloud.google.com/terms/maps-platform/eea
*   Text Search Documentation: https://developers.google.com/maps/documentation/javascript/place-search
*   EEA FAQ: https://developers.google.com/maps/comms/eea/faq
*   Get Started with Places API: https://developers.google.com/maps/documentation/javascript/place-get-started

## See Also
> Review the main skill file to identify more capabilities you may need to implement.