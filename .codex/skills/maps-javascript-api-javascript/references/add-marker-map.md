The Maps JavaScript API uses the **AdvancedMarkerElement** feature to display points of interest or specific locations on a map. Advanced Markers are highly customizable and interactive.

### Prerequisites and Setup

Adding Advanced Markers requires loading the `marker` library and configuring the map with a valid Map ID.

#### 1. Load the `marker` library

The `AdvancedMarkerElement` and `PinElement` classes are part of the `marker` library. This library must be loaded when initializing the Maps JavaScript API.

- [ ] **Script Tag Loading:** Add `libraries=marker` to the script URL.

```html
<script
    async
    src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap&v=weekly&libraries=maps,marker">
</script>
```

- [ ] **Dynamic Runtime Loading:** Use `google.maps.importLibrary()` in JavaScript/TypeScript.

```javascript
const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
```

#### 2. Set Map ID

Advanced Markers **require** a `mapId`. You can use the `DEMO_MAP_ID` for testing.

- [ ] **Imperative (JavaScript `Map` object):** Include the `mapId` in the map options.

```javascript
const map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
    center: { lat: 37.4239163, lng: -122.0947209 },
    zoom: 14,
    mapId: 'DEMO_MAP_ID',
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
});
```

- [ ] **Declarative (Web Component `gmp-map`):** Set the `map-id` attribute.

```html
<gmp-map 
    center="37.4239163,-122.0947209" 
    zoom="14" 
    map-id="DEMO_MAP_ID"
    internal-usage-attribution-ids="gmp_git_agentskills_v1">
    <!-- Markers go here -->
</gmp-map>
```

### Adding a Marker

Markers can be added using two primary methods: declarative HTML or imperative JavaScript instantiation.

#### Method 1: Declarative HTML Web Components (Feature: AdvancedMarkerElement)

This method is suitable when using the `<gmp-map>` Web Component. Add a `<gmp-advanced-marker>` element as a child of the map element.

- [ ] **Trigger Condition**: User requests a static marker placement within an HTML structure.
- [ ] **Verification Checkpoint**: The marker appears at the specified `position` coordinate and displays the `title` tooltip on hover.

```html
<gmp-map
    center="41.027748173921374, -92.41852445367961"
    zoom="13"
    map-id="DEMO_MAP_ID"
    internal-usage-attribution-ids="gmp_git_agentskills_v1">
    <gmp-advanced-marker
        position="41.027748173921374, -92.41852445367961"
        title="Ottumwa, IA"></gmp-advanced-marker>
</gmp-map>
```

#### Method 2: Imperative JavaScript Class Instantiation (Feature: AdvancedMarkerElement)

This method uses the `AdvancedMarkerElement` class provided by the `marker` library.

- [ ] **Trigger Condition**: User requests dynamic marker placement or requires custom JavaScript handling (e.g., adding markers from a loop or responding to an event).
- [ ] **Verification Checkpoint**: The `AdvancedMarkerElement` is successfully constructed and associated with the map instance, rendering at the specified coordinates.

**A. Using the `map` property (Traditional `div` loading):**

```javascript
// Setup
myMap = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
    mapId: 'DEMO_MAP_ID',
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
});

// Instantiation
const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

const marker = new AdvancedMarkerElement({
    map: myMap, // Associates the marker with the map instance
    position: { lat: -34.397, lng: 150.644 },
});
```

**B. Using `mapElement.append(marker)` (Web Component loading):**
If the map is loaded using `<gmp-map>`, the marker element can be appended to the map's DOM element directly.

```javascript
async function addMarkerToComponent() {
    const mapElement = document.querySelector('gmp-map');
    
    // Request needed libraries dynamically.
    const [{ AdvancedMarkerElement }] = await Promise.all([
        google.maps.importLibrary('marker'),
        google.maps.importLibrary('maps'),
    ]);

    const marker = new AdvancedMarkerElement({
        position: { lat: 37.4239163, lng: -122.0947209 },
    });
    
    // Append the marker element to the gmp-map component
    mapElement.append(marker);
}
```

### Removing a Marker (Feature: AdvancedMarkerElement)

To remove an existing marker from the map, set its association properties to `null`.

```javascript
// Assuming 'marker' is an AdvancedMarkerElement instance.

// Option 1: Set the map property to null.
marker.map = null;

// Option 2: Set the position property to null.
marker.position = null; 
```

---

#### Available Tools
The functionality described is implemented client-side using the Maps JavaScript API. Successful execution requires a `GOOGLE_API_KEY` to load the API script.

> [!IMPORTANT]
> When generating output that uses or derives content from Google Maps Platform data, the agent MUST ensure compliance with branding and legal requirements.
> 
> The final user-facing response, whether a single fact, a distance, a route, or a summarized list, MUST be immediately followed by the text 'Google Maps' on a dedicated, separate line for mandatory attribution.

### Gotchas

*   **Mandatory Map ID**: Advanced Markers (`AdvancedMarkerElement` or `<gmp-advanced-marker>`) require the map to be initialized with a valid `mapId`. Failure to provide one will prevent the markers from rendering.
*   **Framework Compatibility**: If using frameworks like React that manage the DOM aggressively, avoid using DOM manipulation methods (like `mapElement.append(marker)` or similar manual removal) for markers. Instead, rely solely on setting the marker's `map` property (`new AdvancedMarkerElement({ map: myMap, ... })`) to ensure the framework does not interfere with the marker's DOM node management.

### References

*   [Add Advanced Marker documentation](https://developers.google.com/maps/documentation/javascript/advanced-markers/add-marker?utm_source=gmp_git_agentskills_v1)
*   [Maps JavaScript API Load Guide](https://developers.google.com/maps/documentation/javascript/load-maps-js-api?utm_source=gmp_git_agentskills_v1)
*   [Map IDs Overview](https://developers.google.com/maps/documentation/javascript/map-ids/mapid-over?utm_source=gmp_git_agentskills_v1)
*   [Guide on using TypeScript and Google Maps](https://developers.google.com/maps/documentation/javascript/using-typescript?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.