const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
};

const getRegimeHint = ({
  cexNetflowUsd,
  cexNetflow
}) => {
  if (toNumber(cexNetflowUsd) > 0 || toNumber(cexNetflow) > 0) {
    return 'CEX_SELL_PRESSURE';
  }

  if (toNumber(cexNetflowUsd) < 0 || toNumber(cexNetflow) < 0) {
    return 'CEX_SUPPLY_DRAIN';
  }

  return 'NEUTRAL';
};

const getLargeFlowHint = ({
  largeNetflowUsd
}) => {
  if (toNumber(largeNetflowUsd) > 0) {
    return 'LARGE_SELL_PRESSURE';
  }

  if (toNumber(largeNetflowUsd) < 0) {
    return 'LARGE_SUPPLY_DRAIN';
  }

  return 'NO_LARGE_FLOW';
};

const getStrength = ({
  cexNetflowUsd,
  largeNetflowUsd,
  activeDays
}) => {
  const absNetflowUsd = Math.abs(toNumber(cexNetflowUsd));
  const absLargeNetflowUsd = Math.abs(toNumber(largeNetflowUsd));

  if (absNetflowUsd >= 5_000_000 && absLargeNetflowUsd >= 2_000_000) {
    return 'very_strong';
  }

  if (absNetflowUsd >= 1_000_000 && absLargeNetflowUsd >= 500_000) {
    return 'strong';
  }

  if (absNetflowUsd >= 250_000 || absLargeNetflowUsd >= 100_000) {
    return 'moderate';
  }

  if (absNetflowUsd > 0 || activeDays > 0) {
    return 'weak';
  }

  return 'none';
};

const getRecoveryContext = (priceContext) => {
  if (!priceContext) return 'unknown';

  const drawdown = toNumber(priceContext.drawdownFromAthPct);
  const upside = toNumber(priceContext.upsideToAthPct);

  if (drawdown <= -97 || upside >= 3000) return 'extreme';
  if (drawdown <= -90 || upside >= 1000) return 'high';
  if (drawdown <= -75 || upside >= 300) return 'medium';
  if (drawdown < 0 || upside > 0) return 'low';

  return 'none';
};

const getFlowSignal = ({
  regimeHint,
  largeFlowHint,
  strength
}) => {
  if (regimeHint === 'CEX_SUPPLY_DRAIN' && largeFlowHint === 'LARGE_SUPPLY_DRAIN') {
    if (['very_strong', 'strong'].includes(strength)) return 'strong_supply_drain';
    if (strength === 'moderate') return 'moderate_supply_drain';
    return 'weak_supply_drain';
  }

  if (regimeHint === 'CEX_SELL_PRESSURE' && largeFlowHint === 'LARGE_SELL_PRESSURE') {
    if (['very_strong', 'strong'].includes(strength)) return 'strong_sell_pressure';
    if (strength === 'moderate') return 'moderate_sell_pressure';
    return 'weak_sell_pressure';
  }

  if (regimeHint === 'CEX_SUPPLY_DRAIN' && largeFlowHint === 'LARGE_SELL_PRESSURE') {
    return 'mixed_supply_drain_with_large_sell_pressure';
  }

  if (regimeHint === 'CEX_SELL_PRESSURE' && largeFlowHint === 'LARGE_SUPPLY_DRAIN') {
    return 'mixed_sell_pressure_with_large_supply_drain';
  }

  if (regimeHint === 'CEX_SUPPLY_DRAIN' && largeFlowHint === 'NO_LARGE_FLOW') {
    return 'unconfirmed_supply_drain';
  }

  if (regimeHint === 'CEX_SELL_PRESSURE' && largeFlowHint === 'NO_LARGE_FLOW') {
    return 'unconfirmed_sell_pressure';
  }

  return 'neutral';
};

