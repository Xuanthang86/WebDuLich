import React, { useState } from 'react';
import {
  Send,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Users,
  Compass,
  FileText,
  Lock,
} from 'lucide-react';
import { submitInquiry } from '../api';
import { InquiryFormField } from '../types';

interface InquiryFormProps {
  initialPackage?: string;
  initialCity?: string;
  fields?: InquiryFormField[];
  onOpenPrivacyPolicy?: () => void;
}

export const InquiryForm: React.FC<InquiryFormProps> = ({
  initialPackage,
  initialCity,
  onOpenPrivacyPolicy,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedLeadCode, setSubmittedLeadCode] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryCode: 'United States',
    expectedStartDate: '',
    duration: '30 Days (Living Trial)',
    guestCount: 2,
    ageGroups: '60 - 69',
    packageCode: initialPackage || '30-Day Living Trial',
    packageName: initialPackage || '30-Day Living Trial',
    destinationCity: initialCity || 'Da Nang (Beachfront & Coastal Living)',
    preferredAccommodationType: 'Ocean View Serviced Apartment',
    activities: ['Seaside Swimming & Walking', 'Gourmet Dining & Cooking Classes'],
    transportPreference: 'Walking & On-Demand Grab/Taxis',
    estimatedBudget: '$2,500 - $3,500 / month',
    additionalNotes: '',
    consentAccepted: true,
    _hp_website_trap: '', // honeypot
  });

  // Keep state updated if props change
  React.useEffect(() => {
    if (initialPackage) {
      setFormData(prev => ({
        ...prev,
        packageCode: initialPackage,
        packageName: initialPackage,
      }));
    }
  }, [initialPackage]);

  React.useEffect(() => {
    if (initialCity) {
      setFormData(prev => ({
        ...prev,
        destinationCity: initialCity,
      }));
    }
  }, [initialCity]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSubmitError(null);
  };

  const handleActivityToggle = (activity: string) => {
    setFormData(prev => {
      const exists = prev.activities.includes(activity);
      const updated = exists
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity];
      return { ...prev, activities: updated };
    });
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      setSubmitError('Please enter your full legal name.');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setSubmitError('Please enter a valid email address.');
      return false;
    }
    setSubmitError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consentAccepted) {
      setSubmitError('Please accept the privacy and data handling notice to proceed.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await submitInquiry(formData);
      setSubmittedLeadCode(res.leadCode);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit proposal request. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedLeadCode) {
    return (
      <section id="questionnaire" className="py-24 bg-[#0F172A] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 border border-[#C9A45C]/40 rounded-3xl p-8 sm:p-12 text-center shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-[#C9A45C]/20 border border-[#C9A45C] flex items-center justify-center text-[#C9A45C] mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A45C] block mb-2">
              Proposal Request Confirmed
            </span>

            <h3 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Thank You, {formData.fullName.split(' ')[0]}!
            </h3>

            <p className="text-slate-300 text-base sm:text-lg font-light leading-relaxed mb-6">
              Your inquiry has been registered in our concierge reservation system. A dedicated senior
              lifestyle advisor has been assigned to your file and will review your living preferences.
            </p>

            <div className="bg-slate-800/90 rounded-2xl p-6 max-w-md mx-auto mb-8 border border-slate-700 text-left">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Your Official Lead Reference Code:
              </div>
              <div className="font-mono text-2xl font-bold text-[#C9A45C] tracking-wider mb-4">
                {submittedLeadCode}
              </div>

              <div className="text-xs text-slate-300 space-y-1.5 border-t border-slate-700 pt-3">
                <p><strong>Package:</strong> {formData.packageName}</p>
                <p><strong>Hub:</strong> {formData.destinationCity}</p>
                <p><strong>Duration:</strong> {formData.duration}</p>
                <p><strong>Email:</strong> {formData.email}</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-8 max-w-lg mx-auto font-light">
              We have dispatched an automated confirmation to your email. Please check your inbox or spam folder. For immediate assistance, you may reach our Saigon concierge team at <strong>info@wanderersjourneys.com</strong>.
            </p>

            <button
              onClick={() => {
                setSubmittedLeadCode(null);
                setStep(1);
              }}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#C9A45C] to-[#A77A32] text-[#0F172A] font-bold text-sm tracking-wide hover:from-[#d8b368] hover:to-[#b8893d] transition-all cursor-pointer"
            >
              Submit Another Inquiry or Amend Details
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="questionnaire" className="py-12 sm:py-16 md:py-20 bg-[#0F172A] text-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="text-xs sm:text-sm font-semibold tracking-widest text-[#C9A45C] uppercase mb-2">
            Personalized Concierge Intake
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Request Your Bespoke Proposal
          </h2>
          <p className="text-base text-slate-300 font-light leading-relaxed">
            Tell us about your target timing, desired coastal hub, and lifestyle passions. We will tailor
            a detailed proposal with pricing, sample floorplans, and healthcare orientation.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="grid grid-cols-4 gap-2 mb-6 sm:mb-8 max-w-xl mx-auto">
          {[
            { num: 1, label: 'Profile' },
            { num: 2, label: 'Stay' },
            { num: 3, label: 'Lifestyle' },
            { num: 4, label: 'Confirm' },
          ].map(s => (
            <div key={s.num} className="text-center">
              <div
                className={`h-2 rounded-full mb-2 transition-colors ${
                  step >= s.num ? 'bg-[#C9A45C]' : 'bg-slate-800'
                }`}
              />
              <span
                className={`text-xs font-medium block ${
                  step === s.num ? 'text-[#C9A45C]' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
          {submitError && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Honeypot hidden input against automated bots */}
            <input
              type="text"
              name="_hp_website_trap"
              value={formData._hp_website_trap}
              onChange={e => handleChange('_hp_website_trap', e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            {/* STEP 1: TRAVELER PROFILE */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-800 pb-4 mb-6">
                  <h3 className="font-serif text-2xl font-bold text-white mb-1">
                    Step 1: Primary Traveler Profile
                  </h3>
                  <p className="text-xs text-slate-400">
                    Please provide your contact details so our senior concierge can send your proposal.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Full Legal Name(s) <span className="text-[#C9A45C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => handleChange('fullName', e.target.value)}
                    placeholder="e.g., Jonathan & Eleanor Miller"
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A45C] text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Email Address <span className="text-[#C9A45C]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => handleChange('email', e.target.value)}
                      placeholder="jonathan@example.com"
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A45C] text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A45C] text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Country of Citizenship / Current Residence
                  </label>
                  <select
                    value={formData.countryCode}
                    onChange={e => handleChange('countryCode', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-[#C9A45C] text-base"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="New Zealand">New Zealand</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Other Western / International">Other Western / International</option>
                  </select>
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) setStep(2);
                    }}
                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#C9A45C] to-[#A77A32] text-[#0F172A] font-bold text-sm tracking-wide hover:from-[#d8b368] hover:to-[#b8893d] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Stay Timing</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: STAY DURATION & TIMING */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-800 pb-4 mb-6">
                  <h3 className="font-serif text-2xl font-bold text-white mb-1">
                    Step 2: Stay Duration & Travel Group
                  </h3>
                  <p className="text-xs text-slate-400">
                    Help us understand when you wish to travel and who will accompany you.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Target Arrival Date
                    </label>
                    <input
                      type="date"
                      value={formData.expectedStartDate}
                      onChange={e => handleChange('expectedStartDate', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-[#C9A45C] text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Intended Stay Duration
                    </label>
                    <select
                      value={formData.duration}
                      onChange={e => handleChange('duration', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-[#C9A45C] text-base"
                    >
                      <option value="7 - 14 Days (Private Discovery Tour)">7 - 14 Days (Private Discovery Tour)</option>
                      <option value="30 Days (Living Trial)">30 Days (Living Trial)</option>
                      <option value="60 - 90 Days (Winter Snowbird)">60 - 90 Days (Winter Snowbird)</option>
                      <option value="6 Months (Exploratory Stay)">6 Months (Exploratory Stay)</option>
                      <option value="12 Months+ (Full Retirement Living)">12 Months+ (Full Retirement Living)</option>
                      <option value="Still Deciding / Flexible">Still Deciding / Flexible</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Number of Guests
                    </label>
                    <select
                      value={formData.guestCount}
                      onChange={e => handleChange('guestCount', parseInt(e.target.value, 10))}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-[#C9A45C] text-base"
                    >
                      <option value={1}>1 Guest (Solo Traveler)</option>
                      <option value={2}>2 Guests (Couple or Companions)</option>
                      <option value={3}>3 Guests</option>
                      <option value={4}>4+ Guests (Family)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Age Bracket of Primary Guest(s)
                    </label>
                    <select
                      value={formData.ageGroups}
                      onChange={e => handleChange('ageGroups', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-[#C9A45C] text-base"
                    >
                      <option value="50 - 59">50 - 59 years</option>
                      <option value="60 - 69">60 - 69 years</option>
                      <option value="70 - 79">70 - 79 years</option>
                      <option value="80+">80+ years</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 rounded-full border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#C9A45C] to-[#A77A32] text-[#0F172A] font-bold text-sm tracking-wide hover:from-[#d8b368] hover:to-[#b8893d] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Hub & Lifestyle</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: HUB, PACKAGE & LIFESTYLE */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-800 pb-4 mb-6">
                  <h3 className="font-serif text-2xl font-bold text-white mb-1">
                    Step 3: Destination Hub & Living Style
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select your preferred city and interests for our lifestyle coordinator.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Living Package of Interest
                    </label>
                    <select
                      value={formData.packageName}
                      onChange={e => {
                        handleChange('packageName', e.target.value);
                        handleChange('packageCode', e.target.value);
                      }}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-[#C9A45C] text-base"
                    >
                      <option value="Private Discovery Tour (7-14 Days)">Private Discovery Tour (7-14 Days)</option>
                      <option value="30-Day Living Trial">30-Day Living Trial</option>
                      <option value="Snowbird Special (30-90 Days)">Snowbird Special (30-90 Days)</option>
                      <option value="Six-Month Exploratory Stay">Six-Month Exploratory Stay</option>
                      <option value="Full Retirement Package (12 Months)">Full Retirement Package (12 Months)</option>
                      <option value="Custom Consultation">Custom Consultation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Desired Hub City
                    </label>
                    <select
                      value={formData.destinationCity}
                      onChange={e => handleChange('destinationCity', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-[#C9A45C] text-base"
                    >
                      <option value="Da Nang (Beachfront & Coastal Living)">Da Nang (Beachfront & Coastal Living)</option>
                      <option value="Nha Trang (Tropical Bay & Wellness Promenade)">Nha Trang (Tropical Bay & Wellness Promenade)</option>
                      <option value="Ho Chi Minh City (Vibrant Culture & Medical Center)">Ho Chi Minh City (Vibrant Culture & Medical Center)</option>
                      <option value="Multi-City Split (e.g. Da Nang + Saigon)">Multi-City Split (e.g. Da Nang + Saigon)</option>
                      <option value="Undecided / Open to Advice">Undecided / Open to Advice</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-3">
                    Interests & Activities (Select all that apply)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      'Championship Golf',
                      'Seaside Swimming & Walking',
                      'Yoga & Wellness Retreats',
                      'Gourmet Dining & Cooking Classes',
                      'Historical & Cultural Excursions',
                      'Expat Social Gatherings',
                    ].map(activity => (
                      <label
                        key={activity}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-sm transition-all cursor-pointer ${
                          formData.activities.includes(activity)
                            ? 'bg-[#C9A45C]/15 border-[#C9A45C] text-white font-medium'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.activities.includes(activity)}
                          onChange={() => handleActivityToggle(activity)}
                          className="w-4 h-4 rounded text-[#C9A45C] accent-[#C9A45C]"
                        />
                        <span>{activity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 rounded-full border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#C9A45C] to-[#A77A32] text-[#0F172A] font-bold text-sm tracking-wide hover:from-[#d8b368] hover:to-[#b8893d] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Review & Confirm</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: NOTES, PRIVACY CONSENT & SUBMISSION */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-800 pb-4 mb-6">
                  <h3 className="font-serif text-2xl font-bold text-white mb-1">
                    Step 4: Special Considerations & Final Confirmation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Review your proposal parameters and submit your confidential inquiry.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Questions, Health/Dietary Needs, or Specific Inquiries
                  </label>
                  <textarea
                    rows={4}
                    value={formData.additionalNotes}
                    onChange={e => handleChange('additionalNotes', e.target.value)}
                    placeholder="Tell us about mobility preferences, pet relocation, favorite hobbies, or any medical questions..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A45C] text-sm"
                  />
                </div>

                {/* Summary Card */}
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs sm:text-sm text-slate-300">
                  <div className="font-semibold text-[#C9A45C] mb-2 uppercase tracking-wider">
                    Intake Summary:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>Traveler:</strong> {formData.fullName}</div>
                    <div><strong>Email:</strong> {formData.email}</div>
                    <div><strong>Duration:</strong> {formData.duration}</div>
                    <div><strong>Package:</strong> {formData.packageName}</div>
                    <div><strong>Destination:</strong> {formData.destinationCity}</div>
                    <div><strong>Citizenship:</strong> {formData.countryCode}</div>
                  </div>
                </div>

                {/* Consent & Privacy */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.consentAccepted}
                      onChange={e => handleChange('consentAccepted', e.target.checked)}
                      className="w-4 h-4 rounded text-[#C9A45C] accent-[#C9A45C] mt-0.5"
                    />
                    <span className="text-xs text-slate-300 leading-normal">
                      I agree to the confidential processing of my inquiry in accordance with Wanderer’s
                      Journeys Privacy Notice. My personal details will never be sold or shared with
                      unrelated third parties.{' '}
                      {onOpenPrivacyPolicy && (
                        <button
                          type="button"
                          onClick={onOpenPrivacyPolicy}
                          className="text-[#C9A45C] underline hover:text-[#d8b368] inline cursor-pointer"
                        >
                          View Privacy Policy
                        </button>
                      )}
                    </span>
                  </label>
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-full border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-9 py-4 rounded-full bg-gradient-to-r from-[#C9A45C] to-[#A77A32] text-[#0F172A] font-bold text-base tracking-wide hover:from-[#d8b368] hover:to-[#b8893d] transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#C9A45C]/30 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Transmitting Request...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Proposal Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};
