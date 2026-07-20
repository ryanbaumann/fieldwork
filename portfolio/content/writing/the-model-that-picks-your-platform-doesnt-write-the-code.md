---
title: The Model That Picks Your Platform Doesn't Write the Code
summary: Coding agents are splitting into a frontier orchestrator that makes the design decision and lower-cost workers that implement it, and a developer platform has to win both readers.
date: 2026-07-20
updated: 2026-07-20
canonical: https://ryanbaumann.dev/writing/the-model-that-picks-your-platform-doesnt-write-the-code/
image: /img/writing/model-tiers-header.svg
imageAlt: Flow from developer intent through a frontier orchestrator that decides the design to lower-cost workers that write the code and verifiers that check the result.
socialImage: /social/the-model-that-picks-your-platform-doesnt-write-the-code.jpg
shareTitle: The Model That Picks Your Platform Doesn't Write the Code
shareSummary: Why coding is splitting into frontier orchestrators and lower-cost workers, and where a developer platform strategy should focus.
shareImageAlt: Social card for the field note beside a diagram of a frontier orchestrator routing bounded tasks to lower-cost workers.
tags: ["developer experience", "ai", "field notes"]
draft: false
noindex: false
---

Ask whether coding will end up on local models or frontier models and you get a debate about model size. Watch a working agent session instead and you see a different split forming. In the loops I run, a frontier model reads the intent, resolves the ambiguity, and decides the design, then hands bounded tasks to lower-cost workers that write most of the code. If you build a developer platform, that split matters more than the local-versus-frontier question, because the model that chooses your platform is not the model that calls it.

## Cost per task routes the work

The pattern is economic before it is technical. An orchestrator spends expensive reasoning on the decisions that change the outcome: which API fits, where the auth boundary sits, when the work is done. Implementation is different. Once a task is bounded and the checks are objective, a cheaper model can carry it, because the compiler, the tests, and the linter catch what it fumbles. Better verifiers make cheaper coders.

That is also how local and open models arrive in coding. They do not have to beat the frontier model at system design. They have to execute a well-specified task at a fraction of the cost, and the harness has to prove they did. I [codified this routing](/writing/loop-engineering-coding-agent/) in a [public system prompt](https://github.com/ryanbaumann/fieldwork/tree/main/agent-scripts/coding-agent-loop) that sends each job to the least costly capable profile. I have not measured where the execution floor sits, and I expect it to keep moving down.

## Your platform has two readers now

A developer platform meets this system twice, and the readers want different things. The orchestrator is the decision reader. It compares your API against the alternatives, weighs the constraints, and picks the architecture, which is where activation is won or lost. The workers are execution readers. They need examples and workflows that still land when a less capable model runs them, so a skill tested only on the strongest model is undertested.

![A platform serves two readers: win the design decision at the orchestrator tier, survive execution at the cheapest worker tier, and prove both with evals.](/img/writing/model-tiers-devx.svg)

*The directive: win the decision at the frontier tier, survive execution at the cheapest tier, and let evals prove both.*

So the developer experience strategy is not frontier or cheap. It is both, with different assets. Put current, decision-shaping context where the orchestrator plans, and test your examples against the cheapest tier you expect to write the code.

The execution side has its own scoreboard, and it is consistency, not brilliance. A developer journey is not cheap because a small model passes it once. It is cheap when the small model completes the task reliably: the same journey, run after run, with low variance and less context each release. When work that needed Gemini Pro completes just as well on Gemini Flash, developers get the same result faster and at lower cost, and that test applies to every model family you route. Track completion rate, run-to-run variance, and tokens per journey at each tier, and treat a journey that passes one tier lower as a real platform win.

## Make the loop portable across all of them

You will not control which models or agents developers bring, so the improving loop has to travel. Our team is running that loop for Google Maps Platform through portable [agent skills](/work/agent-skills/) and a [task-based eval suite](/work/agentic-evals/); I lead the strategy and review the traces. Open source the skills and the evals you want agent builders and model teams to learn from, and [keep a held-out set](/writing/builder-platforms-grow-by-owning-the-agent-loop/) so the score stays trustworthy. Then distribute the same tested context everywhere developers work: popular coding agents, open ones, and the internal agents teams are standing up.

I do not know where the tiers settle, and neither does anyone selling certainty about it. Treat every new model, local or frontier, as another row in your test matrix: run the evals, read the traces, move the context. Run the experiment in your own harness and let the evidence pick the tiers.
