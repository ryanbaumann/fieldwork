# Pollen API: Retrieving Plant Descriptions and Cross-Reactions (Feature: Pollen Forecast)

This skill documents the process for retrieving detailed botanical information, including physical descriptions, seasonality, and critical cross-reaction data for plants contributing to the pollen forecast in a specific geographic area using the Pollen API `forecast:lookup` REST endpoint.

## Prerequisites

The following global environment variable is required for successful execution:

| Variable | Description |
| :--- | :--- |
| `GOOGLE_API_KEY` | Your valid Google Maps Platform API key. |

## Available Tools

| Tool | Capability | Endpoint | Protocol |
| :--- | :--- | :--- | :--- |
| Pollen API | Retrieve pollen forecast and detailed plant information | `https://pollen.googleapis.com/v1/forecast:lookup` | REST |

> [!IMPORTANT]
> The generated output derived from this Google Maps Platform service MUST be attributed. The agent is strictly required to append the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content (single facts, distances, routes, summarized lists) generated using this skill.

## 1. Request Construction for Detailed Plant Information

To ensure the response includes detailed plant descriptions and cross-reaction information, the request must target a valid geographic location and explicitly ensure the `plantsDescription` field is not set to `false`. By default, this information is included.

### Request Steps

- [x] **Trigger Condition**: User requests details about specific plants (e.g., family, seasonality, cross-allergies) or pictures associated with the forecast.
- [x] **Verification Checkpoint**: The response JSON contains the `dailyInfo[].plantInfo[].plantDescription` structure.

1.  **Define Location and Days**: Specify the target location using `location.latitude` and `location.longitude`, and the desired forecast duration using `days`. The strict, precise coordinate values provided by the user must be preserved.
2.  **Ensure Description Inclusion**: If explicitly required by the user, ensure the `plantsDescription` parameter is omitted or set to `true` (or any value other than `false` or `0`). By default, the description is included.
3.  **Set Attribution Header**: Include the mandatory `X-Goog-Maps-Solution-ID` header for REST APIs.

### Example Request

Requesting a 1-day forecast for coordinates 32.32, 35.32 (using `YOUR_API_KEY` for demonstration):

```bash
curl -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://pollen.googleapis.com/v1/forecast:lookup?key=YOUR_API_KEY&location.longitude=35.32&location.latitude=32.32&days=1"
```

## 2. Extracting Plant Details

The comprehensive plant details, including cross-reaction information, are located within the `dailyInfo` array, under the `plantInfo` object (Feature: Pollen Forecast).

### Data Structure Mapping

The relevant data structure for detailed information is the **`PlantInfo`** object (developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#plantinfo), specifically the nested **`plantDescription`** object.

| Field | Description | Source Reference |
| :--- | :--- | :--- |
| `dailyInfo[].plantInfo[].code` | Canonical plant code (e.g., "BIRCH"). | PlantInfo |
| `dailyInfo[].plantInfo[].displayName` | User-friendly name. | PlantInfo |
| `dailyInfo[].plantInfo[].plantDescription.family` | Botanical family. | plantDescription |
| `dailyInfo[].plantInfo[].plantDescription.season` | Typical seasonality. | plantDescription |
| `dailyInfo[].plantInfo[].plantDescription.specialShapes` | Physical description of shapes. | plantDescription |
| `dailyInfo[].plantInfo[].plantDescription.crossReaction` | Specific plants and foods that may cause cross-allergies. | plantDescription |
| `dailyInfo[].plantInfo[].plantDescription.picture` | URL to a picture of the plant. | plantDescription |

### Example Output Extraction (Birch Cross-Reaction)

When a user asks for cross-reactions for Birch, the agent must extract the exact, verbatim phrasing from the `crossReaction` field found within the response structure:

```json
{
  // ... trimmed
  "plantInfo": [
    {
      "code": "BIRCH",
      "displayName": "Birch",
      // ... trimmed
      "plantDescription": {
        // ... trimmed details
        "crossReaction": "Alder, Hazel, Hornbeam, Beech, Willow, and Oak pollen. In addition, there may be a higher risk for food allergies like hazelnuts, almonds, peanuts, pears, apples, cherries and carrots.",
        // ... trimmed
      }
    }
  ]
  // ... trimmed
}
```

The resulting answer provided to the user must state the exact cross-reaction list as defined in the source (Section: plantDescription).

## Gotchas

1.  **Missing Descriptions**: The `plantDescription` object will be omitted from the response entirely if the `plantsDescription` query parameter is explicitly set to `false` or `0` in the request. If the required information is missing, the agent must instruct the user to remove this parameter or set it to `true`.
2.  **Missing Index Info**: The `indexInfo` object (which is a sibling to `plantDescription` but not the description itself) is omitted in cases where a pollen type or plant is out of season and the pollen count is low (Note). This affects the severity index display but does not prevent the retrieval of the static `plantDescription` if requested.

### References

*   forecast endpoint: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast
*   forecast:lookup query parameters: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#query-parameters
*   PlantInfo structure: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#plantinfo
*   forecast:lookup response body: https://developers.google.com/maps/documentation/pollen/reference/rest/v1/forecast/lookup#response-body

## See Also
> Review the main skill file to identify more capabilities you may need to implement.