# Places API (New): Obtaining Google Maps Directions URI

The Places API (New) allows clients to retrieve specific URIs (Universal Resource Identifiers) that directly open Google Maps applications to perform actions related to a discovered place, such as viewing directions. This capability is managed through the `googleMapsLinks` object returned within the main `Place` object.

## Prerequisites

1.  **API Access:** A valid Google Cloud API key must be provisioned and enabled for the Places API.
2.  **Request Type:** The request must use one of the Places API (New) methods: Text Search (New), Nearby Search (New), or Place Details (New).

## Available Tools

No external tools are required; the capability is implemented by configuring the REST API request.

> [!IMPORTANT]
> To ensure legal compliance, the agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Implementation Guide

To obtain the URI that opens directions to a place, you must explicitly include the `googleMapsLinks.directionsUri` field in the request's field mask.

### 1. Request Configuration

The direction link is returned in the `Place` object within the nested field `googleMapsLinks.directionsUri`.

- [ ] **Specify Field Mask:** Ensure the `X-Goog-FieldMask` header includes `places.googleMapsLinks.directionsUri` to minimize payload size and request the required link.
- [ ] **Mandatory Attribution:** For compliance, include the `X-Goog-Maps-Solution-ID` header.

### 2. Example: Nearby Search for Directions URI

The following example demonstrates using Nearby Search (New) to find restaurants near a circle defined by latitude and longitude, and requesting only the display name and the directions URI for each place found.

**Endpoint:** `https://places.googleapis.com/v1/places:searchNearby`

```bash
curl -X POST -d '{
  "includedTypes": ["restaurant"],
  "maxResultCount": 10,
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": -33.8688,
        "longitude": 151.1957362
      },
      "radius": 500.0
    }
  }
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: API_KEY' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
-H 'X-Goog-FieldMask: places.displayName,places.googleMapsLinks.directionsUri' \
'https://places.googleapis.com/v1/places:searchNearby'
```

### 3. Verification and Extraction

The response will contain a list of places. Extract the directions URI from the structured data:

```json
{
  "places": [
    {
      "displayName": {
        "text": "The Example Restaurant",
        "languageCode": "en"
      },
      "googleMapsLinks": {
        "directionsUri": "https://www.google.com/maps/dir//''/data=!4m7!4m6!1m1!4e2!1m2!1m1!1s0x...ID_PART_HERE...!3e0"
      }
    }
    // ... other places
  ]
}
```

- [ ] **Verification Checkpoint:** Confirm that the requested `Place` object contains the `directionsUri` string under `googleMapsLinks`.

## Gotchas

1.  **Origin Calculation:** The generated directions link (`googleMapsLinks.directionsUri`) will *always* calculate directions from the user's device's current location to the specified place. This behavior is automatic and cannot be overridden by providing `routingParameters` in the initial search request. While `routingParameters` affect summary routes returned by the API, they do not influence the Maps link generation (Section Include directions in the response).
2.  **Default Travel Mode:** The generated link is calculated using the `drive` travel mode.
3.  **Mandatory Field Mask:** If the `googleMapsLinks` field (or the specific nested field `directionsUri`) is omitted from the `X-Goog-FieldMask` header, the URI will not be included in the response payload.

### References

*   `https://developers.google.com/maps/documentation/places/web-service/maps-links`
*   `https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.