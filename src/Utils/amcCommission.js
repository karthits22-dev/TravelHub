// Pure commission math for the AMC agent flow — no state, so every
// screen that shows an amount (dashboard, register preview, registrations,
// withdraw) derives it the same way.

export const PLAN = {
  base: 100,
  gstRate: 0.18,
};
export const PLAN_GST = Math.round(PLAN.base * PLAN.gstRate);
export const PLAN_TOTAL = PLAN.base + PLAN_GST;

export const MIN_WITHDRAWAL = 200;

// Member slabs within a calendar month. The first four are 25 members
// wide and pay a flat bonus once filled; "Above 100" is open-ended.
export const SLABS = [
  {label: '1 – 25', tierLabel: '1–25', bonusLabel: '1 to 25 members', min: 1, max: 25},
  {label: '26 – 50', tierLabel: '26–50', bonusLabel: '26 to 50 members', min: 26, max: 50},
  {label: '51 – 75', tierLabel: '51–75', bonusLabel: '51 to 75 members', min: 51, max: 75},
  {label: '76 – 100', tierLabel: '76–100', bonusLabel: '76 to 100 members', min: 76, max: 100},
  {label: 'Above 100', tierLabel: 'Above 100', bonusLabel: null, min: 101, max: Infinity},
];

// Per-member rate for each slab, by month of the agent's enrolment cycle.
// Month 1 matches the approved design; months 2–3 are placeholder
// step-ups — confirm the real figures with the business before launch.
export const RATES_BY_MONTH = {
  1: [10, 20, 20, 30, 30],
  2: [15, 25, 25, 35, 35],
  3: [20, 30, 30, 40, 40],
};
export const CYCLE_MONTHS = [1, 2, 3];

// Flat extra points for completely filling each bounded slab.
export const SLAB_BONUS = 250;

export function slabIndexFor(memberNo) {
  return SLABS.findIndex(slab => memberNo >= slab.min && memberNo <= slab.max);
}

export function commissionFor(memberNo, cycleMonth) {
  return RATES_BY_MONTH[cycleMonth][slabIndexFor(memberNo)];
}

// Full breakdown for `memberCount` members at `cycleMonth` rates:
// the slab table rows, the extra-points rows, and their totals.
export function computeEarnings(memberCount, cycleMonth) {
  const rates = RATES_BY_MONTH[cycleMonth];

  const rows = SLABS.map((slab, i) => {
    const count = Math.max(0, Math.min(memberCount, slab.max) - slab.min + 1);
    return {label: slab.label, rate: rates[i], count, total: count * rates[i]};
  });
  const slabTotal = rows.reduce((sum, row) => sum + row.total, 0);

  const bonusRows = SLABS.filter(slab => slab.bonusLabel).map(slab => {
    const earned = memberCount >= slab.max;
    return {label: slab.bonusLabel, earned, amount: earned ? SLAB_BONUS : 0};
  });
  const bonusTotal = bonusRows.reduce((sum, row) => sum + row.amount, 0);

  return {rows, slabTotal, bonusRows, bonusTotal, total: slabTotal + bonusTotal};
}

export const formatINR = amount => `₹${amount.toLocaleString('en-IN')}`;

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// "4 Mar 2027"
export const formatDate = date =>
  `${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;

// "9845022190" -> "+91 98450 22190"
export const formatPhone = phone => `+91 ${phone.replace(/(\d{5})(\d+)/, '$1 $2')}`;
