'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Satellite, BarChart3, Gamepad2, Rocket } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The hero renders a fixed, full-viewport map underneath, so the bar stays
  // transparent there until the user scrolls. Every other route scrolls
  // content under the bar, so it is solid from the start.
  const solid = pathname !== '/' || isScrolled;

  const links = [
    { href: '/', label: 'Home', icon: Satellite },
    { href: '/data-analysis', label: 'Data Analysis', icon: BarChart3 },
    { href: '/game', label: 'Game', icon: Gamepad2 },
    { href: '/beyond', label: 'Beyond 2025', icon: Rocket },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solid
          ? 'bg-black/80 backdrop-blur-md border-b border-white/10'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
            <Satellite className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            <span className="text-blue-400">SAR</span>realists
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium transition-colors group"
              >
                <span className={`flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                  <Icon className="w-4 h-4" />
                  {link.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
