import { apiSlice } from "./api.service";

// `expenseApi` xizmatini yaratamiz va endpointlarni qo'shamiz
export const expenseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addExpense: builder.mutation({
      query: (expenseData) => ({
        url: "/expenses",
        method: "POST",
        body: expenseData,
      }),
    }),
    getExpenses: builder.query({
      query: () => ({
        url: "/expenses",
        method: "GET",
      }),
    }),
    updateExpense: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/expenses/${id}`,
        method: "PUT",
        body: data,
      }),
    }),
    deleteExpense: builder.mutation({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: "DELETE",
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useAddExpenseMutation,
  useGetExpensesQuery,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expenseApi;
