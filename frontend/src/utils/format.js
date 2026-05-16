export function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits
  }).format(Number(value));
}

export function formatUsd(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits
  }).format(Number(value));
}

export function formatCompactNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  const numberValue = Number(value);
  const absValue = Math.abs(numberValue);

  if (absValue >= 1_000_000_000) {
    return `${(numberValue / 1_000_000_000).toFixed(2)}B`;
  }

  if (absValue >= 1_000_000) {
    return `${(numberValue / 1_000_000).toFixed(2)}M`;
  }

  if (absValue >= 1_000) {
    return `${(numberValue / 1_000).toFixed(1)}K`;
  }

  return formatNumber(numberValue);
}

export function formatCompactUsd(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  const numberValue = Number(value);
  const absValue = Math.abs(numberValue);
  const sign = numberValue < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    return `${sign}$${(absValue / 1_000_000_000).toFixed(2)}B`;
  }

  if (absValue >= 1_000_000) {
    return `${sign}$${(absValue / 1_000_000).toFixed(2)}M`;
  }

  if (absValue >= 1_000) {
    return `${sign}$${(absValue / 1_000).toFixed(1)}K`;
  }

  return formatUsd(numberValue);
}

export function formatPercent(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  return `${(Number(value) * 100).toFixed(digits)}%`;
}

export function formatDateTime(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function shortAddress(address) {
  if (!address) return '—';
  if (address.length <= 14) return address;

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getSignedClass(value) {
  const numberValue = Number(String(value).replaceAll(',', '').replace('$', ''));

  if (Number.isNaN(numberValue)) return 'text-white';
  if (numberValue > 0) return 'text-emerald-300';
  if (numberValue < 0) return 'text-red-300';

  return 'text-white';
}

export function getNetflowMarketClass(value) {
  const numberValue = Number(value || 0);

  if (numberValue > 0) return 'text-red-300';
  if (numberValue < 0) return 'text-emerald-300';

  return 'text-slate-300';
}

export function getRegimeStyles(regime) {
  const normalized = String(regime || '').toUpperCase();

  if (normalized.includes('ACCUMULATION')) {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  }

  if (normalized.includes('DISTRIBUTION') || normalized.includes('SELL_PRESSURE')) {
    return 'border-red-500/40 bg-red-500/10 text-red-300';
  }

  if (normalized.includes('SUPPLY_DRAIN')) {
    return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300';
  }

  if (normalized.includes('MIXED')) {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  }

  if (normalized.includes('UNCLEAR')) {
    return 'border-slate-600 bg-slate-800 text-slate-300';
  }

  return 'border-slate-700 bg-slate-800 text-slate-300';
}

export function getSignalSeverityStyles(severity) {
  const normalized = String(severity || '').toLowerCase();

  if (normalized === 'high') {
    return 'border-red-500/40 bg-red-500/10 text-red-300';
  }

  if (normalized === 'medium') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  }

  if (normalized === 'low') {
    return 'border-slate-600 bg-slate-800 text-slate-300';
  }

  return 'border-slate-700 bg-slate-800 text-slate-300';
}
