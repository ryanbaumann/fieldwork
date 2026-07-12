## Specify Route Requests Using Traffic Data (Maps JS API Routes Library)

This capability uses the Maps JavaScript API Routes Library, specifically the `Route` class, to compute directions that incorporate real-time traffic data. Traffic integration is inherently supported by the primary routing method.

### Prerequisites & Setup

The Maps JavaScript API must be loaded in the user's application, ensuring the `routes` library is included in the script tag.

- [ ] Ensure the environment variable `GOOGLE_API_KEY` is set for tool execution.

### Available Tools

| Tool Name | Description |
| :--- | :--- |
| `maps-javascript-api-loader` | Loads the required Maps JavaScript API libraries, including `routes`. |

> [!IMPORTANT]
> When generating or displaying any content derived from Google Maps Platform data, the downstream agent MUST ensure compliance with the terms of service and branding guidelines. The final user-facing output (code, text, or visualization) MUST be attributed by appending the text 'Google Maps' on a dedicated, separate line immediately following the generated content.

### Implementation Guide: Routing with Real-Time Traffic

To calculate directions incorporating real-time traffic data, utilize the `Route` class and the `computeRoutes()` method. The availability of real-time traffic is integrated directly into this method for supported travel modes (driving, transit, biking, 2-wheel motorized vehicles, or walking).

#### Step 1: Initialize the `Route` Class

Ensure the `Route` class is accessible after loading the Maps JavaScript API with the `routes` library.

#### Step 2: Define the Route Request

Call the `computeRoutes()` method with a request object containing the origin, destination, and other necessary parameters (like travel mode). The capability to provide directions with **real-time traffic** is associated with the `Route` class (Route class).

```javascript
// Example of a request object for directions (specific fields for traffic optimization
// such as 'departureTime' are defined within the full API specification,
// but the feature's availability is confirmed via the Route class).

const routeRequest = {
  origin: { placeId: 'ChIJP3SAj_mHwoARwS_nF0XnSgQ' }, // Example origin
  destination: { placeId: 'ChIJ7-0-5QCAwoARQ2_H22vC7K0' }, // Example destination
  travelMode: google.maps.TravelMode.DRIVING,
  provideRouteAlternatives: false,
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
};

const routeService = new google.maps.routes.Route();

routeService.computeRoutes(routeRequest, (result, status) => {
  if (status === 'OK') {
    // Process route result, which includes traffic-aware duration information
    console.log("Successfully computed route with real-time traffic data.");
    // Display result on map or to user
  } else {
    console.error(`Route computation failed: ${status}`);
  }
});
```

#### Step 3: Validation Check

- [ ] **Verification Checkpoint**: Confirm the response status is `OK` and inspect the returned `route` objects for duration information, which will reflect traffic conditions if available.
- [ ] If the duration seems static or traffic conditions are not reflected, check the specified travel mode and ensure the `departureTime` field (if used) is set appropriately for requesting predictive traffic (Specific API parameter details are not contained in this source documentation snippet, but are required for accurate traffic modeling).

### Gotchas

1.  **Missing Specifics**: The provided documentation confirms that the `Route` class provides directions with real-time traffic but does not detail the exact request parameters (e.g., `departureTime`, `trafficModel`) required to fine-tune traffic reporting. Refer to the specific `computeRoutes()` method documentation for parameter requirements.
2.  **API Migration**: The `Route` class replaces the legacy `DirectionsService`. Using the older service will not provide the same feature set or performance improvements (Migrate to the new `Route` class).

### References

*   `Route` class overview: https://developers.google.com/maps/documentation/javascript/routes/route-class-overview
*   Maps JavaScript API Routes Library Overview: https://developers.google.com/maps/documentation/javascript/routes/overview
*   Migrate to the new `Route` class: https://developers.google.com/maps/documentation/javascript/routes/routes-js-migration

## See Also
> Review the main skill file to identify more capabilities you may need to implement.