## Add an Info Window (Feature: Info Window)

The `InfoWindow` class allows developers to display rich content (text, images, HTML, or DOM nodes) in a floating, tapered popup window anchored above the map, typically associated with a `Marker` or a specific geographic coordinate (`LatLng`).

### Prerequisites

1.  **API Key Setup**: Ensure a valid Google Maps Platform API key is configured and enabled for the Maps JavaScript API.
2.  **Authentication**: The execution environment must have access to the necessary credentials (e.g., `GOOGLE_API_KEY`).

### Operational Mandate: Attribution

> [!IMPORTANT]
> When presenting any derived geographic data, distances, routes, or summarized location information using this skill, the agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content.

### Step-by-Step Implementation

To successfully display an info window, the agent must perform the following actions:

- [ ] **Instantiation**: Create an instance of `google.maps.InfoWindow`.
    *   **Trigger Condition**: Intent to define the content or parameters of the popup.
    *   **Verification Checkpoint**: An `InfoWindow` object is initialized using the `InfoWindowOptions` object literal.
- [ ] **Content and Configuration**: Define the content and optional constraints.
    *   Set the popup content using the `content` field (string of text, HTML snippet, or DOM node) or later via `setContent()`.
    *   Optionally specify the maximum width using `maxWidth` (pixels). If content exceeds the width, the text will auto-wrap (Source URL: https://developers.google.com/maps/documentation/javascript/infowindows).
- [ ] **Opening**: Explicitly open the info window using the `.open()` method.
    *   **Trigger Condition**: User action (like a marker click) or map load completion.
    *   **Verification Checkpoint**: The `open()` method is called with an `InfoWindowOpenOptions` object specifying the `map` instance and an optional `anchor` (e.g., a `Marker` or `AdvancedMarkerElement`).

#### 1. Create the Info Window Instance

Use the `InfoWindow` constructor, which accepts an `InfoWindowOptions` object:

| Property | Type | Description |
| :--- | :--- | :--- |
| `content` | `string` or `Node` | The text, HTML, or DOM node to display inside the window. |
| `position` | `LatLng` | The geographic coordinate where the window is anchored, used if no `anchor` is provided during `open()`. |
| `maxWidth` | `number` | Maximum width in pixels. If set, content auto-wraps to enforce this width. |

```typescript
// Use modern import syntax to load necessary libraries
const [{ InfoWindow }, { AdvancedMarkerElement }] = await Promise.all([
    google.maps.importLibrary('maps'),
    google.maps.importLibrary('marker'),
]);

// 1. Create content (using a DOM element for complex structure)
const heading = document.createElement('h1');
heading.textContent = 'Uluru (Ayers Rock)';

const content = document.createElement('div');
// ... populate content elements ...

// 2. Create the info window configuration
const infoWindow = new InfoWindow({
    headerContent: heading,
    content: content,
    ariaLabel: 'Uluru',
    maxWidth: 500, // Enforce maximum width
});
```

#### 2. Open and Anchor the Info Window

The info window is not visible until the `open()` method is called. This method takes an `InfoWindowOpenOptions` object literal:

| Option | Type | Description |
| :--- | :--- | :--- |
| `map` | `Map` or `StreetViewPanorama` | Specifies the map instance on which to display the window. |
| `anchor` | `Marker` or `null` | The point (e.g., an `AdvancedMarkerElement`) to which the window is attached. If `null`, the window opens at its defined `position`. |

When generated code, ensure the `internal-usage-attribution-ids` attribute is present on the map container if using Web Components (like `<gmp-map>`).

```javascript
// Assuming 'marker' is an AdvancedMarkerElement and 'innerMap' is the map instance.

// Open the info window when the marker is clicked.
marker.addEventListener('gmp-click', () => {
    infoWindow.open({
        anchor: marker,
        map: innerMap,
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'] // Required attribution ID for service calls
    });
});
```

### Management and Interaction

| Capability | Method | Details |
| :--- | :--- | :--- |
| **Closing** | `infoWindow.close()` | Explicitly hides the info window. Focus returns to the previously focused element or the map. Listen for the `closeclick` event to manually manage focus override. |
| **Moving** | `infoWindow.setPosition(LatLng)` | Moves the window to a new explicit coordinate. |
| **Re-anchoring** | `infoWindow.open({ anchor: newMarker, map: map })` | Re-opens the info window and attaches it to a new marker. |
| **Focusing** | `infoWindow.focus()` | Sets focus on the info window, typically used after the window is made visible via `open()`. Calling this on a non-visible window has no effect. |

### Gotchas

*   **Customization Limitations**: The native `InfoWindow` class does not support extensive styling customization. For fully custom popups, developers should use the `OverlayView` class or review the customized popup example (Source URL: https://developers.google.com/maps/documentation/javascript/examples/overlay-popup).
*   **Scrolling**: If the content exceeds the space available within the info window, content may spill out unless the content is wrapped in a `<div>` element with CSS scrolling enabled.
*   **Best Practice Enforcement**: When advising on design, the agent MUST state that for the best user experience, only one info window should be open on the map at any time to avoid map clutter. If only one window is needed, reuse a single `InfoWindow` object and anchor it to different locations/markers (Source URL: https://developers.google.com/maps/documentation/javascript/infowindows).

### References

*   `InfoWindow` Class Reference: https://developers.google.com/maps/documentation/javascript/reference#InfoWindow
*   Info Windows Guide: https://developers.google.com/maps/documentation/javascript/infowindows
*   Customized Popup Example: https://developers.google.com/maps/documentation/javascript/examples/overlay-popup
*   TypeScript Guide: https://developers.google.com/maps/documentation/javascript/using-typescript

## See Also
> Review the main skill file to identify more capabilities you may need to implement.