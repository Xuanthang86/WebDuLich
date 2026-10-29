import React, { useState } from 'react';
import { Bed, Bath, Maximize2, MapPin, Eye, CheckCircle2, ArrowRight } from 'lucide-react';
import { AccommodationItem, AccommodationImage } from '../types';
import { LightboxModal } from './LightboxModal';

interface AccommodationsSectionProps {
  accommodations: AccommodationItem[];
  onSelectAccommodation: (accommodationTitle: string, city: string) => void;
}

export const AccommodationsSection: React.FC<AccommodationsSectionProps> = ({
  accommodations,
  onSelectAccommodation,
}) => {
  const [activeCity, setActiveCity] = useState<'ALL' | 'Da Nang' | 'Nha Trang' | 'Ho Chi Minh City'>('ALL');
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    images: AccommodationImage[];
    currentIndex: number;
    title: string;
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
    title: '',
  });

  const filtered = accommodations.filter(a => {
    if (activeCity === 'ALL') return true;
    return a.city === activeCity;
  });

  const openLightbox = (acc: AccommodationItem, startIndex: number = 0) => {
    setLightboxState({
      isOpen: true,
      images: acc.images,
      currentIndex: startIndex,
      title: `${acc.title} - ${acc.city}`,
    });
  };

  return (
    <section id="accommodations" className="py-12 sm:py-16 md:py-20 bg-[#F7F3EA] text-[#0F172A] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="text-xs sm:text-sm font-semibold tracking-widest text-[#A77A32] uppercase mb-2">
            Sanctuary Residences
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] mb-4">
            Curated Westerner Retirement Residences
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Hand-selected, fully furnished oceanfront villas, bay promenade suites, and leafy botanical
            townhouses in Vietnam's three prime living hubs.
          </p>

          {/* City Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {[
              { id: 'ALL', label: 'All Destinations (3 Hubs)' },
              { id: 'Da Nang', label: 'Da Nang (Coastal Beaches)' },
              { id: 'Nha Trang', label: 'Nha Trang (Tropical Bay)' },
              { id: 'Ho Chi Minh City', label: 'Ho Chi Minh City (Expat Enclave)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCity(tab.id as any)}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                  activeCity === tab.id
                    ? 'bg-[#0F172A] text-white shadow-md'
                    : 'bg-white text-slate-600 border border-stone-200 hover:border-[#C9A45C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accommodations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(acc => {
            const primaryImg = acc.images.find(img => img.isPrimary) || acc.images[0];
            return (
              <div
                key={acc.id}
                className="bg-white rounded-3xl border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Photo Gallery Header with Lightbox Trigger */}
                <div className="relative h-64 w-full bg-slate-900 overflow-hidden">
                  {primaryImg && (
                    <img
                      src={primaryImg.url}
                      alt={primaryImg.caption || acc.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* City Badge */}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#0F172A]/85 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10">
                    <MapPin className="w-3.5 h-3.5 text-[#C9A45C]" />
                    <span>{acc.city}</span>
                  </div>

                  {/* Photo Count & Click to Enlarge */}
                  <button
                    onClick={() => openLightbox(acc, 0)}
                    className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{acc.images.length} Photos</span>
                  </button>

                  {/* Property Style & District */}
                  <div className="absolute bottom-4 left-5 right-5 text-white">
                    <span className="text-xs uppercase tracking-wider text-[#C9A45C] font-semibold block mb-0.5">
                      {acc.propertyType}
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold leading-tight">
                      {acc.title}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Location & Specs */}
                    <p className="text-xs text-slate-500 font-medium mb-4 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#A77A32]" />
                      <span>{acc.district}</span>
                    </p>

                    <div className="grid grid-cols-3 gap-2 py-3 px-4 rounded-2xl bg-[#FDFBF7] border border-stone-200 text-center mb-5">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-slate-700 font-bold text-sm">
                          <Bed className="w-4 h-4 text-[#A77A32]" />
                          <span>{acc.bedrooms}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-light">Bedrooms</span>
                      </div>
                      <div className="border-x border-stone-200">
                        <div className="flex items-center justify-center gap-1 text-slate-700 font-bold text-sm">
                          <Bath className="w-4 h-4 text-[#A77A32]" />
                          <span>{acc.bathrooms}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-light">Baths</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-slate-700 font-bold text-sm">
                          <Maximize2 className="w-4 h-4 text-[#A77A32]" />
                          <span>{acc.areaSqm}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-light">sq. meters</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light mb-5">
                      {acc.description}
                    </p>

                    {/* Amenities Highlights */}
                    <div className="space-y-1.5 mb-6">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Residence Features:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {acc.amenities.map((am, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 text-xs font-normal"
                          >
                            {am}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Selection Footer */}
                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Monthly Living
                      </span>
                      <div className="text-xl font-bold font-serif text-[#0F172A]">
                        ${acc.priceMonthUsd.toLocaleString()}
                        <span className="text-xs font-normal text-slate-500"> / mo</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectAccommodation(acc.title, acc.city)}
                      className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>Inquire Unit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fullscreen Lightbox Modal */}
        <LightboxModal
          isOpen={lightboxState.isOpen}
          images={lightboxState.images}
          currentIndex={lightboxState.currentIndex}
          title={lightboxState.title}
          onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
          onPrev={() =>
            setLightboxState(prev => ({
              ...prev,
              currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length,
            }))
          }
          onNext={() =>
            setLightboxState(prev => ({
              ...prev,
              currentIndex: (prev.currentIndex + 1) % prev.images.length,
            }))
          }
        />
      </div>
    </section>
  );
};
