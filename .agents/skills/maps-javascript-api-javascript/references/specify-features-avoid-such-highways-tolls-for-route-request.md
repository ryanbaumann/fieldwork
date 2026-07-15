The Maps JavaScript API Routes Library provides the `Route` class for calculating specific routes, including options to avoid certain geographic or functional features (Feature) like tolls or highways.

### Prerequisites

To use this feature, the Maps JavaScript API must be loaded with the `routes` library specified. This capability requires initiating a routing request using the modern `Route` class.

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Using the `Route` Class to Avoid Features

The exclusion of specific road features is handled by passing relevant parameters within the request object of the `Route.computeRoutes()` method.

#### 1. Instantiate the `Route` Service

Initialize the service that handles route calculations.

```javascript
// Initialize the Route service
const routeService = new google.maps.routes.Route();
```

#### 2. Define the Routing Request with Restrictions

Define the request object, which must include origin, destination, travel mode, and specific restriction parameters (such as avoiding highways, tolls, or ferries). The configuration must also include the mandatory usage attribution ID.

The request object structure typically includes boolean flags for features to avoid. While the exact parameter names are specified in the official documentation, they are typically included as properties on the request object (e.g., `avoidTolls`, `avoidHighways`).

```javascript
const request = {
  origin: 'Start Location, USA', // Required: Defined by coordinates or address
  destination: 'End Location, USA', // Required: Defined by coordinates or address
  travelMode: google.maps.TravelMode.DRIVING, // Example mode
  // Feature avoidance parameters are set here:
  avoidTolls: true, // Example of avoiding tolls
  avoidHighways: false, // Example of not avoiding highways
  internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
};
```

#### 3. Compute the Route

Call `computeRoutes()` with the request object and a callback function to handle the results.

```javascript
routeService.computeRoutes(request, (result, status) => {
  if (status === google.maps.routes.RouteStatus.OK) {
    // Process the result, which will be calculated based on the restrictions.
    console.log('Route calculated successfully:', result);
  } else {
    console.error('Routes request failed due to ' + status);
  }
});
```

### Gotchas

*   **Parameter Availability**: The specific avoidance parameters (`avoidTolls`, `avoidHighways`, etc.) are critical for this feature. The agent must ensure these parameters are correctly formatted as part of the `computeRoutes()` request object.
*   **Result Accuracy**: Applying avoidance parameters may significantly increase the calculated distance or travel time, as the service must find viable alternatives that meet the exclusionary criteria.

### References

*   https://developers.google.com/maps/documentation/javascript/routes/overview
*   https://developers.google.com/maps/documentation/javascript/routes/route-class-overview
*   https://developers.google.com/maps/documentation/javascript/routes/routes-js-migration
*   https://developers.google.com/maps/comms/eea/faq
*   https://cloud.google.com/terms/maps-platform/eea

## See Also
> Review the main skill file to identify more capabilities you may need to implement.