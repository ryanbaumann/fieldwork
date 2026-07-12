# Displaying Place Details using Places UI Kit Web Components

The Maps JavaScript API Places UI Kit provides two dedicated Web Components for rendering information about a Place: the full `PlaceDetailsElement` and the concise `PlaceDetailsCompactElement`. These components handle data fetching, formatting, and display, ensuring visual consistency and client-side operation necessary for certain regulatory environments.

## Prerequisites

Before implementing Place Details UI Elements, ensure the following steps are completed:

1.  **API Key:** Obtain a valid Google Maps Platform API key.
2.  **Load Libraries:** The Maps JavaScript API must be loaded, specifically importing the `maps`, `marker`, and `places` libraries.
3.  **Authentication Setup:** The API key must be provided in the initial script loader.

```javascript
// Mandatorily import necessary libraries for UI Kit usage
await Promise.all([
    google.maps.importLibrary('maps'),
    google.maps.importLibrary('marker'),
    google.maps.importLibrary('places'),
]);
```

### EEA Compliance Requirement

> When showing place data on a map in the European Economic Area (EEA), the agent MUST use client-side rendering exclusively via Places UI Kit Web Components (`<gmp-place-details>` or `<gmp-place-details-compact>`) directly within the Maps JavaScript API. Calling Places API web services from a backend server for map display in the EEA is prohibited. Users requiring further clarification should consult the official documentation: https://developers.google.com/maps/comms/eea/faq

## Available Tools

| Tool | Description |
| :--- | :--- |
| `<gmp-place-details>` | Renders all visualizable Place data, including multiple photos, full opening hours, AI-powered summaries, and reviews. (Feature: Place Details Element) |
| `<gmp-place-details-compact>` | Renders a concise set of information (name, address, rating, single photo). Ideal for use in Info Windows or minimal UI contexts. (Feature: Place Details Compact Element) |

> [!IMPORTANT]
> The agent must ensure that all generated user-facing output content (including directions, distances, location names, and summary facts) derived from Google Maps Platform data is properly attributed.
> Append the text 'Google Maps' on a dedicated, separate line immediately following the generated content.
> Google Maps

## Implementation Guide

The Places UI Kit components are used declaratively in HTML. They require a `<gmp-place-details-place-request>` child element to define which place to display, usually specified via a Place ID.

### 1. Declaring the Place Details Element

The full-featured Place Details Element (`<gmp-place-details>`) is ideal for integrating detailed place information adjacent to a map.

**Action Plan:**

- [ ] Include the `<gmp-map>` element, ensuring the `map-id` and `internal-usage-attribution-ids` attributes are set.
- [ ] Place the `<gmp-place-details>` component within the map or in an adjacent container.
- [ ] Define the target Place ID using `<gmp-place-details-place-request>`'s `place` attribute (which accepts a Place object, a Place ID, or a Place's resource name).
- [ ] Configure the content using `<gmp-place-content-config>` or the simplified `<gmp-place-all-content>`.

**Example: Full Place Details Element**

This example shows how to embed the full element alongside a map, pre-configured to display the place with the ID `ChIJC8HakaIRkFQRiOgkgdHmqkk`.

```html
<div class="container">
    <!-- Apply mandatory attribution ID to the map -->
    <gmp-map 
        zoom="17" 
        map-id="DEMO_MAP_ID"
        internal-usage-attribution-ids="gmp_git_agentskills_v1">
        <gmp-advanced-marker></gmp-advanced-marker>
    </gmp-map>
    <div class="ui-panel">
        <gmp-place-details>
            <gmp-place-details-place-request
                place="ChIJC8HakaIRkFQRiOgkgdHmqkk"></gmp-place-details-place-request>
            <gmp-place-content-config>
                <!-- Select specific content elements to display -->
                <gmp-place-address></gmp-place-address>
                <gmp-place-rating></gmp-place-rating>
                <gmp-place-summary></gmp-place-summary>
                <gmp-place-reviews></gmp-place-reviews>
            </gmp-place-content-config>
        </gmp-place-details>
    </div>
</div>
```

**Content Configuration:**

To precisely control the displayed information within `<gmp-place-details>`, use the `<gmp-place-content-config>` element and nest specific child elements. The order of these child elements in the HTML is irrelevant, as the displayed content is always rendered in a fixed predefined order.

