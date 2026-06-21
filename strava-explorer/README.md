# Strava 3D Explorer

![Strava Explorer Preview](strava-explorer.jpg)

A lightweight, browser-based web application to connect your Strava account, retrieve recent activities, and visualize their routes on a Google Maps Platform Photorealistic 3D globe. The app features an interactive follow-camera tour that lets you review routes and activity photos from a scenic 3D perspective.

## Features

*   **Strava Integration**: Authenticate via Strava OAuth2 to fetch your recent activities.
*   **3D Route Visualizer**: Renders routes as terrain-clamped 3D polylines over photorealistic 3D maps.
*   **Activity Photos**: Displays activity-linked photos as map-anchored 3D billboard markers.
*   **Interactive Camera**: Shortcuts for camera control including flight paths, orbits, and follow-camera flythroughs.
*   **Elevation Profile**: Displays an interactive elevation chart synchronized with the map location.

## Prerequisites

Before running the application, you need:
*   [Node.js](https://nodejs.org/) (version 20 or newer).
*   A Strava API Application (obtainable via [Strava API settings](https://www.strava.com/settings/api)).
*   A Google Cloud Project with billing enabled and the following APIs active:
    *   Maps JavaScript API (weekly or alpha channel)
    *   Map Tiles API (for Photorealistic 3D Tiles)
    *   Elevation API

## Getting Started

1.  **Clone the repo and install dependencies**:
    ```bash
    cd strava-explorer
    npm install
    ```

2.  **Configure environment variables**:
    Create a `.env.development` file in the `strava-explorer` directory:
    ```dotenv
    VITE_STRAVA_CLIENT_ID=YOUR_STRAVA_CLIENT_ID
    VITE_STRAVA_REDIRECT_URI=http://localhost:5173/
    VITE_GMP_API_KEY=YOUR_GOOGLE_MAPS_BROWSER_KEY
    VITE_STRAVA_CLIENT_SECRET=YOUR_STRAVA_CLIENT_SECRET
    ```
    *(Note: `VITE_STRAVA_CLIENT_SECRET` is only secure for local development. For production deployments, see [HOSTING.md](HOSTING.md) to set up the secure Cloud Run OAuth broker).*

3.  **Run the development server**:
    ```bash
    npm run dev
    ```
    Open the address printed in the terminal (usually `http://localhost:5173`) to view the application.

## Security Best Practices

*   **Protect Client Secrets**: Never commit or publish `VITE_STRAVA_CLIENT_SECRET` in a production static bundle. Always use the server-side Cloud Run OAuth broker described in [HOSTING.md](HOSTING.md).
*   **Restrict Google Maps API Keys**: Restrict your Google Maps browser API keys by referrer (e.g. `http://localhost:5173/*` and your production domain) and limit the key's scope to only the necessary APIs.

## Terms of Service & Compliance

This project integrates third-party APIs. By using this application, you must comply with:
*   **Google Maps Platform Terms**: Subject to the [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms). End users are bound by the [Google Maps End User Additional Terms of Service](https://maps.google.com/help/terms_maps.html) and [Google Privacy Policy](https://policies.google.com/privacy).
*   **Strava API Terms**: Subject to the [Strava Developer Agreement](https://www.strava.com/legal/api). In particular, user/athlete activity data must only be stored in memory or local storage, and never cached on a server for more than 7 days.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue on GitHub. Keep changes simple, self-contained within this directory, and tested locally.

## License

This project is licensed under the [MIT License](LICENSE).
