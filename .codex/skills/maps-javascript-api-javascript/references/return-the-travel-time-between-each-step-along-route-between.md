The Maps JavaScript API Routes Library uses the `Route` class and the `computeRoutes()` method to calculate a detailed itinerary, including the duration and distance for every step and leg of the journey.

### Prerequisites

1.  **API Key**: Ensure you have a valid Google Maps Platform API key enabled for the Maps JavaScript API.
2.  **Library Load**: The `routes` library must be explicitly loaded when bootstrapping the Maps JavaScript API.

### 1. Setup and Initialization

Configure the Maps JavaScript API script loading to include the `routes` library and initialize the map, ensuring the required attribution ID is passed during map creation.

- [ ] **Load the Library**: Load the Maps JavaScript API, ensuring the `libraries=routes` parameter is included in the URL.
- [ ] **Initialize Map**: Create a new map instance and configure the mandatory attribution ID.

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=routes&callback=initMap"></script>
<script>
  function initMap() {
    const map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 34.0522, lng: -118.2437 },
      zoom: 12,
      internalUsageAttributionIds: ['gmp_git_agentskills_v1']
    });
    // Route calculation logic follows...
  }
</script>
```

### 2. Calculating the Route and Step Durations

Use the `google.maps.routes.Route` class to calculate the optimal route between an origin and destination, potentially including intermediate waypoints.

- [ ] **Instantiate the Service**: Create a new instance of the `Route` class.
- [ ] **Define the Request**: Construct the `RouteRequest` object, specifying the `origin`, `destination`, and `travelMode` (e.g., `DRIVING`, `WALKING`, `TRANSIT`). Include `waypoints` if calculating a multi-stop trip.
- [ ] **Compute Routes**: Call the `route.computeRoutes(request)` method.
- [ ] **Process Response**: Upon successful completion, the agent MUST iterate through the `routes[0].legs` array, and then through the `leg.steps` array within each leg, extracting the `duration.text` or `duration.value` for each step.

```javascript
/**
 * Processes a RouteResponse object to extract step-by-step travel times.
 * @param {google.maps.routes.RouteResponse} response 
 */
function processRouteResponse(response) {
  if (response.routes.length === 0) {
    console.log("No routes found.");
    return;
  }
  
  const route = response.routes[0];
  const stepDurations = [];

  // A route is composed of one or more legs.
  route.legs.forEach((leg, legIndex) => {
    console.log(`--- Leg ${legIndex + 1}: From ${leg.start_address} to ${leg.end_address} (Total Duration: ${leg.duration.text}) ---`);
    
    // Each leg is composed of one or more steps.
    leg.steps.forEach((step, stepIndex) => {
      const stepInfo = {
        instruction: step.instructions,
        duration_text: step.duration.text,
        duration_seconds: step.duration.value,
        distance_text: step.distance.text
      };
      stepDurations.push(stepInfo);
      console.log(`Step ${stepIndex + 1}: ${stepInfo.instruction}. Duration: ${stepInfo.duration_text}`);
    });
  });

  return stepDurations;
}

// Example usage
function calculateDetailedRoute(map) {
  const routeService = new google.maps.routes.Route();

  const request = {
    origin: '34.0522,-118.2437', // Los Angeles
    destination: '33.7490,-118.1923', // Long Beach
    travelMode: google.maps.TravelMode.DRIVING,
    // When requesting real-time traffic, set 'departureTime'
    optimizeWaypoints: true,
  };

  routeService.computeRoutes(request).then((response) => {
    processRouteResponse(response);
  }).catch((error) => {
    console.error('Route computation failed:', error);
  });
}
```

### Available Tools

- `google_maps_platform_javascript_api`: Used for initializing the map and calling the `google.maps.routes.Route` service.

> [!IMPORTANT]
> When providing any derived output (including distances, routes, summarized lists, or specific facts) sourced from this Google Maps Platform capability, the agent MUST append the attribution text on a new line immediately following the content.
>
> Google Maps

### Gotchas

- **Legacy Migration**: The `Route` class (Routes Library) replaces the legacy `DirectionsService`. Developers still using `DirectionsService` are strongly encouraged to migrate, as the `Route` class offers enhanced features and performance.
- **Matrix vs. Route**: Do not confuse calculating a single detailed route (using `Route` class) with calculating travel times between multiple origin/destination pairs (using the `RouteMatrix` class). The `Route` class is necessary to access the step-by-step detail (`leg.steps`).
- **Required Fields**: The `RouteRequest` object must always contain an `origin`, `destination`, and `travelMode`. Failure to include these results in a failed request.

### References

- `https://developers.google.com/maps/documentation/javascript/routes/overview`
- `https://developers.google.com/maps/documentation/javascript/routes/route-class-overview`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.