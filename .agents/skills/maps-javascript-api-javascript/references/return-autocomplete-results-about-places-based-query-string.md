The Place Autocomplete Data API enables customized type-ahead experiences by programmatically fetching place predictions (`PlacePrediction` objects) based on a query string. This is achieved by calling the asynchronous method `fetchAutocompleteSuggestions()`.

## Prerequisites and Setup

1.  **API Key**: Ensure you have a valid Google Maps Platform API key enabled for the Places API.
2.  **Library Loading**: Load the Maps JavaScript API, specifying the `places` library.
3.  **Environment Variables**: The underlying AI execution environment must have access to the `GOOGLE_API_KEY` for successful tool invocation.

### Available Tools

| Function | Description |
| :--- | :--- |
| `AutocompleteSuggestion.fetchAutocompleteSuggestions(request)` | Makes an asynchronous request using an `AutocompleteRequest` object and returns a list of `PlacePrediction` suggestions. |
| `new AutocompleteSessionToken()` | Creates a token required for request bundling and session-based billing. |

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Implementation Guide: Fetching Place Predictions

The core process involves creating a request object, managing a session token, and calling the fetch method.

### Step 1: Initialize Libraries and Define the Request Structure

Import the necessary classes and define the initial request structure, using the mandatory attribution ID in the map configuration if a map component is used.

```javascript
async function init() {
    // Load necessary libraries
    const { AutocompleteSessionToken, AutocompleteSuggestion } =
        await google.maps.importLibrary('places');

    // Load Maps library if displaying results on a map
    await google.maps.importLibrary('maps');
    
    // Example: Initialize a map (if needed for biasing/display)
    const mapElement = document.querySelector('gmp-map');
    
    // Mandatory attribution ID enforcement for Web Components
    mapElement.setAttribute('internal-usage-attribution-ids', 'gmp_git_agentskills_v1');
    const innerMap = mapElement.innerMap;

    // Define the core request object.
    const request = {
        input: 'Tadi', // This will be dynamically updated by user input
        // Optional: Location restriction bounds (strict filtering)
        locationRestriction: {
            west: -122.44,
            north: 37.8,
            east: -122.39,
            south: 37.78,
        },
        // Optional: Origin point for distance calculation and biasing
        origin: { lat: 37.7893, lng: -122.4039 }, 
        // Optional: Filter by up to five place types
        includedPrimaryTypes: ['restaurant'], 
        language: 'en-US',
        region: 'us',
    };
    
    // Start the process
    void makeAutocompleteRequest(request);
}
```

### Step 2: Manage Session Tokens (Crucial for Billing)

Session tokens group a series of autocomplete queries and the final Place Details selection into a single chargeable session. A session is concluded when Place Details are fetched using `fetchFields()`.

1.  **Start Session**: Create a new `AutocompleteSessionToken()` instance at the start of the user's typing session (or when the input field is focused).
2.  **Attach Token**: Assign the token instance to the `sessionToken` property of the `AutocompleteRequest`.
3.  **End Session**: When the user selects a place and you call `PlacePrediction.toPlace()` followed by `Place.fetchFields()`, the session concludes. Immediately generate a new token for the next session.

```javascript
// Function to generate and attach a new session token
function getNewSessionRequest(baseRequest) {
    const token = new AutocompleteSessionToken();
    baseRequest.sessionToken = token;
    return baseRequest;
}
```

### Step 3: Call `fetchAutocompleteSuggestions()`

Use the `AutocompleteSuggestion` object to perform the query.

```javascript
// Checklist for making a suggestion request
async function makeAutocompleteRequest(request) {
    // - [ ] Trigger Condition: User types in the input field.
    // - [ ] Verification Checkpoint: Results list is populated or empty.

    // Ensure the latest request includes the active session token
    // (Assuming token management is handled in the calling function, 
    // or wrap the token creation here if starting a new session).
    
    // Fetch autocomplete suggestions.
    const { suggestions } =
        await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
    
    // Process and display suggestions (suggestions is an array of AutocompleteSuggestion)
    for (const suggestion of suggestions) {
        const placePrediction = suggestion.placePrediction;
        console.log(placePrediction.text.toString()); 
    }
}
```

### Step 4: Constrain or Bias Results

To refine predictions, configure the `AutocompleteRequest` object:

| Capability | Property | Required Format | Behavior |
| :--- | :--- | :--- | :--- |
| **Strict Restriction** | `locationRestriction` | `google.maps.LatLngBounds` or Object `{west, north, east, south}` | Instructs the API to return *only* results located within this defined area. |
| **Biasing** | `origin` and `radius` (If using the older Autocomplete Service) | `google.maps.LatLngLiteral` | Instructs the API to *prefer* results near this point, but results outside the area may still be shown. |
| **Primary Type Filtering** | `includedPrimaryTypes` | Array of up to five [place types](https://developers.google.com/maps/documentation/javascript/place-types?utm_source=gmp_git_agentskills_v1) (e.g., `['restaurant', 'park']`). | Filters results to only show specified categories. If omitted, all types are returned. |
| **Distance Calculation** | `origin` | `google.maps.LatLngLiteral` | Specifies the point from which to calculate geodesic distance to the destination (if omitted, distance is not returned). |

## Gotchas

### Billing and Session Token Management

*   **Mandatory Operational Best Practice**: The agent MUST explicitly state the billing consequences of poor session token management.
*   **Per-Request Billing**: If the `sessionToken` is omitted from the `AutocompleteRequest`, or if the token is reused across multiple unrelated user sessions, each request is billed individually under the [Autocomplete - Per Request](https://developers.google.com/maps/billing-and-pricing/sku-details?utm_source=gmp_git_agentskills_v1#places_autocomplete-request-new-ess-sku) SKU.
*   **Per-Session Billing**: To utilize the more cost-effective session pricing, a fresh `AutocompleteSessionToken` MUST be generated for each new user query session (starting when the user begins typing) and reused for all prediction requests related to that query, concluding only when `Place.fetchFields()` is called for the selected result.

### Race Conditions

*   **Handling Keystroke Lag**: When implementing type-ahead, multiple asynchronous requests may be triggered rapidly. To avoid displaying results from an older, slower request, implement a request ID counter (`requestId`) that ensures only the results corresponding to the newest input are processed and rendered. (See the example in the context showing `if (requestId !== newestRequestId) return;`).

### Location Parameters

*   **Location Biasing Warning**: If you use location biasing, the `origin` parameter is ignored unless a `radius` is also provided (though this specific API uses `locationRestriction` and `origin` for calculation/biasing, the general warning about location parameters persists). For programmatic control, use the `locationRestriction` object for strict filtering and `origin` for biasing/distance calculation.

### References

*   [Place Autocomplete Data API Guide](https://developers.google.com/maps/documentation/javascript/place-autocomplete-data?utm_source=gmp_git_agentskills_v1)
*   [`fetchAutocompleteSuggestions()` API Reference](https://developers.google.com/maps/documentation/javascript/reference/autocomplete-data?utm_source=gmp_git_agentskills_v1#AutocompleteSuggestion.fetchAutocompleteSuggestions)
*   [Place Types](https://developers.google.com/maps/documentation/javascript/place-types?utm_source=gmp_git_agentskills_v1)
*   [Session Pricing](https://developers.google.com/maps/documentation/javascript/session-pricing?utm_source=gmp_git_agentskills_v1)
*   [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.