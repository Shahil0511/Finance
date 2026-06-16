"use strict";

const db = require("../db/postgres");

const ALLOWED_SORT_COLS = new Set([
  "channel_order_id",
  "channel_parent_order_id",
  "return_order_processed_time",
  "return_order_type",
  "return_order_status",
  "return_order_item_qc_status",
  "client_sku_id_ean",
  "brand",
  "sales_channel",
  "qc_reason",
  "reason_for_return",
  "inward_time",
  "return_gate_entry_time",
  "return_order_created_time",
  "channel_sub_order_id",
  "system_sub_order_id",
  "sp1_channel_sub_order_id",
  "return_order_item_id_count",
  "channel_sub_order_id_count",
]);

// RETURN_BASE_CTE removed 2026-06-12 (A1 fix): summary now reuses
// RETURN_DETAIL_BASE_CTE so it counts the same strict population as the list.

/* $1/$2 are pre-clamped to the business window in JS
   (utils/dateRange.businessWindow) — plain parameter comparisons keep the
   idx_rt_processed_time scan cheap and avoid per-row GREATEST/LEAST.
   The b2c_detail joins below carry a channel_invoice_time predicate because
   that column is the hypertable's PARTITION column: invoice happens at/after
   order creation, so the family's 2026-01-01 forward-order era bound implies
   invoice >= 2026-01-01 — and lets the planner prune ~1,100 of the ~1,259
   chunks instead of probing all of them. */
const RETURN_DETAIL_BASE_CTE = `
  WITH returns_base AS (
    SELECT
      rt_base.*,
      ROW_NUMBER() OVER (
        PARTITION BY rt_base.return_order_item_id
        ORDER BY rt_base.return_order_processed_time DESC NULLS LAST
      ) AS rw
    FROM return_order_report_item_level_wms AS rt_base
    WHERE rt_base.item_id IS NOT NULL
      AND rt_base.return_order_processed_time >= $1::date
      AND rt_base.return_order_processed_time <  $2::date
      AND rt_base.forward_order_creation_time >= DATE '2026-01-01'
  )
`;

const RETURN_QUERY = `
  ${RETURN_DETAIL_BASE_CTE},
  return_keys AS (
    SELECT DISTINCT
      channel_parent_order_id,
      channel_order_id,
      client_sku_id_ean
    FROM returns_base
    WHERE rw = 1
  ),
  osd AS (
    SELECT DISTINCT ON (
      sod.channel_parent_order_id,
      sod.channel_order_id,
      sod.client_sku_id_ean
    )
      sod.channel_parent_order_id AS parent_id,
      sod.channel_order_id AS od_id,
      sod.client_sku_id_ean AS sku_id,
      sod.order_resolution AS final_resolution
    FROM sales_order_detail AS sod
    JOIN return_keys AS rk
      ON sod.channel_parent_order_id = rk.channel_parent_order_id
     AND sod.channel_order_id = rk.channel_order_id
     AND sod.client_sku_id_ean = rk.client_sku_id_ean
    WHERE sod.channel_order_date >= DATE '2026-01-01'
    ORDER BY
      sod.channel_parent_order_id,
      sod.channel_order_id,
      sod.client_sku_id_ean,
      sod.handover_time DESC NULLS LAST
  ),
  pin AS (
    SELECT DISTINCT ON (pincode) pincode, city, state FROM pincodes ORDER BY pincode
  ),
  b2c AS (
    SELECT DISTINCT ON (sl.channel_order_id, sl.client_sku_id_ean)
      sl.warehouse_name AS wh_name,
      sl.channel_parent_order_id AS parent_order_id,
      sl.channel_order_id AS ch_order_id,
      sl.system_order_id,
      sl.order_qc_status,
      sl.channel_invoice_no,
      sl.system_invoice_no,
      sl.system_invoice_line_item_id,
      sl.channel_invoice_time,
      sl.sales_channel AS sal_channel,
      sl.client_sku_id_ean AS sku_id_ean,
      sl.mrp AS sale_mrp,
      sl.so_quantity,
      sl.dispatched_quantity,
      sl.payment_type,
      sl.unit_base_price,
      sl.unit_tax,
      sl.unit_sale_price,
      sl.total_base_price,
      sl.total_tax,
      sl.total_sale_price,
      sl.igst_rate,
      sl.cgst_rate,
      sl.sgst_rate,
      sl.shipping_charge,
      sl.discount,
      sl.hsn_code,
      sl.outward_awb_no,
      sl.transporter AS transpt,
      pin.city,
      pin.state,
      sl.customer_billing_pin,
      sl.order_status,
      sl.system_manifest_id,
      sl.channel_order_time,
      sl.system_order_time,
      sl.sla_time,
      sl.packed_time,
      sl.manifest_time,
      sl.manifested_within_24_hours,
      sl.handover_time,
      sl.sla_breached,
      sl.brand AS brands
    FROM b2c_detail AS sl
    JOIN return_keys AS rk
      ON sl.channel_order_id = rk.channel_order_id
     AND sl.client_sku_id_ean = rk.client_sku_id_ean
    LEFT JOIN pin
      ON (
        CASE
          WHEN sl.customer_billing_pin LIKE '%.0%'
          THEN LEFT(sl.customer_billing_pin, LENGTH(sl.customer_billing_pin) - 2)
          ELSE sl.customer_billing_pin
        END
      ) = pin.pincode
    WHERE sl.channel_order_time >= DATE '2026-01-01'
      AND sl.channel_invoice_time >= DATE '2026-01-01'
    ORDER BY
      sl.channel_order_id,
      sl.client_sku_id_ean,
      sl.handover_time DESC NULLS LAST
  )
  SELECT
    rt.*,
    osd.final_resolution AS final_resolutions,

    b2c.wh_name,
    b2c.parent_order_id,
    b2c.ch_order_id,
    b2c.system_order_id,
    b2c.order_qc_status,
    b2c.channel_invoice_no,
    b2c.system_invoice_no,
    b2c.system_invoice_line_item_id,
    b2c.channel_invoice_time,
    b2c.sal_channel,
    b2c.sku_id_ean,
    b2c.sale_mrp,
    b2c.so_quantity,
    b2c.dispatched_quantity,
    b2c.payment_type,
    b2c.unit_base_price,
    b2c.unit_tax,
    b2c.unit_sale_price,
    b2c.total_base_price,
    b2c.total_tax,
    b2c.total_sale_price,
    b2c.igst_rate,
    b2c.cgst_rate,
    b2c.sgst_rate,
    b2c.shipping_charge,
    b2c.discount,
    b2c.hsn_code,
    b2c.outward_awb_no,
    b2c.transpt,
    b2c.city,
    b2c.state,
    b2c.customer_billing_pin,
    b2c.order_status,
    b2c.system_manifest_id,
    b2c.channel_order_time,
    b2c.system_order_time,
    b2c.sla_time,
    b2c.packed_time,
    b2c.manifest_time,
    b2c.manifested_within_24_hours,
    b2c.handover_time,
    b2c.sla_breached,
    b2c.brands

  FROM returns_base AS rt

  LEFT JOIN osd
    ON rt.channel_parent_order_id = osd.parent_id
   AND rt.channel_order_id = osd.od_id
   AND rt.client_sku_id_ean = osd.sku_id

  LEFT JOIN b2c
    ON rt.channel_order_id = b2c.ch_order_id
   AND rt.client_sku_id_ean = b2c.sku_id_ean
`;

