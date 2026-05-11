import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getTokenOverview, getTokens } from '../api/tokensApi';
import Badge from '../components/Badge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { formatPercent, getRegimeStyles, shortAddress } from '../utils/format';

export default function TokensPage() {
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

  if (status === 'loading') return <LoadingState message="Loading token radar..." />;
  if (status === 'error') return <ErrorState message="Failed to load tokens" />;

  return (
    <div className="space-y-8">
      <section className="panel overflow-hidden p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
          <div>
            <p className="metric-label">Ethereum mainnet MVP</p>
            <h1 className="mt-3 page-title">Token radar watchlist</h1>
            <p className="page-subtitle">
              Карточки показывают текущий regime, score и готовность данных по зрелым токенам.
              Пока аналитика рассчитана на fake UNI scenario, но структура уже готова под реальные providers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="soft-panel p-4">
              <p className="metric-label">Tokens</p>
              <p className="metric-value">{tokens.length}</p>
            </div>
            <div className="soft-panel p-4">
              <p className="metric-label">Ready</p>
              <p className="metric-value">{readyCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tokens.map((token) => {
          const overview = overviews[token.symbol];
          const regime = overview?.regime || 'UNCLEAR';

          return (
            <Link
              key={token.id}
              to={`/tokens/${token.symbol}`}
              className="group panel block p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-slate-900/90"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black tracking-tight text-white">{token.symbol}</h2>
                    <Badge className={getRegimeStyles(regime)}>{regime}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{token.name}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-right">
                  <p className="text-xs text-slate-500">Score</p>
                  <p className="text-2xl font-bold text-white">{overview?.finalScore ?? '—'}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-500">Confidence</p>
                  <p className="mt-1 text-lg font-semibold text-slate-200">
                    {overview?.confidence !== null && overview?.confidence !== undefined
                      ? formatPercent(overview.confidence)
                      : '—'}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-500">Freshness</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">
                    {overview?.dataFreshness || 'unknown'}
                  </p>
                </div>
              </div>

              <p className="mt-5 break-all rounded-xl bg-slate-950/50 p-3 font-mono text-xs text-slate-500">
                {shortAddress(token.contractAddress)} · {token.chain}
              </p>

              <div className="mt-5 text-sm font-semibold text-cyan-300 opacity-0 transition group-hover:opacity-100">
                Open token dashboard →
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
