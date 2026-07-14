---
title: Evals Are How You Know an AI Developer Tool Got Better
summary: Task-based evals show whether a context, tool, or prompt improved the developer's actual job.
date: 2026-07-13
canonical: https://www.ryanbaumann-portfolio.com/writing/evals-turn-ai-developer-experience-into-an-operating-system/
image: /img/work/agentic-evals.svg
imageAlt: An evaluation loop moving from developer task to agent run, scored result, and launch decision
socialImage: /social/evals-turn-ai-developer-experience-into-an-operating-system.png
shareTitle: Evals Are How You Know an AI Developer Tool Got Better
shareSummary: Test whether a context, tool, or prompt improved the developer's actual job.
shareImageAlt: Evals Are How You Know an AI Developer Tool Got Better beside an evaluation-loop artifact
tags: ["evals", "ai developer experience", "developer tools"]
order: 3
---

Evals show whether an AI developer tool got better. Without them, a team can ship context, prompts, tools, and skills, but it cannot tell whether an agent became better at the developer's task.

A polished demo is evidence that one path worked once. A task-based evaluation makes the result repeatable, comparable, and useful for a launch decision.

## Measure the developer task

The unit of quality should be the job the developer is trying to complete. For a developer platform, that might be adding a map, choosing the right API, configuring authentication, or fixing code that uses an outdated surface.

The eval should run that task through an agent and inspect the result. Depending on the job, useful measures include grounded code accuracy, tool-call behavior, token cost, and end-to-end completion. The important comparison is the delta between a baseline and the proposed change.

My team and I built an [agentic eval suite](/work/agentic-evals/) for Google Maps Platform around that model. We compare context products against a no-context baseline and use the result to inform launch and roadmap decisions. The suite gives retrieval, skills, and agent integrations a shared quality bar.

## Connect failures back to field signal

An eval set should not be a collection of clever prompts. It should represent the failures that matter to developers and the business.

That evidence can come from support, GitHub issues, community questions, field engineering, documentation gaps, and traces from real workflows when privacy and access rules allow it. A repeated failure becomes a task. The task becomes a test. The scored result shows whether a context or product change addressed the problem.

This creates a loop:

1. Find repeated friction in the field.
2. Encode the developer task and expected behavior.
3. Run the baseline.
4. Change one part of the context, tool, or workflow.
5. Compare the result and inspect the failures.
6. Ship only when the evidence supports the decision.

The loop is more useful than a single aggregate score. It tells the team which class of failure moved and which cases still need work.

## Keep the evaluator independent

The system proposing a change should not be the only system judging it. An optimizer that grades its own output can learn the shape of the rubric without improving the developer outcome.

Use deterministic checks where possible. Compile generated code. Validate required APIs and tool calls. Check that the result follows security constraints. Use a separate grader for behavior that needs judgment, then review failure traces directly.

Trust deltas more than absolute scores. Model behavior, agent harnesses, and adaptive graders move. A stable baseline and a focused metric make the before-and-after comparison useful even when the surrounding system changes.

## Make the eval the shared quality gate

A useful eval lets product, documentation, and engineering test changes against the same developer task.

The same tasks can test a documentation update, retrieval change, or tool release. Everyone can inspect which failures moved and which did not.

That shared mechanism reduces opinion-driven debate. It also keeps AI Developer Experience connected to product growth. If a change improves a task in evals, the team can ship it into a real distribution surface and then measure whether adoption changes. The eval is not the business outcome. It is the quality gate between field signal and scaled distribution.

## Start with ten real tasks

Choose ten failures from issues, support, community questions, or traces. Run them with no added context. Inspect the failures, make one targeted change, and run the same tasks again. Let the delta decide what to fix next.
