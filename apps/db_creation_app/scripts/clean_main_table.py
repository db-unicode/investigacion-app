#!/usr/bin/env python3
"""
Clean main table CSV for SQLite loading.

This script:
  1. Reads a CSV with Spanish headers.
  2. Normalizes course_code from MATERIA to the pattern "XXXX-DDDD".
  3. Extracts and validates section from SECCION.
  4. Computes `course_outcome` according to domain rules:
       - 'W' = Withdrawn (from DESCRIPCION_ESTADO_MATERIA)
       - 'P' = Passed
       - 'F' = Failed
  5. Drops rows where:
       - course_code cannot be normalized to "XXXX-DDDD", or
       - section is empty or missing, or
       - course_outcome cannot be determined.
  6. Deduplicates rows based on (student_id, academic_term, course_code):
       - Prefer 'W' over 'P' over 'F'.
       - For the same outcome, keep the first occurrence.
  7. Writes a cleaned CSV to
       data_cleaning_output/main_table_{timestamp}.csv

Usage:
    python clean_main_table.py input_file.csv
"""

import csv
import re
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

# ---- Configuration constants -------------------------------------------------

PASSING_GRADE_THRESHOLD = 3.0
PASS_SYMBOLS_TRUE = {"A", "TR"}
FAIL_SYMBOLS_FALSE = {"R"}

OUTPUT_DIR_NAME = "data_cleaning_output"
OUTPUT_FILE_PREFIX = "main_table_"
OUTPUT_TIMESTAMP_FORMAT = "%Y%m%d_%H%M%S"
OUTPUT_FILE_EXTENSION = ".csv"

# Spanish input column names (as in the original CSV)
SPANISH_COLUMN_STUDENT_ID = "CODIGO"
SPANISH_COLUMN_ACADEMIC_TERM = "PERIODO"
SPANISH_COLUMN_COURSE_CODE = "MATERIA"
SPANISH_COLUMN_SECTION = "SECCION"
SPANISH_COLUMN_CAMPUS_DESCRIPTION = "DESCRIPCION_CAMPUS"
SPANISH_COLUMN_PARTIAL_GRADE = "CALIFICACION_PARCIAL"
SPANISH_COLUMN_FINAL_GRADE = "CALIFICACION_FINAL"
SPANISH_COLUMN_COURSE_STATUS_DESCRIPTION = "DESCRIPCION_ESTADO_MATERIA"

# English output column names
ENGLISH_COLUMN_STUDENT_ID = "student_id"
ENGLISH_COLUMN_ACADEMIC_TERM = "academic_term"
ENGLISH_COLUMN_COURSE_CODE = "course_code"
ENGLISH_COLUMN_SECTION = "section"
ENGLISH_COLUMN_CAMPUS_DESCRIPTION = "campus_description"
ENGLISH_COLUMN_PARTIAL_GRADE = "partial_grade"
ENGLISH_COLUMN_FINAL_GRADE = "final_grade"
ENGLISH_COLUMN_COURSE_STATUS_DESCRIPTION = "course_status_description"
ENGLISH_COLUMN_COURSE_OUTCOME = "course_outcome"

# Course code pattern: "XXXX-DDDD"
COURSE_CODE_REGEX = re.compile(r"[A-Z]{4}-\d{4}")

# Outcome priority for deduplication: higher wins
COURSE_OUTCOME_PRIORITY: Dict[str, int] = {"F": 1, "P": 2, "W": 3}


# ---- Data structures ---------------------------------------------------------


@dataclass(frozen=True)
class CleanedRow:
    """Representation of a cleaned row ready for CSV output."""

    student_id: str
    academic_term: str
    course_code: str  # normalized "XXXX-DDDD"
    section: str  # required, non-empty
    campus_description: Optional[str]
    partial_grade: Optional[str]
    final_grade: Optional[str]
    course_status_description: Optional[str]
    course_outcome: str  # 'P', 'F', or 'W'

    def to_dict(self) -> Dict[str, str]:
        """Convert the cleaned row to a dict suitable for CSV writing.

        Empty/None values are written as empty fields so SQLite can treat them
        as NULL when importing.
        """

        def none_to_empty(value: Optional[str]) -> str:
            return "" if value is None else value

        return {
            ENGLISH_COLUMN_STUDENT_ID: self.student_id,
            ENGLISH_COLUMN_ACADEMIC_TERM: self.academic_term,
            ENGLISH_COLUMN_COURSE_CODE: self.course_code,
            ENGLISH_COLUMN_SECTION: self.section,
            ENGLISH_COLUMN_CAMPUS_DESCRIPTION: none_to_empty(
                self.campus_description
            ),
            ENGLISH_COLUMN_PARTIAL_GRADE: none_to_empty(self.partial_grade),
            ENGLISH_COLUMN_FINAL_GRADE: none_to_empty(self.final_grade),
            ENGLISH_COLUMN_COURSE_STATUS_DESCRIPTION: none_to_empty(
                self.course_status_description
            ),
            ENGLISH_COLUMN_COURSE_OUTCOME: self.course_outcome,
        }


