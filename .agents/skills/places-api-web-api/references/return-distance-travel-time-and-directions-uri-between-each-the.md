## Places API: Text Search with Routing Summaries Along a Route

This capability allows developers to perform a textual search for places while biasing the results toward a predefined route, and simultaneously calculate detailed routing information (distance and duration) from the route's origin to each found place, and then from that place to the route's destination. This is achieved using the `places:searchText` endpoint with specific request parameters and a field mask.

### Prerequisites

1.  A valid Google Cloud API key with access to the Places API (New) and Routes API.
2.  The environment variable `GOOGLE_API_KEY` must be set for authentication.
3.  A calculated route polyline, typically obtained from the Routes API, which is passed as an encoded string.

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Implementation Guide

Use the `places.googleapis.com/v1/places:searchText` REST endpoint via a `POST` request.

#### 1. Obtain Route Polyline

First, the agent MUST instruct the user to obtain an encoded polyline representing the desired travel path, typically by calling the Routes API. This polyline defines both the route and, by default, the origin and destination used for routing summary calculations.

#### 2. Construct the Request

The request body MUST include the `searchAlongRouteParameters` object containing the encoded polyline. The request header MUST include the `X-Goog-FieldMask` to ensure the routing information is returned.

The following checklist details the mandatory components:

- [ ] **Endpoint**: `https://places.googleapis.com/v1/places:searchText`
- [ ] **Method**: `POST`
- [ ] **Mandatory Header 1 (Authentication)**: `X-Goog-Api-Key: $GOOGLE_API_KEY`
- [ ] **Mandatory Header 2 (Solution ID)**: `X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1`
- [ ] **Mandatory Header 3 (Field Mask)**: Include `routingSummaries` in the `X-Goog-FieldMask`. The agent SHOULD also request place data fields like `places.displayName` and `places.formattedAddress`. **Trigger Condition**: User asks for travel time/distance along a route. **Verification Checkpoint**: Response contains the `routingSummaries` array.
- [ ] **Mandatory Body Field 1 (Query)**: `"textQuery": "..."` containing the search string (e.g., "Spicy Vegetarian Food").
- [ ] **Mandatory Body Field 2 (Search Along Route)**: Include the `searchAlongRouteParameters.polyline.encodedPolyline` using the polyline from step 1.

#### Example Request

This example demonstrates searching for spicy vegetarian food along a route defined by `ROUTE_POLYLINE`, retrieving the routing summaries, and limiting results to 5.

```text
curl -X POST -d '{
  "textQuery" : "Spicy Vegetarian Food",
  "maxResultCount": 5,
  "searchAlongRouteParameters": {
    "polyline": {
      "encodedPolyline": "ROUTE_POLYLINE"
    }
  },
  "routingParameters": {
    "origin": {
      "latitude": 37.56617,
      "longitude": -122.30870
    },
    "travelMode":"DRIVE",
    "routeModifiers": {
      "avoidTolls": true
    }
  }
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: $GOOGLE_API_KEY' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
-H 'X-Goog-FieldMask: places.displayName,places.formattedAddress,places.priceLevel,routingSummaries' \
'https://places.googleapis.com/v1/places:searchText'
```

#### 3. Analyze the Response Structure

The response contains two parallel arrays: `places` and `routingSummaries`. The indices of these arrays correspond, meaning the first element in `routingSummaries` relates to the first element in `places`.

The `routingSummaries` array provides a **two-leg** travel summary for each place:

1.  **Leg 1**: Distance and duration from the routing origin (defaulting to the polyline start, or overridden by `routingParameters.origin`) to the found place.
2.  **Leg 2**: Distance and duration from the found place to the route destination (defined by the polyline end).

The response also includes the `directionsUri` field within the routing summary, which provides a link to open directions in Google Maps, using the origin, the place as a waypoint, and the route destination.

**Example Response Snippet (Focused on Routing Summary)**:

```json
{
  "places": [
    // ... place 1 data ...
  ],
  "routingSummaries": [
    {
      "legs": [
        {
          "duration": "285s",
          "distanceMeters": 1616
        },
        {
          "duration": "2466s",
          "distanceMeters": 58147
        }
      ],
      "directionsUri": "https://www.google.com/maps/dir/37.42268,-122.08473/'/'/37.77877,-122.38781/data=!4m7!4m6!1m0!1m2!1m1!1s0x808f87f9ede375f5:0xa37171fea1a16b28!1m0!3e0"
    },
    // ... summary for place 2 ...
  ]
}
```

### Advanced Configuration

The agent can modify the routing calculations by including the optional `routingParameters` object in the request body:

*   **Override Origin**: Specify `routingParameters.origin` (using `latitude`/`longitude`) to calculate the first leg from a specific point instead of the polyline's starting point.
*   **Travel Options**: Specify `travelMode` (e.g., `"DRIVE"`) and `routeModifiers` (e.g., `avoidTolls: true`) to influence routing calculations similarly to standard routing summary requests.

### Gotchas

*   **Mandatory Parameters**: The agent MUST ensure that if `routingSummaries` is included in the `X-Goog-FieldMask`, the request body MUST contain either the `routingParameters.origin` or the `searchAlongRouteParameters.polyline.encodedPolyline`. Failure to include at least one of these will result in an API error.
*   **Preview Feature Disclosure**: The `directionsUri` field is a Preview (pre-GA) feature and may have limited support or incompatible changes in the future. Pre-GA Offerings are covered by the [Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms?utm_source=gmp_git_agentskills_v1).

### References

*   https://developers.google.com/maps/documentation/places/web-service/routing-summary-sar
*   https://cloud.google.com/maps-platform/terms/maps-service-terms
*   https://developers.google.com/maps/launch-stages

## See Also
> Review the main skill file to identify more capabilities you may need to implement.