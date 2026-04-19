import { Rocket, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StatusBar } from '../dashboard/StatusBar';

const navLinks = [
  { label: 'Dashboard',   href: '/' },
  { label: 'Asteroids',   href: '/asteroids' },
  { label: 'Mars',        href: '/mars' },
  { label: 'Solar',       href: '/solar' },
  { label: 'Exoplanets',  href: '/exoplanets' },
  { label: 'ISS',         href: '/#iss' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href: string) => {
    const [path, hash] = href.split('#');
    const safeHash = hash ? `#${hash}` : '';
    
    if (path === '/' && !safeHash) {
      return location.pathname === '/' && !location.hash;
    }
    
    if (safeHash) {
      return location.pathname === path && location.hash === safeHash;
    }
    
    return location.pathname === path;
  };

  const handleNavClick = (href: string, closeMobile = false) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    const [path, hash] = href.split('#');
    const safeHash = hash ? `#${hash}` : '';
    const targetPath = path || location.pathname;

    if (targetPath !== location.pathname) {
      if (closeMobile) {
        setMobileOpen(false);
      }
      return;
    }

    if (safeHash) {
      e.preventDefault();
      const targetId = hash ?? '';
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      navigate(`${targetPath}${safeHash}`);
    }

    if (closeMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <header className="glass-header sticky top-0 z-50 w-full">
      {/* Dedicated status strip */}
      <div className="hidden md:block border-b border-white/5">
        <div className="px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto">
          <StatusBar />
        </div>
      </div>

      {/* Main navigation row */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 gap-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Rocket className="text-electric-blue w-6 h-6" />
          <span className="font-display font-bold text-lg tracking-wider text-white whitespace-nowrap">
            SPACE<span className="text-electric-blue"> CTRL</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2 ml-auto">
          {navLinks.map((l) => (
            <motion.a
              key={l.label}
              href={l.href}
              onClick={handleNavClick(l.href)}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.18, ease: [0.215, 0.61, 0.355, 1] }}
              className={`relative px-2 py-2 text-sm font-mono rounded-md tracking-[0.08em] ${
                isActive(l.href)
                  ? 'text-electric-blue text-glow'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="relative inline-block px-2">
                {l.label.toUpperCase()}
                {isActive(l.href) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-0 -bottom-1 h-px w-full bg-electric-blue shadow-[0_0_6px_rgba(0,240,255,0.55)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
              </span>
            </motion.a>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-white"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-space-dark px-4 pb-4 space-y-1">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={handleNavClick(l.href, true)}
              className={`block px-4 py-3 rounded-lg text-sm font-mono transition-colors ${
                isActive(l.href)
                  ? 'text-electric-blue bg-electric-blue/10'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {l.label.toUpperCase()}
            </a>
          ))}
          <div className="pt-3 overflow-x-auto pb-2 -mx-4 px-4">
            <StatusBar />
          </div>
        </div>
      )}
    </header>
  );
}
