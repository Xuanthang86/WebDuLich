import React, { useState } from 'react';
import { Check, Clock, Calendar, ArrowRight, Star } from 'lucide-react';
import { PackageItem, PackagesHeader } from '../types';

interface PackagesSectionProps {
  packages: PackageItem[];
  header?: PackagesHeader;
  onSelectPackage: (packageTitle: string) => void;
}

export const PackagesSection: React.FC<PackagesSectionProps> = ({
  packages,
  header,
  onSelectPackage,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'SHORT' | 'SEASONAL' | 'LONG'>('ALL');

  const filteredPackages = packages.filter(pkg => {
    if (selectedFilter === 'SHORT') return pkg.code.includes('DISCOVERY') || pkg.code.includes('30_DAY');
    if (selectedFilter === 'SEASONAL') return pkg.code.includes('SNOWBIRD');
    if (selectedFilter === 'LONG') return pkg.code.includes('SIX_MONTH') || pkg.code.includes('RETIREMENT');
    return true;
  });

  return (
    <section id="packages" className="py-12 sm:py-16 md:py-20 bg-[#FDFBF7] text-[#0F172A] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="text-xs sm:text-sm font-semibold tracking-widest text-[#A77A32] uppercase mb-2">
            {header?.badge || 'Tailored Journeys'}
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] mb-4">
            {header?.title || 'Curated Living & Retirement Packages'}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            {header?.subtitle ||
              'From two-week private exploratory inspections to annual full-residency communities, experience total peace of mind in Vietnam.'}
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {[
              { id: 'ALL', label: 'All 5 Living Packages' },
              { id: 'SHORT', label: 'Exploration & 30-Day Trial' },
              { id: 'SEASONAL', label: 'Winter Snowbird' },
              { id: 'LONG', label: '6 - 12 Month Residency' },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  selectedFilter === filter.id
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-stone-200 hover:border-[#C9A45C]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Packages Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPackages.map(pkg => (
            <div
              key={pkg.id}
              className={`bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-xl ${
                pkg.isFeatured
                  ? 'border-[#C9A45C] ring-2 ring-[#C9A45C]/20 shadow-md'
                  : 'border-stone-200'
              }`}
            >
              {/* Featured Ribbon Badge */}
              {pkg.isFeatured && (
                <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-[#C9A45C] text-[#0F172A] text-[11px] font-bold tracking-wide uppercase flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-[#0F172A]" />
                  <span>Popular Choice</span>
                </div>
              )}

              {/* Package Header Image */}
              <div className="relative h-52 w-full overflow-hidden bg-slate-900">
                <img
                  src={pkg.imageUrl}
                  alt={pkg.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 text-white">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A45C] block mb-1">
                    {pkg.tag}
                  </span>
                  <h3 className="font-serif text-2xl font-bold leading-snug">{pkg.title}</h3>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                <div>
                  {/* Duration & Price Header */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Clock className="w-4 h-4 text-[#A77A32]" />
                      <span>{pkg.duration}</span>
                    </div>
                    <div className="text-sm font-bold text-[#0F172A]">{pkg.priceRange}</div>
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-slate-600 leading-relaxed font-light mb-6">
                    {pkg.summary}
                  </p>

                  {/* Ideal For Callout */}
                  {pkg.idealFor && (
                    <div className="p-3 rounded-xl bg-[#FDFBF7] border border-stone-200 text-xs text-slate-700 font-normal mb-6">
                      <span className="font-bold text-[#A77A32]">Ideal For: </span>
                      {pkg.idealFor}
                    </div>
                  )}

                  {/* Inclusions List */}
                  <div className="space-y-2.5 mb-6">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Package Inclusions:
                    </span>
                    {pkg.inclusions.map((inc, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-normal">
                        <div className="w-4 h-4 rounded-full bg-[#C9A45C]/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-[#A77A32] stroke-[3]" />
                        </div>
                        <span>{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 border-t border-stone-100">
                  <button
                    onClick={() => onSelectPackage(pkg.title)}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      pkg.isFeatured
                        ? 'bg-gradient-to-r from-[#C9A45C] to-[#A77A32] text-[#0F172A] hover:from-[#d8b368] hover:to-[#b8893d] shadow-md shadow-[#C9A45C]/20'
                        : 'bg-[#0F172A] text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>Request Proposal for This Package</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] text-center text-slate-400 block mt-2 font-light">
                    {pkg.conditions || 'Dates flexible. Bespoke adjustments available on request.'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
