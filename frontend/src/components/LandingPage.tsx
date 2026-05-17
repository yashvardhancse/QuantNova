import { useState } from 'react';

interface LandingPageProps {
  onEnterApp?: () => void;
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landing-page">
      <header className="landing-navbar terminal-panel">
        <div className="landing-navbar-inner">
          <div className="brand-lockup nav-brand">
            <div className="brand-mark">QL</div>
            <div>
              <h1>QuantNova</h1>
              <span>Open-source backtesting terminal</span>
            </div>
          </div>

          <button
            className={`nav-toggle ${menuOpen ? 'open' : ''}`}
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          />

          <nav className={`landing-nav ${menuOpen ? 'active' : ''}`} aria-label="Primary navigation">
            <a href="#features" onClick={() => setMenuOpen(false)}>
              Features
            </a>
            <a href="#about" onClick={() => setMenuOpen(false)}>
              About
            </a>
            <a href="#preview" onClick={() => setMenuOpen(false)}>
              Preview
            </a>
          </nav>

          <div className="nav-actions">
            <a className="ghost-button" href="https://github.com/yashvardhancse/QuantNova" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <button className="purple-button" type="button" onClick={onEnterApp}>
              Launch Terminal
            </button>
          </div>
        </div>
      </header>

      <section className="landing-hero" id="preview">
        <div className="hero-copy">
          <span className="eyebrow">Quantitative trading terminal</span>
          <h2>Backtest OHLCV strategies with a premium dark dashboard.</h2>
          <p className="muted">
            QuantNova is contributor-focused and intentionally scoped as an MVP. It combines React + Vite frontend,
            FastAPI backend, Binance OHLCV market data, indicator analytics, and strategy testing in a clean quant terminal.
          </p>

          <div className="hero-actions">
            <button className="purple-button" type="button" onClick={onEnterApp}>
              Launch Terminal
            </button>
            <a className="ghost-button" href="https://github.com/yashvardhancse/QuantNova" target="_blank" rel="noreferrer">
              View GitHub
            </a>
          </div>

          <div className="trust-strip">
            <span>Open Source</span>
            <span>React + FastAPI</span>
            <span>Binance OHLCV</span>
            <span>Technical Indicators</span>
            <span>Backtesting Engine</span>
          </div>
        </div>

        <div className="hero-preview">
          <div className="preview-shell">
            <div className="preview-topbar">
              <span className="preview-dot active" />
              <span className="preview-dot" />
              <span className="preview-dot" />
              <div className="preview-status">BTCUSDT • 15m</div>
            </div>

            <div className="preview-panel">
              <div className="preview-chart-panel">
                <div className="preview-chart-grid" />
                <div className="preview-chart-line" />
              </div>
              <div className="preview-side-panel">
                <div className="preview-card small-card">
                  <span>Indicators</span>
                  <strong>SMA / EMA / RSI</strong>
                </div>
                <div className="preview-card large-card">
                  <span>Equity</span>
                  <strong>+12.4%</strong>
                </div>
                <div className="preview-card small-card">
                  <span>Strategy</span>
                  <strong>MA Crossover</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="landing-section terminal-panel">
        <h3>Features</h3>
        <div className="features-grid">
          <article className="feature-card">
            <span className="feature-icon icon-data" />
            <div>
              <strong>Binance OHLCV fetch</strong>
              <p className="muted">Fetch Binance candle data for live market context and historical analysis.</p>
            </div>
          </article>
          <article className="feature-card">
            <span className="feature-icon icon-file" />
            <div>
              <strong>CSV / XLSX upload</strong>
              <p className="muted">Import OHLCV files with validation for quick backtesting data prep.</p>
            </div>
          </article>
          <article className="feature-card">
            <span className="feature-icon icon-signal" />
            <div>
              <strong>SMA, EMA, RSI, Bollinger Bands</strong>
              <p className="muted">Run essential technical indicators with backend and local fallback support.</p>
            </div>
          </article>
          <article className="feature-card">
            <span className="feature-icon icon-backtest" />
            <div>
              <strong>MA crossover backtesting</strong>
              <p className="muted">Evaluate moving-average crossover strategies with equity and trade summaries.</p>
            </div>
          </article>
          <article className="feature-card">
            <span className="feature-icon icon-chart" />
            <div>
              <strong>Candlestick charts</strong>
              <p className="muted">Visualize price action with clean chart previews and terminal-style overlays.</p>
            </div>
          </article>
          <article className="feature-card">
            <span className="feature-icon icon-log" />
            <div>
              <strong>Equity curve + trade log</strong>
              <p className="muted">Inspect backtest performance with trade detail and analytics.</p>
            </div>
          </article>
          <article className="feature-card">
            <span className="feature-icon icon-fallback" />
            <div>
              <strong>Backend fallback</strong>
              <p className="muted">Local calculation fallback keeps the UI functional when API is unavailable.</p>
            </div>
          </article>
          <article className="feature-card">
            <span className="feature-icon icon-api" />
            <div>
              <strong>FastAPI backend</strong>
              <p className="muted">Python-based validation and analytics power the terminal workflow.</p>
            </div>
          </article>
        </div>
      </section>

