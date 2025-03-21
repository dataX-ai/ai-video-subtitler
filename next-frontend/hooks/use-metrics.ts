import { NextRequest } from "next/server";
import metrics from "../app/utils/metrics";

type NextRouteHandler = (request: NextRequest, ...args: any[]) => Promise<Response> | Response;

/**
 * Higher-order function that wraps API route handlers to collect metrics
 * 
 * This wrapper:
 * 1. Measures the execution time of the API handler
 * 2. Records the HTTP method and route path
 * 3. Records the response status code
 * 4. Logs execution time to console for debugging
 * 5. Sends metrics to Prometheus via our metrics singleton
 */
function withAPIMetrics<T extends NextRouteHandler>(fn: T): T {
  const wrappedFunction = async (request: NextRequest, ...args: any[]) => {
    const method = request.method;
    const path = request.nextUrl.pathname;
    
    console.log(`DEBUG: Starting execution of ${method} ${path}`);
    
    const startTime = performance.now();
    
    try {
      const response = await fn(request, ...args);
      
      // Calculate execution time
      const endTime = performance.now();
      const executionTimeMs = endTime - startTime;
      const executionTimeSec = executionTimeMs / 1000; // Convert to seconds for Prometheus
      
      // Get status code from response
      const statusCode = response.status.toString();
      
      // Log for debugging
      console.log(`DEBUG: Execution of ${path} completed in ${executionTimeMs.toFixed(2)}ms with status ${statusCode}`);
      
      // Record metrics
      metrics.incrementHttpRequestCounter(method, path, statusCode);
      metrics.observeHttpRequestDuration(method, path, statusCode, executionTimeSec);
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      const executionTimeMs = endTime - startTime;
      const executionTimeSec = executionTimeMs / 1000;
      
      console.error(`ERROR: Error in ${path} after ${executionTimeMs.toFixed(2)}ms:`, error);
      
      metrics.incrementHttpRequestCounter(method, path, '500');
      metrics.observeHttpRequestDuration(method, path, '500', executionTimeSec);
      
      throw error;
    }
  };

  return wrappedFunction as unknown as T;
}

export default withAPIMetrics;
