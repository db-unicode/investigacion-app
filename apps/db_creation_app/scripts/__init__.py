"""Scripts package for db_creation_app."""

from .schema import get_all_schema_statements, SCHEMA_STATEMENTS
from .loaders import (
    load_enrollments_from_csv,
    load_section_stats_from_csv,
    load_prerequisites_from_json,
    load_all_prerequisites_from_directory,
)
from .clean_main_table import clean_main_table
from .aggregate_section_stats import aggregate_section_stats

__all__ = [
    # Schema
    "get_all_schema_statements",
    "SCHEMA_STATEMENTS",
    # Data loaders
    "load_enrollments_from_csv",
    "load_section_stats_from_csv",
    "load_prerequisites_from_json",
    "load_all_prerequisites_from_directory",
    # Data cleaning
    "clean_main_table",
    "aggregate_section_stats",
]
