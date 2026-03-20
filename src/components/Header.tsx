import { Link, useMatchRoute } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const matchRoute = useMatchRoute()
  const isHome = matchRoute({ to: '/' })
  const isWordOrder = matchRoute({ to: '/word-order' })

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-lg">
      <nav className="mx-auto flex max-w-lg items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 text-[var(--text)] no-underline">
            <span className="text-xl">字</span>
            <span className="text-sm font-bold tracking-tight">ZW Games</span>
          </a>
          <div className="flex items-center gap-1">
            <Link to="/" className={`nav-link ${isHome ? 'active' : ''}`}>
              Suche
            </Link>
            <Link to="/word-order" className={`nav-link ${isWordOrder ? 'active' : ''}`}>
              Satzstellung
            </Link>
          </div>
        </div>
        <ThemeToggle />
      </nav>
    </header>
  )
}
