import React from 'react';
import { X, ShieldCheck, Lock } from 'lucide-react';

interface PolicyModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-[#FDFBF7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7F3EA] border border-[#C9A45C]/30 flex items-center justify-center text-[#A77A32]">
              {type === 'privacy' ? <Lock className="w-5 h-5 text-[#C9A45C]" /> : <ShieldCheck className="w-5 h-5 text-[#C9A45C]" />}
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#0F172A]">
                {type === 'privacy' ? 'Privacy Policy & Confidentiality Notice' : 'Terms of Hospitality Service'}
              </h3>
              <span className="text-xs text-slate-500 font-light">
                Wanderer’s Journeys Hospitality Ltd. • Effective October 2026
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-sm text-slate-600 leading-relaxed font-light">
          {type === 'privacy' ? (
            <>
              <h4 className="font-bold text-base text-[#0F172A]">1. Confidential Client Information</h4>
              <p>
                Wanderer’s Journeys respects the privacy of international retirees, guests, and exploratory travelers.
                Information collected via our website questionnaire (including name, email address, telephone number,
                health preferences, and stay duration) is utilized exclusively for generating personalized residential
                and living proposals.
              </p>

              <h4 className="font-bold text-base text-[#0F172A]">2. Data Storage & Security Standards</h4>
              <p>
                All data is transmitted using encrypted TLS protocols. We never sell, lease, or monetize personal details
                to advertising exchanges or unauthorized third parties. Access to lead records is restricted strictly to
                designated senior concierge navigators and verified administrators under strict confidentiality agreements.
              </p>

              <h4 className="font-bold text-base text-[#0F172A]">3. Partner Healthcare & Visa Facilitation</h4>
              <p>
                When you request assistance with medical clinic registrations, international health insurance brokers, or
                visa paperwork, specific relevant details are shared solely with licensed, accredited partners in Vietnam
                upon your explicit prior consent.
              </p>

              <h4 className="font-bold text-base text-[#0F172A]">4. Data Access, Rectification & Erasure</h4>
              <p>
                You retain the right to request a full copy of your intake file or to have your records permanently
                erased from our database at any time by contacting <strong>privacy@wanderersjourneys.com</strong>.
              </p>
            </>
          ) : (
            <>
              <h4 className="font-bold text-base text-[#0F172A]">1. Scope of Hospitality Services</h4>
              <p>
                Wanderer’s Journeys operates as a residential concierge and lifestyle curation service providing serviced
                accommodation leases, housekeeping, clubhouse amenities, and personal navigator support.
              </p>

              <h4 className="font-bold text-base text-[#0F172A]">2. Independent Legal, Medical & Financial Disclaimer</h4>
              <p>
                Wanderer’s Journeys does not act as an accredited law firm, registered medical clinic, or certified investment
                broker. Informational assistance regarding Vietnam visas, local health clinics, or foreign currency exchange
                is provided as concierge orientation and should not replace independent licensed professional counsel.
              </p>

              <h4 className="font-bold text-base text-[#0F172A]">3. Package Inclusions & Utility Fair Use</h4>
              <p>
                Turnkey living packages include utility credits up to $150 USD/month covering electricity, municipal water,
                and high-speed Wi-Fi. Excessive usage beyond ordinary residential allowances is invoiced at local utility rates.
              </p>

              <h4 className="font-bold text-base text-[#0F172A]">4. Booking, Deposits & Cancellation</h4>
              <p>
                All bookings are subject to formal confirmation, identity verification, and lease execution. Flexible
                rescheduling is available for seasonal travelers with 30 days notice.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-stone-200 bg-[#FDFBF7] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#0F172A] hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Understood & Close
          </button>
        </div>
      </div>
    </div>
  );
};
