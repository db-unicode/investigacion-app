#!/usr/bin/env python3
"""
Data loading functions for enrollments.db.

This module provides functions to load data from CSV and JSON files
into the SQLite database tables.
"""

import csv
import json
import sqlite3
from pathlib import Path
from typing import Dict, List, Optional, Tuple


def load_enrollments_from_csv(
    db_connection: sqlite3.Connection,
    csv_path: Path,
) -> Tuple[int, int, List[str]]:
    """
    Load enrollment data from a CSV file into the enrollments table.

    Args:
        db_connection: Active SQLite database connection.
        csv_path: Path to the enrollments CSV file.

    Returns:
        Tuple of (rows_inserted, rows_skipped, error_messages).
    """
    rows_inserted = 0
    rows_skipped = 0
    errors: List[str] = []

    insert_sql = """
    INSERT OR REPLACE INTO enrollments (
        student_id,
        academic_term,
        course_code,
        section,
        campus_description,
        partial_grade,
        final_grade,
        course_status_description,
        course_outcome
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """

    cursor = db_connection.cursor()

    with csv_path.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)

        for row_num, row in enumerate(reader, start=2):  # start=2 accounts for header
            try:
                # Parse required fields
                student_id = int(row["student_id"].strip())
                academic_term = int(row["academic_term"].strip())
                course_code = row["course_code"].strip()
                section = int(row["section"].strip())
                course_outcome = row["course_outcome"].strip()

                # Validate course_outcome
                if course_outcome not in ("P", "F", "W"):
                    errors.append(
                        f"Row {row_num}: Invalid course_outcome '{course_outcome}'"
                    )
                    rows_skipped += 1
                    continue

                # Parse optional fields (empty strings become None)
                campus_description = row.get("campus_description", "").strip() or None
                partial_grade = row.get("partial_grade", "").strip() or None
                final_grade = row.get("final_grade", "").strip() or None
                course_status_description = (
                    row.get("course_status_description", "").strip() or None
                )

                cursor.execute(
                    insert_sql,
                    (
                        student_id,
                        academic_term,
                        course_code,
                        section,
                        campus_description,
                        partial_grade,
                        final_grade,
                        course_status_description,
                        course_outcome,
                    ),
                )
                rows_inserted += 1

            except (ValueError, KeyError) as e:
                errors.append(f"Row {row_num}: {type(e).__name__} - {e}")
                rows_skipped += 1
                continue

    db_connection.commit()
    return rows_inserted, rows_skipped, errors


def load_section_stats_from_csv(
    db_connection: sqlite3.Connection,
    csv_path: Path,
) -> Tuple[int, int, List[str]]:
    """
    Load section statistics from a CSV file into the section_stats table.

    Args:
        db_connection: Active SQLite database connection.
        csv_path: Path to the section_stats CSV file.

    Returns:
        Tuple of (rows_inserted, rows_skipped, error_messages).
    """
    rows_inserted = 0
    rows_skipped = 0
    errors: List[str] = []

    insert_sql = """
    INSERT OR REPLACE INTO section_stats (
        course_code,
        academic_term,
        section,
        enrolled,
        passed,
        failed,
        withdrawn
    ) VALUES (?, ?, ?, ?, ?, ?, ?);
    """

    cursor = db_connection.cursor()

    with csv_path.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)

        for row_num, row in enumerate(reader, start=2):
            try:
                course_code = row["course_code"].strip()
                academic_term = row["academic_term"].strip()
                section = int(row["section"].strip())
                enrolled = int(row["enrolled"].strip())
                passed = int(row["passed"].strip())
                failed = int(row["failed"].strip())
                withdrawn = int(row["withdrawn"].strip())

                # Validate constraint: enrolled = passed + failed + withdrawn
                if enrolled != passed + failed + withdrawn:
                    errors.append(
                        f"Row {row_num}: enrolled ({enrolled}) != "
                        f"passed ({passed}) + failed ({failed}) + withdrawn ({withdrawn})"
                    )
                    rows_skipped += 1
                    continue

                # Validate non-negative values
                if any(v < 0 for v in [enrolled, passed, failed, withdrawn]):
                    errors.append(f"Row {row_num}: Negative values detected")
                    rows_skipped += 1
                    continue

                cursor.execute(
                    insert_sql,
                    (
                        course_code,
                        academic_term,
                        section,
                        enrolled,
                        passed,
                        failed,
                        withdrawn,
                    ),
                )
                rows_inserted += 1

            except (ValueError, KeyError) as e:
                errors.append(f"Row {row_num}: {type(e).__name__} - {e}")
                rows_skipped += 1
                continue

    db_connection.commit()
    return rows_inserted, rows_skipped, errors


