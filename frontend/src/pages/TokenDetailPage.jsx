import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  getTokenCexFlows,
  getTokenOverview,
  getTokenSignals,
  getTokenTopHolders,
  refreshRecentCexFlowPipeline,
  refreshTokenPipeline
} from '../api/tokensApi';

import DataModeBadge from '../components/data/DataModeBadge';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import TokenHero from '../components/token/TokenHero';
import CexFlowActorsPlaceholder from '../components/token/CexFlowActorsPlaceholder';
import ScoreDecomposition from '../components/token/ScoreDecomposition';
import HoldersTable from '../components/token/HoldersTable';
import RealRecentCexFlowPanel, { RANGE_OPTIONS } from '../components/token/RealRecentCexFlowPanel';
import { useTranslation } from '../i18n/useTranslation';

const RECENT_CEX_FLOW_SOURCE = 'calculated_from_etherscan_v2_recent_cex_address_tokentx';

function getRangeOption(range) {
  return RANGE_OPTIONS.find((item) => item.value === range) || RANGE_OPTIONS[2];
}

export default function TokenDetailPage() {
  const { symbol } = useParams();
  const { t } = useTranslation();

  const [overview, setOverview] = useState(null);
  const [recentCexFlows, setRecentCexFlows] = useState(null);
  const [holders, setHolders] = useState(null);
  const [signals, setSignals] = useState([]);
  const [status, setStatus] = useState('loading');

  const [refreshStatus, setRefreshStatus] = useState('idle');
  const [refreshMessage, setRefreshMessage] = useState('');

  const [selectedRange, setSelectedRange] = useState('1m');
  const [recentRefreshStatus, setRecentRefreshStatus] = useState('idle');
  const [recentRefreshMessage, setRecentRefreshMessage] = useState('');
  const [recentValuation, setRecentValuation] = useState(null);

  async function loadTokenDashboard(range = selectedRange) {
    const [
      overviewData,
      recentCexFlowData,
      holderData,
      signalData
    ] = await Promise.all([
      getTokenOverview(symbol),
      getTokenCexFlows(symbol, {
        source: RECENT_CEX_FLOW_SOURCE,
        range,
        limit: 500
      }).catch(() => null),
      getTokenTopHolders(symbol).catch(() => null),
      getTokenSignals(symbol).catch(() => [])
    ]);

    setOverview(overviewData);
    setRecentCexFlows(recentCexFlowData);
    setHolders(holderData);
    setSignals(signalData);
  }

  useEffect(() => {
    async function load() {
      try {
        await loadTokenDashboard(selectedRange);
        setStatus('ready');
      } catch (error) {
        setStatus('error');
      }
    }

    load();
  }, [symbol]);

  useEffect(() => {
    if (status !== 'ready') return;

    loadTokenDashboard(selectedRange).catch(() => {
      setRecentRefreshStatus('error');
      setRecentRefreshMessage('Не удалось загрузить CEX flows для выбранного диапазона.');
    });
  }, [selectedRange]);

  async function handleRefreshData() {
    if (overview?.dataMode === 'mixed' || overview?.dataMode === 'real') {
      setRefreshStatus('error');
      setRefreshMessage(
        'Обновление mixed/real overview pipeline пока заблокировано. Для real CEX flows используй отдельную кнопку ниже.'
      );
      return;
    }

    try {
      setRefreshStatus('loading');
      setRefreshMessage(t('common.pipelineRunning'));

      await refreshTokenPipeline(symbol);
      await loadTokenDashboard(selectedRange);

      setRefreshStatus('success');
      setRefreshMessage(t('common.pipelineRefreshed'));

      setTimeout(() => {
        setRefreshStatus('idle');
        setRefreshMessage('');
      }, 2500);
    } catch (error) {
      setRefreshStatus('error');
      setRefreshMessage(
        error?.response?.data?.error?.message || t('common.pipelineFailed')
      );
    }
  }

  async function handleRefreshRecentCexFlows() {
    try {
      const rangeOption = getRangeOption(selectedRange);

      setRecentRefreshStatus('loading');
      setRecentRefreshMessage(
        `Запускаем диапазон ${rangeOption.label}: ingest → USD valuation → CEX flows...`
      );

      const result = await refreshRecentCexFlowPipeline(symbol, {
        range: selectedRange,
        blocksBack: rangeOption.blocksBack,
        offset: 50,
        maxPages: selectedRange === '1y' ? 5 : 2,
        maxAddresses: 7,
        valuationLimit: selectedRange === '1y' ? 5000 : 1000,
        largeTransferThresholdUsd: recentCexFlows?.largeTransferThresholdUsd || 50000
      });

      setRecentCexFlows(result.cexFlows);
      setRecentValuation(result.valuation);
      setRecentRefreshStatus('success');
      setRecentRefreshMessage(
        `Готово: range=${rangeOption.label}, fetched=${result.ingestion.fetchedRaw}, inserted=${result.ingestion.inserted}, valued=${result.valuation.updated}, skipped=${result.ingestion.skippedDuplicates}`
      );

      setTimeout(() => {
        setRecentRefreshStatus('idle');
        setRecentRefreshMessage('');
      }, 5000);
    } catch (error) {
      setRecentRefreshStatus('error');
      setRecentRefreshMessage(
        error?.response?.data?.error?.message || 'Не удалось обновить real recent CEX flows.'
      );
    }
  }

  if (status === 'loading') {
    return <LoadingState message={`Loading ${symbol} dashboard...`} />;
  }

  if (status === 'error') {
    return <ErrorState message={t('common.failedToLoadTokenDetail')} />;
  }

  const topSignal = signals[0];

  return (
    <div className="space-y-8">
      <Link to="/tokens" className="inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200">
        ← {t('common.backToTokens')}
      </Link>

      <DataModeBadge
        dataMode={overview.dataMode}
        sourceLabel={overview.sourceLabel}
        sourceWarning={overview.sourceWarning}
      />

      <TokenHero
        overview={overview}
        refreshStatus={refreshStatus}
        refreshMessage={refreshMessage}
        onRefresh={handleRefreshData}
      />

      <RealRecentCexFlowPanel
        cexFlows={recentCexFlows}
        valuation={recentValuation}
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        refreshStatus={recentRefreshStatus}
        refreshMessage={recentRefreshMessage}
        onRefresh={handleRefreshRecentCexFlows}
      />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ScoreDecomposition overview={overview} topSignal={topSignal} />
        <CexFlowActorsPlaceholder />
      </section>

      <HoldersTable holders={holders} />
    </div>
  );
}