const RETURN_EXPORT_QUERY = `
  WITH rt AS (
    SELECT *
    FROM return_order_report_item_level_wms
    WHERE item_id IS NOT NULL
      AND return_order_processed_time >= $1::date
      AND return_order_processed_time <  $2::date
      AND forward_order_creation_time >= DATE '2026-01-01'
  ),
  osd AS (
    SELECT
      channel_parent_order_id AS parent_id,
      channel_order_id AS od_id,
      client_sku_id_ean AS sku_id,
      order_resolution AS final_resolution
    FROM sales_order_detail
    WHERE channel_order_date >= DATE '2026-01-01'
  ),
  pin AS (
    SELECT DISTINCT ON (pincode) pincode, city, state FROM pincodes ORDER BY pincode
  ),
  b2c AS (
    SELECT
      sl.warehouse_name AS wh_name,
      sl.channel_parent_order_id AS parent_order_id,
      sl.channel_order_id AS ch_order_id,
      sl.system_order_id,
      sl.order_qc_status,
      sl.channel_invoice_no,
      sl.system_invoice_no,
      sl.system_invoice_line_item_id,
      sl.channel_invoice_time,
      sl.sales_channel AS sal_channel,
      sl.client_sku_id_ean AS sku_id_ean,
      sl.mrp AS sale_mrp,
      sl.so_quantity,
      sl.dispatched_quantity,
      sl.payment_type,
      sl.unit_base_price,
      sl.unit_tax,
      sl.unit_sale_price,
      sl.total_base_price,
      sl.total_tax,
      sl.total_sale_price,
      sl.igst_rate,
      sl.cgst_rate,
      sl.sgst_rate,
      sl.shipping_charge,
      sl.discount,
      sl.hsn_code,
      sl.outward_awb_no,
      sl.transporter AS transpt,
      pin.city,
      pin.state,
      sl.customer_billing_pin,
      sl.order_status,
      sl.system_manifest_id,
      sl.channel_order_time,
      sl.system_order_time,
      sl.sla_time,
      sl.packed_time,
      sl.manifest_time,
      sl.manifested_within_24_hours,
      sl.handover_time,
      sl.sla_breached,
      sl.brand AS brands
    FROM b2c_detail AS sl
    LEFT JOIN pin
      ON sl.customer_billing_pin::text = pin.pincode::text
    WHERE sl.channel_order_time >= DATE '2026-01-01'
      AND sl.channel_invoice_time >= DATE '2026-01-01'
  ),
  joined_data AS (
    SELECT
      rt.*,
      osd.final_resolution AS final_resolutions,

      b2c.wh_name,
      b2c.parent_order_id,
      b2c.ch_order_id,
      b2c.system_order_id,
      b2c.order_qc_status,
      b2c.channel_invoice_no,
      b2c.system_invoice_no,
      b2c.system_invoice_line_item_id,
      b2c.channel_invoice_time,
      b2c.sal_channel,
      b2c.sku_id_ean,
      b2c.sale_mrp,
      b2c.so_quantity,
      b2c.dispatched_quantity,
      b2c.payment_type,
      b2c.unit_base_price,
      b2c.unit_tax,
      b2c.unit_sale_price,
      b2c.total_base_price,
      b2c.total_tax,
      b2c.total_sale_price,
      b2c.igst_rate,
      b2c.cgst_rate,
      b2c.sgst_rate,
      b2c.shipping_charge,
      b2c.discount,
      b2c.hsn_code,
      b2c.outward_awb_no,
      b2c.transpt,
      b2c.city,
      b2c.state,
      b2c.customer_billing_pin,
      b2c.order_status,
      b2c.system_manifest_id,
      b2c.channel_order_time,
      b2c.system_order_time,
      b2c.sla_time,
      b2c.packed_time,
      b2c.manifest_time,
      b2c.manifested_within_24_hours,
      b2c.handover_time,
      b2c.sla_breached,
      b2c.brands,

      ROW_NUMBER() OVER (
        PARTITION BY rt.return_order_item_id
        ORDER BY rt.return_order_processed_time DESC NULLS LAST
      ) AS rw
    FROM rt
    LEFT JOIN osd
      ON rt.channel_parent_order_id = osd.parent_id
     AND rt.client_sku_id_ean = osd.sku_id
    LEFT JOIN b2c
      ON rt.channel_order_id = b2c.ch_order_id
     AND rt.client_sku_id_ean = b2c.sku_id_ean
  )
  SELECT *
  FROM joined_data
`;

