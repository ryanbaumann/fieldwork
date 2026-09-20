---
title: Fine-Tuning Was the Easy Part
summary: Tuning a small model to generate minimal API field masks took an afternoon. The hard platform problem is distribution: getting that fix past a single adapter, across dozens of APIs, and into the foundation models developers choose next.
date: 2026-08-04
updated: 2026-08-08
canonical: https://ryanbaumann.dev/writing/fine-tuning-was-the-easy-part/
tags: ["developer experience", "ai", "evals"]
draft: false
noindex: false
image: /img/writing/fine-tuning-header.svg
imageAlt: The easy part is tuning one adapter, where Gemma 4 E4B exact match rose from 2 of 10 to 9 of 10; the hard part is distributing that fix across hundreds of jobs and every model a developer might pick.
socialImage: /social/fine-tuning-was-the-easy-part.jpg
shareTitle: Fine-Tuning Was the Easy Part
shareSummary: Tuning a small model for one narrow job worked in an afternoon. Distributing that fix into the models your developers actually run is the real platform challenge.
shareImageAlt: Fine-Tuning Was the Easy Part, beside a two-panel card contrasting one tuned adapter with distribution across many jobs and models.
---

Point an autonomous coding agent at the Places API and it defaults to kitchen-sink responses. Models are trained to be helpful, so when an agent fetches a place, it asks for every field it might conceivably need. On Places, that helpfulness is an invoice trap: [Place Details bills in tiers](https://developers.google.com/maps/billing-and-pricing/sku-details), charging the highest tier of any single field in the request. Asking for a website URI or business hours alongside a basic coordinate can quietly quadruple the cost of a call that still returns valid JSON.

Base models over-fetch because their weights capture a frozen snapshot of the internet, long before modern field-masking APIs existed. Context files, MCP tools, and skills add useful runtime guidance. But fine-tuning a small model on a narrow task beats an expensive frontier model while cutting inference cost.

## Tuning one adapter is the easy part

I trained a [LoRA](https://arxiv.org/abs/2106.09685) adapter on Gemma 4 E4B (a ~4B parameter model) over a set of synthetic [Places field-mask requests](https://github.com/ryanbaumann/fieldwork/tree/main/evals/field-mask). I split ten test cases into eight for training and two held out that the optimizer never saw.

The evaluation bar had to mirror production costs, not syntax. If an agent returns valid JSON with one extra billable field, traditional code graders mark it green. My grader checked exact match: a test passed only when the model returned the precise fields requested, with zero billable additions. On Places, an over-fetch is an economic failure.

![A chart comparing exact-match field masks for Gemma 4 E4B: across all ten cases the base model scores 2 and the tuned adapter 9; on the two held-out cases the base model scores 0 and the tuned adapter 1.](/img/writing/fine-tuning-evidence.svg)

The tuned adapter jumped from 2 of 10 to 9 of 10 exact-match masks, clearing all eight training cases and one of the two held-out cases. Every prompt, raw model response, and grade is preserved in an open [retained run trace](https://github.com/ryanbaumann/fieldwork/tree/main/evals/field-mask).

The contrast was immediate. Base E4B failed in two predictable ways: it either gave up and returned only the first field, or hallucinated four extra fields when handed a prompt-injection attempt. The tuned model returned the minimal correct mask for clean inputs and an empty list for injections. Its single held-out miss dropped `places.servesWine` from a query about dog-friendly wineries: a missed attribute, but zero unearned billing.

## What I learned

Tuning works when the job is narrow and the grader penalizes real-world friction. In [Harvey's post-training experiment](https://www.harvey.ai/blog/post-training-open-legal-agents-with-baseten-research), forty steps of GRPO on an open 9B model pushed held-out pass rates from 42% to 63%. As the score rose, the agent stopped spamming blind grep calls and began reading more context per rollout. Tool efficiency changed because the reward function penalized wasted steps.

The same dynamic applies to authorial style. A [study from the University of Michigan](https://news.umich.edu/when-ai-learns-an-authors-voice-even-experts-prefer-it/) found that readers prefer text from an open model fine-tuned on an author's writing over prompted mimicry from frontier models. The weights internalize rhythm and negative constraints without burning prompt tokens on repetitive rules.

Ten cases with two held out is an early signal, not a production fleet. The next iteration needs a hundred cases and an automated grader tied directly to live API SKU tables. Still, the lesson holds: whether you are teaching an agent an authorial voice or an API field mask, grounded examples work. A grader that understands what an error costs helps a small model master an expensive edge case that a frontier model gets wrong.

## The hard part is distribution

My adapter fixes one task on one deployment. It doesn't help the base model another developer pulls down tomorrow, or the hosted endpoint another team calls in production. A developer platform doesn't have one narrow task: it supports hundreds of core workflows across dozens of APIs, and developers run agents on foundation models the platform team will never control. Tuning an adapter per task and hoping everyone loads it does not scale.

![A developer-platform distribution pyramid moves from directly controlled context and tools through an owned adapter and open traces to a held-out public benchmark, trading direct control for broader reach and more dependence on adoption.](/img/writing/fine-tuning-distribution-pyramid.svg)

Moving down that distribution ladder trades direct control for broader reach:

- **Docs reach humans. SDKs reach applications.**
- **Skills and MCP servers reach the agent harness.**
- **Open traces and public benchmarks reach the model weights.**

Context and tools give you the most direct control. They carry fresh facts into an active session, but the agent harness has to discover and load them. An owned adapter bakes stable behavior into weights, but reaches only the infrastructure you host. Open traces turn private debugging into reusable datasets so other teams can train on real attempts. Finally, a held-out public benchmark provides foundation model builders with a durable target, letting developers see whether a platform gap closed without having to fine-tune models themselves.

Call it share of gradient: will the next generation of foundation models learn your platform's correct patterns, or will they be shaped by outdated snippets and scraped blogs? For platform teams, the operational loop falls out of that ladder:

1. Keep fast-changing facts and dynamic APIs in runtime context.
2. Fine-tune the stable, high-cost jobs you can grade deterministically.
3. Publish open traces to spread the signal beyond your own perimeter.
4. Publish held-out benchmarks to keep performance measurable across every model developers choose.

The field-mask run is the first step on that ladder. Scaling it past ten cases is the immediate work. Getting those traces into model pre-training is the durable win. If you're tackling the gap between runtime context and learned model behavior, how are you handling it? Share your traces and evaluation setups in the comments.
