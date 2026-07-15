---
name: geocoding-api-web-api
description: Use this skill when needing to convert street addresses into precise geographic coordinates (geocoding) or translating coordinates back into human-readable addresses (reverse geocoding). Developers can refine results using viewports, regional restrictions, or retrieve detailed location information for addresses, coordinates, or Google Place IDs, including building outlines and entrances.
license: Apache-2.0
metadata:
  version: 1.0.41
---


> [!IMPORTANT]
> **Core Dependency:** This skill requires active context from [google-maps-platform/SKILL.md](../google-maps-platform/SKILL.md).

### Overview
The Geocoding API is a Google Maps Platform service that provides direct access to conversion services between addresses (like "1600 Amphitheatre Parkway, Mountain View, CA") and geographic coordinates (latitude and longitude).

This API is accessed via standard HTTP REST endpoints and supports the following primary operations:
1.  **Geocoding:** Converting a street address or location description into geographic coordinates.
2.  **Reverse Geocoding:** Converting a pair of latitude/longitude coordinates into a human-readable address.

Developers can use this service to restrict results geographically, look up addresses for Google Place IDs, and obtain coordinates for specific building elements like outlines or entrances.

### Mandatory settings

The solution ID `gmp_git_agentskills_v1` must be included with every request to the Geocoding API for traceability and proper usage attribution.

#### Standard HTTP Header (Recommended for REST APIs)

For both standard Geocoding API calls (`maps.googleapis.com`) and the newer Geocoding API v4 endpoints (`geocode.googleapis.com`), the preferred method is to pass the solution ID via the custom HTTP header.

```
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
```

#### URL Query Parameter (General REST)

The solution ID can also be appended directly to the request URL as a query parameter.

```
&solution_id=gmp_git_agentskills_v1
```



## 🚀 Master Orchestration Integration Workflow

Follow this multi-phase sequential integration checklist to compose features robustly. For each phase, read the referenced capability sub-workflow file and satisfy its *Evidence Checkpoint* before advancing.

### 📦 Phase 1: Core Initialization & Base Setup (Primary)

- [ ] **Step 1.1: Performs standard forward geocoding, converting a street address into precise latitude and longitude coordinates.**
  Read [return-the-latitude-longitude-coordinates-address-geocoding.md](references/return-the-latitude-longitude-coordinates-address-geocoding.md).
  *Trigger Condition*: User provides a textual address and requires its geographical coordinates (latitude/longitude).
  *Evidence Checkpoint*: Successful HTTP 200 OK response containing a JSON payload with a 'results' array and a 'geometry' object specifying the 'location' coordinates.

### 📦 Phase 2: Feature Layer & Custom Enrichment (Supplemental)

#### 🗺️ Feature Module: Geocoding (Optional - Use-Case Dependent)
- [ ] **Performs reverse geocoding, converting latitude and longitude coordinates back into a human-readable formatted address.**
  Read [return-the-address-for-set-latitude-longitude-coordinates-reverse-geocoding.md](references/return-the-address-for-set-latitude-longitude-coordinates-reverse-geocoding.md).
  *Trigger Condition*: User provides geographical coordinates and requires the corresponding street address or location description.
  *Evidence Checkpoint*: Successful HTTP 200 OK response containing a JSON payload with a 'results' array listing formatted address fields.
- [ ] **Retrieves additional geographic data related to landmarks or areas near a specified street address.**
  Read [return-information-about-proximity-landmarks-areas-for-address.md](references/return-information-about-proximity-landmarks-areas-for-address.md).
  *Dependencies*: `["return-the-latitude-longitude-coordinates-address-geocoding.md"]`
  *Trigger Condition*: User requires information about nearby points of interest or administrative boundaries based on a textual address input.
  *Evidence Checkpoint*: Successful HTTP response containing proximity data and details alongside the primary geocoding result.
- [ ] **Retrieves additional geographic data related to landmarks or areas near a specified latitude/longitude coordinate pair.**
  Read [return-information-about-proximity-landmarks-areas-for-set-latitude-longitude-coordinates.md](references/return-information-about-proximity-landmarks-areas-for-set-latitude-longitude-coordinates.md).
  *Dependencies*: `["return-the-address-for-set-latitude-longitude-coordinates-reverse-geocoding.md"]`
  *Trigger Condition*: User requires information about nearby points of interest or administrative boundaries based on coordinate input.
  *Evidence Checkpoint*: Successful HTTP response containing proximity data and details alongside the primary reverse geocoding result.
- [ ] **Retrieves data regarding landmarks or areas associated with a specific Google Place Identifier (Place ID).**
  Read [return-information-about-proximity-landmarks-areas-for-google-place-identifier.md](references/return-information-about-proximity-landmarks-areas-for-google-place-identifier.md).
  *Trigger Condition*: User queries for related geographic data using a known Place ID.
  *Evidence Checkpoint*: Successful HTTP response containing proximity information linked directly to the provided Place ID.
- [ ] **Resolves a Google Place Identifier (Place ID) to its full human-readable address.**
  Read [return-the-address-for-google-place-identifier.md](references/return-the-address-for-google-place-identifier.md).
  *Trigger Condition*: User possesses a Place ID and needs to determine its corresponding street address.
  *Evidence Checkpoint*: HTTP 200 OK response with the 'formatted_address' field populated based on the Place ID lookup.
