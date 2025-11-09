import {config} from '@/config'
import packageJson from '../../../package.json'

export function Footer() {
  return (
    <footer>
      <p className="read-the-docs">Monorepo Template with Type Safety</p>
      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          fontSize: '0.85rem',
          opacity: 0.7,
        }}
      >
        <div style={{marginBottom: '0.5rem'}}>
          <strong>Version:</strong> {packageJson.version}
        </div>
        <div>
          <strong>API URL:</strong> {config.VITE_API_URL}
        </div>
      </div>
    </footer>
  )
}
