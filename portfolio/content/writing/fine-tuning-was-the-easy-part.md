---
title: A Saved Score Is Not a Fine-Tuning Result
summary: The saved field-mask summary disagrees with its own per-case outputs. Before distributing an adapter or benchmark, I need a run that another builder can inspect and reproduce.
date: 2026-08-04
updated: 2026-09-07
canonical: https://ryanbaumann.dev/writing/fine-tuning-was-the-easy-part/
tags: ["developer experience", "ai", "evals"]
draft: false
noindex: false
image: /img/writing/fine-tuning-header.svg
imageAlt: An adapter and a saved score sit apart from the prompts, outputs, and checks needed to establish a result.
socialImage: /social/fine-tuning-was-the-easy-part.jpg
shareTitle: A Saved Score Is Not a Fine-Tuning Result
shareSummary: My field-mask record reports two base-model matches, but its individual outputs contain one. The evidence has to add up before the result can travel.
shareImageAlt: A saved score of two matches faces a count of one in the individual outputs, exposing a mismatch in the field-mask record.
---

The saved summary says the base model got two field masks right. Count the individual outputs and there is only one. That discrepancy changes what I can say about my fine-tuning experiment before I get to the harder question of distributing it.

I picked Places field masks because the task has a concrete consequence. A mask selects which fields an API response returns, and [requesting a higher-tier field can change the billed SKU](https://developers.google.com/maps/billing-and-pricing/sku-details). Extra fields can cost more; missing fields can leave the application without data it needs. Exact match against a reviewed answer key is useful, though it doesn't measure a bill by itself.

## What the saved record shows

The [field-mask experiment](https://github.com/ryanbaumann/fieldwork/tree/main/evals/field-mask) contains ten synthetic cases and a training script for a [LoRA](https://arxiv.org/abs/2106.09685) adapter. The current dataset labels eight cases for training and two for testing. A saved JSON record pairs expected masks with outputs labeled base and tuned.

For example, one case asks whether a place allows dogs and serves wine. Its expected mask includes both fields. Both saved outputs return only the dog field, so neither matches that answer key. That is the kind of failure a compact, inspectable task can reveal.

Across all ten saved cases, nine tuned outputs match their expected masks and one base output does. The summary reports two base matches. These are counts of the checked-in record, not a newly reproduced model result.

![The saved field-mask summary reports two base matches, while counting the individual recorded outputs gives one.](/img/writing/fine-tuning-evidence.svg)

There is a second gap in the [evaluation script](https://github.com/ryanbaumann/fieldwork/blob/main/evals/field-mask/test_mlx.py). It can attempt live inference and count matches, but when the saved record exists, it prints that record's summary instead of its newly calculated results. It also doesn't write the per-case record. Running the command and seeing a score therefore doesn't establish where the published outputs came from.

My earlier version described a verified improvement from 2 of 10 to 9 of 10. The public artifacts don't support that claim. They need an evaluation path that retains each attempt, computes its summary from those outputs, and records the exact model, adapter, and case split used. The answer key also needs checking against the current API fields before the score means anything about correctness.

## What has to travel beyond the adapter

That evidence problem comes before distribution, but it makes distribution more concrete. An adapter reaches only the deployment that loads it. It doesn't change the base model another developer downloads tomorrow or the hosted model another team calls. A developer platform has many tasks, APIs, and agent environments to support.

![A developer-platform distribution pyramid moves from directly controlled context and tools through an owned adapter and open traces to a public benchmark, trading direct control for broader potential reach.](/img/writing/fine-tuning-distribution-pyramid.svg)

Docs reach humans. SDKs reach applications. Skills and an MCP service reach the agent harness. An adapter can change the behavior of a model I run. Open training examples let another team inspect and reuse the work, but only if that team chooses to train on them. A public benchmark makes comparisons possible without training a model itself.

There are examples worth studying. [Harvey's post-training experiment](https://www.harvey.ai/blog/post-training-open-legal-agents-with-baseten-research) reports a held-out criterion pass rate rising from 42.5% to 63.0% after a 40-step GRPO run on a 9B model. Its tool-use patterns changed alongside that score. Separately, a [study of author-style fine-tuning](https://arxiv.org/abs/2510.13939) describes readers preferring fine-tuned literary excerpts in a controlled comparison. Neither result validates my field-mask run; each depends on its own task, data, and evaluation.

For this experiment, the next useful artifact is a reproducible run with a larger held-out set. Once that exists, I can ask whether publishing the adapter, examples, or benchmark helps someone beyond my own deployment. If you're working on that handoff, what evidence do you require before reusing another team's fine-tuning result?
