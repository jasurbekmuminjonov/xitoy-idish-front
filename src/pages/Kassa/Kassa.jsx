import React, { useEffect, useState } from "react";
import { useGetProductsQuery } from "../../context/service/product.service";
import {
  useGetClientsQuery,
  useCreateClientMutation,
} from "../../context/service/client.service";
import { Button, Input, Table, Modal, Select, Form, message } from "antd";
import "./kassa.css";
import { MdDeleteForever } from "react-icons/md";
import { useSellProductMutation } from "../../context/service/sales.service";
import { useGetUsdRateQuery } from "../../context/service/usd.service";
import { useCreateDebtMutation } from "../../context/service/debt.service";

const Kassa = () => {
  const { data: products = [] } = useGetProductsQuery();
  const { data: usdRate = [] } = useGetUsdRateQuery();
  const { data: clients = [] } = useGetClientsQuery();
  const [createClient] = useCreateClientMutation();
  const [createDebt] = useCreateDebtMutation();
  const [sellProduct] = useSellProductMutation();

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [basket, setBasket] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [dueDate, setDueDate] = useState(null);

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

  const productsColumn = [
    { title: "Tovar nomi", dataIndex: "name", key: "name" },
    { title: "Ombor", render: (_, record) => record.warehouse.name },
    { title: "Shtrix kod", dataIndex: "barcode" },
    { title: "Soni", dataIndex: "quantity" },
    {
      title: "Sotish narxi",
      render: (_, record) =>
        record.sellingPrice.currency === "USD"
          ? (record.sellingPrice.value * usdRate.rate).toFixed(2)
          : record.sellingPrice.value.toFixed(2),
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
                      record.sellingPrice.currency === "USD"
                        ? record.sellingPrice.value * usdRate.rate
                        : record.sellingPrice.value,
                    currency: record.sellingPrice.currency,
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
          defaultValue={record.sellingPrice.value.toFixed(2)}
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

  const handleSell = async () => {
    if (
      !paymentMethod ||
      !clientName ||
      !clientPhone ||
      !clientAddress ||
      (paymentMethod === "credit" && !dueDate)
    ) {
      message.error("Barcha maydonlarni to'ldirishingiz kerak!");
      return;
    }

    try {
      const clientResponse = await createClient({
        name: clientName,
        phone: clientPhone,
        address: clientAddress,
      }).unwrap();

      const clientId = clientResponse._id;

      if (paymentMethod === "credit") {
        await Promise.all(
          basket.map((item) =>
            createDebt({
              clientId,
              productId: item._id,
              quantity: item.quantity,
              totalAmount: item.sellingPrice.value * item.quantity,
              paymentMethod,
              dueDate,
            }).unwrap()
          )
        );
      } else {
        await Promise.all(
          basket.map((item) =>
            sellProduct({
              clientId,
              productId: item._id,
              quantity: item.quantity,
              warehouseId: item.warehouse._id,
              paymentMethod,
            }).unwrap()
          )
        );
      }

      setIsModalVisible(false);
      setBasket([]);
      setPaymentMethod("");
      setClientName("");
      setClientPhone("");
      setClientAddress("");
      setDueDate(null);
      message.success("Sotuv amalga oshirildi");
    } catch (error) {
      message.error("Xatolik yuz berdi");
    }
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
          rowKey="_id"
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
            rowKey="_id"
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
              <Select.Option value="credit">Qarz</Select.Option>
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
            label="Telefon raqami"
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
            rules={[{ required: true, message: "Manzili kiriting" }]}
          >
            <Input
              type="text"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Manzili"
            />
          </Form.Item>
          {paymentMethod === "credit" && (
            <Form.Item
              label="Qarz muddati"
              rules={[{ required: true, message: "Qarz muddatini kiriting" }]}
            >
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Kassa;
