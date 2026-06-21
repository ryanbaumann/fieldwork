The Places UI Kit provides the `<gmp-place-search>` web component ([`PlaceSearchElement`](https://developers.google.com/maps/documentation/javascript/reference/places-widget?utm_source=gmp_git_agentskills_v1#PlaceSearchElement)) to render search results in a selectable list format on a webpage. This component is configured using nested request elements, prioritizing client-side implementation for improved performance and compliance.

## Prerequisites

1.  **API Key**: A valid Google Maps Platform API key is required.
2.  **API Enablement**: Ensure the **Maps JavaScript API** and **Places API** are enabled in the Google Cloud Project.
3.  **Mandatory Environment Variable**: The environment must be configured to pass the Maps API key into the script loading process.

### Available Tools
*   None

> [!IMPORTANT]
> **Operational Mandate: Google Maps Platform Data Attribution**
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Strict EEA Compliance Directive

When showing place data on a map within the European Economic Area (EEA), the agent MUST ensure that the Places API is accessed exclusively via client-side rendering using the Places UI Kit components (like `<gmp-place-search>`) directly within the Maps JavaScript API environment. Direct calls to Places API web services from a backend server must be avoided to ensure regulatory compliance. For detailed requirements, refer to the FAQ: [https://developers.google.com/maps/comms/eea/faq](https://developers.google.com/maps/comms/eea/faq?utm_source=gmp_git_agentskills_v1).

## Implementation Guide: Place List via Text Search

To display a list of places based on a user-provided text query (e.g., "best pizza"), use the `<gmp-place-search>` component with a nested [`PlaceTextSearchRequestElement`](https://developers.google.com/maps/documentation/javascript/reference/places-widget?utm_source=gmp_git_agentskills_v1#PlaceTextSearchRequestElement) (`<gmp-place-text-search-request>`).

### 1. Setup and Initialization

Ensure the Maps JavaScript API is loaded, requesting the `maps` and `places` libraries. The attribution ID `gmp_git_agentskills_v1` is required for tracking.

**HTML Snippet (Head)**

```html
<script>
    // prettier-ignore
    (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({\n                key: "YOUR_API_KEY_HERE"\n            });
</script>
```

### 2. Configure the Place Search UI (HTML)

Define the user interface, including the map (`<gmp-map>`), input field, search button, and the place list container (`<gmp-place-search>`).

**HTML Snippet (Body)**

```html
<div class="container">
    <div class="ui-panel">
        <div class="controls">
            <input
                type="text"
                id="query-input"
                class="query-input"
                placeholder="Search for a place"
                value="cafe" />
            <button class="search-button">Search</button>
        </div>
        <div class="list-container">
            <!-- The list component that displays search results -->
            <gmp-place-search
                selectable
                internal-usage-attribution-ids="gmp_git_agentskills_v1">
                <gmp-place-all-content></gmp-place-all-content>
                <!-- The specific request element for text search -->
                <gmp-place-text-search-request
                    max-result-count="5"></gmp-place-text-search-request>
            </gmp-place-search>
        </div>
    </div>
    <gmp-map center="-37.813,144.963" zoom="16" map-id="DEMO_MAP_ID"></gmp-map>
</div>
```

### 3. Implement Search Logic (JavaScript)

The search is triggered by updating the properties of the nested `<gmp-place-text-search-request>` element.

**Key Capabilities:**
*   **Trigger Search**: Attach event listeners (click/keydown) to the search button/input.
*   **Configure Request**: Update the `textQuery` property of the `gmp-place-text-search-request` element with the user's input value. Optionally, set `locationBias` using the map's current center.
*   **Result Handling**: Listen for the `gmp-load` event on `<gmp-place-search>` to access the `placeSearch.places` array and execute post-processing actions, such as adding markers.

**JavaScript Example**

```javascript
// Query selectors for UI elements
const map = document.querySelector('gmp-map');
const placeSearch = document.querySelector('gmp-place-search');
const placeSearchQuery = document.querySelector(
    'gmp-place-text-search-request'
);
const queryInput = document.querySelector('.query-input');
const searchButton = document.querySelector('.search-button');

// Global state for markers and info window
const markers = new Map();
let infoWindow;

async function init() {
    await Promise.all([
        google.maps.importLibrary('maps'),
        google.maps.importLibrary('places'),
    ]);

    // Setup event listeners
    searchButton.addEventListener('click', () => {
        searchPlaces();
    });
    queryInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            searchPlaces();
        }
    });

    // Handle results loaded into the list
    placeSearch.addEventListener('gmp-load', () => {
        void addMarkers();
    });

    // Trigger initial search
    searchPlaces();
}

/**
 * Executes the Place Text Search request based on input field value.
 */
function searchPlaces() {
    // 1. Verification Checkpoint: Clear previous results and markers.
    if (infoWindow) infoWindow.close();
    for (const marker of markers.values()) {
        marker.remove();
    }
    markers.clear();

    // 2. Trigger Condition: Check if query input has a value.
    if (queryInput.value) {
        const center = map.center;
        if (center) {
            placeSearchQuery.locationBias = center;
        }

        // IMPORTANT: Setting this property triggers the search via the web component.
        placeSearchQuery.textQuery = queryInput.value;
    }
}

/**
 * Renders Advanced Markers for all places returned in the search list.
 */
async function addMarkers() {
    const [{ AdvancedMarkerElement }, { LatLngBounds }] = await Promise.all([
        google.maps.importLibrary('marker'),
        google.maps.importLibrary('core'),
    ]);
    const bounds = new LatLngBounds();

    if (placeSearch.places.length === 0) {
        // Verification Checkpoint: If no results, exit.
        return;
    }

    for (const place of placeSearch.places) {
        if (!place.location) continue;

        const marker = new AdvancedMarkerElement({
            map: map.innerMap,
            position: place.location,
            collisionBehavior: 'REQUIRED_AND_HIDES_OPTIONAL',
        });

        markers.set(place.id, marker);
        bounds.extend(place.location);

        // Add click handler to markers (e.g., to open details)
        marker.addListener('click', () => {
            // Logic to display place details (omitted for brevity)
        });
    }

    map.innerMap.fitBounds(bounds);
}

void init();
```

## Gotchas

*   **Mandatory Query Property**: When using `<gmp-place-text-search-request>`, the `textQuery` property must be explicitly set with a non-empty string value for the search element to load and execute the search. Any other configured properties (like `locationBias` or `maxResultCount`) are ignored if `textQuery` is missing or empty.
*   **Result Loading Event**: The array of places is available via the `placeSearch.places` property only after the `gmp-load` event fires on the `<gmp-place-search>` element.

### References
*   [Place Search Element](https://developers.google.com/maps/documentation/javascript/places-ui-kit/place-list?utm_source=gmp_git_agentskills_v1)
*   [PlaceTextSearchRequestElement Reference](https://developers.google.com/maps/documentation/javascript/reference/places-widget?utm_source=gmp_git_agentskills_v1#PlaceTextSearchRequestElement)
*   [EEA Compliance FAQ](https://developers.google.com/maps/comms/eea/faq?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.