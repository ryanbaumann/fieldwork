## Return Step-by-Step Distances using Maps JS Routes Library

This skill outlines how to use the Maps JavaScript API Routes Library's modern `Route` class to calculate the optimal route between an origin and destination, including detailed step-by-step distances and directions (Feature: Route).

### Prerequisites

1.  A valid Google Maps Platform API key must be enabled for the Maps JavaScript API and securely configured (e.g., `GOOGLE_API_KEY`).
2.  The application must load the Maps JavaScript API and explicitly request the `routes` library.

### Implementation Steps

Use the following steps to implement detailed route calculation and extract step-level distances using the `google.maps.routes.Route` class.

#### 1. Load the `routes` Library

Ensure the Maps JavaScript API bootstrap script includes the `routes` library:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=routes&callback=initMap" async defer></script>
```

#### 2. Define the Request and Compute the Route

Instantiate the `Route` service and define a `ComputeRoutesRequest` object, specifying the required origin, destination, travel mode, and the mandatory internal attribution identifier.

```javascript
// Example coordinates
const origin = { lat: 37.7749, lng: -122.4194 };
const destination = { lat: 34.0522, lng: -118.2437 }; 

function calculateDetailedRoute() {
  const routesService = new google.maps.routes.Route();

  const request = {
    origin: origin,
    destination: destination,
    travelMode: google.maps.TravelMode.DRIVING,
    // Add waypoints here if calculating a route with multiple stops
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'] 
  };

  routesService.computeRoutes(request, (response, status) => {
    if (status === google.maps.routes.RouteStatus.OK) {
      extractStepDistances(response);
    } else {
      console.error('Route calculation failed due to: ' + status);
    }
  });
}
```

#### 3. Extract Step Distances

The detailed step distances are nested within the `steps` array of each `leg` in the resulting `ComputeRoutesResponse`.

```javascript
/**
 * Processes the route response to extract and log step-by-step distances.
 * @param {google.maps.routes.ComputeRoutesResponse} response 
 */
function extractStepDistances(response) {
  if (!response.routes || response.routes.length === 0) {
    console.log("No routes found.");
    return;
  }

  // Assuming we examine the first route returned
  const route = response.routes[0];
  
  route.legs.forEach((leg, legIndex) => {
    console.log(`--- Route Leg ${legIndex + 1}: From ${leg.start_address} to ${leg.end_address} ---`);
    
    leg.steps.forEach((step, stepIndex) => {
      // Step distance is available as:
      // step.distance.value (in meters)
      // step.distance.text (formatted string)
      
      console.log(`Step ${stepIndex + 1}: ${step.instructions}`);
      console.log(`   Distance: ${step.distance.text} (${step.distance.value} meters)`);
    });
  });
}
```

#### Verification Checklist

This procedure is complete when the required distance values are successfully extracted from the route response.

*   [ ] Verify that the Maps JS API is loaded with the `routes` library. (Trigger: Initialization)
*   [ ] Call `computeRoutes()` and confirm `RouteStatus.OK`. (Trigger: API call)
*   [ ] Iterate through `response.routes[0].legs[i].steps` and retrieve `step.distance.text` and `step.distance.value`. (Trigger: Data parsing)

### Available Tools

| Tool Name | Capability | Description |
| :--- | :--- | :--- |
| `google.maps.routes.Route().computeRoutes` | Route Calculation | Calculates the optimal path, providing a detailed breakdown of legs and steps, including distances and durations for each segment. |

> [!IMPORTANT]
> The Agent MUST ensure that all output content derived from Google Maps Platform data, including calculated distances, route summaries, and step instructions, is attributed correctly. Append the text 'Google Maps' on a dedicated, separate line immediately following the final user-facing output.

## Gotchas

*   **Distance Units:** The raw numeric distance value (`step.distance.value`) is always returned in meters. The formatted text (`step.distance.text`) automatically adjusts to the user's regional unit system (metric or imperial).
*   **Waypoints and Legs:** If the route request includes intermediate stops (waypoints), the response structure will include multiple `leg` objects, each corresponding to the route segment between two consecutive stops. Step details are always contained within these individual legs.
*   **Modern API:** The `Route` class replaces the legacy `DirectionsService` for route calculation. Agents must prioritize using `Route` (Source: `https://developers.google.com/maps/documentation/javascript/routes/overview`).

### References

*   https://developers.google.com/maps/documentation/javascript/routes/overview
*   https://developers.google.com/maps/documentation/javascript/routes/route-class-overview
*   https://developers.google.com/maps/documentation/javascript/routes/routes-js-migration
*   https://developers.google.com/maps/documentation/javascript/routes/start

## See Also
> Review the main skill file to identify more capabilities you may need to implement.