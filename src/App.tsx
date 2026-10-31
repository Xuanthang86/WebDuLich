/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { fetchPublicContent, PublicContentResponse } from './api';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { WhyVietnamSection } from './components/WhyVietnamSection';
import { CoreServicesSection } from './components/CoreServicesSection';
import { PackagesSection } from './components/PackagesSection';
import { AccommodationsSection } from './components/AccommodationsSection';
import { InquiryForm } from './components/InquiryForm';
import { WhyChooseUsSection } from './components/WhyChooseUsSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { PolicyModal } from './components/PolicyModal';
import { AdminLayout } from './components/Admin/AdminLayout';

export default function App() {
  const [currentView, setCurrentView] = useState<'website' | 'admin'>('website');
  const [content, setContent] = useState<PublicContentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Questionnaire target selections
  const [selectedPackage, setSelectedPackage] = useState<string | undefined>(undefined);
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);

  // Policy Modal
  const [policyType, setPolicyType] = useState<'privacy' | 'terms' | null>(null);

  const loadContent = () => {
    setLoading(true);
    fetchPublicContent()
      .then(res => {
        setContent(res);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to load content:', err);
        setError('Unable to load content bundle from server. Please refresh.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadContent();
  }, []);

  const scrollToQuestionnaire = (pkg?: string, city?: string) => {
    if (pkg) setSelectedPackage(pkg);
    if (city) setSelectedCity(city);
    const elem = document.getElementById('questionnaire');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToPackages = () => {
    const elem = document.getElementById('packages');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AuthProvider>
      {currentView === 'admin' ? (
        <AdminLayout
          onBackToWebsite={() => setCurrentView('website')}
          settings={content?.settings}
          onOpenPrivacy={() => setPolicyType('privacy')}
          onOpenTerms={() => setPolicyType('terms')}
        />
      ) : (
        <div className="min-h-screen bg-[#FDFBF7] text-[#0F172A] flex flex-col font-sans">
          {loading && !content ? (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] text-white space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-[#C9A45C]/30 border-t-[#C9A45C] animate-spin" />
              <p className="font-serif italic text-lg text-slate-300">
                Wanderer's Journeys • Preparing Your Experience...
              </p>
            </div>
          ) : error ? (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
              <h2 className="font-serif text-2xl font-bold text-rose-700">Service Temporarily Unavailable</h2>
              <p className="text-slate-600 max-w-md">{error}</p>
              <button
                onClick={loadContent}
                className="px-6 py-2.5 rounded-full bg-[#0F172A] text-white text-sm font-semibold cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            content && (
              <>
                {/* 1. Header & Navigation */}
                <Navbar
                  settings={content.settings}
                  onOpenAdmin={() => setCurrentView('admin')}
                  onOpenQuestionnaire={() => scrollToQuestionnaire()}
                />

                {/* 2. Hero Section */}
                <HeroSection
                  hero={content.hero}
                  onOpenQuestionnaire={() => scrollToQuestionnaire()}
                  onExplorePackages={scrollToPackages}
                />

                {/* 3. Why Vietnam */}
                <WhyVietnamSection
                  items={content.whyVietnam}
                  budgetComparisonMessage={content.settings.budgetComparisonMessage}
                />

                {/* 4. Core Services & Benefits */}
                <CoreServicesSection
                  core={content.coreService}
                  additional={content.additionalServices}
                  onOpenQuestionnaire={() => scrollToQuestionnaire()}
                />

                {/* 5. Packages Showcase */}
                <PackagesSection
                  packages={content.packages}
                  onSelectPackage={pkgTitle => scrollToQuestionnaire(pkgTitle)}
                />

                {/* 6. Accommodations Showcase */}
                <AccommodationsSection
                  accommodations={content.accommodations}
                  onSelectAccommodation={(accTitle, city) => scrollToQuestionnaire(undefined, city)}
                />

                {/* 7. Why Choose Us */}
                <WhyChooseUsSection items={content.whyChooseUs} />

                {/* 8. Inquiry Questionnaire Form */}
                <InquiryForm
                  initialPackage={selectedPackage}
                  initialCity={selectedCity}
                  onOpenPrivacyPolicy={() => setPolicyType('privacy')}
                />

                {/* 9. FAQ Section */}
                <FaqSection
                  faqs={content.faqs}
                  onOpenQuestionnaire={() => scrollToQuestionnaire()}
                />

                {/* 10. Footer */}
                <Footer
                  settings={content.settings}
                  onOpenPrivacy={() => setPolicyType('privacy')}
                  onOpenTerms={() => setPolicyType('terms')}
                  onOpenAdmin={() => setCurrentView('admin')}
                />

                {/* Legal & Privacy Policy Modal */}
                <PolicyModal
                  type={policyType}
                  onClose={() => setPolicyType(null)}
                />
              </>
            )
          )}
        </div>
      )}
    </AuthProvider>
  );
}
