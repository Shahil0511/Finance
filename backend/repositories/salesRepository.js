"use strict";

const db = require("../db/postgres");

const ALLOWED_SORT_COLS = new Set([
  "channel_parent_order_id",
  "channel_order_id",
  "sales_channel",
  "channel_invoice_no",
  "system_order_id",
  "warehouse_name",
  "channel_invoice_time",
  "city",
  "customer_billing_pin",
  "outward_awb_no",
  "state",
  "client_sku_id_ean",
  "payment_type",
  "so_quantity",
  "dispatched_quantity",
  "mrp",
  "unit_sale_price",
  "unit_base_price",
  "unit_tax",
  "igst_rate",
  "cgst_rate",
  "sgst_rate",
  "discount",
  "shipping_charge",
  "hsn_code",
  "manifest_time",
  "handover_time",
  "brand",
  "category",
  "final_resolution",
  "order_status",
  "system_manifest_id",
  "sla_time",
  "sla_breached",
  "handover_dt",
  "channel_sub_order_id",
  "system_sub_order_id",
  "ordered_quantity",
  "split_mrp",
  "split_unit_sale_price",
  "split_remarks",
]);

/* ── Performance notes (measured against the production database) ─────────────
   - b2c_detail is a TimescaleDB hypertable partitioned by channel_invoice_time
     (1-day chunks, ~1,259 of them); sales_order_detail is partitioned by
     channel_order_date (7-day chunks). The reports filter on handover_time, so
     a predicate on the PARTITION column is required for chunk pruning —
     without it every query plans and probes all chunks (11-13s planning).
   - Invoice always precedes handover (measured max lag 21 days over Mar–Jun
     2026, n=2.0M) → a 45-day cushion below the window is a safe superset.
     Order precedes handover by max 28 days (n=2.0M) → 60-day cushion.
   - $1/$2 are pre-clamped to the business window in JS
     (utils/dateRange.businessWindow); plain parameter comparisons let the
     planner prune. The old in-SQL GREATEST/LEAST clamp defeated pruning.
   - PIN dedupes by pincode alone: the previous DISTINCT (pincode, city,
     state) kept duplicate pincodes with different city/state spellings and
     fanned the join out ~3.5x (2.4M → 8.5M rows) before every sort.
   - Rows are deduped (cnt = 1) and filtered BEFORE joining OSD/PIN, so the
     window function and joins run on the month's rows, not the fanned set. */

const B2C_CTES = `
WITH OSD AS (
  SELECT DISTINCT ON (channel_parent_order_id, client_sku_id_ean)
    channel_parent_order_id AS parent_id,
    client_sku_id_ean       AS sku_id,
    category,
    order_resolution        AS final_resolution
  FROM sales_order_detail
  WHERE handover_time >= $1::date
    AND handover_time <  $2::date
    AND channel_order_date >= $1::date - INTERVAL '60 days'
    AND channel_order_date <  $2::date
  ORDER BY channel_parent_order_id, client_sku_id_ean
),
PIN AS (
  SELECT DISTINCT ON (pincode) pincode, city, state
  FROM pincodes
  ORDER BY pincode
),
b2c_win AS (
  SELECT b2c.*,
         ROW_NUMBER() OVER (
           PARTITION BY b2c.system_invoice_line_item_id
           ORDER BY b2c.system_invoice_line_item_id
         ) AS cnt
  FROM b2c_detail AS b2c
  WHERE b2c.handover_time >= $1::date
    AND b2c.handover_time <  $2::date
    AND b2c.channel_invoice_time >= $1::date - INTERVAL '45 days'
    AND b2c.channel_invoice_time <  $2::date
),
filtered AS (
  SELECT * FROM b2c_win
  WHERE cnt = 1
    AND ($3::text  IS NULL OR sales_channel  = $3)
    AND ($5::text  IS NULL OR order_status   = $5)
    AND ($6::text  IS NULL OR warehouse_name = $6)
    AND ($7::text  IS NULL OR payment_type   = $7)
    AND ($8::text  IS NULL OR
         channel_order_id::text ILIKE $8 OR
         client_sku_id_ean      ILIKE $8 OR
         brand                  ILIKE $8)
    AND ($10::text IS NULL OR brand          = $10)
)
`;

