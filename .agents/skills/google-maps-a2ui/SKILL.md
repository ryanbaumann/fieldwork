---
name: google-maps-a2ui
description: Maps Agentic UI Toolkit (MAUI) v0.1.10, A2UI surfaces, Maps Experience MCP, and Maps Shortlist URLs for Google Maps Platform agents.
license: Apache-2.0
metadata:
  version: 1.1.0
  source: https://github.com/googlemaps/a2ui
---

# Google Maps Agentic UI Toolkit (MAUI) and A2UI Skill

This skill defines contracts for `@googlemaps/a2ui@0.1.10`, Agentic Data Visualization tokens, Maps Experience MCP, and Google Maps Shortlist URLs. Follow [Google Maps Platform documentation](https://developers.google.com/maps?utm_campaign=gmp_git_agentskills_v1) for API quotas and attribution rules.

## 1. Protocol and Attribution Contracts

- Emit structured A2UI envelopes (`createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`) in `v1.0` or `v0.9` format.
- Set `catalogId` to `a2ui://maps-agentic-ui-catalog.json` (or `atlas://maps-agentic-ui-catalog` in Atlas).
- Every surface must define a flat `components` list with an entry named `"root"`.
- Attach `gmp_git_agentskills_v1` to `internalUsageAttributionIds` on every Places UI Kit element.
- Send `X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1` on Google Maps REST and MCP requests.
- Append `?utm_campaign=gmp_git_agentskills_v1` to outbound `https://developers.google.com/maps` documentation links.

## 2. `@googlemaps/a2ui@0.1.10` Component Reference

| Component | Required Props | Optional Props | Purpose |
| :--- | :--- | :--- | :--- |
| `GoogleMap` | `center` or `origin` | `zoom`, `tilt`, `heading`, `mode`, `origin`, `destination`, `routes`, `travelMode`, `placePrimaryType`, `contentToken`, `anchorMarker`, `markers`, `label`, `mapId`, `gestureHandling` | Renders a map card for places, aerial views, or routes. |
| `PlaceDetailsCompact` | `placeId` | `orientation` (`"horizontal"` or `"vertical"`) | Renders a live Places UI Kit card (`gmp-place-details-compact`). |
| `Column` / `Row` | `children` | `align`, `gap`, `justify` | Arranges child component IDs in a flex container. |
| `Card` | `child` | none | Wraps one child component ID inside a card surface. |
| `Text` | `text` | `variant` (`"h1"`..`"h5"`, `"body"`, `"caption"`) | Renders headings, markdown body copy, or captions. |
| `List` | `children` | `direction` (`"vertical"` or `"horizontal"`) | Renders static child IDs or repeats `{ componentId, path }`. |
| `Button` | `child`, `action` | `variant` (`"default"`, `"primary"`, `"borderless"`) | Dispatches a validated host action on click. |
| `ChoicePicker` | `options` | `selection`, `multi`, `action` | Renders selectable filter chips that pass `{selection}` to actions. |
| `NextActions` | `actions` | `label` | Renders surface-owned follow-up and shortlist buttons. |

### `GoogleMap` Rules

1. Set `mode` to `"roadmap"`, `"satellite"`, `"hybrid"`, `"routes"`, or `"places"`.
2. Pass `origin`, `destination`, `routes`, and `travelMode` (`"WALK"`, `"DRIVE"`, `"BICYCLE"`, `"TRANSIT"`) for route previews.
3. Pass `placePrimaryType` when highlighting a specific place category on the map.
4. Pass `contentToken` whenever an upstream Maps Experience MCP response provides an agentic token.

### `PlaceDetailsCompact` and Dark Theme Rules

1. Default `orientation` to `"horizontal"` on `PlaceDetailsCompact` to save vertical space in lists.
2. Set `orientation` to `"vertical"` only when showcasing one focal place.
3. Strip `places/` and `placeId:` prefixes from `placeId` before setting the `place` attribute.
4. Set `internalUsageAttributionIds = ['gmp_git_agentskills_v1']` on each `gmp-place-details-compact` and `gmp-place-autocomplete` element.
5. Set `color-scheme: dark` and `--gmp-mat-color-*` CSS variables on every dark-themed Places UI Kit host:

```css
.place-ui-kit-host {
  color-scheme: dark;
  --gmp-mat-color-surface: rgba(16, 20, 30, 0.94);
  --gmp-mat-color-on-surface: var(--text);
  --gmp-mat-color-on-surface-variant: var(--text-dim);
  --gmp-mat-color-primary: var(--accent);
  --gmp-mat-color-outline-variant: var(--glass-line);
  --gmp-mat-font-family: var(--font-ui);
}
```

## 3. Agentic Data Visualization (`contentToken`)

When a Maps Experience MCP tool result or `GoogleMap` node includes a `contentToken`, register it with the Maps JavaScript SDK:

```ts
google.maps.Settings.getInstance().addContentTokens([contentToken]);
```

Deduplicate tokens in memory so repeated renders do not register the same token twice. Guard the call with optional chaining when the Maps JavaScript SDK has not loaded yet.

## 4. Google Maps Experience MCP (`mapstools.googleapis.com/mcp`)

1. Proxy browser requests through a same-origin `POST` endpoint to `https://mapstools.googleapis.com/mcp`.
2. Send server-side `X-Goog-Api-Key` and `X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1` headers.
3. Validate JSON-RPC 2.0 envelopes (`jsonrpc === "2.0"`) before forwarding upstream.
4. Allow only `initialize`, `tools/list`, and `tools/call` JSON-RPC methods.
5. Restrict `tools/call` `params.name` to this allowlist:
   - `search_places`
   - `search_along_route`
   - `compute_routes`
   - `lookup_weather`
   - `resolve_names`
   - `resolve_maps_urls`
6. Fall back to Maps JavaScript SDK or REST helpers when the MCP proxy returns `429`, `503`, or network errors.

## 5. Google Maps Shortlist URLs (`map_action=shortlist`)

Build shareable Google Maps Lists with the official Shortlist URL format:

```text
https://www.google.com/maps/@?api=1&map_action=shortlist&place_ids=<id1,id2,...>&utm_source=atlas&utm_campaign=shortlist
```

1. Strip `places/` and `placeId:` prefixes from every candidate Place ID.
2. Validate each Place ID against `/^[A-Za-z0-9_-]{10,256}$/`.
3. Reject synthetic or sample tokens (`grounded-place-*`, `sample-*`, `mock-*`, `fixture-*`, `synthetic-*`).
4. Deduplicate Place IDs in order and include between 1 and 20 Place IDs per URL.
5. Resolve pasted Google Maps links (`google.com/maps/place/...`, `maps.app.goo.gl/...`) via `resolve_maps_urls` before building the URL.
6. Register the typed `open_maps_shortlist` surface action and open validated URLs with `window.open(url, '_blank', 'noopener,noreferrer')`.
7. Render a 1-click `Open as Maps List (N)` affordance when a surface, itinerary, or active map has at least 2 valid Place IDs.

## 6. Maps JavaScript `Route.computeRoutes` and Grounding Chunk Rules

1. Pass `{ location: { lat, lng } }`, a `new Place({ id })` instance, or a plain address string to `Route.computeRoutes`.
2. Never pass `{ placeId }` or `{ address }` objects to `Route.computeRoutes`; the Maps JavaScript SDK rejects both shapes.
3. Strip `places/` and `placeId:` prefixes before constructing `new Place({ id })`.
4. Filter out review entries (`/maps/reviews/` URIs and `Review of ...` titles) from Gemini `groundingChunks` before deduplicating places.
5. Strip trailing ` - Google Maps` suffixes from `groundingChunks[].maps.title` and parse `**Location:** lat, lng` from `maps.text`.
