const { QueryTypes } = require('sequelize');

const {
  CexFlowDaily,
  sequelize
} = require('../../models');

async function findLatestDateBySymbolAndSource({
  symbol,
  source
}) {
  const rows = await CexFlowDaily.sequelize.query(
    `
      SELECT MAX(cfd.date)::text AS latest_date
      FROM cex_flow_daily cfd
      INNER JOIN tokens t ON t.id = cfd.token_id
      WHERE UPPER(t.symbol) = :symbol
        AND (:source IS NULL OR cfd.source = :source);
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        symbol: String(symbol || '').toUpperCase(),
        source: source || null
      }
    }
  );

  return rows[0]?.latest_date || null;
}

async function findDailyRows({
  symbol,
  source,
  fromDate,
  toDate
}) {
  return CexFlowDaily.sequelize.query(
    `
      SELECT
        cfd.id,
        cfd.date::text AS date,
        cfd.source,
        COALESCE(cfd.data_mode, 'unknown') AS data_mode,

        t.id AS token_id,
        t.symbol AS token_symbol,
        t.name AS token_name,
        t.chain AS token_chain,
        t.contract_address AS contract_address,
        t.coingecko_id AS coingecko_id,

        cfd.cex_inflow::numeric AS cex_inflow,
        cfd.cex_outflow::numeric AS cex_outflow,
        cfd.cex_netflow::numeric AS cex_netflow,

        cfd.cex_inflow_usd::numeric AS cex_inflow_usd,
        cfd.cex_outflow_usd::numeric AS cex_outflow_usd,
        cfd.cex_netflow_usd::numeric AS cex_netflow_usd,

        cfd.inflow_tx_count::integer AS inflow_tx_count,
        cfd.outflow_tx_count::integer AS outflow_tx_count,

        COALESCE(cfd.large_inflow_count, 0)::integer AS large_inflow_count,
        COALESCE(cfd.large_outflow_count, 0)::integer AS large_outflow_count,
        COALESCE(cfd.large_inflow_usd, 0)::numeric AS large_inflow_usd,
        COALESCE(cfd.large_outflow_usd, 0)::numeric AS large_outflow_usd,
        COALESCE(cfd.large_netflow_usd, 0)::numeric AS large_netflow_usd,
        COALESCE(cfd.large_transfer_threshold_usd, 0)::numeric AS large_transfer_threshold_usd

      FROM cex_flow_daily cfd
      INNER JOIN tokens t ON t.id = cfd.token_id

      WHERE UPPER(t.symbol) = :symbol
        AND (:source IS NULL OR cfd.source = :source)
        AND (:fromDate IS NULL OR cfd.date >= :fromDate)
        AND (:toDate IS NULL OR cfd.date <= :toDate)

      ORDER BY cfd.date ASC;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        symbol: String(symbol || '').toUpperCase(),
        source: source || null,
        fromDate: fromDate || null,
        toDate: toDate || null
      }
    }
  );
}

