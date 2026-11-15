import importlib.util
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch


SCRIPT_PATH = Path(__file__).with_name("portable_infographic.py")
SPEC = importlib.util.spec_from_file_location("portable_infographic", SCRIPT_PATH)
portable = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(portable)


def config_type(*field_names):
    class Config:
        model_fields = {name: object() for name in field_names}

        def __init__(self, **kwargs):
            self.kwargs = kwargs

    return Config


class ModelRoutingAndConfigTest(unittest.TestCase):
    def test_model_constants_and_legacy_normalization(self):
        self.assertEqual(portable.ORCHESTRATOR_MODEL, "gemini-4-hydrogen")
        self.assertEqual(portable.IMAGE_MODEL, "gemini-nano-banana-2.1")
        self.assertEqual(portable.FAST_IMAGE_MODEL, "gemini-3.1-flash-lite-image")
        self.assertEqual(
            portable.normalize_image_model("gemini-3.1-flash-image"),
            "gemini-nano-banana-2.1",
        )
        self.assertEqual(
            portable.normalize_image_model("gemini-nano-banana-2.1"),
            "gemini-nano-banana-2.1",
        )
        self.assertEqual(
            portable.normalize_image_model("gemini-3.1-flash-lite-image"),
            "gemini-3.1-flash-lite-image",
        )
        self.assertEqual(portable.normalize_image_model(""), "gemini-nano-banana-2.1")
        self.assertNotIn("—", portable.RESEARCH_SYSTEM_PROMPT)

    def test_cli_accepts_default_fast_and_legacy_image_models(self):
        parser = portable.build_parser()
        default_args = parser.parse_args(["Solar capacity 2026"])
        self.assertEqual(default_args.image_model, "gemini-nano-banana-2.1")

        fast_args = parser.parse_args(["Solar capacity 2026", "--image-model", "gemini-3.1-flash-lite-image"])
        self.assertEqual(portable.normalize_image_model(fast_args.image_model), "gemini-3.1-flash-lite-image")

        legacy_args = parser.parse_args(["Solar capacity 2026", "--image-model", "gemini-3.1-flash-image"])
        self.assertEqual(portable.normalize_image_model(legacy_args.image_model), "gemini-nano-banana-2.1")

    def test_current_sdk_requests_resolution_and_medium_or_low_thinking(self):
        fake_types = SimpleNamespace(
            ImageConfig=config_type("aspect_ratio", "image_size"),
            ThinkingConfig=config_type("thinking_level", "include_thoughts"),
        )

        with patch.object(portable, "types", fake_types):
            image = portable._image_config("16:9", "1K")
            research_thinking = portable._thinking_config(research=True)
            no_research_thinking = portable._thinking_config(research=False)

        self.assertEqual(image.kwargs, {"aspect_ratio": "16:9", "image_size": "1K"})
        self.assertEqual(
            research_thinking.kwargs,
            {"thinking_level": "MEDIUM", "include_thoughts": True},
        )
        self.assertEqual(
            no_research_thinking.kwargs,
            {"thinking_level": "LOW", "include_thoughts": True},
        )

    def test_orchestrator_config_omits_temperature_on_gemini_4(self):
        fake_types = SimpleNamespace(
            GenerateContentConfig=config_type(
                "system_instruction", "thinking_config", "tools", "http_options", "temperature"
            ),
            ThinkingConfig=config_type("thinking_level", "include_thoughts"),
            Tool=lambda **kw: kw,
            GoogleSearch=lambda: "google_search",
            HttpOptions=lambda **kw: kw,
        )

        with patch.object(portable, "types", fake_types):
            research_cfg = portable._orchestrator_config("gemini-4-hydrogen", research=True)
            direct_cfg = portable._orchestrator_config("gemini-4-hydrogen", research=False)

        self.assertNotIn("temperature", research_cfg.kwargs)
        self.assertEqual(research_cfg.kwargs["thinking_config"].kwargs, {"thinking_level": "MEDIUM"})
        self.assertIn("tools", research_cfg.kwargs)

        self.assertNotIn("temperature", direct_cfg.kwargs)
        self.assertEqual(direct_cfg.kwargs["thinking_config"].kwargs, {"thinking_level": "LOW"})
        self.assertNotIn("tools", direct_cfg.kwargs)

    def test_sdk_1_47_falls_back_to_supported_fields(self):
        fake_types = SimpleNamespace(
            ImageConfig=config_type("aspect_ratio"),
            ThinkingConfig=config_type("thinking_budget", "include_thoughts"),
        )

        with patch.object(portable, "types", fake_types), patch.object(portable, "warn") as warn:
            image = portable._image_config("16:9", "1K")
            thinking = portable._thinking_config(research=True)
            low_thinking = portable._thinking_config(research=False)

        self.assertEqual(image.kwargs, {"aspect_ratio": "16:9"})
        self.assertEqual(
            thinking.kwargs,
            {"thinking_budget": -1, "include_thoughts": True},
        )
        self.assertEqual(
            low_thinking.kwargs,
            {"thinking_budget": 0, "include_thoughts": True},
        )
        warn.assert_called_once_with(
            "Installed google-genai does not expose image_size; using the model's native resolution."
        )


if __name__ == "__main__":
    unittest.main()
