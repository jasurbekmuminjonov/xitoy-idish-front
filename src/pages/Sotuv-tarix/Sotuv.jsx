import React from "react";
import { useGetSalesHistoryQuery } from "../../context/service/sales.service";
import { Table } from "antd";
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
    { title: "Sotish sanasi", dataIndex: "saleDate", key: "saleDate" },
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
