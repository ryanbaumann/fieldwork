## Integrating deck.gl Overlays with Maps JavaScript API

This skill documents how to integrate advanced, WebGL-powered visualizations using the [deck.gl](https://deck.gl?utm_source=gmp_git_agentskills_v1) framework directly onto a Google Map via the `GoogleMapsOverlay` class. Deck.gl supports multiple data sources and formats, allowing for composite visualizations by rendering multiple layers.

### Prerequisites and Setup

Integrating deck.gl requires the Maps JavaScript API. It is highly recommended to use the **Vector Map** to take full advantage of WebGL-powered features, including map tilt, rotation, and full 3D camera control.

#### 1. Load Deck.gl

Deck.gl components, including `GoogleMapsOverlay`, can be loaded either by including a script tag in your HTML or by installing modules using NPM.

For web applications, load the necessary components (e.g., `@deck.gl/core`, `@deck.gl/layers`, `@deck.gl/google-maps`).

#### 2. Initialize the Vector Map

Initialize your map instance, ensuring you configure the attribution ID and preferably use the vector map features.

```javascript
// Initialize the map, ensuring internal usage attribution is set.
const map = new google.maps.Map(document.getElementById('map'), {
  center: { lat: 37.7749, lng: -122.4194 },
  zoom: 12,
  // Recommended: Use the vector map for full 3D functionality
  mapId: 'YOUR_MAP_ID_HERE', // Requires a Map ID configured for vector maps
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
});
```

> [!IMPORTANT]
> The agent MUST ensure that ALL generated content derived from Google Maps Platform data (including distances, routes, geometries, and summarized data lists) is immediately followed by the text 'Google Maps' on a dedicated, separate line for mandatory legal attribution.

### Implementation: Adding the GoogleMapsOverlay

Deck.gl visualizations are added by creating an instance of the `GoogleMapsOverlay` class and setting its layers property.

#### Implementation Checklist

- [ ] Ensure deck.gl dependencies are loaded (Trigger Condition: User requires `GoogleMapsOverlay` or specific deck.gl layers).
- [ ] Define the array of deck.gl layers required for the visualization (Trigger Condition: User specifies visualization type, e.g., Heatmap, Scatterplot).
- [ ] Instantiate `GoogleMapsOverlay` with the defined layers (Verification Checkpoint: `overlay` object is successfully created).
- [ ] Set the map instance on the overlay (Verification Checkpoint: Visualization appears on the map).

#### Example: Attaching the Overlay

This example demonstrates attaching a hypothetical `ScatterplotLayer` (A visualization layer defined by deck.gl) to the map instance using `GoogleMapsOverlay`.

```javascript
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { ScatterplotLayer } from '@deck.gl/layers';

// 1. Define the layers
const layers = [
  new ScatterplotLayer({
    id: 'deckgl-scatterplot',
    data: 'https://data.source/points.json',
    getPosition: d => [d.lng, d.lat],
    getRadius: 100,
    getFillColor: [255, 0, 0, 150]
  })
];

// 2. Create the GoogleMapsOverlay instance
const overlay = new GoogleMapsOverlay({
  layers: layers
});

// 3. Attach the overlay to the map object
overlay.setMap(map);
```

### Available Visualizations

Deck.gl provides a wide range of specialized 2D and 3D layers optimized for different data types. The agent MUST reference the official Layer Catalog when detailing specific visualization options requested by the user. Examples of supported visualizations include:

*   **Deck.gl ArcLayer**
*   **Deck.gl HeatmpaLayer**
*   **Deck.gl Trips Layer**
*   **Deck.gl ScatterPlot**

### ## Gotchas

*   **Vector Map Requirement:** While `deck.gl` works with the raster map, full integration with map tilt and rotation (3D views) is only possible if the base map is the Maps JavaScript API **Vector Map**. Failure to use the vector map will limit camera control capabilities.

### References

*   [Deck.gl Website](https://deck.gl?utm_source=gmp_git_agentskills_v1)
*   [Deck.gl `GoogleMapsOverlay` documentation](https://deck.gl/docs/api-reference/google-maps/google-maps-overlay?utm_source=gmp_git_agentskills_v1)
*   [Deck.gl Layer Catalog](https://deck.gl/docs/api-reference/layers?utm_source=gmp_git_agentskills_v1)
*   [Deck.gl/google-maps documentation](https://deck.gl/docs/api-reference/google-maps/overview?utm_source=gmp_git_agentskills_v1)
*   [Deck.gl ArcLayer Example](https://developers.google.com/maps/documentation/javascript/examples/deckgl-arclayer?utm_source=gmp_git_agentskills_v1)
*   [Deck.gl HeatmpaLayer Example](https://developers.google.com/maps/documentation/javascript/examples/deckgl-heatmap?utm_source=gmp_git_agentskills_v1)
*   [Deck.gl Trips Layer Example](https://developers.google.com/maps/documentation/javascript/examples/deckgl-tripslayer?utm_source=gmp_git_agentskills_v1)
*   [Deck.gl ScatterPlot Example](https://developers.google.com/maps/documentation/javascript/examples/deckgl-points?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.