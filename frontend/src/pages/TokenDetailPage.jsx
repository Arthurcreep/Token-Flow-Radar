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
import CexFlowSummary from '../components/token/CexFlowSummary';
import CexFlowChart from '../components/token/CexFlowChart';
import CexFlowActorsPlaceholder from '../components/token/CexFlowActorsPlaceholder';
import ScoreDecomposition from '../components/token/ScoreDecomposition';
import HoldersTable from '../components/token/HoldersTable';
import RealRecentCexFlowPanel from '../components/token/RealRecentCexFlowPanel';
import { useTranslation } from '../i18n/useTranslation';

const RECENT_CEX_FLOW_SOURCE = 'calculated_from_etherscan_v2_recent_cex_address_tokentx';

export default function TokenDetailPage() {
  const { symbol } = useParams();
  const { t } = useTranslation();

  const [overview, setOverview] = useState(null);
  const [cexFlows, setCexFlows] = useState(null);
  const [recentCexFlows, setRecentCexFlows] = useState(null);
  const [holders, setHolders] = useState(null);
  const [signals, setSignals] = useState([]);
  const [status, setStatus] = useState('loading');

  const [refreshStatus, setRefreshStatus] = useState('idle');
  const [refreshMessage, setRefreshMessage] = useState('');

  const [recentRefreshStatus, setRecentRefreshStatus] = useState('idle');
  const [recentRefreshMessage, setRecentRefreshMessage] = useState('');

  async function loadTokenDashboard() {
    const [
      overviewData,
      cexFlowData,
      recentCexFlowData,
      holderData,
      signalData
    ] = await Promise.all([
      getTokenOverview(symbol),
      getTokenCexFlows(symbol).catch(() => null),
      getTokenCexFlows(symbol, RECENT_CEX_FLOW_SOURCE).catch(() => null),
      getTokenTopHolders(symbol).catch(() => null),
      getTokenSignals(symbol).catch(() => [])
    ]);

    setOverview(overviewData);
    setCexFlows(cexFlowData);
    setRecentCexFlows(recentCexFlowData);
    setHolders(holderData);
    setSignals(signalData);
  }

  useEffect(() => {
    async function load() {
      try {
        await loadTokenDashboard();
        setStatus('ready');
      } catch (error) {
        setStatus('error');
      }
    }

    load();
  }, [symbol]);

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
      await loadTokenDashboard();

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
      setRecentRefreshStatus('loading');
      setRecentRefreshMessage('Запускаем recent ingestion и пересчет CEX flows...');

      const result = await refreshRecentCexFlowPipeline(symbol, {
        blocksBack: 500000,
        offset: 50,
        maxPages: 2,
        maxAddresses: 7
      });

      setRecentCexFlows(result.cexFlows);
      setRecentRefreshStatus('success');
      setRecentRefreshMessage(
        `Готово: fetched=${result.ingestion.fetchedRaw}, inserted=${result.ingestion.inserted}, skipped=${result.ingestion.skippedDuplicates}`
      );

      setTimeout(() => {
        setRecentRefreshStatus('idle');
        setRecentRefreshMessage('');
      }, 4000);
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
        refreshStatus={recentRefreshStatus}
        refreshMessage={recentRefreshMessage}
        onRefresh={handleRefreshRecentCexFlows}
      />

      <CexFlowSummary overview={overview} />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <CexFlowChart cexFlows={cexFlows} />
        <ScoreDecomposition overview={overview} topSignal={topSignal} />
      </section>

      <CexFlowActorsPlaceholder />

      <HoldersTable holders={holders} />
    </div>
  );
}