const PAST_RETURN_EXPORT_QUERY = `
  WITH rt AS (
    SELECT *
    FROM return_order_report_item_level_wms
    WHERE item_id IS NOT NULL
      AND return_order_processed_time >= $1::date
      AND return_order_processed_time <  $2::date
      AND forward_order_creation_time <= DATE '2025-12-31'
  ),
  osd AS (
    SELECT
      channel_parent_order_id AS parent_id,
      channel_order_id AS od_id,
      client_sku_id_ean AS sku_id,
      order_resolution AS final_resolution
    FROM sales_order_detail
    WHERE channel_order_date <= DATE '2025-12-31'
  ),
  pin AS (
    SELECT DISTINCT ON (pincode) pincode, city, state FROM pincodes ORDER BY pincode
  ),
  b2c AS (
    SELECT
      sl.warehouse_name AS wh_name,
      sl.channel_parent_order_id AS parent_order_id,
      sl.channel_order_id AS ch_order_id,
      sl.system_order_id,
      sl.order_qc_status,
      sl.channel_invoice_no,
      sl.system_invoice_no,
      sl.system_invoice_line_item_id,
      sl.channel_invoice_time,
      sl.sales_channel AS sal_channel,
      sl.client_sku_id_ean AS sku_id_ean,
      sl.mrp AS sale_mrp,
      sl.so_quantity,
      sl.dispatched_quantity,
      sl.payment_type,
      sl.unit_base_price,
      sl.unit_tax,
      sl.unit_sale_price,
      sl.total_base_price,
      sl.total_tax,
      sl.total_sale_price,
      sl.igst_rate,
      sl.cgst_rate,
      sl.sgst_rate,
      sl.shipping_charge,
      sl.discount,
      sl.hsn_code,
      sl.outward_awb_no,
      sl.transporter AS transpt,
      pin.city,
      pin.state,
      sl.customer_billing_pin,
      sl.order_status,
      sl.system_manifest_id,
      sl.channel_order_time,
      sl.system_order_time,
      sl.sla_time,
      sl.packed_time,
      sl.manifest_time,
      sl.manifested_within_24_hours,
      sl.handover_time,
      sl.sla_breached,
      sl.brand AS brands
    FROM b2c_detail AS sl
    LEFT JOIN pin
      ON sl.customer_billing_pin::text = pin.pincode::text
    WHERE sl.channel_order_time <= DATE '2025-12-31'
      -- invoice follows the order within ~60 days; bounds chunk pruning above
      AND sl.channel_invoice_time < DATE '2026-03-01'
  ),
  joined_data AS (
    SELECT
      rt.*,
      osd.final_resolution AS final_resolutions,

      b2c.wh_name,
      b2c.parent_order_id,
      b2c.ch_order_id,
      b2c.system_order_id,
      b2c.order_qc_status,
      b2c.channel_invoice_no,
      b2c.system_invoice_no,
      b2c.system_invoice_line_item_id,
      b2c.channel_invoice_time,
      b2c.sal_channel,
      b2c.sku_id_ean,
      b2c.sale_mrp,
      b2c.so_quantity,
      b2c.dispatched_quantity,
      b2c.payment_type,
      b2c.unit_base_price,
      b2c.unit_tax,
      b2c.unit_sale_price,
      b2c.total_base_price,
      b2c.total_tax,
      b2c.total_sale_price,
      b2c.igst_rate,
      b2c.cgst_rate,
      b2c.sgst_rate,
      b2c.shipping_charge,
      b2c.discount,
      b2c.hsn_code,
      b2c.outward_awb_no,
      b2c.transpt,
      b2c.city,
      b2c.state,
      b2c.customer_billing_pin,
      b2c.order_status,
      b2c.system_manifest_id,
      b2c.channel_order_time,
      b2c.system_order_time,
      b2c.sla_time,
      b2c.packed_time,
      b2c.manifest_time,
      b2c.manifested_within_24_hours,
      b2c.handover_time,
      b2c.sla_breached,
      b2c.brands,

      ROW_NUMBER() OVER (
        PARTITION BY rt.return_order_item_id
        ORDER BY rt.return_order_processed_time DESC NULLS LAST
      ) AS rw
    FROM rt
    LEFT JOIN osd
      ON rt.channel_parent_order_id = osd.parent_id
     AND rt.client_sku_id_ean = osd.sku_id
    LEFT JOIN b2c
      ON rt.channel_order_id = b2c.ch_order_id
     AND rt.client_sku_id_ean = b2c.sku_id_ean
  )
  SELECT *
  FROM joined_data
`;

