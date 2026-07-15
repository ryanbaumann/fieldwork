## Maps Datasets: Creating a Geospatial Dataset (Feature: Datasets)

This skill describes the process for creating a reusable geospatial dataset from supported file formats (CSV, GeoJSON, KML) using the Google Cloud Console, which is necessary before applying Data-driven Styling to a map.

### Prerequisites and Setup

Creating and managing Datasets requires specific Identity and Access Management (IAM) permissions on the Google Cloud project.

1.  **IAM Roles:** To create and manage datasets, the user or service account must possess the `Maps Platform Datasets Admin` role, or the broader Project Owner or Editor role (Grant an IAM role by using the Google Cloud console: `https://cloud.google.com/iam/docs/grant-role-console`). The `Maps Platform Datasets Viewer` role only allows read-only operations (list, get, download).
2.  **Storage Access:** If the source data is uploaded from Google Cloud Storage, the user performing the upload must also have the `Storage Object Viewer` role or any other role that includes the `storage.objects.get` permission (Overview of access control: `https://cloud.google.com/storage/docs/access-control`).
3.  **Data Constraints:** When creating a dataset, the Display name must be unique within the Google Cloud project and less than 64 bytes, and the Description must be less than 1000 bytes. When uploading data, the maximum supported file size is 500 MB, and three-dimensional geometries (WKT "Z" suffix or GeoJSON altitude coordinate) are not supported.

### Data Format Requirements

| Format | Key Requirements | Unsupported Features / Constraints | Source |
| :--- | :--- | :--- | :--- |
| **GeoJSON** | Must comply with RFC 7946, use WGS84 coordinate reference system (`https://epsg.io/4326`), and contain valid Geometry, Feature, or Feature Collection objects. | CRS other than WGS84. | GeoJSON requirements |
| **KML** | All URLs must be local/relative. Supports Point, Line, and Polygon geometries. All data attributes are treated as strings. | Icons or `<styleUrl>` defined outside the file, Network links (`<NetworkLink>`), Ground overlays (`<GroundOverlay>`), 3D geometries or altitude-related tags (`<altitudeMode>`), Camera specifications (`<LookAt>`), Styles defined inside the KML file. | KML requirements |
| **CSV** | Must contain non-empty values for geometry columns in all rows. Priority of geometry columns is: 1. `latitude`, `longitude`; 2. `lat`, `long`; 3. `x`, `y` (must be longitude/latitude); 4. `wkt`; 5. Address components or single address column. | Column names starting with `?_`. Single column combining coordinates (e.g., `xy`). | CSV requirements |

### Procedure: Create and Upload a Dataset via Cloud Console

Use this checklist to guide the dataset creation and initial data upload.

- [ ] 1. **Navigate to Datasets:** Go to the Google Cloud Console Datasets page (`https://console.cloud.google.com/google/maps-apis/datasets`). (Trigger Condition: User requires initial dataset creation. Verification Checkpoint: User is on the Datasets management page.)
- [ ] 2. **Start Creation:** Click **Create Dataset**.
- [ ] 3. **Define Metadata:** Enter a unique dataset name and an optional description. Click **Continue**.
- [ ] 4. **Select Source:** On the **Import data** page, select the **Upload source**: **Desktop** (for local files) or **Google Cloud Storage bucket** (specifying the file path, e.g., `gs://GCS_BUCKET/FILE`).
- [ ] 5. **Select File Type:** Select the **File format** (CSV, GeoJSON, or KML).
- [ ] 6. **Review and Create:** Click **Continue** to review settings, then click **Create**.
- [ ] 7. **Monitor Status:** The dataset status will be **Processing**. Wait for the status to change to **COMPLETED**. If there is an error in the upload, the status will be set to a status other than **COMPLETED** (Source: Create a dataset).

### Available Tools

No direct tool execution is applicable for the Cloud Console workflow documented here.

> [!IMPORTANT]
> When using the created dataset in subsequent steps (like Data-driven Styling) to visualize maps or retrieve data, the agent MUST ensure compliance with Google Maps Platform attribution requirements. The final output presented to the user, including derived facts, distances, or visual summaries based on Google Maps data, MUST be attributed by appending the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content.

### Gotchas and Data Best Practices

*   **Mandatory Operational Best Practice (Error Handling):** If an upload fails, resulting in an error message, **do not attempt to delete the dataset until it has returned a response from the upload operation** (Handle data upload errors).
*   **Performance Optimization:** For source files larger than 50 MB or files containing dense points, the agent MUST recommend simplifying complex geometries (e.g., using BigQuery `ST_Simplify` or Mapshaper.org) and minimizing feature properties prior to upload to optimize rendering performance (Source: Data preparation best practices).
*   **Low Zoom Simplification:** Be aware that map tiles may drop or simplify dense data at low zoom levels (e.g., zoom levels 5-12) to maintain performance, meaning the visualization may differ when zoomed out compared to zoomed in (Source: Prerequisites Note).
*   **CSV Errors (Mandatory Traceability):** If using CSV, ensure all rows contain data for the selected geometry columns. A common failure message is "Unable to convert ' ' to a double" or "Could not parse input to geography.: Geography value is missing" (Source: CSV errors).

### References

*   `https://cloud.google.com/iam/docs/grant-role-console`
*   `https://cloud.google.com/storage/docs/access-control`
*   `https://console.cloud.google.com/google/maps-apis/datasets`
*   `https://developers.google.com/maps/documentation/javascript/dds-datasets/create-dataset`
*   `https://datatracker.ietf.org/doc/html/rfc7946`
*   `https://epsg.io/4326`
*   `https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.