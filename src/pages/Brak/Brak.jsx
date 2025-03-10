import React, { useState } from "react";
import {
  useGetBrakHistoryQuery,
  useAddBrakMutation,
  useSearchProductsQuery,
} from "../../context/service/brak.service";
import { Table, Form, Input, Button, Select } from "antd";
import moment from "moment";
// import "./brak.css";

const { Option } = Select;

const Brak = () => {
  const { data: braks = [], isLoading: isLoadingBraks } =
    useGetBrakHistoryQuery();
  const [addBrak] = useAddBrakMutation();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: products = [], isLoading: isLoadingProducts } =
    useSearchProductsQuery(searchTerm, {
      skip: !searchTerm,
    });

  const columns = [
    {
      title: "Mahsulot nomi",
      dataIndex: ["productId", "name"],
      key: "productId",
    },
    {
      title: "Mahsulot o'lchami",
      dataIndex: ["productId", "size"],
      key: "size",
    },
    { title: "Soni", dataIndex: "quantity", key: "quantity" },
    {
      title: "Birlik",
      dataIndex: ["productId", "unit"],
      key: "unit",
    },
    { title: "Sababi", dataIndex: "reason", key: "reason" },
    { title: "Qo'shilgan vaqti", dataIndex: "createdAt", key: "createdAt", render: (text) => moment(text).format("DD.MM.YYYY HH:mm") },
  ];

  const onFinish = (values) => {
    addBrak(values);
  };

  return (
    <div className="brak-page">
      <h1>Brak Mahsulotlar</h1>
      <Form onFinish={onFinish} layout="inline">
        <Form.Item
          name="productId"
          label="Mahsulot"
          rules={[{ required: true }]}
        >
          <Select
            showSearch
            placeholder="Mahsulotni qidiring"
            onSearch={(value) => setSearchTerm(value)}
            loading={isLoadingProducts}
            filterOption={false}
            style={{ width: 400 }}
          >
            {products.map((product) => (
              <Option key={product._id} value={product._id}>
                {product.name} - o'lcham: {product.size}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="quantity" label="Soni" rules={[{ required: true }]}>
          <Input type="number" />
        </Form.Item>
        <Form.Item name="reason" label="Sababi" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Qo'shish
          </Button>
        </Form.Item>
      </Form>
      <Table
        columns={columns}
        dataSource={braks}
        rowKey="_id"
        loading={isLoadingBraks}
      />
    </div>
  );
};

export default Brak;
