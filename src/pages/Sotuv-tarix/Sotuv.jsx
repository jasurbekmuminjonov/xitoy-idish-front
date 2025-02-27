import React from "react";
import { useGetSalesHistoryQuery } from "../../context/service/sales.service";
import { Table } from "antd";
import moment from "moment";
// import "./sales.css";

const Sales = () => {
  const { data: sales = [], isLoading } = useGetSalesHistoryQuery();

  const columns = [
    { title: "Mijoz ismi", dataIndex: ["clientId", "name"], key: "clientId" },
    {
      title: "Mahsulot nomi",
      dataIndex: ["productId", "name"],
      key: "productId",
    },
    { title: "Ombor", dataIndex: ["warehouseId", "name"], key: "warehouseId" },
    { title: "Soni", dataIndex: "quantity", key: "quantity" },
    { title: "To'lov usuli", dataIndex: "paymentMethod", key: "paymentMethod" },
    {
      title: "Sotib olish narxi",
      dataIndex: ["productId", "purchasePrice", "value"],
      key: "purchasePrice",
      render: (text) => `${text} SUM`,
    },
    {
      title: "Sotish narxi",
      dataIndex: ["productId", "sellingPrice", "value"],
      key: "sellingPrice",
      render: (text) => `${text} SUM`,
    },
    {
      title: "Sotish sanasi",
      dataIndex: "saleDate",
      key: "saleDate",
      render: (text) => moment(text).format("DD,MM,YYYY HH:mm"),
    },
  ];

  if (isLoading) {
    return <div>Yuklanmoqda...</div>;
  }

  return (
    <div className="sales-page">
      <h1>Sotilgan Mahsulotlar</h1>
      <Table columns={columns} dataSource={sales} rowKey="_id" />
    </div>
  );
};

export default Sales;