# ---- Grade parsing and business logic ----------------------------------------


def parse_float_grade(raw_value: str) -> Optional[float]:
    """Parse a grade value into a float, handling comma and dot separators.

    Args:
        raw_value: Raw grade string from CSV.

    Returns:
        float if the value can be parsed as a number, otherwise None.
    """
    cleaned_value = raw_value.strip()
    if not cleaned_value:
        return None

    normalized_value = cleaned_value.replace(",", ".")

    try:
        return float(normalized_value)
    except ValueError:
        return None


def compute_course_outcome(
    final_grade_raw: str,
    partial_grade_raw: str,
    course_status_description_raw: str,
) -> Optional[str]:
    """Compute course outcome based on status and grades.

    Logic:
      0. If DESCRIPCION_ESTADO_MATERIA contains "RETIRADO" (case-insensitive):
           -> 'W' (Withdrawn).
      1. Else, if final grade is a parseable float:
           - 'P' if >= PASSING_GRADE_THRESHOLD, else 'F'.
      2. Else, if final grade is a symbolic grade:
           - "A" or "TR" => 'P'
           - "R" => 'F'
      3. Else, apply the same logic using partial grade.
      4. If no numeric or symbolic match is found, return None
         (row must be ignored).

    Args:
        final_grade_raw: Raw final grade value from CSV.
        partial_grade_raw: Raw partial grade value from CSV.
        course_status_description_raw: Raw course status description.

    Returns:
        'P', 'F', or 'W' when a decision can be made.
        None if the row should be ignored because outcome is unknown.
    """
    status_clean = course_status_description_raw.strip().upper()

    # 0. Withdrawn check based on description
    if "RETIRADO" in status_clean:
        return "W"

    final_grade_clean = final_grade_raw.strip()
    partial_grade_clean = partial_grade_raw.strip()

    # 1. Numeric final grade
    final_grade_number = parse_float_grade(final_grade_clean)
    if final_grade_number is not None:
        return "P" if final_grade_number >= PASSING_GRADE_THRESHOLD else "F"

    # 2. Symbolic final grade
    final_symbol = final_grade_clean.upper()
    if final_symbol in PASS_SYMBOLS_TRUE:
        return "P"
    if final_symbol in FAIL_SYMBOLS_FALSE:
        return "F"

    # 3. Numeric partial grade
    partial_grade_number = parse_float_grade(partial_grade_clean)
    if partial_grade_number is not None:
        return (
            "P"
            if partial_grade_number >= PASSING_GRADE_THRESHOLD
            else "F"
        )

    # 4. Symbolic partial grade
    partial_symbol = partial_grade_clean.upper()
    if partial_symbol in PASS_SYMBOLS_TRUE:
        return "P"
    if partial_symbol in FAIL_SYMBOLS_FALSE:
        return "F"

    # 5. No usable info
    return None


# ---- Course code normalization -----------------------------------------------


def normalize_course_code(raw_value: str) -> Optional[str]:
    """Extract and normalize the course code from MATERIA.

    Rules:
      - MATERIA must contain as substring a pattern "XXXX-DDDD" where
        X is an uppercase letter and D is a digit.
      - If such a substring exists, use exactly that substring as course_code.
      - If no such substring is found, return None and discard the row.

    Examples:
      "MATE-1010"            -> "MATE-1010"
      "MATE-1010-Homologada" -> "MATE-1010"
      "XYZ MATE-1010 XYZ"    -> "MATE-1010"

    Args:
        raw_value: Raw MATERIA value.

    Returns:
        Normalized course code "XXXX-DDDD", or None if not found.
    """
    cleaned = raw_value.strip()
    if not cleaned:
        return None

    upper_value = cleaned.upper()
    match = COURSE_CODE_REGEX.search(upper_value)
    if not match:
        return None

    return match.group(0)


