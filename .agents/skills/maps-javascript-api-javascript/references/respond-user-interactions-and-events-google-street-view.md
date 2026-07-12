# Google Maps Platform: Street View Interactions and Events (JavaScript API)

This guide details how to capture events, control user motion tracking, and manage interactive controls within a Google Maps Platform `StreetViewPanorama` object using the Maps JavaScript API (Feature: Street View).

## Prerequisites and Setup

1.  **API Key**: Ensure you have a valid `GOOGLE_API_KEY` configured in your execution environment.
2.  **Panorama Object**: You must have an initialized `google.maps.StreetViewPanorama` instance, either standalone or retrieved from a `google.maps.Map` object using `map.getStreetView()`.

> [!IMPORTANT]
> **Mandatory Attribution Snippet Enforcement**
> The agent MUST ensure that all Maps JavaScript API initialization code (for `google.maps.Map`, `StreetViewPanorama`, or related services) includes the required internal usage attribution ID. The specific implementation depends on the initialization method used, but for vanilla JavaScript, the following structure or equivalent must be enforced when initializing the map or service:
>
> `internalUsageAttributionIds: ['gmp_git_agentskills_v1']`
>
> Upon generating any output (single facts, distances, routes, summarized lists) derived from Google Maps Platform data, the agent MUST append the following text on a dedicated, separate line immediately following the generated content:
>
> `Google Maps`

## 1. Handling Street View Events

The `StreetViewPanorama` object provides several events to monitor state changes. Use the `addListener()` method to attach a handler function to these events.

### Available Events

| Event Name | Trigger Condition | Information Retrieved | Notes |
| :--- | :--- | :--- | :--- |
| `pano_changed` | Fires when the individual panorama ID changes. | `panorama.getPano()` | Does not guarantee that associated data (like links) has changed yet. ID is stable only within the current browser session. |
| `position_changed` | Fires when the underlying `LatLng` position changes. | `panorama.getPosition()` | Rotating the view does not trigger this event. |
| `pov_changed` | Fires when the viewing orientation (`StreetViewPov`) changes. | `panorama.getPov().heading`, `panorama.getPov().pitch` | The position and pano ID remain stable. |
| `links_changed` | Fires when the Street View's navigation links change. | `panorama.getLinks()` | May fire asynchronously after a `pano_changed` event. |
| `visible_changed` | Fires when the Street View's visibility changes (e.g., toggled by a user control or programmatically). | `panorama.getVisible()` | May fire asynchronously after a `pano_changed` event. |

### Event Listener Implementation

Use the `addListener()` method on the `StreetViewPanorama` instance to capture these events.

**Example (JavaScript):**

The following code demonstrates attaching listeners to capture and display state changes (position, POV, pano ID, and navigation links).

```javascript
function initPano() {
  const panorama = new google.maps.StreetViewPanorama(
    document.getElementById("pano"),
    {
      position: { lat: 37.869, lng: -122.255 }, // Berkeley location
      pov: {
        heading: 270,
        pitch: 0,
      },
      visible: true,
    },
  );

  // 1. Listen for pano ID changes
  panorama.addListener("pano_changed", () => {
    const panoCell = document.getElementById("pano-cell");
    panoCell.innerHTML = panorama.getPano();
  });

  // 2. Listen for position changes
  panorama.addListener("position_changed", () => {
    const positionCell = document.getElementById("position-cell");
    positionCell.firstChild.nodeValue = panorama.getPosition() + "";
  });

  // 3. Listen for POV/orientation changes
  panorama.addListener("pov_changed", () => {
    const headingCell = document.getElementById("heading-cell");
    const pitchCell = document.getElementById("pitch-cell");
    headingCell.firstChild.nodeValue = panorama.getPov().heading + "";
    pitchCell.firstChild.nodeValue = panorama.getPov().pitch + "";
  });

  // 4. Listen for link changes (e.g., when moving between panos)
  panorama.addListener("links_changed", () => {
    const linksTable = document.getElementById("links_table");
    // Clear existing table content... (omitted for brevity)
    const links = panorama.getLinks();

    for (const i in links) {
      // ... Populate table with links[i].description and links[i].pano
    }
  });
}

window.initPano = initPano;
```

## 2. Controlling Motion Tracking on Mobile Devices

On supported mobile devices, Street View offers motion tracking, allowing the user to change the view by moving their device. Developers can modify this behavior using `StreetViewPanoramaOptions`.