      <section id="about" className="landing-section terminal-panel">
        <div className="about-grid">
          <div>
            <h3>About QuantNova</h3>
            <p className="muted">
              QuantNova is a technical open-source platform for OHLCV market data, indicator analytics, and strategy testing.
              It is built for contributors who want a clean quant workflow without brokerage or auth complexity.
            </p>
          </div>
          <div>
            <ul className="about-list">
              <li>Load market data, CSV/XLSX files, or Binance OHLCV candles.</li>
              <li>Analyze SMA, EMA, RSI, and Bollinger Bands.</li>
              <li>Test moving-average crossover strategies and review performance.</li>
              <li>React + FastAPI architecture with beginner-friendly contributor workflow.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="how-it-works landing-section terminal-panel">
        <h3>How it works</h3>
        <div className="workflow-grid">
          <article className="workflow-card">
            <span className="workflow-step">1</span>
            <strong>Load Market Data</strong>
            <p className="muted">Use Binance candles, sample data, or upload your own OHLCV files.</p>
          </article>
          <article className="workflow-card">
            <span className="workflow-step">2</span>
            <strong>Configure Strategy</strong>
            <p className="muted">Set moving-average windows, fee rates, and date ranges for your backtest.</p>
          </article>
          <article className="workflow-card">
            <span className="workflow-step">3</span>
            <strong>Run Backtest & Analyze</strong>
            <p className="muted">Review trades, equity curves, and indicator signals in the terminal UI.</p>
          </article>
        </div>
      </section>

      <section className="preview-section landing-section terminal-panel">
        <h3>Dashboard preview</h3>
        <div className="preview-grid-panel">
          <div className="preview-card chart-card">
            <span>Candlestick</span>
            <strong>Chart view</strong>
          </div>
          <div className="preview-card metrics-card">
            <span>Performance</span>
            <strong>Sharpe, Drawdown, P/L</strong>
          </div>
          <div className="preview-card log-card">
            <span>Trade log</span>
            <strong>Entry / exit detail</strong>
          </div>
        </div>
      </section>

      <section className="cta-section terminal-panel">
        <div>
          <h3>Start exploring QuantNova</h3>
          <p className="muted">Launch the terminal to begin backtesting with OHLCV data, indicators, and strategy analytics.</p>
        </div>
        <div className="cta-actions">
          <button className="purple-button" type="button" onClick={onEnterApp}>
            Launch Terminal
          </button>
          <a className="ghost-button" href="https://github.com/yashvardhancse/QuantNova" target="_blank" rel="noreferrer">
            View GitHub
          </a>
        </div>
      </section>

      <footer className="landing-footer terminal-panel">
        <div className="footer-brand">
          <strong>QuantNova</strong>
          <p className="muted">Open-source quantitative backtesting foundation with a premium dark dashboard feel.</p>
        </div>
        <div className="footer-links">
          <a href="https://github.com/yashvardhancse/QuantNova" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="/docs/GOOD_FIRST_ISSUES.md">Docs</a>
          <a href="/LICENSE">License</a>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
