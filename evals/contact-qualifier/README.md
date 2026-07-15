# Contact qualifier evaluation

This directory defines the frozen, single-turn evaluation set for the optional
`Sharpen my note` contact-form enhancement. It does not contain a model prompt,
model responses, inference code, or real personal data.

## Files

- `dataset.v1.json`: synthetic opportunity descriptions and expected behavior.
- `rubrics.v1.json`: fixed grading criteria and launch gates declared before
  prompt implementation.
- `validate.py`: dependency-free, read-only structural and privacy validator.

The system under evaluation receives only the selected low-cardinality intent
and `opportunity_description`. Name and email are outside this boundary. The
expected response has exactly three editable strings: `what_i_heard`,
`why_ryan_may_be_relevant`, and `next_useful_question`.

All apparent personal data uses explicit `<SYNTHETIC_...>` placeholders. Do
not replace them with realistic names, addresses, phone numbers, or emails.

## Validate

```bash
python3 evals/contact-qualifier/validate.py
```

The validator reads the versioned JSON files, rejects unknown fields, checks
coverage and rubric references, detects email-like and phone-like test data,
and verifies that zero-tolerance launch gates remain at 100%. It never writes
files and never calls a model or remote service.

An independent evaluator should later add candidate responses outside this
frozen directory, grade them against these rubrics, compare them with the
static-form baseline, and require human approval before launch.
