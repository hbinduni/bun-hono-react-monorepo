import type {Item} from '@shared/types'
import {formatDate} from '@shared/utils'
import {useEffect, useState} from 'react'
import {getItems} from '@/api/items'
import viteLogo from '/vite.svg'
import reactLogo from './assets/react.svg'
import './App.css'

function App() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    getItems()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank" rel="noopener">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Bun + Hono + React Monorepo</h1>
      <div className="card">
        <h2>API Data Example</h2>
        {loading && <p>Loading items...</p>}
        {error && <p style={{color: 'red'}}>Error: {error}</p>}
        {!loading && !error && (
          <ul style={{textAlign: 'left', maxWidth: '500px', margin: '0 auto'}}>
            {items.map((item) => (
              <li key={item.id} style={{marginBottom: '1rem'}}>
                <strong>Title:</strong> {item.title}
                <br />
                <strong>Description:</strong> {item.description}
                <br />
                <strong>Date:</strong> {formatDate(item.createdAt)}
              </li>
            ))}
          </ul>
        )}
        <p style={{marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8}}>
          ✨ This data comes from the Hono backend using shared types!
        </p>
      </div>
      <p className="read-the-docs">Monorepo Template with Type Safety</p>
    </>
  )
}

export default App