function buildScopedReturnQuery(sourceName, sourceCteSql = "") {
  return RETURN_QUERY.replace(
    `${RETURN_DETAIL_BASE_CTE},`,
    `${RETURN_DETAIL_BASE_CTE}${sourceCteSql},`,
  )
    .replace(
      `FROM returns_base
    WHERE rw = 1`,
      `FROM ${sourceName}`,
    )
    .replace("FROM returns_base AS rt", `FROM ${sourceName} AS rt`);
}

const OUTER_WHERE = `
  WHERE rw = 1
    AND ($3::text IS NULL OR sales_channel               = $3)
    AND ($4::text IS NULL OR return_order_status         = $4)
    AND ($5::text IS NULL OR return_order_item_qc_status = $5)
    AND ($6::text IS NULL OR
         channel_order_id::text         ILIKE $6 OR
         client_sku_id_ean              ILIKE $6 OR
         brand                          ILIKE $6 OR
         return_order_item_id::text     ILIKE $6)
`;

const OMNI_RETURN_BASE_CTE = `
  WITH omni_returns_base AS (
    SELECT
      rt_base.*,
      ROW_NUMBER() OVER (
        PARTITION BY rt_base.return_order_item_id
        ORDER BY rt_base.return_order_item_id
      ) AS rw
    FROM return_order_report_item_level_wms AS rt_base
    WHERE rt_base.sales_channel = 'MYNTRA-OMNI'
      AND rt_base.item_id IS NULL
      AND rt_base.return_order_processed_time >= $1::date
      AND rt_base.return_order_processed_time <  $2::date
  )
`;

