import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import type { AppPage } from '../types'

type ExplorePageProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
}

export default function ExplorePage({ activePage, onNavigate }: ExplorePageProps) {
  return (
    <div className="ls-app-shell">
      <TopBar activePage={activePage} onNavigate={onNavigate} />

      <main className="ls-page-content">
        <section className="ls-panel ls-page-panel">
          <div className="ls-panel-header compact">
            <h3>Explore</h3>
            <span>Live network</span>
          </div>
          <div className="ls-card-grid">
            <article className="ls-recommend-card">
              <div className="ls-card-visual">
                <img
                  src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80"
                  alt="explore one"
                />
                <span className="ls-card-badge">Featured</span>
              </div>
              <div className="ls-card-body">
                <div className="ls-card-head">
                  <h3>Night Circuit</h3>
                  <span>96%</span>
                </div>
                <p className="ls-card-role">Berlin live session</p>
                <p className="ls-card-desc">A dark, rhythmic fusion of techno textures and gritty vocal layers.</p>
              </div>
            </article>

            <article className="ls-recommend-card">
              <div className="ls-card-visual">
                <img
                  src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80"
                  alt="explore two"
                />
                <span className="ls-card-badge">Trend</span>
              </div>
              <div className="ls-card-body">
                <div className="ls-card-head">
                  <h3>Velvet Static</h3>
                  <span>92%</span>
                </div>
                <p className="ls-card-role">Synth-pop duo</p>
                <p className="ls-card-desc">A shimmering mix of analog percussion and intimate, cinematic hooks.</p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
