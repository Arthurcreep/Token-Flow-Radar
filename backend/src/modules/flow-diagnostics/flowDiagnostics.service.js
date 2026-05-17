const AppError = require('../../errors/AppError');
const flowDiagnosticsRepository = require('./flowDiagnostics.repository');

const DEFAULT_SOURCE = 'calculated_from_etherscan_v2_recent_cex_address_tokentx';
const RAW_TRANSFER_SOURCE = 'etherscan_v2_recent_cex_address_tokentx';

const RANGE_CONFIG = {
  '1d': {
    label: '1D',
    days: 1
  },
  '7d': {
    label: '7D',
    days: 7
  },
  '1m': {
    label: '1M',
    days: 30
  },
  '1y': {
    label: '1Y',
    days: 365
  },
  all: {
    label: 'ALL',
    days: null
  }
};

function makeAppError(message, statusCode, code, details = null) {
  const error = new AppError(message, statusCode, code, details);

  error.code = code;
  error.statusCode = statusCode;
  error.details = details;

  return error;
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
}

function formatDate(date) {
  if (!date) return null;

  if (typeof date === 'string') {
    return date.slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return formatDate(date);
}

function buildRangeWindow({
  range,
  latestDataDate,
  fromDate,
  toDate
}) {
  if (fromDate || toDate) {
    return {
      selected: 'custom',
      label: 'CUSTOM',
      fromDate: fromDate || null,
      toDate: toDate || latestDataDate || null,
      latestDataDate,
      isAnchoredToLatestDataDate: false
    };
  }

  const selectedRange = RANGE_CONFIG[range] ? range : '1m';
  const config = RANGE_CONFIG[selectedRange];

  if (!latestDataDate) {
    return {
      selected: selectedRange,
      label: config.label,
      fromDate: null,
      toDate: null,
      latestDataDate: null,
      isAnchoredToLatestDataDate: true
    };
  }

  if (!config.days) {
    return {
      selected: selectedRange,
      label: config.label,
      fromDate: null,
      toDate: latestDataDate,
      latestDataDate,
      isAnchoredToLatestDataDate: true
    };
  }

  return {
    selected: selectedRange,
    label: config.label,
    fromDate: addDays(latestDataDate, -config.days + 1),
    toDate: latestDataDate,
    latestDataDate,
    isAnchoredToLatestDataDate: true
  };
}

function getRegimeHint(netflowUsd) {
  if (toNumber(netflowUsd) < 0) return 'CEX_SUPPLY_DRAIN';
  if (toNumber(netflowUsd) > 0) return 'CEX_SELL_PRESSURE';

  return 'NEUTRAL';
}

function getLargeFlowHint(largeNetflowUsd) {
  if (toNumber(largeNetflowUsd) < 0) return 'LARGE_SUPPLY_DRAIN';
  if (toNumber(largeNetflowUsd) > 0) return 'LARGE_SELL_PRESSURE';

  return 'NO_LARGE_FLOW';
}

function summarizeDailyRows(rows) {
  const totals = rows.reduce((acc, row) => {
    acc.cexInflowUsd += toNumber(row.cex_inflow_usd);
    acc.cexOutflowUsd += toNumber(row.cex_outflow_usd);
    acc.cexNetflowUsd += toNumber(row.cex_netflow_usd);
    acc.inflowTxCount += toNumber(row.inflow_tx_count);
    acc.outflowTxCount += toNumber(row.outflow_tx_count);
    acc.largeInflowCount += toNumber(row.large_inflow_count);
    acc.largeOutflowCount += toNumber(row.large_outflow_count);
    acc.largeInflowUsd += toNumber(row.large_inflow_usd);
    acc.largeOutflowUsd += toNumber(row.large_outflow_usd);
    acc.largeNetflowUsd += toNumber(row.large_netflow_usd);
    acc.largeTransferThresholdUsd = Math.max(acc.largeTransferThresholdUsd, toNumber(row.large_transfer_threshold_usd));

    return acc;
  }, {
    cexInflowUsd: 0,
    cexOutflowUsd: 0,
    cexNetflowUsd: 0,
    inflowTxCount: 0,
    outflowTxCount: 0,
    largeInflowCount: 0,
    largeOutflowCount: 0,
    largeInflowUsd: 0,
    largeOutflowUsd: 0,
    largeNetflowUsd: 0,
    largeTransferThresholdUsd: 0
  });

  return {
    ...totals,
    activeDays: rows.length,
    negativeNetflowDays: rows.filter((row) => toNumber(row.cex_netflow_usd) < 0).length,
    positiveNetflowDays: rows.filter((row) => toNumber(row.cex_netflow_usd) > 0).length,
    neutralDays: rows.filter((row) => toNumber(row.cex_netflow_usd) === 0).length,
    regimeHint: getRegimeHint(totals.cexNetflowUsd),
    largeFlowHint: getLargeFlowHint(totals.largeNetflowUsd)
  };
}

function getMainOutflowDay(rows) {
  const outflowRows = rows
    .filter((row) => toNumber(row.cex_netflow_usd) < 0)
    .sort((a, b) => toNumber(a.cex_netflow_usd) - toNumber(b.cex_netflow_usd));

  if (!outflowRows.length) return null;

  const row = outflowRows[0];

  return {
    date: row.date,
    cexInflowUsd: toNumber(row.cex_inflow_usd),
    cexOutflowUsd: toNumber(row.cex_outflow_usd),
    cexNetflowUsd: toNumber(row.cex_netflow_usd),
    largeInflowUsd: toNumber(row.large_inflow_usd),
    largeOutflowUsd: toNumber(row.large_outflow_usd),
    largeNetflowUsd: toNumber(row.large_netflow_usd),
    inflowTxCount: toNumber(row.inflow_tx_count),
    outflowTxCount: toNumber(row.outflow_tx_count),
    largeInflowCount: toNumber(row.large_inflow_count),
    largeOutflowCount: toNumber(row.large_outflow_count)
  };
}

function getFlowPattern({
  rows,
  summary,
  mainOutflowDay
}) {
  if (!rows.length) {
    return {
      patternType: 'no_flow_data',
      label: 'Нет данных по CEX-потокам',
      confidence: 'low'
    };
  }

  if (summary.regimeHint === 'CEX_SELL_PRESSURE') {
    return {
      patternType: 'net_inflow',
      label: 'Преобладает завод на биржи',
      confidence: summary.positiveNetflowDays >= 2 ? 'medium' : 'low'
    };
  }

  if (!mainOutflowDay) {
    return {
      patternType: 'neutral',
      label: 'Нет выраженного вывода',
      confidence: 'low'
    };
  }

  const totalOutflowAbs = Math.abs(toNumber(summary.cexNetflowUsd));
  const mainDayAbs = Math.abs(toNumber(mainOutflowDay.cexNetflowUsd));
  const mainDaySharePct = totalOutflowAbs > 0 ? (mainDayAbs / totalOutflowAbs) * 100 : 0;

  if (summary.negativeNetflowDays >= 3) {
    return {
      patternType: 'multi_day_outflow',
      label: 'Вывод шел несколько дней',
      confidence: 'high',
      mainDaySharePct
    };
  }

  if (mainDaySharePct >= 75) {
    return {
      patternType: 'one_day_spike',
      label: 'Основной вывод пришелся на один день',
      confidence: 'medium',
      mainDaySharePct
    };
  }

  if (summary.negativeNetflowDays >= 2) {
    return {
      patternType: 'short_outflow_series',
      label: 'Короткая серия выводов',
      confidence: 'medium',
      mainDaySharePct
    };
  }

  return {
    patternType: 'weak_outflow',
    label: 'Слабый или единичный вывод',
    confidence: 'low',
    mainDaySharePct
  };
}

function getPostOutflowReversal({
  rows,
  mainOutflowDay
}) {
  if (!mainOutflowDay) {
    return {
      available: false,
      label: 'Нет главного дня вывода для проверки возврата.'
    };
  }

  const afterRows = rows.filter((row) => String(row.date) > String(mainOutflowDay.date));

  const totals = afterRows.reduce((acc, row) => {
    acc.inflowUsd += toNumber(row.cex_inflow_usd);
    acc.outflowUsd += toNumber(row.cex_outflow_usd);
    acc.netflowUsd += toNumber(row.cex_netflow_usd);
    acc.days += 1;

    return acc;
  }, {
    days: 0,
    inflowUsd: 0,
    outflowUsd: 0,
    netflowUsd: 0
  });

  const mainOutflowAbs = Math.abs(toNumber(mainOutflowDay.cexNetflowUsd));
  const inflowAfterSharePct = mainOutflowAbs > 0 ? (totals.inflowUsd / mainOutflowAbs) * 100 : 0;

  let reversalLevel = 'none';
  let label = 'После главного вывода заметного возврата на биржи не видно.';

  if (inflowAfterSharePct >= 75) {
    reversalLevel = 'high';
    label = 'После главного вывода была сильная обратная подача на биржи.';
  } else if (inflowAfterSharePct >= 35) {
    reversalLevel = 'medium';
    label = 'После главного вывода был частичный возврат на биржи.';
  } else if (inflowAfterSharePct > 0) {
    reversalLevel = 'low';
    label = 'После главного вывода был небольшой возврат на биржи.';
  }

  return {
    available: true,
    afterDays: totals.days,
    inflowAfterUsd: totals.inflowUsd,
    outflowAfterUsd: totals.outflowUsd,
    netflowAfterUsd: totals.netflowUsd,
    inflowAfterSharePct,
    reversalLevel,
    label
  };
}

function getAddressMeta(addressMap, address) {
  return addressMap.get(String(address || '').toLowerCase()) || null;
}

function getDirection({
  fromMeta,
  toMeta
}) {
  const fromEntity = fromMeta?.entityName || null;
  const toEntity = toMeta?.entityName || null;

  if (fromEntity && toEntity && fromEntity === toEntity) {
    return 'same_entity';
  }

  if (fromEntity && toEntity && fromEntity !== toEntity) {
    return 'cex_to_cex';
  }

  if (fromEntity && !toEntity) {
    return 'outflow';
  }

  if (!fromEntity && toEntity) {
    return 'inflow';
  }

  return 'ignored';
}

function addBreakdown(map, key, data) {
  if (!key) return;

  const current = map.get(key) || {
    key,
    label: data.label || key,
    entityName: data.entityName || null,
    address: data.address || null,
    inflowUsd: 0,
    outflowUsd: 0,
    netflowUsd: 0,
    inflowTxCount: 0,
    outflowTxCount: 0,
    totalAbsUsd: 0
  };

  current.inflowUsd += data.inflowUsd || 0;
  current.outflowUsd += data.outflowUsd || 0;
  current.netflowUsd += data.netflowUsd || 0;
  current.inflowTxCount += data.inflowTxCount || 0;
  current.outflowTxCount += data.outflowTxCount || 0;
  current.totalAbsUsd += Math.abs(data.inflowUsd || 0) + Math.abs(data.outflowUsd || 0);

  map.set(key, current);
}

function buildTransferBreakdown({
  transfers,
  addressMap
}) {
  const entityMap = new Map();
  const addressBreakdownMap = new Map();

  let usableTransfers = 0;
  let ignoredTransfers = 0;
  let sameEntityIgnored = 0;
  let cexToCexIgnored = 0;
  let inflowUsd = 0;
  let outflowUsd = 0;

  for (const transfer of transfers) {
    const amountUsd = toNumber(transfer.amount_usd);
    const fromAddress = String(transfer.from_address || '').toLowerCase();
    const toAddress = String(transfer.to_address || '').toLowerCase();

    const fromMeta = getAddressMeta(addressMap, fromAddress);
    const toMeta = getAddressMeta(addressMap, toAddress);
    const direction = getDirection({
      fromMeta,
      toMeta
    });

    if (direction === 'same_entity') {
      sameEntityIgnored += 1;
      continue;
    }

    if (direction === 'cex_to_cex') {
      cexToCexIgnored += 1;
      continue;
    }

    if (direction === 'ignored') {
      ignoredTransfers += 1;
      continue;
    }

    usableTransfers += 1;

    if (direction === 'outflow') {
      outflowUsd += amountUsd;

      const entityName = fromMeta.entityName || fromMeta.label || fromAddress;
      const addressLabel = fromMeta.label || fromAddress;

      addBreakdown(entityMap, entityName, {
        label: entityName,
        entityName,
        outflowUsd: amountUsd,
        netflowUsd: -amountUsd,
        outflowTxCount: 1
      });

      addBreakdown(addressBreakdownMap, fromAddress, {
        label: addressLabel,
        entityName,
        address: fromAddress,
        outflowUsd: amountUsd,
        netflowUsd: -amountUsd,
        outflowTxCount: 1
      });
    }

    if (direction === 'inflow') {
      inflowUsd += amountUsd;

      const entityName = toMeta.entityName || toMeta.label || toAddress;
      const addressLabel = toMeta.label || toAddress;

      addBreakdown(entityMap, entityName, {
        label: entityName,
        entityName,
        inflowUsd: amountUsd,
        netflowUsd: amountUsd,
        inflowTxCount: 1
      });

      addBreakdown(addressBreakdownMap, toAddress, {
        label: addressLabel,
        entityName,
        address: toAddress,
        inflowUsd: amountUsd,
        netflowUsd: amountUsd,
        inflowTxCount: 1
      });
    }
  }

  const entityBreakdown = [...entityMap.values()]
    .sort((a, b) => b.totalAbsUsd - a.totalAbsUsd)
    .slice(0, 10);

  const addressBreakdown = [...addressBreakdownMap.values()]
    .sort((a, b) => b.totalAbsUsd - a.totalAbsUsd)
    .slice(0, 10);

  const totalAbsUsd = entityBreakdown.reduce((sum, item) => sum + toNumber(item.totalAbsUsd), 0);
  const topEntity = entityBreakdown[0] || null;
  const topAddress = addressBreakdown[0] || null;

  const topEntitySharePct = totalAbsUsd > 0 && topEntity
    ? (topEntity.totalAbsUsd / totalAbsUsd) * 100
    : 0;

  const addressTotalAbsUsd = addressBreakdown.reduce((sum, item) => sum + toNumber(item.totalAbsUsd), 0);
  const topAddressSharePct = addressTotalAbsUsd > 0 && topAddress
    ? (topAddress.totalAbsUsd / addressTotalAbsUsd) * 100
    : 0;

  let riskLevel = 'low';

  if (topEntitySharePct >= 85 || topAddressSharePct >= 85) {
    riskLevel = 'high';
  } else if (topEntitySharePct >= 60 || topAddressSharePct >= 60) {
    riskLevel = 'medium';
  }

  return {
    transferStats: {
      usableTransfers,
      ignoredTransfers,
      sameEntityIgnored,
      cexToCexIgnored,
      inflowUsd,
      outflowUsd,
      netflowUsd: inflowUsd - outflowUsd
    },
    entityBreakdown,
    addressBreakdown,
    concentrationRisk: {
      topEntity: topEntity
        ? {
            name: topEntity.label,
            sharePct: topEntitySharePct,
            netflowUsd: topEntity.netflowUsd
          }
        : null,
      topAddress: topAddress
        ? {
            address: topAddress.address,
            label: topAddress.label,
            entityName: topAddress.entityName,
            sharePct: topAddressSharePct,
            netflowUsd: topAddress.netflowUsd
          }
        : null,
      topEntitySharePct,
      topAddressSharePct,
      riskLevel
    }
  };
}

function buildQuestions({
  summary,
  mainOutflowDay,
  pattern,
  postOutflowReversal,
  transferDiagnostics
}) {
  const concentrationRisk = transferDiagnostics?.concentrationRisk || null;
  const entityBreakdown = transferDiagnostics?.entityBreakdown || [];
  const topEntity = concentrationRisk?.topEntity || entityBreakdown[0] || null;

  return [
    {
      id: 'main_outflow_days',
      question: 'По каким дням был основной вывод?',
      answer: mainOutflowDay
        ? `Основной день вывода: ${mainOutflowDay.date}. Netflow: ${Math.round(mainOutflowDay.cexNetflowUsd).toLocaleString('ru-RU')} USD.`
        : 'Выраженного дня вывода не найдено.',
      data: mainOutflowDay
    },
    {
      id: 'one_day_or_series',
      question: 'Это один большой день или несколько дней подряд?',
      answer: `${pattern.label}. Отрицательных дней: ${summary.negativeNetflowDays} из ${summary.activeDays}.`,
      data: pattern
    },
    {
      id: 'large_outflow_transactions',
      question: 'Были ли крупные outflow-транзакции?',
      answer: summary.largeOutflowCount > 0
        ? `Да. Крупных выводов: ${summary.largeOutflowCount}, сумма: ${Math.round(summary.largeOutflowUsd).toLocaleString('ru-RU')} USD.`
        : 'Крупных выводов выше порога не найдено.',
      data: {
        largeOutflowCount: summary.largeOutflowCount,
        largeOutflowUsd: summary.largeOutflowUsd,
        largeInflowCount: summary.largeInflowCount,
        largeInflowUsd: summary.largeInflowUsd,
        thresholdUsd: summary.largeTransferThresholdUsd
      }
    },
    {
      id: 'reverse_inflow_after_outflow',
      question: 'Есть ли обратные inflow после вывода?',
      answer: postOutflowReversal.label,
      data: postOutflowReversal
    },
    {
      id: 'cex_entities',
      question: 'Какие CEX-адреса или биржи участвовали?',
      answer: topEntity
        ? `Главный участник: ${topEntity.name || topEntity.label || topEntity.key}.`
        : 'Недостаточно transaction-level данных для определения участников.',
      data: {
        entityBreakdown,
        addressBreakdown: transferDiagnostics?.addressBreakdown || []
      }
    },
    {
      id: 'single_address_concentration',
      question: 'Не один ли это адрес гонял внутреннюю ликвидность?',
      answer: concentrationRisk
        ? `Риск концентрации: ${concentrationRisk.riskLevel}. Доля топ-entity: ${concentrationRisk.topEntitySharePct.toFixed(1)}%, доля топ-address: ${concentrationRisk.topAddressSharePct.toFixed(1)}%.`
        : 'Недостаточно transaction-level данных для оценки концентрации.',
      data: concentrationRisk
    }
  ];
}

function buildInterpretation({
  token,
  summary,
  pattern,
  concentrationRisk,
  postOutflowReversal
}) {
  if (!summary.activeDays) {
    return `${token.symbol}: за выбранный период нет рассчитанных CEX-потоков.`;
  }

  if (summary.regimeHint === 'CEX_SELL_PRESSURE') {
    return `${token.symbol}: по выбранному периоду преобладает завод на биржи. Это не accumulation-профиль.`;
  }

  if (summary.regimeHint === 'NEUTRAL') {
    return `${token.symbol}: выраженного направления CEX-потока нет.`;
  }

  const parts = [
    `${token.symbol}: преобладает вывод с бирж.`
  ];

  if (summary.largeOutflowCount > summary.largeInflowCount && summary.largeOutflowUsd > 0) {
    parts.push('Крупные переводы подтверждают outflow.');
  } else {
    parts.push('Крупные переводы не дают сильного подтверждения.');
  }

  if (pattern.patternType === 'multi_day_outflow') {
    parts.push('Сигнал распределен по нескольким дням, это лучше одиночного spike.');
  }

  if (pattern.patternType === 'one_day_spike') {
    parts.push('Основной вклад дал один день, поэтому надо проверить источник движения.');
  }

  if (postOutflowReversal.reversalLevel === 'high') {
    parts.push('После вывода был заметный возврат на биржи, сигнал слабее.');
  }

  if (concentrationRisk?.riskLevel === 'high') {
    parts.push('Есть высокий риск концентрации: большую часть движения дал один участник или адрес.');
  }

  return parts.join(' ');
}

async function getFlowDiagnostics({
  symbol,
  range = '1m',
  source = DEFAULT_SOURCE,
  rawSource = RAW_TRANSFER_SOURCE,
  fromDate,
  toDate
}) {
  const normalizedSymbol = String(symbol || '').toUpperCase();

  const token = await flowDiagnosticsRepository.findTokenBySymbol(normalizedSymbol);

  if (!token) {
    throw makeAppError(
      `Token ${normalizedSymbol} not found.`,
      404,
      'TOKEN_NOT_FOUND',
      {
        symbol: normalizedSymbol
      }
    );
  }

  const latestDataDate = await flowDiagnosticsRepository.findLatestDateBySymbolAndSource({
    symbol: normalizedSymbol,
    source
  });

  const rangeInfo = buildRangeWindow({
    range,
    latestDataDate,
    fromDate,
    toDate
  });

  const rows = await flowDiagnosticsRepository.findDailyRows({
    symbol: normalizedSymbol,
    source,
    fromDate: rangeInfo.fromDate,
    toDate: rangeInfo.toDate
  });

  const summary = summarizeDailyRows(rows);
  const mainOutflowDay = getMainOutflowDay(rows);
  const pattern = getFlowPattern({
    rows,
    summary,
    mainOutflowDay
  });
  const postOutflowReversal = getPostOutflowReversal({
    rows,
    mainOutflowDay
  });

  const transferResult = await flowDiagnosticsRepository.findTransferRows({
    tokenId: token.id,
    source: rawSource,
    fromDate: rangeInfo.fromDate,
    toDate: rangeInfo.toDate
  });

  const transferDiagnostics = buildTransferBreakdown({
    transfers: transferResult.rows,
    addressMap: transferResult.addressMap
  });

  const questions = buildQuestions({
    summary,
    mainOutflowDay,
    pattern,
    postOutflowReversal,
    transferDiagnostics
  });

  const interpretation = buildInterpretation({
    token,
    summary,
    pattern,
    concentrationRisk: transferDiagnostics.concentrationRisk,
    postOutflowReversal
  });

  return {
    token: {
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      chain: token.chain,
      contractAddress: token.contract_address,
      coingeckoId: token.coingecko_id
    },
    source,
    rawSource,
    range: {
      ...rangeInfo,
      calendarWindow: rangeInfo.fromDate && rangeInfo.toDate
        ? `${rangeInfo.fromDate} → ${rangeInfo.toDate}`
        : '—',
      activeDays: summary.activeDays,
      loadedRows: rows.length
    },
    summary,
    diagnostics: {
      mainOutflowDay,
      pattern,
      postOutflowReversal,
      transferStats: transferDiagnostics.transferStats,
      entityBreakdown: transferDiagnostics.entityBreakdown,
      addressBreakdown: transferDiagnostics.addressBreakdown,
      concentrationRisk: transferDiagnostics.concentrationRisk,
      questions,
      interpretation,
      warnings: [
        transferResult.warning
      ].filter(Boolean),
      version: 'v1-flow-diagnostics'
    }
  };
}

module.exports = {
  getFlowDiagnostics
};
