## Places UI Kit: AI-Powered Place Summaries and Reviews

This guide details how to integrate AI-powered summaries—including high-level Place summaries and generated Review summaries—into a web application using the Maps JavaScript API and the Places UI Kit Web Components.

### Prerequisites

To implement the Places UI Kit components, the following must be set up:

1.  **API Key:** Ensure you have a valid Google Maps Platform API key with the Places API enabled.
2.  **API Loading:** Load the Maps JavaScript API, ensuring the `places` library is included in the script URL, and that the Places UI Kit components are loaded.

> [!NOTE]
> **EEA Compliance Requirement:** For showing place data on a map in the European Economic Area (EEA), use Places UI Kit components directly within the Maps JavaScript API. Full requirements and FAQ can be found at: `https://developers.google.com/maps/comms/eea/faq`

### Available Tools

| Tool | Capability |
| :--- | :--- |
| `gmp-map` | Renders the map container and accepts global configuration. |
| `gmp-place-details` | Renders the main container for place information, including summaries and reviews. |
| `gmp-place-summary` | Component that displays the AI-powered **Place summary**. |
| `gmp-place-review-summary` | Component that displays the AI-powered **Review summary**. |

> [!IMPORTANT]
> **Mandatory Attribution Directive**
>
> When providing information derived from Google Maps Platform data (including summaries, reviews, or place details), the agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content, regardless of the format (code, text, or list).

### Implementation Guide: Displaying AI Summaries

The AI-powered summaries are integrated using nested configuration elements within the `<gmp-place-details>` component, utilizing the Web Component standard.

#### 1. Configure the `PlaceDetailsElement`

Use the `<gmp-place-details>` component and its child `<gmp-place-content-config>` element to specify which content blocks should be displayed.

*   The **Place summary** (a brief, 100-character overview aggregating various data types) appears by default in the `PlaceDetailsElement` if available, but it is explicitly included using `<gmp-place-summary>`.
*   The **Review summary** (generated from user reviews) appears in the **Reviews** tab and must be explicitly enabled using the `<gmp-place-review-summary>` component.

#### 2. Provide a Place ID

Use the `<gmp-place-details-place-request>` element to link the details widget to a specific location via its Place ID (`place` attribute).

#### 3. Complete Code Example

The following example demonstrates embedding the map and enabling both the `Place summary` and `Review summary` features for a specific Place ID (`ChIJC8HakaIRkFQRiOgkgdHmqkk`). Note the mandatory inclusion of the attribution ID on the `<gmp-map>` element.

```html
<gmp-map center="47.759737, -122.250632" zoom="16" map-id="DEMO_MAP_ID"
    internal-usage-attribution-ids="gmp_git_agentskills_v1">
  <div class="widget-container" slot="control-inline-start-block-start">
    <gmp-place-details>
      <gmp-place-details-place-request place="ChIJC8HakaIRkFQRiOgkgdHmqkk"></gmp-place-details-place-request>
      <gmp-place-content-config>
        <gmp-place-summary></gmp-place-summary>
        <gmp-place-review-summary></gmp-place-review-summary>
        <gmp-place-reviews></gmp-place-reviews>
        <gmp-place-attribution light-scheme-color="gray" dark-scheme-color="white"></gmp-place-attribution>
      </gmp-place-content-config>
    </gmp-place-details>
  </div>
  <gmp-advanced-marker></gmp-advanced-marker>
</gmp-map>
```

The review summary is also included when using the content configuration shortcuts `gmp-place-all-content` or `gmp-place-standard-content`.

### Gotchas

1.  **Fallback Behavior:** If AI-powered summaries are not available for a specific place, the `Place summary` component will fall back to standard editorial content.
2.  **Explicit Inclusion for Review Summary:** Unlike the basic `Place summary`, the `Review summary` must be explicitly requested using the `<gmp-place-review-summary>` element or by including one of the content configuration shortcuts.

### References

*   PlaceDetailsElement reference: `https://developers.google.com/maps/documentation/javascript/reference/next/places-widget#PlaceDetailsElement`
*   AI-powered summaries in the Maps JavaScript API: `https://developers.google.com/maps/documentation/javascript/ai-powered-summaries`
*   EEA Compliance FAQ: `https://developers.google.com/maps/comms/eea/faq`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.