/* Same output shape as the original query (EXPORT_COLS relies on it). */
const SALES_PROJECTION = `
    b2c.channel_parent_order_id,
    b2c.channel_order_id,
    b2c.sales_channel,
    b2c.channel_invoice_no,
    b2c.system_order_id,
    b2c.warehouse_name,
    b2c.channel_invoice_time,
    pin.city,
    b2c.customer_billing_pin,
    b2c.outward_awb_no,
    pin.state,
    ''      AS type,
    b2c.client_sku_id_ean,
    b2c.warehouse_name            AS wh_name,
    b2c.payment_type,
    b2c.so_quantity,
    b2c.dispatched_quantity,
    b2c.mrp,
    b2c.unit_sale_price,
    b2c.system_invoice_line_item_id,
    ''      AS exempted,
    b2c.unit_base_price,
    b2c.unit_tax,
    b2c.igst_rate,
    b2c.cgst_rate,
    b2c.sgst_rate,
    b2c.discount,
    b2c.shipping_charge,
    b2c.hsn_code,
    b2c.manifest_time,
    b2c.handover_time,
    b2c.brand,
    osd.category,
    osd.final_resolution,
    b2c.order_status,
    b2c.system_manifest_id,
    b2c.sla_time,
    b2c.sla_breached,
    b2c.cnt
`;

/* OSD/PIN are joined AFTER dedup+filter; $4 (category) and $9 (state) live
   here because they filter on joined columns. */
const SALES_FROM = `
  FROM filtered AS b2c
  LEFT JOIN OSD AS osd
         ON  b2c.channel_parent_order_id = osd.parent_id
         AND b2c.client_sku_id_ean       = osd.sku_id
  LEFT JOIN PIN AS pin
         ON  b2c.customer_billing_pin    = pin.pincode
  WHERE ($4::text IS NULL OR osd.category = $4)
    AND ($9::text IS NULL OR pin.state    = $9)
`;

const EXPORT_COLS = [
  ["channel_parent_order_id", "channel_parent_order_id"],
  ["channel_order_id", "channel_order_id"],
  ["sales_channel", "sales_channel"],
  ["channel_invoice_no", "channel_invoice_no"],
  ["system_order_id", "system_order_id"],
  ["warehouse_name", "warehouse_name"],
  ["channel_invoice_time", "channel_invoice_time"],
  ["city", "city"],
  ["customer_billing_pin", "customer_billing_pin"],
  ["outward_awb_no", "outward_awb_no"],
  ["state", "state"],
  ["type", "type"],
  ["client_sku_id_ean", "client_sku_id_ean"],
  ["wh_name", "wh_name"],
  ["payment_type", "payment_type"],
  ["so_quantity", "so_quantity"],
  ["dispatched_quantity", "dispatched_quantity"],
  ["mrp", "mrp"],
  ["unit_sale_price", "unit_sale_price"],
  ["system_invoice_line_item_id", "system_invoice_line_item_id"],
  ["exempted", "exempted"],
  ["unit_base_price", "unit_base_price"],
  ["unit_tax", "unit_tax"],
  ["igst_rate", "igst_rate"],
  ["cgst_rate", "cgst_rate"],
  ["sgst_rate", "sgst_rate"],
  ["discount", "discount"],
  ["shipping_charge", "shipping_charge"],
  ["hsn_code", "hsn_code"],
  ["manifest_time", "manifest_time"],
  ["handover_time", "handover_time"],
  ["brand", "brand"],
  ["category", "category"],
  ["final_resolution", "final_resolution"],
  ["order_status", "order_status"],
  ["system_manifest_id", "system_manifest_id"],
  ["sla_time", "sla_time"],
  ["sla_breached", "sla_breached"],
  ["cnt", "cnt"],
];

