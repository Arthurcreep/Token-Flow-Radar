import { useEffect, useMemo, useState } from 'react';

import { getSignals } from '../api/signalsApi';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import SignalsPanel from '../components/token/SignalsPanel';
import { useTranslation } from '../i18n/useTranslation';

export default function SignalsPage() {
  const { t } = useTranslation();

  const [signals, setSignals] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    async function load() {
      try {
        const data = await getSignals();
        setSignals(data);
        setStatus('ready');
      } catch (error) {
        setStatus('error');
      }
    }

    load();
  }, []);

  const highSeverityCount = useMemo(() => {
    return signals.filter((signal) => signal.severity === 'high').length;
  }, [signals]);

  if (status === 'loading') {
    return <LoadingState message="Loading signal journal..." />;
  }

  if (status === 'error') {
    return <ErrorState message={t('common.failedToLoadSignals')} />;
  }

  return (
    <div className="space-y-8">
      <section className="panel p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="metric-label">{t('signals.eyebrow')}</p>
            <h1 className="mt-3 page-title">{t('signals.title')}</h1>
            <p className="page-subtitle">{t('signals.subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="soft-panel p-4">
              <p className="metric-label">{t('common.signals')}</p>
              <p className="metric-value">{signals.length}</p>
            </div>

            <div className="soft-panel p-4">
              <p className="metric-label">High</p>
              <p className="metric-value">{highSeverityCount}</p>
            </div>
          </div>
        </div>
      </section>

      <SignalsPanel signals={signals} title={t('signals.latestSignals')} />
    </div>
  );
}
