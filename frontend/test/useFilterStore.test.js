import test from 'node:test';
import assert from 'node:assert/strict';
import {
  useSalesFilterStore,
  useReturnsFilterStore,
  cleanParams,
  cleanAggParams,
} from '../src/store/useFilterStore.js';

test('cleanParams: strips null and empty-string entries', () => {
  assert.deepEqual(
    cleanParams({ a: '1', b: '', c: null, d: 0, e: 'x' }),
    { a: '1', d: 0, e: 'x' },
  );
});

test('cleanAggParams: also strips pagination/sort keys (summary & analytics args)', () => {
  assert.deepEqual(
    cleanAggParams({ dateFrom: '2026-06-01', brand: 'X', page: 4, pageSize: 50, sortBy: 'mrp', sortDir: 'ASC', search: '' }),
    { dateFrom: '2026-06-01', brand: 'X' },
  );
});

test('store: setFilters merges a patch and snaps back to page 1', () => {
  const store = useSalesFilterStore;
  store.getState().setPage(7);
  assert.equal(store.getState().filters.page, 7);
  store.getState().setFilters({ brand: 'BrandA' });
  assert.equal(store.getState().filters.brand, 'BrandA');
  assert.equal(store.getState().filters.page, 1); // filter change restarts paging
});

test('store: setSort updates sort and resets the page', () => {
  const store = useReturnsFilterStore;
  store.getState().setPage(3);
  store.getState().setSort('brand', 'ASC');
  const f = store.getState().filters;
  assert.equal(f.sortBy, 'brand');
  assert.equal(f.sortDir, 'ASC');
  assert.equal(f.page, 1);
});

test('store: reset restores defaults with FRESH dates (M1 fix)', () => {
  const store = useSalesFilterStore;
  store.getState().setFilters({ brand: 'X', dateFrom: '2020-01-01' });
  store.getState().reset();
  const f = store.getState().filters;
  assert.equal(f.brand, '');
  assert.equal(f.page, 1);
  // Dates are recomputed at reset time, never the 2020 value we set.
  assert.match(f.dateFrom, /^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(f.dateFrom, '2020-01-01');
  assert.equal(f.dateFrom.slice(-2), '01'); // business window starts on the 1st
});

test('stores are independent instances from the factory', () => {
  useSalesFilterStore.getState().setFilters({ search: 'only-sales' });
  assert.equal(useReturnsFilterStore.getState().filters.search, '');
  useSalesFilterStore.getState().reset();
});
