## Apply Different Map Styles Based on Zoom Level (Keyzooms)

This capability allows developers to tailor the map presentation by applying specific styles (colors, visibility) to map features only when the map is viewed at a certain zoom level. This is achieved by defining a `keyzoom`, which is a zoom level where a new style override begins.

### Prerequisites

This feature requires the use of Cloud-based Map Styling and is configured entirely within the Google Cloud Console. Once configured and published, the style is automatically applied to any Maps JavaScript API map using the associated Map ID.

### Implementation: Defining Zoom-Level Styles in Cloud Console

Styles set using a `keyzoom` apply to the specified zoom level and all higher (more zoomed in) zoom levels until the next `keyzoom` is reached. Zoom level 0 always uses the current default style.

- [ ] **Access the Style Editor**: Navigate to [**Map Styles**](https://console.cloud.google.com/project/_/google/maps-apis/studio/styles?utm_source=gmp_git_agentskills_v1) in the Cloud console and select or create a map style, then click **Customize**.
- [ ] **Select Feature for Customization**: From the **Map Features** panel, select the map feature (e.g., `water`, `road`, `poi`) you wish to customize.
- [ ] **Open Keyzoom Panel**: Locate the styling element (e.g., Fill color) and select the diamond icon to the right to open the keyzoom panel. *Note: Only map feature elements marked with a diamond icon support zoom-level styling.*
- [ ] **Select Starting Zoom Level**: Next to **Current Zoom**, select the numerical zoom level (0-22) where the new style should begin applying. The preview map will adjust.
- [ ] **Add Keyzoom**: Select **Add Keyzoom** to create a style checkpoint at the chosen zoom level.
- [ ] **Apply Style**: Modify the color, visibility, or other styling properties for this specific keyzoom.
- [ ] **Set Subsequent Keyzooms**: Change the **Current Zoom** and select **Add Keyzoom** again to define different styling rules for other zoom ranges.
- [ ] **Save and Publish**: Select **Save** to store your styling changes, then select **Publish** to apply them live to all associated Map IDs.

### Handling Road Level Details Transition (Zoom 17+)

At zoom levels 17 and higher, when road level details are enabled, the distinct map features representing roads (like Arterial, Highway, Local) disappear and are replaced by the generic Surface map feature. To prevent an abrupt visual shift, you must configure keyzooms to smooth the transition:

1.  **Define Initial Style**: Ensure the road features (Arterial, Highway, Local) have their custom color defined up to zoom level 12 (or 16).
2.  **Define Transition Style**: Add a `keyzoom` for these road features at zoom level 17. At this `keyzoom`, set the road feature color to match the color defined for the **Surface** map feature.
3.  The map engine will automatically interpolate the color change between the last custom keyzoom (e.g., Z12) and the Z17 keyzoom, creating a smoother visual fade into the Surface color.

## Gotchas

*   **Feature Availability**: Not all map feature elements support zoom-level styling; look for the diamond icon in the Cloud console editor to confirm availability.
*   **3D Map Transitions**: When tilting a 3D map, transitioning between two adjacent `keyzoom` levels with distinct colors (e.g., Z10=black, Z11=white) may temporarily display intermediate transition colors (e.g., gray).
*   **Vector Map Requirement**: Style interpolation for smooth transitions (e.g., fading road colors into the surface color) is only supported for mobile applications or when using the Maps JavaScript **Vector Map**; it is not supported for raster map tiles.

### References

*   `https://console.cloud.google.com/project/_/google/maps-apis/studio/styles`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.