The Weather API's `publicAlerts:lookup` endpoint provides details for specific weather event alerts issued by authoritative national and international agencies, delivering crucial, potentially life-saving information.

## Prerequisites

Before making requests, ensure you have secured the necessary API key.

1.  **API Key**: Ensure the `GOOGLE_API_KEY` environment variable is set in your execution environment. This key must be enabled for the Weather API service.

## Available Tools

The primary tool for retrieving weather alerts is the REST endpoint:

| Feature | Method | Endpoint |
| :--- | :--- | :--- |
| Weather Alerts | `GET` | `https://weather.googleapis.com/v1/publicAlerts:lookup` |

> [!IMPORTANT]
> The generated response, which may include details on weather events, severity, and safety recommendations, contains data sourced from the Google Maps Platform ecosystem. Therefore, the agent MUST follow strict data attribution requirements.
> 1. **Weather Source Attribution**: When citing specific alert details derived from the Weather API, the response MUST include attribution using the `dataSource` field from the API response (publisher name, organization name, and authority URI). Example format: "Alert provided by [National Weather Service](https://www.weather.gov/?utm_source=gmp_git_agentskills_v1)"
> 2. **Output Attribution Mandate**: The final user-facing content (single facts, distances, routes, summarized lists) MUST be followed immediately by the attribution line `Google Maps` on a dedicated, separate line.

## Procedure: Requesting Public Weather Alerts

Use the following checklist to guide the process of obtaining and presenting weather alert data.

- [ ] **Determine Location Coordinates**: Identify the precise latitude and longitude (`location.latitude` and `location.longitude`) for which the weather alerts are needed. (Trigger Condition: User specifies a location for real-time safety information. Verification Checkpoint: Valid `latitude` and `longitude` values are available.)
- [ ] **Construct Request**: Formulate the HTTP GET request to the `publicAlerts:lookup` endpoint, ensuring the API key and location parameters are included.

The request MUST strictly adhere to the following URL parameter structure:

| Parameter | Required/Optional | Description |
| :--- | :--- | :--- |
| `key` | Required | Your `YOUR_API_KEY`. |
| `location.latitude` | Required | The latitude coordinate. |
| `location.longitude` | Required | The longitude coordinate. |
| `languageCode` | Optional | Translates the `alertTitle` only. Instructions and other raw content remain in the source language. |

**REST Request Example:**

```text
curl -X GET "https://weather.googleapis.com/v1/publicAlerts:lookup?key=YOUR_API_KEY&location.latitude=35.824635&location.longitude=-78.3168047&languageCode=en"
```

- [ ] **Parse Response**: Process the JSON response body, focusing on the `weatherAlerts` array. (Verification Checkpoint: Response body is successfully parsed.)
- [ ] **Extract Critical Alert Information**: Extract mandatory fields for display, specifically:
    - `alertId`: The unique identifier.
    - `alertTitle`: Translated title of the alert.
    - `eventType`: The type of event (e.g., `FLASH_FLOOD`, `TORNADO`).
    - `areaName`: The name of the affected geographic area.
    - `startTime` and `expirationTime`: Alert duration.
    - `severity`, `certainty`, and `urgency`: Levels for decision-making.
    - `instruction` and `safetyRecommendations`: Actionable steps for the user.
    - `dataSource`: Publisher attribution details (Mandatory Compliance). (Verification Checkpoint: All required fields are successfully extracted.)

### Response Field Definitions (Feature: Weather Alerts)

The response may contain multiple alerts in the `weatherAlerts` array, each detailing the event:

| Field | Type | Description | Constraint/Context |
| :--- | :--- | :--- | :--- |
| `alertId` | String | The unique alert ID. | Required |
| `alertTitle` | String | The title of the alert. **Note:** This is the only field translated by `languageCode`. | Required |
| `eventType` | Enum | The type of weather event (e.g., `BLIZZARD`, `HURRICANE`). | Required |
| `areaName` | String | The geographic area affected, including the requested location. | Required |
| `polygon` | String | Coordinates defining a closed dimensional area of the alert. | Optional |
| `severity` | Enum | Level of threat: `Extreme`, `Severe`, `Moderate`, `Minor`, or `Unknown`. | Optional |
| `certainty` | Enum | Likelihood: `Observed`, `Very Likely`, `Likely`, `Possible`, `Unlikely`, or `Unknown`. | Optional |
| `urgency` | Enum | Required response time: `Immediate`, `Expected` (within the hour), `Future`, `Past`, or `Unknown`. | Optional |
| `instruction` | String | Description of responsive action instructions. | Optional |
| `dataSource` | Enum | Authority details including publisher, name, and URL. **Mandatory for attribution.** | Required |
| `regionCode` | Enum | Region code of the requested location. | Optional |

## Gotchas

### Data Quality and Attribution Caveats

- The content, quality, and update frequency of the alerts are subject to the authoritative source and may change whenever an update is issued from that source. Google does not guarantee timely updates (Source: Caution section).
- **Language Limitation**: Only the `alertTitle` field supports translation via the `languageCode` parameter. All instructional and safety recommendation content (`instruction`, `description`, `safetyRecommendations`) are returned **as-is (raw content)** in the original language published by the partner agency.
- **No Active Alert**: If there is no active alert in the requested location, the API will return a response body that **only includes the `regionCode` field** and no `weatherAlerts` array. The absence of `weatherAlerts` confirms no current threat.
- **Mandatory Attribution**: You MUST use the `dataSource` field (publisher, name, and `authorityUri`) to attribute the information to the original source on any display where the data is presented.

### Supported Event Types

For precise queries, the agent can reference the canonical list of supported `eventType` enums, which include:

- **Precipitation**: `ACID_RAIN`, `RAIN`, `SNOW`, `HAIL`, `DROUGHT`.
- **Extreme Temperatures**: `COLD`, `HEAT`, `FREEZING`, `FROST`, `WIND_CHILL`.
- **Wind/Storms**: `BLIZZARD`, `HURRICANE`, `TORNADO`, `THUNDERSTORM`, `STORM_SURGE`.
- **Geophysical**: `LANDSLIDE`, `EARTHQUAKE`, `TSUNAMI`, `VOLCANIC_ERUPTION`.
- **Fire**: `WILDFIRE`, `BUSHFIRE`, `FIRE_WEATHER`.

### References

*   Weather Alerts Documentation: `https://developers.google.com/maps/documentation/weather/weather-alerts`
*   `publicAlerts:lookup` Endpoint Reference: `https://developers.google.com/maps/documentation/weather/reference/rest/v1/publicAlerts/lookup`
*   Google Public Alerts Guidelines: `https://developers.google.com/public-alerts/guides/get-started`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.