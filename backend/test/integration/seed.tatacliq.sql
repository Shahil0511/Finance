-- Deterministic TataCliq seed (sales + returns), anchored to the CURRENT month.

INSERT INTO pincodes (pincode, city, state) VALUES ('110001','New Delhi','DL');

-- Two in-window TATACLIQ_ZIVORE sale lines. TP1 has qty 2 (exercises A3 math).
INSERT INTO b2c_detail (
  channel_parent_order_id, channel_order_id, sales_channel, system_order_id,
  warehouse_name, customer_billing_pin, client_sku_id_ean, payment_type,
  so_quantity, dispatched_quantity, mrp, unit_sale_price, unit_tax,
  system_invoice_line_item_id, channel_order_time, channel_invoice_time, handover_time, brand,
  order_status, sla_breached
) VALUES
  ('TP1','TCO1','TATACLIQ_ZIVORE','TSO1','WH1','110001','TSKU1','PREPAID',
   2, 2, 150.00, 100.00, 10.00,
   101, DATE '2026-06-01', date_trunc('month',CURRENT_DATE)+interval '10 hours',
   date_trunc('month',CURRENT_DATE)+interval '12 hours','BrandT',
   'DELIVERED', false),
  ('TP2','TCO2','TATACLIQ_ZIVORE','TSO2','WH1','110001','TSKU2','COD',
   1, 1, 80.00, 50.00, 5.00,
   102, DATE '2026-06-01', date_trunc('month',CURRENT_DATE)+interval '10 hours',
   date_trunc('month',CURRENT_DATE)+interval '13 hours','BrandT',
   'DELIVERED', false);

INSERT INTO sales_order_detail
  (channel_parent_order_id, channel_order_id, client_sku_id_ean, category,
   order_resolution, sales_channel, channel_order_date, handover_time)
VALUES
  ('TP1','TCO1','TSKU1','Apparel','OK','TATACLIQ_ZIVORE', date_trunc('month',CURRENT_DATE)::date,
   date_trunc('month',CURRENT_DATE)+interval '12 hours');

-- Sub-order split row: joins TP1/TSKU1 in BOTH the sales sp1 CTE (window+channel
-- filtered) and the returns sp1 CTE (channel filtered only).
INSERT INTO b2c_non_split (
  channel_sub_order_id, channel_order_id, channel_parent_order_id, client_sku_id,
  system_sub_order_id, ordered_quantity, mrp, unit_sale_price, sales_channel, handover_time
) VALUES
  ('SUB1','TCO1','TP1','TSKU1','SYS1', 2, 150.00, 100.00, 'TATACLIQ_ZIVORE',
   date_trunc('month',CURRENT_DATE)+interval '12 hours');

-- One in-window TataCliq return against TP1/TSKU1.
INSERT INTO return_order_report_item_level_wms (
  channel_parent_order_id, channel_order_id, client_sku_id_ean, return_order_item_id,
  sales_channel, item_id, return_order_status, return_order_item_qc_status, brand,
  forward_order_value, return_order_processed_time, forward_order_creation_time
) VALUES
  ('TP1','TCO1','TSKU1','TROI1','TATACLIQ_ZIVORE','TITM1','RETURN_COMPLETED','GOOD','BrandT',
   100.00, date_trunc('month',CURRENT_DATE)+interval '12 hours', DATE '2026-06-01');
