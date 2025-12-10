import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  WeightedMovingAverageForecaster,
} from '../../src/domain/forecasts/weighted-moving-average-forecaster';
import type { TermLookbackProvider } from '../../src/domain/forecasts/term-lookback-provider';
import type {
  ActualEnrollmentProvider,
} from '../../src/domain/backtesting/actual-enrollment-provider';

describe('WeightedMovingAverageForecaster', () => {
  // Mock dependencies
  const mockTermLookbackProvider: TermLookbackProvider = {
    getPastTerms: vi.fn(),
    getTermType: vi.fn(),
  };

  const mockActualEnrollmentProvider: ActualEnrollmentProvider = {
    getActualEnrollment: vi.fn(),
    getActualEnrollments: vi.fn(),
  };

  let forecaster: WeightedMovingAverageForecaster;

  beforeEach(() => {
    vi.clearAllMocks();

    forecaster = new WeightedMovingAverageForecaster(
      {
        termLookbackProvider: mockTermLookbackProvider,
        actualEnrollmentProvider: mockActualEnrollmentProvider,
      },
      { lookbackTerms: 3 },
    );
  });

  describe('Full 3-Term Weighted Moving Average', () => {
    it('should calculate WMA with default weights (0.50, 0.30, 0.20)', async () => {
      // Setup
      vi.mocked(mockTermLookbackProvider.getTermType).mockReturnValue('main-semester');
      vi.mocked(mockTermLookbackProvider.getPastTerms).mockReturnValue([
        202320, 202310, 202220,
      ]);
      vi.mocked(mockActualEnrollmentProvider.getActualEnrollments).mockResolvedValue(
        new Map([
          [202320, 120], // T1: 120 × 0.50 = 60
          [202310, 100], // T2: 100 × 0.30 = 30
          [202220, 110], // T3: 110 × 0.20 = 22
        ]),              // Total: 112
      );

      // Execute
      const result = await forecaster.forecast({
        courseCode: 'ISIS-3204',
        academicTerm: 202410,
      });

      // Verify
      expect(result.forecastedEnrollment).toBe(112);
      expect(result.details.confidence).toBe('high');
      expect(result.details.termsUsed).toBe(3);
      expect(result.details.historicalTerms).toHaveLength(3);

      // Verify WMA weights
      expect(result.details.historicalTerms[0].weightApplied).toBe(0.5);
      expect(result.details.historicalTerms[1].weightApplied).toBe(0.3);
      expect(result.details.historicalTerms[2].weightApplied).toBe(0.2);
    });

    it('should round the WMA forecast to nearest integer', async () => {
      vi.mocked(mockTermLookbackProvider.getTermType).mockReturnValue('main-semester');
      vi.mocked(mockTermLookbackProvider.getPastTerms).mockReturnValue([
        202320, 202310, 202220,
      ]);
      vi.mocked(mockActualEnrollmentProvider.getActualEnrollments).mockResolvedValue(
        new Map([
          [202320, 123], // 123 × 0.50 = 61.5
          [202310, 107], // 107 × 0.30 = 32.1
          [202220, 115], // 115 × 0.20 = 23.0
        ]),             // Total: 116.6 → 117
      );

      const result = await forecaster.forecast({
        courseCode: 'ISIS-3204',
        academicTerm: 202410,
      });

      expect(result.forecastedEnrollment).toBe(117);
    });

    it('should include correct weighted values in details', async () => {
      vi.mocked(mockTermLookbackProvider.getTermType).mockReturnValue('main-semester');
      vi.mocked(mockTermLookbackProvider.getPastTerms).mockReturnValue([
        202320, 202310, 202220,
      ]);
      vi.mocked(mockActualEnrollmentProvider.getActualEnrollments).mockResolvedValue(
        new Map([
          [202320, 100],
          [202310, 100],
          [202220, 100],
        ]),
      );

      const result = await forecaster.forecast({
        courseCode: 'ISIS-3204',
        academicTerm: 202410,
      });

      // All same enrollment → weighted values should match weights × 100
      expect(result.details.historicalTerms[0].weightedValue).toBe(50.0);
      expect(result.details.historicalTerms[1].weightedValue).toBe(30.0);
      expect(result.details.historicalTerms[2].weightedValue).toBe(20.0);
      expect(result.forecastedEnrollment).toBe(100);
    });
  });

  describe('2-Term Edge Case', () => {
    it('should normalize WMA weights when only 2 terms available', async () => {
      vi.mocked(mockTermLookbackProvider.getTermType).mockReturnValue('intersession');
      vi.mocked(mockTermLookbackProvider.getPastTerms).mockReturnValue([
        202315, 202215,
      ]);
      vi.mocked(mockActualEnrollmentProvider.getActualEnrollments).mockResolvedValue(
        new Map([
          [202315, 50], // T1: 50 × 0.625 = 31.25
          [202215, 35], // T2: 35 × 0.375 = 13.125
        ]),            // Total: 44.375 → 44
      );

      const result = await forecaster.forecast({
        courseCode: 'ISIS-3204',
        academicTerm: 202415,
      });

      expect(result.forecastedEnrollment).toBe(44);
      expect(result.details.confidence).toBe('medium');
      expect(result.details.termsUsed).toBe(2);

      // Verify adjusted weights (0.50/0.80 = 0.625, 0.30/0.80 = 0.375)
      expect(result.details.adjustedWeights).toBeDefined();
      expect(result.details.adjustedWeights?.t1Weight).toBeCloseTo(0.625, 3);
      expect(result.details.adjustedWeights?.t2Weight).toBeCloseTo(0.375, 3);
    });

    it('should only use 2 terms when third has no data', async () => {
      vi.mocked(mockTermLookbackProvider.getTermType).mockReturnValue('main-semester');
      vi.mocked(mockTermLookbackProvider.getPastTerms).mockReturnValue([
        202320, 202310, 202220,
      ]);
      // Third term has no data
      vi.mocked(mockActualEnrollmentProvider.getActualEnrollments).mockResolvedValue(
        new Map<number, number | null>([
          [202320, 100],
          [202310, 80],
          // 202220 missing
        ]),
      );

      const result = await forecaster.forecast({
        courseCode: 'ISIS-3204',
        academicTerm: 202410,
      });

      expect(result.details.termsUsed).toBe(2);
      expect(result.details.confidence).toBe('medium');
      expect(result.details.adjustedWeights).toBeDefined();
    });
  });

  describe('1-Term Edge Case', () => {
    it('should use direct value when only 1 term available', async () => {
      vi.mocked(mockTermLookbackProvider.getTermType).mockReturnValue('intersession');
      vi.mocked(mockTermLookbackProvider.getPastTerms).mockReturnValue([202315]);
      vi.mocked(mockActualEnrollmentProvider.getActualEnrollments).mockResolvedValue(
        new Map([[202315, 75]]),
      );

      const result = await forecaster.forecast({
        courseCode: 'ISIS-3204',
        academicTerm: 202415,
      });

      expect(result.forecastedEnrollment).toBe(75);
      expect(result.details.confidence).toBe('low');
      expect(result.details.termsUsed).toBe(1);
      expect(result.details.adjustedWeights?.t1Weight).toBe(1.0);
    });
  });

  describe('No Data Edge Case', () => {
    it('should return zero forecast with insufficient confidence when no data', async () => {
      vi.mocked(mockTermLookbackProvider.getTermType).mockReturnValue('main-semester');
      vi.mocked(mockTermLookbackProvider.getPastTerms).mockReturnValue([
        202320, 202310, 202220,
      ]);
      vi.mocked(mockActualEnrollmentProvider.getActualEnrollments).mockResolvedValue(
        new Map(), // No data for any term
      );

      const result = await forecaster.forecast({
        courseCode: 'ISIS-3204',
        academicTerm: 202410,
      });

      expect(result.forecastedEnrollment).toBe(0);
      expect(result.details.confidence).toBe('insufficient');
      expect(result.details.termsUsed).toBe(0);
      expect(result.details.fallbackReason).toBe('NO_HISTORICAL_DATA');
    });
  });

  describe('Zero Enrollment Handling', () => {
    it('should include zero enrollment terms in WMA calculation', async () => {
      vi.mocked(mockTermLookbackProvider.getTermType).mockReturnValue('main-semester');
      vi.mocked(mockTermLookbackProvider.getPastTerms).mockReturnValue([
        202320, 202310, 202220,
      ]);
      vi.mocked(mockActualEnrollmentProvider.getActualEnrollments).mockResolvedValue(
        new Map([
          [202320, 100], // 100 × 0.50 = 50
          [202310, 0],   // 0 × 0.30 = 0
          [202220, 100], // 100 × 0.20 = 20
        ]),             // Total: 70
      );

      const result = await forecaster.forecast({
        courseCode: 'ISIS-3204',
        academicTerm: 202410,
      });

      expect(result.forecastedEnrollment).toBe(70);
      expect(result.details.termsUsed).toBe(3);
      expect(result.details.confidence).toBe('high');
    });
  });

  describe('Term Type Handling', () => {
    it('should correctly report main-semester term type', async () => {
      vi.mocked(mockTermLookbackProvider.getTermType).mockReturnValue('main-semester');
      vi.mocked(mockTermLookbackProvider.getPastTerms).mockReturnValue([202320]);
      vi.mocked(mockActualEnrollmentProvider.getActualEnrollments).mockResolvedValue(
        new Map([[202320, 100]]),
      );

      const result = await forecaster.forecast({
        courseCode: 'ISIS-3204',
        academicTerm: 202410,
      });

      expect(result.details.termType).toBe('main-semester');
    });

    it('should correctly report intersession term type', async () => {
      vi.mocked(mockTermLookbackProvider.getTermType).mockReturnValue('intersession');
      vi.mocked(mockTermLookbackProvider.getPastTerms).mockReturnValue([202315]);
      vi.mocked(mockActualEnrollmentProvider.getActualEnrollments).mockResolvedValue(
        new Map([[202315, 50]]),
      );

      const result = await forecaster.forecast({
        courseCode: 'ISIS-3204',
        academicTerm: 202415,
      });

      expect(result.details.termType).toBe('intersession');
    });
  });

  describe('Metadata', () => {
    it('should have correct methodId', () => {
      expect(forecaster.methodId).toBe('weighted-moving-average');
    });

    it('should have correct methodLabel', () => {
      expect(forecaster.methodLabel).toBe('Weighted Moving Average (3-term WMA)');
    });

    it('should include methodId and methodLabel in result', async () => {
      vi.mocked(mockTermLookbackProvider.getTermType).mockReturnValue('main-semester');
      vi.mocked(mockTermLookbackProvider.getPastTerms).mockReturnValue([202320]);
      vi.mocked(mockActualEnrollmentProvider.getActualEnrollments).mockResolvedValue(
        new Map([[202320, 100]]),
      );

      const result = await forecaster.forecast({
        courseCode: 'ISIS-3204',
        academicTerm: 202410,
      });

      expect(result.methodId).toBe('weighted-moving-average');
      expect(result.methodLabel).toBe('Weighted Moving Average (3-term WMA)');
    });
  });

  describe('WMA Weight Configuration', () => {
    it('should have default weights summing to 1.0', async () => {
      vi.mocked(mockTermLookbackProvider.getTermType).mockReturnValue('main-semester');
      vi.mocked(mockTermLookbackProvider.getPastTerms).mockReturnValue([
        202320, 202310, 202220,
      ]);
      vi.mocked(mockActualEnrollmentProvider.getActualEnrollments).mockResolvedValue(
        new Map([
          [202320, 100],
          [202310, 100],
          [202220, 100],
        ]),
      );

      const result = await forecaster.forecast({
        courseCode: 'ISIS-3204',
        academicTerm: 202410,
      });

      const weightsApplied = result.details.weightsApplied;
      const sum = weightsApplied.t1Weight + weightsApplied.t2Weight + weightsApplied.t3Weight;
      expect(sum).toBe(1.0);
    });

    it('should have decreasing weights (most recent gets highest)', async () => {
      vi.mocked(mockTermLookbackProvider.getTermType).mockReturnValue('main-semester');
      vi.mocked(mockTermLookbackProvider.getPastTerms).mockReturnValue([
        202320, 202310, 202220,
      ]);
      vi.mocked(mockActualEnrollmentProvider.getActualEnrollments).mockResolvedValue(
        new Map([
          [202320, 100],
          [202310, 100],
          [202220, 100],
        ]),
      );

      const result = await forecaster.forecast({
        courseCode: 'ISIS-3204',
        academicTerm: 202410,
      });

      const weightsApplied = result.details.weightsApplied;
      expect(weightsApplied.t1Weight).toBeGreaterThan(weightsApplied.t2Weight);
      expect(weightsApplied.t2Weight).toBeGreaterThan(weightsApplied.t3Weight);
    });
  });
});
