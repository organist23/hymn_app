export const getWorshipDates = (month, year) => {
  const dates = [];
  const date = new Date(year, month, 1);
  
  while (date.getMonth() === month) {
    const day = date.getDay();
    // 0 = Sunday, 4 = Thursday, 6 = Saturday
    if (day === 0 || day === 4 || day === 6) {
      const dayType = (day === 0 || day === 6) ? 'S' : 'TH';
      const dayNum = String(date.getDate()).padStart(2, '0');
      dates.push({
        date: date.getDate(),
        fullDate: date.toISOString(),
        label: `${dayNum} - ${dayType}`,
        fileLabel: `${dayNum}-${dayType}`,
      });
    }
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

// Alias for backward compatibility if needed, but we'll update the callers.
export const getThursdaysAndSundays = getWorshipDates;

export const getMonthName = (monthIndex) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
};

export const getCurrentDate = () => {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear()
  };
};
