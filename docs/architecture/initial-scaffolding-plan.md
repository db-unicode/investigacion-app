# Initial Scaffolding Plan

This document provides a step-by-step guide to create the initial project structure for the university course enrollment analysis system.

## Directory Tree Structure

```
.
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── server.ts
│   │   │   │   └── controllers/
│   │   │   │       └── course-history-controller.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   └── get-course-history-use-case.ts
│   │   │   │   └── mappers/
│   │   │   │       └── course-history-mapper.ts
│   │   │   ├── domain/
│   │   │   │   ├── models/
│   │   │   │   │   └── course-history-point.ts
│   │   │   │   └── services/
│   │   │   │       └── course-history-service.ts
│   │   │   └── infrastructure/
│   │   │       ├── database/
│   │   │       │   ├── client.ts
│   │   │       │   └── schema.ts
│   │   │       └── repositories/
│   │   │           └── enrollment-repository.ts
│   │   ├── data/
│   │   │   └── enrollments.db
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── api/
│       │       └── client.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── contracts/
│       ├── src/
│       │   └── course-history.ts
│       ├── package.json
│       └── tsconfig.json
├── docs/
│   └── architecture/
│       ├── general-architecture.md
│       ├── diagrams.md
│       └── use-cases/
│           └── get-course-history-by-term.md
└── package.json
```

## Step-by-Step File Creation

### Step 1: Root Package Configuration

**File**: `package.json`
**Purpose**: Monorepo root configuration
**Content**: Workspace configuration and shared scripts

```json
{
  "name": "university-enrollment-analysis",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:backend": "npm run dev --workspace=apps/backend",
    "dev:frontend": "npm run dev --workspace=apps/frontend",
    "build": "npm run build --workspaces"
  }
}
```

### Step 2: Backend Application

**File**: `apps/backend/package.json`
**Purpose**: Backend dependencies and scripts
**Content**: Hono, Drizzle, TypeScript configuration

```json
{
  "name": "@enrollment-analysis/backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/app/server.ts",
    "build": "tsc",
    "start": "node dist/app/server.js"
  },
  "dependencies": {
    "@hono/zod-openapi": "^0.9.0",
    "hono": "^3.12.0",
    "drizzle-orm": "^0.29.0",
    "better-sqlite3": "^9.0.0",
    "@enrollment-analysis/contracts": "*"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

**File**: `apps/backend/tsconfig.json`
**Purpose**: TypeScript configuration for backend
**Content**: Node.js target with ES modules

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 3: Backend Source Files

**File**: `apps/backend/src/app/server.ts`
**Purpose**: HTTP server entry point
**Content**: Hono app setup and route registration

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { courseHistoryController } from './controllers/course-history-controller.js';

const app = new Hono();

app.use('/*', cors());

// Register routes
app.route('/api/courses', courseHistoryController);

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
```

**File**: `apps/backend/src/app/controllers/course-history-controller.ts`
**Purpose**: HTTP request handling
**Content**: Route definitions with Zod validation

```typescript
import { Hono } from 'hono';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import { courseHistoryByTermSchema } from '@enrollment-analysis/contracts';
import { GetCourseHistoryUseCase } from '../../application/use-cases/get-course-history-use-case.js';

const app = new OpenAPIHono();

const route = createRoute({
  method: 'get',
  path: '/{courseCode}/history',
  request: {
    params: z.object({
      courseCode: z.string().min(1)
    }),
    query: z.object({
      campus: z.string().optional()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: courseHistoryByTermSchema
        }
      }
    }
  }
});

app.openapi(route, async (c) => {
  const { courseCode } = c.req.valid('param');
  const { campus } = c.req.valid('query');
  
  const useCase = new GetCourseHistoryUseCase();
  const result = await useCase.execute({ courseCode, campusDescription: campus });
  
  return c.json(result);
});

export const courseHistoryController = app;
```

**File**: `apps/backend/src/application/use-cases/get-course-history-use-case.ts`
**Purpose**: Use case orchestration
**Content**: Business logic coordination

```typescript
import { EnrollmentRepository } from '../../infrastructure/repositories/enrollment-repository.js';
import { CourseHistoryService } from '../../domain/services/course-history-service.js';
import { CourseHistoryMapper } from '../mappers/course-history-mapper.js';
import type { CourseHistoryByTermDto } from '@enrollment-analysis/contracts';

export interface GetCourseHistoryInput {
  courseCode: string;
  campusDescription?: string;
}

export class GetCourseHistoryUseCase {
  async execute(input: GetCourseHistoryInput): Promise<CourseHistoryByTermDto> {
    const repository = new EnrollmentRepository();
    const service = new CourseHistoryService();
    const mapper = new CourseHistoryMapper();
    
    const enrollments = await repository.findByCourseAndCampus(
      input.courseCode,
      input.campusDescription
    );
    
    const historyPoints = service.aggregateByTerm(enrollments);
    
    return mapper.toDto(historyPoints);
  }
}
```

