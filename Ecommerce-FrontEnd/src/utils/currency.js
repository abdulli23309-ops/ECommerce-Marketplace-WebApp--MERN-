// Shared currency formatting for the customer-facing UI.
//
// Every PKR amount shown to a user must render with exactly two decimal places.
// Floating-point math (and 3-decimal values in the database) can otherwise leak
// through a bare `.toLocaleString()` as "PKR 39,999.999" or "PKR 359,999.991".
// Using Intl with fixed min/max fraction digits guarantees two decimals AND
// thousands grouping in one pass — unlike `Number(x.toFixed(2)).toLocaleString()`,
// which would drop a trailing zero (40000.1 -> "40,000.1").
//
// This formats the numeric portion only; callers keep their existing "PKR "
// prefix so the visible format is unchanged apart from the decimal precision.
export const formatPKR = (value) => {
  const number = Number(value);
  const safe = Number.isFinite(number) ? number : 0;
  return safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default formatPKR;
