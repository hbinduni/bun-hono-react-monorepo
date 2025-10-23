import type {Feedback} from '@shared/types'
import {formatDate} from '@shared/utils'
import {useEffect, useState} from 'react'
import {getFeedback} from '@/api/feedback'
import viteLogo from '/vite.svg'
import reactLogo from './assets/react.svg'
import './App.css'

function App() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    getFeedback()
      .then(setFeedbacks)
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
      <h1>User Feedback Monorepo</h1>
      <div className="card">
        <h2>Feedback List</h2>
        {loading && <p>Loading feedback...</p>}
        {error && <p style={{color: 'red'}}>Error: {error}</p>}
        {!loading && !error && (
          <ul style={{textAlign: 'left', maxWidth: '500px', margin: '0 auto'}}>
            {feedbacks.map((feedback) => (
              <li key={feedback.id} style={{marginBottom: '1rem'}}>
                <strong>Rating:</strong> {feedback.rating}/5
                <br />
                <strong>Message:</strong> {feedback.message}
                <br />
                <strong>Date:</strong> {formatDate(feedback.createdAt)}
              </li>
            ))}
          </ul>
        )}
        <p style={{marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8}}>
          ✨ This data comes from the Hono backend using shared types!
        </p>
      </div>
      <p className="read-the-docs">Bun + Hono + React + Vite Monorepo</p>
    </>
  )
}

export default App
