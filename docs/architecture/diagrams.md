# Architecture Diagrams

## System Overview

```mermaid
graph TB
    subgraph Frontend
        UI[React UI Components]
        API[API Client]
    end
    
    subgraph Backend
        Controller[Hono Controller<br/>course-history-controller.ts]
        UseCase[Use Case<br/>get-course-history-use-case.ts]
        Mapper[Mapper<br/>course-history-mapper.ts]
        DomainService[Domain Service<br/>course-history-service.ts]
        Repository[Repository<br/>enrollment-repository.ts]
        DB[(SQLite<br/>enrollments.db)]
    end
    
    subgraph Contracts
        ZodSchema[Zod Schemas<br/>course-history.ts]
        Types[TypeScript Types]
    end
    
    UI --> API
    API --> Controller
    Controller --> UseCase
    UseCase --> DomainService
    UseCase --> Mapper
    DomainService --> Mapper
    UseCase --> Repository
    Repository --> DB
    ZodSchema --> Controller
    ZodSchema --> API
    Types --> UI
    Types --> Controller
```

## Layered Architecture

```mermaid
graph TB
    subgraph "Presentation Layer (Hono)"
        HTTP[HTTP Request]
        Validation[Zod Validation]
        Response[HTTP Response]
    end
    
    subgraph "Application Layer"
        UseCase[GetCourseHistoryUseCase]
        Mapper[CourseHistoryMapper]
    end
    
    subgraph "Domain Layer"
        DomainService[CourseHistoryService]
        DomainModel[CourseHistoryPoint]
    end
    
    subgraph "Infrastructure Layer"
        Repository[EnrollmentRepository]
        DB[(SQLite Database)]
    end
    
    HTTP --> Validation
    Validation --> UseCase
    UseCase --> DomainService
    DomainService --> DomainModel
    UseCase --> Repository
    Repository --> DB
    DomainModel --> Mapper
    Mapper --> Response
```

## Data Flow

```mermaid
sequenceDiagram
    participant Client as Frontend Client
    participant Controller as Hono Controller
    participant UseCase as GetCourseHistoryUseCase
    participant Repository as EnrollmentRepository
    participant Service as CourseHistoryService
    participant Mapper as CourseHistoryMapper
    participant DB as SQLite DB
    
    Client->>Controller: GET /api/courses/:code/history
    Controller->>Controller: Validate params/query (Zod)
    Controller->>UseCase: execute({courseCode, campus?})
    UseCase->>Repository: findByCourseAndCampus(code, campus?)
    Repository->>DB: SELECT * FROM enrollments WHERE...
    DB-->>Repository: EnrollmentRecord[]
    Repository-->>UseCase: EnrollmentRecord[]
    UseCase->>Service: aggregateByTerm(records)
    Service-->>UseCase: CourseHistoryPoint[]
    UseCase->>Mapper: toDto(points)
    Mapper-->>UseCase: CourseHistoryByTermDto
    UseCase-->>Controller: CourseHistoryByTermDto
    Controller-->>Client: 200 OK + JSON response
```

## Monorepo Structure

```mermaid
graph TB
    subgraph "apps/"
        Backend[backend/<br/>Hono API]
        Frontend[frontend/<br/>React SPA]
    end
    
    subgraph "packages/"
        Contracts[contracts/<br/>Shared Types]
    end
    
    subgraph "docs/"
        Architecture[architecture/<br/>Documentation]
    end
    
    Backend --> Contracts
    Frontend --> Contracts
    Contracts -.-> Architecture
    
    subgraph "Backend Internals"
        App[app/<br/>Controllers]
        Application[application/<br/>Use Cases + Mappers]
        Domain[domain/<br/>Models + Services]
        Infrastructure[infrastructure/<br/>DB + Repositories]
        Data[data/<br/>enrollments.db]
    end
    
    Backend --- App
    Backend --- Application
    Backend --- Domain
    Backend --- Infrastructure
    Backend --- Data
```

## Database Schema

```mermaid
erDiagram
    ENROLLMENTS {
        INTEGER student_id
        INTEGER academic_term
        TEXT course_code
        TEXT campus_description
        TEXT partial_grade
        TEXT final_grade
        TEXT course_status_description
        TEXT course_outcome
    }
    
    ENROLLMENTS ||--o{ ENROLLMENTS : "indexed by"
```

## Component Dependencies

```mermaid
graph LR
    subgraph "Independent"
        Contracts[packages/contracts<br/>Zod Schemas]
        DomainModels[Domain Models<br/>Backend Only]
    end
    
    subgraph "Depends on Contracts"
        Controller[Controller<br/>Hono + Zod]
        APIClient[API Client<br/>Frontend]
    end
    
    subgraph "Depends on Domain"
        UseCase[Use Case<br/>Application Layer]
        Service[Domain Service<br/>Business Logic]
    end
    
    subgraph "Depends on Infrastructure"
        Repository[Repository<br/>Data Access]
        DBClient[DB Client<br/>Drizzle]
    end
    
    Contracts --> Controller
    Contracts --> APIClient
    DomainModels --> UseCase
    DomainModels --> Service
    DBClient --> Repository
```

## Request-Response Cycle

```mermaid
graph LR
    A[Client Request] --> B[Controller]
    B --> C[Use Case]
    C --> D[Repository]
    D --> E[Database]
    E --> F[Raw Records]
    F --> G[Domain Service]
    G --> H[Domain Models]
    H --> I[Mapper]
    I --> J[DTO]
    J --> K[Controller]
    K --> L[Client Response]
```

## Technology Stack

```mermaid
graph TB
    subgraph "Frontend Layer"
        React[React 18<br/>UI Framework]
        Vite[Vite<br/>Build Tool]
        TypeScript[TypeScript<br/>Type Safety]
    end
    
    subgraph "Backend Layer"
        Hono[Hono<br/>Web Framework]
        Zod[Zod<br/>Validation]
        OpenAPI[hono-zod-openapi<br/>API Docs]
    end
    
    subgraph "Data Layer"
        SQLite[SQLite<br/>Database]
        Drizzle[Drizzle ORM<br/>Query Builder]
        BetterSQLite[better-sqlite3<br/>Driver]
    end
    
    subgraph "Shared Layer"
        Contracts[TypeScript Contracts<br/>packages/contracts]
        ZodSchemas[Zod Schemas<br/>Single Source of Truth]
    end
    
    React --> TypeScript
    Vite --> React
    Hono --> Zod
    Hono --> OpenAPI
    Drizzle --> BetterSQLite
    BetterSQLite --> SQLite
    Contracts --> ZodSchemas
    TypeScript --> Contracts
    OpenAPI --> ZodSchemas