---
title: DevX Is a Growth Function
slug: devx-is-a-growth-discipline
summary: The growth loop starts when DevX owns repeated developer friction, ships the fix, distributes the better path, and measures whether behavior changed.
date: 2026-07-14
updated: 2026-09-07
canonical: https://ryanbaumann.dev/writing/devx-is-a-growth-discipline/
image: /assets/devx-growth-header.webp
imageAlt: A four-stage DevX loop moves from observed friction to a shipped fix, distribution in builder workflows, and rising measured outcomes.
socialImage: /social/devx-growth-discipline.jpg
shareTitle: DevX Is a Growth Function
shareSummary: Docs, code samples, advocacy, tutorials, and even talking to customers all have a limit. Own the friction, ship the fix, distribute the path, and measure the outcome.
shareImageAlt: Social preview reading DevX Is a Growth Discipline beside a product, distribution, and measurement loop.
tags: ["developer experience", "growth", "ai"]
order: 3
---

Between early 2025 and 2026, our open-source ecosystem more than doubled its unique active users. API engagement also grew strongly over that period. Our product, engineering, UX, and technical writing teams treated product, distribution, and measurement as one system. Those are separate adoption signals; neither tells us how much any one integration contributed.

Documentation requests look like progress, but they usually mask friction that belongs in the product. Docs, code samples, advocacy, and tutorials all have a ceiling. The job is direct: identify the friction that stalls a builder, fix it in the experience, place the better path where they already work, and measure the shift in behavior.

## Own the friction

Friction shows up everywhere: failed first runs, abandoned evals, support tickets, GitHub issues, field conversations, and user research. DevX needs one view across those signals. More importantly, DevX needs to own what happens next.

Our [Voice of Developer program](/work/voice-of-developer/) aggregates repeated friction from Discord, Stack Overflow, GitHub issues, support, field work, and dogfood sessions into ranked product opportunities. That makes the constraint visible. DevX ownership starts there: choose what to solve, ship the change, and measure what happened.

When builders work through coding agents, we design for both the person making the decision and the agent acting inside the task.

## Ship the fix where builders work

A great experience doesn't matter if builders never encounter it. Documentation is one distribution surface, not the entire strategy. The right path also needs to appear in the editor, agent, search result, sample, template, or tool where the work actually begins.

Instead of relying on documentation alone, we distribute executable product behavior directly into developer workflows. Client libraries encapsulate the logic, while [Code Assist](/work/code-assist/) delivers [current official documentation and samples](https://developers.google.com/maps/ai/code-assist) straight to compatible MCP clients. For repetitive tasks, our [agent skills](/work/agent-skills/) bundle [versioned workflows](https://github.com/googlemaps/agent-skills) across Web, Android, iOS, and Web Services. We use task-based evals as a release gate for the skills.

Distribution can't be an afterthought. Design the experience so it can travel, then make it the default in the workflows that already have reach.

## Measure and own outcomes

Interviews, support themes, and developer surveys explain friction, but testing a proposed fix needs a different kind of feedback. We use [agent evaluations](/work/agentic-evals/) to run representative tasks and inspect where an attempt stalls or takes a wrong turn. Scoring the result against a no-context baseline gives us evidence for a launch decision.

Evals don't replace user research, because no single score explains a human builder. A passing run shows that a path met the checks for that task; the delta shows what changed relative to the baseline. Product telemetry tells us whether builders found the path, finished the work, and returned. Direct research helps explain why. Together, these signals let a DevX team test specific hypotheses and measure the outcome.

![An agent evaluation loop moves from a representative task through an agent trace and rubric comparison to a ship-or-hold decision, then repeats using telemetry and research.](/assets/devx-eval-loop.webp)

The useful follow-up to a shipped fix is whether builders encountered it and got past the original problem. How does your team follow a fix from a support thread or eval failure through to adoption?
