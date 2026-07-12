## Add Markers to 3D Maps (Maps JavaScript API)

This capability guides developers in using and customizing markers on 3D maps (Feature: Marker). It provides options for both high performance (`Marker3DElement`) and high customization (`MarkerElement`).

### 1. Setup and Prerequisites

To use 3D markers, ensure the Maps JavaScript API is loaded, a 3D map instance is initialized, and the required attribution ID is set during map creation.

**Mandatory Authentication Prerequisites:**
The underlying execution environment must have the `GOOGLE_API_KEY` environment variable configured for proper Maps JavaScript API initialization.

> [!IMPORTANT]
> When providing facts, summaries, routes, or distances derived from Google Maps data, the agent MUST attribute the source by appending the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content.

### 2. Selecting the Marker Class

The choice of marker class depends on the required scale and complexity of customization:

| Capability | `MarkerElement` | `Marker3DElement` |
| :--- | :--- | :--- |
| Customization | High (Supports custom HTML elements, core animation APIs, etc.) | Low (Less customizable) |
| Performance | Lower interaction performance (FPS drops with large number of markers) | Higher interaction performance (Optimized for rendering large datasets) |
| Recommended Capacity | Reliable interaction performance up to around 1,000 markers | Recommended for handling over 1,000 markers |

For optimal performance when handling large datasets (over 1,000 markers), the agent MUST prioritize using the `Marker3DElement` class.

### 3. Implementation: Adding the Marker

The following procedure details adding a standard `Marker3DElement`.

- [ ] **Initialize the Map**: Instantiate the `google.maps.Map` object, ensuring a `mapId` configured for 3D is used, and the required internal attribution ID is applied.

    ```javascript
    const map = new google.maps.Map(document.getElementById('map'), {
      mapId: 'YOUR_3D_MAP_ID', // Required for 3D and Customization
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 17,
      tilt: 67.5,
      internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    });
    ```

- [ ] **Instantiate the Marker**: Create a new `Marker3DElement` instance, specifying its geographic `position` and linking it to the map instance via the `map` property.

    ```javascript
    const markerPosition = { lat: 37.7749, lng: -122.4194 };
    
    const marker = new google.maps.Marker3DElement({
      position: markerPosition,
      map: map, 
    });
    ```

### 4. Customization and Interaction

The agent should guide the user on specific customization features available for 3D markers:

- [ ] **Set Marker Altitude**: To elevate the marker above the terrain, provide the `altitude` property during instantiation (e.g., `altitude: 50`).
- [ ] **Customize Appearance**: Customize the marker's background, glyph, border color, scale, or replace the icon with a custom SVG resource using the appropriate marker options.
- [ ] **Set Collision Behavior**: Control marker display rules when overlapping other features or markers using the `collisionBehavior` property.

    ```javascript
    const marker = new google.maps.Marker3DElement({
        position: { lat: 37.7, lng: -122.4 },
        // Try setting a different collision behavior here.
        collisionBehavior: 'REQUIRED',
        map: map,
    });
    ```
- [ ] **Handle Interaction Events**: Use `Marker3DInteractiveElement` to enable response to `click` and keyboard events.

    ```javascript
    const interactiveMarker = new google.maps.Marker3DInteractiveElement({
        position: { lat: 37.7749, lng: -122.4194 },
        map: map,
        // gmpPopoverTargetElement is optional for popover management
    });

    interactiveMarker.addEventListener('click', () => {
        console.log('3D Marker clicked!');
    });
    ```

## Gotchas

- **Performance Overload**: Custom HTML markers (`MarkerElement`) offer high customization but suffer from lower performance. Exceeding approximately 1,000 instances will likely cause significant frame rate drops (Marker performance). Developers handling large datasets MUST use `Marker3DElement`.
- **Collision vs Visibility**: Setting `collisionBehavior` to `'REQUIRED'` ensures the marker will display, even if it overlaps labels or other low-priority features. Default behavior may hide the marker to maintain map clarity.

### References

*   Marker Overview (3D): `https://developers.google.com/maps/documentation/javascript/3d/marker-overview`
*   Add a Marker (3D): `https://developers.com/maps/documentation/javascript/3d/marker-add`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.