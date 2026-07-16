---
title: Google Maps Platform Agent Skills
org: Google
role: Launch and engineering lead
period: 2025 – present
summary: Portable skill modules that teach AI agents how to build with the platform across Web, Android, iOS, and Web Services. Installed with one command.
tags: ["developer experience", "ai", "distribution"]
links: [{"label": "GitHub", "url": "https://github.com/googlemaps/agent-skills"}, {"label": "Docs", "url": "https://developers.google.com/maps/ai/agent-skills"}]
image: /img/work/agent-skills.svg
imageAlt: Terminal panel showing the public one-line install command npx skills add googlemaps/agent-skills
socialImage: /social/work-agent-skills.png
shareTitle: Google Maps Platform Agent Skills
shareSummary: Portable, tested workflows for AI coding agents.
shareImageAlt: Google Maps Platform Agent Skills beside the public one-command installation artifact.
featured: true
order: 3
---

## The goal

Grounded retrieval (Code Assist) tells an agent what's true. It doesn't teach an agent how to work. The goal: package the workflows too, so any agent can build with the platform the way an experienced platform engineer would.

## What shipped

Our team launched Google Maps Platform agent skills: portable modules for building across Web, Android, iOS, and Web Services. One command, `npx skills add googlemaps/agent-skills`, installs them in AI Studio and other compatible agent environments. We use evals as a release gate for each skill.

[Skills](https://developers.google.com/maps/ai/agent-skills) and [Code Assist](/work/code-assist/) run as one system. Skills teach the workflow. The MCP server grounds the details in retrieved documentation.

## What I learned

A skill is executable documentation: versioned, installable, and testable against a real task.
