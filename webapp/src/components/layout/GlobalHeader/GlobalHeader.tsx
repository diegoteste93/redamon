'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, Crosshair, FolderOpen, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ProjectSelector } from './ProjectSelector'
import { UserSelector } from './UserSelector'
import { useAuth } from '@/hooks/useAuth'
import styles from './GlobalHeader.module.css'

const navItems = [
  { label: 'Projects', href: '/projects', icon: <FolderOpen size={14} /> },
  { label: 'Red Zone', href: '/graph', icon: <Crosshair size={14} /> },
  { label: 'Reports', href: '/reports', icon: <BarChart3 size={14} /> },
]

export function GlobalHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: authUser } = useAuth()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Image src="/logo.png" alt="RedAmon" width={28} height={28} className={styles.logoImg} />
        <span className={styles.logoText}>
          <span className={styles.logoAccent}>Red</span>Amon
        </span>
      </div>

      <div className={styles.spacer} />

      <div className={styles.actions}>
        <nav className={styles.nav}>
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className={styles.divider} />

        {authUser?.role !== 'CLIENT_READONLY' && <ProjectSelector />}

        <div className={styles.divider} />

        <ThemeToggle />

        <div className={styles.divider} />

        {authUser?.role !== 'CLIENT_READONLY' && <UserSelector />}

        {authUser && (
          <>
            <span style={{ fontSize: 12, opacity: 0.8 }}>{authUser.name} · {authUser.role}</span>
            <button onClick={handleLogout} className={styles.navItem} title="Logout">
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}
