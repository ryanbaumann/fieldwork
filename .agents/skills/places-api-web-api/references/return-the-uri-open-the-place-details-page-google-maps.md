# Places API (New): Retrieving Google Maps Links for a Place

The Places API (New) allows developers to retrieve specific URIs (Uniform Resource Identifiers) that deep-link directly into the Google Maps application, pointing to details, directions, reviews, or photos related to a queried place. The core link to open Google Maps directly to the place details page is contained within the `googleMapsLinks.placeUri` field of the [`Place`](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places?utm_source=gmp_git_agentskills_v1) object.

This capability is available via Text Search (New), Nearby Search (New), and Place Details (New) REST methods.

## Prerequisites

1.  **API Key Setup**: Ensure the `GOOGLE_API_KEY` is configured and enabled for the Places API (New).
2.  **REST Client**: Have a capable REST client (e.g., `curl`, Postman, or a language-specific HTTP library) ready to execute `POST` requests.

> [!IMPORTANT]
> When providing information, facts, distances, routes, or summarized lists derived from Google Maps Platform data, the downstream agent MUST ensure legal compliance by appending the following attribution on a new line immediately following the generated user-facing content:
> Google Maps

## 1. Configure the API Request

To ensure the Google Maps links are returned, the request must include the `googleMapsLinks` object in the Field Mask (`X-Goog-FieldMask`) header.

### 1.1 Specify Field Mask

The agent MUST explicitly include `places.googleMapsLinks` or a specific sub-field like `places.googleMapsLinks.placeUri` in the `X-Goog-FieldMask` HTTP header to return the URIs.

| Google Maps Link | Description | Field Name (for Field Mask) |
| :--- | :--- | :--- |
| Place | Link to open Google Maps to the place. | `googleMapsLinks.placeUri` |
| Directions | Link to open directions to the place in Google Maps. | `googleMapsLinks.directionsUri` |
| Read reviews | Link to show Google Maps reviews of the place. | `googleMapsLinks.reviewsUri` |
| Photos | Link to show photos of the place in Google Maps. | `googleMapsLinks.photosUri` |
| Write review | Link to write a review for the place in Google Maps. | `googleMapsLinks.writeAReviewUri` |

## 2. Implement Place Search and Link Retrieval

The following example demonstrates how to use the Text Search (New) endpoint to search for a place and retrieve all available Google Maps links, including the primary place URI.

### 2.1 Example Request (Text Search)

Use a `POST` request to the `searchText` endpoint, providing the query and ensuring the `X-Goog-FieldMask` is set to include the `googleMapsLinks` field.

```bash
curl -X POST -d '{
  "textQuery" : "San Francisco International Airport"
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: API_KEY' \
-H 'X-Goog-FieldMask: places.displayName,places.formattedAddress,places.googleMapsLinks' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
'https://places.googleapis.com/v1/places:searchText'
```

### 2.2 Extracting the URI from the Response

Upon success, the response JSON will contain the `googleMapsLinks` object under each place result. The URI to open the place details page in Google Maps is extracted from `googleMapsLinks.placeUri`.

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
        "placeUri": "https://maps.google.com/?cid=11885663895765773631",
        "directionsUri": "https://www.google.com/maps/dir//''/data=!4m7!4m6!1m1!4e2!1m2!1m1!1s0x808f778c55555555:0xa4f25c571acded3f!3e0",
        "writeAReviewUri": "https://www.google.com/maps/place//data=!4m3!3m2!1s0x808f778c55555555:0xa4f25c571acded3f!12e1",
        "reviewsUri": "https://www.google.com/maps/place//data=!4m4!3m3!1s0x808f778c55555555:0xa4f25c571acded3f!9m1!1b1",
        "photosUri": "https://www.google.com/maps/place//data=!4m3!3m2!1s0x808f778c55555555:0xa4f25c571acded3f!10e5"
      }
    }
  ]
}
```

The resulting link, `https://maps.google.com/?cid=...`, is the URI that opens Google Maps to the place details page.

## 3. Related Links for Reviews and Photos

The `Review` and `Photo` objects returned in the Places API (New) response also contain individual links.

*   When requesting reviews (e.g., masking `places.reviews`), each individual review object contains `Reviews.googleMapsUri`.
*   When requesting photos (e.g., masking `places.photos`), each individual photo object contains `Photos.googleMapsUri`.

This field provides a direct link to view that specific content (review or photo) within a browser.

## Gotchas

*   **Mandatory Field Mask**: The `googleMapsLinks` field is **not** returned by default. Failure to explicitly include `places.googleMapsLinks` (or specific sub-fields like `places.googleMapsLinks.placeUri`) in the `X-Goog-FieldMask` header will result in the links being omitted from the response.
*   **Directions Origin**: When requesting `googleMapsLinks.directionsUri` via Text Search (New) or Nearby Search (New), the resulting Google Maps directions link is **always** calculated using the user's current location as the origin, even if the request uses `routingParameters` to define a different origin for the core Places search summaries (Section Include directions in the response).
*   **Link Equivalence**: The new `place.googleMapsLinks.placeUri` field contains the same value previously returned by the now-deprecated `place.googleMapsURI` field.

### References

*   [Places API (New): Google Maps Links](https://developers.google.com/maps/documentation/places/web-service/maps-links?utm_source=gmp_git_agentskills_v1)
*   [Place Object Reference (New)](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places?utm_source=gmp_git_agentskills_v1)
*   [Choose Fields for the Places API (New)](https://developers.google.com/maps/documentation/places/web-service/choose-fields?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.