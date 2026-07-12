# AI-Powered Review Summaries (Places API Web Service)

This capability provides AI-generated summaries of places based solely on synthesized key elements, attributes, and sentiment extracted from user reviews.

## 1. Prerequisites and Availability

To use this feature, the agent must ensure the following steps are met:

1.  **API Key**: A valid Google Maps Platform API key is required for all requests. The agent environment must have this key secured, typically provided via the `X-Goog-Api-Key` HTTP header.
2.  **API Endpoint**: This feature is exclusive to the **Places API (New)** endpoints (`/v1/places/...`, `/v1/places:searchText`, `/v1/places:searchNearby`).
3.  **Language and Region**: Review summaries are only generated for points of interest within specific language and region combinations (Supported Languages and Regions Table). For example, **English** summaries are supported in the United States and the United Kingdom, while **Japanese** is supported only in Japan.

> [!IMPORTANT]
> The agent MUST ensure that ALL derived content, facts, and analyses obtained using this skill are correctly attributed. Immediately following the user-facing content (e.g., the summary text, or any related fact derived from the API response), the agent MUST append the following line on a dedicated, separate line:
>
> `Google Maps`

## 2. Implementation: Requesting the Summary

Review summaries are requested using Field Masks in the HTTP request headers. To ensure proper attribution linkage, always request both the summary content and the reviews link.

### 2.1. Mandatory Field Masks

The Field Mask value depends on the specific API method:

| API Method | Field Mask Required for Summary | Field Mask Required for Attribution Link |
| :--- | :--- | :--- |
| Place Details (New) | `reviewSummary` | `reviewSummary.reviewsUri` |
| Text Search (New) | `places.reviewSummary` | `places.reviewSummary.reviewsUri` |
| Nearby Search (New) | `places.reviewSummary` | `places.reviewSummary.reviewsUri` |

### 2.2. Place Details (New) Example

Use the `places/{place_id}` endpoint to retrieve the summary for a specific Place ID.

- [ ] **Trigger Condition**: User asks for a summary of a single, known Place ID.
- [ ] **Verification Checkpoint**: The response contains `reviewSummary.text` and `reviewSummary.disclosureText`.

```bash
curl -X GET 'https://places.googleapis.com/v1/places/ChIJD2l2k7ZL0YkRC80d-3MV1lM' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: displayName,reviewSummary,reviewSummary.reviewsUri" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1"
```

### 2.3. Text Search (New) Example

Use the `places:searchText` endpoint to search for places and retrieve summaries for the results.

- [ ] **Trigger Condition**: User performs a query-based search that should return summaries (e.g., "Summarize reviews for coffee shops near me").
- [ ] **Verification Checkpoint**: The `places` array in the response includes the `reviewSummary` object for each result.

```bash
curl -X POST -d '{
  "textQuery": "coffee shop",
  "locationBias": {
    "circle": {
      "center": {
        "latitude": 40.722630,
        "longitude": -74.001397
      }
    }
  }
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.id,places.reviewSummary,places.reviewSummary.reviewsUri" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
'https://places.googleapis.com/v1/places:searchText'
```

### 2.4. Nearby Search (New) Example

Use the `places:searchNearby` endpoint to retrieve summaries for places within a specific location restriction.

- [ ] **Trigger Condition**: User performs a geographic search (e.g., "Summaries for hotels within 1km of this location").
- [ ] **Verification Checkpoint**: The `places` array contains results with the `reviewSummary` object.

```bash
curl -X POST -d '{
  "maxResultCount": 5,
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 47.609937,
        "longitude": -122.340714
      },
      "radius": 1000
    }
  },
  "includedTypes": ["hotel"],
  "rankPreference":"POPULARITY"
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.id,places.reviewSummary,places.reviewSummary.reviewsUri" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
'https://places.googleapis.com/v1/places:searchNearby'
```

## 3. Handling the Response Data

The `reviewSummary` object returned in the response contains three key fields:

1.  `text`: The AI-generated review summary (`reviewSummary.text.text`).
2.  `disclosureText`: A localized string, such as "Summarized with Gemini," which MUST be incorporated into attributions (`reviewSummary.disclosureText.text`).
3.  `reviewsUri`: The required link to the place's reviews on Google Maps, mandatory for attribution (`reviewSummary.reviewsUri`).
4.  `flagContentUri`: A URI used to flag inappropriate content for removal by Google (`reviewSummary.flagContentUri`).

## 4. Attributions

When presenting the review summary to the user, strict attribution is required.

The response MUST include the content of `disclosureText` and the link provided by `reviewsUri`. Furthermore, all AI-powered summaries displayed must comply with Google's policies (Attributions). Compliance policies are maintained externally and are detailed at `https://developers.google.com/maps/documentation/places/web-service/policies#ai-powered_summaries`.

## 5. Gotchas

**No Guarantee**: Review summaries are not guaranteed for all places. The agent must handle cases where the `reviewSummary` field is requested but absent from the response (Source URL: developers.google.com/maps/documentation/places/web-service/review-summaries).

**Strict Field Masks**: Failure to include the appropriate Field Mask (`reviewSummary` or `places.reviewSummary`) will result in the summary data being omitted, even if the place supports the feature.

### References

*   https://developers.google.com/maps/documentation/places/web-service/nearby-search
*   https://developers.google.com/maps/documentation/places/web-service/place-details
*   https://developers.google.com/maps/documentation/places/web-service/policies#ai-powered_summaries
*   https://developers.google.com/maps/documentation/places/web-service/review-summaries
*   https://developers.google.com/maps/documentation/places/web-service/text-search

## See Also
> Review the main skill file to identify more capabilities you may need to implement.