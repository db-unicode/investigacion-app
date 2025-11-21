# General Application Architecture

## Overview

This document describes the architecture of a university course enrollment analysis system that provides historical behavior insights and prediction capabilities for university courses.

### System Goal

Build a system to explore historical behavior of university courses and provide prediction features:
- For a given `courseCode` (and optional campus), show enrollment statistics per academic term
- Later add prediction features (student enrollment forecasting and backtesting)

## Monorepo Structure

```
.
├── apps/
│   ├── backend/                 # Hono + Drizzle + SQLite API
│   │   ├── src/
│   │   │   ├── app/             # HTTP layer (controllers)
│   │   │   ├── application/     # Use cases and mappers
│   │   │   ├── domain/          # Domain models and services
│   │   │   └── infrastructure/  # DB client and repositories
│   │   ├── data/
│   │   │   └── enrollments.db   # SQLite database (single source of truth)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/                # SPA (Vite)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── contracts/               # Shared API contracts
│       ├── src/
│       │   └── course-history.ts # Zod schemas + TypeScript DTOs
│       ├── package.json
│       └── tsconfig.json
└── docs/
    ├── architecture/
    │   ├── general-architecture.md
    │   └── use-cases/
    │       └── get-course-history-by-term.md
```

### Key Locations

- **Database**: `apps/backend/data/enrollments.db` is the single source of truth
- **Backend**: API layer using Hono framework
- **Frontend**: Single Page Application
- **Contracts**: Shared TypeScript types and Zod schemas
- **Documentation**: All architecture docs live in `docs/`

## Technology Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Web Framework**: Hono with `@hono/zod-openapi`
- **Database**: SQLite (~1.4M rows, growing to ~5M)
- **ORM**: Drizzle ORM with `better-sqlite3` driver

### Frontend
- **Framework**: Vite-based SPA
- **Language**: TypeScript

### Shared
- **Validation**: Zod schemas as single source of truth
- **Package Management**: Monorepo structure

## Layered Architecture

### 1. Controller (Presentation Layer)
- **Responsibility**: HTTP request handling and response formatting
- **Technology**: Hono + Zod + `@hono/zod-openapi`
- **Key Activities**:
  - Define HTTP routes
  - Validate input using Zod schemas
  - Call use cases
  - Return HTTP responses
- **Constraints**: No business logic or database access

### 2. Use Case (Application Layer)
- **Responsibility**: Orchestrate domain services and repositories
- **Pattern**: One file per use case (e.g., `GetCourseHistoryUseCase`)
- **Key Activities**:
  - Coordinate between domain services and repositories
  - Use mappers to transform data
  - Return DTOs or application-level models
- **Constraints**: No HTTP or framework-specific logic

### 3. Domain Service (Domain Layer)
- **Responsibility**: Pure business logic
- **Example**: `CourseHistoryService`
- **Key Activities**:
  - Aggregate enrollment records into domain models
  - Implement business rules and calculations
- **Constraints**: No I/O operations

### 4. Repository (Infrastructure Layer)
- **Responsibility**: Data access abstraction
- **Pattern**: Interface + Implementation (SQLite/Drizzle)
- **Key Activities**:
  - Access `enrollments.db` using Drizzle
  - Implement queries (e.g., `findByCourseAndCampus`)
  - Return infrastructure records
- **Constraints**: Returns raw data, not DTOs

### 5. Mapper (Application Layer)
- **Responsibility**: Data transformation
- **Key Activities**:
  - Repository records → Domain models
  - Domain models → DTOs (from `packages/contracts`)
- **Constraints**: Stateless functions

## Database Schema

### Table: `enrollments`
```sql
CREATE TABLE enrollments (
    student_id INTEGER NOT NULL,
    academic_term INTEGER NOT NULL,
    course_code TEXT NOT NULL,
    campus_description TEXT,
    partial_grade TEXT,
    final_grade TEXT,
    course_status_description TEXT,
    course_outcome TEXT NOT NULL CHECK (course_outcome IN ('P','F','W')),
    PRIMARY KEY (student_id, academic_term, course_code) WITHOUT ROWID
);

CREATE INDEX idx_enrollments_term_course_outcome 
ON enrollments (academic_term, course_code, course_outcome);
```

### Schema Rationale
- **Primary Key**: Composite key ensures unique enrollment records per student/term/course
- **Index**: Optimizes queries by academic term, course code, and outcome
- **Data Quality**: Pre-cleaned and deduplicated by external Python process

## Shared Contracts

### Location
`packages/contracts/src/course-history.ts`

### Purpose
- Define HTTP API contracts using Zod schemas
- Provide TypeScript types for frontend and backend
- **Excludes**: Domain entities (backend-only)

### Usage
- **Backend**: Use schemas for OpenAPI generation and response validation
- **Frontend**: Use inferred types for type-safe API calls
- **Single Source of Truth**: Zod schemas drive both runtime validation and compile-time types

## Separation of Concerns

### Domain Models
- **Location**: `apps/backend/src/domain/`
- **Scope**: Backend-only business entities
- **Example**: `CourseHistoryPoint`, `EnrollmentRecord`

### DTOs (Data Transfer Objects)
- **Location**: `packages/contracts/src/`
- **Scope**: Shared between frontend and backend
- **Example**: `CourseHistoryByTermDto`

### Key Principle
Domain models represent business logic and remain in the backend, while DTOs define API contracts and are shared across the monorepo.

## Zod as Single Source of Truth

Zod schemas serve multiple purposes:
1. **Runtime Validation**: Validate API requests/responses
2. **Type Generation**: Infer TypeScript types
3. **OpenAPI Generation**: Auto-generate API documentation via `@hono/zod-openapi`
4. **Frontend Types**: Provide type-safe API consumption

This approach ensures consistency between runtime behavior and compile-time types.