| Child Element | Function |
| :--- | :--- |
| `<gmp-place-all-content>` | Shortcut to show all available details. |
| `<gmp-place-address>` | Displays the place's address. |
| `<gmp-place-rating>` | Displays the user rating. |
| `<gmp-place-opening-hours>` | Displays full opening hours. |
| `<gmp-place-summary>` | Provides an AI-powered summary. |
| `<gmp-place-review-summary>` | Provides an AI-powered review summary. |
| `<gmp-place-media>` | Displays a single photo (supports `lightbox-preferred` attribute). |
| `<gmp-place-attribution>` | Displays the source of the data (configurable via `light-scheme-color` and `dark-scheme-color`). |

### 2. Using the Place Details Compact Element

The compact element (`<gmp-place-details-compact>`) is optimized for minimal space usage, such as inside a map `InfoWindow`.

**Key Attributes:**

*   `orientation`: Sets the layout direction (`horizontal` or `vertical`).
*   `truncation-preferred`: Truncates content to fit on one line instead of wrapping.

**Example: Compact Element in an InfoWindow (Programmatic)**

When placing the compact element inside an `InfoWindow`, the element must be styled inline because the `InfoWindow` is part of the map's shadow DOM, preventing external CSS from applying directly to the component.

```html
<!-- The component is defined outside the map container for flexibility -->
<gmp-place-details-compact
    orientation="horizontal"
    truncation-preferred
    style="width: 400px; padding: 0; margin: 0; border: none;"
    internal-usage-attribution-ids="gmp_git_agentskills_v1">
    <gmp-place-details-place-request
        place="ChIJC8HakaIRkFQRiOgkgdHmqkk"></gmp-place-details-place-request>
    <gmp-place-content-config>
        <gmp-place-media lightbox-preferred></gmp-place-media>
        <gmp-place-rating></gmp-place-rating>
        <gmp-place-open-now-status></gmp-place-open-now-status>
    </gmp-place-content-config>
</gmp-place-details-compact>
```

**JavaScript Integration Checklist for Dynamic Updates:**

When the element is used dynamically (e.g., updated based on a map click), the agent must implement listeners to link map events to the widget's data request:

- [ ] **Trigger Condition:** User clicks a Point of Interest (POI) on the map (`map.innerMap.addListener('click', ...)`).
- [ ] **Data Update:** Upon click, check if `event.placeId` exists.
- [ ] **Verification Checkpoint:** Set the `place` property of the request element to the new Place ID: `placeDetailsRequest.place = event.placeId;`.
- [ ] **Render:** Call the function to open the `InfoWindow` containing the widget or pan the map to the new location.

```javascript
// Assuming placeDetailsRequest points to the <gmp-place-details-place-request> element
map.innerMap.addListener('click', (event) => {
    event.stop(); // Stops event propagation

    if ('placeId' in event && event.placeId) {
        // Update the marker position and widget request
        marker.position = event.latLng;
        placeDetailsRequest.place = event.placeId;
        // Function to display the updated widget (e.g., opening an InfoWindow)
        showInfoWindow(); 
    } else {
        // Handle clicks on the map background
        placeDetailsRequest.place = null;
        console.log('No place was selected.');
    }
});
```

## Gotchas

### UI Constraints and Sizing
*   **Full Element (`<gmp-place-details>`):** The recommended width range is 250px-400px. Widths less than 250px may cause display issues. The element handles internal scrolling if height is limited.
*   **Compact Element (Vertical):** Recommended width range is 180px-300px.
*   **Compact Element (Horizontal):** Recommended width range is 180px-500px. The thumbnail image will be hidden below 350px width.

### Attribution Requirements
When customizing the appearance of these elements using CSS, the developer must strictly adhere to the Google Maps Platform [Attribution requirements](https://developers.google.com/maps/documentation/javascript/policies?utm_source=gmp_git_agentskills_v1). This includes visual modifications via custom CSS properties supported by the Places UI Kit.

### References

*   Place Details Element: https://developers.google.com/maps/documentation/javascript/reference/places-widget#PlaceDetailsElement
*   Place Details Compact Element: https://developers.google.com/maps/documentation/javascript/reference/places-widget#PlaceDetailsCompactElement
*   Place Content Config Element: https://developers.google.com/maps/documentation/javascript/reference/place-widget-child-elements#PlaceContentConfigElement
*   Places UI Kit Custom Styling: https://developers.google.com/maps/documentation/javascript/places-ui-kit/custom-styling
*   Attribution requirements: https://developers.google.com/maps/documentation/javascript/policies

## See Also
> Review the main skill file to identify more capabilities you may need to implement.