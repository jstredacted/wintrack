import { useState, useEffect, useCallback, useRef } from 'react';
import { PinDots } from './PinDots';

type SetupStep = 'enter' | 'confirm' | 'mismatch';

interface PinSetupProps {
  onComplete: (pin: string) => Promise<void>;
}

const COPY: Record<SetupStep, { title: string; subtitle: string }> = {
  enter: { title: 'Set your PIN', subtitle: 'Choose a 4-digit PIN' },
  confirm: { title: 'Confirm your PIN', subtitle: 'Enter it again to confirm' },
  mismatch: { title: "PINs didn't match", subtitle: "Let's try again" },
};

export default function PinSetup({ onComplete }: PinSetupProps) {
  const [step, setStep] = useState<SetupStep>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [digits, setDigits] = useState('');
  const [error, setError] = useState(false);
  const mismatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetToEnter = useCallback(() => {
    setStep('enter');
    setFirstPin('');
    setDigits('');
    setError(false);
  }, []);

  // Handle auto-advance when 4 digits entered
  useEffect(() => {
    if (digits.length !== 4) return;

    if (step === 'enter') {
      setFirstPin(digits);
      setDigits('');
      setStep('confirm');
    } else if (step === 'confirm') {
      if (digits === firstPin) {
        onComplete(firstPin);
      } else {
        setStep('mismatch');
        setError(true);
      }
    }
  }, [digits, step, firstPin, onComplete]);

  const handleShakeEnd = useCallback(() => {
    setError(false);
    setDigits('');
    // After shake ends, show mismatch message for 1.5s then reset
    mismatchTimerRef.current = setTimeout(() => {
      resetToEnter();
      mismatchTimerRef.current = null;
    }, 1500);
  }, [resetToEnter]);

  // Cleanup mismatch timer on unmount
  useEffect(() => {
    return () => {
      if (mismatchTimerRef.current) clearTimeout(mismatchTimerRef.current);
    };
  }, []);

  // Keyboard handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (error || step === 'mismatch') return;

      if (/^[0-9]$/.test(e.key)) {
        setDigits((prev) => (prev.length < 4 ? prev + e.key : prev));
      } else if (e.key === 'Backspace') {
        setDigits((prev) => prev.slice(0, -1));
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [error, step]);

  const { title, subtitle } = COPY[step];

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center bg-background">
      <div className="pt-12">
        <h1 className="text-center text-[1.333rem] font-semibold font-mono text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-center text-[14px] font-mono text-muted-foreground">
          {subtitle}
        </p>
        <div className="mt-8">
          <PinDots digits={digits} error={error} onShakeEnd={handleShakeEnd} />
        </div>
      </div>
    </div>
  );
}
