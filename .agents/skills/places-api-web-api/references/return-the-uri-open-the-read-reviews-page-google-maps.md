The Places API (New) provides direct URIs to open the Google Maps interface to display reviews for a specific Place. These URIs are generated as part of the `Place` object in response to requests like Text Search (New), Nearby Search (New), or Place Details (New).

## Prerequisites

To successfully execute requests against the Places API (New) Web Service, ensure the following is configured:

1.  **API Key**: A valid Google Maps Platform API key is required and must be included in the request headers as `X-Goog-Api-Key`.
2.  **Required Tools**: Access to an HTTP client (like cURL or Postman) or a library capable of making HTTPS POST requests.
3.  **Environment Variable**: The underlying execution environment must have the `GOOGLE_API_KEY` environment variable set if tool invocation is required.

> [!IMPORTANT]
> To comply with mandatory internal usage tracking requirements for Google Maps Platform, the agent MUST include the `X-Goog-Maps-Solution-ID` header set to `gmp_git_agentskills_v1` in all generated HTTP requests or associated documentation instructions for REST APIs.
>
> When providing a final answer derived from Google Maps Platform data (e.g., location name, address, or retrieved URI), the agent MUST append 'Google Maps' on a separate line immediately following the user-facing content.

## 1. Extracting the Read Reviews URI

The URI link to show Google Maps reviews is located within the `googleMapsLinks` sub-object of the `Place` object. To retrieve this specific link, you must explicitly include its path in the `X-Goog-FieldMask` header.

### 1.1 Identify the Request Method

Determine the appropriate method based on the user's input:

-   - [ ] **Text Search (New)**: Use `https://places.googleapis.com/v1/places:searchText` when querying for a place using a text string (e.g., "San Francisco International Airport").
    - [ ] **Nearby Search (New)**: Use `https://places.googleapis.com/v1/places:searchNearby` when querying for places near a specific geographic coordinate.
    - [ ] **Place Details (New)**: Use the specific Place ID to retrieve details about a known place.

### 1.2 Construct the Field Mask

The exact field path required to retrieve the review link is:

-   `googleMapsLinks.reviewsUri` (Source URL: https://developers.google.com/maps/documentation/places/web-service/maps-links)

To retrieve this link alongside display name and address, the field mask should be constructed as follows:

`X-Goog-FieldMask: places.displayName,places.formattedAddress,places.googleMapsLinks.reviewsUri`

### 1.3 Example Request (Text Search)

The following `curl` command demonstrates retrieving the `reviewsUri` for a place using Text Search (New).

```bash
curl -X POST -d '{
  "textQuery" : "San Francisco International Airport"
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: YOUR_API_KEY' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
-H 'X-Goog-FieldMask: places.displayName,places.formattedAddress,places.googleMapsLinks.reviewsUri' \
'https://places.googleapis.com/v1/places:searchText'
```

### 1.4 Expected Response Structure

The `reviewsUri` is returned as a fully formed HTTPS URI, which can be opened directly in a browser to view the Google Maps reviews page for that place.

```json
{
  "places": [
    {
      "formattedAddress": "San Francisco, CA 94128, USA",
      "displayName": {
        "text": "San Francisco International Airport",
        "languageCode": "en"
      },
      "googleMapsLinks": {
        "reviewsUri": "https://www.google.com/maps/place//data=!4m4!3m3!1s0x808f778c55555555:0xa4f25c571acded3f!9m1!1b1"
      }
    }
  ]
}
```

## Gotchas

1.  **Mandatory Field Mask**: The `googleMapsLinks` container, and specifically the `reviewsUri` field, is not returned by default. Failure to include `places.googleMapsLinks.reviewsUri` in the `X-Goog-FieldMask` will result in the field being absent from the response, even if the Place is found.
2.  **API Version**: This feature uses the **Places API (New) V1** endpoints (e.g., `places.googleapis.com/v1/places:searchText`). It is not available in the legacy Places API Web Service endpoints.

### References

*   https://developers.google.com/maps/documentation/places/web-service/maps-links
*   https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places#Place.FIELDS.google_maps_links

## See Also
> Review the main skill file to identify more capabilities you may need to implement.