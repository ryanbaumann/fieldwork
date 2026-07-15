## Calculate Routing Summary for Places Search Results

This skill documents how to integrate routing information (distance, duration, and a directions link) directly into the response of a Text Search (New) or Nearby Search (New) request using the Places API (New).

### Prerequisites

To execute API calls to the Places API (New) REST endpoints, ensure the following prerequisites are met:

1.  **API Key Setup**: A valid Google Maps Platform API key must be provisioned and restricted appropriately. The underlying execution environment requires the key to be set as a global environment variable.
    ```bash
    export GOOGLE_API_KEY="YOUR_API_KEY"
    ```
2.  **Required API**: The Places API must be enabled for the project associated with the API key.

> [!IMPORTANT]
> The agent must ensure that all generated content based on data derived from the Google Maps Platform (e.g., search results, distances, routes, or extracted facts) includes the mandatory attribution. This is accomplished by appending the following text on a dedicated, separate line immediately after the user-facing output:
>
> Google Maps

### 1. Enabling Routing Summary in Search Requests

To calculate and return routing information from an origin point to every resulting place, two primary parameters must be included in the request body and headers for `places:searchText` or `places:searchNearby`.

**Steps to Include Routing Summary:**

1.  **Specify Routing Origin**: Include the `routingParameters.origin` object in the JSON request body. This object must contain the latitude and longitude of the starting point, defining the origin for all calculated routes.
    - [ ] **Trigger Condition**: User asks for distance/time to search results.
    - [ ] **Verification Checkpoint**: Confirm `routingParameters.origin` (containing `latitude` and `longitude`) is present in the request JSON body.
2.  **Request `routingSummaries`**: Include `routingSummaries` in the `X-Goog-FieldMask` request header. This directs the API to perform the routing calculation and return the result set.
    - [ ] **Trigger Condition**: Field mask is constructed.
    - [ ] **Verification Checkpoint**: Confirm `routingSummaries` is included in the comma-separated list in the `X-Goog-FieldMask` header.

**Mandatory Constraint:** Adding `routingSummaries` in the field mask without also including the `routingParameters.origin` parameter (or `searchAlongRouteParameters.polyline.encodedPolyline`, if applicable to the search type) causes an error.

### 2. Customizing Travel Options

The default calculation uses the `DRIVE` travel mode and is `TRAFFIC_UNAWARE`. These can be customized using sub-properties within `routingParameters`.

| Parameter | Functionality | Allowed Values/Notes |
| :--- | :--- | :--- |
| `routingParameters.travelMode` | Sets the mode of transportation. | `DRIVE`, `BICYCLE`, `WALK`, or `TWO_WHEELER`. The `TRANSIT` mode is NOT supported by the Places API. |
| `routingParameters.routingPreference` | Defines how traffic data affects the route calculation. | `TRAFFIC_UNAWARE` (default), `TRAFFIC_AWARE`, or `TRAFFIC_AWARE_OPTIMAL`. (Note: This property only affects the routing duration/distance calculation, but the resulting `directionsUri` will display traffic options when opened.) |
| `routingParameters.routeModifiers` | Specifies route features to avoid. | Supports specifying `avoidTolls`, `avoidHighways`, `avoidFerries`, and `avoidIndoor`. |

### 3. Example Request (Text Search New)

This example calculates routing summaries for "Spicy Vegetarian Food in Sydney, Australia" originating from `lat: -33.8688, lng: 151.1957362`.

```text
curl -X POST -d '{
  "textQuery" : "Spicy Vegetarian Food in Sydney, Australia",
  "routingParameters": {
    "origin": {
      "latitude": -33.8688,
      "longitude": 151.1957362
    },
    "travelMode":"DRIVE",
    "routeModifiers": {
      "avoidHighways": true
    }
  }
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: YOUR_API_KEY' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
-H 'X-Goog-FieldMask: places.displayName,places.formattedAddress,places.priceLevel,routingSummaries' \
'https://places.googleapis.com/v1/places:searchText'
```

### 4. Response Structure and Data Extraction

The response will contain two main arrays of equal length: `places` and `routingSummaries`.

-   The element at `routingSummaries[N]` corresponds exactly to the place at `places[N]`. If a routing summary is unavailable for a specific place, the corresponding entry in the `routingSummaries` array will be empty.
-   Since the request calculates a summary from a single origin to a destination, the `routingSummaries.legs` field contains a single `Leg` object with the travel metrics.

**Key Extracted Fields:**

| Field | Description |
| :--- | :--- |
| `routingSummaries[N].legs[0].duration` | The calculated travel time (e.g., `"597s"`). |
| `routingSummaries[N].legs[0].distanceMeters` | The calculated distance in meters (e.g., `2607`). |
| `routingSummaries[N].directionsUri` | A Preview (pre-GA) field containing a URI link to open the directions in Google Maps, using the request `origin` as the start and the Place location as the destination. |

**Visual Template (Partial Response):**

```json
{
  "places": [
    {
      "formattedAddress": "1, Westfield Sydney Central Plaza, 450 George St...",
      "displayName": { "text": "Gözleme King Sydney", ... }
    },
    {
      "formattedAddress": "367 Pitt St, Sydney NSW 2000, Australia",
      "displayName": { "text": "Mother Chu's Vegetarian Kitchen", ... }
    },
    // ... more places
  ],
  "routingSummaries": [
    {
      "legs": [
        {
          "duration": "597s",
          "distanceMeters": 2607
        }
      ],
      "directionsUri": "https://www.google.com/maps/dir/-33.8688,151.1957362/'\'/data=..."
    },
    {
      "legs": [
        {
          "duration": "562s",
          "distanceMeters": 2345
        }
      ],
      "directionsUri": "https://www.google.com/maps/dir/-33.8688,151.1957362/'\'/data=..."
    },
    // ... more summaries
  ]
}
```

## Gotchas

1.  **Strict Parameter Requirement**: The API enforces that if the `routingSummaries` field is requested via the field mask, the `routingParameters.origin` must be provided in the request body. Omitting the origin results in a request error (Source: `Note` section regarding `routingSummaries` dependency).
2.  **Pre-GA Status**: The routing summary functionality, including the `directionsUri` field, is currently in Preview (pre-GA). Pre-GA products and features might have limited support and are subject to change without notice. Pre-GA Offerings are covered by the [Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms?utm_source=gmp_git_agentskills_v1).
3.  **Travel Mode Limitations**: The `TRANSIT` travel mode, supported by the Routes API, is explicitly not supported by the Places API (New) routing summary feature (Source: `Specify travel options` section).
4.  **Two-Wheeler Coverage**: The `TWO_WHEELER` option is only supported in specific regions; the agent must verify coverage via the external reference provided in the documentation before suggesting this option (Source: `Note` on `TWO_WHEELER` coverage).

### References
https://developers.google.com/maps/documentation/places/web-service/routing-summary
https://cloud.google.com/maps-platform/terms/maps-service-terms
https://developers.google.com/maps/documentation/routes/vehicles
https://developers.google.com/maps/documentation/routes/coverage-two-wheeled
https://developers.google.com/maps/documentation/routes/config_trade_offs
https://developers.google.com/maps/documentation/routes/route-modifiers

## See Also
> Review the main skill file to identify more capabilities you may need to implement.