# ---- Section validation ------------------------------------------------------


def normalize_section(raw_value: str) -> Optional[str]:
    """Normalize and validate the section field.

    Rules:
      - Section must be non-empty after stripping whitespace.
      - If empty, return None (row will be discarded).

    Args:
        raw_value: Raw SECCION value.

    Returns:
        Stripped section string, or None if empty.
    """
    cleaned = raw_value.strip()
    if not cleaned:
        return None
    return cleaned


# ---- Row transformation ------------------------------------------------------


def normalize_optional_field(raw_value: str) -> Optional[str]:
    """Normalize a string field to None if it is empty after stripping."""
    stripped = raw_value.strip()
    return stripped if stripped else None


def transform_row(raw_row: Dict[str, str]) -> Optional[CleanedRow]:
    """Transform a raw CSV row into a cleaned row.

    Rules:
      - Normalize course_code from MATERIA to pattern "XXXX-DDDD".
      - Drop row if normalized course_code is None.
      - Validate section is non-empty.
      - Drop row if section is None.
      - Compute course_outcome.
      - Drop row if course_outcome is None.
    """
    student_id = raw_row.get(SPANISH_COLUMN_STUDENT_ID, "").strip()
    academic_term = raw_row.get(SPANISH_COLUMN_ACADEMIC_TERM, "").strip()

    # Normalize and validate course code
    course_code_raw = raw_row.get(SPANISH_COLUMN_COURSE_CODE, "")
    course_code = normalize_course_code(course_code_raw)
    if course_code is None:
        return None

    # Normalize and validate section
    section_raw = raw_row.get(SPANISH_COLUMN_SECTION, "")
    section = normalize_section(section_raw)
    if section is None:
        return None

    campus_description = normalize_optional_field(
        raw_row.get(SPANISH_COLUMN_CAMPUS_DESCRIPTION, "")
    )
    partial_grade_raw = raw_row.get(SPANISH_COLUMN_PARTIAL_GRADE, "")
    final_grade_raw = raw_row.get(SPANISH_COLUMN_FINAL_GRADE, "")
    course_status_description_raw = raw_row.get(
        SPANISH_COLUMN_COURSE_STATUS_DESCRIPTION, ""
    )
    course_status_description = normalize_optional_field(
        course_status_description_raw
    )

    course_outcome = compute_course_outcome(
        final_grade_raw=final_grade_raw,
        partial_grade_raw=partial_grade_raw,
        course_status_description_raw=course_status_description_raw,
    )
    if course_outcome is None:
        return None

    partial_grade_clean = normalize_optional_field(partial_grade_raw)
    final_grade_clean = normalize_optional_field(final_grade_raw)

    return CleanedRow(
        student_id=student_id,
        academic_term=academic_term,
        course_code=course_code,
        section=section,
        campus_description=campus_description,
        partial_grade=partial_grade_clean,
        final_grade=final_grade_clean,
        course_status_description=course_status_description,
        course_outcome=course_outcome,
    )


# ---- Deduplication -----------------------------------------------------------


def deduplicate_enrollments(
    rows: Iterable[CleanedRow],
) -> List[CleanedRow]:
    """Deduplicate rows by (student_id, academic_term, course_code).

    For each key, keep a single row based on course_outcome priority:

      - Prefer 'W' over 'P' over 'F'.
      - For the same outcome, keep the first occurrence in the input order.

    Note: Section is NOT part of the deduplication key. It is preserved
    as an attribute of the winning row.

    Args:
        rows: Iterable of cleaned rows to deduplicate.

    Returns:
        List of rows with at most one entry per
        (student_id, academic_term, course_code).
    """
    selected: Dict[Tuple[str, str, str], CleanedRow] = {}

    for row in rows:
        key = (row.student_id, row.academic_term, row.course_code)
        existing = selected.get(key)

        if existing is None:
            selected[key] = row
            continue

        existing_priority = COURSE_OUTCOME_PRIORITY[existing.course_outcome]
        current_priority = COURSE_OUTCOME_PRIORITY[row.course_outcome]

        # Only replace if the new row has strictly higher priority.
        if current_priority > existing_priority:
            selected[key] = row

    # Dict preserves insertion order of first occurrence of each key.
    return list(selected.values())


