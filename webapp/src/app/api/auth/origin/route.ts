import { NextRequest, NextResponse } from 'next/server'

function getFirstForwardedIp(value: string | null): string | null {
  if (!value) return null
  const first = value.split(',')[0]?.trim()
  return first || null
}

export async function GET(request: NextRequest) {
  const ip =
    getFirstForwardedIp(request.headers.get('x-forwarded-for')) ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'Não disponível'

  const city = request.headers.get('x-vercel-ip-city')
  const region = request.headers.get('x-vercel-ip-country-region')
  const country = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry')

  const parts = [city, region, country].filter(Boolean)
  const location = parts.length ? parts.join(', ') : 'Não disponível'

  return NextResponse.json({ ip, location })
}
