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
     Switch,
     Space,
} from "antd";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import {
     useAddProductPartnerMutation,
     useGetProductsPartnerQuery,
     useDeleteProductPartnerMutation,
     useUpdateProductPartnerMutation,
} from "../../context/service/partner.service";
import { useGetWarehousesQuery } from "../../context/service/ombor.service";
import { MdEdit, MdDeleteForever, MdPrint } from "react-icons/md";
import axios from "axios";
import { FaArrowRight, FaUpload } from "react-icons/fa";
import "./partner.css";

const { Option } = Select;

const generateBarcode = () => {
     return Math.floor(100000 + Math.random() * 900000).toString();
};

const BarcodePrint = React.forwardRef(({ barcode }, ref) => (
     <div ref={ref} style={{ width: "4cm", height: "3cm" }}>
          <Barcode value={barcode} width={2} height={60} fontSize={12} />
     </div>
));

const Partner = () => {
     const [form] = Form.useForm();
     const [modalVisible, setModalVisible] = useState(false);
     const [partnerModalVisible, setPartnerModalVisible] = useState(false);
     const [selectedPartner, setSelectedPartner] = useState(null);
     const [editingProduct, setEditingProduct] = useState("");
     const { data: products = [], isLoading: productsLoading } = useGetProductsPartnerQuery();
     const { data: warehouses = [], isLoading: warehousesLoading } = useGetWarehousesQuery();
     const [addProduct] = useAddProductPartnerMutation();
     const [deleteProduct] = useDeleteProductPartnerMutation();
     const [editProduct] = useUpdateProductPartnerMutation();
     const [currentBarcode, setCurrentBarcode] = useState(null);
     const [imageUrl, setImageUrl] = useState("");
     const [isPackage, setIsPackage] = useState(true);
     const [searchName, setSearchName] = useState("");
     const [searchBarcode, setSearchBarcode] = useState("");
     const [modalSearchName, setModalSearchName] = useState("");
     const [modalSearchBarcode, setModalSearchBarcode] = useState("");

     // Группировка продуктов по партнерам
     const groupedProducts = products.reduce((acc, product) => {
          const partnerName = product.name_partner || "Noma'lum";
          if (!acc[partnerName]) {
               acc[partnerName] = [];
          }
          acc[partnerName].push(product);
          return acc;
     }, {});

     // Фильтрация партнеров по имени и штрих-коду
     const filteredPartners = Object.keys(groupedProducts).filter((partnerName) => {
          const partnerProducts = groupedProducts[partnerName];
          const matchesName = partnerProducts.some((product) =>
               product.name.toLowerCase().includes(searchName.toLowerCase())
          );
          const matchesBarcode = partnerProducts.some((product) =>
               product.barcode?.toLowerCase().includes(searchBarcode.toLowerCase())
          );
          return (searchName ? matchesName : true) && (searchBarcode ? matchesBarcode : true);
     });

     // Фильтрация продуктов внутри модала
     const filteredModalProducts = selectedPartner
          ? groupedProducts[selectedPartner].filter((product) => {
               const matchesName = product.name
                    .toLowerCase()
                    .includes(modalSearchName.toLowerCase());
               const matchesBarcode = product.barcode
                    ?.toLowerCase()
                    .includes(modalSearchBarcode.toLowerCase());
               return (modalSearchName ? matchesName : true) && (modalSearchBarcode ? matchesBarcode : true);
          })
          : [];

     const handleUpload = async (file) => {
          const formData = new FormData();
          formData.append("image", file);
          formData.append("key", "65384e0beb6c45b817d791e806199b7e");

          try {
               const response = await axios.post("https://api.imgbb.com/1/upload", formData);
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

     useEffect(() => {
          // Синхронизация глобального поиска с локальным в модале
          setModalSearchName(searchName);
          setModalSearchBarcode(searchBarcode);
     }, [searchName, searchBarcode]);

     const handleAddProduct = () => {
          setModalVisible(true);
     };

     const handleCancel = () => {
          setModalVisible(false);
          setImageUrl("");
          form.resetFields();
     };

     const onFinish = async (values) => {
          try {
               if (!editingProduct) {
                    const newBarcode = generateBarcode();
                    setCurrentBarcode(newBarcode);
                    values.barcode = newBarcode;
                    values.isPackage = isPackage;
               }
               values.image_url = imageUrl;

               const total_kg = Number(values.total_kg)?.toFixed(2);
               values.kg_per_box = (total_kg / Number(values.box_quantity))?.toFixed(2);
               values.kg_per_package = isPackage
                    ? (total_kg / Number(values.package_quantity))?.toFixed(2)
                    : null;
               values.kg_per_quantity = (total_kg / Number(values.quantity))?.toFixed(2);

               if (editingProduct) {
                    await editProduct({
                         id: editingProduct,
                         data: values,
                    }).unwrap();
                    message.success("Mahsulot muvaffaqiyatli tahrirlandi!");
               } else {
                    await addProduct(values).unwrap();
                    message.success("Mahsulot muvaffaqiyatli qo'shildi!");
               }
               form.resetFields();
               setEditingProduct("");
               setModalVisible(false);
               setImageUrl("");
          } catch (error) {
               if (error.data?.message?.includes("E11000 duplicate key error collection")) {
                    message.error("Barcode must be unique");
               } else {
                    message.error("Mahsulotni qo'shishda xatolik yuz berdi!");
                    console.error("Error:", error);
               }
          }
     };

     const handlePrint = useReactToPrint({
          content: () => printRef.current,
          onAfterPrint: () => setCurrentBarcode(""),
     });

     // Колонки для таблицы продуктов в модале
     const columns = [
          {
               title: "Tovar",
               dataIndex: "name",
               key: "name",
               render: (text, record) => (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                         {record.image_url ? (
                              <img
                                   src={record.image_url}
                                   alt={record.name}
                                   style={{
                                        width: "40px",
                                        height: "40px",
                                        objectFit: "contain",
                                        borderRadius: "6px",
                                        border: "1px solid #e5e7eb",
                                   }}
                              />
                         ) : (
                              <div
                                   style={{
                                        width: "40px",
                                        height: "40px",
                                        backgroundColor: "#f9fafb",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "6px",
                                        border: "1px solid #e5e7eb",
                                        fontSize: "12px",
                                        color: "#9ca3af",
                                   }}
                              >
                                   Rasm yo'q
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
               render: (text) => text?.toFixed(2),
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
               render: (text) => text?.toFixed(2),
          },
          {
               title: "Pachka soni",
               key: "package_quantity",
               render: (_, record) =>
                    record?.isPackage ? record?.package_quantity?.toFixed(2) : "-",
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
               render: (text, record) => `${record.purchasePrice?.value || "-"}`,
          },
          {
               title: "Sotish narxi",
               dataIndex: "sellingPrice",
               key: "sellingPrice",
               render: (text, record) => `${record.sellingPrice?.value || "-"}`,
          },
          {
               title: "Ombor",
               dataIndex: "warehouse",
               key: "warehouse",
               render: (text, record) => record?.warehouse?.name || "-",
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
                    <div className="table-actions">
                         <Button
                              className="table-action-button"
                              onClick={() => {
                                   setEditingProduct(record._id);
                                   form.setFieldsValue({
                                        ...record,
                                        barcode: record.barcode,
                                        package_quantity: record.package_quantity?.toFixed(2),
                                        box_quantity: record.box_quantity?.toFixed(2),
                                   });
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
                              <Button className="table-action-button">
                                   <MdDeleteForever />
                              </Button>
                         </Popconfirm>
                         <Button
                              className="table-action-button"
                              onClick={() => setCurrentBarcode(record.barcode)}
                         >
                              <MdPrint />
                         </Button>
                    </div>
               ),
          },
     ];

     return (
          <div className="partner-container">
               <div className="partner-page-header">
                    <Space>
                         <Button
                              type="primary"
                              onClick={handleAddProduct}
                              className="partner-add-button"
                         >
                              Tovar qo'shish
                         </Button>
                    </Space>
                    <div className="partner-stats">
                         <p>Umumiy tovar soni: {products.reduce((a, b) => a + b.quantity, 0)}</p>
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

               {/* Отображение карточек партнеров */}
               <div className="partner-list">
                    {filteredPartners.map((partnerName) => (
                         <div
                              key={partnerName}
                              className="partner-item"
                              onClick={() => {
                                   setSelectedPartner(partnerName);
                                   setPartnerModalVisible(true);
                              }}
                         >
                              <div className="partner-item-content">
                                   <h3 className="partner-item-name">{partnerName}</h3>
                                   <div className="partner-item-info">
                                        <span>{groupedProducts[partnerName].length} tovar</span>
                                        <span className="partner-dot">•</span>
                                        <span>
                                             {groupedProducts[partnerName].reduce((acc, product) => acc + product.quantity, 0)} dona
                                        </span>
                                   </div>
                              </div>
                         </div>
                    ))}
               </div>

               {/* Модал с продуктами партнера (таблица) */}
               <Modal
                    title={`Mahsulotlar - ${selectedPartner}`}
                    visible={partnerModalVisible}
                    onCancel={() => setPartnerModalVisible(false)}
                    footer={null}
                    width={1200}
                    className="partner-modal"
               >
                    <div className="modal-search">
                         <Space>
                              <Input
                                   placeholder="Tovar nomini kiriting"
                                   value={modalSearchName}
                                   onChange={(e) => setModalSearchName(e.target.value)}
                                   className="modal-search-input"
                              />
                              <Input
                                   placeholder="Shtrix kodni kiriting"
                                   value={modalSearchBarcode}
                                   onChange={(e) => setModalSearchBarcode(e.target.value)}
                                   className="modal-search-input"
                              />
                         </Space>
                    </div>
                    <Table
                         columns={columns}
                         dataSource={filteredModalProducts}
                         loading={productsLoading}
                         rowKey="_id"
                         pagination={{ pageSize: 10 }}
                         scroll={{ x: "max-content" }}
                         className="product-table"
                    />
               </Modal>

               {/* Модал для добавления/редактирования продукта */}
               <Modal
                    title={editingProduct ? "Tovar tahrirlash" : "Tovar qo'shish"}
                    visible={modalVisible}
                    onCancel={handleCancel}
                    footer={null}
                    className="partner-modal"
               >
                    <Form autoComplete="off" form={form} onFinish={onFinish} layout="vertical" className="partner-form">
                         <Form.Item
                              name="name"
                              label="Tovar nomi"
                              rules={[{ required: true, message: "Tovar nomini kiriting!" }]}
                         >
                              <Input placeholder="Tovar nomi" className="partner-form-input" />
                         </Form.Item>
                         <Form.Item
                              name="name_partner"
                              label="Xamkor ismi"
                              rules={[{ required: true, message: "Xamkor ismini kiriting!" }]}
                         >
                              <Input placeholder="Xamkor ismi" className="partner-form-input" />
                         </Form.Item>
                         <Form.Item
                              label="Tovar o'lchami"
                              name="size"
                              rules={[{ required: true, message: "O'lchamni kiriting" }]}
                         >
                              <Input placeholder="O'lcham" type="text" className="partner-form-input" />
                         </Form.Item>
                         <Form.Item
                              name="code"
                              label="Tovar kodi"
                              rules={[{ required: true, message: "Mahsulot kodini kiriting" }]}
                         >
                              <Input placeholder="Kod" type="text" className="partner-form-input" />
                         </Form.Item>
                         <Form.Item label="Tan narxi" name={["purchasePrice", "value"]}>
                              <Input placeholder="Tan narxi" type="number" className="partner-form-input" />
                         </Form.Item>
                         <Form.Item label="Sotish narxi" name={["sellingPrice", "value"]}>
                              <Input placeholder="Sotish narxi" type="number" className="partner-form-input" />
                         </Form.Item>
                         <Form.Item label="Umumiy vazni" name="total_kg">
                              <Input placeholder="Umumiy vazni(kg)" type="number" className="partner-form-input" />
                         </Form.Item>
                         <Form.Item label="Dona miqdori" name="quantity">
                              <Input placeholder="Dona miqdori" type="number" className="partner-form-input" />
                         </Form.Item>
                         <Form.Item label="Pachka miqdori" name="package_quantity">
                              <Input disabled={!isPackage} placeholder="Pachka miqdori" type="number" className="partner-form-input" />
                         </Form.Item>
                         <Form.Item label="1 pachkadagi dona miqdori" name="quantity_per_package">
                              <Input disabled={!isPackage} placeholder="1 pachkadagi dona miqdori" type="number" className="partner-form-input" />
                         </Form.Item>
                         <Form.Item label="Karobka miqdori" name="box_quantity">
                              <Input placeholder="Karobka miqdori" type="number" className="partner-form-input" />
                         </Form.Item>
                         <Form.Item label={`1 karobkadagi ${isPackage ? "pachka" : "dona"} miqdori`} name="package_quantity_per_box">
                              <Input placeholder={`1 karobkadagi ${isPackage ? "pachka" : "dona"} miqdori`} type="number" className="partner-form-input" />
                         </Form.Item>
                         <div className="partner-switch">
                              <p className="partner-switch-label">
                                   Karobka <FaArrowRight /> Dona
                              </p>
                              <Switch
                                   checked={isPackage}
                                   onChange={(checked) => setIsPackage(checked)}
                                   className="partner-switch-toggle"
                              />
                              <p className="partner-switch-label">
                                   Karobka <FaArrowRight /> Pachka <FaArrowRight /> Dona
                              </p>
                         </div>
                         <Form.Item label="Valyuta" name="currency">
                              <Select placeholder="Valyuta tanlash" className="partner-form-select">
                                   <Option value="">Keyin kiritish</Option>
                                   <Option value="USD">USD</Option>
                                   <Option value="SUM">SUM</Option>
                              </Select>
                         </Form.Item>
                         <Form.Item
                              label="Ombor"
                              name="warehouse"
                              rules={[{ required: true, message: "Ombor tanlang!" }]}
                         >
                              <Select placeholder="Ombor tanlash" loading={warehousesLoading} className="partner-form-select">
                                   {warehouses.map((warehouse) => (
                                        <Option key={warehouse._id} value={warehouse._id}>
                                             {warehouse?.name}
                                        </Option>
                                   ))}
                              </Select>
                         </Form.Item>
                         <Form.Item
                              label="Kategoriya"
                              name="category"
                              rules={[{ required: true, message: "Kategoriyani kiriting!" }]}
                         >
                              <Input placeholder="Kategoriya" className="partner-form-input" />
                         </Form.Item>
                         <Form.Item label="Barkod" name="barcode" hidden>
                              <Input />
                         </Form.Item>
                         <Upload
                              customRequest={({ file }) => handleUpload(file)}
                              showUploadList={false}
                         >
                              <Button className="partner-upload-button">
                                   <FaUpload /> Rasmni tanlash
                              </Button>
                         </Upload>
                         <Form.Item>
                              {imageUrl && (
                                   <div className="partner-upload-preview">
                                        <p>Yuklangan rasm:</p>
                                        <img src={imageUrl} alt="Uploaded" className="partner-upload-image" />
                                        <p>
                                             <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                                                  Rasm URL manzili
                                             </a>
                                        </p>
                                   </div>
                              )}
                         </Form.Item>
                         <Form.Item>
                              <Button type="primary" htmlType="submit" className="partner-submit-button">
                                   {editingProduct ? "Tahrirlash" : "Tovar qo'shish"}
                              </Button>
                         </Form.Item>
                    </Form>
               </Modal>

               <div style={{ display: "none" }}>
                    <BarcodePrint ref={printRef} barcode={currentBarcode} />
               </div>
          </div>
     );
};

export default Partner;