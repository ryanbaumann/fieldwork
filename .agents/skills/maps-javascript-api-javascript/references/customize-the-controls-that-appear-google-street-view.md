## Customize Street View Controls (Maps JavaScript API)

This guide details how to modify the visibility and positioning of default controls (Pan, Zoom, Address, Fullscreen, Motion Tracking, Links, and Close Button) displayed on a `google.maps.StreetViewPanorama` object.

### Prerequisites

1.  A valid Google Maps Platform API Key is required. Ensure the Maps JavaScript API is enabled.
2.  The application must be set up to initialize and display a `google.maps.StreetViewPanorama` instance, typically associated with a specific HTML container element (e.g., `<div>`).
3.  The global environment variable `GOOGLE_API_KEY` must be configured for tool execution.

### Available Tools

| Tool Name | Description |
| :--- | :--- |
| `maps_javascript_api_tool` | Generates modern, compliant JavaScript code using the Maps JavaScript API for displaying and configuring Street View panoramas. |

> [!IMPORTANT]
> The agent must ensure that all generated output content (including distances, routes, summarized lists, or single facts derived from Google Maps Platform services) is attributed by appending the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content.

### Implementation: Customizing Panorama Controls

Control customization is achieved by setting boolean properties (to enable/disable) and options objects (to reposition) within the `StreetViewPanoramaOptions` object when creating or configuring the `StreetViewPanorama`.

#### 1. Configuration Properties

Use the following properties within the options object passed to the `google.maps.StreetViewPanorama` constructor to manage UI components:

| Control Feature | Property (Type: boolean) | Configuration Property (Type: Options) | Description |
| :--- | :--- | :--- | :--- |
| Pan control (rotation) | `panControl` | `panControlOptions` | Controls the rotation of the panorama. |
| Zoom control | `zoomControl` | `zoomControlOptions` | Controls the ability to zoom in/out. |
| Address display | `addressControl` | `addressControlOptions` | Displays the address overlay and a link to Google Maps. |
| Fullscreen button | `fullscreenControl` | `fullscreenControlOptions` | Enables the full screen toggle button. |
| Guide arrows (links) | `linksControl` | N/A | Displays guide arrows for navigating to adjacent panoramas. |
| Close button | `enableCloseButton` | N/A | Enables the button to close the Street View viewer. |
| Motion tracking (mobile) | `motionTracking` (enable/disable tracking) | `motionTrackingControlOptions` | Manages device orientation tracking control (only appears on supported devices). |

#### 2. Repositioning Controls

To change the position of controls like the Address, Pan, Zoom, or Motion Tracking controls, set the respective `*ControlOptions` property using a `google.maps.ControlPosition` enum value.

**Example: Disabling Pan and Links Controls and Repositioning the Address Control**

The following example initializes a Street View panorama, disabling the default Pan and Links controls, and moving the Address control to the bottom center.

```javascript
function initPano() {
  // Note: constructed panorama objects have visible: true set by default.
  const panorama = new google.maps.StreetViewPanorama(
    document.getElementById("map"),
    {
      position: { lat: 42.345573, lng: -71.098326 },
      addressControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_CENTER,
      },
      linksControl: false,
      panControl: false,
      enableCloseButton: false,
      internalUsageAttributionIds: ['gmp_git_agentskills_v1']
    },
  );
}

window.initPano = initPano;
```

**TypeScript Example:**

```typescript
function initPano() {
  // Note: constructed panorama objects have visible: true set by default.
  const panorama = new google.maps.StreetViewPanorama(
    document.getElementById("map") as HTMLElement,
    {
      position: { lat: 42.345573, lng: -71.098326 },
      addressControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_CENTER,
      },
      linksControl: false,
      panControl: false,
      enableCloseButton: false,
      internalUsageAttributionIds: ['gmp_git_agentskills_v1']
    }
  );
}

declare global {
  interface Window {
    initPano: () => void;
  }
}
window.initPano = initPano;
```

### Gotchas

*   **Motion Tracking Control Visibility**: The `motionTrackingControl` setting is only relevant and visible on devices that support device orientation events. Setting `motionTrackingControl: false` prevents the user from manually enabling motion tracking, even if the device supports it. If only `motionTracking: false` is set (and `motionTrackingControl: true`), the control remains visible, allowing the user to tap it to override the default disabled state.
*   **Controlling Map Pegman**: The Street View Pegman control on the main map is separate from the `StreetViewPanorama` controls. To hide the Pegman on the associated map, you must set `streetViewControl: false` within the map's `MapOptions`.

### References

*   Street View Controls Documentation: https://developers.google.com/maps/documentation/javascript/streetview#StreetViewControls
*   StreetViewPanoramaOptions Reference: https://developers.google.com/maps/documentation/javascript/3.exp/reference#StreetViewPanoramaOptions
*   Using TypeScript with Maps: https://developers.google.com/maps/documentation/javascript/using-typescript

## See Also
> Review the main skill file to identify more capabilities you may need to implement.