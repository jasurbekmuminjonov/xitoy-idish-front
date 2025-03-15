import React, { useState, useRef, useEffect } from "react";
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  Modal,
  message,
  Popconfirm,
  Upload,
} from "antd";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import {
  useAddProductMutation,
  useDeleteProductMutation,
  useGetProductsQuery,
  useUpdateProductMutation,
} from "../../context/service/product.service";
import { useGetWarehousesQuery } from "../../context/service/ombor.service";
import { MdEdit, MdDeleteForever, MdPrint } from "react-icons/md";
import axios from "axios";
import { FaUpload } from "react-icons/fa";

const { Option } = Select;

const generateBarcode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const BarcodePrint = React.forwardRef(({ barcode }, ref) => (
  <div ref={ref} style={{ width: "4cm", height: "3cm" }}>
    <Barcode value={barcode} width={2} height={60} fontSize={12} />
  </div>
));

const Product = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editProduct] = useUpdateProductMutation();
  const [editingProduct, setEditingProduct] = useState("");
  const { data: products = [], isLoading: productsLoading } =
    useGetProductsQuery();
  const { data: warehouses = [], isLoading: warehousesLoading } =
    useGetWarehousesQuery();
  const [addProduct] = useAddProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [currentBarcode, setCurrentBarcode] = useState(null);
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("key", "65384e0beb6c45b817d791e806199b7e");

    try {
      const response = await axios.post(
        "https://api.imgbb.com/1/upload",
        formData
      );
      const url = response.data.data.url;
      setImageUrl(url);
      message.success("Rasm muvaffaqiyatli yuklandi!");
    } catch (error) {
      console.error("Yuklashda xatolik:", error);
      message.error("Rasmni yuklashda xatolik yuz berdi.");
    }
  };
  const printRef = useRef();

  useEffect(() => {
    if (currentBarcode) {
      handlePrint();
    }
  }, [currentBarcode]);

  const handleAddProduct = () => {
    const newBarcode = generateBarcode();
    setCurrentBarcode(newBarcode);
    setModalVisible(true);
    form.setFieldsValue({ barcode: generateBarcode() });
  };

  const handleCancel = () => {
    setModalVisible(false);
    setImageUrl("");
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      values.image_url = imageUrl
      const total_kg = Number(values.total_kg).toFixed(2);
      values.kg_per_box = (total_kg / Number(values.box_quantity)).toFixed(2);
      values.kg_per_package = (total_kg / Number(values.package_quantity)).toFixed(2);
      values.kg_per_quantity = (total_kg / Number(values.quantity)).toFixed(2);
      if (editingProduct) {
        await editProduct({
          id: editingProduct,
          data: values,
        });
      } else {
        await addProduct(values).unwrap();
      }
      form.resetFields();
      setEditingProduct("");
      setModalVisible(false);
      setImageUrl("");
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

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => setCurrentBarcode(""), // Clear barcode after printing
  });

  const columns = [
    {
      title: "Tovar",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          {record.image_url ? (
            <img
              src={record.image_url}
              alt={record.name}
              style={{ width: "50px", height: "50px", marginRight: "10px", objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                width: "50px",
                height: "50px",
                marginRight: "10px",
                backgroundColor: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              No Image
            </div>
          )}
          <span>{record.name}</span>
        </div>
      ),
    },
    {
      title: "Kod",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "O'lcham",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "Umumiy vazni(kg)",
      dataIndex: "total_kg",
      key: "total_kg",
    },
    {
      title: "Dona soni",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Karobka soni",
      dataIndex: "box_quantity",
      key: "box_quantity",
    },
    {
      title: "Pachka soni",
      dataIndex: "package_quantity",
      key: "package_quantity",
    },
    {
      title: "Valyuta",
      dataIndex: "currency",
      key: "currency",
    },
    {
      title: "Tan narxi",
      dataIndex: "purchasePrice",
      key: "purchasePrice",
      render: (text, record) => `${record.purchasePrice?.value}`,
    },
    {
      title: "Sotish narxi",
      dataIndex: "sellingPrice",
      key: "sellingPrice",
      render: (text, record) => `${record.sellingPrice?.value}`,
    },
    {
      title: "Ombor",
      dataIndex: "warehouse",
      key: "warehouse",
      render: (text, record) => record?.warehouse?.name,
    },
    {
      title: "Shtrix kod",
      dataIndex: "barcode",
      key: "barcode",
    },
    {
      title: "Kategoriya",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Amallar",
      render: (_, record) => (
        <div className="table_actions">
          <Button
            type="primary"
            onClick={() => {
              setEditingProduct(record._id);
              form.setFieldsValue({ ...record, barcode: record.barcode });
              setImageUrl(record.image_url);
              setModalVisible(true);
            }}
          >
            <MdEdit />
          </Button>
          <Popconfirm
            title="Mahsulotni o'chirmoqchimisiz"
            onCancel={() => { }}
            onConfirm={() => deleteProduct(record._id)}
            okText="O'chirish"
            cancelText="Orqaga"
          >
            <Button type="primary">
              <MdDeleteForever />
            </Button>
          </Popconfirm>
          <Button
            type="primary"
            onClick={() => setCurrentBarcode(record.barcode)}
          >
            <MdPrint />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page_header">
        <Button
          type="primary"
          onClick={handleAddProduct}
          style={{ marginBottom: 16 }}
        >
          Tovar qo'shish
        </Button>
        <div className="stats">
          <p>
            Umumiy tovar soni: {products.reduce((a, b) => a + b.quantity, 0)}
          </p>
          <p>
            Umumiy tovar tan narxi (sum):{" "}
            {products
              .filter((p) => p.currency === "SUM")
              .reduce(
                (acc, product) =>
                  acc + product.quantity * product.purchasePrice.value,
                0
              )
              .toLocaleString()}{" "}
            so'm
          </p>
          <p>
            Umumiy tovar tan narxi ($):{" "}
            {products
              .filter((p) => p.currency === "USD")
              .reduce(
                (acc, product) =>
                  acc + product.quantity * product.purchasePrice.value,
                0
              )
              .toLocaleString()}
            $
          </p>
        </div>
      </div>

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
            <Input placeholder="Tovar nomi" />
          </Form.Item>
          <Form.Item
            name="size"
            rules={[{ required: true, message: "O'lchamni kiriting" }]}
          >
            <Input placeholder="O'lcham" type="text" />
          </Form.Item>
          <Form.Item
            name="code"
            rules={[{ required: true, message: "Mahsulot kodini kiriting" }]}
          >
            <Input placeholder="Kod" type="text" />
          </Form.Item>
          <Form.Item name={["purchasePrice", "value"]}>
            <Input placeholder="Tan narxi" />
          </Form.Item>
          <Form.Item name={["sellingPrice", "value"]}>
            <Input placeholder="Sotish narxi" />
          </Form.Item>
          {/* <div style={{ marginBottom: "6px", width: "100%", display: "flex", alignItems: "start", justifyContent: "space-between" }}>
            <Select placeholder="O'lchov birlik" style={{ width: "150px" }} onChange={(value) => setOption1(value)} value={option1}>
              <Option value="kg_quantity">Kilogram</Option>
              <Option value="quantity">Dona</Option>
              <Option value="box_quantity">Karobka</Option>
              <Option value="package_quantity">Pachka</Option>
            </Select>
            <Form.Item
              name={option1}
            >
              <Input placeholder="Miqdor" />
            </Form.Item>
          </div>
          <div style={{ marginBottom: "6px", width: "100%", display: "flex", alignItems: "start", justifyContent: "space-between" }}>
            <Select placeholder="O'lchov birlik" style={{ width: "150px" }} onChange={(value) => setOption2(value)} value={option2}>
              <Option value="kg_quantity">Kilogram</Option>
              <Option value="quantity">Dona</Option>
              <Option value="box_quantity">Karobka</Option>
              <Option value="package_quantity">Pachka</Option>
            </Select>
            <Form.Item
              name={option2}
            >
              <Input placeholder="Miqdor" />
            </Form.Item>
          </div>
          <div style={{ marginBottom: "6px", width: "100%", display: "flex", alignItems: "start", justifyContent: "space-between" }}>
            <Select placeholder="O'lchov birlik" style={{ width: "150px" }} onChange={(value) => setOption3(value)} value={option3}>
              <Option value="kg_quantity">Kilogram</Option>
              <Option value="quantity">Dona</Option>
              <Option value="box_quantity">Karobka</Option>
              <Option value="package_quantity">Pachka</Option>
            </Select>
            <Form.Item
              name={option3}
            >
              <Input placeholder="Miqdor" />
            </Form.Item>
          </div>
          <div style={{ marginBottom: "6px", width: "100%", display: "flex", alignItems: "start", justifyContent: "space-between" }}>
            <Select placeholder="O'lchov birlik" style={{ width: "150px" }} onChange={(value) => setOption4(value)} value={option4}>
              <Option value="kg_quantity">Kilogram</Option>
              <Option value="quantity">Dona</Option>
              <Option value="box_quantity">Karobka</Option>
              <Option value="package_quantity">Pachka</Option>
            </Select>
            <Form.Item
              name={option4}
            >
              <Input placeholder="Miqdor" />
            </Form.Item>
          </div> */}
          <Form.Item name={"total_kg"}>
            <Input placeholder="Umumiy vazni(kg)" />
          </Form.Item>
          <Form.Item name={"quantity"}>
            <Input placeholder="Dona miqdori" />
          </Form.Item>
          <Form.Item name={"package_quantity"}>
            <Input placeholder="Pachka miqdori" />
          </Form.Item>
          <Form.Item name={"quantity_per_package"}>
            <Input placeholder="1 pachkadagi dona miqdori" />
          </Form.Item>
          <Form.Item name={"box_quantity"}>
            <Input placeholder="Karobka miqdori" />
          </Form.Item>
          <Form.Item name={"package_quantity_per_box"}>
            <Input placeholder="1 karobkadagi pachka miqdori" />
          </Form.Item>
          {/* <Form.Item
            name="currency"
          >
            <Select
              placeholder="O'lchov birlik"
              style={{ width: "150px" }}
              onChange={(value) => setOption1(value)}
              value={option1}
            >
              <Option value="kg_quantity">Kilogram</Option>
              <Option value="quantity">Dona</Option>
              <Option value="box_quantity">Karobka</Option>
              <Option value="package_quantity">Pachka</Option>
            </Select>
            <Form.Item name={option1}>
              <Input placeholder="Miqdor" />
            </Form.Item> */}
          {/* </div>
          <div
            style={{
              marginBottom: "6px",
              width: "100%",
              display: "flex",
              alignItems: "start",
              justifyContent: "space-between",
            }}
          >
            <Select
              placeholder="O'lchov birlik"
              style={{ width: "150px" }}
              onChange={(value) => setOption2(value)}
              value={option2}
            >
              <Option value="kg_quantity">Kilogram</Option>
              <Option value="quantity">Dona</Option>
              <Option value="box_quantity">Karobka</Option>
              <Option value="package_quantity">Pachka</Option>
            </Select>
            <Form.Item name={option2}>
              <Input placeholder="Miqdor" />
            </Form.Item>
          </div>
          <div
            style={{
              marginBottom: "6px",
              width: "100%",
              display: "flex",
              alignItems: "start",
              justifyContent: "space-between",
            }}
          >
            <Select
              placeholder="O'lchov birlik"
              style={{ width: "150px" }}
              onChange={(value) => setOption3(value)}
              value={option3}
            >
              <Option value="kg_quantity">Kilogram</Option>
              <Option value="quantity">Dona</Option>
              <Option value="box_quantity">Karobka</Option>
              <Option value="package_quantity">Pachka</Option>
            </Select>
            <Form.Item name={option3}>
              <Input placeholder="Miqdor" />
            </Form.Item>
          </div>
          <div
            style={{
              marginBottom: "6px",
              width: "100%",
              display: "flex",
              alignItems: "start",
              justifyContent: "space-between",
            }}
          >
            <Select
              placeholder="O'lchov birlik"
              style={{ width: "150px" }}
              onChange={(value) => setOption4(value)}
              value={option4}
            >
              <Option value="kg_quantity">Kilogram</Option>
              <Option value="quantity">Dona</Option>
              <Option value="box_quantity">Karobka</Option>
              <Option value="package_quantity">Pachka</Option>
            </Select>
            <Form.Item name={option4}>
              <Input placeholder="Miqdor" />
            </Form.Item>
          </div> */}

          <Form.Item name="currency">
            <Select placeholder="Valyuta tanlash">
              <Option value="">Keyin kiritish</Option>
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
            <Select placeholder="Ombor tanlash" loading={warehousesLoading}>
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
            <Input placeholder="Kategoriya" />
          </Form.Item>
          <Form.Item name="barcode" hidden>
            <Input />
          </Form.Item>
          <Upload
            customRequest={({ file }) => handleUpload(file)}
            showUploadList={false}
          >
            <Button>
              <FaUpload /> Rasmni tanlash
            </Button>
          </Upload>
          <Form.Item>
            {imageUrl && (
              <div style={{ marginTop: 20 }}>
                <p>Yuklangan rasm:</p>
                <img src={imageUrl} alt="Uploaded" style={{ width: 200 }} />
                <p>
                  <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                    Rasm URL manzili
                  </a>
                </p>
              </div>
            )}
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Tovar qo'shish
            </Button>
          </Form.Item>
        </Form >
      </Modal >

      <div style={{ display: "none" }}>
        <BarcodePrint ref={printRef} barcode={currentBarcode} />
      </div>
    </div >
  );
};

export default Product;
