#!/usr/bin/env python3
"""
Database schema definitions for enrollments.db.

This module contains the SQL schema definitions for creating the database tables:
- enrollments: Student enrollment records with course outcomes
- section_stats: Aggregated statistics per course section
- course_prerequisites: Course prerequisite relationships as JSON

Index Strategy:
- Primary keys automatically create indexes
- Additional indexes support common query patterns:
  - Querying enrollments by course and term
  - Querying enrollments by student
  - Querying section stats by term
"""

# SQL statements for creating tables

CREATE_ENROLLMENTS_TABLE = """
CREATE TABLE IF NOT EXISTS enrollments (
    student_id INTEGER NOT NULL,
    academic_term INTEGER NOT NULL,
    course_code TEXT NOT NULL,
    section INTEGER NOT NULL,
    campus_description TEXT,
    partial_grade TEXT,
    final_grade TEXT,
    course_status_description TEXT,
    course_outcome TEXT NOT NULL CHECK (course_outcome IN ('P', 'F', 'W')),
    PRIMARY KEY (student_id, academic_term, course_code)
) WITHOUT ROWID;
"""

# Index for queries filtering by course_code, academic_term, and course_outcome
# Supports: pass/fail rates per course per term
CREATE_ENROLLMENTS_INDEX_COURSE_TERM_OUTCOME = """
CREATE INDEX IF NOT EXISTS idx_enrollments_course_term_outcome
ON enrollments (course_code, academic_term, course_outcome);
"""

# Index for queries filtering by student_id
# Supports: student enrollment history lookups
CREATE_ENROLLMENTS_INDEX_STUDENT = """
CREATE INDEX IF NOT EXISTS idx_enrollments_student
ON enrollments (student_id);
"""

# Index for queries filtering by course_code only
# Supports: all enrollments for a specific course
CREATE_ENROLLMENTS_INDEX_COURSE = """
CREATE INDEX IF NOT EXISTS idx_enrollments_course
ON enrollments (course_code);
"""

# Index for queries filtering by academic_term
# Supports: all enrollments in a specific term
CREATE_ENROLLMENTS_INDEX_TERM = """
CREATE INDEX IF NOT EXISTS idx_enrollments_term
ON enrollments (academic_term);
"""

CREATE_SECTION_STATS_TABLE = """
CREATE TABLE IF NOT EXISTS section_stats (
    course_code TEXT NOT NULL,
    academic_term TEXT NOT NULL,
    section INTEGER NOT NULL,
    enrolled INTEGER NOT NULL CHECK (enrolled >= 0),
    passed INTEGER NOT NULL CHECK (passed >= 0),
    failed INTEGER NOT NULL CHECK (failed >= 0),
    withdrawn INTEGER NOT NULL CHECK (withdrawn >= 0),
    PRIMARY KEY (course_code, academic_term, section),
    CHECK (enrolled = passed + failed + withdrawn)
);
"""

# Index for queries filtering by academic_term
# Supports: all section stats for a specific term
CREATE_SECTION_STATS_INDEX_TERM = """
CREATE INDEX IF NOT EXISTS idx_section_stats_term
ON section_stats (academic_term);
"""

# Index for queries filtering by course_code only
# Supports: historical stats for a specific course
CREATE_SECTION_STATS_INDEX_COURSE = """
CREATE INDEX IF NOT EXISTS idx_section_stats_course
ON section_stats (course_code);
"""

CREATE_COURSE_PREREQUISITES_TABLE = """
CREATE TABLE IF NOT EXISTS course_prerequisites (
    course_code TEXT PRIMARY KEY NOT NULL,
    prerequisites_json TEXT NOT NULL
);
"""
# Note: PRIMARY KEY on course_code already creates an index, no additional index needed

# List of all schema statements in order
SCHEMA_STATEMENTS = [
    # Tables
    ("enrollments table", CREATE_ENROLLMENTS_TABLE),
    ("section_stats table", CREATE_SECTION_STATS_TABLE),
    ("course_prerequisites table", CREATE_COURSE_PREREQUISITES_TABLE),
    # Indexes for enrollments
    ("enrollments index (course_term_outcome)", CREATE_ENROLLMENTS_INDEX_COURSE_TERM_OUTCOME),
    ("enrollments index (student)", CREATE_ENROLLMENTS_INDEX_STUDENT),
    ("enrollments index (course)", CREATE_ENROLLMENTS_INDEX_COURSE),
    ("enrollments index (term)", CREATE_ENROLLMENTS_INDEX_TERM),
    # Indexes for section_stats
    ("section_stats index (term)", CREATE_SECTION_STATS_INDEX_TERM),
    ("section_stats index (course)", CREATE_SECTION_STATS_INDEX_COURSE),
]


def get_all_schema_statements():
    """Return all schema statements as a list of (name, sql) tuples."""
    return SCHEMA_STATEMENTS.copy()
