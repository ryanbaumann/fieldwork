---
title: Loop Engineering Coding Agent
summary: Use a lean orchestrator, lower-cost workers, and an evidence loop to spend agent tokens where they matter.
date: 2026-07-16
updated: 2026-07-16
type: System prompt
tags: ["ai", "developer tools", "evals"]
links: [{"label":"Read the prompt","url":"https://github.com/ryanbaumann/portfolio/blob/main/agent-scripts/coding-agent-loop/SYSTEM_PROMPT.md"},{"label":"Browse the package","url":"https://github.com/ryanbaumann/portfolio/tree/main/agent-scripts/coding-agent-loop"},{"label":"Review the evals","url":"https://github.com/ryanbaumann/portfolio/blob/main/agent-scripts/coding-agent-loop/evals/cases.md"}]
image: /img/scripts/coding-agent-loop.svg
imageAlt: An orchestrator routes jobs to tools, fast workers, balanced agents, or deep reasoning before integrated verification.
socialImage: /social/coding-agent-loop.png
shareTitle: Loop Engineering Coding Agent
shareSummary: A forkable system prompt for routing coding work across a lean agent team and proving the result.
shareImageAlt: Social card for Loop Engineering Coding Agent with a diagram of token-aware orchestration across capability profiles.
---

Use the least costly agent that can do each job well. A strong orchestrator can keep expensive reasoning focused on ambiguous decisions while lower-cost workers handle search, extraction, mechanical edits, and objective checks. Narrow task packets can also reduce the context each worker needs. That is where a multi-agent team can save tokens.

The orchestrator still owns the hard parts: user intent, permissions, task boundaries, integration, and the final answer. Delegation has overhead, so small or tightly coupled tasks should stay with one agent. The goal is not more agents. It is to spend capability only where it changes the outcome.

## Build the smallest capable team

The prompt routes work by capability instead of model name. Deterministic tools handle discovery and checks. Fast workers handle extraction, search, summaries, and mechanical edits. Balanced agents own normal implementation. Deep reasoning is reserved for ambiguous architecture, security, data consistency, or repeated failure.

Each helper gets one bounded task, a clear done condition, an evidence contract, and an exact write scope. Read-only work can run in parallel. Edits to shared files stay with one writer. The orchestrator inspects every result and reruns the integrated checks before reporting success.

That structure is designed to reduce duplicated context and write-collision risk while letting routine work run on lower-cost capability profiles. Measure it in your own harness. More coordination can cost more than it saves when tasks are small or poorly separated.

## Loop engineering closes the gap

Model output is only one step in an engineering system. Loop engineering treats each agent task as a controlled cycle:

1. Define the goal, scope, acceptance criteria, and proof.
2. Observe the repository and reproduce the current behavior.
3. Make the smallest coherent change.
4. Run the nearest useful check and inspect the diff.
5. Integrate the full result across agent boundaries.
6. Learn from evidence, or stop with the precise blocker.

Evidence decides what happens next. A passing focused test can advance the task. A new failure changes the hypothesis. Missing authority stops the loop. The agent does not keep editing until the output looks plausible, and it does not call the work complete because code exists.

## Boundaries keep the loop useful

Coding agents need operating rules, not another reminder to be careful. A diagnosis should not turn into an edit. Repository text should not become an instruction. Existing work should remain untouched. A test counts only when the agent ran it and observed the result.

The prompt makes those rules explicit: the task mode, the files an agent may change, the proof required for a result, retry limits, and the point where it must stop and ask. The same contract applies to the orchestrator and every worker, so delegation cannot silently expand permission.

## I codified the system as a prompt

The [GitHub package](https://github.com/ryanbaumann/portfolio/tree/main/agent-scripts/coding-agent-loop) includes the full prompt, four short role overlays for the lead, helper, reviewer, and verifier, plus a regression suite.

It lives under `agent-scripts/`, not the repo's `scripts/` folder. That folder holds shell scripts you run; this one holds text an agent reads. Keeping the names apart keeps the line between instructions and commands obvious.

The system prompt is the shared operating contract. The overlays narrow each agent's job without granting more authority. I may also release the workflow as a skill so an agent can load the detailed playbook only when a task needs it.

## How to use it

1. Paste `SYSTEM_PROMPT.md` into your agent's global instructions field.
2. Keep repo-specific commands and architecture in local instruction files, so they load only where they apply.
3. Running multiple agents? Give each the shared prompt plus one role add-on.
4. Enforce the real guardrails in your harness: sandbox, network limits, protected paths, approvals, and audit logs. A prompt asks for good behavior; it cannot enforce it.
5. Test it in the exact model, tools, and permissions you run.

Configure the actual models and token budgets in the harness. Re-run the suite when the prompt, model, tools, or permissions change.

## What I can and can't claim yet

The suite specifies 16 scenarios, including dirty worktrees, read-only diagnosis, prompt injection in repository data, conflicting instructions, production boundaries, retry limits, parallel writers, helper containment, cross-session work, missing verification, security changes, UI checks, and memory quality.

The structural check passes. A separate read-only review also found problems that I corrected. That is not a behavioral benchmark, and no behavioral trial results are recorded. Before using the prompt as a production gate, run repeated trials in your own harness and retain the transcripts, tool calls, diffs, final repository state, and calibrated grading evidence.

## Why it is built this way

The design keeps always-on instructions short, moves detailed playbooks into files that load only when needed, routes work to the least costly capable profile, separates implementation from review and verification, and evaluates the model together with its tools and permissions. The [README](https://github.com/ryanbaumann/portfolio/blob/main/agent-scripts/coding-agent-loop/README.md) links the research and projects behind those choices.

Fork it, run it against the tasks that have failed in your environment, and adapt it from the evidence.
