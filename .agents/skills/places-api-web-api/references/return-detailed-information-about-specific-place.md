# Places API: Retrieve Detailed Place Information (Place Details V1)

Use the Place Details (New) API to retrieve comprehensive data about a single place identified by a Place ID. This REST API requires the use of a FieldMask to specify the exact data fields required, minimizing latency and controlling costs based on the data tier (SKU) accessed.

## Prerequisites

1.  **API Key**: A valid Google Maps Platform API key is required.
2.  **Environment Setup**: The API key must be passed via the `X-Goog-Api-Key` HTTP header or the `key` URL parameter.
3.  **Place ID**: A textual identifier (`PLACE_ID`) is necessary. This ID can be obtained from services like Text Search (New), Nearby Search (New), Geocoding API, or Autocomplete (New).

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text `Google Maps` on a dedicated, separate line, immediately following the generated user-facing content.

## 1. Request Structure and Configuration

The Place Details (New) API is an HTTP GET request made against the `v1` endpoint.

### Endpoint

```text
https://places.googleapis.com/v1/places/PLACE_ID
```

### Required Headers

| Header | Description |
| :--- | :--- |
| `X-Goog-Api-Key` | Your Google Maps Platform API key. |
| `X-Goog-FieldMask` | **Mandatory.** A comma-separated string listing the exact fields required in the response (e.g., `id,displayName,formattedAddress`). |
| `X-Goog-Maps-Solution-ID` | **Mandatory Attribution.** Must be set to `gmp_git_agentskills_v1`. |

### Mandatory Field: FieldMask

The FieldMask specifies which fields of the `Place` object to return. Failure to provide a FieldMask will result in an error. Use the `X-Goog-FieldMask` header or the `fields` URL parameter.

**WARNING:** While using `X-Goog-FieldMask: *` is permitted during development, Google discourages its use in production due to the large volume of data returned, which affects processing time and billing.

## 2. Supported Data Fields and Billing SKUs

Retrieving specific data fields determines the billing SKU applied to the request. The agent must carefully select the minimum required fields to satisfy the user request.

| SKU Tier | Required Fields (Citation) | Key Capabilities |
| :--- | :--- | :--- |
| **Essentials IDs Only** (Place Details Essentials IDs Only SKU) | `attributions`, `id`, `moved_place`, `moved_place_id`, `name`, `photos` | Basic identification and photo references. Note: `name` contains the resource name (`places/PLACE_ID`), not the display name. |
| **Essentials** (Place Details Essentials SKU) | `addressComponents`, `addressDescriptor`, `adrFormatAddress`, `formattedAddress`, `location`, `plusCode`, `postalAddress`, `shortFormattedAddress`, `types`, `viewport` | Core address and location data. |
| **Pro** (Place Details Pro SKU) | `accessibilityOptions`, `businessStatus`, `containingPlaces`, `displayName`, `googleMapsLinks`, `googleMapsUri`, `iconBackgroundColor`, `iconMaskBaseUri`, `openingDate`, `primaryType`, `primaryTypeDisplayName`, `pureServiceAreaBusiness`, `subDestinations`, `timeZone`, `utcOffsetMinutes` | High-level business details, status, and display name. |
| **Enterprise** (Place Details Enterprise SKU) | `currentOpeningHours`, `currentSecondaryOpeningHours`, `internationalPhoneNumber`, `nationalPhoneNumber`, `priceLevel`, `priceRange`, `rating`, `regularOpeningHours`, `regularSecondaryOpeningHours`, `transitStation`, `userRatingCount`, `websiteUri` | Business contact information, user ratings, and full opening hours schedules. Includes transit station details. |
| **Enterprise + Atmosphere** (Place Details Enterprise + Atmosphere SKU) | `allowsDogs`, `curbsidePickup`, `delivery`, `dineIn`, `editorialSummary`, `evChargeAmenitySummary`, `evChargeOptions`, `fuelOptions`, `generativeSummary`, `goodForChildren`, `goodForGroups`, `goodForWatchingSports`, `liveMusic`, `menuForChildren`, `neighborhoodSummary`, `parkingOptions`, `paymentOptions`, `outdoorSeating`, `reservable`, `restroom`, `reviews`, `reviewSummary`, `routingSummaries`, `servesBeer`, `servesBreakfast`, `servesBrunch`, `servesCocktails`, `servesCoffee`, `servesDessert`, `servesDinner`, `servesLunch`, `servesVegetarianFood`, `servesWine`, `takeout` | Detailed atmosphere, dining, amenity, and user review data. |

