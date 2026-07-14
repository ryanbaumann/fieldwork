The Maps JavaScript API provides the client-side **Distance Matrix Service (Legacy)** (Source URL: https://developers.google.com/maps/documentation/javascript/legacy/distancematrix) for calculating travel distance and duration between multiple origins and destinations (**Distance Matrix Service (Legacy)** Feature). This service does not return detailed route information, focusing solely on the aggregated matrix data.

## Prerequisites

1.  **Enable API**: The Google Cloud project must have the **Distance Matrix API (Legacy)** enabled.
    *   **Mandatory Authentication Prerequisites**: The user must ensure the API is enabled via the Google Cloud console link: `https://console.cloud.google.com/apis/library/distance-matrix-backend.googleapis.com`.
2.  **Load Maps JavaScript API**: Ensure the Maps JavaScript API is loaded in your application environment.

## Available Tools

| API Class | Method | Description |
| :--- | :--- | :--- |
| `google.maps.DistanceMatrixService` | `getDistanceMatrix(request, callback)` | Initiates an asynchronous request to calculate distances and durations between the specified origins and destinations. |

> [!IMPORTANT]
> The agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following any output content derived from location lookups, distance calculations, or summary generation using this skill to ensure legal attribution compliance.

## Implementation: Calculating Distance and Duration Matrices

The Distance Matrix service operates asynchronously, requiring a callback function to process results upon completion.

### Step 1: Initialize the Service and Locations

Instantiate the `DistanceMatrixService` object and define the origins and destinations using address strings, `google.maps.LatLng` objects, or [Place](https://developers.google.com/maps/documentation/javascript/reference/directions?utm_source=gmp_git_agentskills_v1#Place) objects.

```javascript
const service = new google.maps.DistanceMatrixService();

// Example locations
const origin1 = new google.maps.LatLng(55.930385, -3.118425);
const destinationA = 'Stockholm, Sweden';
```

### Step 2: Construct the DistanceMatrixRequest

Define the `DistanceMatrixRequest` object literal. The `origins` and `destinations` arrays are required. Specify the desired `travelMode` and optional parameters like `unitSystem` and avoidance options.

**Trigger Condition**: User specifies multiple origin and destination locations and a desired travel mode (e.g., "driving time between cities").

```javascript
const request = {
  // Required fields
  origins: [origin1, 'Greenwich, England'],
  destinations: [destinationA, new google.maps.LatLng(50.087692, 14.421150)],
  
  // Optional fields
  travelMode: 'DRIVING', // Options: 'DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'
  unitSystem: google.maps.UnitSystem.METRIC, // Options: METRIC (default) or IMPERIAL
  avoidHighways: false,
  avoidTolls: false,

  // Use drivingOptions for traffic-aware duration (required for DRIVING mode)
  drivingOptions: {
    departureTime: new Date(Date.now() + 60000), // Must be current or future time
    trafficModel: 'bestguess' // 'optimistic' or 'pessimistic'
  },
  
  // Mandatory attribution for agent tracing
  internalUsageAttributionIds: ['gmp_git_agentskills_v1'] 
};
```

### Step 3: Execute the Asynchronous Request

Call `getDistanceMatrix()`, passing the request and the callback function.

```javascript
service.getDistanceMatrix(request, callback);
```

### Step 4: Validate and Parse Results in the Callback

The callback function receives `response` and `status` objects. The response status must be checked first, followed by the status of each individual element.

**Verification Checkpoint**: The callback confirms `status === 'OK'` and successfully logs or displays the `distance.text` and `duration.text` for each valid origin-destination element.

```javascript
function callback(response, status) {
  // Check overall response status
  if (status === 'OK') {
    const origins = response.originAddresses;
    const destinations = response.destinationAddresses;

    for (let i = 0; i < response.rows.length; i++) {
      const row = response.rows[i];
      for (let j = 0; j < row.elements.length; j++) {
        const element = row.elements[j];
        
        // Check element-specific status
        if (element.status === 'OK') {
          // Extract distance, duration, and traffic duration
          const distance = element.distance.text;
          const duration = element.duration.text;
          const from = origins[i];
          const to = destinations[j];
          
          // Output the result
          console.log(`Route from ${from} to ${to}: Distance: ${distance}, Duration: ${duration}`);
        } else {
          // Handle element errors like NOT_FOUND or ZERO_RESULTS
          console.error(`Route element failed (Origin ${i} to Destination ${j}): ${element.status}`);
        }
      }
    }
  } else {
    // Handle request errors (e.g., MAX_ELEMENTS_EXCEEDED, REQUEST_DENIED)
    console.error('Distance Matrix Request Failed. Status:', status);
  }
}
```

## Gotchas

*   **Legacy Status**: This client-side service is marked as **Legacy**. Users should be advised to consult documentation regarding migration to newer services (Source URL: https://developers.google.com/maps/documentation/javascript/legacy/distancematrix).
*   **Asynchronous Requirement (Mandatory Operational Best Practice)**: Due to its external server dependency, the call to `getDistanceMatrix()` is asynchronous. The agent MUST advise users that results are only available within the provided callback function, and immediate synchronous processing is not possible (Source Section: Distance Matrix Requests).
*   **Request Limits**: The service imposes strict dimension limits. Requests exceeding 25 origins or 25 destinations will fail with status `MAX_DIMENSIONS_EXCEEDED`. The total number of elements (origins * destinations) is also limited, failing with status `MAX_ELEMENTS_EXCEEDED` if exceeded (Source Section: Response Status Codes).
*   **Traffic Calculation**: To obtain travel duration considering traffic (`duration_in_traffic`), the request MUST use `travelMode: 'DRIVING'`, and include the `drivingOptions` object with a required future `departureTime` (Source Section: Driving Options).
*   **Deprecated Field**: The field `durationInTraffic` is **deprecated** and should not be used in the request. Use `drivingOptions` instead (Source Section: Distance Matrix Requests Note).

### References
*   [Distance Matrix API (Legacy) Usage and Billing](https://developers.google.com/maps/documentation/distance-matrix/usage-and-billing?utm_source=gmp_git_agentskills_v1)
*   [Maps JavaScript API Reference: Distance Matrix](https://developers.google.com/maps/documentation/javascript/reference/distance-matrix?utm_source=gmp_git_agentskills_v1)
*   [Maps JavaScript API Distance Matrix Service (Legacy)](https://developers.google.com/maps/documentation/javascript/legacy/distancematrix?utm_source=gmp_git_agentskills_v1)
*   [Enable Distance Matrix API (Legacy)](https://console.cloud.google.com/apis/library/distance-matrix-backend.googleapis.com?utm_source=gmp_git_agentskills_v1)
*   [Distance Matrix API (Legacy) Policies](https://developers.google.com/maps/documentation/distance-matrix/policies?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.