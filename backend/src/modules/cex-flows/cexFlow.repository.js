const { Op, QueryTypes } = require('sequelize');

const {
  Token,
  TokenTransfer,
  CexFlowDaily,
  Address,
  Entity
} = require('../../models');

async function findTokenBySymbol(symbol) {
  return Token.findOne({
    where: {
      symbol: symbol.toUpperCase(),
      is_active: true
    }
  });
}

function buildTransferWhere({
  tokenId,
  fromDate,
  toDate,
  source
}) {
  const where = {
    token_id: tokenId
  };

  if (source) {
    where.source = source;
  }

  if (fromDate || toDate) {
    where.timestamp = {};

    if (fromDate) {
      where.timestamp[Op.gte] = new Date(`${fromDate}T00:00:00.000Z`);
    }

    if (toDate) {
      where.timestamp[Op.lte] = new Date(`${toDate}T23:59:59.999Z`);
    }
  }

  return where;
}

async function findTransfersForCexFlow({
  tokenId,
  fromDate,
  toDate,
  source
}) {
  return TokenTransfer.findAll({
    where: buildTransferWhere({
      tokenId,
      fromDate,
      toDate,
      source
    }),
    include: [
      {
        model: Address,
        as: 'fromAddress',
        required: false,
        include: [
          {
            model: Entity,
            as: 'entity',
            required: false
          }
        ]
      },
      {
        model: Address,
        as: 'toAddress',
        required: false,
        include: [
          {
            model: Entity,
            as: 'entity',
            required: false
          }
        ]
      }
    ],
    order: [
      ['timestamp', 'ASC'],
      ['id', 'ASC']
    ]
  });
}

async function deleteDailyFlowsBySource({
  tokenId,
  source
}) {
  return CexFlowDaily.destroy({
    where: {
      token_id: tokenId,
      source
    }
  });
}

async function insertDailyFlow(row) {
  return CexFlowDaily.sequelize.query(
    `
      INSERT INTO cex_flow_daily (
        token_id,
        date,
        cex_inflow,
        cex_outflow,
        cex_netflow,
        cex_inflow_usd,
        cex_outflow_usd,
        cex_netflow_usd,
        inflow_tx_count,
        outflow_tx_count,
        large_inflow_count,
        large_outflow_count,
        large_inflow_usd,
        large_outflow_usd,
        large_netflow_usd,
        large_transfer_threshold_usd,
        source,
        data_mode,
        created_at,
        updated_at
      )
      VALUES (
        :tokenId,
        :date,
        :cexInflow,
        :cexOutflow,
        :cexNetflow,
        :cexInflowUsd,
        :cexOutflowUsd,
        :cexNetflowUsd,
        :inflowTxCount,
        :outflowTxCount,
        :largeInflowCount,
        :largeOutflowCount,
        :largeInflowUsd,
        :largeOutflowUsd,
        :largeNetflowUsd,
        :largeTransferThresholdUsd,
        :source,
        :dataMode,
        NOW(),
        NOW()
      );
    `,
    {
      type: QueryTypes.INSERT,
      replacements: {
        tokenId: row.token_id,
        date: row.date,
        cexInflow: row.cex_inflow,
        cexOutflow: row.cex_outflow,
        cexNetflow: row.cex_netflow,
        cexInflowUsd: row.cex_inflow_usd,
        cexOutflowUsd: row.cex_outflow_usd,
        cexNetflowUsd: row.cex_netflow_usd,
        inflowTxCount: row.inflow_tx_count,
        outflowTxCount: row.outflow_tx_count,
        largeInflowCount: row.large_inflow_count,
        largeOutflowCount: row.large_outflow_count,
        largeInflowUsd: row.large_inflow_usd,
        largeOutflowUsd: row.large_outflow_usd,
        largeNetflowUsd: row.large_netflow_usd,
        largeTransferThresholdUsd: row.large_transfer_threshold_usd,
        source: row.source,
        dataMode: row.data_mode
      }
    }
  );
}

async function bulkCreateDailyFlows(rows = []) {
  if (!rows.length) return [];

  const inserted = [];

  for (const row of rows) {
    const result = await insertDailyFlow(row);
    inserted.push(result);
  }

  return inserted;
}

function buildDailyFlowSqlWhere({
  tokenId,
  source
}) {
  const clauses = ['cfd.token_id = :tokenId'];

  if (source) {
    clauses.push('cfd.source = :source');
  }

  return clauses.join(' AND ');
}

async function findDailyFlows({
  tokenId,
  source,
  limit = 30,
  offset = 0
}) {
  const whereSql = buildDailyFlowSqlWhere({
    tokenId,
    source
  });

  const replacements = {
    tokenId,
    source,
    limit,
    offset
  };

  const rows = await CexFlowDaily.sequelize.query(
    `
      SELECT
        cfd.id,
        cfd.token_id,
        cfd.date,
        cfd.cex_inflow,
        cfd.cex_outflow,
        cfd.cex_netflow,
        cfd.cex_inflow_usd,
        cfd.cex_outflow_usd,
        cfd.cex_netflow_usd,
        cfd.inflow_tx_count,
        cfd.outflow_tx_count,
        cfd.large_inflow_count,
        cfd.large_outflow_count,
        COALESCE(cfd.large_inflow_usd, 0) AS large_inflow_usd,
        COALESCE(cfd.large_outflow_usd, 0) AS large_outflow_usd,
        COALESCE(cfd.large_netflow_usd, 0) AS large_netflow_usd,
        COALESCE(cfd.large_transfer_threshold_usd, 0) AS large_transfer_threshold_usd,
        cfd.source,
        cfd.data_mode,
        t.id AS token_ref_id,
        t.symbol AS token_symbol,
        t.name AS token_name
      FROM cex_flow_daily cfd
      LEFT JOIN tokens t ON t.id = cfd.token_id
      WHERE ${whereSql}
      ORDER BY cfd.date DESC, cfd.id DESC
      LIMIT :limit
      OFFSET :offset;
    `,
    {
      type: QueryTypes.SELECT,
      replacements
    }
  );

  const countRows = await CexFlowDaily.sequelize.query(
    `
      SELECT COUNT(*)::integer AS total
      FROM cex_flow_daily cfd
      WHERE ${whereSql};
    `,
    {
      type: QueryTypes.SELECT,
      replacements
    }
  );

  return {
    rows: rows.map((row) => ({
      ...row,
      token: row.token_ref_id
        ? {
            id: row.token_ref_id,
            symbol: row.token_symbol,
            name: row.token_name
          }
        : null
    })),
    total: countRows[0]?.total || 0
  };
}

module.exports = {
  findTokenBySymbol,
  findTransfersForCexFlow,
  deleteDailyFlowsBySource,
  bulkCreateDailyFlows,
  findDailyFlows
};
