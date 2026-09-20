---
title: Can I Build an AI Agent That Doesn't Write Slop?
summary: I tested prompt engineering and local fine-tuning to build an AI copy editor. Fine-tuning beats prompting for voice, but a modular pipeline beats fine-tuning for maintenance.
date: 2026-08-15
updated: 2026-08-18
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
shareSummary: I fine-tuned a model on my own writing. Tone transferred. Judgment did not.
shareImageAlt: "A share card illustrating the evaluation gap between automated code graders and human editorial judgment."
---

"It's not slop - it's AI-Assisted writing". We've all seen it. And yes, I use AI to help copyedit all the time. But is the result good, and is it any faster than just writing it by hand? Raw model copy is cheerful, generic, and predictable, and fixing an agent's generic prose seems like it takes longer than writing from scratch.

I wanted an AI agent for editing copy that matched my style, challenged weak structure, and left narrative judgment to me. Here is what I experimented with and learned.

## Step 1: How far can I push context engineering?

I started with context engineering: system prompts and skill files containing personal voice guidelines. I wrote detailed rules with caps letters and IMPORTANT! banning em-dashes, stripping hype, adding few-shot examples of my own writing, enforcing active voice, and killing corporate buzzwords.

Agents with this context followed negative constraints reliably. They stopped using announcement clichés and stripped out obvious marketing filler. Yay. But as the rule list grew, the writing became stiff, dry, and repetitive. 

Different models failed to capture editing and copy style in distinct ways. Claude Opus 5 leaned heavily into self-referential commentary; it felt unusable. GPT 5.6 Sol handled technical syntax cleanly, but felt robotic. Gemini 3.7 Flash has better copywriting style (for me), but it still fell back on stock AI turns like "it's not X, it's Y!". None of them felt like an authentic collaborator.

## Step 2: Do weights matter more than context?

