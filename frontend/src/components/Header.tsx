import { useState } from 'react';

// Using the exact sections from your App.tsx
export type Section = 'Terminal' | 'Strategies' | 'Portfolio' | 'Backtests' | 'History' | 'Monitor';

interface HeaderProps {
  currentSection: Section;
  onNavigate: (section: Section) => void;
}

const navItems: Section[] = ['Terminal', 'Strategies', 'Portfolio', 'Backtests', 'History'];

export function Header({ currentSection, onNavigate }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (item: Section) => {
    onNavigate(item);
    setIsMobileMenuOpen(false); // Close mobile menu on click
  };

  return (
    <header className="glass-header">
      <div className="header-container">
        {/* Brand Logo */}
        <div
          className="header-brand"
          onClick={() => handleNavClick('Terminal')}
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-mark">QL</div>
          <span className="brand-text">QuantNova</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="header-nav-desktop">
          {navItems.map((item) => (
            <button
              key={item}
              className={`header-nav-item ${currentSection === item ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isMobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <nav className="header-nav-mobile">
          {navItems.map((item) => (
            <button
              key={item}
              className={`header-nav-item mobile ${currentSection === item ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
