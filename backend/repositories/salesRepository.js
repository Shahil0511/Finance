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

const B2C_CTES = `
WITH date_params AS (
  SELECT
    (CURRENT_DATE + INTERVAL '1 day')::date AS last_date,
    CASE
      WHEN EXTRACT(DAY FROM CURRENT_DATE) <= 2
      THEN DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date
      ELSE DATE_TRUNC('month', CURRENT_DATE)::date
    END AS min_date
),
OD AS (
  SELECT
    sod.channel_parent_order_id,
    sod.client_sku_id_ean,
    sod.category,
    sod.order_resolution
  FROM sales_order_detail AS sod
  CROSS JOIN date_params
  WHERE sod.handover_time >= GREATEST($1::date, date_params.min_date)
    AND sod.handover_time <  LEAST($2::date, date_params.last_date)
),
OSD AS (
  SELECT DISTINCT ON (channel_parent_order_id, client_sku_id_ean)
    channel_parent_order_id AS parent_id,
    client_sku_id_ean       AS sku_id,
    category,
    order_resolution        AS final_resolution
  FROM OD
  ORDER BY channel_parent_order_id, client_sku_id_ean
),
PIN AS (
  SELECT DISTINCT pincode, city, state FROM pincodes
),
base AS (
  SELECT
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
    ROW_NUMBER() OVER (
      PARTITION BY b2c.system_invoice_line_item_id
      ORDER BY b2c.system_invoice_line_item_id
    ) AS cnt
  FROM b2c_detail AS b2c
  CROSS JOIN date_params
  LEFT JOIN OSD
         ON  b2c.channel_parent_order_id = osd.parent_id
         AND b2c.client_sku_id_ean       = osd.sku_id
  LEFT JOIN PIN
         ON  b2c.customer_billing_pin    = pin.pincode
  WHERE b2c.handover_time >= GREATEST($1::date, date_params.min_date)
    AND b2c.handover_time <  LEAST($2::date, date_params.last_date)
)
`;

const OUTER_WHERE = `
  WHERE cnt = 1
    AND ($3::text  IS NULL OR sales_channel  = $3)
    AND ($4::text  IS NULL OR category       = $4)
    AND ($5::text  IS NULL OR order_status   = $5)
    AND ($6::text  IS NULL OR warehouse_name = $6)
    AND ($7::text  IS NULL OR payment_type   = $7)
    AND ($8::text  IS NULL OR
         channel_order_id::text ILIKE $8 OR
         client_sku_id_ean      ILIKE $8 OR
         brand                  ILIKE $8)
    AND ($9::text  IS NULL OR state          = $9)
    AND ($10::text IS NULL OR brand          = $10)
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
WITH date_params AS (
    SELECT
        CASE
            WHEN EXTRACT(DAY FROM CURRENT_DATE) <= 2
            THEN DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date
            ELSE DATE_TRUNC('month', CURRENT_DATE)::date
        END AS date_from,
        (CURRENT_DATE + INTERVAL '1 day')::date AS date_to
),

osd AS (
    SELECT
        channel_parent_order_id AS parent_id,
        channel_order_id AS od_id,
        client_sku_id_ean AS sku_id,
        category,
        order_resolution AS final_resolution,
        handover_time
    FROM sales_order_detail
    CROSS JOIN date_params dp
    WHERE sales_channel = 'TATACLIQ_ZIVORE'
      AND handover_time >= GREATEST($1::date, dp.date_from)
      AND handover_time < LEAST($2::date, dp.date_to)
),

pin AS (
    SELECT DISTINCT
        pincode,
        city,
        state
    FROM pincodes
),

base AS (
    SELECT
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
        NULL::varchar(5) AS "type",
        b2c.client_sku_id_ean,
        b2c.warehouse_name AS wh_name,
        b2c.payment_type,
        b2c.so_quantity,
        b2c.dispatched_quantity,
        b2c.mrp,
        b2c.unit_sale_price,
        b2c.system_invoice_line_item_id,
        NULL::varchar(5) AS exempted,
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
        ROW_NUMBER() OVER (
            PARTITION BY b2c.system_invoice_line_item_id
            ORDER BY b2c.system_invoice_line_item_id
        ) AS cnt
    FROM b2c_detail AS b2c
    CROSS JOIN date_params dp
    LEFT JOIN osd
        ON b2c.channel_parent_order_id = osd.parent_id
       AND b2c.client_sku_id_ean = osd.sku_id
    LEFT JOIN pin
        ON b2c.customer_billing_pin = pin.pincode
    WHERE b2c.sales_channel = 'TATACLIQ_ZIVORE'
      AND b2c.handover_time >= GREATEST($1::date, dp.date_from)
      AND b2c.handover_time < LEAST($2::date, dp.date_to)
),

final AS (
    SELECT *
    FROM base
    WHERE cnt = 1
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
        CROSS JOIN date_params dp
        WHERE sales_channel = 'TATACLIQ_ZIVORE'
          AND handover_time >= GREATEST($1::date, dp.date_from)
          AND handover_time < LEAST($2::date, dp.date_to)
    ) x
)

SELECT
    final.handover_time::date AS handover_dt,
    final.*,
    sp1.channel_sub_order_id,
    sp1.system_sub_order_id,
    sp1.ordered_quantity,
    sp1.mrp AS split_mrp,
    sp1.unit_sale_price AS split_unit_sale_price,
    sp1.uni,
    sp1.unis,
    sp1.split_remarks
FROM final
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
    SELECT * FROM base
    ${OUTER_WHERE}
    ORDER BY ${sortBy} ${sortDir}
    LIMIT $11 OFFSET $12
  `;
  return db.query(sql, [...params, pageLimit, offset], signal);
}

