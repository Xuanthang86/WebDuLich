import React, { useState, useEffect } from 'react';
import { Bed, Bath, Maximize2, MapPin, Eye, ArrowRight, Star, Compass, Layers, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
  const [activeCity, setActiveCity] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'DESTINATIONS' | 'LOCATIONS'>('DESTINATIONS');

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

  // Listen for footer or external destination selection events
  useEffect(() => {
    const handleCustomCitySelect = (e: any) => {
      if (e.detail) {
        setActiveCity(e.detail);
        setViewMode('LOCATIONS');
      }
    };
    window.addEventListener('wj-select-city', handleCustomCitySelect);
    return () => {
      window.removeEventListener('wj-select-city', handleCustomCitySelect);
    };
  }, []);

  // Dynamically extract unique cities from accommodations to ensure full extensibility
  const dynamicCities = React.useMemo(() => {
    const citiesSet = new Set<string>();
    accommodations.forEach(a => {
      if (a.city) citiesSet.add(a.city);
    });
    return Array.from(citiesSet);
  }, [accommodations]);

  // Destination Hub metadata dictionary with graceful automatic fallbacks for new cities
  const cityMetadata: Record<string, { hubName: string; tagline: string; description: string; badgeClass: string; heroFallback: string }> = {
    'Da Nang': {
      hubName: 'Đà Nẵng Coastal Beaches & Nature Hub',
      tagline: 'My Khe shoreline, Son Tra peninsula & heritage sanctuaries',
      description: 'Central Vietnam’s crown jewel offering turquoise coastlines, temperate sea breezes, world-class golf links, and peaceful seaside living.',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      heroFallback: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    },
    'Nha Trang': {
      hubName: 'Nha Trang Tropical Bay & Marina Hub',
      tagline: 'Tran Phu waterfront, palm promenade & An Vien yacht marina',
      description: 'Vietnam’s premier year-round sunny coastal bay featuring 300+ days of warmth, mineral mud baths, calm seas, and private marina enclaves.',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      heroFallback: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    },
    'Ho Chi Minh City': {
      hubName: 'Ho Chi Minh City Expat & Heritage Hub',
      tagline: 'Thao Dien leafy quarter, Saigon riverfront & premier clinics',
      description: 'A vibrant international metropolis blending French colonial verandas, renowned JCI hospitals (FV Hospital), Michelin dining, and riverside tranquility.',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      heroFallback: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    },
  };

  // Build structured destination hubs
  const destinationHubs = React.useMemo(() => {
    return dynamicCities.map(city => {
      const items = accommodations
        .filter(a => a.city === city)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      const meta = cityMetadata[city] || {
        hubName: `${city} Sanctuary Hub`,
        tagline: `Curated retirement living and serviced suites in ${city}`,
        description: `Premier serviced residences, English-speaking personal navigators, and bespoke hospitality in ${city}.`,
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
        heroFallback: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      };

      const startingPrice = items.length > 0
        ? Math.min(...items.map(i => i.priceMonthUsd || 2250))
        : 2250;

      const heroImage = items[0]?.images[0]?.url || meta.heroFallback;

      const subDistricts = Array.from(new Set(items.map(i => i.district))).filter(Boolean);

      return {
        city,
        hubName: meta.hubName,
        tagline: meta.tagline,
        description: meta.description,
        badgeClass: meta.badgeClass,
        heroImage,
        items,
        startingPrice,
        subDistricts,
      };
    });
  }, [accommodations, dynamicCities]);

  const visibleHubs = destinationHubs.filter(hub => {
    if (activeCity === 'ALL') return true;
    return hub.city === activeCity;
  });

  const openLightbox = (acc: AccommodationItem, startIndex: number = 0) => {
    setLightboxState({
      isOpen: true,
      images: acc.images,
      currentIndex: startIndex,
      title: `${acc.title} - ${acc.city}`,
    });
  };

  const handleSelectDestinationCard = (city: string) => {
    setActiveCity(city);
    setViewMode('LOCATIONS');
  };

  return (
    <section id="accommodations" className="py-10 sm:py-16 md:py-20 bg-[#F7F3EA] text-[#0F172A] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="text-xs sm:text-sm font-semibold tracking-widest text-[#A77A32] uppercase mb-2">
            Sanctuary Residences
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] mb-3 sm:mb-4">
            Curated Westerner Retirement Residences
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 font-normal leading-relaxed">
            Khám phá các Điểm Đến lưu trú dài hạn hàng đầu tại Việt Nam. Mỗi tỉnh/thành phố tập trung các khu căn hộ cao cấp theo từng vị trí (Position 1 Flagship, Position 2, Position 3...) với đầy đủ dịch vụ chăm sóc và tiện ích resort.
          </p>

          {/* View Mode & City Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 sm:mt-8">
            <button
              onClick={() => {
                setActiveCity('ALL');
                setViewMode('DESTINATIONS');
              }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCity === 'ALL' && viewMode === 'DESTINATIONS'
                  ? 'bg-[#0F172A] text-white shadow-md ring-2 ring-[#C9A45C]/40'
                  : 'bg-white text-slate-600 border border-stone-200 hover:border-[#C9A45C]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#C9A45C]" />
              <span>All Destinations ({destinationHubs.length} Hubs)</span>
            </button>

            {destinationHubs.map(hub => (
              <button
                key={hub.city}
                onClick={() => {
                  setActiveCity(hub.city);
                  setViewMode('LOCATIONS');
                }}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCity === hub.city && viewMode === 'LOCATIONS'
                    ? 'bg-[#0F172A] text-white shadow-md ring-2 ring-[#C9A45C]/40'
                    : 'bg-white text-slate-600 border border-stone-200 hover:border-[#C9A45C]'
                }`}
              >
                <span>{hub.city}</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 text-slate-700">
                  {hub.items.length}
                </span>
              </button>
            ))}

            <button
              onClick={() => {
                setActiveCity('ALL');
                setViewMode('LOCATIONS');
              }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCity === 'ALL' && viewMode === 'LOCATIONS'
                  ? 'bg-[#0F172A] text-white shadow-md ring-2 ring-[#C9A45C]/40'
                  : 'bg-white text-slate-600 border border-stone-200 hover:border-[#C9A45C]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#C9A45C]" />
              <span>View All Residences ({accommodations.length})</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            MODE 1: DESTINATION PROVINCE CARDS (Da Nang, Nha Trang, Ho Chi Minh...)
            ========================================================================= */}
        {viewMode === 'DESTINATIONS' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {destinationHubs.map(hub => {
                return (
                  <div
                    key={hub.city}
                    className="bg-white rounded-3xl border border-stone-200 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
                  >
                    {/* Destination Hero Photography */}
                    <div className="relative h-64 sm:h-72 w-full bg-slate-900 overflow-hidden">
                      <img
                        src={hub.heroImage}
                        alt={hub.hubName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

                      {/* City Badge & Count */}
                      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${hub.badgeClass}`}>
                          {hub.city} Hub
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20">
                          {hub.items.length} {hub.items.length === 1 ? 'Residence' : 'Residences'}
                        </span>
                      </div>

                      <div className="absolute bottom-4 left-5 right-5 text-white">
                        <span className="text-xs uppercase tracking-wider text-[#C9A45C] font-bold block mb-1">
                          Prime Coastal Destination
                        </span>
                        <h3 className="font-serif text-2xl font-bold leading-tight">
                          {hub.hubName}
                        </h3>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
                      <div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light mb-4">
                          {hub.description}
                        </p>

                        {/* Sub-locations Preview */}
                        <div className="p-3.5 rounded-2xl bg-[#FDFBF7] border border-stone-200 space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                            Featured Residences & Suites:
                          </span>
                          <div className="space-y-1">
                            {hub.items.map((item, idx) => (
                              <div key={item.id} className="text-xs text-slate-700 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A45C] shrink-0" />
                                <span className="font-medium">Position {idx + 1}:</span>
                                <span className="text-slate-600 truncate">{item.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Click Action */}
                      <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Starting from
                          </span>
                          <div className="text-lg font-bold font-serif text-[#0F172A]">
                            ${hub.startingPrice.toLocaleString()}
                            <span className="text-xs font-normal text-slate-500"> / month</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectDestinationCard(hub.city)}
                          className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md group-hover:shadow-lg"
                        >
                          <span>Explore {hub.items.length} Residences</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE 2: DETAILED SUB-LOCATIONS VIEW (Position 1 Flagship, Position 2...)
            ========================================================================= */}
        {viewMode === 'LOCATIONS' && (
          <div className="space-y-12 sm:space-y-16 animate-in fade-in duration-200">
            {/* Back to Destinations bar if viewing a specific city */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCity('ALL');
                    setViewMode('DESTINATIONS');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 hover:border-[#C9A45C] text-xs font-semibold text-slate-700 hover:text-[#0F172A] hover:bg-stone-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#C9A45C]" />
                  <span>Back to Destinations Overview</span>
                </button>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-bold text-slate-700">
                  {activeCity === 'ALL' ? 'Showing All Residences' : `Viewing: ${activeCity}`}
                </span>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Position 1 features the signature flagship residence for each province
              </div>
            </div>

            {visibleHubs.map(hub => {
              if (hub.items.length === 0) return null;
              const primaryResidence = hub.items[0]; // Position 1: Primary Flagship
              const secondaryResidences = hub.items.slice(1); // Position 2, 3...

              return (
                <div key={hub.city} className="space-y-6">
                  {/* Destination Hub Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-stone-300">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#0F172A] flex items-center justify-center text-[#C9A45C] shrink-0">
                        <Compass className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2 flex-wrap">
                          <span>{hub.hubName}</span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 font-sans">
                            {hub.items.length} {hub.items.length === 1 ? 'Location' : 'Locations'}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 font-light mt-0.5">{hub.tagline}</p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-[#A77A32] flex items-center gap-1 self-start sm:self-auto">
                      <Star className="w-3.5 h-3.5 fill-[#C9A45C] text-[#C9A45C]" />
                      <span>Position 1: Primary Flagship</span>
                    </span>
                  </div>

                  {/* Grid for this Province: Flagship Card + Secondary Location Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* Position 1 Highlight Card */}
                    {primaryResidence && (
                      <div
                        key={primaryResidence.id}
                        className="bg-white rounded-3xl border-2 border-[#C9A45C] shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden group relative"
                      >
                        {/* Flagship Badge */}
                        <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-gradient-to-r from-[#C9A45C] to-[#A77A32] text-[#0F172A] text-xs font-bold flex items-center gap-1.5 shadow-md">
                          <Star className="w-3.5 h-3.5 fill-[#0F172A]" />
                          <span>Position 1 • Primary Highlight</span>
                        </div>

                        {/* Photo Header */}
                        <div className="relative h-64 sm:h-72 w-full bg-slate-900 overflow-hidden">
                          {primaryResidence.images[0] && (
                            <img
                              src={primaryResidence.images[0].url}
                              alt={primaryResidence.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                          {/* Photo Count */}
                          <button
                            type="button"
                            onClick={() => openLightbox(primaryResidence, 0)}
                            className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all cursor-pointer z-10"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{primaryResidence.images.length} Photos</span>
                          </button>

                          <div className="absolute bottom-4 left-5 right-5 text-white">
                            <span className="text-xs uppercase tracking-wider text-[#C9A45C] font-bold block mb-0.5">
                              {primaryResidence.propertyType} • {primaryResidence.city}
                            </span>
                            <h4 className="font-serif text-xl sm:text-2xl font-bold leading-tight">
                              {primaryResidence.title}
                            </h4>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-xs text-slate-500 font-medium mb-4 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#A77A32] shrink-0" />
                              <span>{primaryResidence.district}</span>
                            </p>

                            <div className="grid grid-cols-3 gap-2 py-3 px-4 rounded-2xl bg-[#FDFBF7] border border-stone-200 text-center mb-5">
                              <div>
                                <div className="flex items-center justify-center gap-1 text-slate-700 font-bold text-sm">
                                  <Bed className="w-4 h-4 text-[#A77A32]" />
                                  <span>{primaryResidence.bedrooms}</span>
                                </div>
                                <span className="text-[11px] text-slate-500 font-light">Bedrooms</span>
                              </div>
                              <div className="border-x border-stone-200">
                                <div className="flex items-center justify-center gap-1 text-slate-700 font-bold text-sm">
                                  <Bath className="w-4 h-4 text-[#A77A32]" />
                                  <span>{primaryResidence.bathrooms}</span>
                                </div>
                                <span className="text-[11px] text-slate-500 font-light">Baths</span>
                              </div>
                              <div>
                                <div className="flex items-center justify-center gap-1 text-slate-700 font-bold text-sm">
                                  <Maximize2 className="w-4 h-4 text-[#A77A32]" />
                                  <span>{primaryResidence.areaSqm}</span>
                                </div>
                                <span className="text-[11px] text-slate-500 font-light">sq. meters</span>
                              </div>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light mb-5">
                              {primaryResidence.description}
                            </p>

                            <div className="space-y-1.5 mb-6">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                                Primary Inclusions:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {primaryResidence.amenities.slice(0, 5).map((am, i) => (
                                  <span
                                    key={i}
                                    className="px-2.5 py-1 rounded-md bg-[#C9A45C]/15 text-[#855e1c] text-xs font-semibold"
                                  >
                                    {am}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Pricing & Selection */}
                          <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-4">
                            <div>
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                                Monthly Living
                              </span>
                              <div className="text-xl font-bold font-serif text-[#0F172A]">
                                ${primaryResidence.priceMonthUsd.toLocaleString()}
                                <span className="text-xs font-normal text-slate-500"> / mo</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onSelectAccommodation(primaryResidence.title, primaryResidence.city)}
                              className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <span>Inquire Unit</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Secondary Locations in this same Province */}
                    {secondaryResidences.map((acc, index) => {
                      const primaryImg = acc.images.find(img => img.isPrimary) || acc.images[0];
                      const positionIndex = index + 2;

                      return (
                        <div
                          key={acc.id}
                          className="bg-white rounded-3xl border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                        >
                          {/* Photo Gallery Header */}
                          <div className="relative h-64 sm:h-72 w-full bg-slate-900 overflow-hidden">
                            {primaryImg && (
                              <img
                                src={primaryImg.url}
                                alt={primaryImg.caption || acc.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                            {/* Position Badge */}
                            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#0F172A]/85 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10">
                              <MapPin className="w-3.5 h-3.5 text-[#C9A45C]" />
                              <span>Position {positionIndex} • {acc.city}</span>
                            </div>

                            {/* Photo Count */}
                            <button
                              type="button"
                              onClick={() => openLightbox(acc, 0)}
                              className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{acc.images.length} Photos</span>
                            </button>

                            <div className="absolute bottom-4 left-5 right-5 text-white">
                              <span className="text-xs uppercase tracking-wider text-[#C9A45C] font-semibold block mb-0.5">
                                {acc.propertyType}
                              </span>
                              <h4 className="font-serif text-xl sm:text-2xl font-bold leading-tight">
                                {acc.title}
                              </h4>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                            <div>
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

                              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light mb-5">
                                {acc.description}
                              </p>

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
                                type="button"
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
                </div>
              );
            })}
          </div>
        )}

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
