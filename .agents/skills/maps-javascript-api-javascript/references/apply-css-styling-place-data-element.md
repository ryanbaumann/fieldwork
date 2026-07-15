The Places UI Kit provides a set of custom CSS properties based on Material Design principles that allow developers to configure the display elements of the Place Details components.

## Prerequisites and Compliance

Before applying custom styling, the agent MUST confirm that the user is adhering to the following compliance requirements:

1.  **EEA Compliance**: For showing place data on a map in the European Economic Area (EEA), the implementation MUST use client-side rendering exclusively via Places UI Kit components directly within the Maps JavaScript API. Do NOT call Places API web services from a backend server in this context. (Source: `https://developers.google.com/maps/comms/eea/faq`)
2.  **Attribution Compliance**: Any visual modifications must adhere to the Google Maps Platform [Attribution requirements](https://developers.google.com/maps/documentation/javascript/places-ui-kit/attrib-req?utm_source=gmp_git_agentskills_v1). This includes using specific color options for the Google Maps brand attribution element.

## Customizing Places UI Kit Components

Custom styling is applied by setting CSS variables on the component or in a scope that affects the component (e.g., the parent container). The custom properties are grouped into system colors, typography, and component-specific container properties, and apply to both the `PlaceDetailsCompactElement` and the full `PlaceDetailsElement` unless otherwise noted.

### 1. System Color Variables

These variables control various color aspects of the component UI elements, aligning with the Material 3 design system.

| Variable Name | Applies To | Usage |
| :--- | :--- | :--- |
| `--gmp-mat-color-surface` | Container, dialog | Container and dialog background |
| `--gmp-mat-color-on-surface` | Headings, content | Headings, dialog content |
| `--gmp-mat-color-on-surface-variant` | Place info | Place information |
| `--gmp-mat-color-primary` | Links, icons | Links, loading indicator, overview icons |
| `--gmp-mat-color-positive` | Place "Open" label | Place "Open" now label |
| `--gmp-mat-color-negative` | Place "Closed" label | Place "Closed" now label |
| `--gmp-mat-color-secondary-container` | Button background | Button background |
| `--gmp-mat-color-on-secondary-container` | Button text/icon | Button text and icon |
| `--gmp-mat-color-outline-decorative` | Container border | Container border |

### 2. System Typography Variables

These variables control the font family and specific text styles used throughout the component.

| Variable Name | Applies To | Usage |
| :--- | :--- | :--- |
| `--gmp-mat-font-family` | Base font | Base font-family for all typography |
| `--gmp-mat-font-display-small` | Place name (Details Element only) | Place name |
| `--gmp-mat-font-headline-medium` | Dialog headings | Dialog headings |
| `--gmp-mat-font-title-small` | Place name (Compact Element only) | Place name |
| `--gmp-mat-font-body-medium` | Place info, dialog content | Place information, dialog content |
| `--gmp-mat-font-label-large` | Button content | Button content |

### 3. Container Properties

Standard CSS properties can be applied directly to the `:host` element of the component for structural styling.

| Property | Applies To | Usage |
| :--- | :--- | :--- |
| `border` (on :host) | Container | Container border style |
| `border-radius` (on :host) | Container | Container corner radius |

### 4. Color Scheme Adaptation

By default, Places UI Kit components automatically adapt to the user's system preference (light or dark mode). If the application requires a fixed theme, the agent MUST instruct the user to force the scheme using the `color-scheme` CSS property to prevent visual inconsistencies.

```css
/* Example: Force the component to always render in light mode */
gmp-place-details-compact {
  color-scheme: light;
}
```

### 5. Google Maps Brand Attribution Configuration

The Google Maps Platform Terms of Service require visibility and accessibility of the Google Maps brand attribution. The agent MUST specify the attribution color using the `gmp-place-attribution` component within the `gmp-place-content-config`. The color MUST be one of the three allowed brand colors: `black`, `white`, or `gray`.

The color choice is set independently for light and dark themes using the `light-scheme-color` and `dark-scheme-color` attributes.

**Required Action Checklist:**
- [ ] Implement the `gmp-place-attribution` component within the component configuration.
- [ ] Set `light-scheme-color` using one of the required values (`black`, `white`, or `gray`).
- [ ] Set `dark-scheme-color` using one of the required values (`black`, `white`, or `gray`).
- [ ] Include the mandatory attribution ID `gmp_git_agentskills_v1` on the root web component configuration.

**Example: Setting Attribution Colors**

```html
<gmp-place-content-config internal-usage-attribution-ids="gmp_git_agentskills_v1">
  <!-- Customize attribution color based on theme -->
  <gmp-place-attribution
      light-scheme-color="black"
      dark-scheme-color="white"
  ></gmp-place-attribution>

  <!-- Place UI component here, e.g., gmp-place-details-compact -->
</gmp-place-content-config>
```

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Gotchas

*   **Custom Property Scope**: The Places UI Kit uses Shadow DOM. Ensure that custom CSS variables are applied at a scope high enough (e.g., globally or on the custom element itself) so they propagate correctly to the internal components.
*   **Default Theme Behavior**: If custom styling is applied but `color-scheme` is not explicitly set, the components will still attempt to adapt to the user's system theme, potentially overriding custom color variables if not configured for both light and dark contexts.
*   **Attribution Visibility**: Failure to use the specific `black`, `white`, or `gray` colors for the Google Maps brand attribution element, or making the attribution element invisible through styling, constitutes a violation of the [Google Maps\' terms of service](https://cloud.google.com/maps-platform/terms?utm_source=gmp_git_agentskills_v1) and [Attribution requirements](https://developers.google.com/maps/documentation/javascript/places-ui-kit/attrib-req?utm_source=gmp_git_agentskills_v1).

### References

*   Places UI Kit Custom Styling: `https://developers.google.com/maps/documentation/javascript/places-ui-kit/custom-styling`
*   Google Maps Platform Terms: `https://cloud.google.com/maps-platform/terms`
*   Attribution Requirements: `https://developers.google.com/maps/documentation/javascript/places-ui-kit/attrib-req`
*   EEA Compliance FAQ: `https://developers.google.com/maps/comms/eea/faq`
*   Material Design Color Overview: `https://m3.material.io/styles/color/overview`
*   Material Design Typography Overview: `https://m3.material.io/styles/typography/overview`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.