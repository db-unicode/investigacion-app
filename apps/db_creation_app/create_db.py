#!/usr/bin/env python3
"""
Main orchestration script for creating the enrollments database.

This script performs the complete ETL pipeline:
  1. Cleans raw enrollment data (Spanish CSV -> English CSV)
  2. Aggregates section statistics from cleaned data
  3. Creates the SQLite database with the required schema
  4. Loads cleaned enrollment data into the database
  5. Loads section statistics into the database
  6. Loads course prerequisites from JSON files

Usage:
    python create_db.py [--raw-data PATH] [--force]

Input files (in input/ directory):
    - input/raw/*.csv          Raw enrollment data (Spanish headers)
    - input/prerequisites/*.json   Course prerequisite files

Intermediate files (in cleaned/ directory):
    - cleaned/main_table_*.csv     Cleaned enrollment data
    - cleaned/section_stats_*.csv  Aggregated section statistics

Output files (in output/ directory):
    - output/enrollments.db    SQLite database
"""

import argparse
import logging
import os
import sqlite3
import stat
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional

# Add scripts directory to path for imports
SCRIPT_DIR = Path(__file__).parent.resolve()
sys.path.insert(0, str(SCRIPT_DIR))

from scripts.schema import get_all_schema_statements
from scripts.loaders import (
    load_enrollments_from_csv,
    load_section_stats_from_csv,
    load_all_prerequisites_from_directory,
)
from scripts.clean_main_table import clean_main_table
from scripts.aggregate_section_stats import aggregate_section_stats


# ---- Configuration -----------------------------------------------------------

DEFAULT_INPUT_RAW_DIR = SCRIPT_DIR / "input" / "raw"
DEFAULT_PREREQUISITES_DIR = SCRIPT_DIR / "input" / "prerequisites"
DEFAULT_CLEANED_DIR = SCRIPT_DIR / "cleaned"
DEFAULT_OUTPUT_DIR = SCRIPT_DIR / "output"
DEFAULT_LOGS_DIR = SCRIPT_DIR / "logs"

DEFAULT_DATABASE_NAME = "enrollments.db"


# ---- Logging Setup -----------------------------------------------------------


