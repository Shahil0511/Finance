-- Integration-test schema for the finance reports (Postgres).
-- Mirrors only the tables/columns the report SQL actually touches. Throwaway DB only.

DROP TABLE IF EXISTS b2c_detail, sales_order_detail, pincodes, b2c_non_split CASCADE;

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
  handover_time           TIMESTAMP
);

CREATE TABLE b2c_detail (
  channel_parent_order_id     TEXT,
  channel_order_id            TEXT,
  sales_channel               TEXT,
  channel_invoice_no          TEXT,
  system_order_id             TEXT,
  warehouse_name              TEXT,
  channel_invoice_time        TIMESTAMP,
  customer_billing_pin        TEXT,
  outward_awb_no              TEXT,
  client_sku_id_ean           TEXT,
  payment_type                TEXT,
  so_quantity                 INTEGER,
  dispatched_quantity         INTEGER,
  mrp                         NUMERIC(12,2),
  unit_sale_price             NUMERIC(12,2),
  system_invoice_line_item_id BIGINT,
  unit_base_price             NUMERIC(12,2),
  unit_tax                    NUMERIC(12,2),
  igst_rate                   NUMERIC(6,2),
  cgst_rate                   NUMERIC(6,2),
  sgst_rate                   NUMERIC(6,2),
  discount                    NUMERIC(12,2),
  shipping_charge             NUMERIC(12,2),
  hsn_code                    TEXT,
  manifest_time               TIMESTAMP,
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
