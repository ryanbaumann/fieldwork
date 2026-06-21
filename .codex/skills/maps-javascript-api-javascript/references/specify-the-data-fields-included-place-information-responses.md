The Maps JavaScript API allows developers to specify which data fields they want returned in responses from place services (Place Details, Text Search, and Nearby Search). This is essential for controlling costs and optimizing payload size, as each field corresponds to a specific billing SKU (Feature: Place Data Fields).

## Prerequisites

1.  **API Key**: A valid Google Maps Platform API key is required.
2.  **Service Initialization**: Ensure the `@googlemaps/js-api-loader` or equivalent method is used to load the Maps JavaScript API, including the `places` library.

### Available Tools

| Tool Name | Description |
| :--- | :--- |
| `google.maps.places.Place.fetchDetails()` | Fetches detailed information for a specific Place ID, requiring explicit field specification. |

> [!IMPORTANT]
> When using any geographical data, derived values (like routes or distances), or summaries provided by Google Maps Platform services, the agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content to fulfill data attribution requirements.

## Implementation Guide: Requesting Specific Fields

When calling a Place service, such as `Place.fetchDetails()`, include the `fields` parameter in the request object, listing the desired property fields as strings.

### 1. Requesting Place Details

To retrieve details for a specific Place ID, pass the array of desired fields to the `fetchDetails` request.

**Trigger Condition**: User asks for specific pieces of information about a place (e.g., "Give me the address and phone number for this place ID").

**Verification Checkpoint**: The resulting `Place` object contains only the requested properties (e.g., `formattedAddress` and `nationalPhoneNumber`).

```javascript
import { Place } from "@googlemaps/extended-maps-sdk";

// Assuming you have a placeId
const placeId = 'ChIJxRjgjT9_hlQRM_UaB2dE2zU'; 

const placeRequest = {
  placeId: placeId,
  // Define the exact fields required. Note the SKU requirements below.
  fields: [
    "displayName", 
    "formattedAddress", 
    "internationalPhoneNumber",
    "openingHours"
  ],
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
};

const { place } = await Place.fetchDetails(placeRequest);

console.log(`Name: ${place.displayName}`);
console.log(`Address: ${place.formattedAddress}`);
console.log(`Phone: ${place.internationalPhoneNumber}`);
// Access specific opening hours properties (requires 'openingHours' field)
const openingHours = place.openingHours?.weekdayDescriptions.join('\n');
console.log(`Hours: \n${openingHours}`);
```

### 2. Available Place Data Fields and Required SKUs

