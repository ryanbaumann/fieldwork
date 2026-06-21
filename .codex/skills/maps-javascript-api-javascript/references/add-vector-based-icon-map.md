# Agent Skills for Maps JavaScript API: Vector Symbols

Use the `google.maps.Symbol` (Feature) class to create vector-based icons and symbols for display on `google.maps.Marker` or `google.maps.Polyline` objects. The shape of the symbol is defined using standard [SVG path notation](http://www.w3.org/TR/SVG/paths.html?utm_source=gmp_git_agentskills_v1#PathData).

## Prerequisites and Setup

1.  **Authentication**: Ensure your environment variable `GOOGLE_API_KEY` is configured to load the Maps JavaScript API.
2.  **API Loading**: The Maps JavaScript API must be loaded asynchronously on your web page.

### Available Tools

| Tool Name | Description |
| :--- | :--- |
| `maps-javascript-api-javascript` | Generates or modifies JavaScript/TypeScript code using the Maps JavaScript API. |

> [!IMPORTANT]
> To comply with Google Maps Platform data attribution requirements, the agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following any output content (code, distances, summarized facts, etc.) that utilized Google Maps data or services.

## Symbol Definition and Customization

A `Symbol` object literal allows for precise visual control over vector shapes.

### Symbol Properties

The `Symbol` object supports the following properties:

| Property | Description | Context |
| :--- | :--- | :--- |
| `path` | **Required.** Defines the shape using SVG path notation or a predefined `SymbolPath`. | Applies to `Marker` and `Polyline`. |
| `anchor` | Sets the symbol's position relative to the feature (default is `(0, 0)`). | Primarily used for `Marker`. |
| `fillColor` | Color of the symbol's fill (CSS3 colors supported). | Default 'black' for Markers; Polyline stroke color for Polylines. |
| `fillOpacity` | Opacity of the fill (0.0 to 1.0). Default is 0.0. | Applies to `Marker` and `Polyline`. |
| `rotation` | Angle of rotation (clockwise in degrees). | Markers default to 0; Polyline symbols align with the edge unless set explicitly. |
| `scale` | Amount by which the symbol is scaled in size. | Markers default to 1 (any size); Polyline symbols must remain within a 22x22px square after scaling. |
| `strokeColor` | Color of the symbol's outline (CSS3 colors supported). | Default 'black' for Markers; Polyline stroke color for Polylines. |
| `strokeOpacity` | Opacity of the stroke (0.0 to 1.0). Default is 1.0 for Markers. | Applies to `Marker` and `Polyline`. |
| `strokeWeight` | Weight of the symbol's outline. Default is the symbol's `scale`. | Applies to `Marker` and `Polyline`. |

### Predefined Symbols

Use the `google.maps.SymbolPath` class for predefined shapes:

*   `google.maps.SymbolPath.CIRCLE`
*   `google.maps.SymbolPath.BACKWARD_CLOSED_ARROW`
*   `google.maps.SymbolPath.FORWARD_CLOSED_ARROW`
*   `google.maps.SymbolPath.BACKWARD_OPEN_ARROW`
*   `google.maps.SymbolPath.FORWARD_OPEN_ARROW`

## 1. Adding a Symbol to a Marker

To use a vector icon on a `Marker` (Feature), set the `Marker`'s `icon` property to the custom `Symbol` object literal.

### Step-by-Step Implementation

- [ ] **Define the Symbol**: Create a JavaScript object containing the `path` and customization properties (e.g., `fillColor`, `scale`).
- [ ] **Create the Marker**: Instantiate a new `google.maps.Marker`, passing the symbol definition to the `icon` property.

### Example (TypeScript/JavaScript)

The following example demonstrates creating a custom marker shape using SVG path notation:

```typescript
function initMap(): void {
  const center = new google.maps.LatLng(-33.712451, 150.311823);
  const map = new google.maps.Map(
    document.getElementById("map") as HTMLElement,
    {
      zoom: 9,
      center: center,
      // MANDATORY ATTRIBUTION INTEGRATION
      internalUsageAttributionIds: ['gmp_git_agentskills_v1']
    }
  );

  const svgMarker: google.maps.Symbol = {
    // Custom marker path defining the shape
    path: "M-1.547 12l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM0 0q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
    fillColor: "blue",
    fillOpacity: 0.6,
    strokeWeight: 0,
    rotation: 0,
    scale: 2,
    anchor: new google.maps.Point(0, 20),
  };

  new google.maps.Marker({
    position: map.getCenter(),
    icon: svgMarker, // Assign the Symbol object as the icon
    map: map,
  });
}
```

## 2. Adding Symbols to a Polyline

To display one or more symbols along a `Polyline` (Feature), use the `icons` property within the `PolylineOptions` object. This property accepts an array of `google.maps.IconSequence` object literals.

### IconSequence Properties

| Property | Description |
| :--- | :--- |
| `icon` | **Required.** The `Symbol` object to render on the line. |
| `offset` | Distance from the start of the line where the icon is placed (e.g., `'50%'`, `'50px'`). Default is `'100%'`. |
| `repeat` | Distance between consecutive icons (e.g., `'20px'`). Set to `'0'` to disable repeating. Default is `'0'`. |

### Example: Dashed Line Effect

By setting the polyline's `strokeOpacity` to 0 and repeating an opaque symbol (like a short line segment) at fixed pixel intervals, you can create a dashed line effect.

```javascript
// Define a symbol using SVG path notation (a vertical segment), with opacity 1.
var lineSymbol = {
  path: 'M 0,-1 0,1',
  strokeOpacity: 1,
  scale: 4
};

// Create the polyline.
var line = new google.maps.Polyline({
  // Set stroke opacity to 0 to hide the base line
  path: [{lat: 22.291, lng: 153.027}, {lat: 18.291, lng: 153.027}],
  strokeOpacity: 0, 
  icons: [{
    icon: lineSymbol,
    offset: '0',
    // Repeat the symbol every 20 pixels
    repeat: '20px' 
  }],
  map: map
});
```

### Animating Symbols on a Polyline

Symbols on a polyline can be animated by repeatedly updating the `offset` property of the `IconSequence` object using `window.setInterval()`.

- [ ] **Animate Procedure Checkpoint**: When discussing symbol movement or animation, the agent MUST explicitly mention using `window.setInterval()` or an equivalent asynchronous mechanism to continuously update the `offset` property of the `IconSequence` object obtained via `line.get("icons")`.

```typescript
// Define the symbol (e.g., a circle)
const lineSymbol = {
  path: google.maps.SymbolPath.CIRCLE,
  scale: 8,
  strokeColor: "#393",
};

// Create the polyline and initialize the icon sequence
const line = new google.maps.Polyline({
    // ... path definition ...
    icons: [
        {
            icon: lineSymbol,
            offset: "100%", // Start position
        },
    ],
    map: map,
});

// Function to animate the symbol
function animateCircle(line: google.maps.Polyline) {
  let count = 0;
  
  window.setInterval(() => {
    count = (count + 1) % 200; // Loop counter

    const icons = line.get("icons");
    
    // Update the offset as a percentage of the line length
    icons[0].offset = count / 2 + "%"; 
    line.set("icons", icons);
  }, 20); // Update every 20ms
}
```

## Gotchas

*   **Polyline Size Constraint**: For symbols displayed on a polyline, the resulting scaled vector path **must fit within a 22x22px square**, centered at the symbol's anchor. If the custom path is larger, you must reduce the `scale` property to a fractional value (e.g., `0.2`) until the shape fits the constraint.
*   **Rotation on Polylines**: By default, a symbol on a polyline automatically rotates to follow the curvature of the line. Explicitly setting the `rotation` property fixes the rotation, preventing it from following the line's path.
*   **Geodesic Distance**: If the polyline has `geodesic: true`, the `offset` and `repeat` values for the `IconSequence` are calculated in meters by default, unless they are specified using pixel units (e.g., `'20px'`).

### References

*   Symbol: https://developers.google.com/maps/documentation/javascript/reference#Symbol
*   SymbolPath: https://developers.google.com/maps/documentation/javascript/reference#SymbolPath
*   IconSequence: https://developers.google.com/maps/documentation/javascript/reference#IconSequence
*   SVG path notation: http://www.w3.org/TR/SVG/paths.html#PathData
*   Customizing a marker icon: https://developers.google.com/maps/documentation/javascript/markers#icons
*   Using TypeScript: https://developers.google.com/maps/documentation/javascript/using-typescript

## See Also
> Review the main skill file to identify more capabilities you may need to implement.