import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getTokenProfile } from '../api/tokenProfileApi';
import Card from '../components/common/Card';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import LeaderboardRangeSwitch from '../components/leaderboard/LeaderboardRangeSwitch';
import TokenFlowDiagnostics from '../components/token/TokenFlowDiagnostics';

import {
  formatCompactUsd,
  formatNumber
} from '../utils/format';

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
};

const formatPercent = (value, digits = 1) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  const numberValue = Number(value);
  const sign = numberValue > 0 ? '+' : '';

  return `${sign}${numberValue.toFixed(digits)}%`;
};

const formatPrice = (value) => {
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
};

const getSignedUsdClass = (value) => {
  const numberValue = toNumber(value);

  if (numberValue < 0) return 'text-emerald-300';
  if (numberValue > 0) return 'text-red-300';

  return 'text-slate-300';
};

const getDrawdownClass = (value) => {
  const numberValue = toNumber(value);

  if (numberValue <= -95) return 'text-red-300';
  if (numberValue <= -85) return 'text-amber-300';
  if (numberValue < 0) return 'text-slate-300';

  return 'text-slate-400';
};

const translateRegime = (value) => {
  if (value === 'CEX_SUPPLY_DRAIN') return 'Вывод с бирж';
  if (value === 'CEX_SELL_PRESSURE') return 'Завод на биржи';
  if (value === 'NEUTRAL') return 'Нейтрально';

  return 'Не определено';
};

const translateLargeFlow = (value) => {
  if (value === 'LARGE_SUPPLY_DRAIN') return 'Крупные выводы';
  if (value === 'LARGE_SELL_PRESSURE') return 'Крупные заводы';
  if (value === 'NO_LARGE_FLOW') return 'Нет крупных переводов';

  return 'Не определено';
};

const translateStrength = (value) => {
  if (value === 'very_strong') return 'очень сильный';
  if (value === 'strong') return 'сильный';
  if (value === 'moderate') return 'умеренный';
  if (value === 'weak') return 'слабый';
  if (value === 'none') return 'нет сигнала';

  return 'нет оценки';
};

const translateProfile = (value) => {
  if (value === 'clean_supply_drain') return 'Чистый вывод с бирж';
  if (value === 'strong_signal_high_risk') return 'Сильная аномалия с высоким риском';
  if (value === 'speculative_recovery_candidate') return 'Спекулятивное восстановление';
  if (value === 'mixed_flow') return 'Смешанный сигнал';
  if (value === 'unconfirmed_flow') return 'Без подтверждения';
  if (value === 'sell_pressure_watch') return 'Давление продажи';
  if (value === 'weak_signal') return 'Слабый сигнал';
  if (value === 'watchlist_candidate') return 'Кандидат в наблюдение';

  return 'Профиль не определен';
};

const translateRecovery = (value) => {
  if (value === 'extreme') return 'экстремально далеко от ATH';
  if (value === 'high') return 'сильно ниже ATH';
  if (value === 'medium') return 'умеренно ниже ATH';
  if (value === 'low') return 'недалеко от ATH';
  if (value === 'none') return 'без recovery-дистанции';

  return 'без оценки';
};

const translateRiskFlag = (value) => {
  if (value === 'large_layer_conflict') return 'крупные переводы спорят с общим потоком';
  if (value === 'no_large_flow_confirmation') return 'нет подтверждения крупными переводами';
  if (value === 'weak_flow') return 'слабый поток';
  if (value === 'thin_active_days') return 'мало активных дней';
  if (value === 'extreme_ath_drawdown') return 'экстремальная просадка от ATH';
  if (value === 'deep_ath_drawdown') return 'глубокая просадка от ATH';
  if (value === 'extreme_recovery_distance') return 'экстремальная дистанция до ATH';
  if (value === 'low_usd_flow') return 'малый объем в USD';
  if (value === 'zero_large_netflow') return 'нулевой крупный netflow';
  if (value === 'high_concentration_risk') return 'высокая концентрация на одном участнике или адресе';
  if (value === 'medium_concentration_risk') return 'средняя концентрация на одном участнике или адресе';

  return String(value || 'риск не определен').replaceAll('_', ' ');
};

const getProfileExplanation = ({
  token,
  analysisProfile
}) => {
  const symbol = token?.symbol || 'Токен';
  const profile = analysisProfile?.profileLabel;

  if (profile === 'clean_supply_drain') {
    return `${symbol}: токены выходят с бирж, и крупные переводы подтверждают это направление. Это наиболее чистый тип flow-сигнала.`;
  }

  if (profile === 'strong_signal_high_risk') {
    return `${symbol}: flow-сигнал сильный, но риск высокий. Такой токен лучше читать как аномалию: есть мощный вывод с бирж, но нужно проверить концентрацию, адреса и источник движения.`;
  }

  if (profile === 'speculative_recovery_candidate') {
    return `${symbol}: вывод с бирж есть, но токен сильно ниже исторического максимума. Потенциал восстановления большой, но риск тоже высокий.`;
  }

  if (profile === 'mixed_flow') {
    return `${symbol}: общий поток и крупные переводы показывают разную картину. Такой сигнал нельзя считать чистым.`;
  }

  if (profile === 'unconfirmed_flow') {
    return `${symbol}: общий поток есть, но крупные переводы его не подтверждают. Сигнал слабее и требует осторожности.`;
  }

  if (profile === 'sell_pressure_watch') {
    return `${symbol}: токены заходят на биржи. Это больше похоже на риск давления продажи, чем на накопление.`;
  }

  return `${symbol}: профиль сигнала пока недостаточно определен.`;
};

