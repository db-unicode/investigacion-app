import { describe, expect, it } from 'vitest';
import {
  createPrerequisiteParser,
  InvalidPrerequisiteExpressionError,
} from '../../src/domain/services/prerequisite-parser';

describe('PrerequisiteParser', () => {
  const parser = createPrerequisiteParser();

  it('parses a simple AND of required courses', () => {
    const raw = '["ISIS-1304","ISIS-1225"]';

    const expression = parser.parse('ISIS-3204', raw);

    expect(expression.targetCourseCode).toBe('ISIS-3204');
    expect(expression.clauses).toEqual([
      {
        kind: 'required-course',
        courseCode: 'ISIS-1304',
      },
      {
        kind: 'required-course',
        courseCode: 'ISIS-1225',
      },
    ]);
  });

  it('parses AND with an any-of-group clause', () => {
    const raw =
      '["ISIS-1304","ISIS-1225",["FISI-1028","FISI-1528"]]';

    const expression = parser.parse('ISIS-3204', raw);

    expect(expression.clauses).toHaveLength(3);

    expect(expression.clauses[0]).toEqual({
      kind: 'required-course',
      courseCode: 'ISIS-1304',
    });

    expect(expression.clauses[1]).toEqual({
      kind: 'required-course',
      courseCode: 'ISIS-1225',
    });

    expect(expression.clauses[2]).toEqual({
      kind: 'any-of-group',
      courseCodes: ['FISI-1028', 'FISI-1528'],
    });
  });

  it('throws on non-array top-level JSON', () => {
    const raw = '{"a":"ISIS-1304"}';

    expect(() => parser.parse('ISIS-3204', raw)).toThrow(
      InvalidPrerequisiteExpressionError,
    );
  });

  it('throws on invalid course code format', () => {
    const raw = '["BADCODE-1"]';

    expect(() => parser.parse('ISIS-3204', raw)).toThrow(
      InvalidPrerequisiteExpressionError,
    );
  });

  it('throws when any-of-group contains non-string elements', () => {
    const raw = '["ISIS-1304", [123, "FISI-1028"]]';

    expect(() => parser.parse('ISIS-3204', raw)).toThrow(
      InvalidPrerequisiteExpressionError,
    );
  });

  it('throws when any-of-group is empty', () => {
    const raw = '["ISIS-1304", []]';

    expect(() => parser.parse('ISIS-3204', raw)).toThrow(
      InvalidPrerequisiteExpressionError,
    );
  });
});
