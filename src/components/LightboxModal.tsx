import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AccommodationImage } from '../types';

interface LightboxModalProps {
  isOpen: boolean;
  images: AccommodationImage[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  title: string;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  title,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 z-10">
        <div>
          <h4 className="font-serif text-lg sm:text-xl font-bold">{title}</h4>
          <span className="text-xs text-stone-400">
            Image {currentIndex + 1} of {images.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          aria-label="Close photo lightbox"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center py-4 overflow-hidden">
        {images.length > 1 && (
          <button
            onClick={onPrev}
            className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-black/60 hover:bg-[#C9A45C] hover:text-[#0F172A] text-white border border-white/20 transition-all cursor-pointer"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <img
          src={currentImage.url}
          alt={currentImage.caption || title}
          className="max-h-[75vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-opacity duration-200"
        />

        {images.length > 1 && (
          <button
            onClick={onNext}
            className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-black/60 hover:bg-[#C9A45C] hover:text-[#0F172A] text-white border border-white/20 transition-all cursor-pointer"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Caption & Navigation Dots */}
      <div className="text-center text-white/90 pt-3 border-t border-white/10">
        <p className="text-sm font-medium italic text-stone-200">
          {currentImage.caption || 'Wanderer’s Journeys Managed Residence'}
        </p>
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (idx < currentIndex) onPrev();
                  else if (idx > currentIndex) onNext();
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-6 bg-[#C9A45C]' : 'w-2 bg-white/30'
                }`}
                aria-label={`Jump to image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