const OMNI_RETURN_QUERY = `
  ${OMNI_RETURN_BASE_CTE},
  osd AS (
    SELECT
      channel_parent_order_id AS parent_id,
      client_sku_id_ean AS sku_id,
      order_resolution AS final_resolution
    FROM sales_order_detail
    WHERE channel_order_date >= DATE '2026-01-01'
  ),
  pin AS (
    SELECT DISTINCT ON (pincode) pincode, city, state FROM pincodes ORDER BY pincode
  ),
  b2c AS (
    SELECT DISTINCT ON (sl.channel_order_id, sl.client_sku_id_ean)
      sl.warehouse_name AS wh_name,
      sl.channel_parent_order_id AS parent_order_id,
      sl.channel_order_id AS ch_order_id,
      sl.system_order_id,
      sl.order_qc_status,
      sl.channel_invoice_no,
      sl.system_invoice_no,
      sl.system_invoice_line_item_id,
      sl.channel_invoice_time,
      sl.sales_channel AS sal_channel,
      sl.client_sku_id_ean AS sku_id_ean,
      sl.mrp AS sale_mrp,
      sl.so_quantity,
      sl.dispatched_quantity,
      sl.payment_type,
      sl.unit_base_price,
      sl.unit_tax,
      sl.unit_sale_price,
      sl.total_base_price,
      sl.total_tax,
      sl.total_sale_price,
      sl.igst_rate,
      sl.cgst_rate,
      sl.sgst_rate,
      sl.shipping_charge,
      sl.discount,
      sl.hsn_code,
      sl.outward_awb_no,
      sl.transporter AS transpt,
      pin.city,
      pin.state,
      sl.customer_billing_pin,
      sl.order_status,
      sl.system_manifest_id,
      sl.channel_order_time,
      sl.system_order_time,
      sl.sla_time,
      sl.packed_time,
      sl.manifest_time,
      sl.manifested_within_24_hours,
      sl.handover_time,
      sl.sla_breached,
      sl.brand AS brands
    FROM b2c_detail AS sl
    LEFT JOIN pin
      ON (
        CASE
          WHEN sl.customer_billing_pin LIKE '%.0%'
          THEN LEFT(sl.customer_billing_pin, LENGTH(sl.customer_billing_pin) - 2)
          ELSE sl.customer_billing_pin
        END
      ) = pin.pincode
    WHERE sl.channel_invoice_time >= DATE '2026-01-01'
    ORDER BY sl.channel_order_id, sl.client_sku_id_ean, sl.handover_time DESC NULLS LAST
  )
  SELECT
    rt.*,
    osd.final_resolution AS final_resolutions,
    b2c.wh_name,
    b2c.parent_order_id,
    b2c.ch_order_id,
    b2c.system_order_id,
    b2c.order_qc_status,
    b2c.channel_invoice_no,
    b2c.system_invoice_no,
    b2c.system_invoice_line_item_id,
    b2c.channel_invoice_time,
    b2c.sal_channel,
    b2c.sku_id_ean,
    b2c.sale_mrp,
    b2c.so_quantity,
    b2c.dispatched_quantity,
    b2c.payment_type,
    b2c.unit_base_price,
    b2c.unit_tax,
    b2c.unit_sale_price,
    b2c.total_base_price,
    b2c.total_tax,
    b2c.total_sale_price,
    b2c.igst_rate,
    b2c.cgst_rate,
    b2c.sgst_rate,
    b2c.shipping_charge,
    b2c.discount,
    b2c.hsn_code,
    b2c.outward_awb_no,
    b2c.transpt,
    b2c.city,
    b2c.state,
    b2c.customer_billing_pin,
    b2c.order_status,
    b2c.system_manifest_id,
    b2c.channel_order_time,
    b2c.system_order_time,
    b2c.sla_time,
    b2c.packed_time,
    b2c.manifest_time,
    b2c.manifested_within_24_hours,
    b2c.handover_time,
    b2c.sla_breached,
    b2c.brands
  FROM omni_returns_base AS rt
  LEFT JOIN osd
    ON rt.channel_parent_order_id = osd.parent_id
   AND rt.client_sku_id_ean = osd.sku_id
  LEFT JOIN b2c
    ON rt.channel_order_id = b2c.ch_order_id
   AND rt.client_sku_id_ean = b2c.sku_id_ean
`;

const OMNI_OUTER_WHERE = `
  WHERE ($3::text IS NULL OR return_order_status = $3)
    AND ($4::text IS NULL OR return_order_item_qc_status = $4)
    AND ($5::text IS NULL OR
         channel_order_id::text ILIKE $5 OR
         client_sku_id_ean ILIKE $5 OR
         brand ILIKE $5 OR
         return_order_item_id::text ILIKE $5)
`;

const TATA_CLIQ_RETURN_QUERY = `
WITH rt AS (
    SELECT r.*
    FROM return_order_report_item_level_wms r
    WHERE r.sales_channel = 'TATACLIQ_ZIVORE'
      AND r.item_id IS NOT NULL
      AND r.return_order_processed_time >= $1::date
      AND r.return_order_processed_time <  $2::date
),

osd AS (
    SELECT
        channel_parent_order_id AS parent_id,
        channel_order_id AS od_id,
        client_sku_id_ean AS sku_id,
        order_resolution AS final_resolution
    FROM sales_order_detail
    WHERE channel_order_date >= DATE '2026-01-01'
),

pin AS (
    SELECT DISTINCT ON (pincode) pincode, city, state FROM pincodes ORDER BY pincode
),

b2c AS (
    SELECT
        sl.warehouse_name AS wh_name,
        sl.channel_parent_order_id AS parent_order_id,
        sl.channel_order_id AS ch_order_id,
        sl.system_order_id,
        sl.order_qc_status,
        sl.channel_invoice_no,
        sl.system_invoice_no,
        sl.system_invoice_line_item_id,
        sl.channel_invoice_time,
        sl.sales_channel AS sal_channel,
        sl.client_sku_id_ean AS sku_id_ean,
        sl.mrp AS sale_mrp,
        sl.so_quantity,
        sl.dispatched_quantity,
        sl.payment_type,
        sl.unit_base_price,
        sl.unit_tax,
        sl.unit_sale_price,
        sl.total_base_price,
        sl.total_tax,
        sl.total_sale_price,
        sl.igst_rate,
        sl.cgst_rate,
        sl.sgst_rate,
        sl.shipping_charge,
        sl.discount,
        sl.hsn_code,
        sl.outward_awb_no,
        sl.transporter AS transpt,
        pin.city,
        pin.state,
        sl.customer_billing_pin,
        sl.order_status,
        sl.system_manifest_id,
        sl.channel_order_time,
        sl.system_order_time,
        sl.sla_time,
        sl.packed_time,
        sl.manifest_time,
        sl.manifested_within_24_hours,
        sl.handover_time,
        sl.sla_breached,
        sl.brand AS brands
    FROM b2c_detail AS sl
    LEFT JOIN pin
        ON (
            CASE
                WHEN sl.customer_billing_pin::text LIKE '%.0%'
                THEN left(sl.customer_billing_pin::text, length(sl.customer_billing_pin::text) - 2)
                ELSE sl.customer_billing_pin::text
            END
        ) = pin.pincode::text
    WHERE sl.sales_channel = 'TATACLIQ_ZIVORE'
      AND sl.channel_invoice_time >= DATE '2026-01-01'
),

base AS (
    SELECT
        rt.*,
        osd.final_resolution AS final_resolutions,
        b2c.*,
        ROW_NUMBER() OVER (
            PARTITION BY rt.return_order_item_id
            ORDER BY rt.return_order_item_id
        ) AS rw
    FROM rt
    LEFT JOIN osd
        ON rt.channel_parent_order_id = osd.parent_id
       AND rt.client_sku_id_ean = osd.sku_id
    LEFT JOIN b2c
        ON rt.channel_order_id = b2c.ch_order_id
       AND rt.client_sku_id_ean = b2c.sku_id_ean
),

final AS (
    SELECT *
    FROM base
    WHERE rw = 1
),

sp1 AS (
    SELECT DISTINCT
        channel_sub_order_id,
        channel_order_id,
        channel_parent_order_id,
        client_sku_id AS sku_ids,
        system_sub_order_id
    FROM b2c_non_split
    WHERE sales_channel = 'TATACLIQ_ZIVORE'
      -- forward sales for current-window returns are within the 2026 era;
      -- bounds the 19M-row scan via idx_b2cns_handover_time
      AND handover_time >= DATE '2026-01-01'
)

SELECT
    final.*,
    sp1.channel_sub_order_id AS sp1_channel_sub_order_id,
    sp1.system_sub_order_id,

    COUNT(final.return_order_item_id) OVER (
        PARTITION BY final.return_order_item_id
        ORDER BY final.return_order_item_id
    ) AS return_order_item_id_count,

    ROW_NUMBER() OVER (
        PARTITION BY sp1.channel_sub_order_id
        ORDER BY sp1.channel_sub_order_id
    ) AS channel_sub_order_id_count

FROM final
LEFT JOIN sp1
    ON final.channel_parent_order_id = sp1.channel_parent_order_id
   AND final.client_sku_id_ean = sp1.sku_ids
`;