const TATA_CLIQ_QUERY = `
WITH osd AS (
    SELECT
        channel_parent_order_id AS parent_id,
        channel_order_id AS od_id,
        client_sku_id_ean AS sku_id,
        category,
        order_resolution AS final_resolution,
        handover_time
    FROM sales_order_detail
    WHERE sales_channel = 'TATACLIQ_ZIVORE'
      AND handover_time >= $1::date
      AND handover_time <  $2::date
      AND channel_order_date >= $1::date - INTERVAL '60 days'
      AND channel_order_date <  $2::date
),

pin AS (
    SELECT DISTINCT ON (pincode) pincode, city, state
    FROM pincodes
    ORDER BY pincode
),

b2c_win AS (
    SELECT b2c.*,
           ROW_NUMBER() OVER (
               PARTITION BY b2c.system_invoice_line_item_id
               ORDER BY b2c.system_invoice_line_item_id
           ) AS cnt
    FROM b2c_detail AS b2c
    WHERE b2c.sales_channel = 'TATACLIQ_ZIVORE'
      AND b2c.handover_time >= $1::date
      AND b2c.handover_time <  $2::date
      AND b2c.channel_invoice_time >= $1::date - INTERVAL '45 days'
      AND b2c.channel_invoice_time <  $2::date
),

final AS (
    SELECT * FROM b2c_win WHERE cnt = 1
),

sp1 AS (
    SELECT
        channel_sub_order_id,
        channel_order_id,
        channel_parent_order_id,
        client_sku_id,
        system_sub_order_id,
        ordered_quantity,
        mrp,
        unit_sale_price,
        uni,
        unis,
        CASE
            WHEN unis > 1
            THEN 'DUPLICATE_DUE_TO_AVAILABLE_MULTIPLE_CHANNEL_SUB_ORDER_ID'
            ELSE 'Ok'
        END AS split_remarks
    FROM (
        SELECT
            channel_sub_order_id,
            channel_order_id,
            channel_parent_order_id,
            client_sku_id,
            system_sub_order_id,
            ordered_quantity,
            mrp,
            unit_sale_price,
            ROW_NUMBER() OVER (
                PARTITION BY channel_sub_order_id
                ORDER BY channel_sub_order_id
            ) AS uni,
            ROW_NUMBER() OVER (
                PARTITION BY channel_parent_order_id, client_sku_id
                ORDER BY channel_parent_order_id, client_sku_id
            ) AS unis
        FROM b2c_non_split
        WHERE sales_channel = 'TATACLIQ_ZIVORE'
          AND handover_time >= $1::date
          AND handover_time <  $2::date
    ) x
)

SELECT
    final.handover_time::date AS handover_dt,
    final.channel_parent_order_id,
    final.channel_order_id,
    final.sales_channel,
    final.channel_invoice_no,
    final.system_order_id,
    final.warehouse_name,
    final.channel_invoice_time,
    pin.city,
    final.customer_billing_pin,
    final.outward_awb_no,
    pin.state,
    NULL::varchar(5) AS "type",
    final.client_sku_id_ean,
    final.warehouse_name AS wh_name,
    final.payment_type,
    final.so_quantity,
    final.dispatched_quantity,
    final.mrp,
    final.unit_sale_price,
    final.system_invoice_line_item_id,
    NULL::varchar(5) AS exempted,
    final.unit_base_price,
    final.unit_tax,
    final.igst_rate,
    final.cgst_rate,
    final.sgst_rate,
    final.discount,
    final.shipping_charge,
    final.hsn_code,
    final.manifest_time,
    final.handover_time,
    final.brand,
    osd.category,
    osd.final_resolution,
    final.order_status,
    final.system_manifest_id,
    final.sla_time,
    final.sla_breached,
    final.cnt,
    sp1.channel_sub_order_id,
    sp1.system_sub_order_id,
    sp1.ordered_quantity,
    sp1.mrp AS split_mrp,
    sp1.unit_sale_price AS split_unit_sale_price,
    sp1.uni,
    sp1.unis,
    sp1.split_remarks
FROM final
LEFT JOIN osd
    ON final.channel_parent_order_id = osd.parent_id
   AND final.client_sku_id_ean = osd.sku_id
LEFT JOIN pin
    ON final.customer_billing_pin = pin.pincode
LEFT JOIN sp1
    ON final.channel_parent_order_id = sp1.channel_parent_order_id
   AND final.client_sku_id_ean = sp1.client_sku_id
`;

const TATA_CLIQ_WHERE = `
  WHERE ($3::text IS NULL OR order_status = $3)
    AND ($4::text IS NULL OR warehouse_name = $4)
    AND ($5::text IS NULL OR payment_type = $5)
    AND ($6::text IS NULL OR state = $6)
    AND ($7::text IS NULL OR brand = $7)
    AND ($8::text IS NULL OR
         channel_order_id::text ILIKE $8 OR
         channel_parent_order_id::text ILIKE $8 OR
         client_sku_id_ean ILIKE $8 OR
         brand ILIKE $8 OR
         channel_sub_order_id::text ILIKE $8)
`;

const TATA_CLIQ_EXPORT_COLS = [
  ["handover_dt", "handover_dt"],
  ...EXPORT_COLS,
  ["channel_sub_order_id", "channel_sub_order_id"],
  ["system_sub_order_id", "system_sub_order_id"],
  ["ordered_quantity", "ordered_quantity"],
  ["split_mrp", "split_mrp"],
  ["split_unit_sale_price", "split_unit_sale_price"],
  ["uni", "uni"],
  ["unis", "unis"],
  ["split_remarks", "split_remarks"],
];

