import React, { useEffect, useState } from "react";
import { useGetProductsQuery } from "../../context/service/product.service";
import {
  useGetClientsQuery,
  useCreateClientMutation,
} from "../../context/service/client.service";
import { Button, Input, Table, Modal, Select, Form, message, AutoComplete } from "antd";
import "./kassa.css";
import { MdDeleteForever } from "react-icons/md";
import { useSellProductMutation } from "../../context/service/sales.service";
import { useGetUsdRateQuery } from "../../context/service/usd.service";
import { useCreateDebtMutation } from "../../context/service/debt.service";
import { useGetPromosQuery } from "../../context/service/promo.service";
import { useNavigate } from "react-router-dom";
import { useAddExpenseMutation, useGetExpensesQuery } from "../../context/service/expense.service";
import { useForm } from "react-hook-form";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
const { Option } = Select;

const Kassa = () => {
  const { data: products = [] } = useGetProductsQuery();
  const { data: promos = [] } = useGetPromosQuery();
  const { data: usdRate = [] } = useGetUsdRateQuery();
  const { data: clients = [] } = useGetClientsQuery();
  const { data: expenses = [] } = useGetExpensesQuery();
  const [createClient] = useCreateClientMutation();
  const [createDebt] = useCreateDebtMutation();
  const [addExpense] = useAddExpenseMutation();
  const [categories, setCategories] = useState([]);

  const [form] = Form.useForm();
  const [categoryForm] = Form.useForm();


  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [xarajatModal, setXarajatModal] = useState(false);
  const navigate = useNavigate()
  const [sellProduct] = useSellProductMutation();
  const [selectedClient, setSelectedClient] = useState("")
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [basket, setBasket] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDiscount, setPaymentDiscount] = useState(0);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [currency, setCurrency] = useState("USD");
  console.log(selectedClient);

  const generatePDF = () => {
    const client = {
      name: clientName || "Noma'lum",
      phone: clientPhone || "Noma'lum",
      address: clientAddress || "Noma'lum",
      dueDate: dueDate,
    };
    const isCredit = paymentMethod === "credit";
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Hisob faktura", 14, 10);
    doc.text(`Mijoz: ${client.name}`, 14, 20);
    doc.text(`Telefon: ${client.phone}`, 14, 30);
    doc.text(`Manzil: ${client.address}`, 14, 40);
    let startY = 50;
    if (isCredit && client.dueDate) {
      doc.text(`To'lov muddati: ${client.dueDate}`, 14, 50);
      startY = 60;
    }

    doc.text(`Sana: ${new Date().toLocaleDateString()}`, 14, startY);
    startY += 10;
    const columns = [
      "No", "Nomi", "O'lchov birligi", "O'lchami", "Soni", "Sotish narxi",
      "Chegirma", "Valyuta", "Umumiy narx"
    ];
    const rows = basket.map((item, index) => [
      index + 1,
      item.name,
      item.unit || "-",
      item.size || "-",
      item.quantity,
      item.sellingPrice.value,
      paymentDiscount || 0,
      item.currency,
      (item.sellingPrice.value - (item.sellingPrice.value * paymentDiscount / 100)) * item.quantity
    ]);
    autoTable(doc, {
      startY: startY + 10,
      head: [columns],
      body: rows,
    });

    doc.save("sotuv_cheki.pdf");
    const pdfUrl = doc.output("bloburl");
    window.open(pdfUrl, "_blank");
  };



  useEffect(() => {
    const uniqueCategories = [
      ...new Set(expenses.map((expense) => expense.category)),
    ];
    setCategories(uniqueCategories);
  }, [expenses]);
  const handleCancel = () => {
    setXarajatModal(false);
    form.resetFields();
  };

  const handleAdd = async (values) => {
    await addExpense(values);
    setXarajatModal(false);
    form.resetFields();
  };

  const handleAddCategory = (values) => {
    setCategories([...categories, values.category]);
    setIsCategoryModalVisible(false);
    categoryForm.resetFields();
  };

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
      render: (_, record) => {
        if (currency === record.currency) {
          return record.sellingPrice.value?.toFixed(2);
        } else if (currency === "SUM" && record.currency === "USD") {
          return (record.sellingPrice.value * usdRate.rate?.toFixed(2));
        } else if (currency === "USD" && record.currency === "SUM") {
          return (record.sellingPrice.value / usdRate.rate)?.toFixed(2);
        }
        return Number(record.sellingPrice.value)?.toFixed(2);
      }
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
                      record.sellingPrice?.currency === "USD"
                        ? record.sellingPrice?.value * usdRate?.rate
                        : record.sellingPrice?.value,
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
      title: "Sotish valyutasi",
      render: (_, record) => (
        <Select
          value={record.currency}
          defaultValue={record.currency}
          onChange={(value) => {
            const newBasket = basket.map((item) => {
              if (item._id === record._id) {
                return {
                  ...item,
                  currency: value,
                  sellingPrice: {
                    ...item.sellingPrice,
                    value:
                      value === item.currency
                        ? parseFloat(item.sellingPrice?.value || "0")
                        : value === "SUM" && item.currency === "USD"
                          ? (parseFloat(item.sellingPrice?.value || "0") * usdRate.rate)
                          : value === "USD" && item.currency === "SUM"
                            ? (parseFloat(item.sellingPrice?.value || "0") / usdRate.rate)
                            : parseFloat(item.sellingPrice?.value || "0")

                  }
                };


              }
              return item;
            });

            setBasket(newBasket);
          }}
        >
          <Option value="USD">USD</Option>
          <Option value="SUM">SUM</Option>
        </Select>
      )
    },
    {
      title: "Sotish narxi",
      render: (_, record) => (
        <Input
          style={{ width: "100px" }}
          type="number"
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
          value={Number(record?.sellingPrice?.value)?.toFixed(2)}
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
    generatePDF()
    if (
      !paymentMethod ||
      (!selectedClient && (!clientName || !clientPhone || !clientAddress)) ||
      (paymentMethod === "credit" && !dueDate)
    ) {
      message.error("Barcha maydonlarni to'ldirishingiz kerak!");
      return;
    }
    try {
      let clientId = selectedClient;

      if (!selectedClient) {
        const clientResponse = await createClient({
          name: clientName,
          phone: clientPhone,
          address: clientAddress,
        }).unwrap();
        clientId = clientResponse._id;
      }

      if (paymentMethod === "credit") {
        await Promise.all(
          basket.map((item) =>
            createDebt({
              clientId,
              productId: item._id,
              quantity: item.quantity,
              totalAmount: (item.sellingPrice.value - (item.sellingPrice.value * paymentDiscount / 100)) * item.quantity,
              currency: item.currency,
              sellingPrice: item.sellingPrice.value - (item.sellingPrice.value * paymentDiscount / 100)?.toFixed(2),
              paymentMethod,
              warehouseId: item.warehouse._id,

              discount: paymentDiscount,
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
              currency: item.currency,
              discount: paymentDiscount,
              quantity: item.quantity,
              sellingPrice: item.sellingPrice.value - (item.sellingPrice.value * paymentDiscount / 100)?.toFixed(2),
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

  console.log(basket);

  return (
    <div className="page" style={{ marginTop: "8px", paddingInline: "4px" }}>
      <div className="products">
        <div className="products_header">

          <input
            autoFocus
            type="search"
            placeholder="Tovarni nomi yoki shtrix kodi orqali topish"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select value={currency} onChange={(value) => setCurrency(value)}>
            <Option value="SUM">SUM</Option>
            <Option value="USD">USD</Option>
          </Select>
          <Button style={{ justifySelf: "end", display: "flex" }} type="primary" onClick={() => navigate("/debtors")}>
            Qarzdorlar
          </Button>
          <Button style={{ justifySelf: "end", display: "flex" }} type="primary" onClick={() => setXarajatModal(true)}>
            Xarajat qo'shish
          </Button>
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
            Umumiy to'lov SUM:{" "}
            {basket.filter(b => b.currency === "SUM")
              .reduce(
                (acc, item) => acc + item.sellingPrice.value * item.quantity,
                0
              )
              .toLocaleString()} so'm
          </p>
          <p>
            Umumiy to'lov USD:{" "}
            {basket.filter(b => b.currency === "USD")
              .reduce(
                (acc, item) => acc + item.sellingPrice.value * item.quantity,
                0
              ).toFixed(2)
              .toLocaleString()}$
          </p>
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            Sotish
          </Button>
        </div>
      )}
      <Modal
        title="Yangi kategoriya qo'shish"
        visible={isCategoryModalVisible}
        onCancel={() => setIsCategoryModalVisible(false)}
        footer={null}
      >
        <Form
          form={categoryForm}
          onFinish={handleAddCategory}
          layout="vertical"
        >
          <Form.Item
            name="category"
            label="Kategoriya nomi"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Qo'shish
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Rasxod qo'shish"
        visible={xarajatModal}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} onFinish={handleAdd} layout="vertical">
          <Form.Item name="amount" label="Miqdor" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="date" label="Sana" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item
            name="category"
            label="Kategoriya"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Kategoriyani tanlang"
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: 8,
                    }}
                  >
                    <Button
                      type="link"
                      onClick={() => setIsCategoryModalVisible(true)}
                    >
                      Yangi kategoriya qo'shish
                    </Button>
                  </div>
                </>
              )}
            >
              {categories.map((category, index) => (
                <Option key={index} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Tavsif">
            <Input />
          </Form.Item>
          <Form.Item name="paidTo" label="To'langan shaxs">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Qo'shish
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="To'lov va mijoz ma'lumotlarini kiritish"
        open={isModalVisible}
        onOk={handleSell}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form style={{ display: "flex", flexDirection: 'column', gap: "0px" }}>
          <p style={{ margin: "0" }}>
            To'lov usuli
          </p>
          <Form.Item
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
          <p style={{ margin: "0" }}>Promokod</p>
          <Form.Item >
            <Select
              value={paymentDiscount}
              onChange={(value) => setPaymentDiscount(value)}
            >
              <Select.Option value={0}>Promokodsiz</Select.Option>
              {
                promos.map((item) => (
                  <Select.Option key={item._id} value={item.percent}>{item.code}</Select.Option>
                ))
              }
            </Select>
          </Form.Item>
          <p style={{ margin: "0" }}>Haridor</p>
          <Form.Item>
            <Select
              showSearch
              value={selectedClient}
              onChange={(value) => {
                setSelectedClient(value); const client = clients.find(c => c._id === value)
                setClientAddress(client.address)
                setClientPhone(client.phone)
                setClientName(client.name)
              }}
              placeholder="Haridorni tanlang"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              <Select.Option value="">Yangi haridor</Select.Option>
              {clients.map((client) => (
                <Select.Option key={client._id} value={client._id}>
                  {client.name}
                </Select.Option>
              ))}
            </Select>
            <Form.Item />
            {
              selectedClient === "" && (
                <>
                  <p style={{ margin: "0" }}>Mijoz ismi</p>
                  <Form.Item
                    rules={[{ required: true, message: "Mijoz ismini kiriting" }]}
                  >
                    <Input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Mijoz ismi"
                    />
                  </Form.Item>
                  <p style={{ margin: "0" }}>
                    Telefon raqami
                  </p>
                  <Form.Item

                    rules={[{ required: true, message: "Telefon raqamini kiriting" }]}
                  >
                    <Input
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Telefon raqami"
                    />
                  </Form.Item>
                  <p style={{ margin: "0" }}>Manzili</p>
                  <Form.Item

                    rules={[{ required: true, message: "Manzili kiriting" }]}
                  >
                    <Input
                      type="text"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="Manzili"
                    />
                  </Form.Item>
                </>
              )
            }
          </Form.Item>

          {paymentMethod === "credit" && (
            <>
              <p style={{ margin: "0" }}>Qarz muddati</p>
              <Form.Item
                rules={[{ required: true, message: "Qarz muddatini kiriting" }]}
              >
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div >
  );
};

export default Kassa;
