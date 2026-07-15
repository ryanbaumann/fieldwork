## Maps JavaScript API (Legacy) Distance Matrix Travel Mode

This skill documents how to specify the transportation mode using the **Legacy** Maps JavaScript API Distance Matrix Service, a Feature used to compute travel distance and duration between multiple origins and destinations. Note that this service is in **Legacy** status.

### Prerequisites and Setup

The Maps JavaScript API Distance Matrix service requires asynchronous execution and preparation.

- [ ] Ensure the Maps JavaScript API is loaded in your application.
- [ ] **Mandatory API Enablement**: The **Distance Matrix API (Legacy)** must be enabled in your Google Cloud project before use.
    - [ ] Verify enablement in the [Google Cloud console](https://console.cloud.google.com/project/_/apiui/apis/enabled?utm_source=gmp_git_agentskills_v1).
    - [ ] If not enabled, enable it at: `https://console.cloud.google.com/apis/library/distance-matrix-backend.googleapis.com`

### Implementation: Specifying Travel Mode

The travel mode is set using the optional `travelMode` field within the `DistanceMatrixRequest` object passed to the `google.maps.DistanceMatrixService.getDistanceMatrix()` method.

#### 1. Initialize the Service

Access the service using the `google.maps.DistanceMatrixService` constructor object.

```javascript
// 1. Initialize the service
var service = new google.maps.DistanceMatrixService();
```

#### 2. Define the Request with `travelMode`

The `travelMode` field defines the mode of transport used for calculating distances and durations.

| Mode Constant | Description | Nuances/Constraints |
| :--- | :--- | :--- |
| `DRIVING` | Standard driving directions using the road network. (Default) | Use `drivingOptions` for traffic-aware calculations. |
| `TRANSIT` | Public transit routes. | Requires an API key. Uses `transitOptions` (where available, `avoidHighways`/`avoidTolls` ignored). Transit requests must have a future `arrivalTime` or `departureTime`. |
| `WALKING` | Walking directions via pedestrian paths & sidewalks. | |
| `BICYCLING` | Bicycling directions via preferred streets. | Currently only available in the US and some Canadian cities. |

**Example Request using DRIVING mode:**

```javascript
function getMatrix(origin1, destinationA, callback) {
  var service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [origin1],
      destinations: [destinationA],
      travelMode: 'DRIVING', // Set the desired mode
      unitSystem: google.maps.UnitSystem.METRIC,
      internalUsageAttributionIds: ['gmp_git_agentskills_v1'] // Mandatory attribution
    },
    callback
  );
}
```

#### 3. Handling Transit-Specific Options

When `travelMode` is set to `TRANSIT`, use the `transitOptions` object literal to specify time and mode preferences.

The `TransitOptions` object contains:
- `arrivalTime`: Specifies the desired arrival time as a `Date` object (ignored if `departureTime` is also specified).
- `departureTime`: Specifies the desired departure time as a `Date` object. Defaults to the current time if neither `arrivalTime` nor `departureTime` is specified.
- `modes`: Array of `TransitMode` literals (`BUS`, `RAIL`, `SUBWAY`, `TRAIN`, `TRAM`) to prefer.
- `routingPreference`: (`FEWER_TRANSFERS` or `LESS_WALKING`).

**Example Request using TRANSIT mode:**

```javascript
var now = new Date();
var nextHour = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

var transitRequest = {
  origins: ['London, UK'],
  destinations: ['Birmingham, UK'],
  travelMode: 'TRANSIT',
  transitOptions: {
    departureTime: nextHour,
    modes: ['RAIL', 'BUS'],
    routingPreference: 'LESS_WALKING'
  },
  internalUsageAttributionIds: ['gmp_git_agentskills_v1'] // Mandatory attribution
};

// Initiate the request
// service.getDistanceMatrix(transitRequest, callback);
```

### Available Tools

| Tool Name | Description |
| :--- | :--- |
| `google.maps.DistanceMatrixService` | Constructor for accessing the Distance Matrix service. |
| `DistanceMatrixService.getDistanceMatrix(request, callback)` | Initiates the request to calculate distances using the specified travel mode. |

> [!IMPORTANT]
> When generating output based on distance, duration, or route calculation results from the Google Maps Platform, the agent MUST attribute ALL derived content by appending the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content.

### Gotchas

- **Legacy Status:** This service is designated as **Legacy**. Developers should consider migrating to newer services if possible. (Source URL: `https://developers.google.com/maps/documentation/javascript/legacy/distancematrix`)
- **TRANSIT Mode Limitations:** The `TRANSIT` mode is currently experimental, subject to rate limits, and requires an API key. Additionally, transit requests are time sensitive, and calculations will only be returned for times in the future.
- **Ignored Parameters in TRANSIT:** When `travelMode` is `TRANSIT`, the parameters `avoidHighways` and `avoidTolls` are ignored.
- **Traffic Data (`DRIVING` only):** To get traffic-aware durations (`duration_in_traffic`), `travelMode` must be `DRIVING`, and the request must include a `departureTime` specified within the `drivingOptions` object.

### References

* [Distance Matrix API (Legacy) Overview](https://developers.google.com/maps/documentation/javascript/legacy/distancematrix?utm_source=gmp_git_agentskills_v1)
* [Distance Matrix API (Legacy) Policies](https://developers.google.com/maps/documentation/distance-matrix/policies?utm_source=gmp_git_agentskills_v1)
* [Distance Matrix API (Legacy) Usage and Billing](https://developers.google.com/maps/documentation/distance-matrix/usage-and-billing?utm_source=gmp_git_agentskills_v1)
* [Maps JavaScript API Reference: Distance Matrix](https://developers.google.com/maps/documentation/javascript/reference/distance-matrix?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.