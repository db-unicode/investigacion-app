# Get Section Stats - Testing Guide

## Overview

This guide provides comprehensive testing strategies for the Get Section Stats feature.

---

## 1. Unit Tests

### 1.1 SectionStatsRepository

**Location**: `apps/backend/src/infrastructure/repositories/__tests__/section-stats-repository.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSectionStatsRepository } from '../section-stats-repository';
import type { DbClient } from '../../db/client';

describe('SectionStatsRepository', () => {
  let mockDbClient: DbClient;
  let repository: ReturnType<typeof createSectionStatsRepository>;

  const mockRecords = [
    {
      courseCode: 'ISIS-3204',
      academicTerm: '202410',
      section: 3,
      enrolled: 25,
      passed: 20,
      failed: 3,
      withdrawn: 2,
    },
    {
      courseCode: 'ISIS-3204',
      academicTerm: '202410',
      section: 2,
      enrolled: 30,
      passed: 25,
      failed: 4,
      withdrawn: 1,
    },
    {
      courseCode: 'ISIS-3204',
      academicTerm: '202410',
      section: 1,
      enrolled: 28,
      passed: 22,
      failed: 5,
      withdrawn: 1,
    },
  ];

  beforeEach(() => {
    mockDbClient = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue(mockRecords),
    } as unknown as DbClient;

    repository = createSectionStatsRepository(mockDbClient);
  });

  describe('findByCourseAndTerms', () => {
    it('should return records for valid course and terms', async () => {
      const result = await repository.findByCourseAndTerms(
        'ISIS-3204',
        ['202410'],
      );

      expect(result).toHaveLength(3);
      expect(result[0].courseCode).toBe('ISIS-3204');
    });

    it('should return empty array when no terms provided', async () => {
      const result = await repository.findByCourseAndTerms('ISIS-3204', []);

      expect(result).toEqual([]);
    });

    it('should filter by provided terms', async () => {
      const result = await repository.findByCourseAndTerms(
        'ISIS-3204',
        ['202410'],
      );

      result.forEach(record => {
        expect(record.academicTerm).toBe('202410');
      });
    });

    it('should return records ordered by section descending', async () => {
      const result = await repository.findByCourseAndTerms(
        'ISIS-3204',
        ['202410'],
      );

      expect(result[0].section).toBe(3);
      expect(result[1].section).toBe(2);
      expect(result[2].section).toBe(1);
    });
  });
});
```

### 1.2 GetSectionStatsUseCase

**Location**: `apps/backend/src/application/use-cases/__tests__/get-section-stats.use-case.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGetSectionStatsUseCase } from '../get-section-stats.use-case';
import type { SectionStatsRepository } from '../../../infrastructure/repositories/section-stats-repository';

describe('GetSectionStatsUseCase', () => {
  let mockRepository: SectionStatsRepository;
  let useCase: ReturnType<typeof createGetSectionStatsUseCase>;

  const mockRecords = [
    {
      courseCode: 'ISIS-3204',
      academicTerm: '202410',
      section: 3,
      enrolled: 25,
      passed: 20,
      failed: 3,
      withdrawn: 2,
    },
    {
      courseCode: 'ISIS-3204',
      academicTerm: '202410',
      section: 2,
      enrolled: 30,
      passed: 25,
      failed: 4,
      withdrawn: 1,
    },
    {
      courseCode: 'ISIS-3204',
      academicTerm: '202420',
      section: 1,
      enrolled: 35,
      passed: 30,
      failed: 4,
      withdrawn: 1,
    },
  ];

  beforeEach(() => {
    mockRepository = {
      findByCourseAndTerms: vi.fn().mockResolvedValue(mockRecords),
    };

    useCase = createGetSectionStatsUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should return section stats grouped by term', async () => {
      const result = await useCase.execute({
        courseCode: 'ISIS-3204',
        terms: [202410, 202420],
      });

      expect(result.courseCode).toBe('ISIS-3204');
      expect(result.terms).toHaveLength(2);
      expect(result.terms[0].academicTerm).toBe(202410);
      expect(result.terms[1].academicTerm).toBe(202420);
    });

    it('should calculate totals correctly', async () => {
      const result = await useCase.execute({
        courseCode: 'ISIS-3204',
        terms: [202410],
      });

      const term202410 = result.terms.find(t => t.academicTerm === 202410);

      expect(term202410?.totals.totalSections).toBe(2);
      expect(term202410?.totals.totalEnrolled).toBe(55); // 25 + 30
      expect(term202410?.totals.totalPassed).toBe(45); // 20 + 25
      expect(term202410?.totals.totalFailed).toBe(7); // 3 + 4
      expect(term202410?.totals.totalWithdrawn).toBe(3); // 2 + 1
    });

    it('should include metadata with requested terms', async () => {
      const result = await useCase.execute({
        courseCode: 'ISIS-3204',
        terms: [202410, 202420, 202510],
      });

      expect(result.metadata.requestedTerms).toEqual([202410, 202420, 202510]);
      expect(result.metadata.termsWithData).toBe(2);
      expect(result.metadata.termsWithoutData).toEqual([202510]);
    });

    it('should handle empty results', async () => {
      vi.mocked(mockRepository.findByCourseAndTerms).mockResolvedValue([]);

      const result = await useCase.execute({
        courseCode: 'ISIS-3204',
        terms: [202510],
      });

      expect(result.terms).toHaveLength(0);
      expect(result.metadata.termsWithData).toBe(0);
      expect(result.metadata.termsWithoutData).toEqual([202510]);
    });

    it('should include processedAt timestamp', async () => {
      const result = await useCase.execute({
        courseCode: 'ISIS-3204',
        terms: [202410],
      });

      expect(result.metadata.processedAt).toBeDefined();
      expect(() => new Date(result.metadata.processedAt)).not.toThrow();
    });

    it('should convert integer terms to string for repository', async () => {
      await useCase.execute({
        courseCode: 'ISIS-3204',
        terms: [202410, 202420],
      });

      expect(mockRepository.findByCourseAndTerms).toHaveBeenCalledWith(
        'ISIS-3204',
        ['202410', '202420'],
      );
    });
  });
});
```

