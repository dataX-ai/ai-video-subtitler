import { NextRequest, NextResponse } from "next/server";
import { H } from '@/lib/highlight';

export function collectMetrics() {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor?: PropertyDescriptor | ClassMethodDecoratorContext<any, any>
  ): PropertyDescriptor | void | Function {
    // Handle both old and new decorator formats
    if (descriptor && 'kind' in descriptor) {
      const ctx = descriptor as ClassMethodDecoratorContext<any, any>;
      const originalMethod = ctx.addInitializer ? 
        function(...args: any[]) { return ctx.addInitializer.call(this, args); } :
        target[propertyKey];
      return wrapMethod(originalMethod, propertyKey.toString());
    }

    const actualDescriptor = descriptor as PropertyDescriptor || 
      Object.getOwnPropertyDescriptor(target, propertyKey);
    if (!actualDescriptor) throw new Error(`No descriptor for ${propertyKey.toString()}`);
    
    actualDescriptor.value = wrapMethod(actualDescriptor.value, propertyKey.toString());
    return actualDescriptor;
  };
}

function wrapMethod(method: Function, name: string) {
  return async function(...args: any[]) {
    const start = performance.now();
    try {
      const result = await method.apply(this, args);
      const timeElapsed = performance.now() - start;
      H.recordIncr({name: "http.requests", tags:[{name: "endpoint", value: name}]});
      H.recordMetric({name: "elapsedTimeMs", value: timeElapsed, tags: [{name: "endpoint", value: name}]});
      return result;
    } catch (error) {
      const timeElapsed = performance.now() - start;
      console.error("Error: ", error);
      throw error;
    }
  };
} 