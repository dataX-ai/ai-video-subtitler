import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import withAPIMetrics from '@/hooks/use-metrics'

const SECRET_DEV_KEY = process.env.SECRET_DEV_KEY

class HealthzRouteHandler {
    static async HEAD() {
        const headersList = headers()
        const authHeader = headersList.get('x-dev-secret-key')

        // Temp bypass for integration with Uptime Monitor
        return new NextResponse('OK', { status: 200 })
        
        // TODO:  Enable this with Uptime Monitor Pro  or Switch Monitoring Service
        if (!SECRET_DEV_KEY) {
            return new NextResponse(null, { status: 404 })
        }

        if (!authHeader || authHeader !== SECRET_DEV_KEY) {
            return new NextResponse(null, { status: 404 })
        }

        return new NextResponse('OK', { status: 200 })
        }
}

export const HEAD = withAPIMetrics(HealthzRouteHandler.HEAD);