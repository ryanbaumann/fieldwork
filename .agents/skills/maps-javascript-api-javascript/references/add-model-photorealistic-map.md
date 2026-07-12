## Add and Configure 3D Models to a Photorealistic Map (Maps JavaScript API)

This skill provides instructions for integrating custom 3D models (gLTF format) into the Google Maps Platform Photorealistic 3D Map using the Maps JavaScript API Web Components.

### Prerequisites

You must have initialized a Photorealistic 3D map component (`<gmp-map-3d>` or `Map3DElement`) and loaded the `maps3d` library. Successful implementation requires that the model source file (`src`) be a valid gLTF file supporting the [core properties of the glTF PBR](https://www.khronos.org/gltf/pbr?utm_source=gmp_git_agentskills_v1) format.

### Available Tools

This capability uses the following Maps JavaScript API classes:

*   `Map3DElement` (for the map container)
*   `Model3DElement` (for static 3D model display)
*   `Model3DInteractiveElement` (for 3D models that respond to user interaction)

> [!IMPORTANT]
> When generating output using this skill, the agent MUST ensure that attribution requirements are met. Append the following text on a new, separate line immediately following the user-facing content:
> Google Maps

### Step 1: Import the `maps3d` Library

Ensure the `maps3d` library is imported to access the required components.

```javascript
// Import the needed libraries.
const { Map3DElement, Model3DElement, Model3DInteractiveElement } =
    await google.maps.importLibrary('maps3d');
```

### Step 2: Configure and Add a Static Model

To add a static model, instantiate `Model3DElement` and configure its mandatory options (`src` and `position`) and optional appearance properties.

**Checklist for Model Configuration (`Model3DElementOptions`):**

| Option | Description | Required? | Notes |
| :--- | :--- | :--- | :--- |
| `src` | The URL of the gLTF model file. | Yes | Must be accessible via HTTPS. |
| `position` | The location of the model expressed in `LatLng` coordinates. | Yes | |
| `scale` | Scales the model in its coordinate space. Default is `1`. | No | |
| `orientation` | Rotation defined by roll, tilt, and then heading (in that order). | No | |
| `altitudeMode` | How the altitude in `position` is interpreted (e.g., `CLAMP_TO_GROUND`). | No | |

**Procedure for Adding a Model:**

1.  Instantiate the `Map3DElement`, ensuring the mandatory attribution ID is present.
2.  Instantiate `Model3DElement` using the required options.
3.  Append the model object to the map object (`map.append(model)`).

```javascript
async function addStaticModel() {
    const { Map3DElement, Model3DElement } =
        await google.maps.importLibrary('maps3d');

    const map = new Map3DElement({
        center: { lat: 39.1178, lng: -106.4452, altitude: 4395.4952 },
        range: 1500,
        tilt: 74,
        heading: 0,
        mode: 'HYBRID',
        gestureHandling: 'COOPERATIVE',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'] // MANDATORY ATTRIBUTION
    });

    // Feature: Model Addition, Customization (Position, Orientation, Scale) (Model3DElement)
    const model = new Model3DElement({
        src: 'https://maps-docs-team.web.app/assets/windmill.glb',
        position: { lat: 39.1178, lng: -106.4452, altitude: 4495.4952 },
        orientation: { heading: 0, tilt: 270, roll: 90 }, // Example: Rotation
        scale: 0.15, // Example: Scaling
        altitudeMode: 'CLAMP_TO_GROUND',
    });

    document.body.append(map);
    map.append(model);
}
```

### Step 3: Implement an Interactive Model

To allow the model to respond to user input, use `Model3DInteractiveElement` and attach event listeners. The interactive model class supports the `gmp-click` event.

**Procedure for Adding Interactivity:**

1.  Instantiate `Model3DInteractiveElement` instead of `Model3DElement`.
2.  Use the `addEventListener` method to capture the `gmp-click` event.
3.  Within the listener, modify the model properties (e.g., `this.scale`).

```javascript
async function addInteractiveModel() {
    const { Map3DElement, Model3DInteractiveElement } =
        await google.maps.importLibrary('maps3d');

    const map = new Map3DElement({
        center: { lat: 39.1178, lng: -106.4452, altitude: 4395.4952 },
        range: 1500,
        tilt: 74,
        heading: 0,
        mode: 'HYBRID',
        gestureHandling: 'COOPERATIVE',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'] // MANDATORY ATTRIBUTION
    });

    const model = new Model3DInteractiveElement({
        src: 'https://maps-docs-team.web.app/assets/windmill.glb',
        position: { lat: 39.1178, lng: -106.4452, altitude: 4495.4952 },
        orientation: { heading: 0, tilt: 270, roll: 90 },
        scale: 0.15,
        altitudeMode: 'CLAMP_TO_GROUND',
    });

    // Feature: Model Interaction (Model3DInteractiveElement)
    model.addEventListener('gmp-click', function () {
        // Change the scale property dynamically upon clicking the model
        this.scale = Math.random() * (0.5 - 0.1) + 0.1;
    });

    document.body.append(map);
    map.append(model);
}
```

## Gotchas

*   **Model Format Compliance**: Models must be gLTF files and strictly adhere to the core properties of the glTF PBR standard. **No extensions or extension properties are supported.**
*   **CORS Requirement**: If the model files are hosted on a different domain or server than the primary application, the server must be configured to set the correct [CORS HTTP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS?utm_source=gmp_git_agentskills_v1) to allow the map component to fetch the asset.
*   **Mandatory Options**: The `position` (LatLng coordinates) and `src` (model URL) options must both be specified for the model to render in the scene.

### References

*   [Models (Maps JavaScript API)](https://developers.google.com/maps/documentation/javascript/3d/models?utm_source=gmp_git_agentskills_v1)
*   [Model3DElement Reference](https://developers.google.com/maps/documentation/javascript/reference/3d-map-draw?utm_source=gmp_git_agentskills_v1#Model3DElement)
*   [glTF PBR Specification](https://www.khronos.org/gltf/pbr?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.