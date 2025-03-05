import { H } from '@highlight-run/next/server'
import { NextRequest } from 'next/server'

type RouteHandler = (request: NextRequest) => Promise<Response>

export function withAppRouterHighlight(handler: RouteHandler) {
  return async (request: NextRequest) => {
    const { span } = H.startWithHeaders('api-request', {
        headers: Array.from(request.headers.entries()).map(([k, v]) => `${k}: ${v}`),
        url: request.url,
    })

    try {
      return await handler(request)
    } finally {
      span.end()
    }
  }
}