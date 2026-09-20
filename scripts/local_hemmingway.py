#!/usr/bin/env python3
"""
Local Hemmingway Runner (Apple Silicon / MLX)

Architecture matches scripts/local_gemma.py:
- Metal GPU acceleration on Apple Silicon via mlx_lm
- Pure stdout output for clean piping to subagents (diagnostics to stderr)
- Auto-resolves models from:
  1) Local models/hemmingway-1-4bit or models/Altworld-Hemmingway-1
  2) Local models/Qwen3.8-27B-4bit (the repository's verified base architecture)
  3) Auto-downloads from Hugging Face if explicitly requested or missing
- Native architecture registration for 'qwen3_5_text' -> 'qwen3_5'
- Strips reasoning/thinking tags and preambles so only the critique is returned
"""

import sys
import os
import re
import argparse
from pathlib import Path

DEFAULT_MODEL_REPO = "Altworld/Hemmingway-1"
ROOT_DIR = Path(__file__).resolve().parent.parent

LOCAL_DIR_HEMMINGWAY = ROOT_DIR / "models" / "hemmingway-1-4bit"
LOCAL_DIR_ALTWORLD = ROOT_DIR / "models" / "Altworld-Hemmingway-1"
LOCAL_DIR_QWEN_BASE = ROOT_DIR / "models" / "Qwen3.8-27B-4bit"

SYSTEM_PROMPT = (
    "You are Hemmingway, an uncompromising, precision-focused copyeditor and writing reviewer. "
    "Your job is to eliminate corporate jargon, passive hedging, throat-clearing, fluff, "
    "AI stock phrases (e.g. 'dive into', 'testament to', 'beacon', 'unleash', 'at the end of the day'), "
    "and false antithesis flips ('not X, but Y'). "
    "You advocate for short, rhythmic, Anglo-Saxon phrasing, concrete nouns, strong active verbs, and honest evidence. "
    "When reviewing copy, give direct, actionable critique with line-level quotes and punchy rewrites. "
    "Do not provide flattering preamble or generic summaries. Output only the critique and recommendations."
)


def log_diag(msg: str):
    """Write diagnostic messages to stderr to keep stdout completely clean for piping."""
    sys.stderr.write(f"{msg}\n")
    sys.stderr.flush()


def ensure_mlx_model_mapping():
    """Ensure qwen3_5_text model_type is recognized by MLX models."""
    try:
        import mlx_lm.utils as utils
        utils.MODEL_REMAPPING["qwen3_5_text"] = "qwen3_5"
    except Exception as e:
        log_diag(f"[!] Warning registering model mapping: {e}")


def resolve_model_dir(model_arg: str = None, repo_arg: str = None) -> tuple[str, bool]:
    """
    Resolve model directory matching the local gemma runner architecture.
    Returns (model_path_or_repo, is_local_dir).
    """
    ensure_mlx_model_mapping()

    if model_arg:
        p = Path(model_arg)
        if p.exists():
            return str(p), True
        return model_arg, False

    # Check candidates locally in order of preference
    for candidate in [LOCAL_DIR_HEMMINGWAY, LOCAL_DIR_ALTWORLD, LOCAL_DIR_QWEN_BASE]:
        if candidate.exists() and (candidate / "config.json").exists():
            log_diag(f"[*] Found local model weights at {candidate}")
            return str(candidate), True

    repo_id = repo_arg or DEFAULT_MODEL_REPO
    log_diag(f"[*] Local directory not populated. Target repo: {repo_id}")
    return repo_id, False


def ensure_model_downloaded(repo_id: str = DEFAULT_MODEL_REPO, local_dir: Path = None) -> str:
    """Download model weights locally if needed."""
    ensure_mlx_model_mapping()
    target_dir = local_dir or LOCAL_DIR_HEMMINGWAY

    if target_dir.exists() and (target_dir / "config.json").exists():
        return str(target_dir)

    log_diag(f"[*] Downloading '{repo_id}' to {target_dir} (Gitignored)...")
    target_dir.mkdir(parents=True, exist_ok=True)

    from huggingface_hub import snapshot_download
    snapshot_download(
        repo_id=repo_id,
        local_dir=str(target_dir),
        local_dir_use_symlinks=False,
        resume_download=True,
    )
    log_diag(f"[✓] Download complete: {target_dir}")
    return str(target_dir)


