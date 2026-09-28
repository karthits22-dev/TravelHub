import {
  parseDateKey,
  toDateKey,
  getTodayKey,
  dateKeyToUTC,
} from '../Components/Booking/BookingCalendar';

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// "12 Oct"
export function formatShortDate(dateKey) {
  const {day, month} = parseDateKey(dateKey);
  return `${day} ${MONTH_SHORT[month]}`;
}

// "Mon, 12 Oct"
export function formatWeekdayDate(dateKey) {
  const weekday = new Date(dateKeyToUTC(dateKey)).getUTCDay();
  return `${WEEKDAY_SHORT[weekday]}, ${formatShortDate(dateKey)}`;
}

export function nightsBetween(startKey, endKey) {
  return Math.max(
    1,
    Math.round((dateKeyToUTC(endKey) - dateKeyToUTC(startKey)) / 86400000),
  );
}

// Demo default range shown before the guest picks their own — the nearest
// upcoming Oct 12 → Oct 14 (2 nights).
export function defaultStayRange() {
  const todayKey = getTodayKey();
  const {year} = parseDateKey(todayKey);
  let checkIn = toDateKey(year, 9, 12); // month index 9 = October
  let checkOut = toDateKey(year, 9, 14);
  if (checkIn < todayKey) {
    checkIn = toDateKey(year + 1, 9, 12);
    checkOut = toDateKey(year + 1, 9, 14);
  }
  return {checkIn, checkOut};
}
