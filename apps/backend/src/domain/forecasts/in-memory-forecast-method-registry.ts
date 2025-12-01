import type {
  ForecastMethodMetadata,
  MethodCategory,
} from './forecast-method-metadata';
import type {
  ForecastMethodRegistry,
  MethodFilterOptions,
} from './forecast-method-registry';

/**
 * In-memory implementation of the forecast method registry
 */
export class InMemoryForecastMethodRegistry implements ForecastMethodRegistry {
  private readonly methods = new Map<string, ForecastMethodMetadata>();

  register(metadata: ForecastMethodMetadata): void {
    if (this.methods.has(metadata.id)) {
      throw new Error(`Method with ID '${metadata.id}' is already registered`);
    }
    this.methods.set(metadata.id, metadata);
  }

  getAll(): ForecastMethodMetadata[] {
    return Array.from(this.methods.values());
  }

  getFiltered(options: MethodFilterOptions): ForecastMethodMetadata[] {
    let methods = this.getAll();

    if (options.category) {
      methods = methods.filter(m => m.category === options.category);
    }

    if (options.status) {
      methods = methods.filter(m => m.status === options.status);
    } else {
      // Default to active methods only
      methods = methods.filter(m => m.status === 'active');
    }

    if (options.supportsBacktesting !== undefined) {
      methods = methods.filter(
        m => m.capabilities.supportsBacktesting === options.supportsBacktesting,
      );
    }

    return methods;
  }

  getById(id: string): ForecastMethodMetadata | undefined {
    return this.methods.get(id);
  }

  getByCategory(category: MethodCategory): ForecastMethodMetadata[] {
    return this.getAll().filter(m => m.category === category);
  }

  has(id: string): boolean {
    return this.methods.has(id);
  }

  count(): number {
    return this.methods.size;
  }

  activeCount(): number {
    return this.getAll().filter(m => m.status === 'active').length;
  }
}