const MetricCard = ({
  title,
  value,
  subtitle,
  valueClassName = 'text-white'
}) => (
  <Card title={title} subtitle={subtitle}>
    <p className={['text-3xl font-black', valueClassName].join(' ')}>
      {value}
    </p>
  </Card>
);

const RiskFlags = ({
  flags = []
}) => {
  if (!flags.length) {
    return (
      <p className="mt-3 text-sm font-semibold text-emerald-300">
        Крупных риск-флагов нет.
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {flags.map((flag) => (
        <span
          key={flag}
          className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200"
        >
          {translateRiskFlag(flag)}
        </span>
      ))}
    </div>
  );
};

const ScoreCard = ({
  title,
  value,
  subtitle,
  valueClassName = 'text-white'
}) => (
  <Card title={title} subtitle={subtitle}>
    <p className={['text-3xl font-black', valueClassName].join(' ')}>
      {value ?? '—'}
    </p>
  </Card>
);

const ScoreSection = ({
  scores
}) => {
  if (!scores) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ScoreCard
        title="Качество сигнала"
        subtitle="Сила flow-подтверждения"
        value={scores.signalQuality}
        valueClassName="text-cyan-300"
      />

      <ScoreCard
        title="Риск"
        subtitle="Концентрация, просадка, тонкость данных"
        value={scores.riskScore}
        valueClassName={toNumber(scores.riskScore) >= 60 ? 'text-red-300' : toNumber(scores.riskScore) >= 35 ? 'text-amber-300' : 'text-emerald-300'}
      />

      <ScoreCard
        title="Аномальность"
        subtitle="Сила сигнала + риск-контекст"
        value={scores.anomalyScore}
        valueClassName="text-fuchsia-300"
      />
    </div>
  );
};

const SummarySection = ({
  profile
}) => {
  const summary = profile.summary || {};
  const analysisProfile = profile.analysisProfile;
  const token = profile.token || {
    symbol: profile.symbol
  };

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <MetricCard
        title="CEX netflow"
        subtitle="Минус означает вывод с бирж"
        value={formatCompactUsd(summary.cexNetflowUsd)}
        valueClassName={getSignedUsdClass(summary.cexNetflowUsd)}
      />

      <MetricCard
        title="Крупный netflow"
        subtitle={`Порог: ${formatCompactUsd(summary.largeTransferThresholdUsd)}`}
        value={formatCompactUsd(summary.largeNetflowUsd)}
        valueClassName={getSignedUsdClass(summary.largeNetflowUsd)}
      />

      <MetricCard
        title="Режим"
        subtitle="Общее направление CEX-потока"
        value={translateRegime(summary.regimeHint)}
        valueClassName={summary.regimeHint === 'CEX_SUPPLY_DRAIN' ? 'text-emerald-300' : summary.regimeHint === 'CEX_SELL_PRESSURE' ? 'text-red-300' : 'text-slate-300'}
      />

      <MetricCard
        title="Профиль"
        subtitle={analysisProfile ? translateRecovery(analysisProfile.recoveryContext) : 'нет профиля'}
        value={translateProfile(analysisProfile?.profileLabel)}
        valueClassName="text-cyan-300"
      />

      <div className="lg:col-span-4">
        <Card
          title="Расшифровка сигнала"
          subtitle="Пояснение простым языком"
        >
          <p className="text-sm leading-7 text-slate-300">
            {getProfileExplanation({
              token,
              analysisProfile
            })}
          </p>

          <RiskFlags flags={analysisProfile?.riskFlags || []} />
        </Card>
      </div>
    </div>
  );
};

