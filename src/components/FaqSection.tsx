import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQItem } from '../types';

interface FaqSectionProps {
  faqs: FAQItem[];
  onOpenQuestionnaire: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ faqs, onOpenQuestionnaire }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    [faqs[0]?.id || 'faq_01']: true, // first open by default
  });

  const categories = ['ALL', 'Visa & Legal', 'Healthcare', 'Accommodation', 'Finance', 'General'];

  const filtered = faqs.filter(f => {
    if (selectedCategory === 'ALL') return true;
    return f.category === selectedCategory;
  });

  const toggle = (id: string) => {
    setOpenIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="faq" className="py-24 bg-[#F7F3EA] text-[#0F172A] border-b border-stone-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs sm:text-sm font-semibold tracking-widest text-[#A77A32] uppercase mb-2">
            Clear Answers
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-slate-600 font-normal leading-relaxed">
            Essential facts on residency visas, international health coverage, financial transfers, and
            daily community life in Vietnam.
          </p>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-stone-200 hover:border-[#C9A45C]'
                }`}
              >
                {cat === 'ALL' ? 'All Inquiries' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {filtered.map(faq => {
            const isOpen = Boolean(openIds[faq.id]);
            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggle(faq.id)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-[#A77A32] shrink-0">
                      {faq.category}
                    </span>
                    <span className="font-serif font-bold text-base sm:text-lg text-[#0F172A]">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#C9A45C]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-slate-600 leading-relaxed font-light border-t border-stone-100 bg-[#FDFBF7]/40">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still Have Questions CTA */}
        <div className="mt-12 text-center p-8 rounded-3xl bg-white border border-stone-200 shadow-sm">
          <HelpCircle className="w-8 h-8 text-[#C9A45C] mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-[#0F172A] mb-2">
            Have a question specific to your personal circumstances?
          </h3>
          <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6 font-light">
            Whether inquiring about prescription medications, pet import regulations, or bringing personal items, our senior concierge is pleased to assist.
          </p>
          <button
            onClick={onOpenQuestionnaire}
            className="px-6 py-3 rounded-full bg-[#0F172A] hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-sm font-semibold transition-all cursor-pointer shadow-md"
          >
            Ask a Personal Concierge Specialist
          </button>
        </div>
      </div>
    </section>
  );
};
