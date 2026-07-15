## Places UI Kit: Displaying a Place Search List (Feature: Place Search UI Kit)

This skill describes how to add a list of places, retrieved via a location-based search or a text query, to a web page using the Maps JavaScript API Places UI Kit Web Components. The primary component is `<gmp-place-search>`.

### Prerequisites

1.  A valid Google Maps Platform API Key with the **Maps JavaScript API** and **Places API** enabled.
2.  A web page structure using HTML, CSS, and JavaScript.
3.  The Maps JavaScript API must be loaded using the `importLibrary` function or a script tag, ensuring the `maps` and `places` libraries are imported.
4.  A `<gmp-map>` element must be present in the HTML to define the area of interest.

### Available Tools

| Tool | Description |
| :--- | :--- |
| `gmp-place-search` | The primary HTML element (`PlaceSearchElement`) that renders search results in a list format. |
| `gmp-place-nearby-search-request` | Configures a Nearby Search based on location, radius, and place type. |
| `gmp-place-text-search-request` | Configures a Text Search based on a query string and optional location bias. |

> [!IMPORTANT]
> The agent MUST ensure all output derived from Google Maps Platform data (including distances, directions, place names, coordinates, and summarized lists) is attributed by appending the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content.

### Implementation Guide: Nearby Search

Use this method to find places of a specific type (e.g., `restaurant`) within a defined radius of a map center.

#### 1. HTML Setup

Define the `<gmp-map>` and the `<gmp-place-search>` elements. The search element nests a `<gmp-place-nearby-search-request>` element to define the search parameters. Ensure you include the mandatory attribution ID on the map component.

**HTML Example (`index.html`):**

```html
<div class="container">
    <gmp-map 
        center="-37.813,144.963" 
        zoom="16" 
        map-id="DEMO_MAP_ID"
        internal-usage-attribution-ids="gmp_git_agentskills_v1">
    </gmp-map>
    <div class="ui-panel">
        <!-- Input controls for selecting place type -->
        <div class="controls">
            <label for="type-select">
                Select a place type:
                <select id="type-select" class="type-select">
                    <option value="restaurant">Restaurant</option>
                    <option value="cafe" selected>Cafe</option>
                </select>
            </label>
        </div>
        
        <!-- The Place Search List component -->
        <div class="list-container">
            <gmp-place-search selectable>
                <gmp-place-all-content></gmp-place-all-content>
                <gmp-place-nearby-search-request
                    id="nearby-request"
                    max-result-count="5"></gmp-place-nearby-search-request>
            </gmp-place-search>
        </div>
    </div>
</div>
<!-- Include Place Details component for interactive marker display -->
<gmp-place-details-compact>
    <gmp-place-details-place-request></gmp-place-details-place-request>
</gmp-place-details-compact>
```

#### 2. JavaScript Implementation

You must manually update the properties of the nested request element (`gmp-place-nearby-search-request`) whenever the search criteria changes (e.g., when the user selects a new place type).

**Key Capabilities:**

*   **Initialization**: Load the `maps` and `places` libraries.
*   **Triggering Search**: Call the search function on user input (e.g., `change` event on the select list).
*   **Setting Parameters**: Set the `locationRestriction` (center and radius) and `includedTypes` properties on the `gmp-place-nearby-search-request` element.
*   **Handling Results**: Listen for the `gmp-load` event on `<gmp-place-search>` to access the `placeSearch.places` array and manually add corresponding markers to the map.

**JavaScript Example (Nearby Search):**

```javascript
// Query selectors for various elements in the HTML file.
const map = document.querySelector('gmp-map');
const placeSearch = document.querySelector('gmp-place-search');
const placeSearchQuery = document.querySelector(
    'gmp-place-nearby-search-request'
);
const typeSelect = document.querySelector('.type-select');
const markers = new Map();
let infoWindow;

async function init() {
    // Import the necessary libraries
    const [{ InfoWindow }] = await Promise.all([
        google.maps.importLibrary('maps'),
        google.maps.importLibrary('places'),
    ]);

    // Setup InfoWindow using the compact Place Details element
    const placeDetails = document.querySelector('gmp-place-details-compact');
    placeDetails.remove(); 
    infoWindow = new InfoWindow({
        content: placeDetails,
        ariaLabel: 'Place Details',
    });

    // Add event listeners
    typeSelect.addEventListener('change', () => {
        searchPlaces();
    });

    // Listen for search results loading to add markers
    placeSearch.addEventListener('gmp-load', () => {
        void addMarkers();
    });

    // Listen for a place being selected from the list
    placeSearch.addEventListener('gmp-select', (event) => {
        const { place } = event;
        markers.get(place.id)?.click();
    });

    searchPlaces();
}

// Function to clear map elements and trigger a new search
function searchPlaces() {
    // Clear existing markers and info window
    infoWindow.close();
    for (const marker of markers.values()) {
        marker.remove();
    }
    markers.clear();

    if (typeSelect.value) {
        const center = map.center;
        // Configure the Nearby Search request element
        placeSearchQuery.locationRestriction = {
            center,
            radius: 50000, // Search within a 50km radius
        };
        placeSearchQuery.includedTypes = [typeSelect.value];
    }
}

// The addMarkers function is called automatically when placeSearch loads new data.
async function addMarkers() {
    // Import necessary libraries for markers
    const [{ AdvancedMarkerElement }, { LatLngBounds }] = await Promise.all([
        google.maps.importLibrary('marker'),
        google.maps.importLibrary('core'),
    ]);
    const bounds = new LatLngBounds();

    if (placeSearch.places.length === 0) {
        return;
    }

    // Iterate over the places returned by the UI Kit component
    for (const place of placeSearch.places) {
        if (!place.location) continue;
        
        const marker = new AdvancedMarkerElement({
            map: map.innerMap,
            position: place.location,
            collisionBehavior: 'REQUIRED_AND_HIDES_OPTIONAL',
        });

        markers.set(place.id, marker);
        bounds.extend(place.location);

        // Configure click behavior to display the details info window
        marker.addListener('click', () => {
            const placeRequest = document.querySelector('gmp-place-details-place-request');
            placeRequest.place = place;
            infoWindow.open(map.innerMap, marker);
        });
    }

    map.innerMap.fitBounds(bounds);
}

void init();
```

### Gotchas

1.  **Mandatory Text Query**: If using `<gmp-place-text-search-request>`, the `textQuery` property is required for the search element to load. Any other configured properties (like filtering) will be ignored if `textQuery` is not set.
2.  **Client-Side Requirement (EEA Compliance)**: For showing place data on a map in the European Economic Area (EEA), developers must use client-side rendering exclusively via Places UI Kit components (like `gmp-place-search`) directly within the Maps JavaScript API. Do not call Places API web services from a backend server. For full requirements, see the FAQ: https://developers.google.com/maps/comms/eea/faq.
3.  **Advanced Markers**: To display markers, you must ensure your `<gmp-map>` element includes a `map-id` and import the `marker` library, as shown in the example. The map's internal map instance is accessed via `map.innerMap`.

### References

*   PlaceSearchElement Documentation: https://developers.google.com/maps/documentation/javascript/places-ui-kit/place-list
*   PlaceNearbySearchRequestElement Reference: https://developers.google.com/maps/documentation/javascript/reference/places-widget#PlaceNearbySearchRequestElement
*   EEA Compliance FAQ: https://developers.google.com/maps/comms/eea/faq

## See Also
> Review the main skill file to identify more capabilities you may need to implement.