---
name: places-api-web-api
description: Use this skill when searching for places, retrieving detailed information (reviews, photos, AI summaries), providing location autocomplete, or calculating route-based proximity for points of interest via the Google Maps Platform Places API (New).
license: Apache-2.0
metadata:
  version: 1.0.44
---



> [!WARNING]
> **Legacy Service:** This skill is for a legacy service. Please use [Places API (New)](../places-sdk-for-ios-ios/SKILL.md) instead.

> [!IMPORTANT]
> **Core Dependency:** This skill requires active context from [google-maps-platform/SKILL.md](../google-maps-platform/SKILL.md).

### Overview
The Google Maps Platform Places API (New) provides comprehensive location data and intelligence for millions of places around the world. This skill covers all facets of the Places API ecosystem, including searching for places using text or location proximity (Text Search, Nearby Search), utilizing session tokens for cost-effective autocomplete suggestions, and fetching rich details about a specific Place ID. Developers can request specific data fields (using field masks) such as contact information, operational hours, ratings, reviews, photos, and advanced AI-generated summaries (place and area overviews). It also supports generating URIs for deep linking into the Google Maps app for directions or reviews, and integrating place discovery along predefined routes. This skill emphasizes modern API patterns, including session token management and explicit field masking for optimized billing.

### Mandatory settings
#### Standard REST Header

All requests to the Places API (New) endpoints (Place Details, Text Search, Nearby Search, Autocomplete, Photos) MUST include the following custom HTTP header for usage attribution:
```
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
```



## 🚀 Master Orchestration Integration Workflow

Follow this multi-phase sequential integration checklist to compose features robustly. For each phase, read the referenced capability sub-workflow file and satisfy its *Evidence Checkpoint* before advancing.

### 📦 Phase 1: Feature Layer & Custom Enrichment (Supplemental)

#### 🗺️ Feature Module: Places (Optional - Use-Case Dependent)
- [ ] **Finds and returns places matching a text query string (Text Search).**
  Read [references/return-list-places-and-place-details-based-query-string.md](references/return-list-places-and-place-details-based-query-string.md).
  *Trigger Condition*: User searches for places using keywords (e.g., 'best coffee near me').
  *Evidence Checkpoint*: A 200 OK HTTP response containing an array of place candidates, each with basic detail fields.
- [ ] **Finds and returns places around a specific geographic coordinate or area (Nearby Search).**
  Read [references/return-list-places-and-place-details-near-specific-location.md](references/return-list-places-and-place-details-near-specific-location.md).
  *Trigger Condition*: User queries for points of interest within a specified radius or area.
  *Evidence Checkpoint*: A 200 OK HTTP response listing places located close to the defined coordinates/area.
- [ ] **Provides suggested place names and addresses as the user types.**
  Read [references/return-autocomplete-results-about-places-based-query-string.md](references/return-autocomplete-results-about-places-based-query-string.md).
  *Trigger Condition*: User begins typing an address or place name into a search box.
  *Evidence Checkpoint*: A 200 OK HTTP response containing a list of prediction objects.
- [ ] **Retrieves comprehensive details (address, hours, contact, ratings) for a single Google Place ID.**
  Read [references/return-detailed-information-about-specific-place.md](references/return-detailed-information-about-specific-place.md).
  *Trigger Condition*: User selects an item from a search result or autocomplete list.
  *Evidence Checkpoint*: A 200 OK HTTP response containing the requested fields for the specific Place ID.
- [ ] **Retrieves place photos based on a photo reference ID obtained from Place Details.**
  Read [references/return-photos-specific-place.md](references/return-photos-specific-place.md).
  *Dependencies*: `["references/return-detailed-information-about-specific-place.md"]`
  *Trigger Condition*: User requests image content for a known place.
  *Evidence Checkpoint*: A 200 OK HTTP response returning the raw image data or a redirect to the photo URL.
- [ ] **Modifies the size (height or width) of a retrieved place photo.**
  Read [references/resize-place-photos.md](references/resize-place-photos.md).
  *Dependencies*: `["references/return-photos-specific-place.md"]`
  *Trigger Condition*: The client system requires a place photo at a specific constrained dimension.
  *Evidence Checkpoint*: A 200 OK HTTP response returning the image resized according to the specified height/width parameters.
