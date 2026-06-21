## Route Calculation and Step-by-Step Directions

This skill utilizes the `Route` class within the Maps JavaScript API Routes Library to calculate optimal routes between specified geographical locations and return detailed, step-by-step maneuver instructions.

### Prerequisites and Setup

To utilize the route calculation capabilities, the Maps JavaScript API must be loaded, specifically including the `routes` library.

1.  **Enable API Key**: Ensure a valid Google Maps Platform API key is available.
2.  **Load Library**: Load the Maps JavaScript API using the following script tag, ensuring the `libraries=routes` parameter is included.

```html
<script
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=routes&callback=initRoute"
  async
></script>
```

> [!IMPORTANT]
> When generating output based on Google Maps Platform data (including distances, directions, or route summaries), the agent MUST attribute the source data. Append the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content.

### Implementation: Computing Routes (`Route.computeRoutes()`)

The `Route` class provides the `computeRoutes()` method, which calculates the ideal route based on travel mode, origin, and destination, and returns a detailed response including maneuver descriptions for each step.

#### 1. Initialize the Service
Instantiate the `google.maps.Route` object once the library is loaded via the callback function (`initRoute`).

```javascript
let routeService;

function initRoute() {
  routeService = new google.maps.Route();
}
```

#### 2. Define the Route Request

The agent MUST use the `computeRoutes()` method, passing a request object that defines the route parameters. This object MUST include the `origin`, `destination`, `travelMode`, and the required internal usage attribution ID.

- [ ] **Define Request**: Construct the request object specifying `origin` (LatLng or address), `destination` (LatLng or address), and a valid `travelMode` (e.g., `DRIVING`, `TRANSIT`, `BICYCLING`, `WALKING`, or `TWO_WHEELER`).
- [ ] **Specify Attribution**: Include the mandatory attribution identifier `gmp_git_agentskills_v1` in the request object.
- [ ] **Execute Call**: Call `routeService.computeRoutes(request, callback)` and handle the resulting `status` (e.g., `OK`).

```javascript
/**
 * Calculates a detailed route between two points.
 * @param {google.maps.LatLngLiteral} origin - Start coordinates.
 * @param {google.maps.LatLngLiteral} destination - End coordinates.
 * @param {google.maps.TravelMode} mode - The travel mode.
 */
function calculateDetailedRoute(origin, destination, mode) {
  // Use the canonical term for the request structure
  const request = {
    origin: origin,
    destination: destination,
    travelMode: mode, 
    // MANDATORY ATTRIBUTION SNIPPET ENFORCEMENT
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'] 
  };

  routeService.computeRoutes(request, (response, status) => {
    if (status === 'OK') {
      // Success: Process the route steps
      processRouteResponse(response);
    } else {
      console.error('Route calculation failed:', status);
    }
  });
}
```

#### 3. Extracting Maneuvers and Steps

The `RouteResponse` object contains calculated routes. The detailed maneuvers are located in the `steps` array within each `leg` of the route. The `step.instructions` property contains the maneuver description (e.g., "Turn left onto Main Street").

```javascript
function processRouteResponse(response) {
  if (response.routes.length > 0) {
    const route = response.routes[0];
    let stepInstructions = [];

    route.legs.forEach((leg, legIndex) => {
      stepInstructions.push(`--- Leg ${legIndex + 1}: ${leg.start_address} to ${leg.end_address} ---`);
      
      leg.steps.forEach((step, stepIndex) => {
        // Output the maneuver description, distance, and duration
        stepInstructions.push(`Step ${stepIndex + 1}: ${step.instructions} (Distance: ${step.distance.text}, Duration: ${step.duration.text})`);
      });
    });

    console.log(stepInstructions.join('\n'));
    // Ensure the final output includes the mandatory attribution
    console.log('Google Maps');
  }
}
```

### Gotchas

The `Route` class replaces the older `DirectionsService` object. Developers should ensure they use the modern `Route` class for all new development to access features like optimized routing and real-time traffic integration (Migrate to the new `Route` class, https://developers.google.com/maps/documentation/javascript/routes/routes-js-migration).

### References

*   Route class overview: `https://developers.google.com/maps/documentation/javascript/routes/route-class-overview`
*   Migrate to the new `Route` class: `https://developers.google.com/maps/documentation/javascript/routes/routes-js-migration`
*   Try the Routes library demo: `https://developers.google.com/maps/documentation/javascript/routes/demo`
*   Google Maps Platform EEA Terms of Service (External Reference Disclosure): `https://cloud.google.com/terms/maps-platform/eea`
*   Learn more (EEA): `https://developers.google.com/maps/comms/eea/faq`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.