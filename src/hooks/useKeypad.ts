import { useState, useCallback } from "react";

/**
 * Shared logic for custom numeric keypad input
 */
export const useKeypad = (initialValue: string = "0.00") => {
  const [amount, setAmount] = useState<string>(initialValue);

  const handleKeyPress = useCallback((key: string) => {
    setAmount((prev) => {
      // If currently "0.00", replace with the new key (unless it's a dot)
      if (prev === "0.00") {
        return key === "." ? "0." : key;
      }

      // Prevent multiple dots
      if (key === "." && prev.includes(".")) {
        return prev;
      }

      // Limit to 2 decimal places
      if (prev.includes(".")) {
        const [, decimal] = prev.split(".");
        if (decimal && decimal.length >= 2) {
          return prev;
        }
      }

      return prev + key;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setAmount((prev) => {
      if (prev.length <= 1) return "0.00";
      if (prev === "0.00") return "0.00";
      return prev.slice(0, -1);
    });
  }, []);

  const setPillAmount = useCallback((val: string) => {
    setAmount(val);
  }, []);

  const clearAmount = useCallback(() => {
    setAmount("0.00");
  }, []);

  return {
    amount,
    setAmount,
    handleKeyPress,
    handleBackspace,
    setPillAmount,
    clearAmount,
    amountVal: parseFloat(amount) || 0,
    isZero: amount === "0.00"
  };
};
