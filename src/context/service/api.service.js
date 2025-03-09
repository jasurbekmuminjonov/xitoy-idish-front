import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Create a base query instance for Redux Toolkit Query
const baseQuery = fetchBaseQuery({
  // baseUrl: "https://lola-avto-zapchast-dizayin-b.vercel.app/api",
  baseUrl: "https://xitoy-idish-server.vercel.app/api",
  prepareHeaders: (headers, { getState }) => {
    const token = localStorage.getItem("access_token");

    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});
// if token expired or not valid - reauth user (Unauthorization error)
export const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  if (result?.error && result?.error?.status === 401) {
    localStorage.clear();
    sessionStorage.clear();
    // return window.location.reload();
  }
  return result;
};

// Create an auto-generated hooks for each endpoint
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["update", "device", "Product", "Sale"],
  endpoints: (builder) => ({}),
});
