import React, { useState } from 'react';
import { Compass, Menu, X, Shield, PhoneCall } from 'lucide-react';
import { SiteSettings } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  settings: SiteSettings;
  onOpenAdmin: () => void;
  onOpenQuestionnaire: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenAdmin,
  onOpenQuestionnaire,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const navLinks = [
    { label: 'Why Vietnam', href: '#why-vietnam' },
    { label: 'Inclusions', href: '#core-services' },
    { label: 'Living Packages', href: '#packages' },
    { label: 'Residences', href: '#accommodations' },
    { label: 'Why Choose Us', href: '#why-choose-us' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const elem = document.querySelector(href);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-b border-[#C9A45C]/25 text-white transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <a href="#" className="flex items-center gap-2.5 sm:gap-3.5 group text-left min-w-0 mr-2">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#C9A45C] to-[#A77A32] flex items-center justify-center text-[#0F172A] shadow-md shadow-[#C9A45C]/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <span className="font-brand-display text-[13px] min-[360px]:text-sm sm:text-lg md:text-xl font-bold tracking-[0.05em] min-[360px]:tracking-[0.08em] sm:tracking-[0.14em] md:tracking-[0.18em] text-white block uppercase whitespace-nowrap">
                {settings.brandName || "Wanderer's Journeys"}
              </span>
              <span className="text-[9px] min-[360px]:text-[10px] sm:text-xs tracking-normal sm:tracking-wider text-[#C9A45C] font-light block italic truncate max-w-[155px] min-[360px]:max-w-[210px] sm:max-w-none">
                {settings.slogan || 'Where curiosity leads, possibilities unfold'}
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map(link => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="text-sm tracking-wide text-slate-200 hover:text-[#C9A45C] transition-colors font-medium py-1 cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3.5">
            {/* Direct Inquiry CTA */}
            <button
              onClick={onOpenQuestionnaire}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#C9A45C] to-[#A77A32] text-[#0F172A] text-sm font-semibold tracking-wide hover:from-[#d8b368] hover:to-[#b8893d] transition-all shadow-md shadow-[#C9A45C]/25 hover:shadow-lg hover:shadow-[#C9A45C]/35 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Request a Proposal
            </button>

            {/* Login Access */}
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border-2 border-slate-600 hover:border-[#C9A45C] transition-all cursor-pointer shadow-sm"
              title={user ? "Access Admin Dashboard" : "Access Management Portal"}
            >
              <Shield className="w-4 h-4 text-[#C9A45C]" />
              <span>{user ? 'Access Admin Dashboard' : 'Admin Login'}</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-200 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0F172A] border-b border-[#C9A45C]/30 px-5 pt-3 pb-6 space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-col space-y-2 pt-2 pb-3 border-b border-slate-800">
            {navLinks.map(link => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="text-left py-2 text-base font-medium text-slate-200 hover:text-[#C9A45C] transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenQuestionnaire();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A45C] to-[#A77A32] text-[#0F172A] font-semibold text-center shadow-md cursor-pointer"
            >
              Request a Proposal
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="w-full py-3 rounded-xl border-2 border-slate-600 hover:border-[#C9A45C] bg-slate-800 text-white text-base font-semibold flex items-center justify-center gap-2 hover:bg-slate-750 transition-colors shadow-sm"
            >
              <Shield className="w-4 h-4 text-[#C9A45C]" />
              <span>{user ? 'Access Admin Dashboard' : 'Admin Login'}</span>
            </button>
          </div>

          {settings.contactPhone && (
            <div className="pt-2 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-[#C9A45C]" />
              <span>Concierge Desk: {settings.contactPhone}</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
