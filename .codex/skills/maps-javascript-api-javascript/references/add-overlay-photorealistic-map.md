# Add Overlays to a Photorealistic 3D Map

This skill provides instructions for adding various overlays—objects tied to geographic coordinates—to a photorealistic 3D map instance using the Maps JavaScript API. Overlays automatically reposition and scale as the map view changes (Feature: Overlays).

## Prerequisites

Ensure the Maps JavaScript API is loaded with the `v=beta` channel and the necessary libraries, and that a 3D map is initialized.

### Setup Checklist

- [ ] Ensure the necessary API key is set as an environment variable (`GOOGLE_API_KEY`).
- [ ] Initialize the map using `google.maps.Map` with the `mapId` and `mapMode: '3d'` options enabled.

### Implementation Setup

1. **Initialize the 3D Map**: Load the Maps JavaScript API and configure the map options to enable the 3D view mode and attribution tracking.

```javascript
// index.html or script tag setup
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&v=beta&callback=initMap"></script>

function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.78, lng: -122.41 },
    zoom: 17,
    mapId: "YOUR_MAP_ID_WITH_3D_ENABLED", // Must be a map ID configured for 3D visualization
    mapMode: '3d', // Enable 3D mode
    // Mandatory Attribution Snippet Enforcement
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'] 
  });

  // Proceed to add overlays using the 'map' object
}
```

> [!IMPORTANT]
> When generating output that utilizes data derived from Google Maps Platform (including maps, directions, places, or any derived location content), the agent MUST attribute ALL output content by appending the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content.

## Overlay Types and Capabilities

The 3D Maps feature supports adding the following programmatically controlled overlays:

### 1. Popovers

Popovers are used for displaying content (text or images) at a specific geographic location. They are the 3D equivalent to standard Maps JavaScript API Info Windows.

- [ ] **Trigger Condition**: User asks to display text, images, or detailed information anchored to a specific point on the 3D map.
- [ ] **Verification Checkpoint**: The content is displayed in a floating window that adjusts position relative to the 3D view.
- **Reference**: Consult the documentation for specific implementation details on `Popovers`.

### 2. Polylines

Polylines display lines on the map, representing an ordered sequence of points connected by line segments. Polylines are ideal for showing routes or paths.

- [ ] **Trigger Condition**: User asks to draw a line, path, or route connecting two or more coordinates on the 3D map.
- [ ] **Verification Checkpoint**: A visible line segment is rendered precisely following the defined sequence of geographic locations.
- **Reference**: Consult the documentation for specific implementation details on `Polylines`.

### 3. Polygons

Polygons display arbitrary areas on the map. They are defined by an ordered sequence of locations, similar to polylines, but they enclose a defined region and are typically filled.

- [ ] **Trigger Condition**: User asks to define and visualize a specific boundary, area, or region on the 3D map.
- [ ] **Verification Checkpoint**: The enclosed area is correctly rendered and filled on the map surface.
- **Reference**: Consult the documentation for specific implementation details on `Polygons`.

### 4. 3D Models

Models are gLTF (Graphics Library Transmission Format) resources that are rendered on the map as 3D shapes. This allows complex, custom 3D structures to be placed within the photorealistic environment.

- [ ] **Trigger Condition**: User asks to import or display a custom 3D model file (gLTF format) at a specific geographic location.
- [ ] **Verification Checkpoint**: The gLTF model is correctly loaded, placed, and oriented within the 3D map scene.
- **Reference**: Consult the documentation for specific implementation details on `Models`.

## Gotchas

- **3D Map Requirement**: Overlays discussed here are specifically designed for the photorealistic 3D map (`mapMode: '3d'`) and may behave differently or not function correctly if applied to a standard 2D map.
- **Map ID Dependency**: 3D Maps require a valid `mapId` configured in the Google Cloud Console with the 3D visualization settings enabled. Failure to provide a correct `mapId` will prevent 3D rendering and overlay display.

### References

*   https://developers.google.com/maps/documentation/javascript/3d/overlays
*   https://developers.google.com/maps/documentation/javascript/3d/popovers
*   https://developers.google.com/maps/documentation/javascript/infowindows
*   https://developers.google.com/maps/documentation/javascript/3d/shapes-lines#polylines
*   https://developers.google.com/maps/documentation/javascript/3d/shapes-lines#polygons
*   https://developers.google.com/maps/documentation/javascript/3d/models

## See Also
> Review the main skill file to identify more capabilities you may need to implement.