---
title: trails.ninja — The Lab
org: Personal
role: Builder
period: ongoing
summary: A self-hosted lab of live demo apps — a Strava 3D route explorer, a live air-quality map, and reachability analysis — one container, zero secrets in the browser.
tags: ["side project", "self-hosted", "reference apps"]
links: [{"label": "Live site", "url": "https://trails.ninja"}, {"label": "Source", "url": "https://github.com/ryanbaumann/trails.ninja"}]
order: 11
---

## What it is

trails.ninja is where I stay in the work: a self-hosted collection of live demo apps served from a single Cloud Run container behind a zero-dependency Node gateway. Current apps:

- **Strava 3D Explorer** — fly through ride and run routes in Photorealistic 3D with photos anchored along the way.
- **Air Quality Map** — live air-quality heatmap on a 2D map, driven by the Air Quality API.
- **Isochrones** — reachability analysis for delivery, commute, and response planning.

## Why it exists

I don't believe you can lead developer experience from a slide deck. Building and operating real apps — OAuth flows, API quotas, key restrictions, cold starts, CI/CD — keeps my judgment calibrated to what developers actually hit. Most of the platform opinions I bring to work were earned debugging something here first.

The whole stack is intentionally boring: no framework, no secrets in the browser, one container, fast deploys. Boring is a feature.
