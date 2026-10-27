import React from 'react';
import { Compass, Phone, Mail, MapPin, Shield } from 'lucide-react';
import { SiteSettings } from '../types';

interface FooterProps {
  settings: SiteSettings;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenPrivacy,
  onOpenTerms,
  onOpenAdmin,
}) => {
  return (
    <footer className="bg-[#0B1120] text-white border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
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

          {/* Coastal Destinations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#C9A45C] mb-4">
              Coastal Living Hubs
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <strong className="text-white block font-medium">Da Nang Coastal Hub</strong>
                <span className="text-slate-400">My Khe Beach & Son Tra Peninsula Residences</span>
              </li>
              <li>
                <strong className="text-white block font-medium">Nha Trang Tropical Bay</strong>
                <span className="text-slate-400">Tran Phu Waterfront & Marina Promenade</span>
              </li>
              <li>
                <strong className="text-white block font-medium">Ho Chi Minh City</strong>
                <span className="text-slate-400">Thao Dien Expat Quarter & River Residences</span>
              </li>
            </ul>
          </div>

          {/* Living Packages */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#C9A45C] mb-4">
              Living Options
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>• Private Discovery Tour (7 - 14 Days)</li>
              <li>• 30-Day Living Trial</li>
              <li>• Snowbird Special (30 - 90 Days)</li>
              <li>• Six-Month Exploratory Stay</li>
              <li>• Full Retirement Living (12 Months)</li>
              <li>• Bespoke Regional Excursions</li>
            </ul>
          </div>

          {/* Contact & Concierge Information */}
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

            <div className="pt-2">
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#C9A45C]" />
                <span>Administrator & Staff CMS Portal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Regulatory Disclaimer */}
        <div className="pt-8 border-t border-slate-800 text-xs text-slate-400 leading-relaxed font-light space-y-4">
          <p>
            {settings.footerNote ||
              'Wanderer’s Journeys provides premium hospitality, lifestyle curation, and residential advisory for international seniors and explorers in Vietnam. Independent legal, visa, and financial services are facilitated through accredited licensed partners.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/60 text-[11px]">
            <span>{settings.copyright || '© 2026 Wanderer’s Journeys Hospitality Ltd. All rights reserved.'}</span>
            <div className="flex items-center gap-6">
              <button
                onClick={onOpenPrivacy}
                className="hover:text-[#C9A45C] transition-colors cursor-pointer underline"
              >
                Privacy Notice & GDPR Statement
              </button>
              <button
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
