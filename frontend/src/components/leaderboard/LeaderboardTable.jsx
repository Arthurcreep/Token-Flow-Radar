import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  formatCompactUsd,
  formatNumber
} from '../../utils/format';

import Badge from '../common/Badge';
import Card from '../common/Card';

const PROFILE_FILTERS = [
  {
    value: 'all',
    label: 'Все'
  },
  {
    value: 'clean_supply_drain',
    label: 'Чистый вывод'
  },
  {
    value: 'speculative_recovery_candidate',
    label: 'Спекулятивные'
  },
  {
    value: 'mixed_flow',
    label: 'Смешанные'
  },
  {
    value: 'unconfirmed_flow',
    label: 'Без подтверждения'
  },
  {
    value: 'sell_pressure_watch',
    label: 'Давление продажи'
  }
];

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

function translateRegime(value) {
  if (value === 'CEX_SUPPLY_DRAIN') return 'Вывод с бирж';
  if (value === 'CEX_SELL_PRESSURE') return 'Завод на биржи';
  if (value === 'NEUTRAL') return 'Нейтрально';

  return 'Не определено';
}

function translateLargeFlow(value) {
  if (value === 'LARGE_SUPPLY_DRAIN') return 'Крупный вывод';
  if (value === 'LARGE_SELL_PRESSURE') return 'Крупный завод';
  if (value === 'NO_LARGE_FLOW') return 'Нет крупных';

  return 'Не определено';
}

function translateProfile(value) {
  if (value === 'clean_supply_drain') return 'Чистый вывод';
  if (value === 'speculative_recovery_candidate') return 'Спекулятивное восстановление';
  if (value === 'mixed_flow') return 'Смешанный сигнал';
  if (value === 'unconfirmed_flow') return 'Без подтверждения';
  if (value === 'sell_pressure_watch') return 'Давление продажи';
  if (value === 'weak_signal') return 'Слабый сигнал';

  return 'Профиль не определен';
}

function translateRecovery(value) {
  if (value === 'extreme') return 'экстремально далеко от ATH';
  if (value === 'high') return 'сильно ниже ATH';
  if (value === 'medium') return 'умеренно ниже ATH';
  if (value === 'low') return 'недалеко от ATH';

  return 'без оценки';
}

function translateStrength(value) {
  if (value === 'very_strong') return 'очень сильный';
  if (value === 'strong') return 'сильный';
  if (value === 'moderate') return 'умеренный';
  if (value === 'weak') return 'слабый';

  return 'нет оценки';
}

function translateRiskFlag(value) {
  if (value === 'large_layer_conflict') return 'крупные переводы спорят с общим потоком';
  if (value === 'no_large_flow_confirmation') return 'нет подтверждения крупными переводами';
  if (value === 'weak_flow') return 'слабый поток';
  if (value === 'thin_active_days') return 'мало активных дней';
  if (value === 'extreme_ath_drawdown') return 'экстремальная просадка от ATH';
  if (value === 'deep_ath_drawdown') return 'глубокая просадка от ATH';
  if (value === 'extreme_recovery_distance') return 'экстремальная дистанция до ATH';
  if (value === 'low_usd_flow') return 'малый объем в USD';
  if (value === 'zero_large_netflow') return 'нулевой крупный netflow';

  return String(value || 'риск не определен').replaceAll('_', ' ');
}

function translateInterpretation(item) {
  const symbol = item.token?.symbol || 'Токен';
  const profile = item.analysisProfile?.profileLabel;

  if (profile === 'clean_supply_drain') {
    return `${symbol}: токены выходят с бирж, и это подтверждается крупными переводами. Это самый чистый тип сигнала.`;
  }

  if (profile === 'speculative_recovery_candidate') {
    return `${symbol}: вывод с бирж есть, но токен сильно ниже ATH. Потенциал восстановления большой, но риск тоже высокий.`;
  }

  if (profile === 'mixed_flow') {
    return `${symbol}: общий поток и крупные переводы показывают разную картину. Сигнал грязный.`;
  }

  if (profile === 'unconfirmed_flow') {
    return `${symbol}: движение есть, но крупные переводы его не подтверждают. Сигнал слабее.`;
  }

  if (profile === 'sell_pressure_watch') {
    return `${symbol}: токены заходят на биржи. Это может быть давлением продажи, а не накоплением.`;
  }

  return `${symbol}: по токену пока нет понятного профиля.`;
}