async function findTokenBySymbol(symbol) {
  const rows = await sequelize.query(
    `
      SELECT
        id,
        symbol,
        name,
        chain,
        contract_address,
        decimals,
        coingecko_id,
        is_active
      FROM tokens
      WHERE UPPER(symbol) = :symbol
      LIMIT 1;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        symbol: String(symbol || '').toUpperCase()
      }
    }
  );

  return rows[0] || null;
}

async function describeTableSafe(tableName) {
  try {
    return await sequelize.getQueryInterface().describeTable(tableName);
  } catch (error) {
    return null;
  }
}

function pickColumn(columns, candidates) {
  if (!columns) return null;

  for (const candidate of candidates) {
    if (columns[candidate]) return candidate;
  }

  return null;
}

async function getKnownAddressMap() {
  const addressesTable = await describeTableSafe('addresses');

  if (!addressesTable) return new Map();

  const addressColumn = pickColumn(addressesTable, ['address', 'wallet_address', 'hash']);
  const labelColumn = pickColumn(addressesTable, ['label', 'name']);
  const entityIdColumn = pickColumn(addressesTable, ['entity_id']);
  const entityNameColumn = pickColumn(addressesTable, ['entity_name', 'entity']);

  if (!addressColumn) return new Map();

  const entitiesTable = await describeTableSafe('entities');
  const canJoinEntities = Boolean(entityIdColumn && entitiesTable?.id);
  const entityNameSelect = canJoinEntities
    ? 'e.name AS entity_name'
    : entityNameColumn
      ? `a.${entityNameColumn} AS entity_name`
      : 'NULL AS entity_name';

  const entityTypeSelect = canJoinEntities && entitiesTable?.type
    ? 'e.type AS entity_type'
    : 'NULL AS entity_type';

  const labelSelect = labelColumn ? `a.${labelColumn} AS label` : 'NULL AS label';

  const rows = await sequelize.query(
    `
      SELECT
        LOWER(a.${addressColumn}) AS address,
        ${labelSelect},
        ${entityNameSelect},
        ${entityTypeSelect}
      FROM addresses a
      ${canJoinEntities ? 'LEFT JOIN entities e ON e.id = a.entity_id' : ''}
      WHERE a.${addressColumn} IS NOT NULL;
    `,
    {
      type: QueryTypes.SELECT
    }
  );

  const map = new Map();

  for (const row of rows) {
    map.set(String(row.address || '').toLowerCase(), {
      address: row.address,
      label: row.label || null,
      entityName: row.entity_name || row.label || null,
      entityType: row.entity_type || null
    });
  }

  return map;
}

async function findTransferRows({
  tokenId,
  source,
  fromDate,
  toDate,
  limit = 10000
}) {
  const tokenTransfersTable = await describeTableSafe('token_transfers');

  if (!tokenTransfersTable) {
    return {
      rows: [],
      addressMap: new Map(),
      warning: 'Table token_transfers not found. Entity/address diagnostics unavailable.'
    };
  }

  const tokenIdColumn = pickColumn(tokenTransfersTable, ['token_id']);
  const sourceColumn = pickColumn(tokenTransfersTable, ['source']);
  const fromAddressColumn = pickColumn(tokenTransfersTable, ['from_address_raw', 'from_address']);
  const toAddressColumn = pickColumn(tokenTransfersTable, ['to_address_raw', 'to_address']);
  const amountUsdColumn = pickColumn(tokenTransfersTable, ['amount_usd']);
  const amountColumn = pickColumn(tokenTransfersTable, ['amount_decimal', 'amount']);
  const txHashColumn = pickColumn(tokenTransfersTable, ['tx_hash']);
  const blockNumberColumn = pickColumn(tokenTransfersTable, ['block_number']);
  const timestampColumn = pickColumn(tokenTransfersTable, ['timestamp']);
  const fromAddressIdColumn = pickColumn(tokenTransfersTable, ['from_address_id']);
  const toAddressIdColumn = pickColumn(tokenTransfersTable, ['to_address_id']);

  if (!tokenIdColumn || !fromAddressColumn || !toAddressColumn || !amountUsdColumn) {
    return {
      rows: [],
      addressMap: new Map(),
      warning: 'Table token_transfers exists, but required columns were not found. Need token_id, from_address_raw, to_address_raw, amount_usd.'
    };
  }

  const amountSelect = amountColumn
    ? `tt.${amountColumn} AS amount`
    : 'NULL AS amount';

  const txHashSelect = txHashColumn
    ? `tt.${txHashColumn} AS tx_hash`
    : 'NULL AS tx_hash';

  const blockSelect = blockNumberColumn
    ? `tt.${blockNumberColumn} AS block_number`
    : 'NULL AS block_number';

  const timestampSelect = timestampColumn
    ? `tt.${timestampColumn} AS transfer_timestamp`
    : 'NULL AS transfer_timestamp';

  const fromAddressIdSelect = fromAddressIdColumn
    ? `tt.${fromAddressIdColumn} AS from_address_id`
    : 'NULL AS from_address_id';

  const toAddressIdSelect = toAddressIdColumn
    ? `tt.${toAddressIdColumn} AS to_address_id`
    : 'NULL AS to_address_id';

  const sourceWhere = sourceColumn
    ? `AND (:source IS NULL OR tt.${sourceColumn} = :source)`
    : '';

  const dateWhere = timestampColumn
    ? `
        AND (:fromDate IS NULL OR tt.${timestampColumn}::date >= :fromDate)
        AND (:toDate IS NULL OR tt.${timestampColumn}::date <= :toDate)
      `
    : '';

  const orderBy = timestampColumn
    ? `tt.${timestampColumn} ASC`
    : blockNumberColumn
      ? `tt.${blockNumberColumn} ASC`
      : `tt.${tokenIdColumn} ASC`;

  const rows = await sequelize.query(
    `
      SELECT
        ${txHashSelect},
        ${blockSelect},
        ${timestampSelect},
        ${fromAddressIdSelect},
        ${toAddressIdSelect},
        LOWER(tt.${fromAddressColumn}) AS from_address,
        LOWER(tt.${toAddressColumn}) AS to_address,
        ${amountSelect},
        tt.${amountUsdColumn}::numeric AS amount_usd
      FROM token_transfers tt
      WHERE tt.${tokenIdColumn} = :tokenId
        ${sourceWhere}
        ${dateWhere}
        AND tt.${amountUsdColumn} IS NOT NULL
      ORDER BY ${orderBy}
      LIMIT :limit;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        tokenId,
        source: source || null,
        fromDate: fromDate || null,
        toDate: toDate || null,
        limit
      }
    }
  );

  return {
    rows,
    addressMap: await getKnownAddressMap(),
    warning: null
  };
}

module.exports = {
  findLatestDateBySymbolAndSource,
  findDailyRows,
  findTokenBySymbol,
  findTransferRows
};
