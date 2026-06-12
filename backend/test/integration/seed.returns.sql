-- Deterministic RETURNS seed reproducing bugs A1 and A2, anchored to CURRENT month.
-- "INWIN" = 1st of this month, midday (always inside the report's processed-time window).

-- ─── A1: summary vs list count DIFFERENT populations ──────────────────────────
-- Summary base (RETURN_BASE_CTE) includes lowercase 'myntra-omni' (item_id NULL allowed)
-- and has no forward_order_creation_time floor. List base (RETURN_DETAIL_BASE_CTE)
-- requires item_id IS NOT NULL AND forward_order_creation_time >= 2026-01-01.
--   RA  -> counted by BOTH (normal channel, item_id set, recent forward order)
--   RB  -> summary ONLY (myntra-omni, item_id NULL -> excluded from the list)
--   RC  -> summary ONLY (forward order from 2025 -> excluded from the list)
INSERT INTO return_order_report_item_level_wms (
  channel_parent_order_id, channel_order_id, client_sku_id_ean, return_order_item_id,
  channel_return_item_id, sales_channel, item_id, return_order_status,
  return_order_item_qc_status, brand, forward_order_value,
  return_order_processed_time, forward_order_creation_time
) VALUES
  ('FPA','FCO_A','FSKU_A','RA', NULL, 'flipkart',    'ITM_A', 'RETURN_COMPLETED','GOOD','BrandA', 100.00,
   date_trunc('month',CURRENT_DATE)+interval '12 hours', DATE '2026-06-01'),

  ('OMP_B','OCO_B','OSKU_B','RB', NULL, 'myntra-omni', NULL,   'RETURN_COMPLETED','GOOD','BrandB', 200.00,
   date_trunc('month',CURRENT_DATE)+interval '12 hours', DATE '2026-06-01'),

  ('FPC','FCO_C','FSKU_C','RC', NULL, 'flipkart',    'ITM_C', 'RETURN_COMPLETED','GOOD','BrandC', 300.00,
   date_trunc('month',CURRENT_DATE)+interval '12 hours', DATE '2025-06-15');

-- ─── A2: Myntra-Omni summary over-counts via an un-deduped b2c fan-out ─────────
-- ROI1/ROI2 are the only omni returns (channel 'MYNTRA-OMNI', item_id NULL).
INSERT INTO return_order_report_item_level_wms (
  channel_parent_order_id, channel_order_id, client_sku_id_ean, return_order_item_id,
  sales_channel, item_id, return_order_status, return_order_item_qc_status, brand,
  forward_order_value, return_order_processed_time
) VALUES
  ('OMP1','OCO1','OSKU1','ROI1', 'MYNTRA-OMNI', NULL, 'RETURN_COMPLETED','GOOD','BrandO', 500.00,
   date_trunc('month',CURRENT_DATE)+interval '12 hours'),
  ('OMP2','OCO2','OSKU2','ROI2', 'MYNTRA-OMNI', NULL, 'RETURN_COMPLETED','GOOD','BrandO', 300.00,
   date_trunc('month',CURRENT_DATE)+interval '12 hours');

-- b2c_detail has TWO rows for (OCO1, OSKU1) -> the omni join fans ROI1 into 2 rows.
-- (OCO2, OSKU2) has a single match. The omni b2c CTE lacks DISTINCT ON, so the
-- duplicate is not collapsed: summary then reports 3 returns / 1300, not 2 / 800.
INSERT INTO b2c_detail (
  channel_order_id, client_sku_id_ean, system_invoice_line_item_id, sales_channel,
  brand, customer_billing_pin, mrp, unit_sale_price, dispatched_quantity,
  channel_order_time, handover_time
) VALUES
  ('OCO1','OSKU1', 201, 'MYNTRA-OMNI','BrandO','110001', 600.00, 600.00, 1,
   DATE '2026-06-01', date_trunc('month',CURRENT_DATE)+interval '12 hours'),
  ('OCO1','OSKU1', 202, 'MYNTRA-OMNI','BrandO','110001', 600.00, 600.00, 1,
   DATE '2026-06-01', date_trunc('month',CURRENT_DATE)+interval '11 hours'),
  ('OCO2','OSKU2', 203, 'MYNTRA-OMNI','BrandO','110001', 300.00, 300.00, 1,
   DATE '2026-06-01', date_trunc('month',CURRENT_DATE)+interval '12 hours');

INSERT INTO pincodes (pincode, city, state) VALUES ('110001','New Delhi','DL');
