import React, { useState } from "react";
import { Table, Button, Form, Input, Select, Modal, message, Popconfirm } from "antd";
import {
  useAddProductMutation,
  useDeleteProductMutation,
  useGetProductsQuery,
} from "../../context/service/product.service";
import { useGetWarehousesQuery } from "../../context/service/ombor.service";
import { MdEdit } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";

const { Option } = Select;

// 6 xonali noyob barcode generatsiya qilish uchun funksiya
const generateBarcode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export default function Product() {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const { data: products = [], isLoading: productsLoading } =
    useGetProductsQuery();
  const { data: warehouses = [], isLoading: warehousesLoading } =
    useGetWarehousesQuery();
  const [addProduct] = useAddProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  console.log(products);

  const handleAddProduct = () => {
    setModalVisible(true);
    form.setFieldsValue({ barcode: generateBarcode() }); // Barcode ni avtomatik ravishda generatsiya qilish
  };

  const handleCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      await addProduct(values).unwrap();
      form.resetFields();
      setModalVisible(false);
      message.success("Product added successfully");
    } catch (error) {
      if (
        error.data?.message?.includes("E11000 duplicate key error collection")
      ) {
        message.error("Barcode must be unique");
      } else {
        message.error("Failed to add product");
      }
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
    },
    {
      title: "Miqdori",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Valyuta",
      dataIndex: "currency",
      key: "currency",
    },
    {
      title: "Purchase Price",
      dataIndex: "purchasePrice",
      key: "purchasePrice",
      render: (text, record) =>
        `${record.purchasePrice.value}`,
    },
    {
      title: "Selling Price",
      dataIndex: "sellingPrice",
      key: "sellingPrice",
      render: (text, record) =>
        `${record.sellingPrice.value}`,
    },
    {
      title: "Warehouse",
      dataIndex: "warehouse",
      key: "warehouse",
      render: (text, record) => record?.warehouse?.name,
    },
    {
      title: "Barcode",
      dataIndex: "barcode",
      key: "barcode",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Amallar", render: (_, record) => (
        <div className="table_actions">
          <Button type="primary" onClick={() => console.log(record)}>
            <MdEdit />
          </Button>
          <Popconfirm title="Mahsulotni o'chirmoqchimisiz" onCancel={() => { }} onConfirm={() => deleteProduct(record._id)} okText="O'chirish" cancelText="Orqaga" >
            <Button type="primary">
              <MdDeleteForever />
            </Button>
          </Popconfirm>
        </div>
      )
    }
  ];

  return (
    <div>
      <Button
        type="primary"
        onClick={handleAddProduct}
        style={{ marginBottom: 16 }}
      >
        Add Product
      </Button>
      <Table
        columns={columns}
        dataSource={products}
        loading={productsLoading}
        rowKey="_id"
      />

      <Modal
        title="Add Product"
        visible={modalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="name"
            rules={[
              { required: true, message: "Please input the product name!" },
            ]}
          >
            <Input placeholder="Product Name" />
          </Form.Item>
          <Form.Item
            name="unit"
            rules={[{ required: true, message: "Please select the unit!" }]}
          >
            <Select placeholder="Select Unit">
              <Option value="kg">Kilogram</Option>
              <Option value="dona">Dona</Option>
              <Option value="karobka">Karobka</Option>
              <Option value="pachka">Pachka</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name={["purchasePrice", "value"]}
            rules={[
              { required: true, message: "Please input the purchase price!" },
            ]}
          >
            <Input placeholder="Purchase Price" />
          </Form.Item>
          <Form.Item
            name={["sellingPrice", "value"]}
            rules={[
              { required: true, message: "Please input the selling price!" },
            ]}
          >
            <Input placeholder="Selling Price" />
          </Form.Item>
          <Form.Item
            name={["quantity"]}
            rules={[
              { required: true, message: "Tovar sonini kiriting" },
            ]}
          >
            <Input placeholder="Soni" />
          </Form.Item>
          <Form.Item
            name="currency"
            rules={[{ required: true, message: "Please select the currency!" }]}
          >
            <Select placeholder="Select Currency">
              <Option value="USD">USD</Option>
              <Option value="SUM">SUM</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="warehouse"
            rules={[
              { required: true, message: "Please select the warehouse!" },
            ]}
          >
            <Select placeholder="Select Warehouse" loading={warehousesLoading}>
              {warehouses.map((warehouse) => (
                <Option key={warehouse._id} value={warehouse._id}>
                  {warehouse?.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="category"
            rules={[{ required: true, message: "Please input the category!" }]}
          >
            <Input placeholder="Category" />
          </Form.Item>
          <Form.Item
            name="barcode"
            hidden
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Product
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
