import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const SECRET_DEV_KEY = process.env.SECRET_DEV_KEY

export async function GET() {
    const headersList = headers()
    const authHeader = headersList.get('x-api-key')

    if (!SECRET_DEV_KEY) {
        return new NextResponse(null, { status: 404 })
    }

    if (!authHeader || authHeader !== SECRET_DEV_KEY) {
        return new NextResponse(null, { status: 404 })
    }

    return new NextResponse('OK', { status: 200 })
}
