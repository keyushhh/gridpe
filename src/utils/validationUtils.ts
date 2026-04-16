
// Basic Luhn Algorithm for Card Number Validation
export const luhnCheck = (val: string) => {
    let sum = 0;
    let shouldDouble = false;
    for (let i = val.length - 1; i >= 0; i--) {
        let intVal = parseInt(val.charAt(i));

        if (shouldDouble) {
            intVal *= 2;
            if (intVal > 9) {
                intVal -= 9;
            }
        }

        sum += intVal;
        shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0;
};

// Validate Expiry Date (MM/YY)
export const validateExpiry = (val: string): string | null => {
    if (val.length !== 5) return "Invalid date.";
    const parts = val.split('/');
    if (parts.length !== 2) return "Invalid format.";

    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);

    if (isNaN(month) || isNaN(year)) return "Invalid numbers.";
    if (month < 1 || month > 12) return "Invalid month.";

    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (year < currentYear || (year === currentYear && month <= currentMonth)) {
        return "This card is expired.";
    }

    return null;
};

// Validate CVV based on Card Type
export const validateCVV = (val: string, cardType: string | null): string | null => {
    if (!val) return "CVV is required.";
    const len = val.length;

    if (len < 3) return "Invalid CVV.";
    if (len > 4) return "Invalid CVV.";

    return null;
};

// Validate MPIN Weakness
export const isWeakMpin = (pin: string): { weak: boolean; reason?: 'predictable' } => {
  if (pin.length !== 4) return { weak: false };

  // Check for all same digits (0000, 1111, 2222, etc.)
  if (/^(\d)\1{3}$/.test(pin)) return { weak: true, reason: 'predictable' };

  // Check for sequential ascending (1234, 2345, 0123, etc.)
  const digits = pin.split('').map(Number);
  const isAscending = digits.every((d, i) => i === 0 || d === digits[i - 1] + 1);
  if (isAscending) return { weak: true, reason: 'predictable' };

  // Common weak PINs blocklist
  const weakPins = ['1212', '2121', '1122', '2211', '1221', '2020', '6969', '1010', '0101', '1357', '2468'];
  if (weakPins.includes(pin)) return { weak: true, reason: 'predictable' };

  return { weak: false };
};
