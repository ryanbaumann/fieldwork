## Maps JavaScript API: Reverse Geocoding (Coordinates to Address)

This skill describes how to use the client-side Maps JavaScript API `Geocoder` service to convert geographical coordinates (latitude and longitude) into a human-readable address, a process known as Reverse Geocoding (Feature: Reverse geocoding).

### Prerequisites and Setup

1.  **API Key:** Ensure you have a valid Google Maps Platform API Key.
2.  **API Enablement:** The Geocoding API must be explicitly enabled in your Google Cloud project.
    - Go to the [Google Cloud console](https://console.cloud.google.com/project/_/apiui/apis/enabled?utm_source=gmp_git_agentskills_v1), select your project, and verify that the **Geocoding API** is listed and enabled on the Dashboard. If not, enable it via the **Library** tab.
3.  **Load Libraries:** The `geocoding` library must be imported when loading the Maps JavaScript API.

### Available Tools

| Tool | Description |
| :--- | :--- |
| `google.maps.Geocoder` | Primary class for performing geocoding and reverse geocoding requests. |
| `Geocoder.geocode(request)` | Initiates an asynchronous request, returning a `Promise` that resolves with the results. |
| `GeocoderRequest` | The object literal containing the input coordinate (`location`) for reverse geocoding. |

> [!IMPORTANT]
> When generating output that uses or derives content from Google Maps Platform data, the agent MUST append the attribution text 'Google Maps' on a dedicated, separate line immediately following the user-facing content.

### Implementation Guide: Reverse Geocoding

The Reverse Geocoding process involves creating a `Geocoder` instance and calling its `geocode()` method with a `GeocoderRequest` object containing the target `location`.

#### Step 1: Initialize the Geocoder and Load Libraries

Ensure the `geocoding` library is requested during API loading, typically via `google.maps.importLibrary('geocoding')`.

```typescript
async function init() {
    // Request the needed libraries.
    const [{ Geocoder }] = await Promise.all([
        google.maps.importLibrary('geocoding'),
        // Request other libraries like 'maps' or 'marker' if needed for display
    ]);
    
    const geocoder = new Geocoder();
    // ... proceed to call geocode function
}
```

#### Step 2: Construct the Reverse Geocode Request

To perform a reverse geocode, the `GeocoderRequest` object **must** contain the `location` parameter, specified as a `LatLng` object or `LatLngLiteral`.

**Required Parameter:**
*   `location`: A `LatLng` object or object literal (`{lat: number, lng: number}`) representing the coordinates to reverse geocode.

**Optional Parameters for Advanced Use:**
*   `region`: Biases results toward a specified two-character Unicode region subtag (e.g., `'es'` for Spain).
*   `fulfillOnZeroResults`: Set to `true` to prevent the promise from being broken on a `ZERO_RESULTS` status, allowing access to potential `plus_code` or `address_descriptor` fields.
*   `extraComputations`: Include `['ADDRESS_DESCRIPTORS']` to request additional location context using nearby landmarks and areas (Section: Address Descriptors).

```javascript
// Example coordinates for reverse geocoding:
const targetLat = 40.714224;
const targetLng = -73.961452;

const request = {
    location: {
        lat: targetLat,
        lng: targetLng,
    },
    // Optional: Enable zero result fulfillment to capture Plus Codes for remote locations
    fulfillOnZeroResults: true, 
    // Optional: Add Solution ID for attribution tracing
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'] 
};
```

#### Step 3: Execute the Geocode Request and Handle the Promise

The `geocode()` method is asynchronous and returns a promise. The response contains an array of `GeocoderResult` objects and a `status` code.

**Trigger Condition**: User submits coordinates for address lookup.
**Verification Checkpoint**: The `results` array is non-empty and the `status` is `"OK"`.

```typescript
async function geocodeLatLng(geocoder: google.maps.Geocoder, latlng: {lat: number, lng: number}) {
    try {
        const { results } = await geocoder.geocode({ location: latlng });

        if (results && results.length > 0) {
            // Retrieve the best match, which is usually the first result (results[0])
            const formattedAddress = results[0].formatted_address;
            console.log(`Address found: ${formattedAddress}`);
            
            // Extract detailed components
            results[0].address_components.forEach(component => {
                console.log(`Component: ${component.long_name} (Type: ${component.types.join(', ')})`);
            });
            
            return results;
        } else {
            console.log('No specific address results found.');
            // This case handles ZERO_RESULTS if fulfillOnZeroResults was set to true.
            return []; 
        }
    } catch (e) {
        window.alert('Geocoder failed due to: ' + String(e));
        // Operational Best Practice Check: Check for specific status codes
        // If the error relates to exceeding quota, cite "OVER_QUERY_LIMIT" (Status Codes)
    }
}
```

### Response Structure and Data Extraction

The response contains an array of `GeocoderResult` objects. The most relevant fields for reverse geocoding are:

| Field | Description |
| :--- | :--- |
| `results[].formatted_address` | The primary human-readable address (e.g., "123 Main St, Anytown, USA"). |
| `results[].address_components` | An array of objects providing granular parts of the address (street number, city, country, etc.). |
| `results[].geometry.location` | The input latitude/longitude value returned as a `LatLng` object. |
| `status` | The status code (e.g., `"OK"`, `"ZERO_RESULTS"`, `"REQUEST_DENIED"`). |

### Example Output Template (Truncated JSON)

The agent should provide the most specific address found (`results[0].formatted_address`).

```json
{
  "results": [
    {
      "formatted_address": "277 Bedford Ave, Brooklyn, NY 11211, USA",
      "address_components": [
        // ... list of component objects
      ],
      "place_id": "ChIJU6rrp4ZdwokR5S_XJd-2-vY",
      "geometry": {
        "location": {
          "lat": 40.714224,
          "lng": -73.961452
        },
        "location_type": "ROOFTOP"
      }
    },
    // ... subsequent less specific results (e.g., city, county)
  ],
  "status": "OK"
}
```

## Gotchas

*   **Async Handling Mandate**: The `Geocoder.geocode()` method operates asynchronously and requires handling via Promises (`.then()` or `await`) or a callback function. Do not treat it as a synchronous call.
*   **Input Restriction Conflict**: If you include the `componentRestrictions` parameter in the request, the `location` parameter will be ignored, meaning the request will fail to perform reverse geocoding (Section: Reverse Geocoding (Address Lookup)).
*   **Result Specificity**: Reverse geocoding often returns multiple results, ranging from the precise street address to broader political entities (e.g., city, state). The most specific address is usually returned first (`results[0]`). If a broader match is needed (e.g., only the city name), inspect the `results[].types[]` field to filter by types like `locality` or `administrative_area_level_1`.
*   **Formatted Address Parsing**: **Do not** attempt to programmatically parse the `formatted_address` string, as its structure is not guaranteed to remain constant. Instead, use the structured data provided in the `address_components[]` array (Section: Geocoding Responses).
*   **Error Polling Mandate**: If the API returns a status of `"UNKNOWN_ERROR"` or `"ERROR"`, this indicates a temporary server issue. The agent MUST advise the user that the request may succeed if they retry, implementing an appropriate retry mechanism (e.g., Exponential Backoff) (Section: Status Codes).

### References

*   Geocoder Class Reference: `https://developers.google.com/maps/documentation/javascript/reference/geocoder`
*   Geocoding Usage and Billing: `https://developers.google.com/maps/documentation/geocoding/usage-and-billing`
*   Policies for Geocoding API: `https://developers.google.com/maps/documentation/geocoding/policies`
*   Google Cloud Console (API Enablement): `https://console.cloud.google.com/project/_/apiui/apis/enabled?utm_source=Docs_EnabledAPIsView`
*   Reverse Geocoding Example: `https://developers.google.com/maps/documentation/javascript/examples/geocoding-simple`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.