---
name: weather-api-web-api
description: Use this skill when retrieving current weather conditions, daily or hourly forecasts, 24-hour historical data, or real-time weather alerts for specified latitude and longitude coordinates via the Google Maps Platform Weather API.
license: Apache-2.0
metadata:
  version: 1.0.41
---


> [!IMPORTANT]
> **Core Dependency:** This skill requires active context from [google-maps-platform/SKILL.md](../google-maps-platform/SKILL.md).

### Overview
This skill provides access to the Google Maps Platform Weather API, allowing developers to fetch comprehensive atmospheric and climate data for specific geographic locations. It supports five core weather information requests: current conditions, daily forecasts (up to 15 days), hourly forecasts (up to 120 hours), recent 24-hour historical data, and real-time weather alerts. All data is requested using latitude and longitude coordinates.

### Mandatory settings

#### Standard REST/Web API Requests
When communicating with the Weather API endpoints via direct HTTP requests, the mandatory usage attribution ID must be included in the request header using `X-Goog-Maps-Solution-ID`.

```
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
```



## 🚀 Master Orchestration Integration Workflow

Follow this multi-phase sequential integration checklist to compose features robustly. For each phase, read the referenced capability sub-workflow file and satisfy its *Evidence Checkpoint* before advancing.

### 📦 Phase 1: Feature Layer & Custom Enrichment (Supplemental)

#### 🗺️ Feature Module: Weather (Optional - Use-Case Dependent)
- [ ] **Fetches the current, real-time weather conditions (temperature, humidity, pressure, etc.) for a specified location using latitude and longitude coordinates.**
  Read [references/return-current-weather-conditions-for-set-latitude-longitude-coordinates.md](references/return-current-weather-conditions-for-set-latitude-longitude-coordinates.md).
  *Trigger Condition*: When the user asks for the 'current weather,' 'what is the temperature now,' or 'real-time conditions' at a specific location.
  *Evidence Checkpoint*: Successful HTTP request returns a JSON payload containing current weather data, including a timestamp confirming recent observation time.
- [ ] **Provides a summary day-by-day weather forecast (max/min temperatures, general conditions) for a future period for a specified location.**
  Read [references/return-daily-weather-forecast-for-set-latitude-longitude-coordinates.md](references/return-daily-weather-forecast-for-set-latitude-longitude-coordinates.md).
  *Trigger Condition*: When the user asks for a 'daily,' 'multi-day,' or 'week-ahead' weather forecast.
  *Evidence Checkpoint*: Successful HTTP request returns a JSON payload containing an array of forecast objects indexed by date.
- [ ] **Provides a detailed hourly breakdown of expected weather conditions for a specified future period for a given location.**
  Read [references/return-hourly-weather-forecast-for-set-latitude-longitude-coordinates.md](references/return-hourly-weather-forecast-for-set-latitude-longitude-coordinates.md).
  *Trigger Condition*: When the user asks for a detailed 'hourly' or 'step-by-step' weather forecast for the coming hours.
  *Evidence Checkpoint*: Successful HTTP request returns a JSON payload containing an array of granular forecast objects indexed by hour.
- [ ] **Retrieves historical hourly weather observations and data points for the last 24 hours at a specified coordinate.**
  Read [references/return-hours-hourly-historical-weather-data-for-set-latitude-longitude-coordinates.md](references/return-hours-hourly-historical-weather-data-for-set-latitude-longitude-coordinates.md).
  *Trigger Condition*: When the user requests historical weather data or observations from the recent past (up to 24 hours ago).
  *Evidence Checkpoint*: Successful HTTP request returns a JSON payload containing historical hourly weather data points timestamped within the specified time range.
- [ ] **Checks and returns any severe or critical real-time weather alerts, warnings, or watches issued for a specific geographical location.**
  Read [references/return-weather-alerts-occurring-real-time-for-given-latitude-and.md](references/return-weather-alerts-occurring-real-time-for-given-latitude-and.md).
  *Trigger Condition*: When the user asks specifically for 'weather alerts,' 'warnings,' or 'watches' for an area.
  *Evidence Checkpoint*: Successful HTTP request returns a JSON payload detailing current weather alerts or an empty structure if no alerts are active for the coordinates.

