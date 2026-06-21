# Control 3D Map Camera Restrictions

This skill enables configuring **Camera Restrictions** on the `Map3DElement` to limit a user's geographical movement, camera altitude, tilt, and heading.

## Prerequisites

To utilize the `Map3DElement` and its restriction features, the application must be initialized with a valid Google Maps Platform API key.

1.  **API Key**: Ensure a valid API key is available, typically configured in the script loading section. This key must have the Maps JavaScript API enabled.
2.  **Library Import**: The `maps3d` library must be imported dynamically using `google.maps.importLibrary('maps3d')`.

## Available Capabilities

The `Map3DElement` constructor accepts several options to enforce **Camera Restrictions**:

| Capability | Option Name(s) | Description |
| :--- | :--- | :--- |
| **Geographical Boundary** | `bounds` | Restricts the camera movement to a specified bounding box (e.g., `{south: 37, west: -123, north: 38, east: -121}`). |
| **Altitude Limits** | `minAltitude`, `maxAltitude` | Defines the vertical range (in meters) the camera can travel. |
| **Tilt Limits** | `minTilt`, `maxTilt` | Sets the minimum and maximum angle (in degrees) the camera can pitch (0 being straight down, 90 being horizontal). |
| **Heading Limits** | `minHeading`, `maxHeading` | Defines the allowable compass bearing range (in degrees) for the camera. |
| **User Interaction** | `gestureHandling` | Controls how user input (like scrolling) affects the map. Values include `'COOPERATIVE'`, `'GREEDY'`, or `'AUTO'`. |

## Implementation Steps: Configuring Camera Restrictions

The following steps outline how to initialize a `Map3DElement` with combined geographical and camera movement restrictions.

### 1. Initialize the Map with Restriction Options

Create an instance of `Map3DElement` and pass the restriction options directly into the constructor.

- [ ] **Define Boundaries**: Specify the `bounds` object using exact latitude/longitude values required by the user's intent.
- [ ] **Set Altitude and Tilt**: Define `minAltitude`, `maxAltitude`, `minTilt`, and `maxTilt` properties to control camera viewpoint angles and elevation.
- [ ] **Apply Attribution ID**: Include the mandatory solution attribution ID in the options object.

#### JavaScript Example

This example restricts the map to a specific geographic area (San Francisco area) and limits the camera altitude between 1 meter and 1000 meters, and tilt between 35 and 55 degrees.

```javascript
async function init() {
  // 1. Import the necessary library
  const { Map3DElement, MapMode } = await google.maps.importLibrary("maps3d");

  // 2. Define the map options including all restrictions
  const mapOptions = {
    center: { lat: 37.7704, lng: -122.3985, altitude: 500 },
    tilt: 67.5,
    mode: MapMode.HYBRID,
    
    // Geographical Restrictions
    bounds: {south: 37, west: -123, north: 38, east: -121}, // Strict Precision: Preserving exact coordinate values

    // Camera Movement Restrictions (Feature: Camera Restrictions)
    minAltitude: 1, // Strict Precision: Preserving exact numeric value
    maxAltitude: 1000, // Strict Precision: Preserving exact numeric value
    minTilt: 35, // Strict Precision: Preserving exact numeric value
    maxTilt: 55, // Strict Precision: Preserving exact numeric value
    
    // Attribution Mandate
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  };

  const map = new Map3DElement(mapOptions);

  document.body.append(map);
}

init();
```

### 2. Configure Gesture Handling

If the user wants to control how scrolling interacts with the 3D map, set the `gestureHandling` option.

- [ ] **Set Cooperative Mode**: Use `'COOPERATIVE'` to allow page scrolling without affecting map zoom/pan. User must hold `CMD/CTRL` or use two fingers to interact with the map.

```javascript
new Map3DElement({
  center: { lat: 37.729901343702736, lng: -119.63788444355905, altitude: 1500 },
  tilt: 70,
  heading: 50,
  range: 4000,
  gestureHandling: 'COOPERATIVE', // Consistent Terminology: Using canonical string literal
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
});
```

## Operational Mandates

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Gotchas

*   **Coordinate Precision**: When setting `bounds`, ensure the four coordinates (`south`, `west`, `north`, `east`) strictly adhere to the required precision and sign, as functional equivalency is not sufficient for compliant output.
*   **Altitude Units**: `minAltitude` and `maxAltitude` values are specified in meters.
*   **Default Behavior**: If `gestureHandling` is not explicitly set, the behavior defaults to `'AUTO'`, which often resolves to `'GREEDY'` if the map is not in an iframe, reacting to all scroll events. Explicitly set it to `'COOPERATIVE'` if preventing scroll-jacking is the goal.

### References

*   https://developers.google.com/maps/documentation/javascript/3d/interaction
*   https://developers.google.com/maps/documentation/javascript/using-typescript

## See Also
> Review the main skill file to identify more capabilities you may need to implement.