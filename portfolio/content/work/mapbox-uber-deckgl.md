---
title: Mapbox × Uber: deck.gl & kepler.gl Partnership
org: Mapbox
role: Partnership & engineering lead
period: 2018 – 2020
summary: The OSS partnership that made Mapbox the default basemap in deck.gl and kepler.gl, the leading open-source geospatial visualization stack.
tags: ["open source", "partnerships", "growth"]
links: [{"label": "Launch post", "url": "https://blog.mapbox.com/launching-custom-layers-with-uber-2a235841a125"}, {"label": "deck.gl", "url": "https://github.com/visgl/deck.gl"}, {"label": "kepler.gl", "url": "https://github.com/keplergl/kepler.gl"}]
image: /img/work/kepler-mapbox.jpg
imageAlt: kepler.gl rendering trip data over a Mapbox satellite basemap of the San Francisco Bay Area
order: 9
---

## The goal

Uber's deck.gl and kepler.gl were becoming the default tools for visualizing geospatial data at scale. Whichever platform rendered the basemap under them would hold the default position for a generation of data-heavy applications.

## What shipped

I led the OSS partnership with Uber that integrated Mapbox GL JS custom layers directly into deck.gl and kepler.gl. This was deep rendering integration, not a logo swap: shared APIs that made Mapbox the natural basemap across the stack. kepler.gl still ships on that architecture today.

## What I learned

Defaults compound. A targeted engineering investment in someone else's open source bought a durable position across an entire ecosystem: every kepler.gl tutorial and workshop since has onboarded developers onto Mapbox for free.
