## Places API: Search Along Route with Routing Summaries (Text Search, REST)

This capability uses the Text Search (New) REST endpoint to search for places along an encoded polyline and return travel distance and duration metrics (routing summaries) for each matching place relative to the route's origin and destination.

### Prerequisites and Setup

1.  **API Key**: Ensure you have a valid Google Maps Platform API Key enabled for the Places API (New) and the Routes API.
2.  **Environment Variable**: Set the `GOOGLE_API_KEY` environment variable for authentication.
3.  **Route Polyline**: Obtain a route polyline beforehand using the Routes API. The polyline must be URL-safe encoded.

### 1. Implementation Overview

The functionality is accessed using an HTTP POST request to the `searchText` endpoint, providing the search query, the route polyline, and specifying the required fields in the `X-Goog-FieldMask` header.

#### API Endpoint
`POST https://places.googleapis.com/v1/places:searchText`

### 2. Mandatory Integration Steps

- [ ] **Generate Route Polyline**: Use the Routes API to calculate the base route and ensure the response includes the encoded polyline. (Source: `developers.google.com/maps/documentation/places/web-service/routing-summary-sar`)
- [ ] **Construct Request Body**: Include the `textQuery` (search term) and the `searchAlongRouteParameters` object containing the `encodedPolyline`.
- [ ] **Define Field Mask**: Ensure the `routingSummaries` field is explicitly included in the `X-Goog-FieldMask` header to retrieve the travel data. Also include required place fields (e.g., `places.displayName`).
- [ ] **Specify Origin (Optional)**: If you need to override the polyline's inherent origin, include the `routingParameters.origin` object with `latitude` and `longitude`.
- [ ] **Specify Travel Options (Optional)**: Configure optional parameters like `travelMode` (e.g., `DRIVE`) or `routeModifiers` (e.g., `avoidTolls: true`) within the `routingParameters` object.

### 3. Example Request (cURL)

The following example searches for "Spicy Vegetarian Food" along a placeholder polyline, requesting the routing summaries and relevant place information.

```bash
curl -X POST -d '{
  "textQuery" : "Spicy Vegetarian Food",
  "searchAlongRouteParameters": {
    "polyline": {
      "encodedPolyline": "ROUTE_POLYLINE"
    }
  },
  "routingParameters": {
    "travelMode":"DRIVE"
  }
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: YOUR_API_KEY' \
-H 'X-Goog-FieldMask: places.displayName,places.formattedAddress,places.priceLevel,routingSummaries' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
'https://places.googleapis.com/v1/places:searchText'
```

### 4. Interpreting Routing Summaries

The response contains two main parallel arrays: `places` and `routingSummaries`. The order of entries in `routingSummaries` corresponds directly to the order of places in the `places` array.

Each entry in `routingSummaries` contains a `legs` array which details a **two-leg** trip:

1.  **First Leg**: Duration and distance from the specified routing origin (or polyline origin by default) to the matched place.
2.  **Second Leg**: Duration and distance from the matched place to the route's final destination (implied by the polyline).

The response also includes the **Preview** `directionsUri` field for each place, which provides a link to Google Maps showing directions from the origin to the place (as a waypoint) and then to the route destination.

#### Example Response Snippet

```json
{
  "places": [
    // ... Place 1 details ...
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
      "directionsUri": "https://www.google.com/maps/dir/..."
    },
    // ... summaries for subsequent places ...
  ]
}
```

> [!IMPORTANT]
> When generating output based on geographic data, distances, routes, or specific locations derived from this API, the agent MUST append the following attribution on a dedicated, separate line immediately following the user-facing content:
> Google Maps

## Gotchas

1.  **Mandatory Parameters**: Requesting the `routingSummaries` field mask requires that the request body explicitly includes either the `routingParameters.origin` parameter or the `searchAlongRouteParameters.polyline.encodedPolyline` parameter. Failure to include one of these will cause an error (Note, developers.google.com/maps/documentation/places/web-service/routing-summary-sar).
2.  **Preview Status**: The overall combined feature, including the `directionsUri` field, is currently in Preview (pre-GA). Pre-GA Offerings are covered by the [Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms?utm_source=gmp_git_agentskills_v1). Changes might occur that are not backward compatible. Consult the [launch stage descriptions](https://developers.google.com/maps/launch-stages?utm_source=gmp_git_agentskills_v1) for details.

### References
https://developers.google.com/maps/documentation/places/web-service/routing-summary-sar
https://cloud.google.com/maps-platform/terms/maps-service-terms
https://developers.google.com/maps/launch-stages
https://developers.google.com/maps/documentation/places/web-service/text-search

## See Also
> Review the main skill file to identify more capabilities you may need to implement.