import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSensitiveInputOptions {
  maskDelay?: number; // default 5000ms
  isPermanentlyVisible?: boolean; // controlled by eye toggle
}

export const useSensitiveInput = (options: UseSensitiveInputOptions = {}) => {
  const { maskDelay = 5000, isPermanentlyVisible = false } = options;

  const [value, setValue] = useState('');
  const [isTempVisible, setIsTempVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Derived visibility state
  const isVisible = isPermanentlyVisible || isTempVisible;

  // Function to handle changes (typing)
  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);

      // Trigger temporary visibility
      if (!isPermanentlyVisible) {
        setIsTempVisible(true);

        // Reset timer
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsTempVisible(false);
        }, maskDelay);
      }
    },
    [maskDelay, isPermanentlyVisible]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // If permanent visibility is toggled ON, clear temp state
  useEffect(() => {
    if (isPermanentlyVisible) {
      setIsTempVisible(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [isPermanentlyVisible]);

  return {
    value,
    isVisible,
    handleChange,
  };
};
