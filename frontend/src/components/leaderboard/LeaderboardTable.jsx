import { Link } from 'react-router-dom';

import {
  formatCompactUsd,
  formatNumber
} from '../../utils/format';

import Badge from '../common/Badge';
import Card from '../common/Card';

function getRegimeClass(regime) {
  if (regime === 'CEX_SUPPLY_DRAIN') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  if (regime === 'CEX_SELL_PRESSURE') return 'border-red-500/40 bg-red-500/10 text-red-300';
  return 'border-slate-700 bg-slate-800 text-slate-300';
}

function getLargeFlowClass(hint) {
  if (hint === 'LARGE_SUPPLY_DRAIN') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  if (hint === 'LARGE_SELL_PRESSURE') return 'border-red-500/40 bg-red-500/10 text-red-300';
  return 'border-slate-700 bg-slate-800 text-slate-300';
}

function getStrengthClass(strength) {
  if (strength === 'very_strong') return 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300';
  if (strength === 'strong') return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300';
  if (strength === 'moderate') return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  if (strength === 'weak') return 'border-slate-600 bg-slate-800 text-slate-300';
  return 'border-slate-700 bg-slate-900 text-slate-500';
}

function getProfileClass(profileLabel) {
  if (profileLabel === 'clean_supply_drain') {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  }

  if (profileLabel === 'speculative_recovery_candidate') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  }

  if (profileLabel === 'mixed_flow') {
    return 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300';
  }

  if (profileLabel === 'sell_pressure_watch') {
    return 'border-red-500/40 bg-red-500/10 text-red-300';
  }

  if (profileLabel === 'unconfirmed_flow' || profileLabel === 'weak_signal') {
    return 'border-slate-600 bg-slate-800 text-slate-300';
  }

  return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300';
}

function getRecoveryClass(recoveryContext) {
  if (recoveryContext === 'extreme') return 'text-red-300';
  if (recoveryContext === 'high') return 'text-amber-300';
  if (recoveryContext === 'medium') return 'text-cyan-300';
  if (recoveryContext === 'low') return 'text-slate-300';
  return 'text-slate-500';
}

function getSignedUsdClass(value) {
  const numberValue = Number(value || 0);
  if (numberValue < 0) return 'text-emerald-300';
  if (numberValue > 0) return 'text-red-300';
  return 'text-slate-300';
}

function getDrawdownClass(value) {
  const numberValue = Number(value || 0);

  if (numberValue <= -95) return 'text-red-300';
  if (numberValue <= -85) return 'text-amber-300';
  if (numberValue < 0) return 'text-slate-300';

  return 'text-slate-400';
}

function normalizeLabel(value) {
  return String(value || 'unknown').replaceAll('_', ' ');
}

function getTokenDirectionNote(item) {
  if (item.regimeHint === 'CEX_SUPPLY_DRAIN' && item.largeFlowHint === 'LARGE_SUPPLY_DRAIN') return 'General and large flows agree';
  if (item.regimeHint === 'CEX_SELL_PRESSURE' && item.largeFlowHint === 'LARGE_SELL_PRESSURE') return 'General and large flows agree';
  if (item.largeFlowHint === 'NO_LARGE_FLOW') return 'No large-flow confirmation';
  return 'Mixed general vs large layer';
}

function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  const numberValue = Number(value);
  const sign = numberValue > 0 ? '+' : '';

  return `${sign}${numberValue.toFixed(digits)}%`;
}

function formatPrice(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  const numberValue = Number(value);

  if (numberValue < 0.01) {
    return `$${numberValue.toFixed(6)}`;
  }

  if (numberValue < 1) {
    return `$${numberValue.toFixed(4)}`;
  }

  return formatCompactUsd(numberValue);
}

