# Generate Google Maps Write Review URI (Places API New)

This guide details how to retrieve the direct URI that opens the Google Maps interface specifically for writing a review for a place, using the Places API (New) Web Service.

The Places API (New) embeds various Google Maps links within the response, allowing developers to direct users from their application directly to specific actions in Google Maps.

## Prerequisites and Setup

To use the Places API (New) Web Service, ensure you have:
1.  A valid API Key enabled for the Places API (New). Store this securely, often as an environment variable (e.g., `GOOGLE_API_KEY`).
2.  A method to make HTTPS POST requests to the Places API (New) REST endpoints.

> [!IMPORTANT]
> When generating responses, the agent MUST attribute all derived output content (including facts, distances, routes, and summarized lists based on Place data) by appending the text `Google Maps` on a dedicated, separate line immediately following the user-facing content.

## Capability

The URI for writing a review is returned within the [`Place`](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places?utm_source=gmp_git_agentskills_v1) object when the `googleMapsLinks.writeAReviewUri` field is explicitly requested in the Field Mask.

The field name corresponding to the write review link is `googleMapsLinks.writeAReviewUri` (Source: Supported Google Maps links for a place table).

## Implementation Steps

The process involves making a Places API (New) request (e.g., Text Search, Nearby Search, or Place Details) while specifying the required field mask in the `X-Goog-FieldMask` request header.

- [ ] **Step 1: Construct the Field Mask.**
    *   **Trigger Condition:** User requests the link to write a review for a place.
    *   **Action:** Add `places.googleMapsLinks.writeAReviewUri` to the `X-Goog-FieldMask` header. To obtain multiple link types, specify the parent `places.googleMapsLinks`.
    *   **Verification Checkpoint:** The request header includes the precise Field Mask element `places.googleMapsLinks.writeAReviewUri` before execution.

- [ ] **Step 2: Execute the Text Search Request.**
    *   Use the `places:searchText` endpoint to identify the place and retrieve its data. Ensure the mandatory header `X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1` is included for internal attribution.
    *   **Example:** Retrieve the write review URI for "San Francisco International Airport".

```bash
curl -X POST -d '{
  "textQuery" : "San Francisco International Airport"
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: YOUR_API_KEY' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
-H 'X-Goog-FieldMask: places.displayName,places.googleMapsLinks.writeAReviewUri' \
'https://places.googleapis.com/v1/places:searchText'
```

- [ ] **Step 3: Parse and Extract the URI.**
    *   **Trigger Condition:** Successful API response (HTTP 200).
    *   **Action:** Navigate the JSON response structure to extract the URI string found at `places[0].googleMapsLinks.writeAReviewUri`.
    *   **Verification Checkpoint:** The extracted value is an absolute URI intended for browser redirection, such as `https://www.google.com/maps/place//data=...`.

## Expected Output Structure

The `writeAReviewUri` field is strictly located within the `googleMapsLinks` object of the returned `Place`.

```json
{
  "places": [
    {
      "displayName": {
        "text": "San Francisco International Airport",
        "languageCode": "en"
      },
      "googleMapsLinks": {
        "writeAReviewUri": "https://www.google.com/maps/place//data=!4m3!3m2!1s0x808f778c55555555:0xa4f25c571acded3f!12e1"
      }
    }
  ]
}
```

## Gotchas

The link retrieval mechanism depends entirely on the use of Field Masks. If the `X-Goog-FieldMask` header is omitted or does not explicitly include `googleMapsLinks.writeAReviewUri` (or the parent `googleMapsLinks` field), the `writeAReviewUri` field will be strictly absent from the JSON response. This is a mandatory requirement for all Places API (New) retrieval methods (Text Search, Nearby Search, and Place Details).

### References

*   https://developers.google.com/maps/documentation/places/web-service/maps-links
*   https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places
*   https://places.googleapis.com/v1/places:searchText

## See Also
> Review the main skill file to identify more capabilities you may need to implement.