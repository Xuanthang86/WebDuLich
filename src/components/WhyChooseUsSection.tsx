import React from 'react';
import { Compass, CheckCircle2, Users2, Anchor, Shield } from 'lucide-react';

interface WhyChooseUsSectionProps {
  items: Array<{ id: string; title: string; description: string; icon: string }>;
}

export const WhyChooseUsSection: React.FC<WhyChooseUsSectionProps> = ({ items }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass':
        return <Compass className="w-6 h-6 text-[#C9A45C]" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-6 h-6 text-[#C9A45C]" />;
      case 'Users2':
        return <Users2 className="w-6 h-6 text-[#C9A45C]" />;
      case 'Anchor':
      default:
        return <Anchor className="w-6 h-6 text-[#C9A45C]" />;
    }
  };

  return (
    <section id="why-choose-us" className="py-12 sm:py-16 md:py-20 bg-[#FDFBF7] text-[#0F172A] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="text-xs sm:text-sm font-semibold tracking-widest text-[#A77A32] uppercase mb-2">
            Peace of Mind
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] mb-4">
            Why Western Seniors Trust Wanderer’s Journeys
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Relocating or wintering abroad shouldn't be stressful. We bridge Western lifestyle expectations
            with local Vietnamese hospitality, warmth, and legal reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:border-[#C9A45C] hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#F7F3EA] border border-[#C9A45C]/30 flex items-center justify-center mb-6">
                  {getIcon(item.icon)}
                </div>
                <h3 className="font-serif text-xl font-bold text-[#0F172A] mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-light">
                  {item.description}
                </p>
              </div>

              <div className="pt-6 border-t border-stone-100 mt-6 flex items-center gap-1.5 text-xs text-[#A77A32] font-semibold">
                <Shield className="w-4 h-4 text-[#C9A45C]" />
                <span>Verified Resident Standard</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