async function list(params, { sortBy, sortDir, pageLimit, offset, signal }) {
  const sql = `
    ${B2C_CTES}
    SELECT ${SALES_PROJECTION}
    ${SALES_FROM}
    ORDER BY ${sortBy} ${sortDir}
    LIMIT $11 OFFSET $12
  `;
  return db.query(sql, [...params, pageLimit, offset], signal);
}

async function summary(params, signal) {
  const sql = `
    ${B2C_CTES}
    SELECT
      COUNT(DISTINCT b2c.channel_parent_order_id)                             AS total_orders,
      COALESCE(SUM(b2c.dispatched_quantity), 0)                               AS total_dispatched,
      COALESCE(SUM(b2c.unit_sale_price::numeric * b2c.dispatched_quantity), 0) AS total_sale_value,
      COALESCE(SUM(b2c.unit_tax::numeric * b2c.dispatched_quantity), 0)       AS total_tax,
      SUM(CASE WHEN b2c.sla_breached::text IN ('1','true','t','Y','yes','YES')
          THEN 1 ELSE 0 END)                                                   AS sla_breached_count
    ${SALES_FROM}
  `;
  return db.query(sql, params, signal);
}

/* Filter options are scoped to the business window ($1/$2): the previous
   whole-table DISTINCTs scanned every hypertable chunk (~10s planning each,
   full-table execution). Window + pruning makes them a month-sized scan, and
   the dropdowns only offer values that can actually match the report. */
async function filters(params, signal) {
  const b2cDistinct = (col) => `
    SELECT DISTINCT ${col} AS val FROM b2c_detail
    WHERE handover_time >= $1::date AND handover_time < $2::date
      AND channel_invoice_time >= $1::date - INTERVAL '45 days'
      AND channel_invoice_time <  $2::date
      AND ${col} IS NOT NULL
    ORDER BY 1`;

  const [channels, categories, statuses, warehouses, payments, states, brands] =
    await Promise.all([
      db.query(b2cDistinct("sales_channel"), params, signal),
      db.query(
        `SELECT DISTINCT category AS val FROM sales_order_detail
         WHERE handover_time >= $1::date AND handover_time < $2::date
           AND channel_order_date >= $1::date - INTERVAL '60 days'
           AND channel_order_date <  $2::date
           AND category IS NOT NULL
         ORDER BY 1`,
        params,
        signal,
      ),
      db.query(b2cDistinct("order_status"), params, signal),
      db.query(b2cDistinct("warehouse_name"), params, signal),
      db.query(b2cDistinct("payment_type"), params, signal),
      db.query(
        "SELECT DISTINCT state AS val FROM pincodes WHERE state IS NOT NULL ORDER BY 1",
        [],
        signal,
      ),
      db.query(b2cDistinct("brand"), params, signal),
    ]);

  return {
    salesChannels: channels.map((r) => r.val),
    categories: categories.map((r) => r.val),
    orderStatuses: statuses.map((r) => r.val),
    warehouses: warehouses.map((r) => r.val),
    paymentTypes: payments.map((r) => r.val),
    states: states.map((r) => r.val),
    brands: brands.map((r) => r.val),
  };
}

async function exportStream(params, signal) {
  const sql = `
    ${B2C_CTES}
    SELECT ${SALES_PROJECTION}
    ${SALES_FROM}
    ORDER BY handover_time DESC
  `;
  return db.queryStream(sql, params, signal);
}

/* Chart aggregates for the dashboard. GROUPING SETS computes the daily trend
   and the channel/brand/payment/state breakdowns in ONE windowed scan instead
   of five separate queries — same pruned CTEs and the same filter params as
   summary(), so charts respond to the user's filters at summary cost.
   gmask identifies the set: GROUPING(day, channel, brand, payment, state,
   category) → day=31, channel=47, brand=55, payment=59, state=61, category=62. */