def setup_logging(logs_dir: Path) -> logging.Logger:
    """
    Configure logging to both console and file.

    Args:
        logs_dir: Directory where log files will be created.

    Returns:
        Configured logger instance.
    """
    logs_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = logs_dir / f"db_creation_{timestamp}.log"

    logger = logging.getLogger("db_creation")
    logger.setLevel(logging.DEBUG)

    # Clear any existing handlers
    logger.handlers.clear()

    # File handler - detailed logging
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_format = logging.Formatter(
        "%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler.setFormatter(file_format)

    # Console handler - info and above
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_format = logging.Formatter("%(levelname)s: %(message)s")
    console_handler.setFormatter(console_format)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    logger.info(f"Log file: {log_file}")

    return logger


# ---- Data Cleaning -----------------------------------------------------------


def find_raw_data_file(raw_dir: Path, logger: logging.Logger) -> Optional[Path]:
    """
    Find the raw data CSV file in the input/raw directory.

    Args:
        raw_dir: Directory containing raw CSV files.
        logger: Logger instance.

    Returns:
        Path to the raw CSV file, or None if not found.
    """
    if not raw_dir.exists():
        logger.error(f"Raw data directory does not exist: {raw_dir}")
        return None

    csv_files = list(raw_dir.glob("*.csv"))

    if not csv_files:
        logger.error(f"No CSV files found in: {raw_dir}")
        return None

    if len(csv_files) > 1:
        logger.warning(f"Multiple CSV files found, using first: {csv_files[0].name}")

    return csv_files[0]


def run_data_cleaning(
    raw_csv: Path,
    cleaned_dir: Path,
    logger: logging.Logger,
) -> tuple[Optional[Path], Optional[Path]]:
    """
    Run the data cleaning pipeline.

    Args:
        raw_csv: Path to raw enrollment CSV.
        cleaned_dir: Directory for cleaned output files.
        logger: Logger instance.

    Returns:
        Tuple of (enrollments_csv_path, section_stats_csv_path) or (None, None) on error.
    """
    logger.info("=" * 60)
    logger.info("STEP 1: Cleaning raw data")
    logger.info("=" * 60)

    cleaned_dir.mkdir(parents=True, exist_ok=True)

    # Step 1: Clean main table
    logger.info(f"Cleaning raw data from: {raw_csv}")
    try:
        (
            enrollments_path,
            total_raw,
            total_before_dedup,
            total_after_dedup,
        ) = clean_main_table(raw_csv, cleaned_dir)

        logger.info(f"  Raw rows:              {total_raw:,}")
        logger.info(f"  After cleaning:        {total_before_dedup:,}")
        logger.info(f"  After deduplication:   {total_after_dedup:,}")
        logger.info(f"  Dropped rows:          {total_raw - total_after_dedup:,}")
        logger.info(f"  Output: {enrollments_path}")

    except Exception as e:
        logger.exception(f"Failed to clean main table: {e}")
        return None, None

    # Step 2: Aggregate section statistics
    logger.info("")
    logger.info("Aggregating section statistics...")
    try:
        (
            section_stats_path,
            total_input,
            total_sections,
        ) = aggregate_section_stats(enrollments_path, cleaned_dir)

        logger.info(f"  Input rows:            {total_input:,}")
        logger.info(f"  Unique sections:       {total_sections:,}")
        logger.info(f"  Output: {section_stats_path}")

    except Exception as e:
        logger.exception(f"Failed to aggregate section stats: {e}")
        return enrollments_path, None

    return enrollments_path, section_stats_path


# ---- Database Creation -------------------------------------------------------


def create_database(db_path: Path, logger: logging.Logger) -> sqlite3.Connection:
    """
    Create the SQLite database and initialize the schema.

    Args:
        db_path: Path where the database will be created.
        logger: Logger instance for output.

    Returns:
        Active database connection.

    Raises:
        sqlite3.Error: If database creation fails.
    """
    logger.info("")
    logger.info("=" * 60)
    logger.info("STEP 2: Creating database")
    logger.info("=" * 60)
    logger.info(f"Database path: {db_path}")

    # Ensure output directory exists
    db_path.parent.mkdir(parents=True, exist_ok=True)

    # Remove existing database if it exists
    if db_path.exists():
        logger.warning(f"Removing existing database: {db_path}")
        # Make writable first if read-only
        try:
            current_mode = os.stat(db_path).st_mode
            os.chmod(db_path, current_mode | stat.S_IWUSR)
        except OSError:
            pass
        db_path.unlink()

    connection = sqlite3.connect(db_path)
    connection.execute("PRAGMA foreign_keys = ON;")
    connection.execute("PRAGMA journal_mode = WAL;")

    cursor = connection.cursor()

    # Create all tables and indexes
    for name, sql in get_all_schema_statements():
        logger.debug(f"Executing schema: {name}")
        try:
            cursor.execute(sql)
        except sqlite3.Error as e:
            logger.error(f"Failed to create {name}: {e}")
            raise

    connection.commit()
    logger.info("Database schema created successfully")

    return connection


# ---- Data Loading ------------------------------------------------------------


def load_all_data(
    connection: sqlite3.Connection,
    enrollments_csv: Optional[Path],
    section_stats_csv: Optional[Path],
    prerequisites_dir: Optional[Path],
    logger: logging.Logger,
) -> bool:
    """
    Load all data into the database.

    Args:
        connection: Active database connection.
        enrollments_csv: Path to cleaned enrollments CSV.
        section_stats_csv: Path to section stats CSV.
        prerequisites_dir: Path to prerequisites JSON directory.
        logger: Logger instance.

    Returns:
        True if all data loaded successfully, False if any errors occurred.
    """
    logger.info("")
    logger.info("=" * 60)
    logger.info("STEP 3: Loading data into database")
    logger.info("=" * 60)

    success = True
    total_errors: List[str] = []

    # Load enrollments
    if enrollments_csv and enrollments_csv.exists():
        logger.info(f"Loading enrollments from: {enrollments_csv.name}")
        inserted, skipped, errors = load_enrollments_from_csv(
            connection, enrollments_csv
        )
        logger.info(f"  Inserted: {inserted:,}, Skipped: {skipped:,}")

        if errors:
            success = False
            for error in errors[:10]:
                logger.error(f"  {error}")
            if len(errors) > 10:
                logger.error(f"  ... and {len(errors) - 10} more errors")
            total_errors.extend(errors)
    elif enrollments_csv:
        logger.error(f"Enrollments CSV not found: {enrollments_csv}")
        success = False

    # Load section stats
    if section_stats_csv and section_stats_csv.exists():
        logger.info(f"Loading section stats from: {section_stats_csv.name}")
        inserted, skipped, errors = load_section_stats_from_csv(
            connection, section_stats_csv
        )
        logger.info(f"  Inserted: {inserted:,}, Skipped: {skipped:,}")

        if errors:
            success = False
            for error in errors[:10]:
                logger.error(f"  {error}")
            if len(errors) > 10:
                logger.error(f"  ... and {len(errors) - 10} more errors")
            total_errors.extend(errors)
    elif section_stats_csv:
        logger.error(f"Section stats CSV not found: {section_stats_csv}")
        success = False

    # Load prerequisites
    if prerequisites_dir and prerequisites_dir.exists():
        logger.info(f"Loading prerequisites from: {prerequisites_dir}")
        files, inserted, skipped, errors = load_all_prerequisites_from_directory(
            connection, prerequisites_dir
        )
        logger.info(f"  Files: {files}, Courses: {inserted:,}, Skipped: {skipped:,}")

        if errors:
            success = False
            for error in errors[:10]:
                logger.error(f"  {error}")
            if len(errors) > 10:
                logger.error(f"  ... and {len(errors) - 10} more errors")
            total_errors.extend(errors)
    elif prerequisites_dir:
        logger.warning(f"Prerequisites directory not found: {prerequisites_dir}")

    return success


# ---- Validation --------------------------------------------------------------


def validate_database(connection: sqlite3.Connection, logger: logging.Logger) -> None:
    """
    Validate the database by running integrity check and counting records.

    Args:
        connection: Active database connection.
        logger: Logger instance.
    """
    logger.info("")
    logger.info("=" * 60)
    logger.info("STEP 4: Validating database")
    logger.info("=" * 60)

    cursor = connection.cursor()

    # Integrity check
    cursor.execute("PRAGMA integrity_check;")
    result = cursor.fetchone()[0]
    if result == "ok":
        logger.info("Integrity check: PASSED")
    else:
        logger.error(f"Integrity check: FAILED - {result}")

    # Count records
    tables = ["enrollments", "section_stats", "course_prerequisites"]
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table};")
        count = cursor.fetchone()[0]
        logger.info(f"Table '{table}': {count:,} records")

    # List indexes
    logger.info("")
    logger.info("Indexes created:")
    cursor.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index' ORDER BY tbl_name, name;")
    for row in cursor.fetchall():
        index_name, table_name = row
        logger.info(f"  {table_name}: {index_name}")


