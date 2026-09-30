import React from 'react';
import { ChevronLeft, ChevronRight, X, Maximize, Play, Layers } from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';

export const PresentationControls: React.FC = () => {
  const {
    isPresentationMode,
    setIsPresentationMode,
    frameSlides,
    currentSlideIndex,
    goToSlide,
    nextSlide,
    prevSlide,
  } = useCanvas();

  if (!isPresentationMode) return null;

  const currentFrame = frameSlides[currentSlideIndex];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-slate-900/90 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700 pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Slide counter & Title */}
      <div className="flex items-center gap-2 mr-2">
        <Layers className="w-4 h-4 text-blue-400" />
        {frameSlides.length > 0 ? (
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight truncate max-w-[200px]">
              {currentFrame?.title || `Slide ${currentSlideIndex + 1}`}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Slide {currentSlideIndex + 1} of {frameSlides.length}
            </span>
          </div>
        ) : (
          <div className="text-xs text-slate-300">
            No frames found · Tip: Draw Frames (F) to define slides
          </div>
        )}
      </div>

      {frameSlides.length > 1 && (
        <div className="flex items-center gap-1">
          {/* Previous Slide */}
          <button
            type="button"
            onClick={prevSlide}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title="Previous slide (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Quick slide indicators dots */}
          <div className="flex items-center gap-1 px-1">
            {frameSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  currentSlideIndex === idx
                    ? 'w-5 bg-blue-500'
                    : 'bg-slate-600 hover:bg-slate-400'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Next Slide */}
          <button
            type="button"
            onClick={nextSlide}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title="Next slide (Right Arrow / Space)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="w-[1px] h-5 bg-slate-700 mx-1" />

      {/* Exit Presentation */}
      <button
        type="button"
        onClick={() => setIsPresentationMode(false)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        title="Exit Presentation Mode (Esc)"
      >
        <X className="w-3.5 h-3.5" />
        <span>Exit</span>
      </button>
    </div>
  );
};
