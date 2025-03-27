import React, { useEffect, useState } from "react";
import { useGetProductsQuery } from "../../context/service/product.service";
import { useGetProductsPartnerQuery } from "../../context/service/partner.service";
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
import { useGetPromosQuery } from "../../context/service/promo.service";
import { useNavigate } from "react-router-dom";
import {
  useAddExpenseMutation,
  useGetExpensesQuery,
} from "../../context/service/expense.service";
import moment from "moment";
import html2pdf from "html2pdf.js";
import yodgor_abdullaev from "../../assets/yodgor_abdullaev.svg";
import zolotayaroza77 from "../../assets/zolotayaroza77.svg";

const { Option } = Select;

const Kassa = () => {
  const { data: products = [] } = useGetProductsQuery();
  const { data: partnerProducts = [] } = useGetProductsPartnerQuery();
  const { data: promos = [] } = useGetPromosQuery();
  const { data: usdRate = {} } = useGetUsdRateQuery(); // Предполагаем, что usdRate = { rate: 13000 }
  const { data: clients = [] } = useGetClientsQuery();
  const { data: expenses = [] } = useGetExpensesQuery();
  const [createClient] = useCreateClientMutation();
  const [createDebt] = useCreateDebtMutation();
  const [addExpense] = useAddExpenseMutation();
  const [sellProduct] = useSellProductMutation();
  const [categories, setCategories] = useState([]);
  const [form] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [xarajatModal, setXarajatModal] = useState(false);
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [codeSearchText, setCodeSearchText] = useState("");
  const [basket, setBasket] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDiscount, setPaymentDiscount] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [currency, setCurrency] = useState("SUM");
  const [selectedUnit, setSelectedUnit] = useState("quantity");

  // Объединяем продукты из Product и Partner
  const allProducts = [
    ...products.map((product) => ({
      ...product,
      source: "product",
      name: product.name || "Noma'lum",
      barcode: product.barcode || "",
      code: product.code || "",
    })),
    ...partnerProducts.map((product) => ({
      ...product,
      source: "partner",
      name: product.name || "Noma'lum",
      barcode: product.barcode || "",
      code: product.code || "",
    })),
  ];

  useEffect(() => {
    const uniqueCategories = [...new Set(expenses.map((expense) => expense.category))];
    setCategories(uniqueCategories);
  }, [expenses]);

  useEffect(() => {
    const result = allProducts.filter((product) => {
      const name = (product.name || "").toLowerCase();
      const code = (product.code || "").toLowerCase();
      const barcode = (product.barcode || "").toLowerCase();
      const searchLower = searchText.toLowerCase();
      const codeSearchLower = codeSearchText.toLowerCase();

      const matchesSearchText = name.includes(searchLower) || barcode.includes(searchLower);
      const matchesCodeSearch = code.includes(codeSearchLower);

      if (searchText && codeSearchText) {
        return matchesSearchText && matchesCodeSearch;
      }
      return matchesSearchText || matchesCodeSearch;
    });
    setFilteredProducts((searchText || codeSearchText) ? result : []);
  }, [allProducts, searchText, codeSearchText]);

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

  // Функция для пересчёта цены при смене валюты
  const convertPrice = (price, fromCurrency, toCurrency, rate) => {
    if (fromCurrency === toCurrency) return price;
    if (fromCurrency === "USD" && toCurrency === "SUM") {
      return price * rate;
    }
    if (fromCurrency === "SUM" && toCurrency === "USD") {
      return price / rate;
    }
    return price;
  };

  // Форматирование числа без лишних нулей
  const formatNumber = (num) => {
    return Number(num).toString(); // Убираем .00, но сохраняем дробную часть, если она есть
  };

  // Генерация PDF чека с помощью html2pdf.js
  const generatePDF = () => {
    const { totalUSD, totalSUM } = basket.reduce(
      (acc, item) => {
        const promo = promos.find((p) => p._id === paymentDiscount);
        const totalPrice =
          item.sellingPrice.value *
          (selectedUnit === "quantity"
            ? item.quantity
            : selectedUnit === "package_quantity"
              ? item.quantity * item.quantity_per_package
              : selectedUnit === "box_quantity"
                ? item.quantity * item.quantity_per_package * item.package_quantity_per_box
                : null);
        const discountedPrice = promo
          ? promo.type === "percent"
            ? totalPrice - (totalPrice / 100) * promo.percent
            : totalPrice - promo.percent
          : totalPrice;

        if (item.currency === "USD") {
          acc.totalUSD += discountedPrice;
        } else {
          acc.totalSUM += discountedPrice;
        }
        return acc;
      },
      { totalUSD: 0, totalSUM: 0 }
    );

    const tableRows = basket
      .map((item, index) => {
        const promo = promos.find((p) => p._id === paymentDiscount);
        const totalPrice =
          item.sellingPrice.value *
          (selectedUnit === "quantity"
            ? item.quantity
            : selectedUnit === "package_quantity"
              ? item.quantity * item.quantity_per_package
              : selectedUnit === "box_quantity"
                ? item.quantity * item.quantity_per_package * item.package_quantity_per_box
                : null);
        const discountedPrice = promo
          ? promo.type === "percent"
            ? totalPrice - (totalPrice / 100) * promo.percent
            : totalPrice - promo.percent
          : totalPrice;

        return `
        <tr>
          <td>${index + 1}</td>
          <td>${item.name}</td>
          <td>${item.size || "-"}</td>
          <td>${item.code || "-"}</td>
          <td>${selectedUnit === "quantity"
            ? item.quantity
            : selectedUnit === "package_quantity"
              ? item.quantity * item.quantity_per_package
              : selectedUnit === "box_quantity"
                ? item.quantity * item.quantity_per_package * item.package_quantity_per_box
                : null
          }</td>
          <td>${formatNumber(item.sellingPrice.value)}</td>
          <td>${item.currency === "USD" ? "Доллар" : "Сум"}</td>
          <td>${promo ? `${promo.percent} ${promo.type === "percent" ? "%" : "сум"}` : "—"}</td>
          <td>${formatNumber(discountedPrice)}</td>
        </tr>
      `;
      })
      .join("");

    const content = `
      <div style="width:210mm; height:297mm; display:flex; flex-direction:column; gap:6px; padding:12px; font-family:sans-serif">
        <div style="display:flex; justify-content:space-between; width:100%;">
          <b>${moment().format("DD.MM.YYYY, HH:mm:ss")} даги Хисобварак-фактура</b>
          <span>Хисобварак-фактура</span>
        </div>
        <div style="display:flex; width:100%;">
          <div style="display:flex; flex-direction:column; gap:6px; width:50%;">
            <div style="display:flex; flex-direction:column; width:100%; justify-content:space-between;">
              <b>Етказиб берувчи:</b>
              <p>"BANKERSUZ GROUP" MCHJ</p>
            </div>
            <div style="display:flex; flex-direction:column; width:100%; justify-content:space-between">
              <b>Манзил:</b>
              <p>ГОРОД ТАШКEНТ УЛИЦА НАВОИЙ 16-А</p>
            </div>
          </div>
          <div>
            <div style="display:flex; flex-direction:column; width:100%; justify-content:space-between">
              <b>Сотиб олувчи:</b>
              <p>${clientName || "Noma'lum"}</p>
            </div>
            <div style="display:flex; flex-direction:column; width:100%; justify-content:space-between">
              <b>Манзил:</b>
              <p>${clientAddress || "Noma'lum"}</p>
            </div>
          </div>
        </div>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <td>No</td>
              <td>Махсулот номи</td>
              <td>Улчам</td>
              <td>Код</td>
              <td>Миқдор</td>
              <td>Нарх</td>
              <td>Валюта</td>
              <td>Чегирма</td>
              <td>Умумий сумма</td>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <b>Жами тўловнинг доллар билан тўланадиган қисми: ${formatNumber(totalUSD)} доллар</b>
        <b>Жами тўловнинг сyм билан тўланадиган қисми: ${formatNumber(totalSUM)} сyм</b>
        <div style="display: flex; justify-content: space-around; margin-top: 20px;">
          <div style="text-align: center;">
            <img src="${yodgor_abdullaev}" style="width: 100px; height: 100px; border-radius: 10px; background: white; padding: 10px;" />
            <p style="margin: 5px 0; font-size: 12px; color: #000;">@YODGOR_ABDULLAE</p>
          </div>
          <div style="text-align: center;">
            <img src="${zolotayaroza77}" style="width: 100px; height: 100px; border-radius: 10px; background: white; padding: 10px;" />
            <p style="margin: 5px 0; font-size: 12px; color: #000;">@ZOLOTAYAROZA77</p>
          </div>
        </div>
      </div>
    `;

    const element = document.createElement("div");
    element.innerHTML = content;
    document.body.appendChild(element);

    const opt = {
      margin: 0,
      filename: `invoice_${moment().format("DD-MM-YYYY_HH-mm-ss")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        document.body.removeChild(element);
        const pdfBlob = pdf.output("bloburl");
        const printWindow = window.open(pdfBlob);
        printWindow.onload = () => {
          printWindow.print();
        };
      })
      .catch((error) => {
        console.error("Ошибка при генерации PDF:", error);
        document.body.removeChild(element);
      });
  };

  // Колонки для таблицы продуктов
  const productsColumn = [
    {
      title: "Tovar",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {record.image_url ? (
            <img
              src={record.image_url}
              alt={record.name}
              style={{ width: "100px", height: "100px", marginRight: "10px", objectFit: "contain" }}
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
              Rasm yo'q
            </div>
          )}
          <span>{record.name}</span>
        </div>
      ),
    },
    { title: "O'lcham", dataIndex: "size", key: "size" },
    { title: "Ombor", render: (_, record) => record.warehouse?.name || "-" },
    { title: "Shtrix kod", dataIndex: "barcode", key: "barcode" },
    { title: "Kod", dataIndex: "code", key: "code" },
    {
      title: "Umumiy vazni(kg)",
      dataIndex: "total_kg",
      key: "total_kg",
      render: (text) => formatNumber(text),
    },
    { title: "Dona soni", dataIndex: "quantity", key: "quantity" },
    {
      title: "Karobka soni",
      dataIndex: "box_quantity",
      key: "box_quantity",
      render: (text) => formatNumber(text),
    },
    {
      title: "Pachka soni",
      key: "package_quantity",
      render: (_, record) => (record?.isPackage ? formatNumber(record?.package_quantity) : "-"),
    },
    {
      title: "Sotish narxi",
      render: (_, record) => {
        const price = record.sellingPrice?.value || 0;
        const productCurrency = record.currency || "SUM";
        const convertedPrice = convertPrice(price, productCurrency, currency, usdRate?.rate);
        return `${formatNumber(convertedPrice)} ${currency === "SUM" ? "сум" : "$"}`;
      },
    },
    {
      title: "Amallar",
      render: (_, record) => (
        <Button
          onClick={() => {
            const existProduct = basket.find((item) => item._id === record._id);
            if (!existProduct) {
              const price = record.sellingPrice?.value || 0;
              const productCurrency = record.currency || "SUM";
              setBasket([
                ...basket,
                {
                  ...record,
                  quantity: 1,
                  currency: currency, // Текущая валюта в момент добавления
                  originalPrice: {
                    value: price,
                    currency: productCurrency, // Исходная валюта продукта
                  },
                  sellingPrice: {
                    value: convertPrice(price, productCurrency, currency, usdRate?.rate),
                    currency: currency,
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
    {
      title: "Tovar",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {record.image_url ? (
            <img
              src={record.image_url}
              alt={record.name}
              style={{ width: "100px", height: "100px", marginRight: "10px", objectFit: "contain" }}
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
              Rasm yo'q
            </div>
          )}
          <span>{record.name}</span>
        </div>
      ),
    },
    { title: "Ombor", render: (_, record) => record.warehouse?.name || "-" },
    { title: "Shtrix kod", dataIndex: "barcode" },
    {
      title: "Soni",
      render: (_, record) => (
        <div
          className="table_actions"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <Button
            onClick={() => {
              const newBasket = basket.map((item) => {
                if (item._id === record._id) {
                  const newQuantity = item.quantity - 1;
                  if (newQuantity === 0) {
                    return null; // Если количество становится 0, исключаем элемент
                  }
                  return { ...item, quantity: newQuantity };
                }
                return item;
              }).filter((item) => item !== null); // Удаляем элементы, где quantity стало 0
              setBasket(newBasket);
            }}
          >
            -
          </Button>
          <span style={{ width: "20px", textAlign: "center" }}>{record.quantity}</span>
          <Button
            onClick={() => {
              const newBasket = basket.map((item) => {
                if (item._id === record._id) {
                  return { ...item, quantity: item.quantity + 1 };
                }
                return item;
              });
              setBasket(newBasket);
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
          onChange={(value) => {
            const newBasket = basket.map((item) => {
              if (item._id === record._id) {
                const convertedPrice = convertPrice(
                  item.originalPrice.value,
                  item.originalPrice.currency,
                  value,
                  usdRate?.rate
                );
                return {
                  ...item,
                  currency: value,
                  sellingPrice: {
                    ...item.sellingPrice,
                    value: convertedPrice,
                    currency: value,
                  },
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
      ),
    },
    {
      title: "Sotish narxi",
      render: (_, record) => (
        <div>
          <Input
            style={{ width: "100px" }}
            type="number"
            onChange={(e) => {
              const newPrice = parseFloat(e.target.value) || 0;
              const newBasket = basket.map((item) => {
                if (item._id === record._id) {
                  return {
                    ...item,
                    sellingPrice: {
                      ...item.sellingPrice,
                      value: newPrice,
                    },
                    originalPrice: {
                      value: convertPrice(newPrice, item.currency, item.originalPrice.currency, usdRate?.rate),
                      currency: item.originalPrice.currency,
                    },
                  };
                }
                return item;
              });
              setBasket(newBasket);
            }}
            value={record?.sellingPrice?.value}
          />
          <span style={{ marginLeft: "5px" }}>{record.currency === "SUM" ? "сум" : "$"}</span>
        </div>
      ),
    },
    {
      title: "O'lchov birlik",
      render: (_, record) => (
        <Select
          style={{ width: "100px" }}
          required
          onChange={(value) => setSelectedUnit(value)}
          value={selectedUnit}
          placeholder="Tanlang"
        >
          <Select.Option value="quantity">Dona</Select.Option>
          <Select.Option disabled={!record.isPackage} value="package_quantity">
            Pachka
          </Select.Option>
          <Select.Option value="box_quantity">Karobka</Select.Option>
        </Select>
      ),
    },
    {
      title: "Amallar",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => setBasket(basket.filter((item) => item._id !== record._id))}
        >
          <MdDeleteForever />
        </Button>
      ),
    },
  ];

  const handleSell = async () => {
    generatePDF();
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

      const promo = promos.find((p) => p._id === paymentDiscount);
      const getDiscountedPrice = (price, quantity) => {
        if (!promo) return price;
        return promo.type === "percent"
          ? price - (price * promo.percent) / 100
          : (price * quantity - promo.percent) / quantity;
      };

      if (paymentMethod === "credit") {
        await Promise.all(
          basket.map((item) =>
            createDebt({
              clientId,
              productId: item._id,
              quantity:
                selectedUnit === "quantity"
                  ? item.quantity
                  : selectedUnit === "package_quantity"
                    ? item.quantity * item.quantity_per_package
                    : selectedUnit === "box_quantity"
                      ? item.quantity * item.quantity_per_package * item.package_quantity_per_box
                      : null,
              unit: selectedUnit,
              totalAmount:
                getDiscountedPrice(
                  item.sellingPrice.value,
                  selectedUnit === "quantity"
                    ? item.quantity
                    : selectedUnit === "package_quantity"
                      ? item.quantity * item.quantity_per_package
                      : selectedUnit === "box_quantity"
                        ? item.quantity * item.quantity_per_package * item.package_quantity_per_box
                        : null
                ) *
                (selectedUnit === "quantity"
                  ? item.quantity
                  : selectedUnit === "package_quantity"
                    ? item.quantity * item.quantity_per_package
                    : selectedUnit === "box_quantity"
                      ? item.quantity * item.quantity_per_package * item.package_quantity_per_box
                      : null),
              currency: item.currency,
              sellingPrice: getDiscountedPrice(
                item.sellingPrice.value,
                selectedUnit === "quantity"
                  ? item.quantity
                  : selectedUnit === "package_quantity"
                    ? item.quantity * item.quantity_per_package
                    : selectedUnit === "box_quantity"
                      ? item.quantity * item.quantity_per_package * item.package_quantity_per_box
                      : null
              ),
              paymentMethod,
              warehouseId: item.warehouse?._id,
              discount: paymentDiscount ? promos.find((p) => p._id === paymentDiscount).percent : 0,
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
              unit: selectedUnit,
              currency: item.currency,
              discount: paymentDiscount ? promos.find((p) => p._id === paymentDiscount).percent : 0,
              quantity:
                selectedUnit === "quantity"
                  ? item.quantity
                  : selectedUnit === "package_quantity"
                    ? item.quantity * item.quantity_per_package
                    : selectedUnit === "box_quantity"
                      ? item.quantity * item.quantity_per_package * item.package_quantity_per_box
                      : null,
              sellingPrice: getDiscountedPrice(
                item.sellingPrice.value,
                selectedUnit === "quantity"
                  ? item.quantity
                  : selectedUnit === "package_quantity"
                    ? item.quantity * item.quantity_per_package
                    : selectedUnit === "box_quantity"
                      ? item.quantity * item.quantity_per_package * item.package_quantity_per_box
                      : null
              ),
              warehouseId: item.warehouse?._id,
              paymentMethod,
            }).unwrap()
          )
        );
      }

      setIsModalVisible(false);
      setBasket([]);
      setPaymentMethod("");
      setSelectedClient("");
      setClientName("");
      setClientPhone("");
      setClientAddress("");
      setDueDate(null);
      message.success("Sotuv amalga oshirildi");
    } catch (error) {
      message.error("Xatolik yuz berdi");
      console.error("Sell error:", error);
    }
  };

  return (
    <div className="page" style={{ marginTop: "8px", paddingInline: "4px" }}>
      <div className="products">
        <div className="products_header" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Input
            autoFocus
            type="search"
            placeholder="Tovarni nomi yoki shtrix kodi orqali topish"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ flex: 1, minWidth: "200px" }}
          />
          <Input
            type="search"
            placeholder="Kod orqali qidirish"
            value={codeSearchText}
            onChange={(e) => setCodeSearchText(e.target.value)}
            style={{ flex: 1, minWidth: "200px" }}
          />
          <Select value={currency} onChange={(value) => setCurrency(value)} style={{ width: "100px" }}>
            <Option value="SUM">SUM</Option>
            <Option value="USD">USD</Option>
          </Select>
          <Button
            style={{ justifySelf: "end", display: "flex" }}
            type="primary"
            onClick={() => navigate("/debtors")}
          >
            Qarzdorlar
          </Button>
          <Button
            style={{ justifySelf: "end", display: "flex" }}
            type="primary"
            onClick={() => setXarajatModal(true)}
          >
            Xarajat qo'shish
          </Button>
        </div>
        <Table
          size="small"
          style={{ overflow: "auto", minWidth: "100%", maxHeight: "100%" }}
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
            style={{ overflow: "auto", minWidth: "100%", maxHeight: "100%" }}
            pagination={{ pageSize: 5 }}
            columns={basketColumn}
            dataSource={basket}
            rowKey="_id"
          />
          <p>
            Umumiy to'lov SUM:{" "}
            {formatNumber(
              basket
                .reduce(
                  (acc, item) => {
                    const totalPrice =
                      item.sellingPrice.value *
                      (selectedUnit === "quantity"
                        ? item.quantity
                        : selectedUnit === "package_quantity"
                          ? item.quantity * item.quantity_per_package
                          : selectedUnit === "box_quantity"
                            ? item.quantity * item.quantity_per_package * item.package_quantity_per_box
                            : null);
                    const promo = promos.find((p) => p._id === paymentDiscount);
                    const discountedPrice = promo
                      ? promo.type === "percent"
                        ? totalPrice - (totalPrice / 100) * promo.percent
                        : totalPrice - promo.percent
                      : totalPrice;
                    return acc + (item.currency === "SUM" ? discountedPrice : convertPrice(discountedPrice, "USD", "SUM", usdRate?.rate));
                  },
                  0
                )
            )}{" "}
            so'm
          </p>
          <p>
            Umumiy to'lov USD:{" "}
            {formatNumber(
              basket
                .reduce(
                  (acc, item) => {
                    const totalPrice =
                      item.sellingPrice.value *
                      (selectedUnit === "quantity"
                        ? item.quantity
                        : selectedUnit === "package_quantity"
                          ? item.quantity * item.quantity_per_package
                          : selectedUnit === "box_quantity"
                            ? item.quantity * item.quantity_per_package * item.package_quantity_per_box
                            : null);
                    const promo = promos.find((p) => p._id === paymentDiscount);
                    const discountedPrice = promo
                      ? promo.type === "percent"
                        ? totalPrice - (totalPrice / 100) * promo.percent
                        : totalPrice - promo.percent
                      : totalPrice;
                    return acc + (item.currency === "USD" ? discountedPrice : convertPrice(discountedPrice, "SUM", "USD", usdRate?.rate));
                  },
                  0
                )
            )}{" "}
            $
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
        <Form form={categoryForm} onFinish={handleAddCategory} layout="vertical">
          <Form.Item name="category" label="Kategoriya nomi" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Qo'shish
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="Rasxod qo'shish" visible={xarajatModal} onCancel={handleCancel} footer={null}>
        <Form form={form} onFinish={handleAdd} layout="vertical">
          <Form.Item name="amount" label="Miqdor" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="date" label="Sana" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="category" label="Kategoriya" rules={[{ required: true }]}>
            <Select
              placeholder="Kategoriyani tanlang"
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: 8 }}>
                    <Button type="link" onClick={() => setIsCategoryModalVisible(true)}>
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
        <Form style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
          <p style={{ margin: "0" }}>To'lov usuli</p>
          <Form.Item rules={[{ required: true, message: "To'lov usulini tanlang" }]}>
            <Select value={paymentMethod} onChange={(value) => setPaymentMethod(value)}>
              <Select.Option value="cash">Naqd</Select.Option>
              <Select.Option value="card">Plastik karta</Select.Option>
              <Select.Option value="credit">Qarz</Select.Option>
            </Select>
          </Form.Item>
          <p style={{ margin: "0" }}>Promokod</p>
          <Form.Item>
            <Select value={paymentDiscount} onChange={(value) => setPaymentDiscount(value)}>
              <Select.Option value={0}>Promokodsiz</Select.Option>
              {promos.map((item) => (
                <Select.Option key={item._id} value={item._id}>
                  {item.code}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <p style={{ margin: "0" }}>Haridor</p>
          <Form.Item>
            <Select
              showSearch
              value={selectedClient}
              onChange={(value) => {
                setSelectedClient(value);
                const client = clients.find((c) => c._id === value);
                setClientAddress(client?.address || "");
                setClientPhone(client?.phone || "");
                setClientName(client?.name || "");
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
          </Form.Item>
          {selectedClient === "" && (
            <>
              <p style={{ margin: "0" }}>Mijoz ismi</p>
              <Form.Item rules={[{ required: true, message: "Mijoz ismini kiriting" }]}>
                <Input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Mijoz ismi"
                />
              </Form.Item>
              <p style={{ margin: "0" }}>Telefon raqami</p>
              <Form.Item rules={[{ required: true, message: "Telefon raqamini kiriting" }]}>
                <Input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Telefon raqami"
                />
              </Form.Item>
              <p style={{ margin: "0" }}>Manzili</p>
              <Form.Item rules={[{ required: true, message: "Manzili kiriting" }]}>
                <Input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Manzili"
                />
              </Form.Item>
            </>
          )}
          {paymentMethod === "credit" && (
            <>
              <p style={{ margin: "0" }}>Qarz muddati</p>
              <Form.Item rules={[{ required: true, message: "Qarz muddatini kiriting" }]}>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Kassa;