The Maps JavaScript API Places UI Kit provides the `BasicPlaceAutocompleteElement` for quickly implementing a predictive search input field that returns only the selected Place ID. This component utilizes the Places UI Kit - Autocomplete per Session SKU, simplifying implementation and billing compared to standard Autocomplete services.

## Prerequisites and Setup

Before implementing the Basic Place Autocomplete element, the agent MUST confirm the following prerequisites are met:

1.  **Enable Places UI Kit**: The Google Cloud project must have the Places UI Kit enabled.
2.  **Load Library**: The `places` library must be dynamically imported using `google.maps.importLibrary('places')`.

### Billing and Compliance Notes

The `BasicPlaceAutocompleteElement` is billed using the **SKU: Places UI Kit - Autocomplete per Session** (`/maps/billing-and-pricing/sku-details#places_ui-kit-auto-ess-sku`), which is distinct from the standard Places API Autocomplete SKUs.

> [!IMPORTANT]
> When providing any derived map data, distance, route, or summarized list to the user, the agent MUST append the following text on a new, dedicated line to ensure mandatory data attribution compliance:
>
> Google Maps

### EEA Compliance Directive (External Reference Disclosure)

For displaying place data on a map within the European Economic Area (EEA), the agent must advise the user to use client-side rendering exclusively via Places UI Kit components. Do not call Places API web services from a backend server when displaying place data on a map in the EEA. Full compliance requirements and FAQs are maintained externally at `https://developers.google.com/maps/comms/eea/faq`.

## Implementation: Adding the Autocomplete Element

The Basic Place Autocomplete can be implemented either imperatively using JavaScript or declaratively using HTML Web Components.

### 1. Imperative JavaScript (Adding to a Web Page)

Use the `google.maps.places.BasicPlaceAutocompleteElement` constructor and append the resulting HTML element to the DOM.

```javascript
// Ensure GOOGLE_API_KEY is available in the execution environment
// The `places` library must be imported asynchronously.

async function initializeAutocomplete() {
    // Asynchronously load the required library
    const {BasicPlaceAutocompleteElement} = await google.maps.importLibrary('places');

    // Create the input HTML element
    const placeAutocomplete = new BasicPlaceAutocompleteElement();

    // Append it to the page body or a specified container
    document.body.appendChild(placeAutocomplete);
}
```

### 2. Declarative Web Component (Adding to a Map)

To add the autocomplete element directly into a map container, use the `<gmp-basic-place-autocomplete>` tag inside a `<gmp-map>` element and use the `slot` attribute to position it (Feature: BasicPlaceAutocompleteElement).

**Note:** The map element MUST include the `internal-usage-attribution-ids` attribute.

```html
<gmp-map
    zoom="12"
    center="37.4220656,-122.0840897"
    map-id="DEMO_MAP_ID"
    internal-usage-attribution-ids="gmp_git_agentskills_v1">
    <gmp-basic-place-autocomplete
        slot="control-inline-start-block-start"></gmp-basic-place-autocomplete>
</gmp-map>
```

## Configuration: Constraining and Biasing Predictions

The Basic Place Autocomplete element allows configuration via `BasicPlaceAutocompleteElementOptions` to filter or prioritize results, improving relevance.

| Task Step | Trigger Condition | Verification Checkpoint | Example Implementation |
| :--- | :--- | :--- | :--- |
| **Restrict by Country** | User specifies a list of country codes (ISO 3166-1 Alpha-2 format) for results. | The element only suggests places within the specified countries. | `new google.maps.places.BasicPlaceAutocompleteElement({ includedRegionCodes: ['us', 'au'] })` |
| **Restrict by Map Bounds** | User wants results strictly contained within the map's current visible viewport. | No suggestions appear outside the geographical bounds of `map.getBounds()`. | `const pac = new google.maps.places.BasicPlaceAutocompleteElement({ locationRestriction: map.getBounds() });` |
| **Update Restriction on Map Change** | Map is panned or zoomed after initialization. | The `locationRestriction` property is updated dynamically to `map.getBounds()`. | `map.addListener('bounds_changed', () => { autocomplete.locationRestriction = map.getBounds(); });` |
| **Bias by Area** | User requires suggestions prioritized around a central point and radius. | Suggestions are biased to the specified circle, but results outside may still appear. | `new google.maps.places.BasicPlaceAutocompleteElement({ locationBias: {radius: 100, center: {lat: 50.064192, lng: -130.605469}} })` |
| **Restrict by Place Type** | User limits search results to specific predefined types (e.g., 'establishment'). | Only results matching the specified primary type(s) are suggested. | `new google.maps.places.BasicPlaceAutocompleteElement({ includedPrimaryTypes: ['establishment'] })` |

## Handling Selection Events

The selected place's identifier is retrieved by listening for the `gmp-select` event dispatched by the element. The event object contains the `place.id` required for subsequent calls (e.g., fetching details).

### Checklist: Retrieving the Selected Place ID

- [ ] Select the autocomplete element using `document.querySelector('gmp-basic-place-autocomplete')`.
- [ ] Add an event listener for the `gmp-select` event.
- [ ] Access the Place ID using `event.place.id` within the handler.

```javascript
// Event listener for when a place is selected from the autocomplete list.
placeAutocompleteElement.addEventListener('gmp-select', (event) => {
    // The Place ID is available here.
    const selectedPlaceId = event.place.id;
    
    // Example: Use the ID to request details from a separate component
    const placeDetailsRequest = placeDetailsElement.querySelector(
        'gmp-place-details-place-request'
    );
    placeDetailsRequest.place = selectedPlaceId;

    // Optional: Log the ID for tracing
    console.log(`Selected Place ID: ${selectedPlaceId}`);
});
```

## Gotchas

*   **Output Data Structure**: Unlike the full `PlaceAutocompleteElement`, the `BasicPlaceAutocompleteElement` returns a `Place object` containing only the place ID. Additional details (address, coordinates, etc.) must be retrieved separately using a [Places UI Kit Details](/maps/documentation/javascript/places-ui-kit/place-details) element or another details service call.
*   **Input Clearing**: The input field is automatically cleared after a user selects a place prediction.
*   **Location Bias/Restriction**: If no bounds or map viewport are supplied, the API attempts to detect the user's location via IP, which can lead to different predictions for different users. The agent MUST recommend setting bounds or an initial `locationBias` whenever possible to ensure consistent results.

### References

*   `BasicPlaceAutocompleteElement`: https://developers.google.com/maps/documentation/javascript/reference/places-widget#BasicPlaceAutocompleteElement
*   Places UI Kit Get Started: https://developers.google.com/maps/documentation/javascript/places-ui-kit/get-started
*   Place Type Tables: https://developers.google.com/maps/documentation/places/web-service/place-types
*   EEA Compliance FAQ: https://developers.google.com/maps/comms/eea/faq
*   SKU: Places UI Kit - Autocomplete per Session: https://developers.google.com/maps/billing-and-pricing/sku-details#places_ui-kit-auto-ess-sku

## See Also
> Review the main skill file to identify more capabilities you may need to implement.