**File**: `apps/backend/src/application/mappers/course-history-mapper.ts`
**Purpose**: Data transformation
**Content**: Domain to DTO conversion

```typescript
import type { CourseHistoryByTermDto } from '@enrollment-analysis/contracts';
import type { CourseHistoryPoint } from '../../domain/models/course-history-point.js';

export class CourseHistoryMapper {
  toDto(points: CourseHistoryPoint[]): CourseHistoryByTermDto {
    return points.reduce((acc, point) => {
      acc[point.academicTerm] = {
        enrolled: point.totalEnrollments,
        passed: point.passedCount,
        failed: point.failedCount,
        withdrawn: point.withdrawnCount
      };
      return acc;
    }, {} as CourseHistoryByTermDto);
  }
}
```

**File**: `apps/backend/src/domain/models/course-history-point.ts`
**Purpose**: Domain model definition
**Content**: Business entity

```typescript
export interface CourseHistoryPoint {
  academicTerm: string;
  courseCode: string;
  campusDescription?: string;
  totalEnrollments: number;
  passedCount: number;
  failedCount: number;
  withdrawnCount: number;
}
```

**File**: `apps/backend/src/domain/services/course-history-service.ts`
**Purpose**: Business logic
**Content**: Pure domain operations

```typescript
import type { CourseHistoryPoint } from '../models/course-history-point.js';
import type { EnrollmentRecord } from '../../infrastructure/database/schema.js';

export class CourseHistoryService {
  aggregateByTerm(enrollments: EnrollmentRecord[]): CourseHistoryPoint[] {
    return enrollments.reduce((acc, enrollment) => {
      const term = enrollment.academicTerm.toString();
      const existing = acc.find(point => point.academicTerm === term);
      
      if (existing) {
        existing.totalEnrollments++;
        if (enrollment.courseOutcome === 'P') existing.passedCount++;
        if (enrollment.courseOutcome === 'F') existing.failedCount++;
        if (enrollment.courseOutcome === 'W') existing.withdrawnCount++;
      } else {
        acc.push({
          academicTerm: term,
          courseCode: enrollment.courseCode,
          campusDescription: enrollment.campusDescription,
          totalEnrollments: 1,
          passedCount: enrollment.courseOutcome === 'P' ? 1 : 0,
          failedCount: enrollment.courseOutcome === 'F' ? 1 : 0,
          withdrawnCount: enrollment.courseOutcome === 'W' ? 1 : 0
        });
      }
      
      return acc;
    }, [] as CourseHistoryPoint[]);
  }
}
```

**File**: `apps/backend/src/infrastructure/database/schema.ts`
**Purpose**: Database schema definition
**Content**: Drizzle schema and TypeScript types

```typescript
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const enrollments = sqliteTable('enrollments', {
  studentId: integer('student_id').notNull(),
  academicTerm: integer('academic_term').notNull(),
  courseCode: text('course_code').notNull(),
  campusDescription: text('campus_description'),
  partialGrade: text('partial_grade'),
  finalGrade: text('final_grade'),
  courseStatusDescription: text('course_status_description'),
  courseOutcome: text('course_outcome', { enum: ['P', 'F', 'W'] }).notNull(),
});

export type EnrollmentRecord = typeof enrollments.$inferSelect;
```

**File**: `apps/backend/src/infrastructure/database/client.ts`
**Purpose**: Database connection
**Content**: Drizzle client setup

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { enrollments } from './schema.js';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'enrollments.db');
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema: { enrollments } });
```

**File**: `apps/backend/src/infrastructure/repositories/enrollment-repository.ts`
**Purpose**: Data access layer
**Content**: Repository implementation

```typescript
import { db } from '../database/client.js';
import { enrollments } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import type { EnrollmentRecord } from '../database/schema.js';