- [ ] **Fetches user ratings, star level, and text reviews associated with a Place ID.**
  Read [references/return-ratings-and-reviews-for-specific-place.md](references/return-ratings-and-reviews-for-specific-place.md).
  *Dependencies*: `["references/return-detailed-information-about-specific-place.md"]`
  *Trigger Condition*: User wants to view customer feedback or ratings for a specific location.
  *Evidence Checkpoint*: A 200 OK HTTP response containing an array of review objects, including text and ratings.
- [ ] **Limits the fields returned in Place Details or Search responses to reduce latency and cost.**
  Read [references/specify-the-data-fields-included-place-information-responses.md](references/specify-the-data-fields-included-place-information-responses.md).
  *Trigger Condition*: Agent needs to optimize the data payload size for a Place request.
  *Evidence Checkpoint*: The resulting JSON response contains only the explicitly requested data fields (e.g., 'name' and 'formatted_address'), and no others.
- [ ] **Filters search results based on predefined categories (e.g., restricting results to only 'restaurant' or 'hospital').**
  Read [references/specify-the-place-types-include-place-information-responses.md](references/specify-the-place-types-include-place-information-responses.md).
  *Trigger Condition*: User is searching for a place belonging to a specific known category type.
  *Evidence Checkpoint*: Search results (e.g., from Text Search or Nearby Search) only contain places matching the defined types.
- [ ] **Generates a deep link URI that opens the Google Maps app/web view focused on the place details page for a Place ID.**
  Read [references/return-the-uri-open-the-place-details-page-google-maps.md](references/return-the-uri-open-the-place-details-page-google-maps.md).
  *Dependencies*: `["references/return-detailed-information-about-specific-place.md"]`
  *Trigger Condition*: User requests to view the place using the native Google Maps application.
  *Evidence Checkpoint*: A formatted URI string is returned that links directly to the Maps interface.
- [ ] **Generates a deep link URI that opens the Google Maps app/web view providing directions to a Place ID.**
  Read [references/return-the-uri-open-the-directions-page-google-maps-for.md](references/return-the-uri-open-the-directions-page-google-maps-for.md).
  *Dependencies*: `["references/return-detailed-information-about-specific-place.md"]`
  *Trigger Condition*: User needs a route or directions to the place using Google Maps.
  *Evidence Checkpoint*: A formatted URI string is returned that launches the Maps directions interface.
- [ ] **Generates a deep link URI that opens the Google Maps app/web view allowing the user to submit a review for a Place ID.**
  Read [references/return-the-uri-open-the-write-review-page-google-maps.md](references/return-the-uri-open-the-write-review-page-google-maps.md).
  *Dependencies*: `["references/return-detailed-information-about-specific-place.md"]`
  *Trigger Condition*: User wants to contribute a review or rating to the place listing.
  *Evidence Checkpoint*: A formatted URI string is returned that directs the user to the review submission page in Maps.
- [ ] **Generates a deep link URI that opens the Google Maps app/web view showing all user reviews for a Place ID.**
  Read [references/return-the-uri-open-the-read-reviews-page-google-maps.md](references/return-the-uri-open-the-read-reviews-page-google-maps.md).
  *Dependencies*: `["references/return-detailed-information-about-specific-place.md"]`
  *Trigger Condition*: User wants to access the full list of reviews displayed in Google Maps.
  *Evidence Checkpoint*: A formatted URI string is returned that directs the user to the full review list in Maps.
- [ ] **Generates a deep link URI that opens the Google Maps app/web view showing all associated place photos for a Place ID.**
  Read [references/return-the-uri-open-the-photos-page-google-maps-for.md](references/return-the-uri-open-the-photos-page-google-maps-for.md).
  *Dependencies*: `["references/return-detailed-information-about-specific-place.md"]`
  *Trigger Condition*: User wants to view the image gallery for the place in Google Maps.
  *Evidence Checkpoint*: A formatted URI string is returned that directs the user to the photo gallery in Maps.
- [ ] **Uses Generative AI to provide a concise summary of the key characteristics and services of a specific place.**
  Read [references/return-ai-powered-overview-summary-for-specific-place.md](references/return-ai-powered-overview-summary-for-specific-place.md).
  *Dependencies*: `["references/return-detailed-information-about-specific-place.md"]`
  *Trigger Condition*: User requests a high-level summary of a known place (Place ID).
  *Evidence Checkpoint*: A 200 OK HTTP response containing a descriptive text summary generated by AI.