async function summary(params, signal) {
  const sql = `
    ${B2C_CTES}
    SELECT
      COUNT(DISTINCT channel_parent_order_id)                             AS total_orders,
      COALESCE(SUM(dispatched_quantity), 0)                              AS total_dispatched,
      COALESCE(SUM(unit_sale_price::numeric * dispatched_quantity), 0)    AS total_sale_value,
      COALESCE(SUM(unit_tax::numeric * dispatched_quantity), 0)           AS total_tax,
      SUM(CASE WHEN sla_breached::text IN ('1','true','t','Y','yes','YES')
          THEN 1 ELSE 0 END)                                              AS sla_breached_count
    FROM base
    ${OUTER_WHERE}
  `;
  return db.query(sql, params, signal);
}

async function filters(signal) {
  const [
    channels,
    categories,
    statuses,
    warehouses,
    payments,
    states,
    brands,
  ] = await Promise.all([
    db.query(
      "SELECT DISTINCT sales_channel AS val FROM b2c_detail WHERE sales_channel IS NOT NULL ORDER BY 1",
      [],
      signal,
    ),
    db.query(
      "SELECT DISTINCT category AS val FROM sales_order_detail WHERE category IS NOT NULL ORDER BY 1",
      [],
      signal,
    ),
    db.query(
      "SELECT DISTINCT order_status AS val FROM b2c_detail WHERE order_status IS NOT NULL ORDER BY 1",
      [],
      signal,
    ),
    db.query(
      "SELECT DISTINCT warehouse_name AS val FROM b2c_detail WHERE warehouse_name IS NOT NULL ORDER BY 1",
      [],
      signal,
    ),
    db.query(
      "SELECT DISTINCT payment_type AS val FROM b2c_detail WHERE payment_type IS NOT NULL ORDER BY 1",
      [],
      signal,
    ),
    db.query(
      "SELECT DISTINCT state AS val FROM pincodes WHERE state IS NOT NULL ORDER BY 1",
      [],
      signal,
    ),
    db.query(
      "SELECT DISTINCT brand AS val FROM b2c_detail WHERE brand IS NOT NULL ORDER BY 1",
      [],
      signal,
    ),
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
    SELECT * FROM base
    ${OUTER_WHERE}
    ORDER BY handover_time DESC
  `;
  return db.queryStream(sql, params, signal);
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

async function tataCliqFilters(signal) {
  const [statuses, warehouses, payments, states, brands] = await Promise.all([
    db.query(
      "SELECT DISTINCT order_status AS val FROM b2c_detail WHERE sales_channel = 'TATACLIQ_ZIVORE' AND order_status IS NOT NULL ORDER BY 1",
      [],
      signal,
    ),
    db.query(
      "SELECT DISTINCT warehouse_name AS val FROM b2c_detail WHERE sales_channel = 'TATACLIQ_ZIVORE' AND warehouse_name IS NOT NULL ORDER BY 1",
      [],
      signal,
    ),
    db.query(
      "SELECT DISTINCT payment_type AS val FROM b2c_detail WHERE sales_channel = 'TATACLIQ_ZIVORE' AND payment_type IS NOT NULL ORDER BY 1",
      [],
      signal,
    ),
    db.query(
      "SELECT DISTINCT pin.state AS val FROM b2c_detail b2c LEFT JOIN pincodes pin ON b2c.customer_billing_pin = pin.pincode WHERE b2c.sales_channel = 'TATACLIQ_ZIVORE' AND pin.state IS NOT NULL ORDER BY 1",
      [],
      signal,
    ),
    db.query(
      "SELECT DISTINCT brand AS val FROM b2c_detail WHERE sales_channel = 'TATACLIQ_ZIVORE' AND brand IS NOT NULL ORDER BY 1",
      [],
      signal,
    ),
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

module.exports = {
  ALLOWED_SORT_COLS,
  EXPORT_COLS,
  TATA_CLIQ_EXPORT_COLS,
  list,
  summary,
  filters,
  exportStream,
  tataCliqList,
  tataCliqSummary,
  tataCliqFilters,
  tataCliqExportStream,
};
