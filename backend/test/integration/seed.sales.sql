-- Deterministic sales seed, anchored to the CURRENT month so rows always land
-- inside the report's month window (the window is computed in-SQL from CURRENT_DATE).
-- "INWIN" = 1st of this month, midday. "OLD" = 2 months ago (always out of window).

INSERT INTO pincodes (pincode, city, state) VALUES
  ('110001', 'New Delhi', 'DL'),
  ('400001', 'Mumbai',    'MH');

INSERT INTO sales_order_detail
  (channel_parent_order_id, channel_order_id, client_sku_id_ean, category, order_resolution, sales_channel, handover_time)
VALUES
  ('P1', 'CO1', 'SKU1', 'Apparel',  'OK', 'MYNTRA', date_trunc('month', CURRENT_DATE) + interval '12 hours'),
  ('P2', 'CO2', 'SKU2', 'Footwear', 'OK', 'MYNTRA', date_trunc('month', CURRENT_DATE) + interval '12 hours');

-- 3 in-window MYNTRA rows. P1 appears twice -> distinct parents = 2.
-- Two rows have dispatched_quantity > 1, which is what exposes bug A3.
INSERT INTO b2c_detail (
  channel_parent_order_id, channel_order_id, sales_channel, channel_invoice_no, system_order_id,
  warehouse_name, channel_invoice_time, customer_billing_pin, outward_awb_no, client_sku_id_ean,
  payment_type, so_quantity, dispatched_quantity, mrp, unit_sale_price, system_invoice_line_item_id,
  unit_base_price, unit_tax, igst_rate, cgst_rate, sgst_rate, discount, shipping_charge, hsn_code,
  manifest_time, handover_time, brand, order_status, system_manifest_id, sla_time, sla_breached
) VALUES
  ('P1','CO1','MYNTRA','INV1','SO1','WH1', date_trunc('month',CURRENT_DATE)+interval '12 hours','110001','AWB1','SKU1',
   'PREPAID', 3, 3, 150.00, 100.00, 1, 80.00, 18.00, 18.00, 0, 0, 10.00, 0, 'HSN1',
   date_trunc('month',CURRENT_DATE)+interval '6 hours', date_trunc('month',CURRENT_DATE)+interval '12 hours',
   'BrandA','DELIVERED','MAN1', date_trunc('month',CURRENT_DATE)+interval '5 hours', false),

  ('P2','CO2','MYNTRA','INV2','SO2','WH1', date_trunc('month',CURRENT_DATE)+interval '12 hours','400001','AWB2','SKU2',
   'COD', 1, 1, 250.00, 200.00, 2, 160.00, 36.00, 18.00, 0, 0, 0, 0, 'HSN2',
   date_trunc('month',CURRENT_DATE)+interval '6 hours', date_trunc('month',CURRENT_DATE)+interval '12 hours 30 minutes',
   'BrandB','DELIVERED','MAN2', date_trunc('month',CURRENT_DATE)+interval '5 hours', false),

  ('P1','CO3','MYNTRA','INV3','SO3','WH2', date_trunc('month',CURRENT_DATE)+interval '12 hours','110001','AWB3','SKU3',
   'PREPAID', 2, 2, 80.00, 50.00, 3, 40.00, 9.00, 18.00, 0, 0, 0, 0, 'HSN3',
   date_trunc('month',CURRENT_DATE)+interval '6 hours', date_trunc('month',CURRENT_DATE)+interval '13 hours',
   'BrandA','RTO','MAN3', date_trunc('month',CURRENT_DATE)+interval '5 hours', false);

-- Out-of-window MYNTRA row (2 months ago) -> must be excluded by the month filter.
INSERT INTO b2c_detail (
  channel_parent_order_id, channel_order_id, sales_channel, system_order_id, warehouse_name,
  customer_billing_pin, client_sku_id_ean, payment_type, so_quantity, dispatched_quantity,
  mrp, unit_sale_price, system_invoice_line_item_id, unit_tax, handover_time, brand, order_status, sla_breached
) VALUES
  ('P9','CO9','MYNTRA','SO9','WH1','110001','SKU9','PREPAID', 1, 1, 999.00, 999.00, 9, 99.00,
   date_trunc('month',CURRENT_DATE) - interval '2 months' + interval '12 hours','BrandA','DELIVERED', false);