def load_model(model_path: str, adapter_path: str = None):
    """Load MLX model into Apple Silicon Metal memory."""
    ensure_mlx_model_mapping()
    import mlx_lm

    if adapter_path and Path(adapter_path).exists():
        log_diag(f"[*] Loading model from {model_path} with adapter {adapter_path} into Metal memory...")
        model, tokenizer = mlx_lm.load(model_path, adapter_path=str(adapter_path))
    else:
        log_diag(f"[*] Loading model from {model_path} into Metal memory...")
        model, tokenizer = mlx_lm.load(model_path)

    log_diag("[✓] Model loaded successfully.")
    return model, tokenizer


def clean_critique(raw: str) -> str:
    """Remove transport markers, reasoning/thinking tags, and extraneous artifacts."""
    out = (raw or "").strip()

    # Remove <think>...</think> blocks
    out = re.sub(r"<think>.*?</think>", "", out, flags=re.DOTALL).strip()

    # Remove end-of-turn transport tokens
    for marker in ("<end_of_turn>", "<|im_end|>", "<|endoftext|>", "</s>"):
        if out.endswith(marker):
            out = out[:-len(marker)].strip()

    return out


def generate_text(
    model,
    tokenizer,
    prompt: str,
    system_prompt: str = SYSTEM_PROMPT,
    max_tokens: int = 4096,
    temp: float = 0.6,
) -> str:
    """Generate response using MLX on Apple Silicon Metal."""
    import mlx_lm

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt},
    ]

    if hasattr(tokenizer, "apply_chat_template") and getattr(tokenizer, "chat_template", None):
        try:
            formatted_prompt = tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True,
                enable_thinking=False,
            )
        except TypeError:
            formatted_prompt = tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True,
            )
    else:
        formatted_prompt = (
            f"<|im_start|>system\n{system_prompt}<|im_end|>\n"
            f"<|im_start|>user\n{prompt}<|im_end|>\n"
            f"<|im_start|>assistant\n"
        )

    sampler = getattr(mlx_lm, "sample_utils", None)
    sampler_fn = sampler.make_sampler(temp) if sampler and hasattr(sampler, "make_sampler") else None

    gen_kwargs = {
        "max_tokens": max_tokens,
        "verbose": False,
    }
    if sampler_fn is not None:
        gen_kwargs["sampler"] = sampler_fn

    log_diag("[*] Generating critique...")
    raw = mlx_lm.generate(model, tokenizer, prompt=formatted_prompt, **gen_kwargs)
    return clean_critique(raw)


def resolve_target_text(target_path_or_text: str = None) -> str:
    """Safely resolve target from stdin ('-'), file path, or direct text string."""
    if not target_path_or_text or target_path_or_text == "-":
        if not sys.stdin.isatty():
            return sys.stdin.read()
        return ""

    if "\n" in target_path_or_text or len(target_path_or_text) > 400:
        return target_path_or_text

    try:
        p = Path(target_path_or_text)
        if p.is_file():
            return p.read_text(encoding="utf-8")
    except (OSError, ValueError):
        pass

    return target_path_or_text


def review_copy(model, tokenizer, target_path_or_text: str, max_tokens: int = 4096) -> str:
    """Perform editorial critique on copy and return purely the critique."""
    text = resolve_target_text(target_path_or_text)
    if not text.strip():
        raise ValueError("No copy provided to review. Pass a file path, text string, or pipe via stdin.")

    # Strip front matter if markdown post
    body = text
    if body.startswith("---"):
        parts = body.split("---", 2)
        if len(parts) >= 3:
            body = parts[2].strip()

    prompt = (
        "Perform a thorough editorial review and critique of this copy.\n\n"
        "Assess:\n"
        "1. Voice & Clarity: Identify throat-clearing, corporate jargon, passive voice, and fluff.\n"
        "2. Cliché & AI-Tell Check: Flag em-dashes, false antitheses ('not X, but Y'), and stock transitions.\n"
        "3. Concrete Line-by-Line Rewrites: Provide direct, punchy replacements for the weakest lines.\n\n"
        f"--- COPY TO REVIEW ---\n{body}"
    )
    return generate_text(model, tokenizer, prompt, max_tokens=max_tokens)


