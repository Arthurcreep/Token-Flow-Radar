import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  analyzeResolvedToken,
  resolveToken
} from '../api/inspectApi';

import Card from '../components/common/Card';
import InspectSearchForm from '../components/inspect/InspectSearchForm';
import ResolvedTokenCard from '../components/inspect/ResolvedTokenCard';

export default function InspectPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [resolvedToken, setResolvedToken] = useState(null);

  const [resolveStatus, setResolveStatus] = useState('idle');
  const [resolveMessage, setResolveMessage] = useState('');

  const [analyzeStatus, setAnalyzeStatus] = useState('idle');
  const [analyzeMessage, setAnalyzeMessage] = useState('');

  async function handleResolve(event) {
    event.preventDefault();

    try {
      setResolveStatus('loading');
      setResolveMessage('');
      setAnalyzeMessage('');
      setResolvedToken(null);

      const data = await resolveToken(query, 'ethereum');

      setResolvedToken(data);
      setResolveStatus('success');
      setResolveMessage(
        `Resolved ${data.token.symbol} from ${data.inputType.replaceAll('_', ' ')}.`
      );
    } catch (error) {
      setResolveStatus('error');
      setResolveMessage(
        error?.response?.data?.error?.message || 'Failed to resolve token.'
      );
    }
  }

  async function handleAnalyze() {
    if (!resolvedToken?.token?.symbol) return;

    try {
      setAnalyzeStatus('loading');
      setAnalyzeMessage(
        `Running CEX flow pipeline for ${resolvedToken.token.symbol}: ingest → valuation → flow calculation...`
      );

      await analyzeResolvedToken(resolvedToken.token.symbol, {
        range: '1m',
        blocksBack: 216000,
        maxPages: 2,
        maxAddresses: 7,
        largeTransferThresholdUsd: 50000
      });

      setAnalyzeStatus('success');
      setAnalyzeMessage(`Analysis completed for ${resolvedToken.token.symbol}. Opening token detail...`);

      navigate(`/tokens/${resolvedToken.token.symbol}`);
    } catch (error) {
      setAnalyzeStatus('error');
      setAnalyzeMessage(
        error?.response?.data?.error?.message || 'Failed to analyze token CEX flows.'
      );
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
          Inspect
        </p>
        <h1 className="mt-3 text-4xl font-black text-white">
          Token Inspector
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          Enter a token symbol already known by the system, or paste an ERC-20 contract address.
          Backend resolves the input and decides whether to find or import the token.
        </p>
      </section>

      <Card
        title="Backend-owned logic"
        subtitle="Frontend only sends query and displays status."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="font-black text-cyan-300">Symbol</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              If you type UNI, backend searches local DB by symbol.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="font-black text-emerald-300">Contract address</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              If you paste 0x..., backend imports ERC-20 metadata and tries CoinGecko lookup.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="font-black text-amber-300">Unknown symbol</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Backend refuses to guess by ticker. Paste contract address to avoid wrong token matches.
            </p>
          </div>
        </div>
      </Card>

      <InspectSearchForm
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleResolve}
        status={resolveStatus}
      />

      {resolveMessage && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            resolveStatus === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          ].join(' ')}
        >
          {resolveMessage}
        </div>
      )}

      {analyzeMessage && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            analyzeStatus === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
          ].join(' ')}
        >
          {analyzeMessage}
        </div>
      )}

      <ResolvedTokenCard
        resolvedToken={resolvedToken}
        onAnalyze={handleAnalyze}
        analyzeStatus={analyzeStatus}
      />
    </div>
  );
}