# ---- Database Finalization ---------------------------------------------------


def finalize_database(
    connection: sqlite3.Connection,
    db_path: Path,
    logger: logging.Logger,
) -> None:
    """
    Finalize the database for read-only use.

    This function:
    1. Runs ANALYZE to update query planner statistics
    2. Runs VACUUM to optimize storage and defragment
    3. Switches from WAL to DELETE journal mode for single-file distribution
    4. Closes the connection
    5. Sets file permissions to read-only

    Args:
        connection: Active database connection.
        db_path: Path to the database file.
        logger: Logger instance.
    """
    logger.info("")
    logger.info("=" * 60)
    logger.info("STEP 5: Finalizing database (read-only mode)")
    logger.info("=" * 60)

    cursor = connection.cursor()

    # Run ANALYZE to update statistics for query optimizer
    logger.info("Running ANALYZE to optimize query planning...")
    cursor.execute("ANALYZE;")
    connection.commit()
    logger.info("  ANALYZE completed")

    # Switch from WAL to DELETE mode for single-file distribution
    # WAL mode creates additional -wal and -shm files
    logger.info("Switching to DELETE journal mode...")
    cursor.execute("PRAGMA journal_mode = DELETE;")
    result = cursor.fetchone()[0]
    logger.info(f"  Journal mode: {result}")

    # Run VACUUM to defragment and optimize storage
    logger.info("Running VACUUM to optimize storage...")
    cursor.execute("VACUUM;")
    connection.commit()
    logger.info("  VACUUM completed")

    # Close the connection before changing file permissions
    connection.close()
    logger.info("Database connection closed")

    # Remove any leftover WAL files
    wal_file = Path(str(db_path) + "-wal")
    shm_file = Path(str(db_path) + "-shm")
    for temp_file in [wal_file, shm_file]:
        if temp_file.exists():
            temp_file.unlink()
            logger.debug(f"Removed temporary file: {temp_file}")

    # Set file permissions to read-only (444)
    logger.info("Setting file permissions to read-only...")
    try:
        # Remove write permissions for owner, group, and others
        current_mode = os.stat(db_path).st_mode
        read_only_mode = current_mode & ~(stat.S_IWUSR | stat.S_IWGRP | stat.S_IWOTH)
        os.chmod(db_path, read_only_mode)
        logger.info(f"  File permissions set to: {oct(read_only_mode)[-3:]}")
    except OSError as e:
        logger.warning(f"  Could not set read-only permissions: {e}")

    # Verify the database can be opened in read-only mode
    logger.info("Verifying read-only access...")
    try:
        test_conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        test_cursor = test_conn.cursor()
        test_cursor.execute("SELECT COUNT(*) FROM enrollments;")
        count = test_cursor.fetchone()[0]
        test_conn.close()
        logger.info(f"  Read-only verification: PASSED ({count:,} enrollments)")
    except sqlite3.Error as e:
        logger.error(f"  Read-only verification: FAILED - {e}")


# ---- CLI Interface -----------------------------------------------------------