const buildRiskFlags = ({
  regimeHint,
  largeFlowHint,
  strength,
  priceContext,
  activeDays,
  cexNetflowUsd,
  largeNetflowUsd,
  diagnostics
}) => {
  const flags = [];
  const drawdown = priceContext ? toNumber(priceContext.drawdownFromAthPct) : null;
  const upside = priceContext ? toNumber(priceContext.upsideToAthPct) : null;
  const concentrationRisk = diagnostics?.diagnostics?.concentrationRisk || diagnostics?.concentrationRisk || null;

  if (regimeHint === 'CEX_SUPPLY_DRAIN' && largeFlowHint === 'LARGE_SELL_PRESSURE') {
    flags.push('large_layer_conflict');
  }

  if (regimeHint === 'CEX_SELL_PRESSURE' && largeFlowHint === 'LARGE_SUPPLY_DRAIN') {
    flags.push('large_layer_conflict');
  }

  if (largeFlowHint === 'NO_LARGE_FLOW') {
    flags.push('no_large_flow_confirmation');
  }

  if (strength === 'weak') {
    flags.push('weak_flow');
  }

  if (activeDays <= 2) {
    flags.push('thin_active_days');
  }

  if (drawdown !== null && drawdown <= -97) {
    flags.push('extreme_ath_drawdown');
  } else if (drawdown !== null && drawdown <= -90) {
    flags.push('deep_ath_drawdown');
  }

  if (upside !== null && upside >= 3000) {
    flags.push('extreme_recovery_distance');
  }

  if (Math.abs(toNumber(cexNetflowUsd)) < 100_000) {
    flags.push('low_usd_flow');
  }

  if (Math.abs(toNumber(largeNetflowUsd)) === 0) {
    flags.push('zero_large_netflow');
  }

  if (concentrationRisk?.riskLevel === 'high') {
    flags.push('high_concentration_risk');
  }

  if (concentrationRisk?.riskLevel === 'medium') {
    flags.push('medium_concentration_risk');
  }

  return [...new Set(flags)];
};

const getProfileLabel = ({
  flowSignal,
  recoveryContext,
  riskFlags
}) => {
  if (
    flowSignal === 'strong_supply_drain' &&
    !riskFlags.includes('large_layer_conflict') &&
    !riskFlags.includes('high_concentration_risk')
  ) {
    return 'clean_supply_drain';
  }

  if (
    ['strong_supply_drain', 'moderate_supply_drain'].includes(flowSignal) &&
    riskFlags.includes('high_concentration_risk')
  ) {
    return 'strong_signal_high_risk';
  }

  if (flowSignal === 'moderate_supply_drain' && ['high', 'extreme'].includes(recoveryContext)) {
    return 'speculative_recovery_candidate';
  }

  if (flowSignal.includes('mixed')) {
    return 'mixed_flow';
  }

  if (flowSignal.includes('sell_pressure')) {
    return 'sell_pressure_watch';
  }

  if (flowSignal.includes('unconfirmed')) {
    return 'unconfirmed_flow';
  }

  if (riskFlags.includes('weak_flow')) {
    return 'weak_signal';
  }

  return 'watchlist_candidate';
};

const getInterpretation = ({
  tokenSymbol,
  flowSignal,
  recoveryContext,
  riskFlags
}) => {
  if (riskFlags.includes('high_concentration_risk')) {
    return `${tokenSymbol} shows strong CEX flow, but concentration risk is high. Treat it as an anomaly that needs address-level review.`;
  }

  if (flowSignal === 'strong_supply_drain' && !riskFlags.includes('large_layer_conflict')) {
    return `${tokenSymbol} shows clean CEX supply drain with large-flow confirmation. Recovery context is ${recoveryContext}.`;
  }

  if (flowSignal === 'moderate_supply_drain' && ['high', 'extreme'].includes(recoveryContext)) {
    return `${tokenSymbol} shows confirmed CEX supply drain, but recovery context is ${recoveryContext}; treat it as a higher-risk recovery candidate.`;
  }

  if (flowSignal === 'mixed_supply_drain_with_large_sell_pressure') {
    return `${tokenSymbol} has general CEX supply drain, but large-flow layer points to sell pressure. Signal is mixed.`;
  }

  if (flowSignal === 'unconfirmed_supply_drain') {
    return `${tokenSymbol} shows CEX supply drain, but without large-flow confirmation. Signal is weak or incomplete.`;
  }

  if (flowSignal.includes('sell_pressure')) {
    return `${tokenSymbol} shows possible CEX sell pressure. This is not an accumulation-style flow profile.`;
  }

  if (riskFlags.includes('weak_flow')) {
    return `${tokenSymbol} has weak flow evidence. Do not over-interpret the current data.`;
  }

  return `${tokenSymbol} is a watchlist candidate, but the signal requires more context.`;
};