# ---- I/O helpers -------------------------------------------------------------


def read_input_rows(input_path: Path) -> Iterable[Dict[str, str]]:
    """Read rows from the input CSV using csv.DictReader."""
    with input_path.open("r", encoding="utf-8", newline="") as input_file:
        sample = input_file.read(4096)
        input_file.seek(0)

        try:
            dialect = csv.Sniffer().sniff(sample)
        except csv.Error:
            dialect = csv.excel

        reader = csv.DictReader(input_file, dialect=dialect)
        for row in reader:
            yield row


def write_output_rows(
    cleaned_rows: Iterable[CleanedRow],
    output_path: Path,
) -> None:
    """Write cleaned rows to the output CSV."""
    fieldnames: List[str] = [
        ENGLISH_COLUMN_STUDENT_ID,
        ENGLISH_COLUMN_ACADEMIC_TERM,
        ENGLISH_COLUMN_COURSE_CODE,
        ENGLISH_COLUMN_SECTION,
        ENGLISH_COLUMN_CAMPUS_DESCRIPTION,
        ENGLISH_COLUMN_PARTIAL_GRADE,
        ENGLISH_COLUMN_FINAL_GRADE,
        ENGLISH_COLUMN_COURSE_STATUS_DESCRIPTION,
        ENGLISH_COLUMN_COURSE_OUTCOME,
    ]

    with output_path.open("w", encoding="utf-8", newline="") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=fieldnames)
        writer.writeheader()

        for cleaned_row in cleaned_rows:
            writer.writerow(cleaned_row.to_dict())


def build_output_path(base_directory: Path) -> Path:
    """Build the output CSV path with a timestamped file name."""
    timestamp = datetime.now().strftime(OUTPUT_TIMESTAMP_FORMAT)
    file_name = f"{OUTPUT_FILE_PREFIX}{timestamp}{OUTPUT_FILE_EXTENSION}"
    return base_directory / file_name


# ---- Orchestration -----------------------------------------------------------


def clean_main_table(
    input_path: Path,
    output_dir: Optional[Path] = None,
) -> Tuple[Path, int, int, int]:
    """Clean the main table CSV and return stats.

    Args:
        input_path: Path to the raw input CSV file.
        output_dir: Optional output directory. Defaults to OUTPUT_DIR_NAME.

    Returns:
        (output_path, total_raw_rows, total_cleaned_before_dedup,
         total_cleaned_after_dedup)
    """
    if output_dir is None:
        output_dir = Path(OUTPUT_DIR_NAME)
    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = build_output_path(output_dir)

    raw_rows = list(read_input_rows(input_path))
    total_raw = len(raw_rows)

    transformed_rows = [transform_row(row) for row in raw_rows]
    cleaned_rows_list: List[CleanedRow] = [
        row for row in transformed_rows if row is not None
    ]
    total_cleaned_before_dedup = len(cleaned_rows_list)

    deduplicated_rows = deduplicate_enrollments(cleaned_rows_list)
    total_cleaned_after_dedup = len(deduplicated_rows)

    write_output_rows(deduplicated_rows, output_path)

    return output_path, total_raw, total_cleaned_before_dedup, total_cleaned_after_dedup


def main(argv: List[str]) -> None:
    """Command-line entry point.

    Usage:
        python clean_main_table.py <input_csv_path>
    """
    if len(argv) != 2:
        raise ValueError(
            "Usage: python clean_main_table.py <input_csv_path>"
        )

    input_csv_path = Path(argv[1]).expanduser().resolve()
    if not input_csv_path.is_file():
        raise FileNotFoundError(
            f"Input file does not exist: {input_csv_path}"
        )

    (
        output_path,
        total_raw,
        total_cleaned_before_dedup,
        total_cleaned_after_dedup,
    ) = clean_main_table(input_csv_path)

    print(f"Raw rows:                       {total_raw}")
    print(f"Cleaned rows before dedup:      {total_cleaned_before_dedup}")
    print(f"Cleaned rows after dedup:       {total_cleaned_after_dedup}")
    print(f"Cleaned CSV written to:         {output_path}")


if __name__ == "__main__":
    main(sys.argv)
