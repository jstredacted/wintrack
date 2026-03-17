import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ViewNavigatorProps {
  viewIndex: number;
  onChangeView: (index: number) => void;
}

export default function ViewNavigator({ viewIndex, onChangeView }: ViewNavigatorProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-4 pb-8 shrink-0">
      {/* Left arrow (visible when on cards view) */}
      <button
        type="button"
        onClick={() => onChangeView(0)}
        className={`transition-opacity ${viewIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-40 hover:opacity-100'}`}
        aria-label="Overview"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Dots */}
      <div className="flex gap-2">
        {[0, 1].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChangeView(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              viewIndex === i
                ? 'bg-foreground'
                : 'bg-foreground/20 hover:bg-foreground/40'
            }`}
            aria-label={i === 0 ? 'Overview' : 'Cards'}
          />
        ))}
      </div>

      {/* Right arrow (visible when on overview) */}
      <button
        type="button"
        onClick={() => onChangeView(1)}
        className={`transition-opacity ${viewIndex === 1 ? 'opacity-0 pointer-events-none' : 'opacity-40 hover:opacity-100'}`}
        aria-label="Cards"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
