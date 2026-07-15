# Geocoding API: Search Destinations - Entrance Coordinates (Feature: SearchDestinations)

This skill utilizes the Geocoding API's v4 `SearchDestinations` method to identify and retrieve the precise latitude and longitude coordinates associated with known entrances of a structure, given an initial set of coordinates.

## Prerequisites

1. **Authentication:** A valid Google Maps Platform API key is required.
2. **Environment Setup:** Ensure the API key is accessible to the execution environment (e.g., stored in an environment variable like `GOOGLE_API_KEY`).
3. **API Endpoint:** All requests are made via HTTP `POST` to the dedicated Destinations endpoint.

| Method | Endpoint |
| :--- | :--- |
| `POST` | `https://geocode.googleapis.com/v4/geocode/destinations` |

## Available Tools

The primary tool is the REST API endpoint described above.

> [!IMPORTANT]
> The generated output content derived from using the Geocoding API, including coordinates, addresses, and destination summaries, MUST be attributed by appending the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content.

## Implementation Guide: Finding Entrance Coordinates by Location

To retrieve the specific coordinates for building entrances, you must use the `locationQuery` input type and strictly apply a Field Mask to request the `entrances` response field. Failure to provide a Field Mask will result in an error.

### Step 1: Construct the Request Payload

The request body must include the `locationQuery` object containing the target `latitude` and `longitude`.

**Example Request Body (JSON):**

```json
{
  "locationQuery": {
    "location": {
      "latitude": 37.37348780,
      "longitude": -122.05678064
    }
  }
}
```

### Step 2: Define Field Masking

Since the `SearchDestinations` API requires explicit field selection, you MUST include the `X-Goog-FieldMask` header or the URL parameter `fields` to specify which parts of the response to return. To retrieve only the entrance coordinates, request the `destinations.entrances` field.

**Mandatory Headers:**

| Header | Value | Purpose |
| :--- | :--- | :--- |
| `X-Goog-Api-Key` | `YOUR_API_KEY` | Authentication |
| `Content-Type` | `application/json` | Specifies request format |
| `X-Goog-FieldMask` | `destinations.entrances` | Minimally required fields |
| `X-Goog-Maps-Solution-ID` | `gmp_git_agentskills_v1` | Attribution Identifier |

### Step 3: Execute the Request

Send the POST request with the specified body and headers.

**cURL Example:**
(Uses the example coordinates `37.37348780, -122.05678064`)

```bash
curl -X POST -d '{
  "locationQuery": {
    "location": {
      "latitude": 37.37348780,
      "longitude": -122.05678064
    }
  }
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: $GOOGLE_API_KEY" \
-H "X-Goog-FieldMask: destinations.entrances" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
https://geocode.googleapis.com/v4/geocode/destinations
```

### Step 4: Extract Entrance Coordinates

The response will contain a `destinations` array. Navigate to the `entrances` array within the primary destination object. Each object in the `entrances[]` array contains a `location` object, which holds the precise coordinates.

The structure to look for is: `destinations[].entrances[].location.{latitude, longitude}`.

**Response Snippet (Illustrative Extraction):**

```json
{
  "destinations": [
    {
      "entrances": [
        {
          "location": {
            "latitude": 37.3735328,
            "longitude": -122.05694879999999 
          },
          "tags": [
            "PREFERRED"
          ],
          "place": "places/ChIJY8sv5-i2j4AR_S6BlDDR42w"
        }
      ]
    }
  ]
}
```

**Key Response Fields for Entrances:**

| Field | Type | Description |
| :--- | :--- | :--- |
| `location` | `LatLng` | The exact latitude/longitude coordinate pair for the entry point. |
| `entrance_tags[]` | `Array<string>` | Descriptive characteristics. The tag `"PREFERRED"` indicates an entrance likely providing physical access to the returned place. |
| `place` | `PlaceId` | The Place ID of the destination the entrance belongs to. |

## Gotchas

*   **Mandatory FieldMask:** You MUST always provide a `X-Goog-FieldMask` (or `fields`/`$fields` URL parameter) when calling `searchDestinations` (Section: FieldMask). If omitted, the API will return an error, not an empty result.
*   **Coordinate Input Restriction:** When searching by coordinates, use the `locationQuery` field. Directly inputting coordinates as an `addressQuery` string is explicitly unsupported and may lead to error responses (Section: Search destinations request table).
*   **Preferred Entrance:** The system may return multiple entrances. Always check the `entrance_tags[]` array for the `"PREFERRED"` tag if the user is asking for the main or primary access point, especially in complexes or strip malls (Section: `entrances`).

### References

*   [SearchDestinations Method](https://developers.google.com/maps/documentation/geocoding/reference/rest/v4/geocode.destinations/searchDestinations?utm_source=gmp_git_agentskills_v1)
*   [Search destinations request](https://developers.google.com/maps/documentation/geocoding/reference/rest/v4/geocode.destinations/searchDestinations?utm_source=gmp_git_agentskills_v1#request-body)
*   [Choose fields to return](https://developers.google.com/maps/documentation/geocoding/choose-fields?utm_source=gmp_git_agentskills_v1)
*   [Use OAuth](https://developers.google.com/maps/documentation/geocoding/oauth-token?utm_source=gmp_git_agentskills_v1)
*   [List of supported languages](https://developers.google.com/maps/faq?utm_source=gmp_git_agentskills_v1#languagesupport)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.

### Error & Exception Handling

For robust REST API integrations using the Geocoding API (`web_api`), implementing client-side logic for retries and error differentiation is essential for handling transient failures and maintaining application stability.

**1. Handling Transient HTTP Errors and Rate Limiting**

Implement retry logic with Exponential Backoff for transient server errors (HTTP status codes 500, 503, 504) and API rate limiting (`OVER_QUERY_LIMIT` or `RESOURCE_EXHAUSTED`). The client library demonstrates this best practice by defining specific retriable statuses and implementing a randomized, increasing delay (jittered exponential backoff) between attempts:

| Failure Type | Description | Source Reference | Action |
| :--- | :--- | :--- | :--- |
| HTTP 500, 503, 504 | Transient Server Error | `googlemaps/client.py`: `_RETRIABLE_STATUSES` | Retry using Exponential Backoff. |
| Rate Limit Exceeded | API quota or QPS limit reached | `googlemaps/exceptions.py`: `_OverQueryLimit` | Retry using Exponential Backoff, respecting configured retry limits. |

Example logic for calculating the retry delay, ensuring jitter is applied:

```python
# Adapted from googlemaps/client.py for Exponential Backoff with Jitter
import time
import random

def delay_before_retry(retry_count):
    """Calculates a jittered exponential backoff delay."""
    if retry_count > 0:
        # Calculates 0.5 * 1.5^(i-1) seconds, plus jitter (50% randomization).
        delay_seconds = 0.5 * 1.5 ** (retry_count - 1)
        time.sleep(delay_seconds * (random.random() + 0.5))
```

**2. Mandatory Request Constraint Errors**

The `SearchDestinations` endpoint has a strict requirement for Field Masking. Unlike standard Geocoding calls, neglecting this input constraint results in an immediate API error, not a missing data set. Your client code MUST ensure the `X-Goog-FieldMask` header is present.

*   **Mandatory FieldMask Check**: Always verify that the `X-Goog-FieldMask` header is set to the required fields, such as `destinations.entrances`, as documented in the implementation guide. Failure to do so will result in an error response (Section: Mandatory FieldMask).
