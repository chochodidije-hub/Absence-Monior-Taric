/**
 * Time Utility for Verified Network Time (Casablanca Timezone)
 */

async function getVerifiedTime() {
  try {
    // Try primary source
    const response = await fetch('https://worldtimeapi.org/api/timezone/Africa/Casablanca');
    if (!response.ok) throw new Error('WorldTimeAPI fetch failed');
    const data = await response.json();
    return new Date(data.datetime);
  } catch (error) {
    try {
      // Try secondary source
      const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Africa/Casablanca');
      if (!response.ok) throw new Error('TimeAPI fetch failed');
      const data = await response.json();
      return new Date(data.dateTime);
    } catch (fallbackError) {
      console.warn('Falling back to forced Casablanca timezone logic:', fallbackError);
      // Fallback: Force Casablanca timezone even if system clock is different
      const casablancaTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Africa/Casablanca' });
      return new Date(casablancaTimeStr);
    }
  }
}

function formatVerifiedTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatVerifiedDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

// Export for browser
window.timeUtils = { getVerifiedTime, formatVerifiedTime, formatVerifiedDate };
