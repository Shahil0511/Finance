import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiUrl } from '../../config/apiBase';
import { isForcedRefresh } from '../../lib/refreshBus';

const baseQuery = fetchBaseQuery({
  baseUrl: apiUrl('returns'),
  credentials: 'same-origin',
  timeout: 180000,
  prepareHeaders: (headers) => {
    // Dashboard Refresh: ask the backend to bypass + rewrite its Redis cache.
    if (isForcedRefresh()) headers.set('cache-control', 'no-cache');
    return headers;
  },
});

export const returnsApi = createApi({
  reducerPath: 'returnsApi',
  baseQuery,
  tagTypes: ['Returns'],
  endpoints: (b) => ({
    getReturnsList: b.query({
      query: (params) => ({ url: '/', params }),
      providesTags: ['Returns'],
      keepUnusedDataFor: 300,
    }),
    getReturnsSummary: b.query({
      query: (params) => ({ url: '/summary', params }),
      providesTags: ['Returns'],
      keepUnusedDataFor: 300,
    }),
    getReturnsFilters: b.query({
      query: () => '/filters',
      providesTags: ['Returns'], // Refresh re-pulls dropdown options too
      keepUnusedDataFor: 300,
    }),
    getReturnsDataStatus: b.query({
      query: () => '/data-status',
      providesTags: ['Returns'],
      keepUnusedDataFor: 60,
    }),
    getReturnsAnalytics: b.query({
      query: (params) => ({ url: '/analytics', params }),
      providesTags: ['Returns'],
      keepUnusedDataFor: 300,
    }),
    getMyntraOmniReturnsList: b.query({
      query: (params) => ({ url: '/omni', params }),
      providesTags: ['Returns'],
      keepUnusedDataFor: 300,
    }),
    getMyntraOmniReturnsSummary: b.query({
      query: (params) => ({ url: '/omni/summary', params }),
      providesTags: ['Returns'],
      keepUnusedDataFor: 300,
    }),
    getMyntraOmniReturnsFilters: b.query({
      query: () => '/omni/filters',
      providesTags: ['Returns'],
      keepUnusedDataFor: 300,
    }),
    getTataCliqReturnsList: b.query({
      query: (params) => ({ url: '/tata-cliq', params }),
      providesTags: ['Returns'],
      keepUnusedDataFor: 300,
    }),
    getTataCliqReturnsSummary: b.query({
      query: (params) => ({ url: '/tata-cliq/summary', params }),
      providesTags: ['Returns'],
      keepUnusedDataFor: 300,
    }),
    getTataCliqReturnsFilters: b.query({
      query: () => '/tata-cliq/filters',
      providesTags: ['Returns'],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetReturnsListQuery,
  useGetReturnsSummaryQuery,
  useGetReturnsFiltersQuery,
  useGetReturnsDataStatusQuery,
  useGetReturnsAnalyticsQuery,
  useGetMyntraOmniReturnsListQuery,
  useGetMyntraOmniReturnsSummaryQuery,
  useGetMyntraOmniReturnsFiltersQuery,
  useGetTataCliqReturnsListQuery,
  useGetTataCliqReturnsSummaryQuery,
  useGetTataCliqReturnsFiltersQuery,
} = returnsApi;