function getTokenDirectionNote(item) {
  if (item.regimeHint === 'CEX_SUPPLY_DRAIN' && item.largeFlowHint === 'LARGE_SUPPLY_DRAIN') return 'Общий поток и крупные переводы совпадают';
  if (item.regimeHint === 'CEX_SELL_PRESSURE' && item.largeFlowHint === 'LARGE_SELL_PRESSURE') return 'Общий поток и крупные переводы совпадают';
  if (item.largeFlowHint === 'NO_LARGE_FLOW') return 'Крупные переводы не подтверждают сигнал';
  return 'Общий поток и крупные переводы спорят';
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

function countByProfile(items, profileLabel) {
  if (profileLabel === 'all') return items.length;

  return items.filter((item) => item.analysisProfile?.profileLabel === profileLabel).length;
}

function ProfileFilters({
  items,
  selectedProfile,
  onSelectProfile
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {PROFILE_FILTERS.map((filter) => {
        const isActive = selectedProfile === filter.value;
        const count = countByProfile(items, filter.value);

        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onSelectProfile(filter.value)}
            className={[
              'rounded-full border px-3 py-2 text-xs font-bold transition',
              isActive
                ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            ].join(' ')}
          >
            {filter.label}
            <span className="ml-2 text-slate-500">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function PriceContextCell({ priceContext }) {
  if (!priceContext) {
    return (
      <div>
        <p className="font-semibold text-slate-500">Нет ценового контекста</p>
        <p className="mt-1 text-xs text-slate-600">Нужно обновить price context</p>
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
        От ATH {formatPercent(priceContext.drawdownFromAthPct)}
      </p>

      <p className="mt-1 text-xs font-bold text-cyan-300">
        До ATH {formatPercent(priceContext.upsideToAthPct)}
      </p>
    </div>
  );
}

function RiskFlags({ flags = [] }) {
  if (!flags.length) {
    return (
      <p className="mt-2 text-xs text-emerald-300">
        крупных риск-флагов нет
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
          {translateRiskFlag(flag)}
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

function ProfileCell({ item }) {
  const analysisProfile = item.analysisProfile;

  if (!analysisProfile) {
    return (
      <div>
        <p className="font-semibold text-slate-500">Нет профиля</p>
        <p className="mt-1 text-xs text-slate-600">Backend еще не вернул analysisProfile</p>
      </div>
    );
  }

  return (
    <div className="min-w-[260px]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={getProfileClass(analysisProfile.profileLabel)}>
          {translateProfile(analysisProfile.profileLabel)}
        </Badge>

        <span className={['text-xs font-bold', getRecoveryClass(analysisProfile.recoveryContext)].join(' ')}>
          {translateRecovery(analysisProfile.recoveryContext)}
        </span>
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {translateInterpretation(item)}
      </p>

      <RiskFlags flags={analysisProfile.riskFlags || []} />
    </div>
  );
}

export default function LeaderboardTable({ items = [], totalItems = 0 }) {
  const [selectedProfile, setSelectedProfile] = useState('all');

  const filteredItems = useMemo(() => {
    if (selectedProfile === 'all') return items;

    return items.filter((item) => item.analysisProfile?.profileLabel === selectedProfile);
  }, [items, selectedProfile]);

  return (
    <Card
      title="Таблица токенов"
      subtitle={`Показано ${filteredItems.length} из ${totalItems}. Минусовой netflow означает, что токены выходят с известных CEX-кошельков.`}
    >
      <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-100/80">
        <span className="font-bold text-amber-200">До ATH — это не прогноз.</span>{' '}
        Это только расстояние от текущей цены до прошлого исторического максимума.
      </div>

      <ProfileFilters
        items={items}
        selectedProfile={selectedProfile}
        onSelectProfile={setSelectedProfile}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.16em] text-slate-500">
              <th className="px-4 py-3">Токен</th>
              <th className="px-4 py-3">Профиль</th>
              <th className="px-4 py-3">Режим</th>
              <th className="px-4 py-3">Netflow в USD</th>
              <th className="px-4 py-3">Крупный netflow</th>
              <th className="px-4 py-3">Цена / ATH</th>
              <th className="px-4 py-3">Крупные переводы</th>
              <th className="px-4 py-3">Активность</th>
              <th className="px-4 py-3">Сила</th>
              <th className="px-4 py-3">Пояснение</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.map((item) => (
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
                  <ProfileCell item={item} />
                </td>

                <td className="px-4 py-4">
                  <Badge className={getRegimeClass(item.regimeHint)}>{translateRegime(item.regimeHint)}</Badge>
                </td>

                <td className="px-4 py-4">
                  <p className={['font-black', getSignedUsdClass(item.cex.netflowUsd)].join(' ')}>
                    {formatCompactUsd(item.cex.netflowUsd)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    завод {formatCompactUsd(item.cex.inflowUsd)} / вывод {formatCompactUsd(item.cex.outflowUsd)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {formatNumber(item.cex.netflow)} токенов netflow
                  </p>
                </td>

                <td className="px-4 py-4">
                  <p className={['font-black', getSignedUsdClass(item.large.netflowUsd)].join(' ')}>
                    {formatCompactUsd(item.large.netflowUsd)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">порог {formatCompactUsd(item.large.thresholdUsd)}</p>
                </td>

                <td className="px-4 py-4">
                  <PriceContextCell priceContext={item.priceContext} />
                </td>

                <td className="px-4 py-4">
                  <Badge className={getLargeFlowClass(item.largeFlowHint)}>{translateLargeFlow(item.largeFlowHint)}</Badge>
                  <p className="mt-2 text-xs text-slate-500">
                    вывод {formatNumber(item.large.outflowCount, 0)} / завод {formatNumber(item.large.inflowCount, 0)}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <p className="font-semibold text-slate-200">{item.activeDays} дн.</p>
                  <p className="mt-1 whitespace-nowrap text-xs text-slate-500">{item.activeFlowWindow?.label || '—'}</p>
                </td>

                <td className="px-4 py-4">
                  <Badge className={getStrengthClass(item.strength)}>{translateStrength(item.strength)}</Badge>
                </td>

                <td className="px-4 py-4">
                  <p className="max-w-[180px] text-xs leading-5 text-slate-500">{getTokenDirectionNote(item)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!filteredItems.length && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center">
          <p className="font-semibold text-slate-300">Под этот фильтр нет токенов.</p>
          <p className="mt-2 text-sm text-slate-500">
            Попробуй выбрать “Все” или другой профиль.
          </p>
          <button
            type="button"
            onClick={() => setSelectedProfile('all')}
            className="mt-4 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/20"
          >
            Сбросить фильтр профиля
          </button>
        </div>
      )}
    </Card>
  );
}
