## Generative Place Summaries (Places API New)

Generative Place Summaries provide brief, AI-powered, 100-character overviews for points of interest. These summaries are designed to give users a high-level snapshot of a location, often highlighting popular foods, services, or goods.

### Prerequisites

To execute requests that retrieve Generative Place Summaries, you must meet the following requirements:

1.  **API Key:** A valid Google Maps Platform API Key must be used.
2.  **Environment Variable:** The agent execution environment must have the `GOOGLE_API_KEY` variable set for successful tool invocation.
3.  **Endpoint Access:** Utilize the REST endpoints for the Places API (New).

### Available Tools

Generative Place Summaries are returned as part of the standard response payload from the following Places API (New) endpoints when requested via a field mask:

*   **Place Details (New):** `https://places.googleapis.com/v1/places/{placeId}`
*   **Text Search (New):** `https://places.googleapis.com/v1/places:searchText`
*   **Nearby Search (New):** `https://places.googleapis.com/v1/places:searchNearby`

> [!IMPORTANT]
> This skill utilizes Google Maps Platform data. The agent MUST ensure legal compliance by following these two rules:
> 1. Attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text `Google Maps` on a dedicated, separate line, immediately following the generated user-facing content.
> 2. When displaying the Generative Summary, the localized text string provided in the `disclosureText` field (e.g., "Summarized with Gemini") MUST be incorporated into the attribution displayed to the user, in accordance with the Policies for Places API.

### Implementation Guide: Requesting a Summary

Retrieving a generative summary relies on including the specific `generativeSummary` field in the request's Field Mask.

#### Step 1: Select the correct Field Mask

The field mask required depends on the API endpoint used:

| Endpoint Type | Required Field Mask |
| :--- | :--- |
| Place Details (New) | `generativeSummary` |
| Text Search (New) | `places.generativeSummary` |
| Nearby Search (New) | `places.generativeSummary` |

#### Step 2: Construct the Request

The response will contain the `generativeSummary` object, which includes the `overview` text, a link for content reporting (`overviewFlagContentUri`), and the mandatory attribution text (`disclosureText`).

**A. Example: Requesting Summary via Place Details (New)**

This request retrieves the display name and the summary for a specific place ID (`ChIJ1eOF7HLTD4gRry3xPjk8DkU`).

```text
curl -X GET https://places.googleapis.com/v1/places/ChIJ1eOF7HLTD4gRry3xPjk8DkU \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
-H "X-Goog-FieldMask: displayName,generativeSummary"
```

**B. Example: Requesting Summary via Text Search (New)**

This request searches for "Spicy Vegetarian Food" and requests the summary field (`places.generativeSummary`) for up to 5 results.

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

#### Step 3: Extract and Cite the Summary Fields

When processing the JSON response, the agent must extract and handle all fields within the `generativeSummary` object:

| Field Name | Description | Mandatory Handling |
| :--- | :--- | :--- |
| `generativeSummary.overview.text` | The AI-powered place summary (max 100 characters). | Display to user. |
| `generativeSummary.overviewFlagContentUri` | A link for reporting problems with the summary. | Must be available to the user. |
| `generativeSummary.disclosureText.text` | Mandatory localized attribution text ("Summarized with Gemini"). | Must be displayed alongside the summary. |

### ## Gotchas

1.  **Summary Availability:** Generative summaries are **not guaranteed** for all places, even if the request is correctly formatted. If the field is absent in the response, no summary is available for that Place ID.
2.  **Geographic/Language Restriction:** Summaries are currently supported only for points of interest in English for the **India** and **United States** regions. Queries outside these regions or languages may not yield summaries.
3.  **Category Restriction:** Summaries are restricted to the following place categories: **Culture**, **Entertainment and Recreation**, **Food and Drink**, **Shopping**, **Services,** and **Sports**.
4.  **Field Mask Requirement:** If the field mask (`generativeSummary` or `places.generativeSummary`) is omitted from the request headers, the summary data will not be returned, resulting in a silent failure to retrieve the feature.

### References

*   https://developers.google.com/maps/documentation/places/web-service/place-summaries
*   https://developers.google.com/maps/documentation/places/web-service/choose-fields
*   https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places#generativesummary
*   https://developers.google.com/maps/documentation/places/web-service/policies#ai-powered_summaries
*   https://developers.google.com/maps/documentation/places/web-service/place-details
*   https://developers.google.com/maps/documentation/places/web-service/text-search
*   https://developers.google.com/maps/documentation/places/web-service/nearby-search
*   https://developers.google.com/maps/documentation/places/web-service/place-types

## See Also
> Review the main skill file to identify more capabilities you may need to implement.