const PriceSection = ({
  priceContext
}) => {
  if (!priceContext) {
    return (
      <Card
        title="Цена и ATH"
        subtitle="Ценовой контекст не найден"
      >
        <p className="text-sm text-slate-500">
          Для этого токена пока нет price context. Нужно обновить price context на backend.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <MetricCard
        title="Текущая цена"
        subtitle="По CoinGecko"
        value={formatPrice(priceContext.currentPriceUsd)}
      />

      <MetricCard
        title="ATH"
        subtitle={priceContext.athDate ? `Дата ATH: ${String(priceContext.athDate).slice(0, 10)}` : 'Исторический максимум'}
        value={formatPrice(priceContext.athUsd)}
      />

      <MetricCard
        title="Просадка от ATH"
        subtitle="Насколько цена ниже максимума"
        value={formatPercent(priceContext.drawdownFromAthPct)}
        valueClassName={getDrawdownClass(priceContext.drawdownFromAthPct)}
      />

      <MetricCard
        title="До ATH"
        subtitle="Это справка, не прогноз"
        value={formatPercent(priceContext.upsideToAthPct)}
        valueClassName="text-cyan-300"
      />
    </div>
  );
};

const DailyFlowTable = ({
  items = []
}) => {
  const sortedItems = useMemo(() => (
    [...items].sort((a, b) => String(b.date).localeCompare(String(a.date)))
  ), [items]);

  return (
    <Card
      title="Дневные CEX-потоки"
      subtitle="Разбивка по дням: заводы, выводы, netflow и крупные переводы."
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.16em] text-slate-500">
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Завод на CEX</th>
              <th className="px-4 py-3">Вывод с CEX</th>
              <th className="px-4 py-3">Netflow</th>
              <th className="px-4 py-3">Крупный netflow</th>
              <th className="px-4 py-3">Транзакции</th>
            </tr>
          </thead>

          <tbody>
            {sortedItems.map((item) => (
              <tr key={item.id || item.date} className="border-b border-slate-900/80">
                <td className="px-4 py-4 font-bold text-white">{item.date}</td>

                <td className="px-4 py-4 text-red-300">
                  {formatCompactUsd(item.cexInflowUsd)}
                </td>

                <td className="px-4 py-4 text-emerald-300">
                  {formatCompactUsd(item.cexOutflowUsd)}
                </td>

                <td className={['px-4 py-4 font-black', getSignedUsdClass(item.cexNetflowUsd)].join(' ')}>
                  {formatCompactUsd(item.cexNetflowUsd)}
                </td>

                <td className={['px-4 py-4 font-bold', getSignedUsdClass(item.largeNetflowUsd)].join(' ')}>
                  {formatCompactUsd(item.largeNetflowUsd)}
                </td>

                <td className="px-4 py-4 text-slate-400">
                  завод {formatNumber(item.inflowTxCount, 0)} / вывод {formatNumber(item.outflowTxCount, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!sortedItems.length && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center">
          <p className="font-semibold text-slate-300">Нет дневных строк по выбранному диапазону.</p>
          <p className="mt-2 text-sm text-slate-500">Попробуй другой диапазон или перезапусти анализ токена.</p>
        </div>
      )}
    </Card>
  );
};

const TokenDetailPage = () => {
  const { symbol } = useParams();

  const [selectedRange, setSelectedRange] = useState('1m');
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading');

  const loadTokenProfile = async () => {
    setStatus('loading');

    try {
      const data = await getTokenProfile({
        symbol,
        range: selectedRange
      });

      setProfile(data);
      setStatus('ready');
    } catch (error) {
      setStatus('error');
    }
  };

  useEffect(() => {
    loadTokenProfile();
  }, [symbol, selectedRange]);

  if (status === 'loading') {
    return <LoadingState message={`Загружаем профиль ${String(symbol || '').toUpperCase()}...`} />;
  }

  if (status === 'error') {
    return <ErrorState message={`Не удалось загрузить профиль ${String(symbol || '').toUpperCase()}.`} />;
  }

  const token = profile?.token || {
    symbol: String(symbol || '').toUpperCase()
  };

  const summary = profile?.summary || {};
  const range = profile?.range || {};

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/leaderboard" className="text-sm font-bold text-cyan-300 hover:text-cyan-200">
            ← Назад к рейтингу
          </Link>

          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
            Профиль токена
          </p>

          <h1 className="mt-3 text-4xl font-black text-white">
            {token.symbol}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            {token.name || 'Токен'} · {token.chain || 'ethereum'}
          </p>

          {token.contractAddress && (
            <p className="mt-2 break-all text-xs text-slate-600">
              Контракт: {token.contractAddress}
            </p>
          )}
        </div>

        <LeaderboardRangeSwitch selectedRange={selectedRange} onChange={setSelectedRange} />
      </section>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card title="Диапазон" subtitle={range.calendarWindow || '—'}>
          <p className="text-2xl font-black text-white">
            {range.label || selectedRange.toUpperCase()}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Активных дней: {range.activeDays ?? 0}
          </p>
        </Card>

        <Card title="Окно активности" subtitle={range.activeFlowWindow?.label || '—'}>
          <p className="text-2xl font-black text-white">
            {range.loadedRows ?? profile?.dailyFlows?.length ?? 0}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Дневных строк в расчете
          </p>
        </Card>

        <Card title="Крупные переводы" subtitle={translateLargeFlow(summary.largeFlowHint)}>
          <p className="text-2xl font-black text-white">
            {formatCompactUsd(summary.largeNetflowUsd)}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Крупный netflow
          </p>
        </Card>

        <Card title="Сила сигнала" subtitle="По backend-профилю">
          <p className="text-2xl font-black text-cyan-300">
            {translateStrength(summary.strength)}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Не является торговой рекомендацией
          </p>
        </Card>
      </div>

      <SummarySection profile={profile} />

      <ScoreSection scores={profile.scores} />

      <TokenFlowDiagnostics
        diagnostics={{
          summary: profile.summary,
          diagnostics: profile.diagnostics
        }}
      />

      <PriceSection priceContext={profile.priceContext} />

      <DailyFlowTable items={profile.dailyFlows || []} />
    </div>
  );
};

export default TokenDetailPage;