---

## 2. Integration Tests

### 2.1 API Endpoint Tests

**Location**: `apps/backend/src/presentation/controllers/__tests__/section-stats.controller.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { OpenAPIHono } from '@hono/zod-openapi';
import { registerSectionStatsRoute } from '../section-stats.controller';

describe('Section Stats Controller', () => {
  let app: OpenAPIHono;

  beforeAll(() => {
    app = new OpenAPIHono();
    registerSectionStatsRoute(app);
  });

  describe('GET /api/courses/{courseCode}/sections', () => {
    it('should return 200 for valid request with single term', async () => {
      const res = await app.request(
        '/api/courses/ISIS-3204/sections?term=202410',
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.courseCode).toBe('ISIS-3204');
      expect(body.terms).toBeDefined();
      expect(body.metadata).toBeDefined();
    });

    it('should return 200 for valid request with multiple terms', async () => {
      const res = await app.request(
        '/api/courses/ISIS-3204/sections?terms=202410,202420,202510',
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.metadata.requestedTerms).toEqual([202410, 202420, 202510]);
    });

    it('should return 400 for invalid course code', async () => {
      const res = await app.request(
        '/api/courses/INVALID/sections?term=202410',
      );

      expect(res.status).toBe(400);
    });

    it('should return 400 when no term parameter provided', async () => {
      const res = await app.request('/api/courses/ISIS-3204/sections');

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid term format', async () => {
      const res = await app.request(
        '/api/courses/ISIS-3204/sections?term=abc',
      );

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid terms format', async () => {
      const res = await app.request(
        '/api/courses/ISIS-3204/sections?terms=202410,abc,202420',
      );

      expect(res.status).toBe(400);
    });

    it('should return sections ordered by section number descending', async () => {
      const res = await app.request(
        '/api/courses/ISIS-3204/sections?term=202410',
      );

      const body = await res.json();
      if (body.terms.length > 0 && body.terms[0].sections.length > 1) {
        const sections = body.terms[0].sections;
        for (let i = 1; i < sections.length; i++) {
          expect(sections[i - 1].section).toBeGreaterThanOrEqual(
            sections[i].section,
          );
        }
      }
    });

    it('should handle course with no data gracefully', async () => {
      const res = await app.request(
        '/api/courses/XXXX-9999/sections?term=202410',
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.terms).toEqual([]);
      expect(body.metadata.termsWithData).toBe(0);
    });
  });
});
```

---

## 3. Manual Testing

### 3.1 cURL Commands

```bash
# Single term query
curl -s "http://localhost:3000/api/courses/ISIS-3204/sections?term=202410" | jq

# Multiple terms query
curl -s "http://localhost:3000/api/courses/ISIS-3204/sections?terms=202410,202420,202510" | jq

# Invalid course code (should return 400)
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "http://localhost:3000/api/courses/INVALID/sections?term=202410"

# Missing term parameter (should return 400)
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "http://localhost:3000/api/courses/ISIS-3204/sections"

# Course with no data
curl -s "http://localhost:3000/api/courses/XXXX-9999/sections?term=202410" | jq
```

### 3.2 Expected Responses

