'use client'

import { usePathname } from 'next/navigation'
import { GlobalHeader } from '../GlobalHeader'
import { Footer } from '../Footer'
import styles from './AppLayout.module.css'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login'

  if (isAuthPage) {
    return <main className={styles.main}>{children}</main>
  }

  return (
    <div className={styles.layout}>
      <GlobalHeader />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  )
}
