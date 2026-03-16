import { useState, useEffect, useCallback } from 'react';
import { PinDots } from './PinDots';

interface PinScreenProps {
  onUnlock: (pin: string) => Promise<boolean>;
}

export default function PinScreen({ onUnlock }: PinScreenProps) {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleShakeEnd = useCallback(() => {
    setError(false);
    setDigits('');
  }, []);

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (digits.length !== 4 || submitting) return;

    setSubmitting(true);
    onUnlock(digits).then((ok) => {
      if (!ok) {
        setError(true);
      }
      setSubmitting(false);
    });
  }, [digits, onUnlock, submitting]);

  // Keyboard handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (error || submitting) return;

      if (/^[0-9]$/.test(e.key)) {
        setDigits((prev) => (prev.length < 4 ? prev + e.key : prev));
      } else if (e.key === 'Backspace') {
        setDigits((prev) => prev.slice(0, -1));
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [error, submitting]);

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
    </div>
  );
}
