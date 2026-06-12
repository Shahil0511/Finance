-- Integration-test schema for the finance reports (Postgres).
-- Mirrors only the tables/columns the report SQL actually touches. Throwaway DB only.

DROP TABLE IF EXISTS
  b2c_detail, sales_order_detail, pincodes, b2c_non_split,
  return_order_report_item_level_wms CASCADE;

CREATE TABLE pincodes (
  pincode TEXT,
  city    TEXT,
  state   TEXT
);

CREATE TABLE sales_order_detail (
  channel_parent_order_id TEXT,
  channel_order_id        TEXT,
  client_sku_id_ean       TEXT,
  category                TEXT,
  order_resolution        TEXT,
  sales_channel           TEXT,
  channel_order_date      DATE,
  handover_time           TIMESTAMP
);

CREATE TABLE b2c_detail (
  channel_parent_order_id     TEXT,
  channel_order_id            TEXT,
  sales_channel               TEXT,
  channel_invoice_no          TEXT,
  system_invoice_no           TEXT,
  system_order_id             TEXT,
  warehouse_name              TEXT,
  order_qc_status             TEXT,
  channel_invoice_time        TIMESTAMP,
  customer_billing_pin        TEXT,
  outward_awb_no              TEXT,
  transporter                 TEXT,
  client_sku_id_ean           TEXT,
  payment_type                TEXT,
  so_quantity                 INTEGER,
  dispatched_quantity         INTEGER,
  mrp                         NUMERIC(12,2),
  unit_sale_price             NUMERIC(12,2),
  unit_base_price             NUMERIC(12,2),
  unit_tax                    NUMERIC(12,2),
  total_base_price            NUMERIC(12,2),
  total_tax                   NUMERIC(12,2),
  total_sale_price            NUMERIC(12,2),
  system_invoice_line_item_id BIGINT,
  igst_rate                   NUMERIC(6,2),
  cgst_rate                   NUMERIC(6,2),
  sgst_rate                   NUMERIC(6,2),
  discount                    NUMERIC(12,2),
  shipping_charge             NUMERIC(12,2),
  hsn_code                    TEXT,
  channel_order_time          TIMESTAMP,
  system_order_time           TIMESTAMP,
  packed_time                 TIMESTAMP,
  manifest_time               TIMESTAMP,
  manifested_within_24_hours  TEXT,
  handover_time               TIMESTAMP,
  brand                       TEXT,
  order_status                TEXT,
  system_manifest_id          TEXT,
  sla_time                    TIMESTAMP,
  sla_breached                BOOLEAN
);

CREATE TABLE b2c_non_split (
  channel_sub_order_id    TEXT,
  channel_order_id        TEXT,
  channel_parent_order_id TEXT,
  client_sku_id           TEXT,
  system_sub_order_id     TEXT,
  ordered_quantity        INTEGER,
  mrp                     NUMERIC(12,2),
  unit_sale_price         NUMERIC(12,2),
  sales_channel           TEXT,
  handover_time           TIMESTAMP
);

CREATE TABLE return_order_report_item_level_wms (
  channel_parent_order_id     TEXT,
  channel_order_id            TEXT,
  client_sku_id_ean           TEXT,
  return_order_item_id        TEXT,
  channel_return_item_id      TEXT,
  sales_channel               TEXT,
  item_id                     TEXT,
  return_order_status         TEXT,
  return_order_item_qc_status TEXT,
  brand                       TEXT,
  forward_order_value         NUMERIC(12,2),
  return_order_processed_time TIMESTAMP,
  forward_order_creation_time TIMESTAMP
);
