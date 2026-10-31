import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { HeroContent } from '../types';

interface HeroSectionProps {
  hero: HeroContent;
  onOpenQuestionnaire: () => void;
  onExplorePackages: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  hero,
  onOpenQuestionnaire,
  onExplorePackages,
}) => {
  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center bg-[#0F172A] text-white overflow-hidden pt-6 sm:pt-12 md:pt-16 pb-10 sm:pb-16 md:pb-20">
      {/* Background Photography with Sophisticated Dark Vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src={hero.backgroundImageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=2000&q=80'}
          alt="Vietnam coastal paradise Da Nang and Nha Trang"
          className="w-full h-full object-cover object-center scale-105 filter brightness-[0.42] contrast-[1.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/70 to-[#0F172A]/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,164,92,0.15),transparent_50%)]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtle Luxury Badge */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/40 text-[#C9A45C] text-[11px] sm:text-xs md:text-sm font-medium tracking-wide uppercase mb-3 sm:mb-5 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C9A45C]" />
          <span>{hero.badgeText || 'Curated Long-Term Living & Retirement Communities'}</span>
        </div>

        {/* Hero Main Headline */}
        <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.18] sm:leading-[1.12] mb-2 sm:mb-4 drop-shadow-sm">
          {hero.headline || 'Live Freely, Retire Happily in Vietnam'}
        </h1>

        {/* Brand Slogan */}
        <p className="font-serif italic text-base sm:text-xl md:text-2xl text-[#C9A45C] font-normal mb-3 sm:mb-6 max-w-3xl mx-auto">
          "{hero.tagline || 'Where curiosity leads, possibilities unfold'}"
        </p>

        {/* Introduction to Westerner Retirement Communities (WRCs) */}
        <p className="text-xs sm:text-base md:text-lg text-slate-200/90 leading-relaxed max-w-3xl mx-auto font-light mb-4 sm:mb-7">
          {hero.subtext ||
            'Discover Westerner Retirement Communities (WRCs) across Vietnam’s most stunning coastal cities and vibrant havens. Fully serviced residences, dedicated English-speaking concierge, healthcare navigation, and vibrant expat fellowship.'}
        </p>

        {/* Core Value Quick Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-6 text-[11px] sm:text-xs md:text-sm text-slate-300 mb-5 sm:mb-8">
          {(hero.valueBadges && hero.valueBadges.length > 0
            ? hero.valueBadges
            : [
                { id: 'vb1', text: 'Turnkey 2-Bedroom Serviced Living', icon: 'CheckCircle2' },
                { id: 'vb2', text: 'Dedicated Bilingual Concierge', icon: 'ShieldCheck' },
                { id: 'vb3', text: 'Healthcare & Visa Guidance', icon: 'CheckCircle2' },
              ]
          ).map(badge => (
            <div
              key={badge.id}
              className="flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-sm px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-slate-700/60"
            >
              {badge.icon === 'ShieldCheck' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-[#C9A45C]" />
              ) : badge.icon === 'Sparkles' ? (
                <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A45C]" />
              )}
              <span>{badge.text}</span>
            </div>
          ))}
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-xl mx-auto w-full px-2">
          <button
            onClick={onOpenQuestionnaire}
            className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-3.5 rounded-full bg-gradient-to-r from-[#C9A45C] to-[#A77A32] text-[#0F172A] font-bold text-sm sm:text-base tracking-wide hover:from-[#d8b368] hover:to-[#b8893d] transition-all shadow-xl shadow-[#C9A45C]/30 hover:shadow-2xl hover:shadow-[#C9A45C]/45 flex items-center justify-center gap-2 cursor-pointer group whitespace-nowrap"
          >
            <span>{hero.primaryCtaText || 'Request a Bespoke Proposal'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onExplorePackages}
            className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-3.5 rounded-full border-2 border-slate-400/80 hover:border-[#C9A45C] text-white hover:text-[#C9A45C] font-semibold text-sm sm:text-base transition-colors bg-slate-900/40 backdrop-blur-sm cursor-pointer whitespace-nowrap"
          >
            {hero.secondaryCtaText || 'Explore Living Packages'}
          </button>
        </div>

        {/* Key Metrics / Highlights Grid */}
        {hero.stats && hero.stats.length > 0 && (
          <div className="mt-8 sm:mt-12 md:mt-16 pt-5 sm:pt-8 md:pt-10 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {hero.stats.map((stat, idx) => (
              <div key={idx} className="text-center p-2.5 sm:p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm">
                <div className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-[#C9A45C] mb-0.5 sm:mb-1">
                  {stat.value}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-slate-300 font-medium tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