const TATA_CLIQ_RETURN_WHERE = `
  WHERE ($3::text IS NULL OR return_order_status = $3)
    AND ($4::text IS NULL OR return_order_item_qc_status = $4)
    AND ($5::text IS NULL OR
         channel_order_id::text ILIKE $5 OR
         client_sku_id_ean ILIKE $5 OR
         brand ILIKE $5 OR
         return_order_item_id::text ILIKE $5 OR
         sp1_channel_sub_order_id::text ILIKE $5)
`;

const EXPORT_COLS = [
  ["warehouse_name", "warehouse_name"],
  ["channel_order_id", "channel_order_id"],
  ["channel_parent_order_id", "channel_parent_order_id"],
  ["return_order_type", "return_order_type"],
  ["system_return_id", "system_return_id"],
  ["return_order_item_id", "return_order_item_id"],
  ["channel_return_id", "channel_return_id"],
  ["return_gate_entry_no", "return_gate_entry_no"],
  ["return_gate_entry_awb", "return_gate_entry_awb"],
  ["return_gate_entry_time", "return_gate_entry_time"],
  ["tracking_id", "tracking_id"],
  ["transporter", "transporter"],
  ["return_order_created_time", "return_order_created_time"],
  ["inward_time", "inward_time"],
  ["return_order_updated_time", "return_order_updated_time"],
  ["qc_reason", "qc_reason"],
  ["reason_for_return", "reason_for_return"],
  ["return_order_item_qc_status", "return_order_item_qc_status"],
  ["return_order_status", "return_order_status"],
  ["final_resolution", "final_resolution"],
  ["return_order_item_status", "return_order_item_status"],
  ["putaway_status", "putaway_status"],
  ["uploaded_channel_order_id", "uploaded_channel_order_id"],
  ["channel_sub_order_id", "channel_sub_order_id"],
  ["client_sku_id_ean", "client_sku_id_ean"],
  ["global_sku_id", "global_sku_id"],
  ["brand", "brand"],
  ["mrp", "mrp"],
  ["forward_order_value", "forward_order_value"],
  ["item_id", "item_id"],
  ["sales_channel", "sales_channel"],
  ["is_uploaded", "is_uploaded"],
  ["return_order_processed_time", "return_order_processed_time"],
  ["forward_order_creation_time", "forward_order_creation_time"],
  ["forward_fulfillment_location_name", "forward_fulfillment_location_name"],
  ["channel_return_item_id", "channel_return_item_id"],
  ["forward_channel_invoice_number", "forward_channel_invoice_number"],
  [
    "forward_system_invoice_line_item_id",
    "forward_system_invoice_line_item_id",
  ],
  ["forward_awb_number", "forward_awb_number"],
  ["final_resolutions", "final_resolution"],
  ["wh_name", "wh_name"],
  ["parent_order_id", "parent_order_id"],
  ["ch_order_id", "ch_order_id"],
  ["system_order_id", "system_order_id"],
  ["order_qc_status", "order_qc_status"],
  ["channel_invoice_no", "channel_invoice_no"],
  ["system_invoice_no", "system_invoice_no"],
  ["system_invoice_line_item_id", "system_invoice_line_item_id"],
  ["channel_invoice_time", "channel_invoice_time"],
  ["sal_channel", "sal_channel"],
  ["sku_id_ean", "sku_id_ean"],
  ["sale_mrp", "sale_mrp"],
  ["so_quantity", "so_quantity"],
  ["dispatched_quantity", "dispatched_quantity"],
  ["payment_type", "payment_type"],
  ["unit_base_price", "unit_base_price"],
  ["unit_tax", "unit_tax"],
  ["unit_sale_price", "unit_sale_price"],
  ["total_base_price", "total_base_price"],
  ["total_tax", "total_tax"],
  ["total_sale_price", "total_sale_price"],
  ["igst_rate", "igst_rate"],
  ["cgst_rate", "cgst_rate"],
  ["sgst_rate", "sgst_rate"],
  ["shipping_charge", "shipping_charge"],
  ["discount", "discount"],
  ["hsn_code", "hsn_code"],
  ["outward_awb_no", "outward_awb_no"],
  ["transpt", "transpt"],
  ["city", "city"],
  ["state", "state"],
  ["customer_billing_pin", "customer_billing_pin"],
  ["order_status", "order_status"],
  ["system_manifest_id", "system_manifest_id"],
  ["channel_order_time", "channel_order_time"],
  ["system_order_time", "system_order_time"],
  ["sla_time", "sla_time"],
  ["packed_time", "packed_time"],
  ["manifest_time", "manifest_time"],
  ["manifested_within_24_hours", "manifested_within_24_hours"],
  ["handover_time", "handover_time"],
  ["sla_breached", "sla_breached"],
  ["brands", "brands"],
  ["rw", "rw"],
];

