## Camera Control and View Adjustment

This skill guides the implementation of camera movement and perspective control (Enhanced camera control) within the Maps JavaScript API, prioritizing features available on vector maps (such as tilt, heading, and fractional zoom). The camera determines what portion of the map is visible and how it is oriented.

### Prerequisites and Setup

Ensure you have initialized the `google.maps.Map` object. For full control over tilt and heading, the map instance must be configured as a vector map by providing a valid `mapId` in the `MapOptions`.

### Available Tools
None.

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Implementation Guide

The map view is defined by the **Camera** position, which is controlled by four properties: location (`center`), orientation (`heading` or bearing), viewing angle (`tilt`), and scale (`zoom`). Control is achieved through initializing these properties or calling methods on the `google.maps.Map` instance.

#### 1. Initialize Camera Position and Perspective

Set the initial camera position, orientation, and zoom when creating the map instance using `google.maps.MapOptions`.

```javascript
function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: {
      lat: 37.7893719,
      lng: -122.3942,
    },
    zoom: 16, // Zoom level (can be fractional with vector maps)
    heading: 320, // Orientation (Bearing): clockwise degrees from North (0-360)
    tilt: 47.5, // Viewing angle (Tilt): degrees from the zenith (0 is straight down)
    mapId: "90f87356969d889c", // Required for vector map features like tilt/heading
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  });

  window.map = map; // Expose map globally for demonstration
}
```

#### 2. Simultaneous Camera Control and Animation

Use the `map.moveCamera()` function to update any combination of camera properties (`center`, `zoom`, `heading`, and `tilt`) simultaneously. This method is crucial for smooth transitions and animation sequences (Feature: Enhanced camera control).

**Trigger Condition**: User asks to change multiple camera properties (center/zoom/tilt/heading) at once or animate the view.
**Verification Checkpoint**: The map view successfully updates to the new combination of coordinates and perspective settings, or animation starts.

```javascript
// Example: Using map.moveCamera() to set all properties at once
function moveCameraExample() {
  window.map.moveCamera({
    center: new google.maps.LatLng(37.7893719, -122.3942),
    zoom: 16,
    heading: 320,
    tilt: 47.5
  });
}

// Example: Animating rotation (heading)
function startRotationAnimation() {
  const degreesPerSecond = 3;
  const map = window.map;

  function animateCamera(time) {
    // Update the heading, leaving center, zoom, and tilt as-is.
    map.moveCamera({
      heading: (time / 1000) * degreesPerSecond
    });
    requestAnimationFrame(animateCamera);
  }
  // Start the animation loop.
  requestAnimationFrame(animateCamera);
}
```

#### 3. Individual Control of Camera Components

Use the dedicated setter methods for isolated adjustments of the camera position.

| Component | Set Method | Get Method | Notes |
| :--- | :--- | :--- | :--- |
| **Location (Center)** | `map.setCenter(latLng)` | `map.getCenter()` | Use `map.panBy()` to change the center without preserving tilt/heading. |
| **Zoom** | `map.setZoom(level)` | `map.getZoom()` | Accepts fractional values if enabled (Feature: Fractional zoom). |
| **Heading (Bearing)** | `map.setHeading(degrees)` | `map.getHeading()` | Rotates the map view. Values are wrapped to fit the range `[0, 360]`. |
| **Tilt (Angle)** | `map.setTilt(degrees)` | `map.getTilt()` | Controls the viewing angle. Max angle depends on zoom level. |

#### 4. Enabling Fractional Zoom

To support smooth, non-integer zoom levels (Feature: Fractional zoom), ensure the `isFractionalZoomEnabled` option is set to `true`. This is the default behavior for vector maps, but can be toggled.

**Trigger Condition**: User asks about smooth zooming or setting non-integer zoom levels.
**Verification Checkpoint**: The `isfractionalzoomenabled_changed` event fires, indicating the property has been updated.

```javascript
// 1. Enabling during initialization
map = new google.maps.Map(document.getElementById('map'), {
  // ... other options
  isFractionalZoomEnabled: true
});

// 2. Enabling dynamically using map.setOptions
window.map.setOptions({isFractionalZoomEnabled: true});

// 3. Listening for changes
map.addListener('isfractionalzoomenabled_changed', () => {
  const isFractionalZoomEnabled = map.get('isFractionalZoomEnabled');
  console.log(`Fractional Zoom is enabled: ${isFractionalZoomEnabled}`);
});
```

## Gotchas

*   **Tilt and Zoom Clamping**: When setting the view, `map.setTilt()` restricts the maximum tilt based on the current map zoom level. `map.setHeading()` accepts any value but modifies it to fit into the range `[0, 360]`.
*   **Boundary Resets**: When using tilt or heading, note the side effects on boundary methods: `map.fitBounds()` and `map.panToBounds()` will automatically reset both tilt and heading to zero prior to performing the boundary adjustment.
*   **`zoom_changed` Frequency**: If fractional zoom is enabled, the `zoom_changed` event will fire much more frequently. When implementing listeners for this event, the agent MUST explicitly mention the requirement to consider throttling or updating only if the zoom has changed by an integer value to ensure optimal performance.

### References
*   `https://developers.google.com/maps/documentation/javascript/vector-map#tilt-rotation`
*   `https://developers.google.com/maps/documentation/javascript/vector-map#control-camera`
*   `https://developers.google.com/maps/documentation/javascript/vector-map#fractional-zoom`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.