**Successful Single Term:**
```json
{
  "courseCode": "ISIS-3204",
  "terms": [
    {
      "academicTerm": 202410,
      "sections": [
        {
          "section": 3,
          "enrolled": 25,
          "passed": 20,
          "failed": 3,
          "withdrawn": 2
        },
        {
          "section": 2,
          "enrolled": 30,
          "passed": 25,
          "failed": 4,
          "withdrawn": 1
        }
      ],
      "totals": {
        "totalSections": 2,
        "totalEnrolled": 55,
        "totalPassed": 45,
        "totalFailed": 7,
        "totalWithdrawn": 3
      }
    }
  ],
  "metadata": {
    "requestedTerms": [202410],
    "termsWithData": 1,
    "processedAt": "2025-12-03T10:30:00.000Z"
  }
}
```

**No Data Response:**
```json
{
  "courseCode": "XXXX-9999",
  "terms": [],
  "metadata": {
    "requestedTerms": [202410],
    "termsWithData": 0,
    "termsWithoutData": [202410],
    "processedAt": "2025-12-03T10:30:00.000Z"
  }
}
```

---

## 4. Test Coverage Requirements

| Component | Coverage Target | Key Scenarios |
|-----------|-----------------|---------------|
| Repository | 90% | Query execution, empty results, term filtering |
| Use Case | 90% | Grouping, totals calculation, metadata generation |
| Controller | 85% | Validation, error responses, parameter parsing |

---

## 5. Edge Cases

### 5.1 Empty Database

**Scenario**: No records exist for any course.

**Expected Behavior**:
- Returns 200 with empty `terms` array
- `metadata.termsWithData` is 0
- `metadata.termsWithoutData` contains all requested terms

### 5.2 Partial Data

**Scenario**: Data exists for some requested terms but not all.

**Expected Behavior**:
- Returns 200 with data for available terms
- `metadata.termsWithData` reflects actual count
- `metadata.termsWithoutData` lists terms without data

### 5.3 Single Section

**Scenario**: Course has only one section for a term.

**Expected Behavior**:
- `sections` array contains single element
- `totals.totalSections` is 1
- All totals equal single section values

### 5.4 Large Number of Sections

**Scenario**: Course has many sections (e.g., 20+) for a term.

**Expected Behavior**:
- All sections returned in descending order
- No pagination (acceptable for expected data size)
- Response time remains under 100ms

### 5.5 Maximum Terms Request

**Scenario**: Request with maximum allowed terms (e.g., 10).

**Expected Behavior**:
- Query executes successfully
- Response includes all requested terms
- Response size remains manageable

---

## 6. Validation Testing

### 6.1 Course Code Validation

| Input | Expected Result |
|-------|-----------------|
| `ISIS-3204` | Valid |
| `isis-3204` | Invalid (lowercase) |
| `ISIS3204` | Invalid (missing hyphen) |
| `ISISX-3204` | Invalid (5 letters) |
| `ISIS-32045` | Invalid (5 digits) |
| `ISIS-320` | Invalid (3 digits) |

### 6.2 Term Validation

| Input | Expected Result |
|-------|-----------------|
| `term=202410` | Valid |
| `terms=202410,202420` | Valid |
| `term=abc` | Invalid |
| `terms=202410,abc` | Invalid |
| `term=` | Invalid |
| (no term/terms) | Invalid |

---

## 7. Performance Testing

### 7.1 Load Test Scenarios

```bash
# Using Apache Bench
ab -n 1000 -c 10 "http://localhost:3000/api/courses/ISIS-3204/sections?term=202410"

# Using hey
hey -n 1000 -c 10 "http://localhost:3000/api/courses/ISIS-3204/sections?terms=202410,202420"
```

### 7.2 Expected Performance

| Metric | Target |
|--------|--------|
| P50 Latency | < 10ms |
| P95 Latency | < 50ms |
| P99 Latency | < 100ms |
| Throughput | > 500 req/s |

---

## 8. Database Verification

### 8.1 Verify Table Exists

```sql
SELECT name FROM sqlite_master
WHERE type='table' AND name='section_stats';
```

### 8.2 Verify Data Integrity

```sql
-- Check constraint: enrolled = passed + failed + withdrawn
SELECT * FROM section_stats
WHERE enrolled != passed + failed + withdrawn;

-- Should return 0 rows if data is valid
```

### 8.3 Sample Data Query

```sql
SELECT * FROM section_stats
WHERE course_code = 'ISIS-3204'
ORDER BY academic_term, section DESC
LIMIT 10;
```

---

## 9. Regression Testing

### 9.1 Existing Endpoints

Verify that existing endpoints continue to work after deployment:

```bash
# Course history endpoint
curl -s "http://localhost:3000/api/courses/ISIS-3204/history" | jq

# Forecast methods endpoint
curl -s "http://localhost:3000/api/forecasts/methods" | jq

# Health check
curl -s "http://localhost:3000/health" | jq
```

### 9.2 Contract Compatibility

Ensure new contracts don't break existing imports:

```bash
cd packages/contracts
npm run build
npm run test
```

---

## Related Documents

- [Architecture Document](./architecture.md)
- [Implementation Guide](./implementation-guide.md)
- [System Impact](./system-impact.md)
