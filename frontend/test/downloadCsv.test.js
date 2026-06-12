import test from 'node:test';
import assert from 'node:assert/strict';
import { exportQuery } from '../src/utils/downloadCsv.js';

test('exportQuery: drops null and empty values, keeps the rest', () => {
  const qs = exportQuery({
    dateFrom: '2026-06-01',
    dateTo: '2026-06-12',
    salesChannel: '',
    brand: null,
    page: 1,
  });
  assert.equal(qs, 'dateFrom=2026-06-01&dateTo=2026-06-12&page=1');
});

test('exportQuery: URL-encodes values', () => {
  const qs = exportQuery({ search: 'a b&c' });
  assert.equal(qs, 'search=a+b%26c');
});
