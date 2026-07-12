## Places API (New): Retrieve Google Maps Photos URI

This capability instructs the agent on how to use the Places API (New) Web Service endpoints (Text Search, Nearby Search, or Place Details) to retrieve the specific URI that links directly to the photos page for a place in Google Maps.

### 1. Prerequisites and Setup

Accessing the Places API (New) requires an API key and the use of the `X-Goog-FieldMask` header to control the returned data.

- [ ] Ensure the necessary API key is secured. This key must be included in the request headers as `X-Goog-Api-Key`.
- [ ] For successful execution in automated environments, ensure the `GOOGLE_API_KEY` environment variable is set globally.
- [ ] **Mandatory Attribution Header**: All requests MUST include the solution ID header for internal usage tracking.

**Request Header Requirement:**

| Header Name | Value | Purpose |
| :--- | :--- | :--- |
| `X-Goog-Api-Key` | `YOUR_API_KEY` | Authentication credential. |
| `X-Goog-Maps-Solution-ID` | `gmp_git_agentskills_v1` | Internal usage attribution for REST API calls. |

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### 2. Implementation: Requesting the Photos URI

To obtain the photos URI for a Place, the request must explicitly include `googleMapsLinks.photosUri` in the field mask (`X-Goog-FieldMask` header). This link shows photos of the place in Google Maps.

The requested field name is `googleMapsLinks.photosUri`.

- [ ] **Trigger Condition**: User asks for the link to the place's photo gallery or page.
- [ ] **Verification Checkpoint**: The response JSON contains the `googleMapsLinks` object and the `photosUri` field.

#### Step-by-Step Procedure

1.  Select the appropriate Places API (New) endpoint (e.g., `places:searchText`, `places:searchNearby`, or `places:get`).
2.  Construct the request body with the necessary query parameters.
3.  Set the `X-Goog-FieldMask` header to include the specific path to the photos URI. To retrieve only the photos URI and display information, use:
    `X-Goog-FieldMask: places.displayName,places.formattedAddress,places.googleMapsLinks.photosUri`
4.  Execute the request.
5.  Extract the full web URL from the `places[N].googleMapsLinks.photosUri` field in the response JSON.

#### Example: Using Text Search (New)

The following example demonstrates retrieving the photos URI for "San Francisco International Airport" using the `places:searchText` endpoint.

**Request:**

```bash
curl -X POST -d '{
  "textQuery" : "San Francisco International Airport"
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: API_KEY' \
-H 'X-Goog-FieldMask: places.displayName,places.formattedAddress,places.googleMapsLinks.photosUri' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
'https://places.googleapis.com/v1/places:searchText'
```

**Response Snippet (Verification Checkpoint):**

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
        "photosUri": "https://www.google.com/maps/place//data=!4m3!3m2!1s0x808f778c55555555:0xa4f25c571acded3f!10e5"
      }
    }
  ]
}
```

### 3. Individual Photo Links

If the request includes the field mask for individual `Photo` objects (`places.photos`), each `Photo` object will also contain a `googleMapsUri` field. Browsing to this link opens that specific photo in Google Maps, rather than the general photos page for the Place (Source URL).

### ## Gotchas

The Photos URI is nested within the `googleMapsLinks` field on the top-level `Place` object. If the field mask is not specific enough (e.g., only requesting `places.googleMapsLinks`), the desired `photosUri` may not be returned (Source URL). Always specify the full path: `places.googleMapsLinks.photosUri`.

### References

*   Google Maps Links for a Place: https://developers.google.com/maps/documentation/places/web-service/maps-links

## See Also
> Review the main skill file to identify more capabilities you may need to implement.