---
title: Can I Build an AI Agent That Doesn't Write Slop?
summary: Local fine-tuning produced concise edits, but the retained prompts and outputs exposed limits in my comparison. Voice, factual fidelity, and editorial judgment need separate checks.
date: 2026-08-15
updated: 2026-09-07
canonical: https://ryanbaumann.dev/writing/can-i-build-an-ai-agent-that-doesnt-write-slop/
aliases: ["/writing/why-i-fine-tuned-a-26b-model-on-my-laptop-instead-of-prompting-frontier-apis/"]
tags: ["ai", "evals", "field notes"]
order: 1
draft: false
noindex: false
image: /img/writing/can-i-build-an-ai-agent-that-doesnt-write-slop-header.svg
imageAlt: "A comparison of evaluation approaches: automated graders for code versus human taste for copy editing."
socialImage: /social/can-i-build-an-ai-agent-that-doesnt-write-slop.jpg
shareTitle: Can I Build an AI Agent That Doesn't Write Slop?
shareSummary: A concise edit can still change the credit. What the retained prompts and outputs taught me about evaluating an AI copy editor.
shareImageAlt: "A share card illustrating the evaluation gap between automated code graders and human editorial judgment."
---

I wanted an AI agent for editing copy that matched my style, challenged weak structure, and left narrative judgment to me. Fixing cheerful, generic model prose often felt slower than writing from scratch.

I tried detailed voice instructions, then local fine-tuning. The retained outputs show useful short edits, but they also expose a problem with my comparison: I gave the model some of the editorial answers in the prompt. That limits what I can claim it learned.

## How far can I push context engineering?

I started with system prompts and skill files containing personal voice guidelines. I wrote detailed rules with capital letters and IMPORTANT!, banning em-dashes, stripping hype, adding examples of my own writing, and enforcing active voice.

Agents with this context stopped using announcement clichés and stripped out obvious marketing filler. Yay. But as the rule list grew, the writing became stiff, dry, and repetitive. Different models handled syntax and phrasing differently; none felt like an authentic collaborator.

That sent me toward fine-tuning. In [Readers Prefer Outputs of AI Trained on Copyrighted Books over Expert Human Writers](https://arxiv.org/abs/2510.13939), Chakrabarty, Ginsburg, and Dhillon compared short literary excerpts written in the styles of established authors. MFA-trained readers favored fine-tuned outputs over the human comparison texts for stylistic fidelity. That is an interesting result for voice, though it doesn't establish whether a model can edit a technical essay faithfully.

I set up an [open-source voice fine-tuning experiment](https://github.com/ryanbaumann/fieldwork/tree/main/experiment/voice-ft) using Gemma 4 31B Dense on my M4 Pro MacBook with 48 GB of unified memory. The setup uses MLX LoRA on a quantized base model. The dataset generator combines portfolio writing, constructed editing tasks, and human-reviewed corrections; it is not a collection of untouched, author-written samples.

The [round-eight configuration](https://github.com/ryanbaumann/fieldwork/blob/main/experiment/voice-ft/config_r8_dense.yaml) uses rank 16, scale 32, 16 adapter layers, and loss on the assistant response. A separate 48-item suite covers drafting, editing, critique, headlines, presentations, and requests outside the intended task.

## Follow one edit

The [compact sample runner](https://github.com/ryanbaumann/fieldwork/blob/main/scripts/generate_experiment_samples.py) asks the tuned model to rewrite this constructed status report in at most two sentences, preserve the numbers, and avoid em-dashes:

<!-- lint-ignore -->
> Leadership was provided to deploy a caching layer to improve fleet reliability. P99 latency was reduced by 62% (from 840ms to 310ms) across 14 services.

The [saved output](https://github.com/ryanbaumann/fieldwork/blob/main/experiment/voice-ft/eval/results/round8_dense_compact_samples.json) reads:

> I deployed a caching layer across 14 services to improve fleet reliability. P99 latency dropped 62%, from 840ms to 310ms.

That's concise, and the numbers survived. But the source never clearly says who deployed the layer. Asking for my active voice let the model turn ambiguous credit into “I deployed.” A useful copy editor should flag that gap for me to resolve.

These are fixture numbers, not a result from a service I operated. The earlier side-by-side tables also included untuned and prompted-model text without matching retained run records. They don't support a controlled comparison, so I can't use them to declare a winning model.

## The critique had the answer in its prompt

The critique example has a more direct limitation. Its instructions say:

> Flag the consensus tell and false antithesis flip.

The saved response begins:

> Cut 'We all know'; it's a consensus tell. The second sentence is a false antithesis flip.

That shows the model following a diagnosis supplied by the prompt. It doesn't show that fine-tuning taught it to discover the problem. The distinction matters because discovering weak structure was the job I wanted help with.

The [round-eight scorecard](https://github.com/ryanbaumann/fieldwork/blob/main/experiment/voice-ft/eval/results/round8_dense_scorecard.md) records 26 of 48 items passing every error-level check. Those checks cover mechanical rules, not the quality of an essay. It also reports 10 of 11 passes on fact retention, rather than the 100% I previously stated.

The grader needs scrutiny too: it flags version 3.2 as missing in an edit that still contains “SDK v3.2.” A scorecard is useful when I can follow a finding back to the source and output; the headline percentage alone won't settle the editorial decision.

![Mechanical style checks, structural feedback, and human judgment handle different parts of editing a technical essay.](/img/writing/can-i-build-an-ai-agent-that-doesnt-write-slop-gates.svg)

## What I would keep in the workflow

The short edits are useful material to react to. I can ask a model to cut repetition or flag a weak transition, then compare its proposal against the original. I still need to check attribution, numbers, citations, and whether the edit moved the argument forward.

A style linter can catch a banned phrase. A link check can tell me whether a destination resolves. Neither tells me whether the source supports the sentence, or whether the paragraph belongs in the essay. Those are separate decisions, and keeping them visible makes the workflow easier to inspect.

Fine-tuning shapes cadence and phrasing. I still handle the thinking. My next useful comparison needs identical source text, prompts that don't supply the diagnosis, and retained outputs from every candidate. If you've built an editing eval that catches changed meaning as well as awkward prose, I'd like to see the cases that made it harder.
