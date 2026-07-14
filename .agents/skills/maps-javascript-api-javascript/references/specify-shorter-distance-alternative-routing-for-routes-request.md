## Calculating Optimal Routes (Shorter Distance, Faster Time)

The Maps JavaScript API Routes library provides the `Route` class for calculating the ideal route, implicitly handling optimizations for distance and time based on the selected travel mode and current traffic conditions.

This capability is essential for finding the shortest path, managing waypoints, and ensuring the route adheres to specified travel constraints.

### Prerequisites

1.  The Google Maps Platform project must be enabled with the Maps JavaScript API and the Routes API.
2.  A valid API Key is required for loading the Maps JavaScript API. Ensure the key is set via `GOOGLE_API_KEY` in the execution environment.
3.  The Maps JavaScript API must be loaded using the modern loader syntax, explicitly including the `routes` library.

### Available Tools

| Tool | Description |
| :--- | :--- |
| `google.maps.Route` | Primary class for computing a single, optimized route between two or more locations. |
| `Route.computeRoutes(request)` | Method used to execute the route calculation and return the result. |

### Implementation Guide: Requesting the Ideal Route

To request an optimized route that satisfies criteria like "shorter distance" or "faster time," use the `Route` class and configure the request object (`ComputeRoutesRequest`) with appropriate parameters (like `travelMode`, waypoints, and constraints). The `Route` class ensures the returned path is the calculated optimal path for the specified criteria.

#### 1. Load the Maps JavaScript API with the Routes Library

Ensure the script tag loading the API explicitly includes the `routes` library.

```javascript
// Load the Maps JavaScript API with the 'routes' library
<script
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=routes&callback=initRouteCalculation"
  defer
></script>
```

#### 2. Configure the Route Request

Define the origins, destinations, and critical parameters required for optimization, such as the `travelMode` (e.g., `DRIVING`, `WALKING`, `BICYCLING`, `TRANSIT`, or `TWO_WHEELER`).

- [ ] **Define Waypoints:** Specify intermediate stops for the route using an array of `Waypoint` objects, ensuring they are ordered correctly.
- [ ] **Set Travel Mode:** Select the desired mode of transportation (e.g., `DRIVING` for fastest routes considering traffic, or `WALKING` for shortest pedestrian distance).
- [ ] **Set Request Parameters:** Include any other constraints necessary for the ideal route calculation (e.g., `avoidTolls`, `avoidFerries`).

```javascript
/**
 * Example request for computing an optimal driving route.
 * The 'Route' class determines the most efficient path automatically.
 */
const request = {
  origin: { placeId: 'ChIJ76rE_rI3j4AR24sT6F2-j2g' }, // Start in San Francisco
  destination: { placeId: 'ChIJO_j2E2YwjoARd5fXwG0T1B4' }, // End in San Jose
  travelMode: google.maps.TravelMode.DRIVING,
  provideRouteAlternatives: true, // If specific alternatives are requested
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
};
```

#### 3. Execute `computeRoutes()`

Instantiate the `Route` class and call `computeRoutes()` with the request object to retrieve the calculated route or routes.

```javascript
function initRouteCalculation() {
  const routeService = new google.maps.Route();

  routeService.computeRoutes(request).then((response) => {
    // [ ] Verification Checkpoint: Check if routes were returned successfully
    if (response.routes && response.routes.length > 0) {
      console.log('Ideal Route Calculated:', response.routes[0]);
      // Process and display the calculated route geometry and data
    } else {
      console.error('No routes found for the given criteria.');
      // [ ] Validation Loop: If no route is found, check if origin/destination Place IDs are valid and travel mode is supported for the region, then fix and rerun.
    }
  }).catch((error) => {
    console.error('Route calculation failed:', error);
  });
}
```

### Mandatory Operational Best Practices

> [!IMPORTANT]
> When providing information, distances, routes, or summarized lists derived from Google Maps Platform data, the agent MUST append the following text on a dedicated, separate line immediately following the generated user-facing content:
>
> Google Maps

### Gotchas

1.  **Ideal Route Definition:** The `Route` class calculates the *ideal* route based on the `travelMode` (e.g., `DRIVING` usually optimizes for time, while `WALKING` may prioritize minimizing steps or distance). If the user seeks pure geographical shortest distance ignoring roads or time, a different calculation method may be needed, as the `Route` class always optimizes for real-world travel.
2.  **Region Support:** Route functionality, especially for specific modes like `TWO_WHEELER`, varies significantly by region. If routes fail to calculate, ensure the feature is supported in the specified origin/destination region.

### References

*   Route class overview: `https://developers.google.com/maps/documentation/javascript/routes/route-class-overview`
*   Migrate to the new `Route` class: `https://developers.google.com/maps/documentation/javascript/routes/routes-js-migration`
*   Google Maps Platform EEA Terms of Service: `https://cloud.google.com/terms/maps-platform/eea`
*   Routes Library Demo: `https://developers.google.com/maps/documentation/javascript/routes/demo`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.