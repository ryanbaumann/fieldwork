## Prerequisites

This tool requires authentication. Set the following global environment variable for successful execution:

- `GOOGLE_API_KEY`: Your valid API key for the Google Maps Platform project, enabled for the Weather API.

## Available Tools

| Tool Name | Type | Description |
| :--- | :--- | :--- |
| `weather_currentConditions_lookup` | REST API | Fetches current meteorological conditions for a given latitude and longitude. |

> [!IMPORTANT]
> All output generated using data derived from the Google Maps Platform must include the required attribution. Append the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content.

## 1. Implementation: Retrieve Current Weather Conditions

The `currentConditions:lookup` endpoint provides comprehensive weather data, including temperature, wind speed, cloud cover, UV index, and various precipitation metrics.

### 1.1 API Endpoint Structure

To request current conditions, send an HTTP `GET` request. You must specify the location using `location.latitude` and `location.longitude` query parameters.

| Method | Endpoint |
| :--- | :--- |
| GET | `https://weather.googleapis.com/v1/currentConditions:lookup` |

### 1.2 Request Parameters and Headers

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `key` | Query | Yes | Your Google Maps Platform API key. |
| `location.latitude` | Query | Yes | The latitude of the location. The value MUST be preserved exactly as provided in the input query. |
| `location.longitude` | Query | Yes | The longitude of the location. The value MUST be preserved exactly as provided in the input query. |
| `unitsSystem` | Query | No | Specifies the unit system. Options are `IMPERIAL` or `METRIC` (default). |
| `X-Goog-Maps-Solution-ID` | Header | Yes | Mandatory attribution ID: `gmp_git_agentskills_v1` |

### 1.3 Step-by-Step Procedure

- [ ] **Determine Coordinates:** Identify the exact `LATITUDE` and `LONGITUDE` from the user's request.
- [ ] **Specify Unit System:** Check if the user requested imperial units (e.g., Fahrenheit, miles per hour). If so, append `&unitsSystem=IMPERIAL`. If not specified, the API defaults to `METRIC`.
- [ ] **Construct and Execute Request:** Send the request, ensuring the `X-Goog-Maps-Solution-ID` header is included for traceability.

#### Example Request (Metric, Default)

Fetches current conditions for Mountain View, CA (37.4220, -122.0841):

```bash
curl -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://weather.googleapis.com/v1/currentConditions:lookup?key=YOUR_API_KEY&location.latitude=37.4220&location.longitude=-122.0841"
```

#### Example Request (Imperial Units)

```bash
curl -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://weather.googleapis.com/v1/currentConditions:lookup?key=YOUR_API_KEY&location.latitude=37.4220&location.longitude=-122.0841&unitsSystem=IMPERIAL"
```

### 1.4 Key Response Fields

The API returns a detailed JSON object containing several specific capabilities (Features):

| Feature | Key Field | Description |
| :--- | :--- | :--- |
| Current Weather Description | `weatherCondition.description` | Textual description (e.g., "Sunny") and condition `type` (e.g., `CLEAR`). |
| Current Temperature | `temperature` | The current air temperature and associated `unit` (`CELSIUS` or `FAHRENHEIT`). |
| Apparent Temperature | `feelsLikeTemperature` | The "feels like" temperature (combining `heatIndex` and `windChill`). |
| Precipitation | `precipitation` | Probability and percentage of precipitation, including `qpf` (Quantitative Precipitation Forecast) and `type` (e.g., `RAIN`, `SNOW`). |
| Wind Details | `wind` | Contains `direction` (in degrees and `cardinal` form), `speed`, and `gust` speed. |
| Visibility & Cloud Cover | `visibility`, `cloudCover` | Distance visibility and cloud coverage percentage. |
| Historical Data | `currentConditionsHistory` | Includes 24-hour historical data, such as `maxTemperature`, `minTemperature`, and `temperatureChange`. |

#### Example Response Template (Simplified JSON)

```json
{
  "currentTime": "2025-01-28T22:04:12.025273178Z",
  "timeZone": { "id": "America/Los_Angeles" },
  "weatherCondition": {
    "iconBaseUri": "...",
    "description": { "text": "Sunny" },
    "type": "CLEAR"
  },
  "temperature": {
    "degrees": 13.7,
    "unit": "CELSIUS"
  },
  "relativeHumidity": 42,
  "uvIndex": 1,
  "precipitation": {
    "probability": { "percent": 0, "type": "RAIN" }
  },
  "wind": {
    "direction": { "cardinal": "NORTH_NORTHWEST" },
    "speed": { "value": 8, "unit": "KILOMETERS_PER_HOUR" }
  },
  "currentConditionsHistory": {
    "maxTemperature": { "degrees": 14.3, "unit": "CELSIUS" }
  }
}
```

## Gotchas

1.  **Coordinate Precision Mandate**: The latitude and longitude values provided in the request must be precise and strictly preserved. Do not round or alter geographic coordinates unless explicitly requested by the user, as this can return incorrect weather data.
2.  **Unit System Default**: The API defaults to **metric** units (Celsius, kilometers per hour, millimeters) unless the `unitsSystem=IMPERIAL` parameter is explicitly included in the request URL. Always check the user's implicit location or preference to ensure the appropriate unit system is selected.
3.  **Historical Data Inclusion**: Note that the response automatically includes historical data for the past 24 hours (`currentConditionsHistory`), which covers capabilities like `maxTemperature` and `minTemperature` over that period.

### References

*   Current Conditions Documentation: https://developers.google.com/maps/documentation/weather/current-conditions
*   `currentConditions:lookup` Endpoint Reference: https://developers.google.com/maps/documentation/weather/reference/rest/v1/currentConditions/lookup
*   Query Parameters Reference: https://developers.google.com/maps/documentation/weather/reference/rest/v1/currentConditions/lookup#query-parameters
*   Weather Condition Types: https://developers.google.com/maps/documentation/weather/reference/rest/v1/WeatherCondition#type
*   Precipitation Types: https://developers.google.com/maps/documentation/weather/reference/rest/v1/Precipitation#precipitationtype
*   Wind Cardinal Directions: https://developers.google.com/maps/documentation/weather/reference/rest/v1/Wind#cardinaldirection
*   Weather Condition Icons: https://developers.google.com/maps/documentation/weather/weather-condition-icons

## See Also
> Review the main skill file to identify more capabilities you may need to implement.