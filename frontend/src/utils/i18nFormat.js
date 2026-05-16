export function translateRegime(t, regime) {
  if (!regime) return '—';
  return t(`regimes.${regime}`);
}

export function translateDynamicText(t, text, regime) {
  if (!text) return '';

  if (regime === 'MIXED_DATA_REVIEW_REQUIRED' || text.includes('different data modes')) {
    return t('dynamic.mixedReview');
  }

  if (text.includes('demo seed data')) {
    return t('dynamic.fakeWarning');
  }

  if (text.includes('Mixed data warning')) {
    return t('dynamic.mixedWarning');
  }

  if (regime === 'ACCUMULATION') return t('dynamic.accumulation');
  if (regime === 'DISTRIBUTION') return t('dynamic.distribution');
  if (regime === 'CEX_SUPPLY_DRAIN') return t('dynamic.cexSupplyDrain');
  if (regime === 'CEX_SELL_PRESSURE') return t('dynamic.cexSellPressure');
  if (regime === 'UNCLEAR_LOW_CONFIDENCE') return t('dynamic.lowConfidence');

  return text;
}
