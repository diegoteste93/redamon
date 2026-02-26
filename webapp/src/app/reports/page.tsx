'use client'

import { useEffect, useState } from 'react'

interface Summary {
  projectId: string
  total: number
  critical: number
  high: number
  medium: number
  low: number
  informational: number
}

export default function ReportsPage() {
  const [projectId, setProjectId] = useState('')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    fetch(`/api/reports/summary?projectId=${encodeURIComponent(projectId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar')
        return res.json()
      })
      .then(setSummary)
      .catch((err) => setError(err.message))
  }, [projectId])

  const downloadPdf = async () => {
    if (!summary) return
    const response = await fetch('/api/reports/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary),
    })

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `report-${summary.projectId}.pdf`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ margin: '1rem auto', maxWidth: 960 }}>
      <h1>Relatórios (Read-only)</h1>
      <p>Clientes podem visualizar métricas e exportar PDF sem alterar dados operacionais.</p>
      <input
        style={{ minWidth: 340 }}
        placeholder="Informe o Project ID"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
      />

      {error && <p style={{ color: 'tomato' }}>{error}</p>}

      {summary && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
            {Object.entries(summary)
              .filter(([key]) => key !== 'projectId')
              .map(([key, value]) => (
                <div key={key} style={{ border: '1px solid #2f3546', borderRadius: 8, padding: 12 }}>
                  <strong>{key.toUpperCase()}</strong>
                  <div style={{ fontSize: 28 }}>{value}</div>
                </div>
              ))}
          </div>
          <button onClick={downloadPdf} style={{ marginTop: 16 }}>Exportar PDF</button>
        </>
      )}
    </div>
  )
}