def edit_copy(model, tokenizer, target_path_or_text: str, max_tokens: int = 4096) -> str:
    """Directly rewrite copy into direct, human, punchy style."""
    text = resolve_target_text(target_path_or_text)
    if not text.strip():
        raise ValueError("No copy provided to edit. Pass a file path, text string, or pipe via stdin.")

    prompt = (
        "Rewrite the following text in punchy, active, human style. "
        "Strip corporate boilerplate, passive hedging, and throat-clearing. "
        "Preserve all factual details, metrics, and technical specifics:\n\n"
        f"{text}"
    )
    return generate_text(model, tokenizer, prompt, max_tokens=max_tokens)


def add_common_args(p):
    p.add_argument("--max-tokens", type=int, default=None, help="Max response tokens")
    p.add_argument("--temp", type=float, default=0.6, help="Sampling temperature")
    p.add_argument("--model", default=None, help="Local model directory or Hugging Face repo")
    p.add_argument("--repo", default=None, help="Hugging Face repo ID")
    p.add_argument("--adapter-path", default=None, help="Optional LoRA adapter path")


def main():
    # Allow running `local_hemmingway.py <file>` directly defaulting to review
    argv = sys.argv[1:]
    known_commands = {"review", "edit", "generate", "download", "-h", "--help"}

    if argv and argv[0] not in known_commands and not argv[0].startswith("-"):
        argv = ["review"] + argv
    elif not argv and not sys.stdin.isatty():
        argv = ["review", "-"]

    parser = argparse.ArgumentParser(description="Local Hemmingway Runner (Apple Silicon / MLX)")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Review command (default)
    rev_parser = subparsers.add_parser("review", help="Review copy against human un-slop standards")
    rev_parser.add_argument("target", nargs="?", default="-", help="File path, string, or '-' for stdin")
    add_common_args(rev_parser)

    # Edit command
    edit_parser = subparsers.add_parser("edit", help="Rewrite text in punchy, active style")
    edit_parser.add_argument("target", nargs="?", default="-", help="File path, string, or '-' for stdin")
    add_common_args(edit_parser)

    # Generate command
    gen_parser = subparsers.add_parser("generate", help="Generate response to an arbitrary prompt")
    gen_parser.add_argument("prompt", help="Prompt text")
    add_common_args(gen_parser)

    # Download command
    dl_parser = subparsers.add_parser("download", help="Download model weights to models/ without running")
    add_common_args(dl_parser)

    args = parser.parse_args(argv)

    if not args.command:
        parser.print_help(sys.stderr)
        sys.exit(1)

    if args.command == "download":
        repo_id = args.repo or DEFAULT_MODEL_REPO
        target_dir = Path(args.model) if args.model else LOCAL_DIR_HEMMINGWAY
        path = ensure_model_downloaded(repo_id=repo_id, local_dir=target_dir)
        log_diag(f"[✓] Model ready at {path}")
        return

    model_dir, is_local = resolve_model_dir(args.model, args.repo)
    if not is_local:
        log_diag(f"[*] Ensuring model is available locally...")
        model_dir = ensure_model_downloaded(repo_id=model_dir)

    model, tokenizer = load_model(model_dir, adapter_path=args.adapter_path)

    if args.command == "review":
        max_tokens = args.max_tokens or 4096
        critique = review_copy(model, tokenizer, args.target, max_tokens=max_tokens)
        # Write purely the critique to stdout for seamless piping to subagents
        sys.stdout.write(critique + "\n")
        sys.stdout.flush()
    elif args.command == "edit":
        max_tokens = args.max_tokens or 4096
        edited = edit_copy(model, tokenizer, args.target, max_tokens=max_tokens)
        sys.stdout.write(edited + "\n")
        sys.stdout.flush()
    elif args.command == "generate":
        max_tokens = args.max_tokens or 4096
        res = generate_text(model, tokenizer, args.prompt, max_tokens=max_tokens, temp=args.temp)
        sys.stdout.write(res + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