function PriceContextCell({ priceContext }) {
  if (!priceContext) {
    return (
      <div>
        <p className="font-semibold text-slate-500">No price context</p>
        <p className="mt-1 text-xs text-slate-600">Run price context update</p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-black text-white">
        {formatPrice(priceContext.currentPriceUsd)}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        ATH {formatPrice(priceContext.athUsd)}
      </p>

      <p className={['mt-2 text-xs font-bold', getDrawdownClass(priceContext.drawdownFromAthPct)].join(' ')}>
        DD {formatPercent(priceContext.drawdownFromAthPct)}
      </p>

      <p className="mt-1 text-xs font-bold text-cyan-300">
        To ATH {formatPercent(priceContext.upsideToAthPct)}
      </p>
    </div>
  );
}

function RiskFlags({ flags = [] }) {
  if (!flags.length) {
    return (
      <p className="mt-2 text-xs text-emerald-300">
        no major flags
      </p>
    );
  }

  return (
    <div className="mt-2 flex max-w-[260px] flex-wrap gap-1">
      {flags.slice(0, 3).map((flag) => (
        <span
          key={flag}
          className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-slate-400"
        >
          {normalizeLabel(flag)}
        </span>
      ))}

      {flags.length > 3 && (
        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-slate-500">
          +{flags.length - 3}
        </span>
      )}
    </div>
  );
}

function ProfileCell({ analysisProfile }) {
  if (!analysisProfile) {
    return (
      <div>
        <p className="font-semibold text-slate-500">No profile</p>
        <p className="mt-1 text-xs text-slate-600">Update backend profile</p>
      </div>
    );
  }

  return (
    <div className="min-w-[260px]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={getProfileClass(analysisProfile.profileLabel)}>
          {normalizeLabel(analysisProfile.profileLabel)}
        </Badge>

        <span className={['text-xs font-bold', getRecoveryClass(analysisProfile.recoveryContext)].join(' ')}>
          {normalizeLabel(analysisProfile.recoveryContext)}
        </span>
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {analysisProfile.interpretation}
      </p>

      <RiskFlags flags={analysisProfile.riskFlags || []} />
    </div>
  );
}

export default function LeaderboardTable({ items = [], totalItems = 0, selectedFilter = 'all' }) {
  return (
    <Card
      title="CEX Flow Leaderboard"
      subtitle={`Showing ${items.length} of ${totalItems} tokens. Negative netflow means supply leaves known CEX wallets.`}
    >
      <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-100/80">
        <span className="font-bold text-amber-200">To ATH is not a forecast.</span>{' '}
        It only shows historical recovery distance from current price back to the previous all-time high.
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.16em] text-slate-500">
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Profile</th>
              <th className="px-4 py-3">Regime</th>
              <th className="px-4 py-3">Netflow USD</th>
              <th className="px-4 py-3">Large Netflow</th>
              <th className="px-4 py-3">Price Context</th>
              <th className="px-4 py-3">Large Flow</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Strength</th>
              <th className="px-4 py-3">Read</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.token.id} className="border-b border-slate-900/80 transition hover:bg-slate-900/60">
                <td className="px-4 py-4">
                  <div>
                    <Link to={`/tokens/${item.token.symbol}`} className="font-black text-white hover:text-cyan-300">
                      {item.token.symbol}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">{item.token.name}</p>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <ProfileCell analysisProfile={item.analysisProfile} />
                </td>

                <td className="px-4 py-4">
                  <Badge className={getRegimeClass(item.regimeHint)}>{normalizeLabel(item.regimeHint)}</Badge>
                </td>

                <td className="px-4 py-4">
                  <p className={['font-black', getSignedUsdClass(item.cex.netflowUsd)].join(' ')}>
                    {formatCompactUsd(item.cex.netflowUsd)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    in {formatCompactUsd(item.cex.inflowUsd)} / out {formatCompactUsd(item.cex.outflowUsd)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {formatNumber(item.cex.netflow)} token netflow
                  </p>
                </td>

                <td className="px-4 py-4">
                  <p className={['font-black', getSignedUsdClass(item.large.netflowUsd)].join(' ')}>
                    {formatCompactUsd(item.large.netflowUsd)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">threshold {formatCompactUsd(item.large.thresholdUsd)}</p>
                </td>

                <td className="px-4 py-4">
                  <PriceContextCell priceContext={item.priceContext} />
                </td>

                <td className="px-4 py-4">
                  <Badge className={getLargeFlowClass(item.largeFlowHint)}>{normalizeLabel(item.largeFlowHint)}</Badge>
                  <p className="mt-2 text-xs text-slate-500">
                    out {formatNumber(item.large.outflowCount, 0)} / in {formatNumber(item.large.inflowCount, 0)}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <p className="font-semibold text-slate-200">{item.activeDays} days</p>
                  <p className="mt-1 whitespace-nowrap text-xs text-slate-500">{item.activeFlowWindow?.label || '—'}</p>
                </td>

                <td className="px-4 py-4">
                  <Badge className={getStrengthClass(item.strength)}>{normalizeLabel(item.strength)}</Badge>
                </td>

                <td className="px-4 py-4">
                  <p className="max-w-[180px] text-xs leading-5 text-slate-500">{getTokenDirectionNote(item)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!items.length && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center">
          <p className="font-semibold text-slate-300">No tokens match this filter.</p>
          <p className="mt-2 text-sm text-slate-500">Current filter: {selectedFilter}. Try All or another range.</p>
        </div>
      )}
    </Card>
  );
}
