import { describe, expect, it } from 'vitest';
import {
  DefaultTermLookbackProvider,
} from '../../src/infrastructure/providers/default-term-lookback-provider';

describe('DefaultTermLookbackProvider', () => {
  const provider = new DefaultTermLookbackProvider({ minYear: 2018 });

  describe('getTermType', () => {
    it('should identify main semester term 10 (spring)', () => {
      expect(provider.getTermType(202410)).toBe('main-semester');
      expect(provider.getTermType(202110)).toBe('main-semester');
    });

    it('should identify main semester term 20 (fall)', () => {
      expect(provider.getTermType(202420)).toBe('main-semester');
      expect(provider.getTermType(202120)).toBe('main-semester');
    });

    it('should identify intersession terms (11-19)', () => {
      expect(provider.getTermType(202411)).toBe('intersession');
      expect(provider.getTermType(202415)).toBe('intersession');
      expect(provider.getTermType(202419)).toBe('intersession');
    });
  });

  describe('getPastTerms - Main Semester', () => {
    it('should return 3 past main semester terms for spring term', () => {
      // For 202410 (Spring 2024), expect: 202320, 202310, 202220
      const terms = provider.getPastTerms(202410, 3);

      expect(terms).toHaveLength(3);
      expect(terms[0]).toBe(202320); // T1: Fall 2023
      expect(terms[1]).toBe(202310); // T2: Spring 2023
      expect(terms[2]).toBe(202220); // T3: Fall 2022
    });

    it('should return 3 past main semester terms for fall term', () => {
      // For 202420 (Fall 2024), expect: 202410, 202320, 202310
      const terms = provider.getPastTerms(202420, 3);

      expect(terms).toHaveLength(3);
      expect(terms[0]).toBe(202410); // T1: Spring 2024
      expect(terms[1]).toBe(202320); // T2: Fall 2023
      expect(terms[2]).toBe(202310); // T3: Spring 2023
    });

    it('should alternate between 10 and 20 semesters', () => {
      const terms = provider.getPastTerms(202510, 6);

      // Should alternate: 202420, 202410, 202320, 202310, 202220, 202210
      expect(terms[0] % 100).toBe(20);
      expect(terms[1] % 100).toBe(10);
      expect(terms[2] % 100).toBe(20);
      expect(terms[3] % 100).toBe(10);
    });

    it('should stop at minYear boundary', () => {
      const providerWith2022Min = new DefaultTermLookbackProvider({ minYear: 2022 });
      const terms = providerWith2022Min.getPastTerms(202310, 5);

      // Should only return terms from 2022+
      expect(terms.every(t => Math.floor(t / 100) >= 2022)).toBe(true);
    });
  });

  describe('getPastTerms - Intersession', () => {
    it('should return 3 past intersession terms of the same type', () => {
      // For 202415 (Summer 2024), expect: 202315, 202215, 202115
      const terms = provider.getPastTerms(202415, 3);

      expect(terms).toHaveLength(3);
      expect(terms[0]).toBe(202315); // T1: Summer 2023
      expect(terms[1]).toBe(202215); // T2: Summer 2022
      expect(terms[2]).toBe(202115); // T3: Summer 2021
    });

    it('should preserve intersession code across years', () => {
      const terms = provider.getPastTerms(202417, 3);

      // All should have semester code 17
      expect(terms.every(t => t % 100 === 17)).toBe(true);
    });

    it('should handle different intersession codes separately', () => {
      const terms11 = provider.getPastTerms(202411, 3);
      const terms15 = provider.getPastTerms(202415, 3);
      const terms19 = provider.getPastTerms(202419, 3);

      // Each should have its own semester code preserved
      expect(terms11.every(t => t % 100 === 11)).toBe(true);
      expect(terms15.every(t => t % 100 === 15)).toBe(true);
      expect(terms19.every(t => t % 100 === 19)).toBe(true);
    });

    it('should stop at minYear boundary for intersessions', () => {
      const terms = provider.getPastTerms(202015, 5);

      // With minYear 2018, should return at most 2 terms: 201915, 201815
      expect(terms.length).toBeLessThanOrEqual(2);
      expect(terms.every(t => Math.floor(t / 100) >= 2018)).toBe(true);
    });
  });

  describe('getPastTerms - Edge Cases', () => {
    it('should return empty array if no terms available before minYear', () => {
      const providerWith2024Min = new DefaultTermLookbackProvider({ minYear: 2024 });
      const terms = providerWith2024Min.getPastTerms(202410, 3);

      expect(terms).toHaveLength(0);
    });

    it('should handle requesting more terms than available', () => {
      const providerWith2022Min = new DefaultTermLookbackProvider({ minYear: 2022 });
      const terms = providerWith2022Min.getPastTerms(202310, 10);

      // Should return available terms (not crash)
      expect(terms.length).toBeLessThan(10);
      expect(terms.length).toBeGreaterThan(0);
    });
  });
});
