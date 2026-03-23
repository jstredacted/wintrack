import { useState, useCallback, useRef } from 'react';
import { PinDots } from './PinDots';

interface PinScreenProps {
  onUnlock: (pin: string) => Promise<boolean>;
}

export default function PinScreen({ onUnlock }: PinScreenProps) {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleShakeEnd = useCallback(() => {
    setError(false);
    setDigits('');
    // Reset the raw input value and re-focus
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  }, []);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      if (error || submittingRef.current) return;
      const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
      // Keep the DOM value in sync (uncontrolled-ish)
      (e.target as HTMLInputElement).value = raw;
      setDigits(raw);
      if (raw.length === 4) {
        submittingRef.current = true;
        setSubmitting(true);
        onUnlock(raw)
          .then((ok) => {
            if (!ok) setError(true);
          })
          .catch(() => {
            setError(true);
          })
          .finally(() => {
            submittingRef.current = false;
            setSubmitting(false);
          });
      }
    },
    [error, onUnlock],
  );

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background">
      <div>
        <h1 className="text-center text-[1.333rem] font-semibold font-mono text-foreground">
          Enter your PIN
        </h1>
        <div className="mt-8">
          <PinDots digits={digits} error={error} onShakeEnd={handleShakeEnd} />
        </div>
      </div>

      {/* Full-screen transparent input — tapping anywhere opens the keyboard */}
      <input
        ref={inputRef}
        autoFocus
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={4}
        onInput={handleInput}
        disabled={submitting}
        aria-label="PIN input"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          fontSize: 16,
          zIndex: 50,
        }}
      />
    </div>
  );
}
