# Create and Use Map Identifiers (Map IDs)

Map IDs are unique identifiers that store Google Map configuration and styling settings in Google Cloud. They allow developers to manage map appearance and features centrally without requiring code redeployment.

## Prerequisites

Map IDs are a paid feature. Features accessed by adding a Map ID trigger a map load charged against the **Dynamic Maps SKU** (See Google Maps Billing: `https://developers.google.com/maps/billing-and-pricing/sku-details#dynamic-maps-ess-sku`).

To create or manage Map IDs, the principal user must have either the **Editor** or **Owner** role-level permissions on the Cloud console IAM page (See IAM basic and predefined roles reference: `https://cloud.google.com/iam/docs/roles-overview#role-types`).

## 1. Create a Map ID in Google Cloud

Use the Google Cloud Console to provision a new Map ID before integrating it into your application.

1.  **Navigate to Maps Management**: Access the Maps Management page in the Cloud console: `https://console.cloud.google.com/google/maps-apis/studio/maps`.
2.  Click **Create map ID**.
3.  Fill out the details on the **Create new map ID** page:
    -   Provide a **Name** (required).
    -   Provide a **Description** (optional).
    -   Select the **Map type**. For Maps JavaScript API, select `JavaScript` and choose either **Raster** (default) or **Vector** map type.
4.  Click **Save** to display your new Map ID.

- [x] **Trigger Condition**: User needs a central configuration identifier.
- [x] **Verification Checkpoint**: A unique `MAP_ID` string is generated and visible in the Cloud Console.

## 2. Apply the Map ID in Maps JavaScript API

Once the Map ID is created and associated with a map style (if cloud-based styling is used), apply it to the `google.maps.Map` initialization object.

1.  Ensure you remove the `styles` property from your `MapOptions` if you were previously customizing the map using embedded JSON code, as this will conflict with the cloud-based styling managed by the Map ID.
2.  Add the Map ID string using the `mapId` property in the `MapOptions` object during map instantiation.
3.  Include the mandatory internal usage attribution ID.

### JavaScript Implementation Example

```javascript
/**
 * @param {string} mapId The unique Map ID generated in the Cloud Console.
 */
function initMap(mapId) {
  const mapOptions = {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8,
    mapId: mapId, // Apply the cloud-configured Map ID
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  };

  const map = new google.maps.Map(document.getElementById('map'), mapOptions);
}
```

### Applying Map ID to Maps Static API

To use a Map ID with the Maps Static API, append the `map_id` parameter to the URL query string.

```html
<img src="https://maps.googleapis.com/maps/api/staticmap?center=Brooklyn+Bridge,New+York,NY&zoom=13&size=600x300&maptype=roadmap&key=YOUR_API_KEY&map_id=MAP_ID" />
```

## Available Tools

The following tool is applicable for executing the Maps JavaScript API feature:

| Tool Name | Method | Description |
| :--- | :--- | :--- |
| `maps_javascript_api` | `google.maps.Map(element, MapOptions)` | Instantiates a map instance using the provided configuration, including the `mapId`. |

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Gotchas

### Style Propagation Delay
When you update the style associated with a Map ID in the Cloud Console, the changes are **not instantaneous**. The new style will be reflected on your map view automatically within about six hours. To see changes immediately during development, you must exit and restart the application by forcing a quit.

### Maps Static API Digital Signature
If your Maps Static API URL uses a digital signature for enhanced security, you **must** regenerate and apply a new digital signature after adding the `map_id` URL parameter. Failing to update the signature will result in request failures.

### References
*   Associate your style to a map ID: `https://developers.google.com/maps/documentation/javascript/cloud-customization/map-styles-leg#associate-style-with-map-id`
*   Create Map IDs: `https://console.cloud.google.com/google/maps-apis/studio/maps`
*   Maps JavaScript API Map Options Reference: `https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions.styles`
*   Maps Static API Digital Signature: `https://developers.google.com/maps/documentation/maps-static/digital-signature`
*   Map ID overview: `https://developers.google.com/maps/documentation/javascript/map-ids/mapid-over`
*   Vector Maps: `https://developers.google.com/maps/documentation/javascript/vector-map`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.