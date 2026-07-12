The `Map3DElement` allows developers to finely tune how users interact with the photorealistic 3D map by controlling geographical boundaries, camera restrictions, and input gestures.

## Prerequisites

To implement 3D map interaction controls, ensure the following steps are completed:

1.  **API Key**: A valid Google Maps Platform API key must be configured in the execution environment. This is typically loaded via the map bootstrap script.
2.  **Library Loading**: The `maps3d` library must be imported when initializing the map.

```javascript
// Ensure GOOGLE_API_KEY is available in your environment
(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})(
    { key: "YOUR_API_KEY_HERE" } // Replace with actual key
);
// Import library dynamically
const { Map3DElement } = await google.maps.importLibrary('maps3d');
```

> [!IMPORTANT]
> The Agent MUST attribute ALL derived map content (distances, routes, facts, or summarized locations) by appending 'Google Maps' on a dedicated, separate line immediately following the user-facing output.

## 1. Controlling User Interactions

The primary method for controlling user interaction is by setting configuration properties in the options object passed to the `Map3DElement` constructor.

### 1.1 Restrict Geographic Bounds

Use the `bounds` option to limit the camera's geographical movement, preventing users from panning outside the specified rectangular area.

| Capability | Trigger Condition | Verification Checkpoint |
| :--- | :--- | :--- |
| Restrict Map Panning | User requests geographical boundary limits or restricted movement. | Map cannot be dragged outside the specified `bounds`. |

**Implementation:**

The `bounds` property accepts a `LatLngBoundsLiteral` object defining the restricted area.

```javascript
async function initMapWithBounds() {
    const { Map3DElement } = await google.maps.importLibrary('maps3d');

    const map = new Map3DElement({
        center: { lat: -36.86, lng: 174.76, altitude: 10000 },
        tilt: 67.5,
        mode: 'HYBRID',
        // Restricts movement to this area (example uses coordinates for New Zealand region)
        bounds: { south: -48.3, west: 163.56, north: -32.86, east: -180 },
        gestureHandling: 'COOPERATIVE',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    });

    document.body.append(map);
}
```

### 1.2 Restrict Camera View

Use properties like `minAltitude`, `maxAltitude`, `minTilt`, `maxTilt`, `minHeading`, and `maxHeading` to constrain the perspective and elevation of the camera.

| Capability | Trigger Condition | Verification Checkpoint |
| :--- | :--- | :--- |
| Constrain Altitude | User asks to set minimum or maximum viewing height. | Map altitude remains between `minAltitude` and `maxAltitude` meters. |
| Constrain Tilt/Heading | User asks to limit the viewing angle or rotation. | Map tilt/heading remains within the specified min/max values. |

**Implementation (Camera Restrictions):**

```javascript
async function initMapWithCameraRestrictions() {
  const { Map3DElement, MapMode } = await google.maps.importLibrary("maps3d");

  const map = new Map3DElement({
    center: { lat: 37.7704, lng: -122.3985, altitude: 500 },
    tilt: 67.5,
    mode: MapMode.HYBRID,
    // Altitude limits in meters
    minAltitude: 1,
    maxAltitude: 1000,
    // Tilt limits in degrees
    minTilt: 35,
    maxTilt: 55,
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
  });

 document.body.append(map);
}
```

### 1.3 Control Gesture Handling (Scrolling/Zooming)

The `gestureHandling` option controls how user input, particularly scrolling, affects the map view. This is crucial for embedding maps within scrollable web pages.

| Value | Behavior | Description |
| :--- | :--- | :--- |
| `'COOPERATIVE'` | Allows page scrolling without impacting map. Map zoom requires controls, two-finger touch, or `CMD/CTRL` + scroll. | Use when the map is embedded in a long, scrollable page. |
| `'GREEDY'` | Reacts to all scroll events and touch gestures, potentially hijacking page scroll. | Use for maps where the map is the primary content. |
| `'AUTO'` | Defaults to `'COOPERATIVE'` if in an `<iframe>`, otherwise defaults to `'GREEDY'`. | General purpose setting that adapts based on context. |

**Implementation (Cooperative Gesture Handling):**

```javascript
new Map3DElement({
  center: { lat: 37.729901343702736, lng: -119.63788444355905, altitude: 1500 },
  tilt: 70,
  heading: 50,
  range: 4000,
  gestureHandling: 'COOPERATIVE', // Recommended for scrollable web pages
  internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
});
```

## Gotchas

*   When simultaneously restricting both geographical boundaries (`bounds`) and camera constraints (e.g., `maxAltitude`), both sets of rules are enforced strictly. Ensure the center point provided is compatible with all restrictions.
*   If using `gestureHandling: 'AUTO'`, the behavior is determined by the embedding context. If the map is contained within an `<iframe>`, it will automatically switch to the less disruptive `'COOPERATIVE'` mode, regardless of whether the surrounding page is scrollable or not.

### References

*   https://developers.google.com/maps/documentation/javascript/3d/interaction

## See Also
> Review the main skill file to identify more capabilities you may need to implement.