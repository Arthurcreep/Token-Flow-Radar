export function formatNumber(value, options = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    notation: options.compact ? 'compact' : 'standard'
  }).format(Number(value));
}

export function formatUsd(value, options = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    notation: options.compact ? 'compact' : 'standard'
  }).format(Number(value));
}

export function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Math.round(Number(value) * 100)}%`;
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function shortAddress(address) {
  if (!address) return '—';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getRegimeStyles(regime) {
  const map = {
    ACCUMULATION: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    DISTRIBUTION: 'border-red-500/40 bg-red-500/10 text-red-300',
    CEX_SUPPLY_DRAIN: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
    CEX_SELL_PRESSURE: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
    UNCLEAR: 'border-slate-600 bg-slate-800 text-slate-300',
    UNCLEAR_LOW_CONFIDENCE: 'border-slate-600 bg-slate-800 text-slate-300',
    NEUTRAL: 'border-slate-600 bg-slate-800 text-slate-300'
  };

  return map[regime] || map.UNCLEAR;
}

export function getSignalSeverityStyles(severity) {
  const map = {
    high: 'border-red-500/40 bg-red-500/10 text-red-300',
    medium: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    low: 'border-slate-600 bg-slate-800 text-slate-300'
  };

  return map[severity] || map.low;
}

export function getSignedClass(value) {
  const number = Number(value);
  if (number > 0) return 'text-emerald-300';
  if (number < 0) return 'text-red-300';
  return 'text-slate-300';
}
