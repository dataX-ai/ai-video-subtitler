// Import types only to avoid runtime errors in Edge Runtime
import type { Counter, Gauge, Histogram, Registry } from 'prom-client';

// Detect environment - true for server environment (Node.js), false for client/edge
const isServer = typeof window === 'undefined' && typeof process !== 'undefined' && process.versions && Boolean(process.versions.node);

// Dynamic imports for server-side only
let promClient: any = null;
let registry: Registry | null = null;

// This will only run on the server side
if (isServer) {
  try {
    // Dynamic import to avoid Edge Runtime errors
    promClient = require('prom-client');
    registry = new promClient.Registry();
  } catch (error) {
    console.warn('Failed to import prom-client:', error);
  }
}

/**
 * Singleton class for managing Prometheus metrics
 * 
 * Note on Next.js usage:
 * - In server components/API routes: This will work normally
 * - In client components/Edge Runtime: A no-op implementation is provided
 *   that silently ignores metrics operations
 */
export class Metrics {
  private static instance: Metrics;
  private registry: Registry | null = null;
  private initialized: boolean = false;
  private isServerEnv: boolean = false;

  // Pre-defined metrics
  private httpRequestCounter: Counter | null = null;
  private httpRequestDurationHistogram: Histogram | null = null;
  private activeUsersGauge: Gauge | null = null;
  private processingTimeHistogram: Histogram | null = null;

  private constructor() {
    this.isServerEnv = isServer;
    
    // Only initialize metrics in server environment
    if (!this.isServerEnv) {
      console.log('Metrics initialized in client/edge environment - operations will be no-ops');
      return;
    }

    if (!promClient || !registry) {
      console.warn('prom-client not available, metrics will not be collected');
      return;
    }

    this.registry = registry;

    try {
      // Only collect default metrics in server environment
      if (promClient.collectDefaultMetrics) {
        promClient.collectDefaultMetrics({ register: this.registry });
      }
    } catch (error) {
      console.warn('Failed to collect default metrics:', error);
    }

    try {
      // Define custom metrics
      this.httpRequestCounter = new promClient.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code'],
        registers: [this.registry]
      });

      this.httpRequestDurationHistogram = new promClient.Histogram({
        name: 'http_request_duration_seconds',
        help: 'HTTP request duration in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.05, 0.1, 0.5, 1, 2, 5, 10],
        registers: [this.registry]
      });

      this.activeUsersGauge = new promClient.Gauge({
        name: 'active_users',
        help: 'Number of currently active users',
        registers: [this.registry]
      });

      this.processingTimeHistogram = new promClient.Histogram({
        name: 'processing_time_seconds',
        help: 'Time spent processing tasks',
        labelNames: ['task_type'],
        buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 120, 300, 600],
        registers: [this.registry]
      });

      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize metrics:', error);
    }
  }

  /**
   * Get the singleton instance of Metrics
   */
  public static getInstance(): Metrics {
    if (!Metrics.instance) {
      Metrics.instance = new Metrics();
    }
    return Metrics.instance;
  }

  /**
   * Increment HTTP request counter
   */
  public incrementHttpRequestCounter(method: string, route: string, statusCode: string): void {
    if (!this.initialized || !this.httpRequestCounter) return;
    this.httpRequestCounter.inc({ method, route, status_code: statusCode });
  }

  /**
   * Observe HTTP request duration
   */
  public observeHttpRequestDuration(method: string, route: string, statusCode: string, durationInSeconds: number): void {
    if (!this.initialized || !this.httpRequestDurationHistogram) return;
    this.httpRequestDurationHistogram.observe({ method, route, status_code: statusCode }, durationInSeconds);
  }

  /**
   * Set active users gauge
   */
  public setActiveUsers(count: number): void {
    if (!this.initialized || !this.activeUsersGauge) return;
    this.activeUsersGauge.set(count);
  }

  /**
   * Observe processing time for a task
   */
  public observeProcessingTime(taskType: string, durationInSeconds: number): void {
    if (!this.initialized || !this.processingTimeHistogram) return;
    this.processingTimeHistogram.observe({ task_type: taskType }, durationInSeconds);
  }

  /**
   * Create a custom counter
   * If a counter with the same name already exists, it will be returned
   */
  public createCounter(name: string, help: string, labelNames: string[] = []): Counter | null {
    if (!this.initialized || !this.isServerEnv || !promClient || !this.registry) return null;
    
    try {
      // Check if a metric with this name already exists
      const existingMetric = this.registry.getSingleMetric(name);
      if (existingMetric) {
        return existingMetric as Counter;
      }
      
      // Create a new counter if it doesn't exist
      return new promClient.Counter({
        name,
        help,
        labelNames,
        registers: [this.registry]
      });
    } catch (error) {
      console.warn(`Error creating counter ${name}:`, error);
      return null;
    }
  }

  /**
   * Create a custom gauge
   * If a gauge with the same name already exists, it will be returned
   */
  public createGauge(name: string, help: string, labelNames: string[] = []): Gauge | null {
    if (!this.initialized || !this.isServerEnv || !promClient || !this.registry) return null;
    
    try {
      // Check if a metric with this name already exists
      const existingMetric = this.registry.getSingleMetric(name);
      if (existingMetric) {
        return existingMetric as Gauge;
      }
      
      // Create a new gauge if it doesn't exist
      return new promClient.Gauge({
        name,
        help,
        labelNames,
        registers: [this.registry]
      });
    } catch (error) {
      console.warn(`Error creating gauge ${name}:`, error);
      return null;
    }
  }

  /**
   * Create a custom histogram
   * If a histogram with the same name already exists, it will be returned
   */
  public createHistogram(name: string, help: string, labelNames: string[] = [], buckets: number[] = [0.1, 0.5, 1, 5, 10]): Histogram | null {
    if (!this.initialized || !this.isServerEnv || !promClient || !this.registry) return null;
    
    try {
      // Check if a metric with this name already exists
      const existingMetric = this.registry.getSingleMetric(name);
      if (existingMetric) {
        return existingMetric as Histogram;
      }
      
      // Create a new histogram if it doesn't exist
      return new promClient.Histogram({
        name,
        help,
        labelNames,
        buckets,
        registers: [this.registry]
      });
    } catch (error) {
      console.warn(`Error creating histogram ${name}:`, error);
      return null;
    }
  }

  /**
   * Get metrics in Prometheus format
   */
  public async getMetrics(): Promise<string> {
    if (!this.initialized || !this.isServerEnv || !this.registry) return '';
    return await this.registry.metrics();
  }

  /**
   * Reset all metrics (useful for tests)
   */
  public resetMetrics(): void {
    if (!this.initialized || !this.isServerEnv || !this.registry) return;
    this.registry.resetMetrics();
  }
  
  /**
   * Check if metrics are available in the current environment
   * Use this to conditionally execute metrics code
   */
  public isMetricsAvailable(): boolean {
    return this.initialized && this.isServerEnv;
  }
  
  /**
   * Increment active users count
   * @param increment - Amount to increment by (1 for new user, -1 for user leaving)
   */
  public incrementActiveUsers(increment: number = 1): void {
    if (!this.initialized || !this.activeUsersGauge) return;
    this.activeUsersGauge.inc(increment);
  }
}

// Export a default instance
export default Metrics.getInstance();
