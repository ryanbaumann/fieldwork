## AI-Powered Place Summaries

The Places API (New) provides generative place summaries, which are concise, AI-powered overviews (up to 100 characters) summarizing key features of a Point of Interest (POI). These summaries aggregate various data types, such as popular foods, services, or goods, and are returned as part of the standard Place Details, Text Search, and Nearby Search responses.

### 1. Prerequisites and Setup

To use the Places API (New) Web Services, ensure the following is configured:

- [x] Enable the Places API in the Google Cloud Project.
- [x] Secure an API Key and set it as an environment variable (e.g., `GOOGLE_API_KEY`) for use in HTTP requests.

### 2. Attribution Mandate and Required Disclosures

> [!IMPORTANT]
> The agent MUST attribute all derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content. Additionally, when displaying a generative summary, the agent MUST explicitly include the required disclosure text, which is typically "Summarized with Gemini", adjacent to the summary, as required by the [Policies for Places API](https://developers.google.com/maps/documentation/places/web-service/policies?utm_source=gmp_git_agentskills_v1#ai-powered_summaries).

### 3. Requesting a Generative Summary

To retrieve the summary, the corresponding field mask must be included in the API request. The response fields include the summary text (`overview`), the disclosure text (`disclosureText`), and a required content reporting link (`overviewFlagContentUri`).

| API Method | Required Field Mask | Output Field Path |
| :--- | :--- | :--- |
| Place Details (New) | `generativeSummary` | `generativeSummary.overview.text` |
| Text Search (New) | `places.generativeSummary` | `places[].generativeSummary.overview.text` |
| Nearby Search (New) | `places.generativeSummary` | `places[].generativeSummary.overview.text` |

The generative summary feature is supported for POI categories including **Culture**, **Entertainment and Recreation**, **Food and Drink**, **Shopping**, **Services,** and **Sports**. Currently, support is limited to **English** in **India** and the **United States** (Language/Region Table).

#### Example: Place Details (New)

Use the Place Details endpoint to fetch the summary for a specific Place ID.

**Endpoint:** `GET https://places.googleapis.com/v1/places/{placeId}`

```text
curl -X GET 'https://places.googleapis.com/v1/places/ChIJ1eOF7HLTD4gRry3xPjk8DkU' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
-H "X-Goog-FieldMask: displayName,generativeSummary"
```

**Example Response Structure:**

```json
{
  "displayName": {
    "text": "Sushi Nova - Lincoln Park",
    "languageCode": "en"
  },
  "generativeSummary": {
    "overview": {
      "text": "Casual eatery with all-you-can-eat sushi and other Japanese fare, plus beer and sake.",
      "languageCode": "en-US"
    },
    "overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=...",
    "disclosureText": {
      "text": "Summarized with Gemini",
      "languageCode": "en-US"
    }
  }
}
```

#### Example: Text Search (New)

Use the Text Search endpoint to retrieve summaries for places matching a search query.

**Endpoint:** `POST https://places.googleapis.com/v1/places:searchText`

```text
curl -X POST -d '{
  "textQuery": "Spicy Vegetarian Food",
  "location_bias": {
    "rectangle": {
      "low": {
        "latitude": 37.415,
        "longitude": -122.091
      },
      "high": {
        "latitude": 37.429,
        "longitude": -122.065
      }
    }
  },
  "maxResultCount": 5
}' \
-H 'Content-Type: application/json' -H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
-H "X-Goog-FieldMask: places.id,places.displayName,places.generativeSummary" \
'https://places.googleapis.com/v1/places:searchText'
```

#### Example: Nearby Search (New)

Use the Nearby Search endpoint to retrieve summaries for places within a defined geographic area.

**Endpoint:** `POST https://places.googleapis.com/v1/places:searchNearby`

```text
curl -X POST -d '{
  "maxResultCount": 5,
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 45.553360,
        "longitude": -122.674934
        },
      "radius": 1000
    }
  },
  "includedTypes": ["restaurant", "cafe"],
  "rankPreference":"POPULARITY"
  }' \
-H 'Content-Type: application/json' -H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
-H "X-Goog-FieldMask: places.id,places.generativeSummary" \
'https://places.googleapis.com/v1/places:searchNearby'
```

### 4. Checklist for Integration

- [ ] Identify the appropriate Places API (New) method (Details, Text Search, or Nearby Search) based on user input (**Trigger Condition**: User provides Place ID, text query, or location coordinates).
- [ ] Ensure the field mask (`generativeSummary` or `places.generativeSummary`) is correctly included in the request headers.
- [ ] Execute the API call using the required `X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1` header.
- [ ] Extract the summary text from the response path (e.g., `generativeSummary.overview.text`) (**Verification Checkpoint**: Response includes the 100-character summary and `disclosureText`).
- [ ] If the summary is successfully retrieved, display the summary text and the required `disclosureText` ("Summarized with Gemini") to the user.

## Gotchas

- **Not Guaranteed**: Place summaries are not guaranteed for all places, even if the location falls within a supported region or category (Note). If the `generativeSummary` field is missing from the response object, it means the summary is unavailable for that specific place.
- **Strict Availability**: Generative summaries are currently restricted by region and language (English only, primarily United States and India). Requesting the summary outside these constraints may result in no summary being returned.
- **Field Mask Requirement**: Summaries are only returned if the `generativeSummary` field (or `places.generativeSummary` for search APIs) is explicitly included in the request's `X-Goog-FieldMask` header.

### References

https://developers.google.com/maps/documentation/places/web-service/place-summaries
https://developers.google.com/maps/documentation/places/web-service/place-details
https://developers.google.com/maps/documentation/places/web-service/text-search
https://developers.google.com/maps/documentation/places/web-service/nearby-search
https://developers.google.com/maps/documentation/places/web-service/policies#ai-powered_summaries
https://developers.google.com/maps/documentation/places/web-service/choose-fields
https://developers.google.com/maps/documentation/places/web-service/place-types

## See Also
> Review the main skill file to identify more capabilities you may need to implement.