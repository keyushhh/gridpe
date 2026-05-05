/**
 * Checks if the current local time is between 11:00 PM and 6:00 AM.
 * @returns {boolean} True if it's night time (11 PM - 6 AM), false otherwise.
 */
export const isNightTime = (): boolean => {
  const now = new Date();
  const hours = now.getHours();
  // 11 PM is 23:00, 6 AM is 06:00
  return hours >= 23 || hours < 6;
};
