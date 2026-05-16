export function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="brand-mark small">QL</div>
          <div>
            <span className="footer-brand-name">QuantNova</span>
            <p className="footer-tagline">Open-source algorithmic trading terminal</p>
          </div>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          <div className="footer-link-group">
            <span className="footer-link-heading">App</span>
            <a href="#terminal">Terminal</a>
            <a href="#strategies">Strategies</a>
            <a href="#backtests">Backtests</a>
            <a href="#history">History</a>
          </div>
          <div className="footer-link-group">
            <span className="footer-link-heading">Resources</span>
            <a href="https://github.com/yashvardhancse/QuantNova" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a
              href="https://github.com/yashvardhancse/QuantNova/issues"
              target="_blank"
              rel="noreferrer"
            >
              Issues
            </a>
            <a
              href="https://github.com/yashvardhancse/QuantNova/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noreferrer"
            >
              Contributing
            </a>
          </div>
        </nav>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} QuantNova. Open-source under MIT License.</span>
        <div className="footer-social">
          <a href="https://github.com/yashvardhancse/QuantNova" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