export class EnrollmentRepository {
  async findByCourseAndCampus(
    courseCode: string,
    campusDescription?: string
  ): Promise<EnrollmentRecord[]> {
    let query = db.select().from(enrollments)
      .where(eq(enrollments.courseCode, courseCode));
    
    if (campusDescription) {
      query = query.where(eq(enrollments.campusDescription, campusDescription));
    }
    
    return query.orderBy(enrollments.academicTerm);
  }
}
```

### Step 4: Frontend Application

**File**: `apps/frontend/package.json`
**Purpose**: Frontend dependencies and scripts
**Content**: React, Vite, TypeScript configuration

```json
{
  "name": "@enrollment-analysis/frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@enrollment-analysis/contracts": "*"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

**File**: `apps/frontend/tsconfig.json`
**Purpose**: TypeScript configuration for frontend
**Content**: React and DOM types

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**File**: `apps/frontend/src/main.tsx`
**Purpose**: React application entry point
**Content**: Root component mounting

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**File**: `apps/frontend/src/App.tsx`
**Purpose**: Main application component
**Content**: Course history viewer

```typescript
import { useState } from 'react';
import { apiClient } from './api/client';
import type { CourseHistoryByTermDto } from '@enrollment-analysis/contracts';

function App() {
  const [courseCode, setCourseCode] = useState('');
  const [history, setHistory] = useState<CourseHistoryByTermDto | null>(null);

  const handleSearch = async () => {
    const data = await apiClient.getCourseHistory(courseCode);
    setHistory(data);
  };

  return (
    <div>
      <h1>Course Enrollment History</h1>
      <input
        value={courseCode}
        onChange={(e) => setCourseCode(e.target.value)}
        placeholder="Enter course code"
      />
      <button onClick={handleSearch}>Search</button>
      
      {history && (
        <pre>{JSON.stringify(history, null, 2)}</pre>
      )}
    </div>
  );
}

export default App;
```

**File**: `apps/frontend/src/api/client.ts`
**Purpose**: API client for backend communication
**Content**: Type-safe API calls

```typescript
import type { CourseHistoryByTermDto } from '@enrollment-analysis/contracts';

const API_BASE_URL = 'http://localhost:3000';

export const apiClient = {
  async getCourseHistory(courseCode: string, campus?: string): Promise<CourseHistoryByTermDto> {
    const url = new URL(`${API_BASE_URL}/api/courses/${courseCode}/history`);
    if (campus) url.searchParams.set('campus', campus);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  }
};
```

### Step 5: Shared Contracts Package

**File**: `packages/contracts/package.json`
**Purpose**: Shared type definitions
**Content**: TypeScript and Zod dependencies

```json
{
  "name": "@enrollment-analysis/contracts",
  "version": "1.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

**File**: `packages/contracts/tsconfig.json`
**Purpose**: TypeScript configuration for contracts
**Content**: Library target configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**File**: `packages/contracts/src/course-history.ts`
**Purpose**: Shared DTOs and Zod schemas
**Content**: API contract definitions

```typescript
import { z } from 'zod';

export const courseHistoryTermStatsSchema = z.object({
  enrolled: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  withdrawn: z.number().int().nonnegative(),
});

export const courseHistoryByTermSchema = z.record(
  z.string().regex(/^\d{6}$/),
  courseHistoryTermStatsSchema,
);

export type CourseHistoryTermStatsDto = z.infer<typeof courseHistoryTermStatsSchema>;
export type CourseHistoryByTermDto = z.infer<typeof courseHistoryByTermSchema>;
```

### Step 6: Database File

**File**: `apps/backend/data/enrollments.db`
**Purpose**: SQLite database with enrollment data
**Content**: Pre-populated database (already exists in project)

**Note**: This file already exists in the project root and should be moved to `apps/backend/data/`

## Installation and Setup

### 1. Create Directory Structure
```bash
mkdir -p apps/backend/src/{app/controllers,application/{use-cases,mappers},domain/{models,services},infrastructure/{database,repositories}} apps/backend/data apps/frontend/src/api packages/contracts/src docs/architecture/use-cases
```

### 2. Initialize Root Package
```bash
npm init -y
# Copy root package.json content
```

### 3. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd apps/backend && npm install && cd ../..

# Install frontend dependencies
cd apps/frontend && npm install && cd ../..

# Install contracts dependencies
cd packages/contracts && npm install && cd ../..
```

### 4. Move Database File
```bash
mv enrollments.db apps/backend/data/
```

### 5. Build Contracts Package
```bash
npm run build --workspace=packages/contracts
```

### 6. Start Development
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

## Next Steps

After completing the scaffolding:

1. **Test the API**: Use curl or Postman to test `GET /api/courses/CS101/history`
2. **Verify Frontend**: Check that the React app can fetch and display data
3. **Add Error Handling**: Implement proper error handling in controllers
4. **Add Logging**: Add request/response logging middleware
5. **Add Tests**: Write unit tests for services and integration tests for API
6. **Add Authentication**: Implement API key or JWT authentication
7. **Add Rate Limiting**: Protect API from abuse
8. **Add Caching**: Implement Redis caching for frequently accessed data