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
  Check,
  ShieldCheck,
} from 'lucide-react';
import { CoreServiceItem, AdditionalServiceItem, AdditionalServicesHeader, CoreInclusionCard } from '../types';

interface CoreServicesSectionProps {
  core: CoreServiceItem;
  additional: AdditionalServiceItem[];
  additionalHeader?: AdditionalServicesHeader;
  onOpenQuestionnaire: () => void;
}

export const CoreServicesSection: React.FC<CoreServicesSectionProps> = ({
  core,
  additional,
  additionalHeader,
  onOpenQuestionnaire,
}) => {
  const getInclusionIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-[#C9A45C]" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-[#C9A45C]" />;
      case 'UserCheck':
        return <UserCheck className="w-5 h-5 text-[#C9A45C]" />;
      case 'Wifi':
        return <Wifi className="w-5 h-5 text-[#C9A45C]" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-[#C9A45C]" />;
      case 'FileCheck2':
        return <FileCheck2 className="w-5 h-5 text-[#C9A45C]" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5 text-[#C9A45C]" />;
      case 'Landmark':
        return <Landmark className="w-5 h-5 text-[#C9A45C]" />;
      case 'Home':
      default:
        return <Home className="w-5 h-5 text-[#C9A45C]" />;
    }
  };

  const defaultInclusions: CoreInclusionCard[] = [
    {
      id: 'inc-1',
      title: '2-Bedroom Furnished Home',
      description: 'Spacious 90–120 sqm residences equipped with Western kitchen, ergonomic king bedding, and ocean or leafy city balconies.',
      icon: 'Home',
      order: 1,
    },
    {
      id: 'inc-2',
      title: 'Utility Credit Included',
      description: core.utilityAllowanceNote || 'Generous electricity & water allowance covered directly in monthly residency fee without separate utility metering hassles.',
      icon: 'Zap',
      order: 2,
    },
    {
      id: 'inc-3',
      title: 'Professional Housekeeping',
      description: core.cleaningSchedule || 'Twice-weekly scheduled deep housekeeping, linen change, sanitized laundry turnover, and interior dusting.',
      icon: 'Sparkles',
      order: 3,
    },
    {
      id: 'inc-4',
      title: 'Dedicated Concierge Navigator',
      description: core.personalAssistant || 'Fluent English-speaking personal concierge for appointment booking, local translations, market guidance, and emergency liaison.',
      icon: 'UserCheck',
      order: 4,
    },
    {
      id: 'inc-5',
      title: 'High-Speed 100 Mbps Wi-Fi',
      description: (core.internetSpeed ? `${core.internetSpeed} ` : '') + 'Perfect for video calling family abroad and streaming 4K entertainment without buffering.',
      icon: 'Wifi',
      order: 5,
    },
    {
      id: 'inc-6',
      title: 'Resort Club Access',
      description: 'Full complimentary access to residence wellness club amenities.',
      icon: 'Compass',
      items: core.resortAmenities && core.resortAmenities.length > 0 ? core.resortAmenities : ['Infinity lap pool & sun deck', 'Equipped cardiovascular gym', 'Sauna & thermal relaxation room'],
      order: 6,
    },
    {
      id: 'inc-7',
      title: 'Visa & Renewal Support',
      description: core.visaSupportNote || 'Full liaison and administrative assistance for lawful multi-entry stay extensions and paperwork.',
      icon: 'FileCheck2',
      order: 7,
    },
    {
      id: 'inc-8',
      title: 'Healthcare Navigation',
      description: core.healthInsuranceSupportNote || 'Direct referrals to internationally accredited JCI hospitals, dental specialists, and English-speaking doctors.',
      icon: 'HeartPulse',
      order: 8,
    },
    {
      id: 'inc-9',
      title: 'Banking & Currency Setup',
      description: core.bankingSupportNote || 'Assistance opening local bank accounts, international ATM withdrawal optimization, and local mobile QR payment configuration.',
      icon: 'Landmark',
      order: 9,
    },
  ];

  const activeInclusions = core.inclusions && core.inclusions.length > 0
    ? [...core.inclusions].sort((a, b) => (a.order || 0) - (b.order || 0))
    : defaultInclusions;

  return (
    <section id="core-services" className="py-12 sm:py-16 md:py-20 bg-[#F7F3EA] text-[#0F172A] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="text-xs sm:text-sm font-semibold tracking-widest text-[#A77A32] uppercase mb-2">
            {core.sectionBadge || 'The Wanderer’s Standard'}
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] mb-4">
            {core.sectionTitle || 'Turnkey Living Inclusions & Benefits'}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            {core.sectionSubtitle ||
              'Every long-term stay is designed as a frictionless, fully serviced sanctuary so you can immerse yourself in passions, relaxation, and local discoveries.'}
          </p>
        </div>

        {/* Highlight Card: Core Residence Package */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-md p-6 sm:p-10 mb-10 sm:mb-12 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-8 border-b border-stone-100 gap-6">
            <div>
              <div className="inline-block px-3 py-1 rounded-md bg-[#C9A45C]/15 text-[#A77A32] text-xs font-semibold uppercase tracking-wider mb-2">
                {core.baselineBadge || 'All-Inclusive Living Baseline'}
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

          {/* Dynamic Inclusions Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
            {activeInclusions.map(inc => (
              <div key={inc.id} className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#F7F3EA] flex items-center justify-center text-[#A77A32]">
                  {getInclusionIcon(inc.icon)}
                </div>
                <h4 className="font-bold text-lg text-[#0F172A]">{inc.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-light">
                  {inc.description}
                </p>
                {inc.items && inc.items.length > 0 && (
                  <ul className="text-xs text-slate-600 space-y-1 font-light pt-1">
                    {inc.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C9A45C]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Fee-Based Customizations */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <div className="text-xs font-semibold tracking-wider uppercase text-[#A77A32] mb-1">
                {additionalHeader?.badge || 'Optional Bespoke Enhancements'}
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F172A]">
                {additionalHeader?.title || 'Additional Fee-Based Lifestyle Services'}
              </h3>
            </div>
            <p className="text-sm text-slate-500 max-w-md mt-2 md:mt-0 font-light">
              {additionalHeader?.subtitle ||
                'Add specialized comfort according to your personal routine, health condition, and travel appetite.'}
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
                  {item.partnerInfo && (
                    <div className="text-[11px] text-[#A77A32] bg-[#FDFBF7] p-2 rounded-lg border border-stone-200 mb-3 font-medium">
                      {item.partnerInfo}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <div className="text-sm font-bold text-[#0F172A] mb-1">{item.priceLabel}</div>
                  <div className="text-[11px] text-slate-500 font-light mb-4">{item.conditions}</div>
                  <button
                    onClick={onOpenQuestionnaire}
                    className="w-full py-2 rounded-lg border border-stone-300 hover:border-[#C9A45C] hover:bg-[#FDFBF7] text-xs font-semibold text-[#0F172A] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C9A45C]" />
                    <span>{item.ctaText || 'Inquire for Stay'}</span>
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
