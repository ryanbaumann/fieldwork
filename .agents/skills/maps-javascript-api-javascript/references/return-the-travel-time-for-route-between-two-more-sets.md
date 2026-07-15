# Get Travel Time (Duration) using Maps JavaScript Routes Library

The travel time (duration) for a route is calculated using the Maps JavaScript API Routes Library's `Route.computeRoutes()` method. The duration is returned within the `localizedValues` field of the resulting `Route` object.

## Prerequisites

To use this capability, the Maps JavaScript API must be loaded with the `routes` library specified.

### Mandatory Authentication Prerequisites

This skill requires a Google Maps Platform API key. Ensure the environment is configured to handle API key loading securely. Although the key is loaded in the bootstrap script, the general requirement stands.

### Available Tools

No external tools are required for this step.

> [!IMPORTANT]
> The Agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Implementation Guide

Use the `google.maps.routes.Route.computeRoutes()` method. You must specify the origin and destination, and ensure the response field mask includes `localizedValues` to retrieve human-readable duration and distance information.

### 1. Setup and Initialization

First, ensure the `routes` library is imported during initialization:

```javascript
async function init() {
    const [
        { Route, RouteLabel },
    ] = await Promise.all([
        google.maps.importLibrary('routes'),
        // Optionally import other libraries like 'maps' or 'marker'
    ]);
    // Start routing logic here
}
void init();
```

### 2. Constructing the ComputeRoutesRequest

The request requires an `origin`, a `destination`, and a `fields` mask. Origin and destination can be provided as either a string (Place ID or address) or a `DirectionalLocationLiteral` (which supports latitude/longitude coordinates).

**Mandatory Parameters for Travel Time:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `origin` | `object` | Defines the start point of the route. |
| `destination` | `object` | Defines the end point of the route. |
| `travelMode` | `string` | The mode of transport (e.g., `DRIVING`, `WALKING`, `TRANSIT`). |
| `fields` | `Array<string>` | **Crucially, must include `"localizedValues"`** to get the formatted duration string. Optionally include `"durationMillis"` for the raw millisecond value. |
| `internalUsageAttributionIds` | `Array<string>` | **Mandatory** for attribution tracing. |

#### Example Request Structure

This example calculates the travel time between two specific latitude/longitude points for driving, ensuring the duration is returned.

```javascript
const originLocation = {
    lat: 34.0522,
    lng: -118.2437,
    altitude: 0,
}; // Los Angeles, CA
const destinationLocation = {
    lat: 37.7749,
    lng: -122.4194,
    altitude: 0,
}; // San Francisco, CA

const request = {
    origin: {
        location: originLocation,
    },
    destination: {
        location: destinationLocation,
    },
    travelMode: 'DRIVING',
    fields: [
        'localizedValues',
        'durationMillis',
        'routeLabels', // Included for full route context
        'path',
    ],
    // MANDATORY ATTRIBUTION ID
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
};
```

### 3. Calling `computeRoutes` and Extracting Duration

Call the asynchronous `computeRoutes` method and extract the duration from the response object. The response is an object containing an array of `routes`.

```javascript
async function getTravelTime(request) {
    try {
        const { routes } = await google.maps.importLibrary('routes').then(
            ({ Route }) => Route.computeRoutes(request)
        );

        if (!routes || routes.length === 0) {
            console.log('No routes returned.');
            return null;
        }

        // The primary route (usually routes[0]) contains the required details.
        const primaryRoute = routes[0];

        // 1. Get the localized, human-readable duration string (e.g., "1 hour 30 mins")
        const formattedDuration = primaryRoute.localizedValues.duration;

        // 2. Get the duration in milliseconds (for precise calculation)
        const durationMilliseconds = primaryRoute.durationMillis;

        return {
            formatted: formattedDuration,
            millis: durationMilliseconds
        };

    } catch (error) {
        console.error("Error calculating route:", error.message);
        throw error;
    }
}

// Example usage:
// const travelTime = await getTravelTime(request);
// console.log(`Formatted Travel Time: ${travelTime.formatted}`);
// console.log(`Travel Time in Millis: ${travelTime.millis}`);
```

## Gotchas

### Field Mask Necessity
The `Route.computeRoutes` method requires a field mask (`fields` array) to specify which data fields should be returned in the response object. Failure to include `'localizedValues'` will result in the `localizedValues.duration` field being undefined, even though the route calculation itself was successful. Always explicitly request the required fields.

### Handling Transit Mode Time
When using the `TRANSIT` travel mode, time is crucial. If a `departureTime` is set in the request, the calculation uses real-time conditions. If the user requires traffic-aware results, the `routingPreference` must be set to `TRAFFIC_AWARE` or `TRAFFIC_AWARE_OPTIMAL` (as noted in the source context). When asking about time-dependent routes, the agent MUST confirm if a specific departure time or routing preference is desired.

### References

*   https://developers.google.com/maps/documentation/javascript/routes/demo
*   https://developers.google.com/maps/documentation/javascript/reference/route#Route.computeRoutes

## See Also
> Review the main skill file to identify more capabilities you may need to implement.