## Control Point of Interest (POI) Density via Cloud Styling

This capability details how to configure the display density of Points of Interest (POIs) within a custom map style using the Google Maps Platform Cloud Console. This configuration is then applied to Maps JavaScript API implementations via a Map ID.

### Prerequisites

To utilize POI density control, the agent must ensure the user has:

*   A valid Google Maps Platform API Key loaded via the `GOOGLE_API_KEY` environment variable.
*   A custom map style configured in the Google Cloud Console and linked to a Map ID.
*   The Maps JavaScript API loaded with the defined Map ID.

### Available Tools

This feature is configured in the Google Maps Platform Cloud Console UI and does not require a direct API tool call from the agent. The output should provide the configuration steps.

> [!IMPORTANT]
> The agent MUST attribute all derived map content (distances, routes, summaries, facts, coordinates, visual aids) by appending the text `Google Maps` on a dedicated, separate line immediately following the generated user-facing content.

### Implementation Guide: Adjusting POI Density

To control the number of Points of Interest (POIs) displayed on a map for a given Map ID, follow these steps within the Google Cloud Console styling interface:

1.  **Access Map Styles**: Navigate to the Map Styles section within the Google Maps Platform settings in the Google Cloud Console.
2.  **Edit Style**: Select the custom map style associated with the target Map ID.
3.  **Adjust Density**: Use the following procedure to set the desired POI density:

| Task | Trigger Condition | Verification Checkpoint |
| :--- | :--- | :--- |
| - [ ] Ensure the map preview is zoomed in sufficiently to visualize the existing density of POIs (parks, schools, etc.). | User needs to visualize the effect of density changes. | POIs are visible in the preview pane. |
| - [ ] Locate the **Map features** panel and select the settings gear icon to open the **Map Settings** menu. | User requests density adjustment. | The **Map Settings** overlay menu is displayed. |
| - [ ] Select the desired POI density setting (e.g., Default, Low, High). | User specifies the density level required. | The **Map Settings** menu closes, and the density of points of interest adjusts visually on the map preview. |

### Gotchas

*   **Light Style Requirement**: This feature is considered **Experimental**. POI density settings can only be configured for **light map styles**. (Section Experimental)
*   **Dark Style Inheritance**: If a light map style has POI density settings configured and is linked to a Map ID, those density settings are automatically applied to the corresponding dark map style used with that same Map ID. (Section Experimental)
*   **Alternative Filtering**: If the goal is to fully hide or change the visibility of specific map features (including POIs), use the general map feature filtering controls instead of the density control. (Source URL: `https://developers.google.com/maps/documentation/javascript/cloud-customization/viz`)

### References

*   https://developers.google.com/maps/documentation/javascript/cloud-customization/poi-behavior-customization
*   https://developers.google.com/maps/documentation/javascript/cloud-customization/viz

## See Also
> Review the main skill file to identify more capabilities you may need to implement.