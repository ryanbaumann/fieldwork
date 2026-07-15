# Pollen API Heatmap Tile Retrieval

This skill focuses on retrieving visual heatmap tiles for pollen conditions using specific map tile coordinates, which can be overlaid onto a map interface. This functionality is provided via the `mapTypes.heatmapTiles` endpoint of the Pollen API.

## Prerequisites

1.  **API Key**: A valid Google Maps Platform API key must be available.
2.  **Environment Setup**: Ensure the API key is accessible to the execution environment, preferably via a global environment variable such as `GOOGLE_API_KEY`.

## Available Tool: Pollen Heatmap Tile REST Endpoint

This capability utilizes a standard REST HTTP GET request to retrieve the 256 x 256 pixel PNG image tile.

| Method | Endpoint Structure | Required Headers |
| :--- | :--- | :--- |
| `GET` | `https://pollen.googleapis.com/v1/mapTypes/{TYPE}/heatmapTiles/{Z}/{X}/{Y}?key=YOUR_API_KEY` | `X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1` |

> [!IMPORTANT]
> When generating the final response output (including image URLs, derived facts, or summarization of data obtained using this skill), the agent MUST attribute the source data by appending the text `Google Maps` on a dedicated, separate line immediately following the user-facing content.

## Implementation Guide

To retrieve a heatmap tile, construct the REST URL using four required path parameters: `TYPE`, `Z`, `X`, and `Y`.

### 1. Determine Map Type (`TYPE`)

The `TYPE` parameter specifies the category of pollen data requested. The agent must use one of the allowed values available in the API reference (mapTypes.heatmapTiles/lookupHeatmapTile#maptype). For example, `TREE_UPI` (Urban Pollen Index for Trees).

### 2. Specify Map Coordinates (`Z`, `X`, `Y`)

The agent must obtain the required zoom level (`Z`) and the tile coordinates (`X`, `Y`) from the user query or derive them based on the geographical area of interest.

*   `Z` (Zoom Level): Determines the scale. Allowed values are 0-16. A value of 0 displays the entire world in a single tile (Section: About the heatmap endpoint).
*   `X`, `Y` (Tile Coordinates): Coordinates relative to the northwest corner (0,0). `X` increases West to East, and `Y` increases North to South.

### 3. Construct and Execute the Request

Formulate the final request URL, ensuring the `key` parameter is included, and execute the GET request.

**Example Request Construction:**

To retrieve a `TREE_UPI` tile at zoom level 2, coordinates (2,1):

```text
https://pollen.googleapis.com/v1/mapTypes/TREE_UPI/heatmapTiles/2/2/1?key=YOUR_API_KEY
```

The output of the successful request will be a binary image file (256 x 256 pixels) which can be used as an overlay on a Google Map.

**MANDATORY CITATION REQUIREMENT**: All five parameters (`KEY`, `TYPE`, `Z`, `X`, `Y`) are required for a successful request (Section: About the heatmap endpoint).

## Gotchas

### Invalid Tile Coordinates

The tile coordinates (`X`, `Y`) must be valid for the specified zoom level (`Z`). Coordinates outside the boundary defined by the zoom level will result in an error. For instance, requesting tile (10,10) at zoom level 2 will return an error (Section: About the heatmap endpoint). The tile grid size is determined by scaling the coordinates exponentially by the zoom level, meaning that the maximum X/Y coordinates are $2^Z - 1$.

### Overlay Implementation

The raw image tile must be manually overlaid onto a Google Map. The API itself only returns the image data, not the map context. For implementation details on overlaying tiles, refer to the external documentation on overlaying Map Types.

### References

*   [Pollen API Heatmap Tiles Documentation](https://developers.google.com/maps/documentation/pollen/heatmap-tiles?utm_source=gmp_git_agentskills_v1)
*   [Pollen API Heatmap Tile Lookup Endpoint Reference](https://developers.google.com/maps/documentation/pollen/reference/rest/v1/mapTypes.heatmapTiles/lookupHeatmapTile?utm_source=gmp_git_agentskills_v1)
*   [Map and Tile coordinates details](https://developers.google.com/maps/documentation/javascript/coordinates?utm_source=gmp_git_agentskills_v1#tile-coordinates)
*   [Overlay Map Types Implementation Details](https://developers.google.com/maps/documentation/javascript/examples/maptype-overlay?utm_source=gmp_git_agentskills_v1)
*   [Get an API Key](https://developers.google.com/maps/documentation/pollen/get-api-key?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.