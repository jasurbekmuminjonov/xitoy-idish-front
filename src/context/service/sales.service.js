import { apiSlice } from "./api.service";

export const salesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sellProduct: builder.mutation({
      query: (saleData) => ({
        url: "/sales/sell",
        method: "POST",
        body: saleData,
      }),
      invalidatesTags: ["Sale", "Product"],
    }),
    getSalesHistory: builder.query({
      query: () => ({
        url: "/sales/history",
        method: "GET",
      }),
      providesTags: ["Sale"],
    }),
  }),
  overrideExisting: false,
});

export const { useSellProductMutation, useGetSalesHistoryQuery } = salesApi;
