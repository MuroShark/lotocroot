"use client";

import { useEffect, useRef } from 'react';
import { useTimerStore } from '../../store/timerStore';

/**
 * A non-rendering component that manages the global timer loop.
 * It should be placed in the root layout to persist across page navigations.
 */
export const GlobalTimerController = () => {
  const { isRunning, tick } = useTimerStore();
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const loop = () => {
      tick();
      animationFrameId.current = requestAnimationFrame(loop);
    };

    if (isRunning) {
      loop();
    } else if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isRunning, tick]);

  return null; // This component does not render anything
};