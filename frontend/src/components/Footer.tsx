type FooterSection = 'Terminal' | 'Strategies' | 'Portfolio' | 'Backtests' | 'History' | 'Monitor';

interface FooterProps {
  onNavigate: (section: FooterSection) => void;
}

const quickLinks: FooterSection[] = ['Terminal', 'Strategies', 'Portfolio', 'Backtests', 'History'];

const socialLinks = [
  {
    label: 'GitHub',
    href: 'https://github.com/QuantNova-Jyotikri',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.05.78 2.13v3.16c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
        />
      </svg>
    ),
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M18.244 2H21l-6.52 7.45L22 22h-6.78l-4.71-6.16L4.96 22H2.2l7-8L2 2h6.91l4.27 5.66L18.244 2Zm-2.38 18h1.65L8.21 4h-1.7l9.354 16Z"
        />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z"
        />
      </svg>
    ),
  },
  {
    label: 'Discord',
    href: 'https://discord.com',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20.317 4.37A19.79 19.79 0 0 0 16.558 3a13.4 13.4 0 0 0-.61 1.26 18.27 18.27 0 0 0-5.487 0A12.7 12.7 0 0 0 9.85 3a19.74 19.74 0 0 0-3.76 1.37C2.61 9.59 1.66 14.68 2.13 19.7a19.9 19.9 0 0 0 6.06 3.07 14.5 14.5 0 0 0 1.27-2.06 12.94 12.94 0 0 1-2-1c.17-.13.34-.26.5-.39a14.18 14.18 0 0 0 12.07 0c.17.13.33.26.5.39a12.9 12.9 0 0 1-2 1c.36.71.78 1.4 1.27 2.06a19.86 19.86 0 0 0 6.06-3.07c.55-5.84-.93-10.88-3.93-15.33ZM8.52 16.74c-1.18 0-2.16-1.08-2.16-2.4 0-1.32.95-2.41 2.16-2.41s2.18 1.09 2.16 2.41c0 1.32-.95 2.4-2.16 2.4Zm6.96 0c-1.18 0-2.16-1.08-2.16-2.4 0-1.32.95-2.41 2.16-2.41s2.18 1.09 2.16 2.41c0 1.32-.95 2.4-2.16 2.4Z"
        />
      </svg>
    ),
  },
];

const resourceLinks = [
  { label: 'Documentation', href: '#docs' },
  { label: 'Contributing', href: '#contributing' },
  { label: 'Changelog', href: '#changelog' },
  { label: 'License (MIT)', href: '#license' },
];

export function Footer({ onNavigate }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-labelledby="site-footer-heading">
      <h2 id="site-footer-heading" className="visually-hidden">
        Site footer
      </h2>

      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <div className="brand-lockup">
            <div className="brand-mark">QL</div>
            <div>
              <h3>QuantNova</h3>
              <span>Open-source quant terminal</span>
            </div>
          </div>
          <p className="site-footer-tagline">
            A research-first workspace for backtesting, indicators, and market intuition. Built by
            the community, free for everyone.
          </p>
        </div>

        <div className="site-footer-column">
          <h4>Navigate</h4>
          <ul>
            {quickLinks.map((link) => (
              <li key={link}>
                <button type="button" onClick={() => onNavigate(link)}>
                  {link}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="site-footer-column">
          <h4>Resources</h4>
          <ul>
            {resourceLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="site-footer-column">
          <h4>Connect</h4>
          <ul className="site-footer-social">
            {socialLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  title={link.label}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="site-footer-bottom">
        <small>&copy; {year} QuantNova. Released under the MIT License.</small>
        <small>Built with care for the open-source quant community.</small>
      </div>
    </footer>
  );
}
