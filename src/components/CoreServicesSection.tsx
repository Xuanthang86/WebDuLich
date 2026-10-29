import React from 'react';
import {
  Home,
  Zap,
  Sparkles,
  UserCheck,
  Wifi,
  FileCheck2,
  HeartPulse,
  Landmark,
  Plus,
  Compass,
} from 'lucide-react';
import { CoreServiceItem, AdditionalServiceItem } from '../types';

interface CoreServicesSectionProps {
  core: CoreServiceItem;
  additional: AdditionalServiceItem[];
  onOpenQuestionnaire: () => void;
}

export const CoreServicesSection: React.FC<CoreServicesSectionProps> = ({
  core,
  additional,
  onOpenQuestionnaire,
}) => {
  return (
    <section id="core-services" className="py-12 sm:py-16 md:py-20 bg-[#F7F3EA] text-[#0F172A] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="text-xs sm:text-sm font-semibold tracking-widest text-[#A77A32] uppercase mb-2">
            The Wanderer’s Standard
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] mb-4">
            Turnkey Living Inclusions & Benefits
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Every long-term stay is designed as a frictionless, fully serviced sanctuary so you can
            immerse yourself in passions, relaxation, and local discoveries.
          </p>
        </div>

        {/* Highlight Card: Core Residence Package */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-md p-6 sm:p-10 mb-10 sm:mb-12 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-8 border-b border-stone-100 gap-6">
            <div>
              <div className="inline-block px-3 py-1 rounded-md bg-[#C9A45C]/15 text-[#A77A32] text-xs font-semibold uppercase tracking-wider mb-2">
                All-Inclusive Living Baseline
              </div>
              <h3 className="font-serif text-3xl font-bold text-[#0F172A]">
                {core.title || 'Two-Bedroom Executive Serviced Living'}
              </h3>
              <p className="text-slate-600 text-base mt-2 max-w-2xl font-light">
                {core.description}
              </p>
            </div>

            <div className="text-left lg:text-right bg-[#FDFBF7] p-6 rounded-2xl border border-[#C9A45C]/30 shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Starting Reference Rate
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-4xl font-bold text-[#0F172A]">
                  ${core.monthlyStartingPrice.toLocaleString()}
                </span>
                <span className="text-slate-500 text-sm">/ month</span>
              </div>
              <span className="text-xs text-[#A77A32] font-medium block mt-1">
                All-inclusive turnkey lease
              </span>
            </div>
          </div>

          {/* 9 Inclusions Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
            {/* 1. Residence & Utilities */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#F7F3EA] flex items-center justify-center text-[#A77A32]">
                <Home className="w-5 h-5 text-[#C9A45C]" />
              </div>
              <h4 className="font-bold text-lg text-[#0F172A]">2-Bedroom Furnished Home</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-light">
                Spacious 90–120 sqm residences equipped with Western kitchen, ergonomic king bedding, and ocean or leafy city balconies.
              </p>
            </div>

            {/* 2. Utility Allowance */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#F7F3EA] flex items-center justify-center text-[#A77A32]">
                <Zap className="w-5 h-5 text-[#C9A45C]" />
              </div>
              <h4 className="font-bold text-lg text-[#0F172A]">Utility Credit Included</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-light">
                {core.utilityAllowanceNote}
              </p>
            </div>

            {/* 3. Housekeeping */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#F7F3EA] flex items-center justify-center text-[#A77A32]">
                <Sparkles className="w-5 h-5 text-[#C9A45C]" />
              </div>
              <h4 className="font-bold text-lg text-[#0F172A]">Professional Housekeeping</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-light">
                {core.cleaningSchedule}
              </p>
            </div>

            {/* 4. Personal Navigator */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#F7F3EA] flex items-center justify-center text-[#A77A32]">
                <UserCheck className="w-5 h-5 text-[#C9A45C]" />
              </div>
              <h4 className="font-bold text-lg text-[#0F172A]">Dedicated Concierge Navigator</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-light">
                {core.personalAssistant}
              </p>
            </div>

            {/* 5. High-Speed Internet */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#F7F3EA] flex items-center justify-center text-[#A77A32]">
                <Wifi className="w-5 h-5 text-[#C9A45C]" />
              </div>
              <h4 className="font-bold text-lg text-[#0F172A]">High-Speed 100 Mbps Wi-Fi</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-light">
                {core.internetSpeed} Perfect for video calling family abroad and streaming 4K entertainment.
              </p>
            </div>

            {/* 6. Resort Amenities */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#F7F3EA] flex items-center justify-center text-[#A77A32]">
                <Compass className="w-5 h-5 text-[#C9A45C]" />
              </div>
              <h4 className="font-bold text-lg text-[#0F172A]">Resort Club Access</h4>
              <ul className="text-xs text-slate-600 space-y-1 font-light">
                {core.resortAmenities?.map((am, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A45C]" />
                    <span>{am}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 7. Visa Paperwork Assistance */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#F7F3EA] flex items-center justify-center text-[#A77A32]">
                <FileCheck2 className="w-5 h-5 text-[#C9A45C]" />
              </div>
              <h4 className="font-bold text-lg text-[#0F172A]">Visa & Renewal Support</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-light">
                {core.visaSupportNote}
              </p>
            </div>

            {/* 8. Health Insurance Navigation */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#F7F3EA] flex items-center justify-center text-[#A77A32]">
                <HeartPulse className="w-5 h-5 text-[#C9A45C]" />
              </div>
              <h4 className="font-bold text-lg text-[#0F172A]">Healthcare Navigation</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-light">
                {core.healthInsuranceSupportNote}
              </p>
            </div>

            {/* 9. Banking & Currency Orientation */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#F7F3EA] flex items-center justify-center text-[#A77A32]">
                <Landmark className="w-5 h-5 text-[#C9A45C]" />
              </div>
              <h4 className="font-bold text-lg text-[#0F172A]">Banking & Currency Setup</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-light">
                {core.bankingSupportNote}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Fee-Based Customizations */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <div className="text-xs font-semibold tracking-wider uppercase text-[#A77A32] mb-1">
                Optional Bespoke Enhancements
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F172A]">
                Additional Fee-Based Lifestyle Services
              </h3>
            </div>
            <p className="text-sm text-slate-500 max-w-md mt-2 md:mt-0 font-light">
              Add specialized comfort according to your personal routine, health condition, and travel appetite.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {additional.map((item) => (
              <div
                key={item.id}
                className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:border-[#C9A45C]/50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#A77A32] mb-2">
                    {item.category}
                  </div>
                  <h4 className="font-bold text-lg text-[#0F172A] mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-light mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <div className="text-sm font-bold text-[#0F172A] mb-1">{item.priceLabel}</div>
                  <div className="text-[11px] text-slate-500 font-light mb-4">{item.conditions}</div>
                  <button
                    onClick={onOpenQuestionnaire}
                    className="w-full py-2 rounded-lg border border-stone-300 hover:border-[#C9A45C] hover:bg-[#FDFBF7] text-xs font-semibold text-[#0F172A] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C9A45C]" />
                    <span>Inquire for Stay</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
