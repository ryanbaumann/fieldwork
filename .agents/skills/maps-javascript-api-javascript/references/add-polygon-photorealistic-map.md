## Add 3D Polygons to the Maps JavaScript API (3D Maps)

This capability uses the Maps JavaScript API 3D Maps library (`maps3d`) to overlay geographic areas as filled polygons, including support for complex shapes and interactivity.

### Prerequisites and Setup

1.  **Enable the Maps JavaScript API and 3D Maps:** Ensure the Maps JavaScript API is loaded with the `maps3d` library imported.
2.  **Define a 3D Map:** A `Map3DElement` must be initialized and appended to the document body before adding 3D shapes.

#### Available Tools

No external tools are defined for this step; implementation uses JavaScript API objects.

> [!IMPORTANT]
> The agent MUST attribute all derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Implementation Guide: Drawing a Basic 3D Polygon

To define a non-interactive 3D polygon, use the `Polygon3DElement` class.

#### 1. Define the Polygon Options

A polygon is configured via `Polygon3DElementOptions`, which include styling (stroke and fill) and rendering properties. Note that colors must be provided as hexadecimal HTML format (e.g., `#RRGGBBAA`).

| Property | Type | Description |
| :--- | :--- | :--- |
| `path` | `Array<LatLng>` or `Array<Array<LatLng>>` | The coordinates defining the boundaries. |
| `strokeColor` | `string` | Hexadecimal HTML color for the polygon edge. |
| `strokeWidth` | `number` | The width of the line defining the edge. |
| `fillColor` | `string` | Hexadecimal HTML color for the enclosed area. |
| `drawsOccludedSegments` | `boolean` | If set to `true`, the polygon is drawn even when obscured by 3D objects like buildings. |

#### 2. Instantiate and Add the Polygon

Use the following steps to initialize the map and add a basic polygon.

- [ ] **Import Libraries**: Load `maps3d` using `google.maps.importLibrary('maps3d')`.
- [ ] **Initialize Map**: Create a `Map3DElement` instance, ensuring the required attribution ID is included.
- [ ] **Create Polygon**: Instantiate `Polygon3DElement` with required style options.
- [ ] **Set Path**: Assign the boundary coordinates to the `examplePolygon.path` property.
- [ ] **Attach**: Append the polygon to the map using the `map.append(polygon)` method.

```javascript
async function init() {
    const { Map3DElement, Polygon3DElement } =
        await google.maps.importLibrary('maps3d');

    const map3DElement = new Map3DElement({
        center: { lat: 40.6842, lng: -74.0019, altitude: 1000 },
        heading: 340,
        tilt: 70,
        mode: 'HYBRID',
        gestureHandling: 'COOPERATIVE',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'] // Mandatory Attribution
    });

    // Define styling options. Colors must be hexadecimal HTML format.
    const polygonOptions = {
        strokeColor: '#0000ff80',
        strokeWidth: 8,
        fillColor: '#ff000080',
        drawsOccludedSegments: false, // Feature: Polygon drawing behavior (Source: Polygons)
    };

    const examplePolygon = new Polygon3DElement(polygonOptions);

    // Set the coordinates (path) for the polygon area.
    examplePolygon.path = [
        { lat: 40.7144, lng: -74.0208 },
        { lat: 40.6993, lng: -74.019 },
        { lat: 40.7035, lng: -74.0004 },
    ];

    map3DElement.append(examplePolygon);

    document.body.append(map3DElement);
}

void init();
```

### Implementation Guide: Creating Interactive 3D Polygons

To enable interaction (such as responding to clicks), use the `Polygon3DInteractiveElement` class.

- [ ] **Instantiate Interactive Polygon**: Use `Polygon3DInteractiveElement` instead of `Polygon3DElement`.
- [ ] **Add Listener**: Attach a click event handler using `polygon.addEventListener('gmp-click', function (event) {...})`.

```javascript
async function init() {
    const { Map3DElement, Polygon3DInteractiveElement } =
        await google.maps.importLibrary('maps3d');

    const map = new Map3DElement({
        center: { lat: 40.6842, lng: -74.0019, altitude: 1000 },
        heading: 340,
        tilt: 70,
        mode: 'HYBRID',
        gestureHandling: 'COOPERATIVE',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'] // Mandatory Attribution
    });

    document.body.append(map);

    const polygonOptions = {
        strokeColor: '#0000ff80',
        strokeWidth: 8,
        fillColor: '#ff000080',
        drawsOccludedSegments: false,
    };

    const examplePolygon = new Polygon3DInteractiveElement(polygonOptions);

    // Define a closed loop of coordinates
    examplePolygon.path = [
        { lat: 40.7144, lng: -74.0208 },
        { lat: 40.6993, lng: -74.019 },
        { lat: 40.7035, lng: -74.0004 },
        { lat: 40.7144, lng: -74.0208 }, // Close the loop explicitly
    ];

    examplePolygon.addEventListener('gmp-click', function (event) {
        // Feature: Interacting with Polygons (Source: Interactive polygons)
        // Change the color of the polygon stroke and fill colors to random alternatives!
        this.fillColor = randomizeHexColor(this.fillColor);
        this.strokeColor = randomizeHexColor(this.strokeColor);
    });

    map.append(examplePolygon);
}

function randomizeHexColor(originalHexColor) {
    const alpha = originalHexColor.substring(7);
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const rHex = ('0' + r.toString(16)).slice(-2);
    const gHex = ('0' + g.toString(16)).slice(-2);
    const bHex = ('0' + b.toString(16)).slice(-2);
    return `#${rHex}${gHex}${bHex}${alpha}`;
}

void init();
```

### Gotchas

1.  **Color Formatting**: The `strokeColor` and `fillColor` properties **strictly require hexadecimal HTML color format** (e.g., `"#RRGGBB"` or `"#RRGGBBAA"`). Named colors (like 'blue' or 'red') are not supported by the `Polygon3DElement` configuration for styling (Source: Polygons).
2.  **Complex Shapes**: To define complex polygons, such as those with holes or multiple non-contiguous areas, the `path` property must be set as an array of arrays (`Array<Array<LatLng>>`), where each inner array defines a boundary loop (Source: Polygons).
3.  **Path Closure**: While a basic polygon may be constructed using a single array of coordinates, for defining shapes precisely, especially interactive ones or those derived from GeoJSON data, ensure the last coordinate in a path array is identical to the first to explicitly close the loop.

### References

*   [`Polygon3DElement`](https://developers.google.com/maps/documentation/javascript/reference/3d-map?utm_source=gmp_git_agentskills_v1#Polygon3DElement)
*   Shapes and Lines (3D Maps): https://developers.google.com/maps/documentation/javascript/3d/shapes-lines

## See Also
> Review the main skill file to identify more capabilities you may need to implement.