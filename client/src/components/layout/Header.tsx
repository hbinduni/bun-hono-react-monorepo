import reactLogo from '@/assets/react.svg'
import viteLogo from '/vite.svg'

export function Header() {
  return (
    <header>
      <div>
        <a href="https://vite.dev" target="_blank" rel="noopener">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Bun + Hono + React Monorepo</h1>
    </header>
  )
}
