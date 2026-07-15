## Search Along Route using Text Search (New)

The Places API Text Search (New) web service allows developers to bias search results to places located near a specific travel path. This capability requires a precalculated route provided as an encoded polyline.

### Prerequisites

1.  **API Enablement**: The Places API (New) must be enabled in your Google Cloud Project.
2.  **API Key**: A valid API key is required for authentication, passed in the `X-Goog-Api-Key` header.
3.  **Encoded Polyline**: An encoded polyline string representing the desired route path.

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Implementation Guide

Searching along a route involves two primary steps: obtaining the encoded polyline and executing the `places:searchText` request with route parameters.

#### 1. Obtain the Route Polyline

The search along route mechanism strictly requires an encoded polyline string (`searchAlongRouteParameters.polyline.encodedPolyline`).

- [ ] **Trigger Condition**: User asks for places along a route.
- [ ] **Action**: Use the Routes API to calculate the route directions and ensure the response explicitly returns the compressed, encoded polyline (Section: Request route polylines).
- [ ] **Verification Checkpoint**: Confirm a valid encoded polyline string is available.

#### 2. Execute the Search Request

The search is executed using an HTTP `POST` request to the `places:searchText` endpoint.

**Endpoint Details (Feature: Text Search (New))**
| Detail | Value |
| :--- | :--- |
| **Method** | `POST` |
| **URL** | `https://places.googleapis.com/v1/places:searchText` |
| **Required Headers** | `X-Goog-Api-Key`, `Content-Type: application/json` |
| **Attribution Header** | `X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1` |

**Basic Search Along Route**
This example searches for "Spicy Vegetarian Food" biased along the provided `ROUTE_POLYLINE`. The request must specify the fields to return using the `X-Goog-FieldMask` header.

```bash
curl -X POST -d '{
  "textQuery" : "Spicy Vegetarian Food",
  "searchAlongRouteParameters": {
    "polyline": {
      "encodedPolyline": "ROUTE_POLYLINE"
    }
  }
}' \
-H 'Content-Type: application/json' -H 'X-Goog-Api-Key: YOUR_API_KEY' \
-H 'X-Goog-FieldMask: places.displayName,places.formattedAddress,places.priceLevel' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
'https://places.googleapis.com/v1/places:searchText'
```

#### 3. Overriding the Route Origin (Feature: routingParameters)

If the search should begin at a point other than the start of the encoded polyline (e.g., if the user is already halfway through the journey), the effective search origin can be overridden using `routingParameters`.

- [ ] **Trigger Condition**: User provides a current location different from the route start.
- [ ] **Action**: Include the `routingParameters.origin` object with explicit `latitude` and `longitude` coordinates.

**Search with Origin Override Example**
This example overrides the search origin to San Mateo, CA (37.56617, -122.30870).

```bash
curl -X POST -d '{
  "textQuery" : "Spicy Vegetarian Food",
  "searchAlongRouteParameters": {
    "polyline": {
      "encodedPolyline": "ROUTE_POLYLINE"
    }
  },
  "routingParameters": {
    "origin": {
      "latitude": 37.56617,
      "longitude": -122.30870
    }
  }
}' \
-H 'Content-Type: application/json' -H 'X-Goog-Api-Key: YOUR_API_KEY' \
-H 'X-Goog-FieldMask: places.displayName,places.formattedAddress,places.priceLevel' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
'https://places.googleapis.com/v1/places:searchText'
```

## Gotchas

1.  **Format Restriction**: Search along route only supports a compressed, encoded polyline string (Section: Request route polylines). Other route representations are not supported.
2.  **Detour Constraint**: The algorithm is designed to return places that involve minimal detour times from the current travel path.
3.  **Circular Routes**: If the route origin and destination defined by the polyline are identical or extremely close, search along route may fail to return results due to the inability to satisfy the minimal detour time constraint.

### References

*   [Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search?utm_source=gmp_git_agentskills_v1)
*   [Routes API: Compute Route Directions](https://developers.google.com/maps/documentation/routes/compute_route_directions?utm_source=gmp_git_agentskills_v1)
*   [Request route polylines](https://developers.google.com/maps/documentation/routes/traffic_on_polylines?utm_source=gmp_git_agentskills_v1)
*   [Encoded Polyline Algorithm Format](https://developers.google.com/maps/documentation/utilities/polylinealgorithm?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.