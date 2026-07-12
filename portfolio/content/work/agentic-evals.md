---
title: Agentic Eval Suite & Agent Engine Optimization
org: Google
role: Strategy & engineering lead
period: 2024 – present
summary: Task-based evals that gate every AI launch on the platform, plus an AEO program that benchmarks and grows the platform's share of voice across agent engines.
tags: ["evals", "context engineering", "growth"]
featured: true
order: 3
---

## The goal

You can't grow what you can't measure, and "the demo looked good" is not a launch bar. The platform needed an objective way to answer two questions: *does our context actually make agents better at building with us?* and *when a developer asks an agent to build something in our category, do we win?*

## What shipped

I built the agentic eval suite for Google Maps Platform: task-based evaluations measuring grounded code-generation accuracy, tool-call behavior, token cost, and end-to-end task completion across agent harnesses and models. Results versus a no-context baseline — plus real user traces from context metrics — set the quality and readiness bars for every launch, including Code Assist and agent skills.

On top of that sits Agent Engine Optimization (AEO): benchmarking the platform's share of voice across agent engines and using eval results to tune context strategy for each outcome. We benchmark end-to-end workflows externally in Claude Code, Codex, and Antigravity, and I've partnered directly with model teams — contributing evals, curated context, and fine-tuning signals from real developer usage — to improve Gemini's performance on platform developer tasks.

## Why it matters

This is the measurement layer that turns developer experience from a cost center into a growth system. Every context investment has a baseline, a delta, and a decision attached — the same discipline performance marketing brought to ads, applied to how agents build on your platform.
