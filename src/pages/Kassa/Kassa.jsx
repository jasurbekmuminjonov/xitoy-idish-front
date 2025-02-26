import React, { useEffect, useState } from "react";
import { useGetProductsQuery } from "../../context/service/product.service";
import { Button, Input, Table, Modal, Select, Form, message } from "antd";
import "./kassa.css";
import { MdDeleteForever } from "react-icons/md";
import { useSellProductMutation } from "../../context/service/sales.service";
import { useGetUsdRateQuery } from "../../context/service/usd.service";

const Kassa = () => {
  const { data: products = [] } = useGetProductsQuery();
  const { data: usdRate = [] } = useGetUsdRateQuery();
  console.log(usdRate);

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [basket, setBasket] = useState([]);
  const [saleProduct] = useSellProductMutation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  useEffect(() => {
    const result = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchText.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchText.toLowerCase())
    );
    if (searchText) {
      setFilteredProducts(result);
    } else {
      setFilteredProducts([]);
    }
  }, [products, searchText]);

  console.log(usdRate);

  const productsColumn = [
    { title: "Tovar nomi", dataIndex: "name", key: "name" },
    { title: "Ombor", render: (_, record) => record.warehouse.name },
    { title: "Shtrix kod", dataIndex: "barcode" },
    { title: "Soni", dataIndex: "quantity" },
    {
      title: "Sotish narxi",
      render: (_, record) =>
        record.currency === "USD"
          ? record.sellingPrice.value * usdRate.rate
          : record.sellingPrice.value,
    },
    {
      title: "Amallar",
      render: (_, record) => (
        <Button
          onClick={() => {
            const existProduct = basket.find((item) => item._id === record._id);
            if (!existProduct) {
              setBasket([
                ...basket,
                {
                  ...record,
                  quantity: 1,
                  sellingPrice: {
                    value:
                      record.currency === "USD"
                        ? record.sellingPrice.value * usdRate.rate
                        : record.sellingPrice.value,
                  },
                },
              ]);
            } else {
              existProduct.quantity += 1;
              setBasket([...basket]);
            }
          }}
          type="primary"
        >
          Tanlash
        </Button>
      ),
    },
  ];

  const basketColumn = [
    { title: "Tovar nomi", dataIndex: "name", key: "name" },
    { title: "Ombor", render: (_, record) => record.warehouse.name },
    { title: "Shtrix kod", dataIndex: "barcode" },
    {
      title: "Soni",
      render: (_, record) => (
        <div className="table_actions">
          <Button
            onClick={() => {
              record.quantity -= 1;
              if (record.quantity === 0) {
                setBasket(basket.filter((item) => item._id !== record._id));
              } else {
                setBasket([...basket]);
              }
            }}
          >
            -
          </Button>
          <span style={{ width: "20px", textAlign: "center" }}>
            {record.quantity}
          </span>
          <Button
            onClick={() => {
              record.quantity += 1;
              setBasket([...basket]);
            }}
          >
            +
          </Button>
        </div>
      ),
    },
    {
      title: "Sotish narxi",
      render: (_, record) => (
        <Input
          style={{ width: "100px" }}
          type="text"
          onChange={(e) => {
            const newBasket = basket.map((item) => {
              if (item._id === record._id) {
                return {
                  ...item,
                  sellingPrice: {
                    ...item.sellingPrice,
                    value: parseFloat(e.target.value) || 0,
                  },
                };
              }
              return item;
            });
            setBasket(newBasket);
          }}
          defaultValue={record.sellingPrice.value}
        />
      ),
    },
    {
      title: "Amallar",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() =>
            setBasket(basket.filter((item) => item._id !== record._id))
          }
        >
          <MdDeleteForever />
        </Button>
      ),
    },
  ];

  const handleSell = () => {
    if (!paymentMethod || !clientName || !clientPhone || !clientAddress) {
      message.error("Barcha maydonlarni to'ldirishingiz kerak!");
      return;
    }
    basket.forEach((item) => {
      saleProduct({
        productId: item._id,
        quantity: item.quantity,
        warehouseId: item.warehouse._id,
        paymentMethod: paymentMethod,
        clientName: clientName,
        clientPhone: clientPhone,
        clientAddress: clientAddress,
      });
    });
    setIsModalVisible(false);
    setBasket([]);
    setPaymentMethod("");
    setClientName("");
    setClientPhone("");
    setClientAddress("");
    message.success("Sotuv amalga oshirildi");
  };

  return (
    <div className="page">
      <div className="products">
        <div className="products_header">
          <input
            autoFocus
            type="search"
            placeholder="Tovarni nomi yoki shtrix kodi orqali topish"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Table
          size="small"
          style={{ maxHeight: "100%" }}
          pagination={{ pageSize: 4 }}
          columns={productsColumn}
          dataSource={filteredProducts}
          rowKey="id"
        />
      </div>
      {basket.length > 0 && (
        <div className="basket">
          <Table
            size="small"
            style={{ maxHeight: "100%" }}
            pagination={{ pageSize: 5 }}
            columns={basketColumn}
            dataSource={basket}
            rowKey="id"
          />
          <p>
            Umumiy to'lov:{" "}
            {basket
              .reduce(
                (acc, item) => acc + item.sellingPrice.value * item.quantity,
                0
              )
              .toLocaleString()}
          </p>
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            Sotish
          </Button>
        </div>
      )}

      <Modal
        title="To'lov va mijoz ma'lumotlarini kiritish"
        open={isModalVisible}
        onOk={handleSell}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form>
          <Form.Item
            label="To'lov usuli"
            rules={[{ required: true, message: "To'lov usulini tanlang" }]}
          >
            <Select
              value={paymentMethod}
              onChange={(value) => setPaymentMethod(value)}
            >
              <Select.Option value="cash">Naqd</Select.Option>
              <Select.Option value="card">Plastik karta</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Mijoz ismi"
            rules={[{ required: true, message: "Mijoz ismini kiriting" }]}
          >
            <Input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Mijoz ismi"
            />
          </Form.Item>
          <Form.Item
            label="Telefon "
            rules={[{ required: true, message: "Telefon raqamini kiriting" }]}
          >
            <Input
              type="text"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Telefon raqami"
            />
          </Form.Item>
          <Form.Item
            label="Manzili"
            rules={[{ required: true, message: "Manzilini kiriting" }]}
          >
            <Input
              type="text"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Manzili"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Kassa;