const TATA_CLIQ_EXPORT_COLS = [
  ...EXPORT_COLS,
  ["sp1_channel_sub_order_id", "sp1_channel_sub_order_id"],
  ["system_sub_order_id", "system_sub_order_id"],
  ["return_order_item_id_count", "return_order_item_id_count"],
  ["channel_sub_order_id_count", "channel_sub_order_id_count"],
];

async function list(params, { sortBy, sortDir, pageLimit, offset, signal }) {
  const pageCte = `,
  filtered_returns AS (
    SELECT * FROM returns_base
    ${OUTER_WHERE}
    ORDER BY ${sortBy} ${sortDir}
    LIMIT $7 OFFSET $8
  )`;

  const sql = `
    SELECT * FROM (${buildScopedReturnQuery("filtered_returns", pageCte)}) t1
    ORDER BY ${sortBy} ${sortDir}
  `;

  return db.query(sql, [...params, pageLimit, offset], signal);
}

async function summary(params, signal) {
  const sql = `
    ${RETURN_DETAIL_BASE_CTE}
    SELECT
      COUNT(*)                                                                    AS total_returns,
      COALESCE(SUM(forward_order_value::numeric), 0)                              AS forward_order_value
    FROM returns_base
    ${OUTER_WHERE}
  `;
  return db.query(sql, params, signal);
}

/* Filter options are scoped to the business window ($1/$2): the previous
   whole-table DISTINCTs scanned all ~8.5M rows on every cache miss. */
const RETURNS_DISTINCT = (col, extra = "") => `
  SELECT DISTINCT ${col} AS val
  FROM return_order_report_item_level_wms
  WHERE return_order_processed_time >= $1::date
    AND return_order_processed_time <  $2::date
    ${extra}
    AND ${col} IS NOT NULL
  ORDER BY 1`;

async function filters(params, signal) {
  const [channels, returnStatuses, qcStatuses] = await Promise.all([
    db.query(RETURNS_DISTINCT("sales_channel"), params, signal),
    db.query(RETURNS_DISTINCT("return_order_status"), params, signal),
    db.query(RETURNS_DISTINCT("return_order_item_qc_status"), params, signal),
  ]);

  return {
    salesChannels: channels.map((r) => r.val),
    returnStatuses: returnStatuses.map((r) => r.val),
    qcStatuses: qcStatuses.map((r) => r.val),
  };
}

/* Chart aggregates for the returns dashboard — one windowed scan via
   GROUPING SETS (same population + filters as summary()).
   gmask: GROUPING(day, channel, status, brand) → day=7, channel=11,
   status=13, brand=14. */