async function analytics(params, signal) {
  const sql = `
    ${B2C_CTES}
    SELECT
      GROUPING(b2c.handover_time::date, b2c.sales_channel, b2c.brand,
               b2c.payment_type, pin.state, osd.category)                      AS gmask,
      b2c.handover_time::date                                                  AS day,
      b2c.sales_channel,
      b2c.brand,
      b2c.payment_type,
      pin.state,
      osd.category,
      COUNT(DISTINCT b2c.channel_parent_order_id)                              AS orders,
      COALESCE(SUM(b2c.dispatched_quantity), 0)                                AS units,
      COALESCE(SUM(b2c.unit_sale_price::numeric * b2c.dispatched_quantity), 0) AS revenue,
      SUM(CASE WHEN b2c.sla_breached::text IN ('1','true','t','Y','yes','YES')
          THEN 1 ELSE 0 END)                                                    AS sla_breached
    ${SALES_FROM}
    GROUP BY GROUPING SETS (
      (b2c.handover_time::date),
      (b2c.sales_channel),
      (b2c.brand),
      (b2c.payment_type),
      (pin.state),
      (osd.category)
    )
    ORDER BY gmask, day
  `;
  return db.query(sql, params, signal);
}

async function tataCliqList(params, { sortBy, sortDir, pageLimit, offset, signal }) {
  const sql = `
    SELECT * FROM (${TATA_CLIQ_QUERY}) t1
    ${TATA_CLIQ_WHERE}
    ORDER BY ${sortBy} ${sortDir}
    LIMIT $9 OFFSET $10
  `;
  return db.query(sql, [...params, pageLimit, offset], signal);
}

async function tataCliqSummary(params, signal) {
  const sql = `
    SELECT
      COUNT(*) AS total_orders,
      COALESCE(SUM(dispatched_quantity), 0) AS total_dispatched,
      COALESCE(SUM(unit_sale_price::numeric * dispatched_quantity), 0) AS total_sale_value,
      COALESCE(SUM(unit_tax::numeric * dispatched_quantity), 0) AS total_tax,
      SUM(CASE WHEN sla_breached::text IN ('1','true','t','Y','yes','YES')
          THEN 1 ELSE 0 END) AS sla_breached_count
    FROM (${TATA_CLIQ_QUERY}) t1
    ${TATA_CLIQ_WHERE}
  `;
  return db.query(sql, params, signal);
}

async function tataCliqFilters(params, signal) {
  const tataDistinct = (col) => `
    SELECT DISTINCT ${col} AS val FROM b2c_detail
    WHERE sales_channel = 'TATACLIQ_ZIVORE'
      AND handover_time >= $1::date AND handover_time < $2::date
      AND channel_invoice_time >= $1::date - INTERVAL '45 days'
      AND channel_invoice_time <  $2::date
      AND ${col} IS NOT NULL
    ORDER BY 1`;

  const [statuses, warehouses, payments, states, brands] = await Promise.all([
    db.query(tataDistinct("order_status"), params, signal),
    db.query(tataDistinct("warehouse_name"), params, signal),
    db.query(tataDistinct("payment_type"), params, signal),
    db.query(
      `SELECT DISTINCT pin.state AS val
       FROM b2c_detail b2c
       LEFT JOIN pincodes pin ON b2c.customer_billing_pin = pin.pincode
       WHERE b2c.sales_channel = 'TATACLIQ_ZIVORE'
         AND b2c.handover_time >= $1::date AND b2c.handover_time < $2::date
         AND b2c.channel_invoice_time >= $1::date - INTERVAL '45 days'
         AND b2c.channel_invoice_time <  $2::date
         AND pin.state IS NOT NULL
       ORDER BY 1`,
      params,
      signal,
    ),
    db.query(tataDistinct("brand"), params, signal),
  ]);

  return {
    orderStatuses: statuses.map((r) => r.val),
    warehouses: warehouses.map((r) => r.val),
    paymentTypes: payments.map((r) => r.val),
    states: states.map((r) => r.val),
    brands: brands.map((r) => r.val),
  };
}

async function tataCliqExportStream(params, signal) {
  const sql = `
    SELECT * FROM (${TATA_CLIQ_QUERY}) t1
    ${TATA_CLIQ_WHERE}
    ORDER BY handover_time DESC
  `;
  return db.queryStream(sql, params, signal);
}

async function dataStatus(signal) {
  const sql = `
    SELECT MAX(handover_time) AS last_data_at
    FROM b2c_detail
    WHERE channel_invoice_time >= CURRENT_DATE - INTERVAL '90 days'
  `;
  return db.query(sql, [], signal);
}

module.exports = {
  ALLOWED_SORT_COLS,
  EXPORT_COLS,
  TATA_CLIQ_EXPORT_COLS,
  dataStatus,
  list,
  summary,
  analytics,
  filters,
  exportStream,
  tataCliqList,
  tataCliqSummary,
  tataCliqFilters,
  tataCliqExportStream,
};
