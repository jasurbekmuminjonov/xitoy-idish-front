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

  const stm = {
    kg_quantity: 'kg',
    quantity: 'dona',
    box_quantity: 'karobka',
    package_quantity: 'pachka',
  }

  const columns = [
    {
      title: "Mahsulot nomi",
      dataIndex: ["productId", "name"],
      key: "productId",
    },
    { title: "Soni", dataIndex: "quantity", key: "quantity" },
    {
      title: "Birlik",
      dataIndex: 'unit',
      render: (text) => stm[text] || text,
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
        <Form.Item
          name="unit"
          rules={[{ required: true, message: "O'lchov birlikni kiriting" }]}
        >
          <Select placeholder="O'lchov birlik">
            <Option value="kg_quantity">Kilogram</Option>
            <Option value="quantity">Dona</Option>
            <Option value="box_quantity">Karobka</Option>
            <Option value="package_quantity">Pachka</Option>
          </Select>
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