const buildAnalysisProfile = ({
  tokenSymbol,
  regimeHint,
  largeFlowHint,
  strength,
  priceContext,
  activeDays,
  cexNetflowUsd,
  largeNetflowUsd,
  diagnostics
}) => {
  const recoveryContext = getRecoveryContext(priceContext);

  const flowSignal = getFlowSignal({
    regimeHint,
    largeFlowHint,
    strength
  });

  const riskFlags = buildRiskFlags({
    regimeHint,
    largeFlowHint,
    strength,
    priceContext,
    activeDays,
    cexNetflowUsd,
    largeNetflowUsd,
    diagnostics
  });

  const profileLabel = getProfileLabel({
    flowSignal,
    recoveryContext,
    riskFlags
  });

  const interpretation = getInterpretation({
    tokenSymbol,
    flowSignal,
    recoveryContext,
    riskFlags
  });

  return {
    profileLabel,
    flowSignal,
    recoveryContext,
    riskFlags,
    interpretation,
    version: 'v3-flow-profile-with-diagnostics'
  };
};

const buildScores = ({
  summary,
  priceContext,
  diagnostics
}) => {
  const netflowAbs = Math.abs(toNumber(summary.cexNetflowUsd));
  const largeAbs = Math.abs(toNumber(summary.largeNetflowUsd));
  const activeDays = toNumber(summary.activeDays);
  const negativeDays = toNumber(summary.negativeNetflowDays);
  const riskLevel = diagnostics?.diagnostics?.concentrationRisk?.riskLevel || diagnostics?.concentrationRisk?.riskLevel || 'unknown';
  const drawdown = priceContext ? Math.abs(toNumber(priceContext.drawdownFromAthPct)) : 0;

  let signalQuality = 0;
  signalQuality += netflowAbs >= 5_000_000 ? 30 : netflowAbs >= 1_000_000 ? 22 : netflowAbs >= 250_000 ? 14 : 6;
  signalQuality += largeAbs >= 2_000_000 ? 25 : largeAbs >= 500_000 ? 18 : largeAbs >= 100_000 ? 10 : 0;
  signalQuality += activeDays >= 5 ? 15 : activeDays >= 3 ? 10 : activeDays >= 1 ? 4 : 0;
  signalQuality += negativeDays >= 3 ? 10 : negativeDays >= 1 ? 4 : 0;

  let riskScore = 0;
  riskScore += riskLevel === 'high' ? 35 : riskLevel === 'medium' ? 20 : riskLevel === 'low' ? 5 : 10;
  riskScore += drawdown >= 97 ? 25 : drawdown >= 90 ? 18 : drawdown >= 75 ? 10 : 0;
  riskScore += activeDays <= 2 ? 10 : 0;

  const anomalyScore = (signalQuality * 0.65) + (riskScore * 0.35);

  return {
    signalQuality: Math.min(100, Math.round(signalQuality)),
    riskScore: Math.min(100, Math.round(riskScore)),
    anomalyScore: Math.min(100, Math.round(anomalyScore)),
    version: 'v1-simple-anomaly-quality-risk'
  };
};

module.exports = {
  getRegimeHint,
  getLargeFlowHint,
  getStrength,
  buildAnalysisProfile,
  buildScores
};
