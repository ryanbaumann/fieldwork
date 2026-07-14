## Customize 3D Markers (Maps JavaScript API)

This capability provides methods for customizing the appearance and behavior of markers placed on a `gmp-map-3d` or `Map3DElement`. Customization can be achieved declaratively using HTML Web Components or programmatically using JavaScript.

### Prerequisites

1.  The application must load the Maps JavaScript API using the `maps3d` library.
2.  A valid API key must be available (e.g., set via `GOOGLE_API_KEY`).
3.  The base `gmp-map-3d` or `Map3DElement` must be initialized with the required 3D parameters (`tilt`, `range`, `mode`).

### Available Tools

No dedicated tools are used for this skill.

> [!IMPORTANT]
> The Agent MUST ensure that all output content derived from Google Maps Platform data (e.g., location coordinates, map views, or data summaries) is correctly attributed. Immediately following the user-facing content, append the text 'Google Maps' on a dedicated, separate line.

### 1. Declarative Customization (HTML Web Component)

Customize the visual appearance of a 3D marker by embedding custom HTML content inside the `<gmp-marker>` element.

#### Checklist

- [ ] Ensure the parent `<gmp-map-3d>` includes the required attribution ID.
- [ ] Define the custom styling using external CSS classes (e.g., `.custom-marker`).
- [ ] Embed the custom element inside the `<gmp-marker>` tag.

#### Implementation

Use the standard `<gmp-marker>` component as a child of `<gmp-map-3d>`. The content defined within the marker tag will be rendered as the marker's visual element.

```html
<html>
    <head>
        <title>3D Marker HTML</title>
        <link rel="stylesheet" type="text/css" href="./style.css" />
        <script
            async
            src="https://maps.googleapis.com/maps/api/js?loading=async&key=YOUR_API_KEY&libraries=maps3d"></script>
    </head>
    <body>
        <gmp-map-3d
            internal-usage-attribution-ids="gmp_git_agentskills_v1"
            center="40.7489,-73.9680,0"
            heading="315"
            tilt="65"
            range="800"
            mode="SATELLITE">
            <!-- Customizing the marker using an embedded div -->
            <gmp-marker position="40.7489,-73.9680" title="UN Headquarters">
                <div class="custom-marker">
                    United Nations Secretariat Building
                </div>
            </gmp-marker>
        </gmp-map-3d>
    </body>
</html>
```

### 2. Programmatic Customization (JavaScript)

Customize the 3D marker's internal properties, such as its vertical positioning and whether it is drawn with an extruded line from the ground, by passing specific parameters to the `Marker3DElement` constructor.

#### Checklist

- [ ] Import the necessary libraries, including `Map3DElement` and `Marker3DElement`.
- [ ] Define the desired customization options (`altitudeMode`, `extruded`, `label`) in the configuration object.
- [ ] Ensure the parent `Map3DElement` includes the required attribution ID (`internalUsageAttributionIds`).

#### Implementation

When creating a new `Marker3DElement`, include the following optional parameters to customize its appearance and behavior:

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `altitudeMode` | `string` | Defines how the `altitude` property is interpreted. `ABSOLUTE` is supported. (Treated as `CLAMP_TO_GROUND` if omitted). |
| `extruded` | `boolean` | If `true`, draws a line from the ground to the bottom of the marker. |
| `label` | `string` | Adds a visible text label to the marker. |
| `position` | `object` | Requires `lat` and `lng`, and optionally `altitude`. |

```javascript
async function init() {
    // 1. Load the necessary 3D map elements
    const { Map3DElement, Marker3DElement } =
        await google.maps.importLibrary('maps3d');

    const map = new Map3DElement({
        center: { lat: 37.4239163, lng: -122.0947209, altitude: 0 },
        tilt: 67.5,
        range: 1000,
        mode: 'SATELLITE',
        gestureHandling: 'COOPERATIVE',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'] // Mandatory Attribution
    });

    // 2. Define custom properties for the Marker3DElement
    const marker = new Marker3DElement({
        // Marker position, customized with an explicit altitude
        position: { lat: 37.4239163, lng: -122.0947209, altitude: 50 },

        // Customization Options:
        altitudeMode: 'ABSOLUTE', // Sets altitude relative to sea level.
        extruded: true, // Draws a line down to the ground.
        label: 'Custom Altitude Marker', // Adds a text label.
    });

    // 3. Append the customized marker to the map
    map.append(marker);
    document.body.append(map);
}

void init();
```

### Gotchas

*   **Altitude Context**: If `altitudeMode` is omitted or set to `CLAMP_TO_GROUND`, any specified `altitude` in the `position` object will be ignored, and the marker will sit directly on the 3D surface. Use `altitudeMode: 'ABSOLUTE'` to position the marker relative to sea level.
*   **CSS Dependency**: When using declarative customization (embedding a `div`), the visual appearance is entirely dependent on external CSS definitions (e.g., defining `.custom-marker`). If the CSS is missing, the marker will render as unstyled text.

### References

*   Basic marker customization: https://developers.google.com/maps/documentation/javascript/3d/marker-customization
*   Adding 3D Markers: https://developers.google.com/maps/documentation/javascript/3d/marker-add

## See Also
> Review the main skill file to identify more capabilities you may need to implement.