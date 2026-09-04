import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import type { AppPage } from '../types'

type StudioPageProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
}

export default function StudioPage({ activePage, onNavigate }: StudioPageProps) {
  return (
    <div className="ls-app-shell">
      <TopBar activePage={activePage} onNavigate={onNavigate} />

      <main className="ls-page-content">
        <section className="ls-panel ls-page-panel">
          <div className="ls-panel-header compact">
            <h3>Studio</h3>
            <span>Session control</span>
          </div>

          <div className="ls-studio-grid">
            <div className="ls-studio-card">
              <span className="ls-studio-tag">Mix desk</span>
              <h2>Current session</h2>
              <p>Midnight Echo — 11 stems loaded</p>
              <div className="ls-waveform ls-waveform-compact">
                {Array.from({ length: 18 }).map((_, index) => (
                  <span key={index} style={{ height: `${20 + ((index * 7) % 70)}%` }} />
                ))}
              </div>
            </div>

            <div className="ls-studio-card muted">
              <span className="ls-studio-tag">Transport</span>
              <h2>Automation</h2>
              <ul>
                <li>Comp stack: 4 tracks</li>
                <li>Reverb send: 62%</li>
                <li>Master bus: ready</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
