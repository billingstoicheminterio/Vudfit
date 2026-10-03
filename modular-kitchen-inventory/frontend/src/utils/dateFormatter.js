/**
 * Formats a database datetime string (typically UTC) into Indian Standard Time (IST)
 * matching the header reference clock.
 * 
 * @param {string|Date} dateTimeStr - The datetime string or Date object from backend
 * @returns {Object} An object containing formatted date, time, and combined dateTime strings
 */
export const formatISTDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return { date: '', time: '', dateTime: '' };
  
  let dateObj;
  if (typeof dateTimeStr === 'string') {
    let formattedStr = dateTimeStr;
    // SQLite naive timestamps (e.g. from func.now()) are UTC.
    // If no timezone suffix is present, append 'Z' so JS parses it as UTC.
    if (!dateTimeStr.endsWith('Z') && !dateTimeStr.includes('+') && !dateTimeStr.includes('GMT')) {
      formattedStr = dateTimeStr.replace(' ', 'T') + 'Z';
    }
    dateObj = new Date(formattedStr);
  } else {
    dateObj = new Date(dateTimeStr);
  }

  if (isNaN(dateObj.getTime())) {
    return { date: 'Invalid Date', time: 'Invalid Time', dateTime: 'Invalid Date' };
  }

  const datePart = dateObj.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const timePart = dateObj.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return { 
    date: datePart, 
    time: timePart, 
    dateTime: `${datePart} | ${timePart}` 
  };
};
