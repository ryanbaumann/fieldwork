#!/usr/bin/env python3
"""Unit tests for scripts/local_hemmingway.py."""

import unittest
from pathlib import Path
import tempfile
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import local_hemmingway  # noqa: E402


class HemmingwayRunnerTest(unittest.TestCase):

    def test_clean_critique_strips_thinking_tags(self):
        raw = "<think>\nLet me think about how to critique this.\nIt has filler.\n</think>\n\n# Critique\n\nCut the throat-clearing."
        cleaned = local_hemmingway.clean_critique(raw)
        self.assertEqual(cleaned, "# Critique\n\nCut the throat-clearing.")

    def test_clean_critique_strips_turn_tokens(self):
        raw = "Cut the em-dashes and filler words.<|im_end|>"
        cleaned = local_hemmingway.clean_critique(raw)
        self.assertEqual(cleaned, "Cut the em-dashes and filler words.")

        raw2 = "Shorten this paragraph.<end_of_turn>"
        cleaned2 = local_hemmingway.clean_critique(raw2)
        self.assertEqual(cleaned2, "Shorten this paragraph.")

    def test_ensure_mlx_model_mapping(self):
        try:
            import mlx_lm.utils as utils
            local_hemmingway.ensure_mlx_model_mapping()
            self.assertIn("qwen3_5_text", utils.MODEL_REMAPPING)
            self.assertEqual(utils.MODEL_REMAPPING["qwen3_5_text"], "qwen3_5")
        except ImportError:
            self.skipTest("mlx_lm not installed in test python environment (available via uv)")

    def test_resolve_target_text_file(self):
        with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False) as f:
            f.write("# Sample Article\n\nThis is a draft.")
            temp_path = f.name

        try:
            content = local_hemmingway.resolve_target_text(temp_path)
            self.assertEqual(content, "# Sample Article\n\nThis is a draft.")
        finally:
            Path(temp_path).unlink(missing_ok=True)

    def test_resolve_target_text_string(self):
        sample = "In today's world, we leverage synergies."
        content = local_hemmingway.resolve_target_text(sample)
        self.assertEqual(content, sample)

    def test_resolve_model_dir_local(self):
        model_dir, is_local = local_hemmingway.resolve_model_dir()
        self.assertTrue(is_local)
        self.assertTrue(Path(model_dir).exists())
        self.assertTrue((Path(model_dir) / "config.json").exists())


if __name__ == "__main__":
    unittest.main()
