import React from 'react';
import { PiggyBank, SunMedium, HeartHandshake, ShieldCheck, TrendingUp, Info } from 'lucide-react';
import { WhyVietnamItem, WhyVietnamHeader, FinancialProjection } from '../types';

interface WhyVietnamSectionProps {
  items: WhyVietnamItem[];
  budgetComparisonMessage?: string;
  header?: WhyVietnamHeader;
  financialProjection?: FinancialProjection;
}

export const WhyVietnamSection: React.FC<WhyVietnamSectionProps> = ({
  items,
  budgetComparisonMessage,
  header,
  financialProjection,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'PiggyBank':
        return <PiggyBank className="w-7 h-7 text-[#C9A45C]" />;
      case 'SunMedium':
        return <SunMedium className="w-7 h-7 text-[#C9A45C]" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-7 h-7 text-[#C9A45C]" />;
      case 'ShieldCheck':
      default:
        return <ShieldCheck className="w-7 h-7 text-[#C9A45C]" />;
    }
  };

  return (
    <section id="why-vietnam" className="py-12 sm:py-16 md:py-20 bg-[#FDFBF7] text-[#0F172A] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="text-xs sm:text-sm font-semibold tracking-widest text-[#A77A32] uppercase mb-2">
            {header?.badge || 'The Vietnam Advantage'}
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] mb-4">
            {header?.title || 'Why Western Retirees & Explorers Choose Vietnam'}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            {header?.subtitle ||
              'A harmonious fusion of natural coastal tranquility, world-class modern healthcare, exceptional personal safety, and unprecedented purchasing power.'}
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white p-8 sm:p-10 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-xl bg-[#F7F3EA] border border-[#C9A45C]/30 flex items-center justify-center mb-6">
                  {getIcon(item.icon)}
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#0F172A] mb-3">
                  {item.title}
                </h3>
                <p className="text-base text-slate-600 leading-relaxed font-light mb-6">
                  {item.description}
                </p>
              </div>

              {item.highlight && (
                <div className="pt-4 border-t border-stone-100 flex items-center gap-2 text-sm font-medium text-[#A77A32]">
                  <TrendingUp className="w-4 h-4 text-[#C9A45C]" />
                  <span>{item.highlight}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Realistic Budget Comparison Banner with Transparent Methodology */}
        <div className="bg-[#0F172A] text-white p-8 sm:p-10 rounded-3xl border border-[#C9A45C]/40 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#C9A45C] uppercase tracking-wider mb-2">
                <PiggyBank className="w-4 h-4 text-[#C9A45C]" />
                <span>{financialProjection?.badge || 'Financial Purchasing Power Projection'}</span>
              </div>
              <h4 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3">
                {financialProjection?.headline || 'Live Like $90,000+ for Approximately $40,000 / Year'}
              </h4>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
                {financialProjection?.comparisonMessage ||
                  budgetComparisonMessage ||
                  'Experience premier coastal resort living, daily wellness, and dedicated concierge care in Vietnam for $40,000/year with a standard of living rivaling $90,000+ in North America or Western Europe.'}
              </p>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 text-xs text-slate-300 space-y-2 lg:w-96 shrink-0">
              <div className="flex items-center gap-1.5 font-semibold text-[#C9A45C]">
                <Info className="w-4 h-4 shrink-0" />
                <span>{financialProjection?.notesTitle || 'Transparent Assumptions & Context'}</span>
              </div>
              <p className="leading-normal">
                {financialProjection?.notesContent ||
                  'Estimated comparison includes 2-bedroom executive serviced residence, utilities allowance, 3x weekly housekeeping, private fitness/pool access, fresh dining, and lifestyle concierge. Figures are comparative estimations based on standard Western urban living costs and do not constitute individual financial advice.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
