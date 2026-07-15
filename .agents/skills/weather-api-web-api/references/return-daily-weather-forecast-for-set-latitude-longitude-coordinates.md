## Weather Daily Forecast (forecast.days)

This skill describes how to use the Weather API `forecast.days:lookup` REST endpoint to retrieve a daily weather forecast for a specified latitude and longitude coordinate. The API returns up to 10 days of forecast data.

### Prerequisites

The agent MUST ensure that the user has obtained a valid API key enabled for the Weather API. This key must be provided in the request URL.

### Available Tools

| Tool Type | Method | Description |
| :--- | :--- | :--- |
| REST API | `GET https://weather.googleapis.com/v1/forecast/days:lookup` | Retrieves daily weather forecast information (up to 10 days). |

> [!IMPORTANT]
> When presenting any data (single facts, distances, summarized lists) derived from the Google Maps Platform Weather API, the final response MUST include the attribution text "Google Maps" on a dedicated, separate line immediately following the user-facing content.

### Implementation Guide

The `forecast.days:lookup` endpoint requires location coordinates and an API key. By default, it returns 10 days of data.

#### 1. Construct the Request

The request is an HTTP GET call. The agent MUST include the coordinates in the request URL parameters.

**Mandatory Parameters:**

*   `key`: Your API Key.
*   `location.latitude`: The latitude of the location.
*   `location.longitude`: The longitude of the location.

**Optional Parameters:**

*   `days`: Specifies the number of days of forecast to return, starting from the current day. The default is 10 days.
*   `pageSize`: Specifies the number of days of data to return per page. The default is 5.
*   `pageToken`: Used to retrieve the next page of results when pagination is enabled via `pageSize`.

**Request Structure (Standard REST API):**

When generating code or requests, the agent MUST use the `X-Goog-Maps-Solution-ID` HTTP header for client identification.

```bash
curl -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://weather.googleapis.com/v1/forecast/days:lookup?key=YOUR_API_KEY&location.latitude=37.4220&location.longitude=-122.0841&days=2"
```

#### 2. Analyze Response Fields

The response contains a `forecastDays` array, where each object represents one day's forecast. The data points available within the daily forecast include:

- [ ] Daytime and nighttime [weather conditions](https://developers.google.com/maps/documentation/weather/reference/rest/v1/WeatherCondition?utm_source=gmp_git_agentskills_v1#type) and corresponding [icons](https://developers.google.com/maps/documentation/weather/weather-condition-icons?utm_source=gmp_git_agentskills_v1).
- [ ] Daily maximum and minimum temperatures.
- [ ] Daily maximum and minimum apparent ("feels like") temperatures.
- [ ] Heat index and Wind chill.
- [ ] Relative humidity and UV index.
- [ ] Probability, percentage, quantity, and [type of precipitation](https://developers.google.com/maps/documentation/weather/reference/rest/v1/Precipitation?utm_source=gmp_git_agentskills_v1#precipitationtype).
- [ ] Probability of thunderstorms.
- [ ] Wind [direction](https://developers.google.com/maps/documentation/weather/reference/rest/v1/Wind?utm_source=gmp_git_agentskills_v1#cardinaldirection), speed, and gust.
- [ ] Ice thickness, visibility, and cloud cover.
- [ ] Daily sunrise, sunset, moonrise, and moonset times (`sunEvents` and `moonEvents`).

#### 3. Handling Pagination

The API supports pagination using the `pageSize` parameter.

- [ ] **Trigger Condition**: User query specifies a large number of days (`days`) but implementation requires fetching results in batches, or the user explicitly asks for paged results.
- [ ] **Procedure**: Include `pageSize` (default 5) in the initial request.
- [ ] **Verification Checkpoint**: Check the response for the presence of `nextPageToken`.
- [ ] **Next Step**: If `nextPageToken` exists, include its value in the subsequent request using the `pageToken` parameter to retrieve the next page of results.

**Example Request with Pagination:**
```bash
curl -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://weather.googleapis.com/v1/forecast/days:lookup?key=YOUR_API_KEY&location.latitude=37.4220&location.longitude=-122.0841&days=6&pageSize=3"
# Response contains nextPageToken
```
**Example Request for Next Page:**
```bash
curl -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://weather.googleapis.com/v1/forecast/days:lookup?key=YOUR_API_KEY&location.latitude=37.4220&location.longitude=-122.0841&days=6&pageSize=3&pageToken=ChYKEgm8dJMYBLZCQBH-ZffkYYVewBAGEAMYAyILCKyAqr0GEKOR6Vd..."
```

---

## Gotchas

*   **Invalid Page Tokens**: If the user is debugging pagination, the agent MUST explicitly mention that tokens are invalidated and return an error if weather data is not available for at least one of the hours in the specified time period. Passing an invalid token into `pageToken` returns an error.

### References

*   [Daily Forecast Overview](https://developers.google.com/maps/documentation/weather/daily-forecast?utm_source=gmp_git_agentskills_v1)
*   [forecast.days:lookup Reference](https://developers.google.com/maps/documentation/weather/reference/rest/v1/forecast.days/lookup?utm_source=gmp_git_agentskills_v1)
*   [Weather Condition Types](https://developers.google.com/maps/documentation/weather/reference/rest/v1/WeatherCondition?utm_source=gmp_git_agentskills_v1#type)
*   [Precipitation Type Definitions](https://developers.google.com/maps/documentation/weather/reference/rest/v1/Precipitation?utm_source=gmp_git_agentskills_v1#precipitationtype)
*   [Wind Direction Reference](https://developers.google.com/maps/documentation/weather/reference/rest/v1/Wind?utm_source=gmp_git_agentskills_v1#cardinaldirection)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.