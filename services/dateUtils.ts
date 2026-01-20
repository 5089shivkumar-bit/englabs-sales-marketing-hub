
/**
 * Utility for handling dates in the Indian Standard Time (IST) zone.
 */
export const dateUtils = {
  /**
   * Returns the current date in IST as a Date object.
   */
  getISTDate(): Date {
    const now = new Date();
    // Convert current time to IST string and then back to a date object if needed, 
    // but for formatting purposes, we usually just need the string.
    return now;
  },

  /**
   * Formats a date or current time into IST string (HH:MM:SS AM/PM).
   */
  formatISTTime(date: Date = new Date()): string {
    return date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  },

  /**
   * Formats a date into IST Date string (DD MMM YYYY).
   */
  formatISTDate(date: Date = new Date()): string {
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },

  /**
   * Returns a YYYY-MM-DD string in IST.
   */
  getISTIsoDate(): string {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    const parts = new Intl.DateTimeFormat('en-IN', options).formatToParts(new Date());
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    return `${year}-${month}-${day}`;
  },

  /**
   * Returns a full timestamp string in IST for logging.
   */
  getISTTimestamp(): string {
    return `${this.formatISTDate()} ${this.formatISTTime()}`;
  }
};
