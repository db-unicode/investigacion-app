# Course Enrollment Analysis System

A university course enrollment analysis system that provides historical behavior insights and enrollment forecasting capabilities.

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Getting Started](#getting-started)
5. [Applications](#applications)
6. [Documentation](#documentation)

---

## Overview

This system enables exploration of historical university course behavior and provides prediction features:

- View enrollment statistics per academic term for any course
- Forecast student enrollment using multiple methods (Weighted Moving Average, Exponential Smoothing, Pass-Rate Adjusted)
- Backtest forecast accuracy across historical data
- Analyze section-level statistics and pass/fail rates

## Project Structure

```
.
├── apps/
│   ├── backend/           # Hono + Drizzle + SQLite API
│   ├── frontend/          # SvelteKit SPA
│   └── db_creation_app/   # ETL pipeline for database creation
├── packages/
│   └── contracts/         # Shared Zod schemas and TypeScript types
└── docs/
    ├── architecture/      # System architecture documentation
    └── guidelines/        # Development guidelines
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Hono, Drizzle ORM, SQLite |
| Frontend | SvelteKit, TypeScript, Vite |
| Validation | Zod (single source of truth) |
| Database | SQLite (~1.4M+ enrollment records) |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+ (for database creation)

### Setup

```bash
# Install dependencies
npm install

# Create the database (see apps/db_creation_app/README.md)
cd apps/db_creation_app
python3 create_db.py --force

# Start backend
cd apps/backend
npm run dev

# Start frontend (in another terminal)
cd apps/frontend
npm run dev
```

## Applications

### Backend API

REST API with OpenAPI documentation. Handles course history queries, section statistics, and enrollment forecasting.

**Location**: `apps/backend/`

**Key Features**:
- Layered architecture (Controller → Use Case → Domain → Repository)
- Auto-generated OpenAPI docs via `@hono/zod-openapi`
- SQLite database access via Drizzle ORM

### Frontend

SvelteKit single-page application for visualizing enrollment data and forecasts.

**Location**: `apps/frontend/`
**Details**: [apps/frontend/README.md](apps/frontend/README.md)

### Database Creation App

Python ETL pipeline that creates the SQLite database from raw enrollment CSV data.

**Location**: `apps/db_creation_app/`
**Details**: [apps/db_creation_app/README.md](apps/db_creation_app/README.md)

## Documentation

### Architecture

- [General Architecture](docs/architecture/general-architecture.md) - System overview, layered architecture, database schema
- [Architecture Diagrams](docs/architecture/diagrams.md) - Visual diagrams of system components

### Use Cases

Located in `docs/architecture/use-cases/`:

| Use Case | Description |
|----------|-------------|
| `get-section-stats/` | Retrieve section-level enrollment statistics |
| `exponential-smoothing-forecaster/` | Forecast enrollments using exponential smoothing |
| `weighted-moving-average-forecaster/` | Forecast using weighted moving average |
| `pass-rate-adjusted-forecaster/` | Forecast adjusted by historical pass rates |
| `forecast-accuracy-backtesting/` | Backtest forecast methods against historical data |
| `course-accuracy-dashboard/` | Dashboard for forecast accuracy metrics |

### Guidelines

- [TypeScript Guidelines](docs/guidelines/typescript_guidelines.md)
- [Frontend Guidelines](docs/guidelines/frontend_guidelines.md)