def parse_arguments() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Create the enrollments SQLite database from raw data.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python create_db.py
        Use default paths for all input files.

    python create_db.py --raw-data /path/to/data.csv
        Specify a custom path for the raw data CSV.

    python create_db.py --force
        Overwrite existing database without prompting.

Input directory structure:
    input/
    ├── raw/
    │   └── *.csv              # Raw enrollment data (Spanish headers)
    └── prerequisites/
        └── *.json             # Course prerequisite files

Output:
    cleaned/
    ├── main_table_*.csv       # Cleaned enrollment data
    └── section_stats_*.csv    # Section statistics

    output/
    └── enrollments.db         # SQLite database
        """,
    )

    parser.add_argument(
        "--raw-data",
        type=Path,
        default=None,
        help="Path to raw enrollment CSV. If not specified, uses first CSV in input/raw/",
    )

    parser.add_argument(
        "--prerequisites-dir",
        type=Path,
        default=DEFAULT_PREREQUISITES_DIR,
        help=f"Path to prerequisites JSON directory (default: {DEFAULT_PREREQUISITES_DIR})",
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_DIR / DEFAULT_DATABASE_NAME,
        help=f"Path for output database (default: {DEFAULT_OUTPUT_DIR / DEFAULT_DATABASE_NAME})",
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing database without prompting",
    )

    parser.add_argument(
        "--skip-cleaning",
        action="store_true",
        help="Skip cleaning step and use existing cleaned files in cleaned/ directory",
    )

    return parser.parse_args()


# ---- Main Entry Point --------------------------------------------------------


def main() -> int:
    """
    Main entry point for the database creation script.

    Returns:
        Exit code: 0 for success, 1 for errors.
    """
    args = parse_arguments()

    # Setup logging
    logger = setup_logging(DEFAULT_LOGS_DIR)

    logger.info("=" * 60)
    logger.info("ENROLLMENTS DATABASE CREATION PIPELINE")
    logger.info("=" * 60)

    # Check for existing database
    if args.output.exists() and not args.force:
        logger.warning(f"Database already exists: {args.output}")
        response = input("Overwrite? [y/N]: ").strip().lower()
        if response != "y":
            logger.info("Aborted by user")
            return 1

    enrollments_csv: Optional[Path] = None
    section_stats_csv: Optional[Path] = None

    try:
        if args.skip_cleaning:
            # Find existing cleaned files
            logger.info("Skipping cleaning step, looking for existing cleaned files...")
            cleaned_enrollments = list(DEFAULT_CLEANED_DIR.glob("main_table_*.csv"))
            cleaned_stats = list(DEFAULT_CLEANED_DIR.glob("section_stats_*.csv"))

            if cleaned_enrollments:
                enrollments_csv = sorted(cleaned_enrollments)[-1]  # Use most recent
                logger.info(f"Using existing enrollments: {enrollments_csv.name}")
            else:
                logger.error("No cleaned enrollment files found")
                return 1

            if cleaned_stats:
                section_stats_csv = sorted(cleaned_stats)[-1]  # Use most recent
                logger.info(f"Using existing section stats: {section_stats_csv.name}")
            else:
                logger.error("No cleaned section stats files found")
                return 1
        else:
            # Find raw data file
            if args.raw_data:
                raw_csv = args.raw_data
                if not raw_csv.exists():
                    logger.error(f"Raw data file not found: {raw_csv}")
                    return 1
            else:
                raw_csv = find_raw_data_file(DEFAULT_INPUT_RAW_DIR, logger)
                if raw_csv is None:
                    return 1

            # Run data cleaning
            enrollments_csv, section_stats_csv = run_data_cleaning(
                raw_csv, DEFAULT_CLEANED_DIR, logger
            )

            if enrollments_csv is None:
                logger.error("Data cleaning failed")
                return 1

        # Create database and schema
        connection = create_database(args.output, logger)

        # Load all data
        success = load_all_data(
            connection=connection,
            enrollments_csv=enrollments_csv,
            section_stats_csv=section_stats_csv,
            prerequisites_dir=args.prerequisites_dir,
            logger=logger,
        )

        # Validate database
        validate_database(connection, logger)

        # Finalize database (ANALYZE, VACUUM, set read-only)
        finalize_database(connection, args.output, logger)

        logger.info("")
        logger.info("=" * 60)
        if success:
            logger.info("SUCCESS: Database created successfully (READ-ONLY)")
            logger.info(f"Output: {args.output}")
            logger.info("Note: Database is read-only. To modify, change file permissions first.")
        else:
            logger.warning("COMPLETED WITH ERRORS: Check log file for details")
            logger.warning(f"Output: {args.output}")
        logger.info("=" * 60)

        return 0 if success else 1

    except Exception as e:
        logger.exception(f"Fatal error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
