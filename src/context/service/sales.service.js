import { apiSlice } from "./api.service";

export const salesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sellProduct: builder.mutation({
      query: (saleData) => ({
        url: "/sales/sell",
        method: "POST",
        body: saleData,
      }),
    }),
    getSalesHistory: builder.query({
      query: () => ({
        url: "/sales/history",
        method: "GET",
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useSellProductMutation, useGetSalesHistoryQuery } = salesApi;
