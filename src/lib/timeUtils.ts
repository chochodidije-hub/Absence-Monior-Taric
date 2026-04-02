/**
 * Time Utility for Local Device Time
 * Reverted to local system clock as per user request.
 */

export const fetchGlobalTime = async (): Promise<Date | null> => {
  // Directly return local system time
  return new Date();
};

export const formatVerifiedTime = (date: Date): string => {
  // Use local time formatting to match user's taskbar
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatVerifiedDate = (date: Date): string => {
  // Use local date formatting
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
