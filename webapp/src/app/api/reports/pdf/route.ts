import { NextRequest, NextResponse } from 'next/server'

interface SummaryPayload {
  projectName?: string
  projectId: string
  total: number
  critical: number
  high: number
  medium: number
  low: number
  informational: number
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildSimplePdf(lines: string[]): Buffer {
  const content = ['BT', '/F1 12 Tf', '50 780 Td']
  lines.forEach((line, index) => {
    if (index > 0) content.push('0 -18 Td')
    content.push(`(${escapePdfText(line)}) Tj`)
  })
  content.push('ET')
  const stream = content.join('\n')

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream endobj`,
  ]

  let pdf = '%PDF-1.4\n'
  const xrefPositions: number[] = [0]
  for (const object of objects) {
    xrefPositions.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += `${object}\n`
  }

  const xrefStart = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i < xrefPositions.length; i++) {
    pdf += `${xrefPositions[i].toString().padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  return Buffer.from(pdf, 'utf8')
}

export async function POST(request: NextRequest) {
  const summary = (await request.json()) as SummaryPayload

  const lines = [
    'RedAmon Vulnerability Report',
    `Project: ${summary.projectName || summary.projectId}`,
    `Generated at: ${new Date().toISOString()}`,
    `Total vulnerabilities: ${summary.total}`,
    `Critical: ${summary.critical}`,
    `High: ${summary.high}`,
    `Medium: ${summary.medium}`,
    `Low: ${summary.low}`,
    `Informational: ${summary.informational}`,
  ]

  const buffer = buildSimplePdf(lines)
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="vulnerability-report-${summary.projectId}.pdf"`,
    },
  })
}
