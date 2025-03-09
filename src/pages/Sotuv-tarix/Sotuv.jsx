import React, { useEffect, useState } from "react";
import { useGetSalesHistoryQuery } from "../../context/service/sales.service";
import { DatePicker, Input, Select, Table } from "antd";
import moment from "moment";

const Sales = () => {
  const { data: sales = [], isLoading } = useGetSalesHistoryQuery();
  const [filters, setFilters] = useState({
    productName: "",
    productCode: "",
    paymentMethod: "",
    dateRange: [],
  });
  const [filteredSales, setFilteredSales] = useState([])
  useEffect(() => {
    setFilteredSales(sales.filter((sale) => {
      const matchesProductName = sale.productId?.name?.toLowerCase()
        .includes(filters.productName?.toLowerCase());
      const matchesProductCode = sale.productId?.code?.toLowerCase()
        .includes(filters.productCode?.toLowerCase());
      const matchesPaymentMethod =
        !filters.paymentMethod || sale.paymentMethod === filters.paymentMethod;
      const matchesDateRange =
        !filters.dateRange.length ||
        (moment(sale.createdAt).isSameOrAfter(moment(filters.dateRange[0]), "day") &&
          moment(sale.createdAt).isSameOrBefore(moment(filters.dateRange[1]), "day"));
      return matchesProductName && matchesProductCode && matchesPaymentMethod && matchesDateRange;
    }))
  }, [filters, sales])
  console.log(moment("2025-03-08T04:26:17.302Z").isSameOrAfter("2025-03-09T04:26:17.302Z"));

  console.log(filters);

  const columns = [
    { title: "Mijoz ismi", dataIndex: ["clientId", "name"], key: "clientId" },
    { title: "Mahsulot nomi", dataIndex: ["productId", "name"], key: "productId" },
    { title: "Mahsulot kodi", dataIndex: ["productId", "code"], key: "productId" },
    { title: "Mahsulot o'lchami", dataIndex: ["productId", "size"], key: "productId" },
    { title: "Ombor", dataIndex: ["warehouseId", "name"], key: "warehouseId" },
    { title: "Soni", dataIndex: "quantity", key: "quantity" },
    { title: "To'lov usuli", dataIndex: "paymentMethod", key: "paymentMethod" },
    {
      title: "Sotib olish narxi",
      key: "purchasePrice",
      render: (_, record) => `${record.productId.purchasePrice.value} ${record.productId.currency}`,
    },
    {
      title: "Sotish narxi(so'm)",
      dataIndex: ["payment", "sum"],
      key: "sellingPrice",
      render: (text) => `${text} so'm`,
    },
    {
      title: "Sotish narxi($)",
      dataIndex: ["payment", "usd"],
      key: "sellingPrice",
      render: (text) => `${text?.toFixed(2)}$`,
    },
    {
      title: "Sotish sanasi",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => moment(text).format("DD.MM.YYYY HH:mm"),
    },
  ];

  if (isLoading) {
    return <div>Yuklanmoqda...</div>;
  }

  return (
    <div className="sales-page">
      <div className="page_header">
        <h1>Sotilgan Mahsulotlar</h1>
        <div className="header_actions">
          <Input
            style={{ width: "300px" }}
            placeholder="Mahsulot nomi"
            onChange={(e) => setFilters({ ...filters, productName: e.target.value })}
          />
          <Input
            style={{ width: "200px" }}
            placeholder="Mahsulot kodi"
            onChange={(e) => setFilters({ ...filters, productCode: e.target.value })}
          />
          <Select
            style={{ width: "150px" }}
            placeholder="To'lov usuli"
            onChange={(value) => setFilters({ ...filters, paymentMethod: value })}
          >
            <Select.Option value="">Barchasi</Select.Option>
            <Select.Option value="cash">Naqd</Select.Option>
            <Select.Option value="card">Karta</Select.Option>
          </Select>
          <DatePicker.RangePicker
            style={{ width: "300px" }}
            placeholder={["Boshi", "Oxiri"]}
            onChange={(dates, dateStrings) => {
              if (!dateStrings[0] || !dateStrings[1]) {
                setFilters({ ...filters, dateRange: [] });
              } else {
                setFilters({ ...filters, dateRange: dateStrings });
              }
            }}
          />

        </div>
      </div>
      <Table columns={columns} dataSource={filteredSales} rowKey="_id" />
    </div>
  );
};

export default Sales;
