import {useSyncExternalStore} from 'react';
import {commissionFor, computeEarnings, slabIndexFor, SLABS} from '../Utils/amcCommission';

// Demo state for the AMC agent flow (membership dashboard, member
// registration, withdrawals). There's no agent/commission backend yet, so
// it lives in memory and resets when the app restarts — replace the
// actions at the bottom with API calls once endpoints exist; the screens
// only go through useAmcState() and these actions.

export const AGENT = {
  name: 'Priya Sharma',
  code: 'AGT-2298',
  // Month of the agent's 3-month enrolment cycle that the current
  // calendar month falls in — decides which commission rates apply.
  cycleMonth: 1,
  nextRenewal: new Date(2027, 2, 4),
};

// Placeholder link format — point this at the real signup deep link.
export const REFERRAL_LINK = `https://aarvi.app/join?ref=${AGENT.code}`;

export const BANK_ACCOUNTS = [
  {id: 'hdfc', bank: 'HDFC Bank', shortName: 'HDFC', type: 'Savings', last4: '4821', ifsc: 'HDFC0001234'},
  {id: 'sbi', bank: 'State Bank of India', shortName: 'SBI', type: 'Savings', last4: '0937', ifsc: 'SBIN0004521'},
];

const DAY_MS = 86400000;

export const isSameMonth = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

// ---- Seed data -----------------------------------------------------------

const FIRST_NAMES = [
  'Arjun', 'Kavya', 'Rahul', 'Meera', 'Vikram', 'Divya', 'Suresh', 'Lakshmi',
  'Karthik', 'Pooja', 'Naveen', 'Asha', 'Rohan', 'Nisha', 'Ganesh', 'Swathi',
  'Harish', 'Revathi', 'Ajay', 'Shalini',
];
const LAST_NAMES = [
  'Rao', 'Iyer', 'Reddy', 'Nair', 'Menon', 'Hegde', 'Kamath', 'Shenoy',
  'Gowda', 'Bhat', 'Prabhu', 'Pillai', 'Das',
];

// Deterministic 10-digit mobile number from a seed.
const seedPhone = seed => `9${String((seed * 7919 + 12345) % 1000000000).padStart(9, '0')}`;

function makeRegistration({id, name, phone, createdAt, status, memberNo, cycleMonth}) {
  // A failed registration never got a member number; it's shown at the
  // rate the next member would have earned, but excluded from totals.
  const tierNo = memberNo ?? 1;
  return {
    id,
    name,
    phone,
    email: '',
    address: '',
    createdAt,
    status, // 'paid' | 'pending' | 'failed'
    memberNo,
    tierLabel: SLABS[slabIndexFor(tierNo)].tierLabel,
    commission: commissionFor(tierNo, cycleMonth),
  };
}

// The newest few this month, pinned so the list opens on familiar names.
const RECENT = [
  {name: 'Ravi Kumar', phone: '9845022190', daysAgo: 0, status: 'paid'},
  {name: 'Sunita Naik', phone: '9008011223', daysAgo: 0, status: 'pending'},
  {name: 'Manoj Joshi', phone: '9972044510', daysAgo: 2, status: 'paid'},
  {name: 'Anita Pai', phone: '9740088213', daysAgo: 3, status: 'paid'},
];
const THIS_MONTH_MEMBERS = 178;
const LAST_MONTH_MEMBERS = 42;

