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
    <section className="relative min-h-[90vh] flex items-center justify-center bg-[#0F172A] text-white overflow-hidden pt-12 pb-20">
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/40 text-[#C9A45C] text-xs sm:text-sm font-medium tracking-wide uppercase mb-6 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-[#C9A45C]" />
          <span>{hero.badgeText || 'Curated Long-Term Living & Retirement Communities'}</span>
        </div>

        {/* Hero Main Headline */}
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.12] mb-6 drop-shadow-sm">
          {hero.headline || 'Live Freely, Retire Happily in Vietnam'}
        </h1>

        {/* Brand Slogan */}
        <p className="font-serif italic text-xl sm:text-2xl text-[#C9A45C] font-normal mb-8 max-w-3xl mx-auto">
          "{hero.tagline || 'Where curiosity leads, possibilities unfold'}"
        </p>

        {/* Introduction to Westerner Retirement Communities (WRCs) */}
        <p className="text-base sm:text-lg md:text-xl text-slate-200/90 leading-relaxed max-w-3xl mx-auto font-light mb-10">
          {hero.subtext ||
            'Discover Westerner Retirement Communities (WRCs) across Vietnam’s most stunning coastal cities and vibrant havens. Fully serviced residences, dedicated English-speaking concierge, healthcare navigation, and vibrant expat fellowship.'}
        </p>

        {/* Core Value Quick Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-300 mb-10">
          <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-700/60">
            <CheckCircle2 className="w-4 h-4 text-[#C9A45C]" />
            <span>Turnkey 2-Bedroom Serviced Living</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-700/60">
            <ShieldCheck className="w-4 h-4 text-[#C9A45C]" />
            <span>Dedicated Bilingual Concierge</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-700/60">
            <CheckCircle2 className="w-4 h-4 text-[#C9A45C]" />
            <span>Healthcare & Visa Guidance</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            onClick={onOpenQuestionnaire}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#C9A45C] to-[#A77A32] text-[#0F172A] font-bold text-base tracking-wide hover:from-[#d8b368] hover:to-[#b8893d] transition-all shadow-xl shadow-[#C9A45C]/30 hover:shadow-2xl hover:shadow-[#C9A45C]/45 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>{hero.primaryCtaText || 'Request a Bespoke Proposal'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onExplorePackages}
            className="w-full sm:w-auto px-7 py-4 rounded-full border-2 border-slate-400/80 hover:border-[#C9A45C] text-white hover:text-[#C9A45C] font-semibold text-base transition-colors bg-slate-900/40 backdrop-blur-sm cursor-pointer"
          >
            {hero.secondaryCtaText || 'Explore Living Packages'}
          </button>
        </div>

        {/* Key Metrics / Highlights Grid */}
        {hero.stats && hero.stats.length > 0 && (
          <div className="mt-16 pt-12 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6">
            {hero.stats.map((stat, idx) => (
              <div key={idx} className="text-center p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-[#C9A45C] mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide">
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
