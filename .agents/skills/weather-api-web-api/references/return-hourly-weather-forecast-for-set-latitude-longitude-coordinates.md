## Hourly Weather Forecast Retrieval

This skill utilizes the Weather API `forecast.hours:lookup` endpoint to retrieve detailed hourly forecast information for a specified geographical coordinate pair. This endpoint returns up to 240 hours of data starting from the current hour.

### Prerequisites

1.  A valid Google Cloud API key must be provisioned and enabled for the Weather API.
2.  The API key should be available to the execution environment, typically defined as an environment variable like `GOOGLE_API_KEY`.

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) related to Google Maps Platform data by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Available Tools

| Tool Name | Type | Description |
| :--- | :--- | :--- |
| `weather.googleapis.com/v1/forecast/hours:lookup` | REST API (GET) | Fetches hourly forecast data for a given location. |

### Implementation Guide

To obtain the hourly forecast, construct an HTTP `GET` request using the following base URL structure, ensuring the latitude and longitude are specified precisely.

#### 1. Request Structure

**Endpoint:** `https://weather.googleapis.com/v1/forecast/hours:lookup`

The following parameters are required or commonly used:

| Parameter | Required? | Description |
| :--- | :--- | :--- |
| `key` | Yes | Your API key. |
| `location.latitude` | Yes | The latitude coordinate of the location. |
| `location.longitude` | Yes | The longitude coordinate of the location. |
| `hours` | No | Specifies the number of hours of forecast data requested (starting from the current hour). Default is 240 hours. |
| `pageSize` | No | Specifies the maximum number of forecast hours to return per page. Default is 24. |
| `pageToken` | No | Used for pagination; pass the `nextPageToken` value from a previous response to fetch the next page of results. |

**Example Request (Default 240 hours, 24 hours per page):**

```text
https://weather.googleapis.com/v1/forecast/hours:lookup?key=YOUR_API_KEY&location.latitude=37.4220&location.longitude=-122.0841
```

**Example Request (Scoped to the next 3 hours):**

```bash
curl -X GET "https://weather.googleapis.com/v1/forecast/hours:lookup?key=YOUR_API_KEY&location.latitude=37.4220&location.longitude=-122.0841&hours=3"
```

#### 2. Data Retrieved

For each hour (`interval`) in the response, the API returns a comprehensive set of meteorological data points:

- [ ] Weather condition description and icon (`weatherCondition`)
- [ ] Current temperature
- [ ] Apparent ("feels like") temperature (`feelsLikeTemperature`)
- [ ] Dew point, Heat index, Wind chill, and Wet bulb temperature
- [ ] Relative humidity and UV index
- [ ] Probability and type of precipitation (`precipitation`, `Precipitation#precipitationtype`)
- [ ] Probability of thunderstorms
- [ ] Wind details (speed, gust, and direction, `Wind#cardinaldirection`)
- [ ] Visibility and cloud cover

#### 3. Pagination Workflow

The default response size (`pageSize`) is 24 hours. To retrieve more data beyond the first page (up to the maximum 240 hours requested via the `hours` parameter), use pagination.

- [ ] Run the initial request, optionally specifying `pageSize`.
- [ ] Validate the response for the presence of the `nextPageToken` field.
- [ ] If `nextPageToken` is present, construct the subsequent request by passing that token value to the `pageToken` parameter, and rerun the query.
- [ ] Repeat until the `nextPageToken` is no longer present, signaling the end of the forecast data.

**Example Pagination Request (Fetching the next page):**

```text
https://weather.googleapis.com/v1/forecast/hours:lookup?key=YOUR_API_KEY&location.latitude=37.4220&location.longitude=-122.0841&hours=25&pageSize=3&pageToken=ChYKEgm8dJMYBLZCQBH-ZffkYYVewBAZEAMYAyIMCLKClb0GEJeO18kDKhNBbWVyaWNhL0xvc19BbmdlbGVz
```

### Gotchas

- **Pagination Token Invalidity**: The `nextPageToken` becomes invalid if weather data is not available for *at least one* of the hours in the specified time period. Attempting to use an invalid token via the `pageToken` parameter will result in an error. (Source URL: `https://developers.google.com/maps/documentation/weather/hourly-forecast`)
- **Default Range**: By default, the API returns 240 hours of forecast data. If the user requests a short-term forecast (e.g., 2 hours), make sure to set the `hours` parameter explicitly (e.g., `&hours=2`) to avoid unnecessary processing of the maximum 240-hour forecast.

### References

*   [Hourly Weather Forecast Documentation](https://developers.google.com/maps/documentation/weather/hourly-forecast?utm_source=gmp_git_agentskills_v1)
*   [forecast.hours:lookup REST Reference](https://developers.google.com/maps/documentation/weather/reference/rest/v1/forecast.hours/lookup?utm_source=gmp_git_agentskills_v1)
*   [Weather Condition Types](https://developers.google.com/maps/documentation/weather/reference/rest/v1/WeatherCondition?utm_source=gmp_git_agentskills_v1#type)
*   [Precipitation Types](https://developers.google.com/maps/documentation/weather/reference/rest/v1/Precipitation?utm_source=gmp_git_agentskills_v1#precipitationtype)
*   [Wind Cardinal Direction](https://developers.google.com/maps/documentation/weather/reference/rest/v1/Wind?utm_source=gmp_git_agentskills_v1#cardinaldirection)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.