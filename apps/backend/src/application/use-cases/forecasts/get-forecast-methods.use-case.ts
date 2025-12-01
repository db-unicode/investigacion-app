import type { ForecastMethodDto, ForecastMethodListDto } from '@app/contracts';
import type { ForecastMethodRegistry } from '../../../domain/forecasts/forecast-method-registry';
import type {
  MethodCategory,
  MethodStatus,
} from '../../../domain/forecasts/forecast-method-metadata';

export interface GetForecastMethodsInput {
  category?: MethodCategory;
  status?: MethodStatus;
  supportsBacktesting?: boolean;
}

export interface GetForecastMethodsUseCaseDeps {
  registry: ForecastMethodRegistry;
}

export class GetForecastMethodsUseCase {
  private readonly registry: ForecastMethodRegistry;

  constructor(deps: GetForecastMethodsUseCaseDeps) {
    this.registry = deps.registry;
  }

  /**
   * Get all methods matching the filter criteria
   */
  execute(input: GetForecastMethodsInput = {}): ForecastMethodListDto {
    const methods = this.registry.getFiltered({
      category: input.category,
      status: input.status,
      supportsBacktesting: input.supportsBacktesting,
    });

    return {
      methods: methods.map(this.toDto),
      metadata: {
        totalCount: this.registry.count(),
        activeCount: this.registry.activeCount(),
      },
    };
  }

  /**
   * Get a single method by ID
   */
  executeById(methodId: string): ForecastMethodDto | null {
    const method = this.registry.getById(methodId);

    if (!method) {
      return null;
    }

    return this.toDto(method);
  }

  private toDto(method: {
    id: string;
    label: string;
    description: string;
    shortDescription: string;
    category: string;
    status: string;
    capabilities: {
      supportsMultiTerm: boolean;
      supportsBacktesting: boolean;
      requiresPrerequisites: boolean;
      requiresHistoricalData: boolean;
    };
    icon?: string;
  }): ForecastMethodDto {
    return {
      id: method.id,
      label: method.label,
      description: method.description,
      shortDescription: method.shortDescription,
      category: method.category as
        | 'prerequisite-based'
        | 'historical-trend'
        | 'machine-learning',
      status: method.status as 'active' | 'beta' | 'deprecated',
      capabilities: method.capabilities,
      icon: method.icon,
    };
  }
}