function seedRegistrations(now) {
  const list = [];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 9);
  const clampToMonth = date => new Date(Math.max(date.getTime(), monthStart.getTime()));

  // Last month, all paid, at month-3 rates of the previous cycle.
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 9);
  const lastMonthSpan = monthStart - lastMonthStart;
  for (let i = 1; i <= LAST_MONTH_MEMBERS; i++) {
    list.push(
      makeRegistration({
        id: `seed-prev-${i}`,
        name: `${FIRST_NAMES[(i * 3) % FIRST_NAMES.length]} ${LAST_NAMES[(i * 5) % LAST_NAMES.length]}`,
        phone: seedPhone(1000 + i),
        createdAt: new Date(lastMonthStart.getTime() + (lastMonthSpan * i) / (LAST_MONTH_MEMBERS + 1)),
        status: 'paid',
        memberNo: i,
        cycleMonth: 3,
      }),
    );
  }

  // This month: the bulk spread from the 1st up to a few days ago…
  const bulk = THIS_MONTH_MEMBERS - RECENT.length;
  const bulkEnd = clampToMonth(new Date(now.getTime() - 4 * DAY_MS));
  const bulkSpan = bulkEnd - monthStart;
  for (let i = 1; i <= bulk; i++) {
    list.push(
      makeRegistration({
        id: `seed-${i}`,
        name: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 7) % LAST_NAMES.length]}`,
        phone: seedPhone(i),
        createdAt: new Date(monthStart.getTime() + (bulkSpan * i) / (bulk + 1)),
        status: i % 23 === 0 ? 'pending' : 'paid',
        memberNo: i,
        cycleMonth: AGENT.cycleMonth,
      }),
    );
  }

  // …one failed payment (no member number)…
  list.push({
    ...makeRegistration({
      id: 'seed-failed',
      name: 'Deepak Shetty',
      phone: '9611077302',
      createdAt: clampToMonth(new Date(now.getTime() - 4 * DAY_MS + 3600000)),
      status: 'failed',
      memberNo: null,
      cycleMonth: AGENT.cycleMonth,
    }),
    tierLabel: SLABS[slabIndexFor(bulk + 1)].tierLabel,
    commission: commissionFor(bulk + 1, AGENT.cycleMonth),
  });

  // …then the pinned recent ones, oldest first.
  [...RECENT].reverse().forEach((r, i) => {
    list.push(
      makeRegistration({
        id: `seed-recent-${i}`,
        name: r.name,
        phone: r.phone,
        createdAt: clampToMonth(new Date(now.getTime() - r.daysAgo * DAY_MS - (RECENT.length - i) * 600000)),
        status: r.status,
        memberNo: bulk + 1 + i,
        cycleMonth: AGENT.cycleMonth,
      }),
    );
  });

  // Newest first.
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

function seedWithdrawals(now) {
  return [
    {
      id: 'WDR-71204',
      amount: 7200,
      accountId: 'hdfc',
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 12),
      expectedBy: new Date(now.getFullYear(), now.getMonth() - 1, 14),
      status: 'completed',
    },
    {
      id: 'WDR-64310',
      amount: 4340,
      accountId: 'hdfc',
      createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 14),
      expectedBy: new Date(now.getFullYear(), now.getMonth() - 2, 16),
      status: 'completed',
    },
  ];
}

// ---- Store ---------------------------------------------------------------

const seedNow = new Date();
let state = {
  registrations: seedRegistrations(seedNow),
  withdrawals: seedWithdrawals(seedNow),
  selectedAccountId: BANK_ACCOUNTS[0].id,
};
const listeners = new Set();

function setState(next) {
  state = next;
  listeners.forEach(listener => listener());
}

const subscribe = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => state;

// Returns the raw state object (a stable reference between updates);
// derive anything else with the selectors below inside useMemo.
export const useAmcState = () => useSyncExternalStore(subscribe, getSnapshot);

// ---- Selectors -----------------------------------------------------------

// Registrations that count toward this month's slabs (failed don't).
export const thisMonthMembers = (s, now = new Date()) =>
  s.registrations.filter(r => r.status !== 'failed' && isSameMonth(r.createdAt, now));

// Everything the dashboard/withdraw screens need about this month.
export function monthSummary(s, now = new Date()) {
  const memberCount = thisMonthMembers(s, now).length;
  const earnings = computeEarnings(memberCount, AGENT.cycleMonth);
  const withdrawn = s.withdrawals
    .filter(w => isSameMonth(w.createdAt, now))
    .reduce((sum, w) => sum + w.amount, 0);
  return {
    memberCount,
    earnings,
    withdrawn,
    available: Math.max(0, earnings.total - withdrawn),
  };
}

export const getAccount = id => BANK_ACCOUNTS.find(a => a.id === id) ?? BANK_ACCOUNTS[0];

// ---- Actions -------------------------------------------------------------

export function registerMember({name, phone, email, address}) {
  const memberNo = thisMonthMembers(state).length + 1;
  const record = {
    ...makeRegistration({
      id: `reg-${Date.now()}`,
      name,
      phone,
      createdAt: new Date(),
      // The ₹118 is collected at registration, so it starts out paid.
      status: 'paid',
      memberNo,
      cycleMonth: AGENT.cycleMonth,
    }),
    email,
    address,
  };
  setState({...state, registrations: [record, ...state.registrations]});
  return record;
}

function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const weekday = result.getDay();
    if (weekday !== 0 && weekday !== 6) added++;
  }
  return result;
}

export function requestWithdrawal(amount, accountId) {
  const now = new Date();
  const record = {
    id: `WDR-${String(Math.floor(10000 + Math.random() * 90000))}`,
    amount,
    accountId,
    createdAt: now,
    // NEFT: 1–2 business days — quote the later one.
    expectedBy: addBusinessDays(now, 2),
    status: 'processing',
  };
  setState({...state, withdrawals: [record, ...state.withdrawals]});
  return record;
}

export function selectAccount(accountId) {
  setState({...state, selectedAccountId: accountId});
}
