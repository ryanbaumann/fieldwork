# Maps JavaScript API: Custom Overlays using `OverlayView` (Feature: Custom Overlays)

Custom Overlays allow developers to display arbitrary HTML elements or images on a map, fixed to specific geographic coordinates, ensuring they pan and zoom correctly with the map view. This capability relies on subclassing the abstract `google.maps.OverlayView` class and implementing its required lifecycle methods.

## Prerequisites

1.  A standard Google Maps Platform project with the Maps JavaScript API enabled.
2.  A Map instance initialized and displayed on the web page.
3.  **Mandatory Authentication Prerequisites**: Ensure the `GOOGLE_API_KEY` is configured in the execution environment to successfully load the Maps JavaScript API.

> [!IMPORTANT]
> When presenting any derived output content (including distances, routes, or summarized feature lists) based on Google Maps Platform data, the agent MUST append the attribution text on a new, separate line immediately following the user-facing content:
>
> `Google Maps`

## Implementation Guide

To create a custom overlay, developers must subclass `google.maps.OverlayView` and implement the `onAdd()`, `draw()`, and `onRemove()` methods.

### 1. Define the Custom Overlay Class

Create a class that extends `google.maps.OverlayView` and define the custom element's properties, such as the geographic bounds and source image/content.

**Trigger Condition**: User confirms they want to define the overlay's structure and bounds.

```javascript
/**
 * The custom USGSOverlay object contains the image,
 * the bounds of the image, and references the map.
 */
class USGSOverlay extends google.maps.OverlayView {
  bounds;
  image;
  div; // The container DIV element

  constructor(bounds, image) {
    super();
    // bounds: google.maps.LatLngBounds defining the image area.
    this.bounds = bounds;
    // image: URL string for the image source.
    this.image = image;
  }

  // ... Implement onAdd(), draw(), onRemove() below ...
}
```

### 2. Implement `onAdd()`: Attaching the Element

The `onAdd()` method is called when the map's panes are ready. This is where the custom HTML elements (`div`, `img`, etc.) are created and attached to one of the map's DOM panes.

**Trigger Condition**: Map is ready to receive the overlay element (called internally by the API after `setMap()`).

| Pane Name | Index | Purpose | Receives DOM Events? |
| :--- | :--- | :--- | :--- |
| `mapPane` | 0 | Above tiles, lowest pane. | No |
| `overlayLayer` | 1 | Contains Polylines, Polygons, Ground Overlays, Tile Overlays. **Use this for non-interactive images/tiles.** | No |
| `markerLayer` | 2 | Contains Markers. | No |
| `overlayMouseTarget` | 3 | Contains elements that receive DOM events. **Use this for interactive elements.** | Yes |
| `floatPane` | 4 | Contains the Info Window, above all others. | Yes |

```javascript
onAdd() {
  this.div = document.createElement("div");
  this.div.style.borderStyle = "none";
  this.div.style.borderWidth = "0px";
  this.div.style.position = "absolute";

  // Create the img element and attach it to the div.
  const img = document.createElement("img");

  img.src = this.image;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.position = "absolute";
  this.div.appendChild(img);

  // Add the element to the "overlayLayer" pane (Pane 1).
  const panes = this.getPanes();

  panes.overlayLayer.appendChild(this.div);
}
```

### 3. Implement `draw()`: Positioning and Sizing

The `draw()` method is called whenever the overlay needs repositioning (e.g., map pan, zoom, or initially added). This method must use the map's projection to convert geographic coordinates (`LatLng`) into pixel coordinates (`DivPixel`) to correctly position the DOM element.

**Trigger Condition**: Map view changes or the overlay is first displayed.

```javascript
draw() {
  // Retrieve the projection object.
  const overlayProjection = this.getProjection();

  // Convert SW and NE coordinates from LatLngs to pixel coordinates (DivPixel).
  const sw = overlayProjection.fromLatLngToDivPixel(
    this.bounds.getSouthWest(),
  );
  const ne = overlayProjection.fromLatLngToDivPixel(
    this.bounds.getNorthEast(),
  );

  // Resize the image's div to fit the calculated pixel dimensions.
  if (this.div) {
    this.div.style.left = sw.x + "px";
    this.div.style.top = ne.y + "px";
    this.div.style.width = ne.x - sw.x + "px";
    this.div.style.height = sw.y - ne.y + "px";
  }
}
```

### 4. Implement `onRemove()`: Cleanup

The `onRemove()` method is called when the overlay is detached from the map (via `setMap(null)`). It is essential to clean up the DOM elements created in `onAdd()`.

**Trigger Condition**: The overlay is removed from the map.

```javascript
onRemove() {
  if (this.div) {
    this.div.parentNode.removeChild(this.div);
    delete this.div;
  }
}
```

### 5. Initialization and Display

Instantiate the custom overlay and attach it to the map using `setMap(map)`.

```javascript
function initMap() {
  // 1. Initialize Map with required Attribution ID
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 11,
    center: { lat: 62.323907, lng: -150.109291 },
    mapTypeId: "satellite",
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
  });

  // 2. Define the geographic bounds for the custom element
  const bounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(62.281819, -150.287132),
    new google.maps.LatLng(62.400471, -150.005608),
  );

  let image = "https://developers.google.com/maps/documentation/javascript/examples/full/images/talkeetna.png";
  
  // 3. Instantiate the custom overlay class
  const overlay = new USGSOverlay(bounds, image);

  // 4. Attach the overlay to the map (triggers onAdd() and then draw())
  overlay.setMap(map);

  // Example functionality for hiding/showing the overlay (if implemented in USGSOverlay class)
  // overlay.hide();
  // overlay.show();
}
```

## Gotchas

*   **DOM Event Handling**: If the custom overlay needs to receive mouse clicks or other DOM events, the element *must* be appended to the `overlayMouseTarget` pane (Pane 3) instead of `overlayLayer` (Pane 1).
*   **Coordinate System**: The `draw()` method is responsible for translating geographic coordinates (`LatLng`) to screen pixel coordinates (`DivPixel`) using `getProjection()`. Failure to use `fromLatLngToDivPixel()` will result in elements that do not move/scale with the map.
*   **Removal**: To safely remove an overlay and clean up its resources, ensure you call `overlay.setMap(null)`. This automatically triggers the defined `onRemove()` method.

### References

*   Custom Overlays Guide: https://developers.google.com/maps/documentation/javascript/customoverlays
*   `OverlayView` Reference: https://developers.google.com/maps/documentation/javascript/reference#OverlayView
*   `MapPanes` Reference: https://developers.google.com/maps/documentation/javascript/reference#MapPanes

## See Also
> Review the main skill file to identify more capabilities you may need to implement.