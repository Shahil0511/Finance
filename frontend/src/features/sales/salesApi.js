import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiUrl } from '../../config/apiBase';
import { isForcedRefresh } from '../../lib/refreshBus';

const baseQuery = fetchBaseQuery({
  baseUrl: apiUrl('sales'),
  credentials: 'same-origin',
  timeout: 180000,
  prepareHeaders: (headers) => {
    // Dashboard Refresh: ask the backend to bypass + rewrite its Redis cache.
    if (isForcedRefresh()) headers.set('cache-control', 'no-cache');
    return headers;
  },
});

export const salesApi = createApi({
  reducerPath: 'salesApi',
  baseQuery,
  tagTypes: ['Sales'],
  endpoints: (b) => ({
    getSalesList: b.query({
      query: (params) => ({ url: '/', params }),
      providesTags: ['Sales'],
      keepUnusedDataFor: 300,
    }),
    getSalesSummary: b.query({
      query: (params) => ({ url: '/summary', params }),
      providesTags: ['Sales'],
      keepUnusedDataFor: 300,
    }),
    getSalesFilters: b.query({
      query: () => '/filters',
      providesTags: ['Sales'], // Refresh re-pulls dropdown options too
      keepUnusedDataFor: 300,
    }),
    getSalesDataStatus: b.query({
      query: () => '/data-status',
      providesTags: ['Sales'],
      keepUnusedDataFor: 60,
    }),
    getSalesAnalytics: b.query({
      query: (params) => ({ url: '/analytics', params }),
      providesTags: ['Sales'],
      keepUnusedDataFor: 300,
    }),
    getTataCliqSalesList: b.query({
      query: (params) => ({ url: '/tata-cliq', params }),
      providesTags: ['Sales'],
      keepUnusedDataFor: 300,
    }),
    getTataCliqSalesSummary: b.query({
      query: (params) => ({ url: '/tata-cliq/summary', params }),
      providesTags: ['Sales'],
      keepUnusedDataFor: 300,
    }),
    getTataCliqSalesFilters: b.query({
      query: () => '/tata-cliq/filters',
      providesTags: ['Sales'],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetSalesListQuery,
  useGetSalesSummaryQuery,
  useGetSalesFiltersQuery,
  useGetSalesDataStatusQuery,
  useGetSalesAnalyticsQuery,
  useGetTataCliqSalesListQuery,
  useGetTataCliqSalesSummaryQuery,
  useGetTataCliqSalesFiltersQuery,
} = salesApi;
