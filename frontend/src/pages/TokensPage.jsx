import { useEffect, useMemo, useState } from 'react';

import { getTokenOverview, getTokens } from '../api/tokensApi';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import TokenCard from '../components/token/TokenCard';
import { useTranslation } from '../i18n/useTranslation';

export default function TokensPage() {
  const { t } = useTranslation();

  const [tokens, setTokens] = useState([]);
  const [overviews, setOverviews] = useState({});
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    async function load() {
      try {
        const tokenList = await getTokens();
        setTokens(tokenList);

        const overviewPairs = await Promise.all(
          tokenList.map(async (token) => {
            try {
              const overview = await getTokenOverview(token.symbol);
              return [token.symbol, overview];
            } catch (error) {
              return [token.symbol, null];
            }
          })
        );

        setOverviews(Object.fromEntries(overviewPairs));
        setStatus('ready');
      } catch (error) {
        setStatus('error');
      }
    }

    load();
  }, []);

  const readyCount = useMemo(() => {
    return Object.values(overviews).filter((item) => item?.dataFreshness === 'ready').length;
  }, [overviews]);

  if (status === 'loading') {
    return <LoadingState message="Loading token radar..." />;
  }

  if (status === 'error') {
    return <ErrorState message={t('common.failedToLoadTokens')} />;
  }

  return (
    <div className="space-y-8">
      <section className="panel overflow-hidden p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
          <div>
            <p className="metric-label">{t('tokens.eyebrow')}</p>
            <h1 className="mt-3 page-title">{t('tokens.title')}</h1>
            <p className="page-subtitle">{t('tokens.subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="soft-panel p-4">
              <p className="metric-label">{t('tokens.totalTokens')}</p>
              <p className="metric-value">{tokens.length}</p>
            </div>

            <div className="soft-panel p-4">
              <p className="metric-label">{t('tokens.readyTokens')}</p>
              <p className="metric-value">{readyCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tokens.map((token) => (
          <TokenCard
            key={token.id}
            token={token}
            overview={overviews[token.symbol]}
          />
        ))}
      </section>
    </div>
  );
}
