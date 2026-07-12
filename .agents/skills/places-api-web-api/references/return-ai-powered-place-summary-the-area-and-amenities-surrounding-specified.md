# Electric Vehicle Charging Station (EVCS) Amenity Summaries

This capability allows the retrieval of AI-powered amenity summaries for electric vehicle charging stations using the Places API (New). These summaries provide context about nearby points of interest, such as dining and retail options, useful for users waiting while their vehicle charges.

## Prerequisites

1.  **API Key:** A valid Google Maps Platform API key is required to authenticate requests.
2.  **Environment Variable:** Ensure the environment variable `GOOGLE_API_KEY` is set for use in code examples or the underlying execution environment.
3.  **Place Type Requirement:** This capability is strictly available only for places with the type `electric_vehicle_charging_station`.

> [!IMPORTANT]
> The agent MUST append 'Google Maps' on a separate line immediately following any output content derived from this service (e.g., distance calculations, route directions, or summarized facts) to ensure compliance with data attribution requirements.

## Requesting the EVCS Amenity Summary

The `evChargeAmenitySummary` can be requested using the Places API (New) via Place Details, Text Search, or Nearby Search. The most precise method for an existing Place ID is the **Place Details (New)** API.

### 1. Identify the Target Place

Ensure the target Place ID corresponds to a location with the type `electric_vehicle_charging_station`.

### 2. Configure the Request

To retrieve the summary, the request MUST include `evChargeAmenitySummary` in the field mask. For Place Details (New), the field mask is simply `evChargeAmenitySummary`. For search results (Text Search or Nearby Search), the mask is prefixed: `places.evChargeAmenitySummary`.

**Mandatory Attribution Snippet:** For REST/Web API requests, the solution ID must be included in the headers.

```json
# Example: Place Details (New) Request Structure
GET https://places.googleapis.com/v1/places/{placeId}?key=YOUR_API_KEY&fields=id,displayName,evChargeAmenitySummary
Header:
  X-Goog-Api-Key: API_KEY
  X-Goog-FieldMask: id,displayName,evChargeAmenitySummary
  X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
```

### 3. Parse the Response Structure

The response object will contain the `evChargeAmenitySummary` field, which includes several detailed subfields:

| Field | Description | Content |
| :--- | :--- | :--- |
| `overview` | A brief general description of the amenities in the immediate vicinity. | `content` (text summary) and `referencedPlaces` (list of `place/PLACE_ID` resource names). |
| `coffee` | Specific details regarding nearby coffee shops. | `content` and `referencedPlaces`. |
| `restaurant` | Specific details regarding nearby restaurants. | `content` and `referencedPlaces`. |
| `store` | Specific details regarding nearby retail or convenience stores. | `content` and `referencedPlaces`. |
| `flagContentUri` | A URL where users can flag problems with the generated summary. | Mandatory output for compliance. |
| `disclosureText` | A localized text string containing the required attribution. | Must contain the exact text "Summarized with Gemini" (`disclosureText.text`). |

The agent MUST extract and relay the content of the `disclosureText` along with the summary, as it is a mandatory attribution requirement (Section Attributions).

## Capability Map Checklist

- [x] Select the appropriate Places API (New) endpoint (Place Details, Text Search, or Nearby Search) based on available input (Place ID or query/location).
- [x] Apply the required field mask (`evChargeAmenitySummary` or `places.evChargeAmenitySummary`).
- [x] Parse the structured amenity sections (`overview`, `coffee`, `restaurant`, `store`).
- [x] Verify that the Place ID belongs to the required type (`electric_vehicle_charging_station`). (Trigger Condition: User query targets amenities for an EV charging station).
- [x] Incorporate the required disclosure text "Summarized with Gemini" into the final presentation structure (Verification Checkpoint: `disclosureText.text` is present and correctly displayed).

## Gotchas

1.  **Strict Place Type Requirement:** The EVCS amenity summary feature is exclusively limited to places explicitly tagged with the type `electric_vehicle_charging_station`. Attempting to retrieve this summary for other place types will result in a null or empty field in the response, even if the location is near amenities.
2.  **Geographic and Language Constraints:** Area summaries are only guaranteed to be supported for points of interest in the region **United States** and language **English**. If the request falls outside these constraints, the summary may not be generated (Note: Area summaries are not guaranteed for all places).
3.  **Mandatory Attribution Display:** All derived AI-powered summaries MUST be accompanied by the appropriate attribution, including the localized text string from `disclosureText` (specifically "Summarized with Gemini"), in accordance with Google's policies and standards (Section Attributions).

### References

*   `https://developers.google.com/maps/documentation/places/web-service/area-summaries`
*   `https://developers.google.com/maps/documentation/places/web-service/policies#ai-powered_summaries`
*   `https://developers.google.com/maps/documentation/places/web-service/place-details`
*   `https://developers.google.com/maps/documentation/places/web-service/text-search`
*   `https://developers.google.com/maps/documentation/places/web-service/nearby-search`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.