- [ ] **Returns coordinates defining the architectural outline or footprint of a building associated with a given address.**
  Read [return-the-latitude-longitude-coordinates-building-outline-for-address.md](references/return-the-latitude-longitude-coordinates-building-outline-for-address.md).
  *Dependencies*: `["return-the-latitude-longitude-coordinates-address-geocoding.md"]`
  *Trigger Condition*: User requires precise boundary polygon data for a structure identified by its street address.
  *Evidence Checkpoint*: Successful geocoding response containing detailed geometry data specifically outlining the building's perimeter.
- [ ] **Returns coordinates defining the architectural outline or footprint of a building near the specified latitude/longitude coordinates.**
  Read [return-the-latitude-longitude-coordinates-building-outline-for-set-latitude-longitude-coordinates.md](references/return-the-latitude-longitude-coordinates-building-outline-for-set-latitude-longitude-coordinates.md).
  *Dependencies*: `["return-the-address-for-set-latitude-longitude-coordinates-reverse-geocoding.md"]`
  *Trigger Condition*: User requires precise boundary polygon data for a structure identified by coordinates.
  *Evidence Checkpoint*: Successful reverse geocoding response containing detailed geometry data specifically outlining the building's perimeter.
- [ ] **Returns coordinates defining the architectural outline or footprint of a building associated with a Google Place Identifier.**
  Read [return-the-latitude-longitude-coordinates-building-outline-for-google-place-identifier.md](references/return-the-latitude-longitude-coordinates-building-outline-for-google-place-identifier.md).
  *Trigger Condition*: User requires precise boundary polygon data for a structure identified by a Place ID.
  *Evidence Checkpoint*: Successful HTTP response containing detailed geometry data specifically outlining the building's perimeter linked to the Place ID.
- [ ] **Returns the precise coordinates corresponding to the main entrance of a building specified by address.**
  Read [return-the-latitude-longitude-coordinates-building-entrance-for-address.md](references/return-the-latitude-longitude-coordinates-building-entrance-for-address.md).
  *Dependencies*: `["return-the-latitude-longitude-coordinates-address-geocoding.md"]`
  *Trigger Condition*: User needs the exact entrance point (rather than the centroid) for navigation or delivery based on an address.
  *Evidence Checkpoint*: Successful geocoding response returning specialized coordinates explicitly labeled as the building entrance location.
- [ ] **Returns the precise coordinates corresponding to the main entrance of a building near the specified coordinates.**
  Read [return-the-latitude-longitude-coordinates-building-entrance-for-set-latitude-longitude-coordinates.md](references/return-the-latitude-longitude-coordinates-building-entrance-for-set-latitude-longitude-coordinates.md).
  *Dependencies*: `["return-the-address-for-set-latitude-longitude-coordinates-reverse-geocoding.md"]`
  *Trigger Condition*: User needs the exact entrance point (rather than the centroid) for navigation or delivery based on coordinate input.
  *Evidence Checkpoint*: Successful reverse geocoding response returning specialized coordinates explicitly labeled as the building entrance location.
- [ ] **Returns the precise coordinates corresponding to the main entrance of a building associated with a Google Place Identifier.**
  Read [return-the-latitude-longitude-coordinates-building-entrance-for-google-place-identifier.md](references/return-the-latitude-longitude-coordinates-building-entrance-for-google-place-identifier.md).
  *Trigger Condition*: User needs the exact entrance point for navigation or delivery based on a Place ID.
  *Evidence Checkpoint*: Successful HTTP response returning specialized coordinates explicitly labeled as the building entrance location linked to the Place ID.

### 📦 Phase 3: Operational Constraints & Guardrails (Constraint)

- [ ] **Step 3.1: Narrows the scope of a geocoding request to only return results that fall within a defined geographic bounding box (viewport).**
  Read [restrict-geocoding-request-return-results-withing-specific-viewport.md](references/restrict-geocoding-request-return-results-withing-specific-viewport.md).
  *Dependencies*: `["return-the-latitude-longitude-coordinates-address-geocoding.md"]`
  *Trigger Condition*: The user wants to limit geocoding searches to a specific map area or region defined by corner coordinates.
  *Evidence Checkpoint*: Successful geocoding response where the resulting location coordinates are confirmed to be geometrically constrained by the specified viewport bounds.
- [ ] **Step 3.2: Filters geocoding or reverse geocoding results based on constraints like country code, region, or postal code.**
  Read [restrict-geocoding-reverse-geocoding-request-only-return-results-within-specific.md](references/restrict-geocoding-reverse-geocoding-request-only-return-results-within-specific.md).
  *Dependencies*: `["return-the-latitude-longitude-coordinates-address-geocoding.md", "return-the-address-for-set-latitude-longitude-coordinates-reverse-geocoding.md"]`
  *Trigger Condition*: User seeks results restricted to a specific governmental, administrative, or geographic locale identified by components like `country` or `components`.
  *Evidence Checkpoint*: Successful geocoding response where the address components confirm that the specified region filter was applied successfully.
- [ ] **Step 3.3: Limits reverse geocoding results exclusively to specified address types (e.g., street address, intersection, or locality).**
  Read [restrict-reverse-geocoding-request-only-return-results-for-specified-address.md](references/restrict-reverse-geocoding-request-only-return-results-for-specified-address.md).
  *Dependencies*: `["return-the-address-for-set-latitude-longitude-coordinates-reverse-geocoding.md"]`
  *Trigger Condition*: User needs granular control over the types of addresses returned during a reverse geocoding query.
  *Evidence Checkpoint*: Successful reverse geocoding response where all returned 'results' objects strictly conform to the requested 'result_type' parameter.

