'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './page.module.css'

interface OriginInfo {
  ip: string
  location: string
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next') || '/graph'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [origin, setOrigin] = useState<OriginInfo>({ ip: 'Carregando...', location: 'Carregando...' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/origin')
      .then(async (response) => {
        if (!response.ok) throw new Error('origin_unavailable')
        return response.json()
      })
      .then((data: OriginInfo) => setOrigin(data))
      .catch(() => setOrigin({ ip: 'Não disponível', location: 'Não disponível' }))
  }, [])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      })

      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.error || 'Login failed')
      }

      router.push(nextUrl)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={`card ${styles.card}`}>
        <div className="cardHeader">
          <h1 className="cardTitle">Entrar na plataforma</h1>
        </div>

        <div className="cardBody">
          <form onSubmit={onSubmit} className={styles.form}>
            <div className="formGroup">
              <label htmlFor="username" className="formLabel formLabelRequired">Usuário</label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                type="text"
                className="textInput"
                required
                autoFocus
              />
            </div>

            <div className="formGroup">
              <label htmlFor="password" className="formLabel formLabelRequired">Senha</label>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="textInput"
                required
              />
            </div>

            {error && <p className="alertError">{error}</p>}

            <button type="submit" disabled={loading} className="primaryButton" aria-busy={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <footer className={styles.footerInfo}>
            <div><span className={styles.label}>IP:</span> {origin.ip}</div>
            <div><span className={styles.label}>Região:</span> {origin.location}</div>
          </footer>
        </div>
      </section>
    </main>
  )
}
