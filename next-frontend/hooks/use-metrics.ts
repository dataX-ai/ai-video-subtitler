import { NextRequest } from "next/server";

type NextRouteHandler = (request: NextRequest, ...args: any[]) => Promise<Response> | Response;

function withMetrics<T extends NextRouteHandler>(fn: T): T {
  const wrappedFunction = async (request: NextRequest, ...args: any[]) => {
    console.log(`Starting execution of ${fn.name || 'anonymous function'}`);
    
    const startTime = performance.now();
    
    try {
      const response = await fn(request, ...args);
      return response;
    } finally {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      console.log(`Execution of ${fn.name || 'anonymous function'} completed in ${executionTime.toFixed(2)}ms`);
    }
  };

  return wrappedFunction as unknown as T;
}

export default withMetrics;
