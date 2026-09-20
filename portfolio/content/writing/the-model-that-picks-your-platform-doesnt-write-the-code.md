---
title: A Model Router Needs a Scoreboard
summary: Routing tasks to cheaper capability tiers is an easy policy to write, but it remains a hypothesis until held-out runs prove quality holds and measure the real cost of retries, latency, and rescues.
date: 2026-07-20
updated: 2026-09-20
canonical: https://ryanbaumann.dev/writing/the-model-that-picks-your-platform-doesnt-write-the-code/
image: /img/writing/model-tiers-header.svg
imageAlt: One routing policy assigns bounded tasks to several capability profiles, with measurement still required before calling a route efficient.
socialImage: /social/the-model-that-picks-your-platform-doesnt-write-the-code.jpg
shareTitle: A Model Router Needs a Scoreboard
shareSummary: Routing by capability sounds efficient. It becomes a result only when held-out tasks preserve quality and record the real cost.
shareImageAlt: A routing policy assigning tasks to candidate capability profiles before success, attempts, latency, tokens, and cost are measured.
tags: ["developer experience", "ai", "evals"]
draft: false
noindex: false
---

I watched a lightweight model burn 42,000 tokens looping on a routine dependency bump. It patched the wrong manifest, broke the lockfile, and failed five consecutive linter checks before a frontier model had to step in and revert the mess.

Tiered routing was supposed to prevent that bill. In the public [Loop Engineering prompt](https://github.com/ryanbaumann/fieldwork/blob/main/agent-scripts/coding-agent-loop/SYSTEM_PROMPT.md#capability-and-model-routing), we mapped bounded task families to capability tiers:

```text
Tools      deterministic discovery, transformation, verification
Fast       extraction, search, summarization, mechanical edits
Balanced   implementation, debugging, test repair, scoped review
Deep       architecture, security, data consistency, difficult synthesis
```

The mapping looks tidy on paper. Why pay frontier token rates for a regex bump or a file lookup?

A routing policy is just a bet: without a scoreboard, you cannot prove what your cheap route actually costs.

## The hidden cost of cheap routes

On paper, swapping a frontier model for a lightweight worker slashes token rates by 80 or 90 percent. But you have to judge the task output to really know.

Weak models don't error out: they can also "thrash", wasting tokens. They misread tool schemas, patch the wrong files, mangle indentation, and invent package imports. That burns four or five blind repair loops before a human or an orchestrator steps in to rescue the branch.

A fast run that needs three rescues burns more tokens, burns more clock time, and drains more developer focus than calling the deep model first. When a run silently corrupts git state, the cost per useful task is infinite.

## Correctness gates

Sticker prices and average token counts never prove a router works. Correctness is the hard gate: does the build pass? Do unit tests run clean? Did the agent complete the task?

A candidate route earns its tier only when it clears that gate every time. Run tests repeatedly: one lucky pass proves nothing. To prove a model family handles a task family, run held-out tasks against frozen repository fixtures and automated verifiers.

![A routing scoreboard compares candidate capability profiles on the same held-out work before any lower-cost route is called a win.](/img/writing/model-tiers-devx.svg)

## What the scoreboard has to measure

To turn a routing policy into empirical evidence, your test harness must track five numbers across every run:

1. **Pass rate**: did the run clear the compiler, linters, and regression tests without a human rescue?
2. **Retry count**: how many failed tool calls, syntax repairs, or loop resets piled up?
3. **Wall-clock latency**: did three fast retry loops take longer than a single deep pass?
4. **Total tokens**: all prompt context, output tokens, and tool calls spent across the entire session.
5. **Effective cost**: total dollars spent divided by passing runs, counting every token burned on aborted attempts.

When you benchmark profiles side by side against frozen fixtures, tiers stop being guesswork. Simple jobs, like deterministic transforms and narrow schema extractions, land cleanly on Fast. Harder jobs, like fixing subtle race conditions or migrating breaking APIs, collapse into retry loops unless they run on Balanced or Deep.

## Planning models choose the platform

Watch the planner: the model that designs the architecture is rarely the one that writes the code.

In tiered agent sessions, a deep reasoning model evaluates trade-offs, plans the system, and selects the APIs, tools, and auth boundaries. Then it hands bounded coding jobs to lightweight workers.

Your developer platform meets this loop twice. If your platform docs and tool schemas are opaque to the planner, your service never gets picked. If your client SDKs and error messages confuse the worker, the worker botches the implementation and fails the verifier.

Building developer tools for agents demands two distinct surfaces: crisp capability contracts for the planner, and deterministic, foolproof interfaces for the worker.

## Measure before you route

The policy assigns models, but your eval scoreboard decides. Before you hardcode capability tiers into your agent prompts, build the test harness, keep an eye on cost per task, and human review / judge outputs.

If you benchmark model routing across capability tiers or track effective cost per completed task in your own loops, what does your scoreboard track? Drop your metrics and setup in the comments below!
