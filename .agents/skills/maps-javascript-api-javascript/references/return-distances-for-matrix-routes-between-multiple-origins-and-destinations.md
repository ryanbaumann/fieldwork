## Distance Matrix Service (Legacy)

This skill documents how to use the client-side Maps JavaScript API's Distance Matrix service to calculate travel distances and journey durations between multiple pairs of origins and destinations. Note that this feature is in **Legacy** status, and users should be directed to review [Legacy products and features](https://developers.google.com/maps/legacy?utm_source=gmp_git_agentskills_v1) for migration planning.

### Prerequisites and Setup

1.  **API Key and Library:** Ensure the Maps JavaScript API library is loaded.
2.  **Enable the API:** The **Distance Matrix API (Legacy)** MUST be enabled in your Google Cloud project associated with the API key.
    *   To enable the required API: <https://console.cloud.google.com/apis/library/distance-matrix-backend.googleapis.com>
3.  **Client-Side Access:** This functionality is accessed via the `google.maps.DistanceMatrixService` constructor object in the Maps JavaScript API.

### Capabilities

The Distance Matrix Service provides the following capabilities, allowing calculation of distances and times:

- [ ] Calculate distance and duration for a matrix of routes between pairs of locations.
- [ ] Support inputs up to 25 origins and 25 destinations (500 elements total).
- [ ] Specify travel modes: `DRIVING` (default), `WALKING`, `BICYCLING`, or `TRANSIT`.
- [ ] Incorporate traffic conditions (`duration_in_traffic`) when `travelMode` is `DRIVING` and `drivingOptions` specifies a valid `departureTime`.

### Implementation: Requesting the Distance Matrix

Accessing the Distance Matrix service is asynchronous and requires a callback function to process the results (`DistanceMatrixResponse`).

#### 1. Initialize the Service

Instantiate the service object:

```javascript
var service = new google.maps.DistanceMatrixService();
```

#### 2. Define and Send the Request

Use the `DistanceMatrixService.getDistanceMatrix()` method, passing a `DistanceMatrixRequest` object literal containing the location arrays and options, and a callback function.

```javascript
var origin1 = new google.maps.LatLng(55.930385, -3.118425);
var destinationB = new google.maps.LatLng(50.087692, 14.421150);

var service = new google.maps.DistanceMatrixService();
service.getDistanceMatrix(
  {
    origins: [origin1, 'Greenwich, England'],
    destinations: ['Stockholm, Sweden', destinationB],
    travelMode: 'DRIVING',
    drivingOptions: {
      departureTime: new Date(Date.now() + 60000), // Required for traffic modeling
      trafficModel: 'best_guess'
    },
    unitSystem: google.maps.UnitSystem.METRIC,
    avoidHighways: true,
  }, 
  callback
);
```

**Key Request Parameters (`DistanceMatrixRequest`):**

| Parameter | Type | Mandatory Side Effects / Notes |
| :--- | :--- | :--- |
| `origins` | Array | Required. Array of start points (`LatLng`, address string, or `Place` object). |
| `destinations` | Array | Required. Array of end points (`LatLng`, address string, or `Place` object). |
| `travelMode` | String | Defines method (`DRIVING`, `WALKING`, `TRANSIT`, `BICYCLING`). |
| `drivingOptions` | Object | If specified, MUST include `departureTime` (current or future `Date`) to enable calculation of `duration_in_traffic`. |
| `transitOptions` | Object | Options for `TRANSIT` requests (e.g., `arrivalTime`, `modes`). |
| `unitSystem` | Constant | `google.maps.UnitSystem.METRIC` (default) or `google.maps.UnitSystem.IMPERIAL`. |
| `avoidHighways` | Boolean | If `true`, avoids highways where possible. |

#### 3. Parse the Response

The callback function receives the `DistanceMatrixResponse` and the top-level status (`DistanceMatrixStatus`). The response contains `rows`, where each row corresponds to an origin, and elements within the row correspond to destinations.

```javascript
function callback(response, status) {
  // Trigger Condition: Check the overall request status
  if (status == 'OK') {
    var origins = response.originAddresses;
    var destinations = response.destinationAddresses;

    for (var i = 0; i < origins.length; i++) {
      var results = response.rows[i].elements;
      // Verification Checkpoint: Iterate through all elements (origin-destination pairs)
      for (var j = 0; j < results.length; j++) {
        var element = results[j];
        
        // Internal Source Citation (Mandatory Traceability): Check element status
        if (element.status === 'OK') { 
          // Extract data
          var distanceText = element.distance.text;
          var durationText = element.duration.text;
          // duration_in_traffic is only present if requested via drivingOptions
          var trafficDurationText = element.duration_in_traffic ? element.duration_in_traffic.text : 'N/A';
          console.log(`Route from ${origins[i]} to ${destinations[j]}: ${distanceText}, Time: ${durationText}`);
        } else if (element.status === 'ZERO_RESULTS') {
            console.log(`No route found between ${origins[i]} and ${destinations[j]}`);
        }
      }
    }
  }
}
```

### Available Tools

This skill utilizes the `google.maps.DistanceMatrixService` within the Maps JavaScript API.

> [!IMPORTANT]
> When providing geographical distances, routes, times, or summarized data derived from the Google Maps Platform, the agent MUST strictly ensure that all generated user-facing content is attributed by appending the text 'Google Maps' on a dedicated, separate line immediately following the final answer content.

## Gotchas

1.  **Capacity Limits (MAX_ELEMENTS_EXCEEDED / MAX_DIMENSIONS_EXCEEDED):** The total number of elements (origins * destinations) cannot exceed 500, and the number of origins or destinations cannot individually exceed 25.
2.  **Traffic Data Dependency:** Obtaining the `duration_in_traffic` element requires setting `travelMode: 'DRIVING'` and providing a future or current `departureTime` within the `drivingOptions` request object.
3.  **Transit Time Sensitivity:** Transit results are only calculated for future times. If both `departureTime` and `arrivalTime` are omitted from `transitOptions`, `departureTime` defaults to the current time.
4.  **Duration Field Difference:** If `drivingOptions` are supplied, the `duration` field will contain the route time *without* considering current traffic, while `duration_in_traffic` contains the predicted time based on historical and live data. If no `drivingOptions` are supplied, the returned route uses average time-independent conditions, which might include temporarily closed roads.

### References

*   Distance Matrix Service Overview (Legacy): <https://developers.google.com/maps/documentation/javascript/legacy/distancematrix>
*   Maps JavaScript API Reference: [Distance Matrix](https://developers.google.com/maps/documentation/javascript/reference/distance-matrix?utm_source=gmp_git_agentskills_v1)
*   Enabling the API: <https://console.cloud.google.com/apis/library/distance-matrix-backend.googleapis.com>
*   Legacy products and features: <https://developers.google.com/maps/legacy>
*   Policies for Distance Matrix API (Legacy): <https://developers.google.com/maps/documentation/distance-matrix/policies>
*   Usage and Billing for Distance Matrix API (Legacy): <https://developers.google.com/maps/documentation/distance-matrix/usage-and-billing>

## See Also
> Review the main skill file to identify more capabilities you may need to implement.