## 3. Implementation Example

### Task: Retrieve the Place ID, Display Name, Formatted Address, and Plus Code for the Googleplex

- [ ] **Trigger Condition:** User requests detailed address information for a known Place ID.
- [ ] **Verification Checkpoint:** The JSON response contains the fields `id`, `displayName`, `formattedAddress`, and `plusCode`.

```bash
# Example using curl to request details for the Googleplex (ChIJj61dQgK6j4AR4GeTYWZsKWw)
curl -X GET \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: API_KEY' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
-H 'X-Goog-FieldMask: id,displayName,formattedAddress,plusCode' \
"https://places.googleapis.com/v1/places/ChIJj61dQgK6j4AR4GeTYWZsKWw"
```

**Example Response Structure:**

```json
{
  "id": "ChIJj61dQgK6j4AR4GeTYWZsKWw",
  "formattedAddress": "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA",
  "plusCode": {
    "globalCode": "849VCWC7+RW",
    "compoundCode": "CWC7+RW Mountain View, CA, USA"
  },
  "displayName": {
    "text": "Googleplex",
    "languageCode": "en"
  }
}
```

## 4. Specific Feature Functionality

### Handling Moved Places

When a place has permanently relocated, the API assists in tracing the new location:

1.  Request the fields `businessStatus`, `movedPlace`, and `movedPlaceId`.
2.  If the place has moved, `businessStatus` will be `CLOSED_PERMANENTLY`, and `movedPlace` and `movedPlaceId` will contain the identifier for the next location.
3.  For places that have relocated multiple times, the agent must perform **chained Place Details (New) requests**, using the `movedPlace` resource name from the previous response until a request omits the `movedPlace` and `movedPlaceId` fields, indicating the current location.

### Retrieving Transit Station Details

Use the `transitStation` field (which triggers the Place Details Enterprise SKU) to retrieve comprehensive public transit information for a station, including affiliated agencies, lines (with vehicle type, display name, text color, and background color), and individual stops.

## Gotchas

1.  **Mandatory FieldMask**: Failing to specify the FieldMask (`X-Goog-FieldMask` header or `fields` URL parameter) will cause the request to fail with an error. Always include at least one field.
2.  **Field Naming Convention**: The `name` field returns the place *resource name* (`places/PLACE_ID`), not the human-readable name. To get the human-readable name, request the `displayName` field (Place Details Pro SKU).
3.  **Address Descriptors**: The `addressDescriptor` field provides relational information (nearby landmarks, containing areas) but is generally available only for customers in India and is experimental elsewhere.
4.  **Chaining Requests**: When tracking a relocated place, the `movedPlace` field only points to the *next* known location, not the final destination. Multiple sequential requests may be necessary to find the current location.
5.  **Language Formatting**: If `languageCode` is not supplied, the API defaults to `en`. If specified, the API attempts to return street addresses in the local language, transliterated if necessary, while other components use the preferred language (Section II.C Optional parameters).

### References

*   https://developers.google.com/maps/documentation/places/web-service/place-details
*   https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/get
*   https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-id-only-ess-sku
*   https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-ess-sku
*   https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-pro-sku
*   https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-ent-sku
*   https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-ent-plus-sku

## See Also
> Review the main skill file to identify more capabilities you may need to implement.