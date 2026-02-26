import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/app/api/graph/neo4j'

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  const session = getSession()
  try {
    const result = await session.run(
      `
      MATCH (v:Vulnerability {project_id: $projectId})
      RETURN
        count(v) AS total,
        sum(CASE WHEN toUpper(coalesce(v.severity, '')) IN ['CRITICAL'] THEN 1 ELSE 0 END) AS critical,
        sum(CASE WHEN toUpper(coalesce(v.severity, '')) IN ['HIGH'] THEN 1 ELSE 0 END) AS high,
        sum(CASE WHEN toUpper(coalesce(v.severity, '')) IN ['MEDIUM'] THEN 1 ELSE 0 END) AS medium,
        sum(CASE WHEN toUpper(coalesce(v.severity, '')) IN ['LOW'] THEN 1 ELSE 0 END) AS low,
        sum(CASE WHEN toUpper(coalesce(v.severity, '')) IN ['INFO', 'INFORMATIONAL'] THEN 1 ELSE 0 END) AS informational
      `,
      { projectId }
    )

    const record = result.records[0]
    const parse = (key: string) => Number(record?.get(key)?.low ?? record?.get(key) ?? 0)

    return NextResponse.json({
      projectId,
      total: parse('total'),
      critical: parse('critical'),
      high: parse('high'),
      medium: parse('medium'),
      low: parse('low'),
      informational: parse('informational'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to build report summary', details: String(error) }, { status: 500 })
  } finally {
    await session.close()
  }
}
