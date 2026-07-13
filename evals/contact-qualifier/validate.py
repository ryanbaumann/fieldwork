#!/usr/bin/env python3
"""Read-only structural/privacy validation for contact qualifier eval assets."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATASET_PATH = ROOT / "dataset.v1.json"
RUBRICS_PATH = ROOT / "rubrics.v1.json"

REQUIRED_CATEGORIES = {
    "normal",
    "ambiguous",
    "irrelevant",
    "prompt_injection",
    "pii",
    "availability_commitment_trap",
}
CASE_FIELDS = {"id", "category", "input", "expectation", "rubric_ids"}
INPUT_FIELDS = {"intent", "opportunity_description"}
EXPECTATION_FIELDS = {"disposition", "privacy", "commitment_risk"}
SYNTHETIC_PLACEHOLDER = re.compile(r"<SYNTHETIC_[A-Z_]+>")
EMAIL_LIKE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
PHONE_LIKE = re.compile(r"(?<!\w)(?:\+?\d[\d(). -]{7,}\d)(?!\w)")


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValueError(f"{path.name}: root must be an object")
    return value


def validate() -> list[str]:
    errors: list[str] = []
    dataset = load_json(DATASET_PATH)
    rubric_file = load_json(RUBRICS_PATH)

    if dataset.get("schema_version") != "contact-qualifier.dataset.v1":
        errors.append("dataset: unexpected schema_version")
    if rubric_file.get("schema_version") != "contact-qualifier.rubrics.v1":
        errors.append("rubrics: unexpected schema_version")

    contract = dataset.get("input_contract", {})
    allowed_intents = set(contract.get("intents", []))
    if set(contract.get("allowed_fields", [])) != INPUT_FIELDS:
        errors.append("dataset: input_contract must allow exactly intent and opportunity_description")
    max_chars = contract.get("max_opportunity_description_chars")
    if not isinstance(max_chars, int) or max_chars <= 0:
        errors.append("dataset: max_opportunity_description_chars must be a positive integer")
        max_chars = 0

    output_contract = dataset.get("output_contract", {})
    required_output = {"what_i_heard", "why_ryan_may_be_relevant", "next_useful_question"}
    if set(output_contract.get("required_fields", [])) != required_output:
        errors.append("dataset: output contract fields changed")
    if output_contract.get("additional_fields") is not False:
        errors.append("dataset: output contract must reject additional fields")

    rubrics = rubric_file.get("rubrics", [])
    rubric_ids = [rubric.get("id") for rubric in rubrics if isinstance(rubric, dict)]
    known_rubrics = set(rubric_ids)
    if len(known_rubrics) != len(rubric_ids):
        errors.append("rubrics: ids must be unique")

    cases = dataset.get("cases", [])
    if not isinstance(cases, list) or not cases:
        errors.append("dataset: cases must be a non-empty array")
        cases = []
    case_ids: set[str] = set()
    counts: Counter[str] = Counter()

    for index, case in enumerate(cases):
        label = f"case[{index}]"
        if not isinstance(case, dict):
            errors.append(f"{label}: must be an object")
            continue
        if set(case) != CASE_FIELDS:
            errors.append(f"{label}: fields must be exactly {sorted(CASE_FIELDS)}")
        case_id = case.get("id")
        if not isinstance(case_id, str) or not case_id:
            errors.append(f"{label}: id must be a non-empty string")
        elif case_id in case_ids:
            errors.append(f"{label}: duplicate id {case_id}")
        else:
            case_ids.add(case_id)
            label = case_id

        category = case.get("category")
        if category not in REQUIRED_CATEGORIES:
            errors.append(f"{label}: unknown category {category!r}")
        else:
            counts[category] += 1

        case_input = case.get("input")
        if not isinstance(case_input, dict) or set(case_input) != INPUT_FIELDS:
            errors.append(f"{label}: input fields must be exactly {sorted(INPUT_FIELDS)}")
            continue
        if case_input.get("intent") not in allowed_intents:
            errors.append(f"{label}: intent is not in the approved low-cardinality set")
        description = case_input.get("opportunity_description")
        if not isinstance(description, str) or not description.strip():
            errors.append(f"{label}: opportunity_description must be a non-empty string")
            description = ""
        if len(description) > max_chars:
            errors.append(f"{label}: opportunity_description exceeds {max_chars} characters")
        if EMAIL_LIKE.search(description):
            errors.append(f"{label}: contains email-like data; use a synthetic placeholder")
        if PHONE_LIKE.search(description):
            errors.append(f"{label}: contains phone-like data; use a synthetic placeholder")

        placeholders = SYNTHETIC_PLACEHOLDER.findall(description)
        if category == "pii" and not placeholders:
            errors.append(f"{label}: PII case must use at least one synthetic placeholder")
        if category != "pii" and placeholders:
            errors.append(f"{label}: synthetic PII placeholders are restricted to PII cases")
        residue = SYNTHETIC_PLACEHOLDER.sub("", description)
        if "<SYNTHETIC" in residue:
            errors.append(f"{label}: malformed synthetic placeholder")

        expectation = case.get("expectation")
        if not isinstance(expectation, dict) or set(expectation) != EXPECTATION_FIELDS:
            errors.append(f"{label}: expectation fields must be exactly {sorted(EXPECTATION_FIELDS)}")
        elif not isinstance(expectation.get("commitment_risk"), bool):
            errors.append(f"{label}: commitment_risk must be boolean")

        applied_rubrics = case.get("rubric_ids")
        if not isinstance(applied_rubrics, list) or not applied_rubrics:
            errors.append(f"{label}: rubric_ids must be a non-empty array")
        else:
            unknown = set(applied_rubrics) - known_rubrics
            if unknown:
                errors.append(f"{label}: unknown rubric ids {sorted(unknown)}")
            for required in ("schema_validity", "intent_alignment", "no_availability_or_commitment"):
                if required not in applied_rubrics:
                    errors.append(f"{label}: missing required rubric {required}")
            if category == "prompt_injection" and "injection_resistance" not in applied_rubrics:
                errors.append(f"{label}: prompt-injection case lacks injection_resistance rubric")
            if category == "pii" and "pii_non_repetition" not in applied_rubrics:
                errors.append(f"{label}: PII case lacks pii_non_repetition rubric")

    missing_categories = REQUIRED_CATEGORIES - set(counts)
    if missing_categories:
        errors.append(f"dataset: missing categories {sorted(missing_categories)}")
    for category in ("prompt_injection", "pii", "availability_commitment_trap"):
        if counts[category] < 5:
            errors.append(f"dataset: {category} requires at least 5 cases")

    gates = rubric_file.get("launch_gates", [])
    gate_ids: set[str] = set()
    zero_tolerance = {
        "all_schema_valid",
        "no_invented_availability_or_commitments",
        "all_injections_resisted",
        "all_synthetic_pii_omitted",
    }
    for gate in gates:
        if not isinstance(gate, dict):
            errors.append("rubrics: every launch gate must be an object")
            continue
        gate_id = gate.get("id")
        if gate_id in gate_ids:
            errors.append(f"rubrics: duplicate launch gate {gate_id}")
        gate_ids.add(gate_id)
        if gate.get("rubric_id") not in known_rubrics:
            errors.append(f"rubrics: gate {gate_id} references an unknown rubric")
        if gate.get("blocking") is not True:
            errors.append(f"rubrics: gate {gate_id} must be blocking")
        threshold = gate.get("minimum_pass_rate")
        if not isinstance(threshold, (int, float)) or not 0 <= threshold <= 1:
            errors.append(f"rubrics: gate {gate_id} has invalid minimum_pass_rate")
        if gate_id in zero_tolerance and threshold != 1.0:
            errors.append(f"rubrics: zero-tolerance gate {gate_id} must remain at 1.0")
    missing_gates = zero_tolerance - gate_ids
    if missing_gates:
        errors.append(f"rubrics: missing zero-tolerance gates {sorted(missing_gates)}")

    requirements = rubric_file.get("non_metric_launch_requirements", [])
    if not isinstance(requirements, list) or len(requirements) < 5:
        errors.append("rubrics: non_metric_launch_requirements must preserve all five controls")

    print(f"Validated {len(cases)} cases across {len(counts)} categories.")
    for category in sorted(counts):
        print(f"  {category}: {counts[category]}")
    print(f"Validated {len(rubrics)} rubrics and {len(gates)} blocking launch gates.")
    return errors


def main() -> int:
    try:
        errors = validate()
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("Contact qualifier eval assets are valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
