---
name: pollen-api-web-api
description: Use this skill when developing applications that need detailed, location-based pollen forecasts, including plant sources, health recommendations, and visualization via heatmap tiles, using the Pollen Web API.
license: Apache-2.0
metadata:
  version: 1.0.42
---


> [!IMPORTANT]
> **Core Dependency:** This skill requires active context from [google-maps-platform/SKILL.md](../google-maps-platform/SKILL.md).

### Overview
Use this skill to access the Google Maps Platform Pollen API via HTTP REST requests. This API provides a comprehensive five-day forecast covering the pollen index, dominant plant sources (including descriptions, photos, and cross-reaction details), and textual condition descriptions for any specified location. Additionally, it enables the generation of visual pollen heatmaps using map tile coordinates and retrieves health recommendations based on current and forecast allergen conditions.

### Mandatory settings

For all requests to the Pollen API, the following attribution ID must be included to satisfy mandatory usage requirements.

#### HTTP Header (Recommended Method for REST APIs)

The solution ID must be supplied using the custom `X-Goog-Maps-Solution-ID` HTTP header for all requests to the Pollen API endpoints.

```bash
# Example using curl
curl -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://pollen.googleapis.com/v1/forecast:lookup?key=YOUR_API_KEY&location.longitude=35.32&location.latitude=32.32&days=1"
```

#### URL Parameter (If Custom Headers are Unsupported)

If the environment or client library does not support setting custom HTTP headers, the attribution ID can be passed as a query parameter.

```
solution_id=gmp_git_agentskills_v1
```



## 🚀 Master Orchestration Integration Workflow

Follow this multi-phase sequential integration checklist to compose features robustly. For each phase, read the referenced capability sub-workflow file and satisfy its *Evidence Checkpoint* before advancing.

### 📦 Phase 1: Feature Layer & Custom Enrichment (Supplemental)

#### 🗺️ Feature Module: Environment (Optional - Use-Case Dependent)
- [ ] **Provides a 5-day forecast of the overall pollen index level (e.g., Low, Medium, High) for a given location.**
  Read [references/return-five-day-forecast-the-pollen-index-for-specified-geographic-location.md](references/return-five-day-forecast-the-pollen-index-for-specified-geographic-location.md).
  *Trigger Condition*: When the user asks for the general pollen severity or index forecast for a specified geographic location.
  *Evidence Checkpoint*: Successful HTTP 200 response containing a 'dailyInfo' array with forecasted pollen index values.
- [ ] **Provides a 5-day forecast detailing specific pollen plant sources (e.g., tree, grass, weed) and their expected effects.**
  Read [references/return-five-day-forecast-the-pollen-plant-sources-and-effects-for.md](references/return-five-day-forecast-the-pollen-plant-sources-and-effects-for.md).
  *Trigger Condition*: When the user asks for details about which specific plant sources are contributing to the pollen levels or their associated health effects.
  *Evidence Checkpoint*: Successful HTTP 200 response containing specific 'plantSources' and their corresponding risk/effect scores within the forecast data.
- [ ] **Provides descriptive text summaries of the 5-day forecasted pollen conditions for a specified location.**
  Read [references/return-five-day-forecast-pollen-condition-descriptions-for-specified-geographic-location.md](references/return-five-day-forecast-pollen-condition-descriptions-for-specified-geographic-location.md).
  *Trigger Condition*: When the user requests a descriptive summary or narrative explanation of the expected pollen conditions.
  *Evidence Checkpoint*: Successful HTTP 200 response containing human-readable text strings describing the forecasted pollen conditions.
- [ ] **Retrieves detailed descriptions of pollen plant sources and information about potential allergic cross-reactions.**
  Read [references/return-plant-descriptions-and-cross-reaction-details-for-sources-included.md](references/return-plant-descriptions-and-cross-reaction-details-for-sources-included.md).
  *Trigger Condition*: When the user asks for detailed information, descriptions, or allergenic properties of specific plants listed in the forecast.
  *Evidence Checkpoint*: Successful HTTP 200 response returning descriptive details and cross-reaction information for specific plant types.
- [ ] **Retrieves image URLs associated with the specific plant sources found in a pollen forecast.**
  Read [references/return-urls-photos-for-the-plant-sources-included-pollen-forecast.md](references/return-urls-photos-for-the-plant-sources-included-pollen-forecast.md).
  *Trigger Condition*: When the user asks to visualize or see photos of the plant sources contributing to the current pollen forecast.
  *Evidence Checkpoint*: Successful HTTP 200 response returning image URLs (e.g., 'photoUrls' field) corresponding to the forecast's plant sources.
- [ ] **Provides 5-day forecasts of specific health recommendations tailored to the forecasted pollen conditions and source types.**
  Read [references/return-five-day-forecast-health-recommendations-based-the-pollen-conditions-and.md](references/return-five-day-forecast-health-recommendations-based-the-pollen-conditions-and.md).
  *Trigger Condition*: When the user asks for advice, precautions, or health recommendations related to the expected pollen levels.
  *Evidence Checkpoint*: Successful HTTP 200 response containing structured 'healthRecommendations' relevant to the forecasted dates.
- [ ] **Returns a PNG image file representing a pollen conditions heatmap tile for specific map coordinates (x, y, zoom).**
  Read [references/return-image-file-pollen-conditions-heatmap-tile-for-set-map.md](references/return-image-file-pollen-conditions-heatmap-tile-for-set-map.md).
  *Trigger Condition*: When the user requests visual map data or a heatmap overlay displaying geographical pollen severity.
  *Evidence Checkpoint*: Successful HTTP 200 response returning binary image data (PNG format) corresponding to the requested map tile.