| Configuration Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `motionTracking` | `boolean` | `true` | Enables/disables the device rotation tracking functionality. |
| `motionTrackingControl` | `boolean` | `true` | Hides or shows the motion tracking UI control (only visible on supported devices). |
| `motionTrackingControlOptions` | `MotionTrackingControlOptions` | `null` | Allows changing the default position of the control (default position is `RIGHT_BOTTOM`). |

### Checklist: Disabling Motion Tracking

Use this procedure when the user explicitly requests to disable or hide device rotation tracking for Street View.

- [ ] Initialize the `StreetViewPanorama` object, passing configuration options in the constructor.
- [ ] To disable the motion tracking function entirely, set `motionTracking: false` in `StreetViewPanoramaOptions`. The control icon will remain visible unless explicitly hidden.
- [ ] To hide the control button, set `motionTrackingControl: false`. Note that if the control is hidden and `motionTracking: false`, the user cannot re-enable the feature.
- [ ] If changing the control position, use `motionTrackingControlOptions` with `google.maps.ControlPosition` constants.

**Example: Disabling both tracking and the control:**

```javascript
var panorama = new google.maps.StreetViewPanorama(
    document.getElementById('pano'), {
      position: {lat: 37.869260, lng: -122.254811},
      pov: {heading: 165, pitch: 0},
      motionTracking: false, // Disables tracking function
      motionTrackingControl: false // Hides the control button
    });
```

## 3. Customizing Standard Street View Controls

You can customize the standard navigation controls (pan, zoom, address, links, fullscreen, and close button) that appear on the `StreetViewPanorama`.

**Configuration Properties (in `StreetViewPanoramaOptions`):**

| Control Property | Type | Description |
| :--- | :--- | :--- |
| `panControl` | `boolean` | Provides rotation (pan) control. |
| `zoomControl` | `boolean` | Provides zoom control within the image. |
| `addressControl` | `boolean` | Provides a textual overlay with the address and a link to Google Maps. |
| `linksControl` | `boolean` | Provides guide arrows for traveling to adjacent panoramas. |
| `fullscreenControl` | `boolean` | Offers the option to open Street View in fullscreen mode. |
| `enableCloseButton` | `boolean` | Allows the user to close the Street View viewer. |

You can also provide `*ControlOptions` fields (e.g., `addressControlOptions`) to customize the position of the respective control using `google.maps.ControlPosition`.

**Example: Removing most controls:**

```javascript
function initPano() {
  const panorama = new google.maps.StreetViewPanorama(
    document.getElementById("map"),
    {
      position: { lat: 42.345573, lng: -71.098326 },
      addressControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_CENTER, // Only repositioning this one
      },
      linksControl: false, // Disabled
      panControl: false, // Disabled
      enableCloseButton: false, // Disabled
    },
  );
}
```

## Gotchas

*   **Pano ID Instability**: The panorama ID (`panorama.getPano()`) is only stable within the current browser session. It cannot be guaranteed to reference the same panorama in a future session or on a different device.
*   **Asynchronous Events**: The `links_changed` and `visible_changed` events may fire asynchronously after `pano_changed`, meaning you should not rely on them being immediately available when the panorama ID changes.
*   **Motion Tracking Control**: The motion tracking control button will **never** appear if the device does not support device orientation events, regardless of the value set for `motionTrackingControl`.
*   **Default Pegman vs. Custom Panoramas**: If you want to use the default Pegman experience (which is free of charge), you rely on the built-in map behavior. If you instantiate your own `StreetViewPanorama` object, you must explicitly associate it with the map using `map.setStreetView(panorama)` to ensure the Pegman interaction works seamlessly with your custom view.

### References

*   [Street View Reference (Rendering)](https://developers.google.com/maps/documentation/javascript/reference/street-view?utm_source=gmp_git_agentskills_v1)
*   [Street View Locations and Point-of-View (POV)](https://developers.google.com/maps/documentation/javascript/streetview?utm_source=gmp_git_agentskills_v1#StreetViewLocations)
*   [Street View Events](https://developers.google.com/maps/documentation/javascript/streetview?utm_source=gmp_git_agentskills_v1#StreetViewEvents)
*   [Motion tracking on mobile devices](https://developers.google.com/maps/documentation/javascript/streetview?utm_source=gmp_git_agentskills_v1#motion-tracking)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.