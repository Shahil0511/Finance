import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiUrl } from '../../config/apiBase';

const baseQuery = fetchBaseQuery({
  baseUrl: apiUrl('sales'),
  credentials: 'same-origin',
  timeout: 180000,
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
      keepUnusedDataFor: 300,
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
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetSalesListQuery,
  useGetSalesSummaryQuery,
  useGetSalesFiltersQuery,
  useGetSalesAnalyticsQuery,
  useGetTataCliqSalesListQuery,
  useGetTataCliqSalesSummaryQuery,
  useGetTataCliqSalesFiltersQuery,
} = salesApi;
