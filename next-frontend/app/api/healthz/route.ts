import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import withMetrics from '@/hooks/use-metrics'

const SECRET_DEV_KEY = process.env.SECRET_DEV_KEY

class HealthzRouteHandler {
    static async GET() {
        const headersList = headers()
        const authHeader = headersList.get('x-dev-secret-key')

    if (!SECRET_DEV_KEY) {
        return new NextResponse(null, { status: 404 })
    }

    if (!authHeader || authHeader !== SECRET_DEV_KEY) {
        return new NextResponse(null, { status: 404 })
    }

    return new NextResponse('OK', { status: 200 })
    }
}

export const GET = withMetrics(HealthzRouteHandler.GET);