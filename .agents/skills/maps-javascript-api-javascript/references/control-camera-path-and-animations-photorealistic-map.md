## 3D Camera Path and Animation Control

This capability enables precise manipulation of the camera view on the photorealistic `<gmp-map-3d>` Web Component, supporting both static viewpoints and complex, smooth cinematic flight paths.

### Prerequisites & Setup

To use the 3D map features, you must load the `maps3d` library and configure authentication.

1.  **API Key Configuration**: Ensure the Google Maps Platform API Key is included in the script loading tag.
2.  **Import Library**: Load the `maps3d` library explicitly:
    ```javascript
    await google.maps.importLibrary('maps3d');
    ```
3.  **Attribution ID**: When initializing the map, provide the required internal usage attribution ID:
    ```html
    <gmp-map-3d internal-usage-attribution-ids="gmp_git_agentskills_v1">
    </gmp-map-3d>
    ```

> [!IMPORTANT]
> The agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following any output derived from using this tool (single facts, distances, routes, summarized lists).

### 1. Defining the Camera Viewpoint

The camera view is defined by a set of linked properties controlling the target location and the camera's orientation/distance.

#### A. Positioning Methods

The camera's geographical position can be set using one of two mutually exclusive methods:

| Property | Description | Use Case |
| :--- | :--- | :--- |
| `center` | Specifies the coordinates (lat, lng, altitude) of the point the camera is looking *at* (the target point). | Focus on a specific landmark or area. |
| `cameraPosition` | Specifies the coordinates (lat, lng, altitude) of the camera's physical location in 3D space. | Defining a precise viewpoint (e.g., placing the camera 50m above a point). |

**Note**: Setting one property (`center` or `cameraPosition`) automatically calculates the other based on the current `tilt`, `heading`, and `range`.

**Example: Toggling between center and camera position modes**

```javascript
const map3DElement = document.querySelector('gmp-map-3d');
const initialCenter = { lat: 40.7860524, lng: -73.9634983, altitude: 0 };

// 1. Center Mode (Looking AT the target)
map3DElement.center = initialCenter;
map3DElement.tilt = 70;

// 2. Camera Position Mode (Placing the camera 50m up)
map3DElement.cameraPosition = { ...initialCenter, altitude: 50 };
map3DElement.tilt = 80; 
```

#### B. Camera Orientation and Perspective

These properties define how the camera is aimed and its perspective effect, regardless of the positioning method used.

| Property | Function | Constraints/Range |
| :--- | :--- | :--- |
| `heading` | Horizontal rotation around the target point (compass bearing). | Angular value (e.g., -150 to 180 degrees). |
| `tilt` | Vertical pitch of the camera (looking down). | 0° (directly overhead) to 90° (at the horizon). |
| `roll` | Rotation around the camera's optical axis. | Angular value. |
| `range` | Physical distance (in meters) between the camera and the target point (`center`). | Controls apparent zoom (distance). |
| `fov` | Field of View (vertical angle of the lens). | 5° (telephoto/narrow) to 80° (wide-angle). |

### 2. Implementing Advanced Cinematic Camera Paths

For smooth, continuous tracking shots that avoid the choppy deceleration inherent in using discrete waypoints, the agent MUST advise implementing a continuous rendering loop and physics-based smoothing.

#### Checklist for Cinematic Animation

To build a continuous tracking camera path along a route, the agent MUST follow these steps:

- [ ] **Continuous Rendering Engine**: Implement a custom animation loop using `requestAnimationFrame(timestamp)` to calculate and set camera properties frame-by-frame, ensuring uniform velocity (Section 1. The Solution). Avoid relying on `flyCameraTo()` or `gmp-animationend` events, which force the camera to stop at each point (Section 1. The Problem).
- [ ] **Spatial Data Pre-processing**: Process the route data beforehand to calculate the true cumulative distance for every point (`e._cumDists`). This enables instant spatial location lookups during the animation loop, preventing real-time geometric calculations from destroying the framerate (Section 2. The Solution).
- [ ] **Smoothing via Interpolation**: Apply physics-based **Lerp (Linear Interpolation)** to smooth changes in `center`, `range`, `tilt`, and `altitude`. Use **Slerp (Spherical Linear Interpolation)** to calculate `heading` updates, especially when crossing the 0°/360° boundary, ensuring smooth rotation (Section 3. Physics-Based Inertia).
- [ ] **Predictive Heading**: Implement logic to calculate the camera's `heading` based on a future anchor point (e.g., 8 seconds ahead on the path). This forces the camera to "lean into" upcoming turns, creating cinematic inertia and preventing severe whip behavior at corners (Section 3. Cinematic Inertia View).
- [ ] **Elevation Anti-Clipping**: Implement a check for terrain variance spanning the upcoming 500 meters. If a steep climb is detected, dynamically increase the camera's target altitude (up to **150 meters above the peak** in the upcoming segment), inflate the camera `range`, and increase the `tilt` (pitching toward 85°). This prevents the camera from clipping into mountainous terrain (Section 5. The Solution (Part 1)).
- [ ] **Scrubbing Support**: Abstract the camera position setting into a pure spatial function, `drawCameraAtDistance(distance_in_meters)`, which can be called by both the temporal animation loop and a user UI slider. This enables flawless timeline scrubbing even when the animation is paused (Section 6. Decoupling Temporal and Spatial Rendering).
- [ ] **High Altitude Orbital Mode**: To guarantee an anti-clipping view over all topography, configure a mode that scrapes the absolute highest elevation of the entire route and permanently locks the base camera altitude `+1200m` above that global maximum, locking `tilt` to 20° (Section 7. "High Altitude Orbital" Mode).

### ## Gotchas

Review these non-obvious failure modes before implementing 3D camera control and marker interaction.

1.  **Choppy Animation using `flyCameraTo()`**: Relying on the native `Map3DElement.flyCameraTo(point)` function or its associated animation events will result in the camera decelerating and coming to a **complete stop** at every single coordinate/waypoint. For smooth, continuous motion, a custom `requestAnimationFrame` loop with LERP/SLERP physics is required (Section 1. The Problem).
2.  **Sea Level Plunge on Fly-to**: When creating interactive markers on the 3D map, developers often use `altitudeMode: 'CLAMP_TO_GROUND'` to ensure they sit correctly on the terrain (Section 9. The Solution). However, this causes the marker object to discard its absolute elevation data. If `flyCameraTo` is called using the marker's stripped position, the target altitude will default to 0 meters (Sea Level). You MUST manually maintain the true ground elevation and re-inject it into the target object *before* calling the camera animation engine (Section 10. Restoring Absolute Camera Animation Targets).
3.  **Incompatible Marker Types**: The 3D map component, `<gmp-map-3d>`, does **not support** the DOM-bound `AdvancedMarkerElement` used in 2D maps. Only the rasterized `Marker3DElement` is supported. Attempting to attach complex HTML via a `<template>` tag to a `Marker3DElement` will also fail; it strictly supports raw images, SVGs, or simple geometry (Section 11. The Engine Constraint).

### ### References

*   https://developers.google.com/maps/documentation/javascript/3d/camera-position
*   https://developers.google.com/maps/documentation/javascript/reference/3d-map#Map3DElement.center
*   https://developers.google.com/maps/documentation/javascript/reference/3d-map#Map3DElement.cameraPosition

## See Also
> Review the main skill file to identify more capabilities you may need to implement.