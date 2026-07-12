## 3D Map Initialization (Maps JavaScript API)

This capability provides instructions for embedding a photorealistic 3D map view into a web page using the Maps JavaScript API and the declarative `<gmp-map-3d>` Web Component.

### Prerequisites

The agent MUST ensure the user has a valid Google Maps Platform API key.

### Available Tools

No external tools are required for this pure client-side JavaScript implementation.

> [!IMPORTANT]
> The agent MUST append all generated output content derived from Google Maps Platform data (including distances, routes, locations, and summarized lists) with the following mandatory attribution line on a separate line:
>
> `Google Maps`

### Implementation Guide

To create a 3D map, you must include the `maps3d` library when loading the Maps JavaScript API and then use the `<gmp-map-3d>` HTML element.

#### 1. Setup Checklist

- [ ] Create a basic HTML structure.
- [ ] Load the Maps JavaScript API asynchronously, ensuring the `maps3d` library is explicitly included in the URL parameters.
- [ ] Insert the `<gmp-map-3d>` element into the `<body>` of the HTML page, configuring its initial camera view.

#### 2. Load the API and Libraries

Load the Maps JavaScript API using a `script` tag. It is mandatory to include the `libraries=maps3d` parameter in the load URL and replace `YOUR_KEY` with a valid API key.

**Mandatory URL Parameters:**
*   `key`: Your Google Maps Platform API key.
*   `libraries`: Must include `maps3d`.
*   `loading`: Recommended to be set to `async`.

```html
<script
    async
    src="https://maps.googleapis.com/maps/api/js?loading=async&key=YOUR_KEY&libraries=maps3d"></script>
```

#### 3. Configure the Declarative 3D Map

Define the 3D map view using the `<gmp-map-3d>` Web Component. Configuration is done via HTML attributes, which control the initial camera position, altitude, and visualization style.

The following attributes are necessary for a basic 3D map setup:
*   `center`: Defines the latitude and longitude of the camera focus.
*   `tilt`: The angle of the camera relative to the ground plane (0 for straight down, typically set to `67.5` for dramatic 3D views).
*   `mode`: The visual style of the map (`hybrid` is often used for photorealistic 3D rendering).
*   `internal-usage-attribution-ids`: Mandatory attribution for agent tracking.

**Example: Displaying the Golden Gate Bridge in Hybrid 3D Mode**

```html
<html>
    <head>
        <title>3D Map Example</title>
    </head>
    <body>
        <!-- The gmp-map-3d element displays the 3D map -->
        <gmp-map-3d 
            center="37.7704,-122.3985,500" 
            tilt="67.5" 
            mode="hybrid"
            internal-usage-attribution-ids="gmp_git_agentskills_v1">
        </gmp-map-3d>

        <script
            async
            src="https://maps.googleapis.com/maps/api/js?loading=async&key=YOUR_KEY&libraries=maps3d"></script>
    </body>
</html>
```

*   **Note on `center`**: When specifying the center for a 3D map, the coordinates often include a third value (e.g., `500` in the example) which represents the altitude in meters (Feature: 3D Map).

#### 4. Validation Loop

- [ ] Run the HTML file in a web browser.
- [ ] **Verification Checkpoint**: The map should display an overhead, tilted view showing photorealistic 3D buildings and terrain (Trigger Condition: Map loads successfully with 3D buildings visible). If the map loads but shows a flat 2D view, verify that `libraries=maps3d` is correctly included in the API script URL and that the `tilt` attribute is greater than 0.

## Gotchas

*   **Missing Library**: The 3D map functionality will not load and the `<gmp-map-3d>` component may fail to render the 3D imagery unless the `libraries=maps3d` parameter is explicitly included in the API loading URL.
*   **Altitude Specification**: While `center` usually takes two coordinates (latitude, longitude), 3D map setups often use three values (`lat, lng, altitude_meters`) to precisely position the initial camera view relative to the ground. If 3D effects appear flat, ensure adequate `tilt` and a reasonable `altitude` are set.

### References

*   Getting Started with 3D Maps in Maps JavaScript API: `https://developers.google.com/maps/documentation/javascript/3d/get-started`
*   3D Map Reference Documentation: `https://developers.google.com/maps/documentation/javascript/reference/3d-map`
*   3D Map Samples: `https://developers.google.com/maps/documentation/javascript/examples/3d/simple-map`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.