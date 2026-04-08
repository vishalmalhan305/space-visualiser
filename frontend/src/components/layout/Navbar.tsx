import { Rocket, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { StatusBar } from '../dashboard/StatusBar';

const navLinks = [
  { label: 'Dashboard', href: '/',          active: true  },
  { label: 'Asteroids',  href: '/#asteroids', active: false },
  { label: 'Mars',       href: '/mars',      active: false },
  { label: 'Solar',      href: '/#solar',     active: false },
  { label: 'ISS',        href: '/#iss',       active: false },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="glass-header sticky top-0 z-50 w-full">
      {/* Main row */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Rocket className="text-electric-blue w-6 h-6" />
          <span className="font-display font-bold text-lg tracking-wider text-white whitespace-nowrap">
            SPACE<span className="text-electric-blue"> CTRL</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`px-4 py-2 text-sm font-mono transition-colors rounded-md ${
                l.active
                  ? 'text-electric-blue border-b-2 border-electric-blue pb-1 text-glow'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              {l.label.toUpperCase()}
            </a>
          ))}
        </nav>

        {/* Status bar (desktop) */}
        <div className="hidden lg:flex items-center">
          <StatusBar />
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-white"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Status bar row (tablet) */}
      <div className="hidden md:flex lg:hidden items-center px-6 pb-2 overflow-x-auto">
        <StatusBar />
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-space-dark px-4 pb-4 space-y-1">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`block px-4 py-3 rounded-lg text-sm font-mono transition-colors ${
                l.active
                  ? 'text-electric-blue bg-electric-blue/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {l.label.toUpperCase()}
            </a>
          ))}
          <div className="pt-3">
            <StatusBar />
          </div>
        </div>
      )}
    </header>
  );
}