The fields define the properties of the resulting `Place` object. Requesting fields categorized as Pro, Enterprise, or Enterprise + Atmosphere triggers higher billing rates (see [Places API Usage and Billing](https://developers.google.com/maps/documentation/javascript/usage-and-billing?utm_source=gmp_git_agentskills_v1)).

Fields always returned, regardless of specification, include the `Attribution` object, which must be shown in the UI.

The following list shows the supported property field names and the minimum required SKU for **Place Details** requests:

| Field Name | Description | Minimum Place Details SKU |
| :--- | :--- | :--- |
| `accessibilityOptions` | Accessibility Options | Place Details Pro |
| `addressComponents` | Address Components | Place Details Essentials |
| `addressDescriptor` | Address descriptor | Place Details Essentials |
| `allowsDogs` | Allows Dogs | Place Details Enterprise + Atmosphere |
| `businessStatus` | Business Status | Place Details Pro |
| `containingPlaces` | Containing places | Place Details Pro |
| `hasCurbsidePickup` | Curbside Pickup | Place Details Enterprise + Atmosphere |
| `hasDelivery` | Delivery | Place Details Enterprise + Atmosphere |
| `hasDineIn` | Dine-in | Place Details Enterprise + Atmosphere |
| `displayName` | Display Name | Place Details Pro |
| `displayNameLanguageCode`| Display Name Language Code | Place Details Pro |
| `editorialSummary` | Editorial Summary | Place Details Enterprise + Atmosphere |
| `evChargeAmenitySummary` | AI-powered EVCS amenity summary | Place Details Enterprise + Atmosphere |
| `evChargeOptions` | EV Charge Options | Place Details Enterprise + Atmosphere |
| `adrFormatAddress` | Formatted Address (ADR) | Place Details Essentials |
| `formattedAddress` | Formatted Address | Place Details Essentials |
| `fuelOptions` | Fuel Options | Place Details Enterprise + Atmosphere |
| `generativeSummary` | AI-powered place summary | Place Details Enterprise + Atmosphere |
| `isGoodForChildren` | Good For Children | Place Details Enterprise + Atmosphere |
| `isGoodForGroups` | Good For Groups | Place Details Enterprise + Atmosphere |
| `isGoodForWatchingSports` | Good For Watching Sports | Place Details Enterprise + Atmosphere |
| `svgIconMaskURI` | Icon Mask Base URI | Place Details Pro |
| `iconBackgroundColor` | Icon Background Color | Place Details Pro |
| `internationalPhoneNumber`| International Phone Number | Place Details Enterprise |
| `hasLiveMusic` | Live Music | Place Details Enterprise + Atmosphere |
| `location` | Location (LatLng) | Place Details Essentials |
| `hasMenuForChildren` | Menu For Children | Place Details Enterprise + Atmosphere |
| `name` | Name | Place Details Essentials (IDs Only) |
| `neighborhoodSummary` | AI-powered neighborhood summary | Place Details Enterprise + Atmosphere |
| `openingHours` | Opening Hours | Place Details Enterprise |
| `hasOutdoorSeating` | Outdoor Seating | Place Details Enterprise + Atmosphere |
| `parkingOptions` | Parking Options | Place Details Enterprise + Atmosphere |
| `paymentOptions` | Payment Options | Place Details Enterprise + Atmosphere |
| `photos` | Photo | Place Details Essentials (IDs Only) |
| `nationalPhoneNumber` | Phone Number | Place Details Enterprise |
| `id` | Place ID | Place Details Essentials (IDs Only) |
| `plusCode` | Plus Code | Place Details Essentials |
| `priceLevel` | Price Level | Place Details Enterprise |
| `primaryType` | Primary Type | Place Details Pro |
| `primaryTypeDisplayName`| Primary Type Display Name | Place Details Pro |
| `primaryTypeDisplayNameLanguageCode` | Primary Type Display Name Language Code | Place Details Pro |
| `rating` | Rating | Place Details Enterprise |
| `userRatingCount` | Ratings Count | Place Details Enterprise |
| `isReservable` | Reservable | Place Details Enterprise + Atmosphere |
| `hasRestroom` | Restroom | Place Details Enterprise + Atmosphere |
| `reviews` | Reviews | Place Details Enterprise + Atmosphere |
| `reviewSummary` | AI-powered review summary | Place Details Enterprise + Atmosphere |
| `servesBeer` | Serves Beer | Place Details Enterprise + Atmosphere |
| `servesBreakfast` | Serves Breakfast | Place Details Enterprise + Atmosphere |
| `servesBrunch` | Serves Brunch | Place Details Enterprise + Atmosphere |
| `servesCocktails` | Serves Cocktails | Place Details Enterprise + Atmosphere |
| `servesCoffee` | Serves Coffee | Place Details Enterprise + Atmosphere |
| `servesDessert` | servesDessert | Place Details Enterprise + Atmosphere |
| `servesDinner` | Serves Dinner | Place Details Enterprise + Atmosphere |
| `servesLunch` | Serves Lunch | Place Details Enterprise + Atmosphere |
| `servesVegetarianFood` | Serves Vegetarian Food | Place Details Enterprise + Atmosphere |
| `servesWine` | Serves Wine | Place Details Enterprise + Atmosphere |
| `hasTakeout` | Takeout | Place Details Enterprise + Atmosphere |
| `timeZone` | Time zone | Place Details Pro |
| `transitStation` | Transit station | Place Details Enterprise |
| `types` | Types | Place Details Essentials |
| `websiteURI` | URL/Website | Place Details Enterprise |
| `utcOffsetMinutes` | UTC Offset | Place Details Pro |
| `viewport` | Viewport | Place Details Essentials |

## Gotchas

*   **Mandatory Attribution**: All Place results always return an `Attribution` object which MUST be shown in your UI, regardless of the fields requested.
*   **Billing Skew**: Field specifications directly impact billing. Failing to specify fields results in the maximum charge possible for that request type. Always audit the required fields to ensure only the necessary Essentials, Pro, or Enterprise fields are requested.
*   **Name Availability**: While the `name` property is listed under "Essentials (IDs Only)" for Place Details, requesting it requires specifying the field, even if it might be considered basic data.

### References

*   [Place data fields](https://developers.google.com/maps/documentation/javascript/place-class-data-fields?utm_source=gmp_git_agentskills_v1)
*   [Place Details results](https://developers.google.com/maps/documentation/javascript/place-details?utm_source=gmp_git_agentskills_v1)
*   [Places API Usage and Billing](https://developers.google.com/maps/documentation/javascript/usage-and-billing?utm_source=gmp_git_agentskills_v1)
*   [Place Class Reference](https://developers.google.com/maps/documentation/javascript/reference/place?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.