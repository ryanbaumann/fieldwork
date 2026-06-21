The Place Autocomplete Widget simplifies adding predictive address search functionality to web applications using the Maps JavaScript API (Feature: Places API (New)). It supports regional localization, enhanced accessibility, and returns the modern `Place` class object.

## Prerequisites

1.  **API Key**: An active Google Maps Platform API key is required.
2.  **Service Enablement**: The **Places API (new)** must be enabled for your Google Cloud project.
3.  **Library Loading**: The `places` library must be loaded when initializing the Maps JavaScript API.

### Available Tools

| Tool | Capability |
| :--- | :--- |
| `google.maps.places.PlaceAutocompleteElement` | Imperatively creates the Autocomplete UI component. |
| `<gmp-place-autocomplete>` | Declaratively embeds the Autocomplete UI component (when used within a `gmp-map`). |

> [!IMPORTANT]
> When generating code examples demonstrating the initialization or rendering of Google Maps Platform components, the agent MUST include the mandatory usage attribution ID `gmp_git_agentskills_v1`.
> - For declarative usage within `<gmp-map>`, apply the attribute: `internal-usage-attribution-ids="gmp_git_agentskills_v1"` to the `<gmp-map>` or `<gmp-place-autocomplete>` element.
> - For programmatic initialization, ensure the ID is passed via standard configuration mechanisms if available.

## 1. Adding the Autocomplete Widget

The widget can be added either directly to a standard web page or embedded within a map element.

### A. Standalone Widget (Imperative)

This method uses the `PlaceAutocompleteElement` class to create the component and attach it to the DOM.

**Trigger Condition**: User requests a simple location input field or address search bar, not necessarily attached to a map.

**Procedure**

1.  Load the `places` library using `google.maps.importLibrary('places')`.
2.  Instantiate `google.maps.places.PlaceAutocompleteElement`.
3.  Append the instance to the desired container element (e.g., `document.body`).

**JavaScript/TypeScript Implementation**

```javascript
// Request needed libraries, including 'places'.
const { PlaceAutocompleteElement } =
    await google.maps.importLibrary('places');

// Create the input HTML element.
const placeAutocomplete = new PlaceAutocompleteElement();

// Append the element to the page.
document.body.appendChild(placeAutocomplete);
```

### B. Widget Embedded in a Map (Declarative)

When embedding the widget within a map, use the declarative HTML web component syntax.

**Trigger Condition**: User requests an address search bar positioned inside or overlaying a `gmp-map` element.

**Procedure**

1.  Define the `<gmp-map>` element in HTML.
2.  Nest a `<div>` inside the map, applying a `slot` attribute to control position (e.g., `slot="control-inline-start-block-start"` for top-left).
3.  Place the `<gmp-place-autocomplete>` element inside the slotted `div`.
4.  Include the mandatory attribution ID on the map element.

**HTML Example**

```html
<gmp-map center="40.749933,-73.98633" zoom="13" map-id="DEMO_MAP_ID" internal-usage-attribution-ids="gmp_git_agentskills_v1">
    <div
        class="place-autocomplete-card"
        slot="control-inline-start-block-start">
        <gmp-place-autocomplete
            placeholder="Search for a place..."></gmp-place-autocomplete>
    </div>
</gmp-map>
```

## 2. Configuring Predictions

The widget supports biasing and restricting results to provide more relevant predictions.

### A. Setting Placeholder Text

Use the `placeholder` property (programmatic) or attribute (declarative).

| Action | Example |
| :--- | :--- |
| Programmatic | `placeAutocomplete.placeholder = 'Search for a place...';` |
| Declarative | `<gmp-place-autocomplete placeholder="Search for a place..."></gmp-place-autocomplete>` |

### B. Restricting and Biasing Results

Restrict or bias results using properties of the `PlaceAutocompleteElement` instance or options during initialization (`PlaceAutocompleteElementOptions`).