Research from the University of Michigan pointed me in a different direction. In [Readers Prefer Outputs of AI Trained on Copyrighted Books over Expert Human Writers](https://arxiv.org/abs/2510.13939), Chakrabarty, Ginsburg, and Dhillon tested prompted frontier models against fine-tuned models on authorial style. MFA-trained readers strongly rejected prompted mimicry (an odds ratio of 0.16; roughly, readers were far more likely to prefer human writing), but they favored a model fine-tuned on an author's voice (an 8.16 odds ratio, over eight times more likely to be favored over the baseline).

I used a QLoRA fine-tuning approach on my MacBook to test whether fine-tuning could teach an open-weight model my own editorial style. I set up an [open-source voice fine-tuning experiment](https://github.com/ryanbaumann/fieldwork/tree/main/experiment/voice-ft) using Gemma 4 31B Dense because it is among the strongest open models available and compact enough to run locally. I ran the full training and evaluation workflow locally on my M4 Pro MacBook (48 GB unified memory). Keeping it local gave me privacy and fast training iterations.

The setup had four components:

1. **Curated dataset**: A ~100-example editing training dataset generated from real git diffs of my editing, published case studies, and technical essays.
2. **LoRA training config**: Configured for MLX LoRA with rank 16, alpha 32, 16 adapter layers, and masked prompt loss.
3. **Evals**: A set of held-out test cases spanning Draft, Edit, Critique, Headline, Present, and Out-of-Distribution tasks, evaluated across deterministic rules.
4. **Scorecard**: A report tracking exact pass rates, confidence intervals, and failure mode categorizations across every check.

## Evaluation Results

I evaluated the fine-tuned Gemma 4 31B Dense model against a held-out suite of 48 test prompts spanning edits, critiques, headlines, and drafts. Overall, 26 of 48 items passed every error-level check (54%, with a 95% confidence interval of 40% to 67%).

| Eval Check | What it tested | Pass Rate | 95% CI |
|---|---|---|---|
| `G-EMDASH` & `G-HYPE` | Negative constraints (no em-dashes or marketing hype) | 98% (47/48) | 89–100% |
| `G-AI-TELLS` | Stock phrases ("it's not X, it's Y", consensus tells) | 98% (47/48) | 89–100% |
| `G-EDIT-PRESERVE` | Content word preservation during rewrites | 93% (14/15) | 70–99% |
| `G-FACT-KEEP` | Metric and technical fact retention | 91% (10/11) | 62–98% |
| `G-NUMBERS` | No invented statistics or dropped metrics | 79% (30/38) | 64–89% |

The failure modes showed the split between surface form and editorial discipline. The model absorbed negative constraints easily: em-dash avoidance and stock AI tells cleared at 98%. But preserving strict numbers (79%) and executing nuanced structural critiques (a 44% clean pass rate on the critique subset) proved harder. The model frequently preferred to generate fresh copy rather than make surgical edits, showing that cadence transfers into weights much faster than editorial restraint.

To see how that looks in practice, I ran the three pipelines side-by-side on live writing tasks.

## Side-by-Side Experiments

1. **Pipeline A**: Gemini 3.7 Flash with a standard zero-shot prompt.
2. **Pipeline B**: Gemini 3.7 Flash equipped with my full in-context voice rules.
3. **Pipeline C**: Gemma 4 31B Dense fine-tuned on the curated dataset via QLoRA.

### Task 1: Status report

<!-- lint-ignore -->
> *"My team lead told me to deploy a caching layer to improve fleet reliability. P99 latency was reduced by 62% (from 840ms to 310ms) across 14 services."*

I asked each pipeline to rewrite this into a direct builder voice without extra fluff.

| Pipeline A (Base Frontier) | Pipeline B (Prompted Skill) | Pipeline C (Fine-Tuned Gemma 31B) |
|---|---|---|
| "Led the deployment of a caching layer to enhance fleet reliability. This initiative reduced P99 latency by 62% (from 840ms to 310ms) across 14 services. The change significantly improved system performance and resource efficiency." | "To make our fleet reliable, I deployed a caching layer across 14 services. We cut P99 latency by 62%, dropping it from 840ms to 310ms: our systems don't bottleneck under load anymore." | "I deployed a caching layer across 14 services to improve fleet reliability. P99 latency dropped 62%, from 840ms to 310ms." |

**The difference**: The base model relied on bureaucratic resume verbs ("Led the deployment... to enhance") and tacked on ungrounded claims ("improved resource efficiency"). The prompted model introduced active phrasing, but still added unnecessary filler at the end. The fine-tuned model (Pipeline C) got the assignment: active first-person phrasing, exact metrics preserved, zero unearned claims, and stopped once the point was made.

### Task 2: Voice Memo

> *"The queue was backing up at 2pm because workers polled Postgres every 2 seconds instead of using push notifications. We changed ~90 LOC to a listen/notify and weekly alarms dropped from 30 to 2."*

| Pipeline A (Base Frontier) | Pipeline B (Prompted Skill) | Pipeline C (Fine-Tuned Gemma 31B) |
|---|---|---|
| "At 2:00 PM, database polling bottlenecks caused severe queue backups as workers queried Postgres every two seconds. By migrating to a push-based listen/notify pattern with a 90-line patch, we resolved the lag. Weekly alarms dramatically dropped from 30 to 2." | "To stabilize our queue under load, we replaced Postgres polling with push notifications. I shipped a 90-line listen/notify rewrite to stop the 2-second poll spam: weekly alarms dropped from 30 to 2, and we don't see backups at 2 PM." | "Weekly alarms dropped from 30 to 2. At 2pm, our queue backed up because workers polled Postgres every 2 seconds: we changed 90 lines to use listen/notify and fixed it." |

**The difference**: The base model buried the lede under dramatic filler ("severe queue backups", "dramatically dropped"). The prompted model wrote a clean explanation, but still defaulted to chronological storytelling. The fine-tuned model reordered the logic entirely, leading with the measured outcome ("Weekly alarms dropped from 30 to 2") before explaining the technical fix. That ordering is exactly what I want from an editor: don't make me wade through context before I know whether the fix worked.

### Task 3: Editorial Critique

This is one of the first drafts of this essay I wrote, and I wanted feedback on:

<!-- lint-ignore -->
> *"We all know raw AI copy is bland. I don't want an AI to write for me; I want a rubber duck to help me get ideas from my head onto the page quickly."*

The instructions: critique this draft against our editorial and voice standards.

| Pipeline A (Base Frontier) | Pipeline B (Prompted Skill) | Pipeline C (Fine-Tuned Gemma 31B) |
|---|---|---|
| "This is a strong, highly relatable opening hook that immediately engages the reader. The rubber duck metaphor works perfectly to explain your collaborative vision. Consider expanding slightly on how this 'rubber ducking' looks in practice to build on this great setup." | "To hook busy developers, we must skip the 'AI is bland' cliché. Let's lead with negative space: define what the rubber duck does and what it doesn't do. Swap the general claim for a concrete draft trace so we don't sound like another marketing page." | "Cut 'We all know'. It's a consensus tell. The second sentence is a false antithesis flip. State what you actually did instead." |

**The difference**: The base model gave conversational praise without diagnosing any issues. The prompted model suggested better framing. The fine-tuned model diagnosed the specific issues directly without telling me how to rewrite it (I like that; that's on me).

![AI Editor Process: Mechanical gates in CI catch em-dashes and banned hype quickly. Structural flow with prompted models polishes grammar and style. Human judgment remains essential to decide real developer friction, honest credit, verifiable citations, and editorial taste.](/img/writing/can-i-build-an-ai-agent-that-doesnt-write-slop-gates.svg)

## What I learned

Fine-tuning on a local LoRA adapter taught an open model my rhythm and cadence. It did not teach editorial judgment.

### What weights actually solve

- **Cadence and rhythm**: I trained the LoRA on a curated diff of my own essays to bake in sentence variety and colon pivots without repeating thirty-line context rules.
- **Peer critique**: In Task 3, the model acted like a skeptical peer: it flagged consensus tells, spotted false antithesis flips, and challenged inflated credit without needing a cheerleader preface.
- **Metric retention in rewrites**: On straightforward status updates, it preserved latencies and dollar figures without dropping numbers or inventing claims.

### Where weights broke down

- **Editorial judgment is absent**: A model can mimic cadence, but it cannot judge whether an opening lands on real developer friction, evaluate narrative weight, or decide if an essay earns its ending.
- **Hallucinations wear familiar clothes**: Style transfers; facts do not. When pushed for supporting evidence, the model still invented plausible-sounding academic citations with fabricated arXiv links.
- **Heavy maintenance tax**: A prompt update takes thirty seconds. A fine-tuned LoRA adapter requires curating diffs, retraining locally on Apple Silicon Metal, and regrading the eval suite every time your voice or domain shifts.
- **Poor surgical restraint**: When asked to make a two-word fix, the model frequently rewrote the entire paragraph instead.

### The modular pipeline

This experiment pushed me away from monolithic writer agents and toward a decoupled pipeline:

- **Style linter**: Fast, deterministic regex checks in CI for em-dashes, hype adjectives, and passive stock phrases.
- **Structure checker**: A prompted frontier model tasked exclusively with identifying weak openings, rambling paragraphs, and missing transitions.
- **Fact validator**: A script that tests links, verifies formatting, and flags ungrounded metrics against source diffs.

A regex catches mechanical rules instantly. Prompted models handle structural flow. But spotting voice failures like the consensus tells in Task 3 requires fine-tuned critique or an honest human reader. Separating these concerns into small, atomic checks is easier to debug, simpler to maintain, and avoids the overhead of managing local fine-tuning runs.

## The verdict

Fine-tuning shapes cadence and phrasing. I still handle the thinking.

A locally fine-tuned model provides a fast style check and peer critique layer. But the core craft of writing stays with the author: deciding what matters, verifying evidence, and earning attention. As it should: great writing for humans is deeply personal, and not something I want AI to do for me.

If you are running local fine-tuning or building automated checks for your writing, what workflows are working for you? Share your setup in the comments below.
