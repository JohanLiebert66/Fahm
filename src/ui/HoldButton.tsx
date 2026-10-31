import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface HoldButtonProps {
  onComplete: () => void;
  onCancel?: () => void;
  holdDurationMs?: number;
  className?: string;
  children?: React.ReactNode;
  'aria-label': string;
  title?: string;
  disabled?: boolean;
}

const CIRCLE_RADIUS = 20;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // ~125.66

export function HoldButton({
  onComplete,
  onCancel,
  holdDurationMs = 3000,
  className = '',
  children,
  'aria-label': ariaLabel,
  title,
  disabled = false,
}: HoldButtonProps) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);
  const activeKeyRef = useRef<string | null>(null);

  const stopHolding = useCallback(
    (canceled = true) => {
      if (!isHoldingRef.current) return;
      isHoldingRef.current = false;
      startTimeRef.current = null;
      activeKeyRef.current = null;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      setIsHolding(false);
      setProgress(0);

      if (canceled && onCancel) {
        onCancel();
      }
    },
    [onCancel]
  );

  const startHolding = useCallback(() => {
    if (disabled || isHoldingRef.current) return;

    isHoldingRef.current = true;
    setIsHolding(true);
    startTimeRef.current = performance.now();
    setProgress(0);

    const tick = () => {
      if (!isHoldingRef.current || startTimeRef.current === null) return;
      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      const nextProgress = Math.min(1, Math.max(0, elapsed / holdDurationMs));
      setProgress(nextProgress);

      if (elapsed >= holdDurationMs) {
        stopHolding(false);
        onComplete();
      } else {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [disabled, holdDurationMs, onComplete, stopHolding]);

  useEffect(() => {
    const handleBlur = () => {
      if (isHoldingRef.current) {
        stopHolding(true);
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stopHolding]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || e.button !== 0) return;
    startHolding();
  };

  const handlePointerUp = () => {
    stopHolding(true);
  };

  const handlePointerCancel = () => {
    stopHolding(true);
  };

  const handlePointerLeave = () => {
    stopHolding(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || e.repeat) return;
    if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
      e.preventDefault();
      activeKeyRef.current = e.key;
      startHolding();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (activeKeyRef.current === e.key || (activeKeyRef.current === ' ' && e.key === 'Spacebar')) {
      e.preventDefault();
      stopHolding(true);
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onContextMenu={handleContextMenu}
      className={`relative inline-flex items-center justify-center min-w-[48px] min-h-[48px] touch-none select-none ${className}`}
    >
      {/* SVG Progress Ring */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <circle
          cx="24"
          cy="24"
          r={CIRCLE_RADIUS}
          className="text-slate-200 stroke-current opacity-25"
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx="24"
          cy="24"
          r={CIRCLE_RADIUS}
          className={`text-indigo-600 stroke-current motion-reduce:transition-none ${
            isHolding ? 'opacity-100' : 'opacity-0'
          }`}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={CIRCLE_CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <span className="relative z-10 flex items-center justify-center pointer-events-none">
        {children}
      </span>
    </button>
  );
}
