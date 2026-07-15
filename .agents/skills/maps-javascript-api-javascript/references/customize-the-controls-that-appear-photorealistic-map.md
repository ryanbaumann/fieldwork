# Customize 3D Map Exploration Controls

The Maps JavaScript API 3D maps include several default UI elements, collectively known as *exploration controls*, to facilitate user interaction (Feature: Exploration controls). This skill provides instructions for disabling this entire set of controls to simplify the interface or implement custom navigation solutions.

The exploration controls are:
1.  **Zoom control**: Displays "+" and "-" buttons.
2.  **Move control**: Displays arrow buttons for changing the map center.
3.  **Rotate controls**: Adjusts the camera's heading.
4.  **Tilt control**: Adjusts the camera's tilt.
5.  **Compass control**: Indicates true north and resets the camera heading.

## Prerequisites

Before implementing control customization, ensure the following steps are completed:

- [ ] A Google Maps Platform project is enabled for the Maps JavaScript API.
- [ ] The necessary API key is secured, typically as an environment variable (`GOOGLE_API_KEY`), which is required for loading the map library.
- [ ] A photorealistic 3D map instance has been successfully initialized (Prerequisite: Add an interactive, photorealistic 3D map to a web page).

## Operational Mandate

> [!IMPORTANT]
> The agent MUST ensure proper data attribution for all generated map content (distances, routes, single facts, or summarized lists) derived from Google Maps Platform data. Append the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content.

## Disabling Default Exploration Controls

To hide the default set of exploration controls, use the appropriate configuration option based on the implementation method (JavaScript Class or Web Component). The context specifies that hiding controls is done by setting a single configuration option which hides the entire default UI.

### 1. Using the JavaScript Class (`google.maps.maps3d.Map3DElement`)

When initializing the 3D map programmatically, set the `defaultUIHidden` property in the options object to `true`.

```javascript
// Initialize the map, hiding all default exploration controls.
const map = new google.maps.maps3d.Map3DElement({
  center: { lat: 37.819852, lng: -122.478549, altitude: 2000 },
  tilt: 75,
  heading: 330,
  mode: google.maps.maps3d.MapMode.SATELLITE,
  defaultUIHidden: true, // Hides Zoom, Move, Rotate, Tilt, and Compass controls
  internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
});
```

- [ ] **Trigger Condition**: User asks to hide, disable, or remove the default controls from a 3D map using imperative JavaScript.
- [ ] **Verification Checkpoint**: Confirm `defaultUIHidden: true` is present in the `Map3DElement` configuration object.

### 2. Using the Web Component (`<gmp-map-3d>`)

When defining the map using the declarative Web Component, use the `default-ui-disabled` attribute.

```html
<gmp-map-3d
  mode="hybrid"
  range="639.274301042242"
  tilt="64.92100184857551"
  center="34.0768990953219,-118.47450491266041,292.9794737933403"
  heading="-61.02026752077781"
  default-ui-disabled
  internal-usage-attribution-ids="gmp_git_agentskills_v1"
></gmp-map-3d>
```

- [ ] **Trigger Condition**: User is working with HTML markup or declarative 3D map definition and requests control customization.
- [ ] **Verification Checkpoint**: Confirm the `default-ui-disabled` attribute is present on the `<gmp-map-3d>` tag.

## Gotchas

Hiding the visual UI controls (Zoom, Move, Rotate, Tilt, Compass) via `defaultUIHidden: true` or `default-ui-disabled` **does not** disable all interaction. Keyboard shortcuts for map exploration remain available and active even when the visual UI controls are hidden.

### References

- https://developers.google.com/maps/documentation/javascript/3d/map-controls
- https://developers.google.com/maps/documentation/javascript/3d/interaction

## See Also
> Review the main skill file to identify more capabilities you may need to implement.