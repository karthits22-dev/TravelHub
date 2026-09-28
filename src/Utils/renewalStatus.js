import {
  dateKeyToUTC,
  getTodayKey,
} from '../Components/Booking/BookingCalendar';
import {formatShortDate} from './stayDates';

// A document is "lapsing soon" once it's within this many days of its
// expiry — matches the reminder cadence described on the Renewals screen
// (weekly nudges start a month out, so that's also when the pill turns
// orange).
const LAPSING_WINDOW_DAYS = 30;

export function daysUntil(expiryDateKey) {
  const diff = dateKeyToUTC(expiryDateKey) - dateKeyToUTC(getTodayKey());
  return Math.round(diff / 86400000);
}

// 'lapsed' | 'lapsing' | 'renewed' | 'upcoming'
// Date math always wins near the deadline — a document that was renewed
// months ago but is due again inside the lapsing window still needs to
// show as lapsing, not renewed.
export function getRenewalStatus(item) {
  const days = daysUntil(item.expiryDate);
  if (days < 0) return 'lapsed';
  if (days <= LAPSING_WINDOW_DAYS) return 'lapsing';
  if (item.renewedOn) return 'renewed';
  return 'upcoming';
}

export const STATUS_META = {
  renewed: {label: 'Renewed', bg: '#E1EEE8', text: '#1F6F5C'},
  lapsing: {label: 'Lapsing soon', bg: '#FCEEDD', text: '#C2703D'},
  lapsed: {label: 'Lapsed', bg: '#FBE1E1', text: '#C23E3E'},
  upcoming: {label: 'Upcoming', bg: '#EEF2F0', text: '#5B6B66'},
};

export function renewalPillLabel(status, days) {
  if (status === 'renewed') return 'Renewed';
  if (status === 'lapsed') return 'Lapsed';
  if (status === 'lapsing') {
    if (days <= 0) return 'Due today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  }
  return `${days} days left`;
}

// {prefix, suffix, status, days} — prefix comes from the document type
// (e.g. "Policy KA-05-MJ-1082"), suffix reports the date relevant to its
// current status.
export function renewalSubtitle(item, type) {
  const status = getRenewalStatus(item);
  const days = daysUntil(item.expiryDate);
  const prefix = type.subtitlePrefix(item);
  const suffix =
    status === 'lapsed'
      ? `Expired ${formatShortDate(item.expiryDate)}`
      : status === 'renewed'
      ? `Renewed ${formatShortDate(item.renewedOn)}`
      : `Expires ${formatShortDate(item.expiryDate)}`;
  return {prefix, suffix, status, days};
}