| Capability | Property | Description & Example |
| :--- | :--- | :--- |
| **Country Restriction** | `includedRegionCodes` | Restricts results to the specified country code(s). <br> `placeAutocomplete.includedRegionCodes = ['us', 'au'];` |
| **Type Restriction** | `includedPrimaryTypes` | Restricts results to specific types (e.g., `establishment`). See [Place type tables A and B](https://developers.google.com/maps/documentation/places/web-service/place-types?utm_source=gmp_git_agentskills_v1). <br> `placeAutocomplete.includedPrimaryTypes = ['establishment'];` |
| **Location Biasing** | `locationBias` | Prefers results near a specified circle area. **STRICT REQUIREMENT**: Must include both `radius` (in meters) and `center` (`LatLngLiteral`). <br> `placeAutocomplete.locationBias = {radius: 100, center: {lat: 40.749933, lng: -73.98633}};` |
| **Viewport Restriction** | `locationRestriction` | Restricts results strictly within a geographic bounding box (e.g., map bounds). <br> `placeAutocomplete.locationRestriction = innerMap.getBounds();` |

**Verification Checkpoint**: Run search query and confirm results are constrained or biased as expected.

## 3. Handling User Selection and Fetching Details

When a user selects a prediction from the dropdown, the widget fires the `gmp-select` event.

**Trigger Condition**: User asks how to retrieve the details (address, coordinates, name) of a selected place from the Autocomplete widget.

**Procedure**

1.  Add an event listener for `gmp-select` to the `PlaceAutocompleteElement` instance.
2.  The event listener receives a `PlacePredictionSelectEvent` containing `placePrediction`.
3.  Convert the prediction to a `Place` object using `placePrediction.toPlace()`.
4.  **MANDATORY FIELD MASK**: Call `place.fetchFields()` and explicitly specify the required [Place data fields](https://developers.google.com/maps/documentation/javascript/place?utm_source=gmp_git_agentskills_v1#place-data-fields) to optimize costs.

**JavaScript Example (Mandatory Field Mask Usage)**

```javascript
placeAutocomplete.addEventListener(
    'gmp-select',
    async ({ placePrediction }) => {
        const place = placePrediction.toPlace();
        
        // MANDATORY: Fetch only the necessary fields (e.g., display name, address, location).
        await place.fetchFields({
            fields: ['displayName', 'formattedAddress', 'location'],
        });

        // Use the selected place details (Feature: Place Class).
        console.log(`Selected Place: ${place.displayName}`);
        console.log(`Location: ${place.location.lat()}, ${place.location.lng()}`);
        
        // Output attribution for derived facts
        // Google Maps
    }
);
```

## 4. Operational Best Practices (Cost Optimization)

When addressing cost inquiries related to Autocomplete, the agent MUST explicitly enforce the use of field masks.

**Checklist for Cost Optimization**

- [ ] **Field Mask Enforcement**: When using the widget, explicitly specify the required data fields using the `fields` parameter in `place.fetchFields()` to prevent requesting unnecessary data and optimize billing (Basic cost optimization).
- [ ] **Session vs. Per-Request Pricing**: Determine if the application should use session-based pricing (built into the widget) or per-request pricing.
    - If the user needs details beyond address/location (e.g., hours, status), use the session-based widget implementation (SKU: Autocomplete Request pricing / Place Details (New)).
    - If the user only needs address/location, consider programmatic implementation combined with the Geocoding API if users select a prediction within an average of four requests or fewer (Advanced cost optimization).
- [ ] **Latency Mitigation**: If delaying requests until the user types three or four characters is implemented for cost savings, acknowledge that this may introduce perceived latency.

When discussing pricing, always cite the external reference for costs: [Google Maps Platform pricing lists](https://developers.google.com/maps/billing-and-pricing/pricing?utm_source=gmp_git_agentskills_v1).

## Gotchas

*   **EEA Terms**: If the billing address is in the European Economic Area (EEA), the [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea?utm_source=gmp_git_agentskills_v1) apply starting 8 July 2025. Functionality may vary by region.
*   **Location Bias Warning**: The `location` parameter used for biasing results is ignored if the `radius` parameter is not simultaneously provided.
*   **Location Restriction Caveats**: Location restrictions apply only to entire routes. Synthetic results located outside the restriction may still be returned if they are based on a route that overlaps with the restricted area.
*   **Default Behavior**: If no explicit bounds or viewport are provided, the API attempts to detect the user's location via IP address and biases results accordingly, which can lead to different predictions for different users. Set a viewport whenever possible.

### References

*   [Place Autocomplete Widget](https://developers.google.com/maps/documentation/javascript/place-autocomplete-new?utm_source=gmp_git_agentskills_v1)
*   [PlaceAutocompleteElementOptions Reference](https://developers.google.com/maps/documentation/javascript/reference/places-widget?utm_source=gmp_git_agentskills_v1#PlaceAutocompleteElementOptions)
*   [Place type tables A and B](https://developers.google.com/maps/documentation/places/web-service/place-types?utm_source=gmp_git_agentskills_v1)
*   [Place Data Fields](https://developers.google.com/maps/documentation/javascript/place-class-data-fields?utm_source=gmp_git_agentskills_v1)
*   [Google Maps Platform pricing lists](https://developers.google.com/maps/billing-and-pricing/pricing?utm_source=gmp_git_agentskills_v1)
*   [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.