async function analytics(params, signal) {
  const sql = `
    ${RETURN_DETAIL_BASE_CTE}
    SELECT
      GROUPING(rb.return_order_processed_time::date, rb.sales_channel,
               rb.return_order_status, rb.brand)                 AS gmask,
      rb.return_order_processed_time::date                       AS day,
      rb.sales_channel,
      rb.return_order_status,
      rb.brand,
      COUNT(*)                                                   AS returns,
      COALESCE(SUM(rb.forward_order_value::numeric), 0)          AS value
    FROM returns_base rb
    WHERE rb.rw = 1
      AND ($3::text IS NULL OR rb.sales_channel               = $3)
      AND ($4::text IS NULL OR rb.return_order_status         = $4)
      AND ($5::text IS NULL OR rb.return_order_item_qc_status = $5)
      AND ($6::text IS NULL OR
           rb.channel_order_id::text     ILIKE $6 OR
           rb.client_sku_id_ean          ILIKE $6 OR
           rb.brand                      ILIKE $6 OR
           rb.return_order_item_id::text ILIKE $6)
    GROUP BY GROUPING SETS (
      (rb.return_order_processed_time::date),
      (rb.sales_channel),
      (rb.return_order_status),
      (rb.brand)
    )
    ORDER BY gmask, day
  `;
  return db.query(sql, params, signal);
}

async function exportStream(params, signal) {
  const sql = `
    SELECT * FROM (${RETURN_EXPORT_QUERY}) t1
    ${OUTER_WHERE}
    ORDER BY return_order_processed_time DESC
  `;
  return db.queryStream(sql, params, signal);
}

async function pastReturnExportStream(params, signal) {
  const sql = `
    SELECT * FROM (${PAST_RETURN_EXPORT_QUERY}) t1
    ${OUTER_WHERE}
    ORDER BY return_order_processed_time DESC
  `;
  return db.queryStream(sql, params, signal);
}

async function omniList(params, { sortBy, sortDir, pageLimit, offset, signal }) {
  const sql = `
    SELECT * FROM (${OMNI_RETURN_QUERY}) t1
    ${OMNI_OUTER_WHERE}
    ORDER BY ${sortBy} ${sortDir}
    LIMIT $6 OFFSET $7
  `;
  return db.query(sql, [...params, pageLimit, offset], signal);
}

async function omniSummary(params, signal) {
  const sql = `
    SELECT
      COUNT(*) AS total_returns,
      COALESCE(SUM(forward_order_value::numeric), 0) AS forward_order_value
    FROM (${OMNI_RETURN_QUERY}) t1
    ${OMNI_OUTER_WHERE}
  `;
  return db.query(sql, params, signal);
}

async function omniFilters(params, signal) {
  const extra = "AND sales_channel = 'MYNTRA-OMNI' AND item_id IS NULL";
  const [returnStatuses, qcStatuses] = await Promise.all([
    db.query(RETURNS_DISTINCT("return_order_status", extra), params, signal),
    db.query(RETURNS_DISTINCT("return_order_item_qc_status", extra), params, signal),
  ]);

  return {
    returnStatuses: returnStatuses.map((r) => r.val),
    qcStatuses: qcStatuses.map((r) => r.val),
  };
}

async function omniExportStream(params, signal) {
  const sql = `
    SELECT * FROM (${OMNI_RETURN_QUERY}) t1
    ${OMNI_OUTER_WHERE}
    ORDER BY return_order_processed_time DESC
  `;
  return db.queryStream(sql, params, signal);
}

async function tataCliqList(params, { sortBy, sortDir, pageLimit, offset, signal }) {
  const sql = `
    SELECT * FROM (${TATA_CLIQ_RETURN_QUERY}) t1
    ${TATA_CLIQ_RETURN_WHERE}
    ORDER BY ${sortBy} ${sortDir}
    LIMIT $6 OFFSET $7
  `;
  return db.query(sql, [...params, pageLimit, offset], signal);
}

async function tataCliqSummary(params, signal) {
  const sql = `
    SELECT
      COUNT(*) AS total_returns,
      COALESCE(SUM(forward_order_value::numeric), 0) AS forward_order_value
    FROM (${TATA_CLIQ_RETURN_QUERY}) t1
    ${TATA_CLIQ_RETURN_WHERE}
  `;
  return db.query(sql, params, signal);
}

async function tataCliqFilters(params, signal) {
  const extra = "AND sales_channel = 'TATACLIQ_ZIVORE' AND item_id IS NOT NULL";
  const [returnStatuses, qcStatuses] = await Promise.all([
    db.query(RETURNS_DISTINCT("return_order_status", extra), params, signal),
    db.query(RETURNS_DISTINCT("return_order_item_qc_status", extra), params, signal),
  ]);

  return {
    returnStatuses: returnStatuses.map((r) => r.val),
    qcStatuses: qcStatuses.map((r) => r.val),
  };
}

async function tataCliqExportStream(params, signal) {
  const sql = `
    SELECT * FROM (${TATA_CLIQ_RETURN_QUERY}) t1
    ${TATA_CLIQ_RETURN_WHERE}
    ORDER BY return_order_processed_time DESC
  `;
  return db.queryStream(sql, params, signal);
}

async function dataStatus(signal) {
  const sql = `
    SELECT MAX(return_order_processed_time) AS last_data_at
    FROM return_order_report_item_level_wms
    WHERE return_order_processed_time >= CURRENT_DATE - INTERVAL '120 days'
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
  pastReturnExportStream,
  omniList,
  omniSummary,
  omniFilters,
  omniExportStream,
  tataCliqList,
  tataCliqSummary,
  tataCliqFilters,
  tataCliqExportStream,
};
