import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrency,
  formatNumber,
  getStatusVariant,
  getSLAVariant,
} from '../src/utils/formatters.js';

test('formatCurrency: null/empty/NaN render the em-dash placeholder', () => {
  assert.equal(formatCurrency(null), '—');
  assert.equal(formatCurrency(''), '—');
  assert.equal(formatCurrency('not-a-number'), '—');
});

test('formatCurrency: plain rupee formatting under 1 lakh', () => {
  assert.equal(formatCurrency(1234.5), '₹1,234.50');
  assert.equal(formatCurrency('99'), '₹99.00');
});

test('formatCurrency: lakh and crore abbreviations', () => {
  assert.equal(formatCurrency(250000), '₹2.50L');
  assert.equal(formatCurrency(30000000), '₹3.00Cr');
  assert.equal(formatCurrency(-250000), '₹-2.50L'); // abs() picks the unit
});

test('formatNumber: en-IN grouping and placeholder', () => {
  assert.equal(formatNumber(null), '—');
  assert.equal(formatNumber(1234567), '12,34,567');
});

test('getStatusVariant: maps status keywords to badge variants', () => {
  assert.equal(getStatusVariant('DELIVERED'), 'success');
  assert.equal(getStatusVariant('PENDING'), 'warning');
  assert.equal(getStatusVariant('PENDING_DISPATCH'), 'success'); // 'dispatch' branch is checked first
  assert.equal(getStatusVariant('CANCELLED'), 'error');
  assert.equal(getStatusVariant('APPROVED'), 'info');
  assert.equal(getStatusVariant(null), 'default');
  assert.equal(getStatusVariant('SOMETHING_ELSE'), 'default');
});

test('getSLAVariant: truthy flags are errors, everything else success', () => {
  assert.equal(getSLAVariant(true), 'error');
  assert.equal(getSLAVariant('1'), 'error');
  assert.equal(getSLAVariant('YES'), 'error');
  assert.equal(getSLAVariant(false), 'success');
  assert.equal(getSLAVariant(null), 'success');
});
