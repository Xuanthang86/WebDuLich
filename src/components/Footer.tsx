import React from 'react';
import { Compass, Phone, Mail, MapPin, Shield } from 'lucide-react';
import { SiteSettings, DestinationHubItem } from '../types';

interface FooterProps {
  settings: SiteSettings;
  destinationHubs?: DestinationHubItem[];
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  destinationHubs,
  onOpenPrivacy,
  onOpenTerms,
  onOpenAdmin,
}) => {
  const handlePackageClick = (titleKeywords: string) => {
    const section = document.getElementById('packages');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        const headings = document.querySelectorAll('#packages h3');
        for (const h of headings) {
          if (h.textContent && h.textContent.toLowerCase().includes(titleKeywords.toLowerCase())) {
            h.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
          }
        }
      }, 300);
    }
  };

  const handleCityClick = (city: string) => {
    window.dispatchEvent(new CustomEvent('wj-select-city', { detail: city }));
    const section = document.getElementById('accommodations');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const packageLinks = [
    { label: 'Private Discovery Tour (7 - 14 Days)', search: 'Discovery' },
    { label: '30-Day Living Trial', search: 'Trial' },
    { label: 'Snowbird Special (30 - 90 Days)', search: 'Snowbird' },
    { label: 'Six-Month Exploratory Stay', search: 'Exploratory' },
    { label: 'Full Retirement Living (12 Months)', search: 'Retirement' },
    { label: 'Bespoke Regional Excursions', search: 'Living' },
  ];

  return (
    <footer className="bg-[#0B1120] text-white border-t border-slate-800 pt-8 pb-6 sm:pt-16 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10 mb-8 sm:mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A45C] to-[#A77A32] flex items-center justify-center text-[#0F172A] shadow-md">
                <Compass className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="font-brand-display text-lg font-bold tracking-wider text-white">
                {settings.brandName || "Wanderer's Journeys"}
              </span>
            </div>

            <p className="font-serif italic text-sm text-[#C9A45C]">
              "{settings.slogan || 'Where curiosity leads, possibilities unfold'}"
            </p>

            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Turnkey Westerner retirement communities and exploratory long-term residency across Da Nang, Nha Trang, and Ho Chi Minh City.
            </p>

            {/* Social Links */}
            <div className="pt-2 flex items-center gap-3">
              {settings.socialLinks?.facebook && (
                <a
                  href={settings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#C9A45C] hover:text-[#0F172A] flex items-center justify-center text-slate-300 transition-colors"
                  aria-label="Follow Wanderer's Journeys on Facebook"
                >
                  <span className="text-xs font-bold">FB</span>
                </a>
              )}
              {settings.socialLinks?.instagram && (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#C9A45C] hover:text-[#0F172A] flex items-center justify-center text-slate-300 transition-colors"
                  aria-label="Follow Wanderer's Journeys on Instagram"
                >
                  <span className="text-xs font-bold">IG</span>
                </a>
              )}
              {settings.socialLinks?.tiktok && (
                <a
                  href={settings.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#C9A45C] hover:text-[#0F172A] flex items-center justify-center text-slate-300 transition-colors"
                  aria-label="Follow Wanderer's Journeys on TikTok"
                >
                  <span className="text-xs font-bold">TT</span>
                </a>
              )}
            </div>
          </div>

          {/* Coastal Destinations (Clickable links to accommodations hub) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#C9A45C] mb-3 sm:mb-4">
              Coastal Living Hubs
            </h4>
            <ul className="space-y-3 text-xs text-slate-300">
              {(destinationHubs && destinationHubs.length > 0
                ? destinationHubs
                : [
                    { name: 'Da Nang', hubName: 'Da Nang Coastal Hub', tagline: 'My Khe Beach & Son Tra Peninsula Residences' },
                    { name: 'Nha Trang', hubName: 'Nha Trang Tropical Bay', tagline: 'Tran Phu Waterfront & Marina Promenade' },
                    { name: 'Ho Chi Minh City', hubName: 'Ho Chi Minh City', tagline: 'Thao Dien Expat Quarter & River Residences' },
                  ]
              ).map((hub: any) => {
                const cityName = hub.city || hub.name;
                return (
                  <li key={cityName}>
                    <button
                      type="button"
                      onClick={() => handleCityClick(cityName)}
                      className="text-left w-full group cursor-pointer"
                    >
                      <strong className="text-white block font-medium group-hover:text-[#C9A45C] transition-colors flex items-center gap-1">
                        <span>{hub.hubName || `${cityName} Hub`}</span>
                        <span className="text-[#C9A45C] text-[10px] group-hover:translate-x-1 transition-transform">→</span>
                      </strong>
                      <span className="text-slate-400 text-[11px] group-hover:text-slate-300 transition-colors">
                        {hub.tagline || hub.description || `${cityName} Living Sanctuary`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Living Packages (Clickable links to packages section) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#C9A45C] mb-4">
              Living Options
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {packageLinks.map(pkg => (
                <li key={pkg.label}>
                  <button
                    type="button"
                    onClick={() => handlePackageClick(pkg.search)}
                    className="text-left text-slate-300 hover:text-[#C9A45C] hover:underline transition-colors cursor-pointer flex items-center gap-1.5 group"
                  >
                    <span className="text-[#C9A45C] group-hover:translate-x-0.5 transition-transform">•</span>
                    <span>{pkg.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Concierge Information (Admin portal link removed as requested) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#C9A45C] mb-4">
              Saigon Executive Desk
            </h4>
            <div className="flex items-start gap-2.5 text-xs text-slate-300 font-light">
              <MapPin className="w-4 h-4 text-[#C9A45C] shrink-0 mt-0.5" />
              <span>{settings.address || 'Level 18, Saigon Centre Tower 2, 67 Le Loi, District 1, Ho Chi Minh City, Vietnam'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300 font-light">
              <Phone className="w-4 h-4 text-[#C9A45C] shrink-0" />
              <span>{settings.contactPhone || '+84 (0) 28 3822 5588'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300 font-light">
              <Mail className="w-4 h-4 text-[#C9A45C] shrink-0" />
              <span>{settings.contactEmail || 'info@wanderersjourneys.com'}</span>
            </div>
          </div>
        </div>

        {/* Regulatory Disclaimer & Centered Footer Legal */}
        <div className="pt-6 sm:pt-8 border-t border-slate-800 text-xs text-slate-400 leading-relaxed font-light space-y-3 sm:space-y-4">
          <p className="text-center sm:text-left text-[11px] sm:text-xs">
            {settings.footerNote ||
              'Wanderer’s Journeys provides premium hospitality, lifestyle curation, and residential advisory for international seniors and explorers in Vietnam. Independent legal, visa, and financial services are facilitated through accredited licensed partners.'}
          </p>

          <div className="pt-4 sm:pt-6 border-t border-slate-800/60 flex flex-col items-center justify-center text-center space-y-2">
            <div className="text-[11px] sm:text-xs text-slate-300 font-normal">
              {settings.copyright || '© 2026 Wanderer’s Journeys Hospitality Ltd. All rights reserved.'}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] text-slate-400">
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="hover:text-[#C9A45C] transition-colors cursor-pointer underline"
              >
                Privacy Notice & GDPR Statement
              </button>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <button
                type="button"
                onClick={onOpenTerms}
                className="hover:text-[#C9A45C] transition-colors cursor-pointer underline"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
