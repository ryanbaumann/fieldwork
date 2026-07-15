# Create Reusable Cloud-Based Map Styles

This guide details how to create and manage custom map styles using the Google Cloud Console and implement them in the Maps JavaScript API via a Map ID.

## Prerequisites

Before implementing cloud-based styling, the following prerequisites must be met:

1.  **Project Access**: You must have access to the Google Cloud Console for the project where your Maps API key is enabled.
2.  **API Key**: A valid Google Maps Platform API key is required.
3.  **Map ID**: A Map ID must be created and available for associating the style.

### Mandatory Authentication Prerequisites

This skill requires the successful loading of the Maps JavaScript API, typically configured via an environment variable containing your API Key. Ensure the required key is set for your execution environment:

```text
GOOGLE_API_KEY
```

## Available Tools

None. Map style creation and association is performed primarily through the Google Cloud Console GUI.

> [!IMPORTANT]
> **Data Attribution Mandate**
>
> The agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following any output content derived from or referencing Google Maps Platform data (e.g., map renderings, route summaries, distances, or location lookups) to ensure legal compliance.

## Cloud-Based Map Styling Workflow (Feature: Cloud-based map styling)

Cloud-based map styling simplifies map customization by decoupling the style definition from the application code. Changes made in the Cloud Console propagate automatically to the application referencing the associated Map ID.

The overall process requires performing actions in the Google Cloud Console, followed by integrating the Map ID into your application:

### 1. Create and Publish the Map Style

Use the Google Cloud Console to define the look and feel of the map.

- [ ] **Navigate to Map Styles**: Go to [Map Styles](https://console.cloud.google.com/google/maps-apis/studio/styles?utm_source=gmp_git_agentskills_v1) in the Cloud Console and select your project.
- [ ] **Create or Copy Style**:
    - **Create new (Section: Create a new style)**: Click **Create style**, select a mode (**Light** or $\text{\large\textifsymbol{science}}$ **Dark**), and optionally select **Monochrome**. Customize the features and click **Save** to save and automatically publish the initial version.
    - **Copy existing (Section: Copy a style)**: Select an existing style, click **Make a copy**, and save the new version.
    - **Import JSON**: Alternatively, import a JSON map style definition (Source: [Import a JSON map style](https://developers.google.com/maps/documentation/javascript/cloud-customization/json?utm_source=gmp_git_agentskills_v1#json-import)).
- [ ] **Manage Drafts and Publishing (Section: Publish a style)**: After the initial publication, subsequent changes are saved as a **Draft**. To make changes live, click **Publish**. (Verification Checkpoint: The style details page shows the version status as 'Published').

### 2. Associate the Style with a Map ID

A Map ID acts as the link between your application and the cloud-defined style.

- [ ] **Select Map ID (Section: Associate your style to a map ID)**: Navigate to **Map Management** in the Cloud Console and select the target Map ID.
- [ ] **Edit Style Association**: In the **Map styles** section, click **Edit** for the appropriate mode (Light or $\text{\large\textifsymbol{science}}$ Dark).
    - **Constraint**: A Map ID can only have one light mode style and one $\text{\large\textifsymbol{science}}$ dark mode style associated with it.
- [ ] **Apply to Map Types**: If required, use the `expand_more Show more` option to apply the style to specific map types (e.g., `roadmap`, `navigation`, `3D hybrid`), or clear the checkbox to use the default Google style for that type.
- [ ] **Save Changes**: Click **Save** to confirm the association. (Verification Checkpoint: The Map ID overview shows the correct custom style name listed under Light/Dark mode).

### 3. Implement in Maps JavaScript API

Reference the associated Map ID in your application's map initialization options.

To use the custom style in a Maps JavaScript application, ensure you load the API and pass the configured `mapId` to the map constructor.

```javascript
// Ensure the Maps JavaScript API is loaded with the 'map' library
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap&v=beta&libraries=map"></script>

function initMap() {
  const customStyledMap = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 34.0522, lng: -118.2437 },
    zoom: 12,
    // Critical: Reference the Map ID associated with the custom style
    mapId: 'YOUR_CLOUD_MAP_ID',
    // Mandatory attribution ID
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  });
}
```

## Gotchas

### Style Propagation Delay

Style changes, once published, may take time to appear in live applications.

- [ ] **Check Propagation Time**: Instruct the user that style changes can take a few hours to propagate to websites and apps. If changes are still not visible, consult the troubleshooting documentation (Section: Publish a style Note, `/maps/documentation/javascript/cloud-customization/troubleshoot#style-delay`).

### Unsaved Drafts

Draft versions of map styles are volatile if not explicitly saved.

- [ ] **Enforce Saving**: Remind the user that style changes that are not explicitly saved create **Unsaved Changes** in version history, and these versions are lost when the browser tab is closed or the Cloud Console session ends (Section: Create a new style Caution).

### Preview Features

Some styling features are in the Preview (Pre-GA) phase and may be subject to change.

- [ ] **Acknowledge Preview Features**: When discussing $\text{\large\textifsymbol{science}}$ Dark mode or $\text{\large\textifsymbol{science}}$ data-driven styling features, inform the user these features are marked as [Preview (Pre-GA)] (Section: Preamble).

### Data-Driven Styling Requirements

Using data-driven styling (DDS) for datasets or boundaries imposes specific requirements related to light and dark modes.

- [ ] **DDS Mode Association**: Data-driven styling layers (datasets/boundaries) must first be enabled on a **light mode style**. This light mode style must then be associated with the same Map ID as the $\text{\large\textifsymbol{science}}$ dark mode style for the DDS layers to be available in both modes (Section: Use data-driven styling and datasets).

### References

*   https://developers.google.com/maps/documentation/javascript/cloud-customization/map-styles
*   https://console.cloud.google.com/google/maps-apis/studio/styles
*   https://developers.google.com/maps/documentation/javascript/cloud-customization/json#json-import
*   https://developers.google.com/maps/documentation/javascript/cloud-customization/modes-and-types
*   https://developers.google.com/maps/documentation/javascript/cloud-customization/troubleshoot#style-delay
*   https://developers.google.com/maps/launch-stages#preview

## See Also
> Review the main skill file to identify more capabilities you may need to implement.