def load_prerequisites_from_json(
    db_connection: sqlite3.Connection,
    json_path: Path,
) -> Tuple[int, int, List[str]]:
    """
    Load course prerequisites from a JSON file into the course_prerequisites table.

    The JSON file should have the format:
    {
        "COURSE-CODE": null | ["PREREQ1", "PREREQ2", ...] | [["OR1", "OR2"], "AND1"],
        ...
    }

    Args:
        db_connection: Active SQLite database connection.
        json_path: Path to the prerequisites JSON file.

    Returns:
        Tuple of (rows_inserted, rows_skipped, error_messages).
    """
    rows_inserted = 0
    rows_skipped = 0
    errors: List[str] = []

    insert_sql = """
    INSERT OR REPLACE INTO course_prerequisites (
        course_code,
        prerequisites_json
    ) VALUES (?, ?);
    """

    cursor = db_connection.cursor()

    try:
        with json_path.open("r", encoding="utf-8") as json_file:
            prerequisites_data = json.load(json_file)
    except json.JSONDecodeError as e:
        errors.append(f"Failed to parse JSON file: {e}")
        return rows_inserted, rows_skipped, errors

    if not isinstance(prerequisites_data, dict):
        errors.append("JSON root must be an object/dictionary")
        return rows_inserted, rows_skipped, errors

    for course_code, prereqs in prerequisites_data.items():
        try:
            course_code_clean = course_code.strip()

            # Convert prerequisites to JSON string
            # null becomes "null", arrays become JSON arrays
            prereqs_json = json.dumps(prereqs, ensure_ascii=False)

            cursor.execute(insert_sql, (course_code_clean, prereqs_json))
            rows_inserted += 1

        except Exception as e:
            errors.append(f"Course {course_code}: {type(e).__name__} - {e}")
            rows_skipped += 1
            continue

    db_connection.commit()
    return rows_inserted, rows_skipped, errors


def load_all_prerequisites_from_directory(
    db_connection: sqlite3.Connection,
    prereqs_dir: Path,
) -> Tuple[int, int, int, List[str]]:
    """
    Load all prerequisite JSON files from a directory.

    Args:
        db_connection: Active SQLite database connection.
        prereqs_dir: Path to the directory containing JSON files.

    Returns:
        Tuple of (files_processed, total_rows_inserted, total_rows_skipped, error_messages).
    """
    files_processed = 0
    total_inserted = 0
    total_skipped = 0
    all_errors: List[str] = []

    if not prereqs_dir.exists():
        all_errors.append(f"Prerequisites directory does not exist: {prereqs_dir}")
        return files_processed, total_inserted, total_skipped, all_errors

    json_files = list(prereqs_dir.glob("*.json"))

    if not json_files:
        all_errors.append(f"No JSON files found in: {prereqs_dir}")
        return files_processed, total_inserted, total_skipped, all_errors

    for json_path in json_files:
        inserted, skipped, errors = load_prerequisites_from_json(
            db_connection, json_path
        )
        files_processed += 1
        total_inserted += inserted
        total_skipped += skipped

        # Prefix errors with filename
        for error in errors:
            all_errors.append(f"[{json_path.name}] {error}")

    return files_processed, total_inserted, total_skipped, all_errors