- [ ] **Uses Generative AI to summarize the surrounding environment and nearby points of interest for a place.**
  Read [references/return-ai-powered-area-summary-describing-places-the-area-around-specific.md](references/return-ai-powered-area-summary-describing-places-the-area-around-specific.md).
  *Dependencies*: `["references/return-detailed-information-about-specific-place.md"]`
  *Trigger Condition*: User needs context about the neighborhood or area surrounding a specific location.
  *Evidence Checkpoint*: A 200 OK HTTP response containing a descriptive text summary of the surrounding area generated by AI.

#### 🗺️ Feature Module: Directions and Routing (Optional - Use-Case Dependent)
- [ ] **Searches for points of interest using a text query, filtered specifically to those located near or along a provided route path.**
  Read [references/return-information-about-places-based-query-string-that-are-located.md](references/return-information-about-places-based-query-string-that-are-located.md).
  *Trigger Condition*: User is traveling along a route and needs to find amenities (e.g., 'gas stations') ahead of them.
  *Evidence Checkpoint*: A 200 OK HTTP response listing places that match the query and intersect the route path.
- [ ] **Calculates routing metadata (distance, time, URI) from a fixed origin point to each place found via a text query.**
  Read [references/return-distance-travel-time-and-directions-uri-between-set-latitude-longitude.md](references/return-distance-travel-time-and-directions-uri-between-set-latitude-longitude.md).
  *Dependencies*: `["references/return-list-places-and-place-details-based-query-string.md"]`
  *Trigger Condition*: User wants to know how far away search results are from their current location or a specific coordinate (Text Search).
  *Evidence Checkpoint*: A 200 OK HTTP response where each text search result is augmented with travel metadata from the origin.
- [ ] **Calculates routing metadata (distance, time, URI) from a fixed origin point to each place found via a nearby search.**
  Read [references/return-distance-travel-time-and-directions-uri-between-set-latitude-longitude.md](references/return-distance-travel-time-and-directions-uri-between-set-latitude-longitude.md).
  *Dependencies*: `["references/return-list-places-and-place-details-near-specific-location.md"]`
  *Trigger Condition*: User wants travel distance/time metrics from a known point to places found in a vicinity search (Nearby Search).
  *Evidence Checkpoint*: A 200 OK HTTP response where each nearby search result is augmented with travel metadata from the origin.
- [ ] **Calculates travel distance and time from the start of a route to relevant points of interest found along that route via text search.**
  Read [references/return-distance-travel-time-and-directions-uri-between-the-origin.md](references/return-distance-travel-time-and-directions-uri-between-the-origin.md).
  *Dependencies*: `["references/return-information-about-places-based-query-string-that-are-located.md"]`
  *Trigger Condition*: User needs to know the time required to reach a point along their current route from the starting point.
  *Evidence Checkpoint*: A 200 OK HTTP response augmenting the route-bound search results with travel metrics from the route origin.
- [ ] **Calculates travel distance and time from relevant points of interest found along a route to the route's ultimate destination.**
  Read [references/return-distance-travel-time-and-directions-uri-between-each-the.md](references/return-distance-travel-time-and-directions-uri-between-each-the.md).
  *Dependencies*: `["references/return-information-about-places-based-query-string-that-are-located.md"]`
  *Trigger Condition*: User needs to know the remaining travel time from an intermediate stop along a route to the final destination.
  *Evidence Checkpoint*: A 200 OK HTTP response augmenting the route-bound search results with travel metrics to the route destination.

#### 🗺️ Feature Module: Generative AI (Optional - Use-Case Dependent)
- [ ] **Provides a consolidated, human-readable summary of the sentiment and key topics discussed across all available user reviews for a place.**
  Read [references/return-ai-powered-summary-user-reviews-for-specified-google-place-identifier.md](references/return-ai-powered-summary-user-reviews-for-specified-google-place-identifier.md).
  *Dependencies*: `["references/return-detailed-information-about-specific-place.md"]`
  *Trigger Condition*: User requests a synthesis of customer feedback rather than reading individual reviews.
  *Evidence Checkpoint*: A 200 OK HTTP response containing a structured AI-generated summary derived from user reviews.
- [ ] **Uses Generative AI to detail the amenities and points of interest available near an EV charging station while the user waits.**
  Read [references/return-ai-powered-place-summary-the-area-and-amenities-surrounding-specified.md](references/return-ai-powered-place-summary-the-area-and-amenities-surrounding-specified.md).
  *Dependencies*: `["references/return-detailed-information-about-specific-place.md"]`
  *Trigger Condition*: User is viewing details for an EV charging station and needs context on nearby services.
  *Evidence Checkpoint*: A 200 OK HTTP response containing an AI-generated text summary describing nearby amenities relevant to EV users.

