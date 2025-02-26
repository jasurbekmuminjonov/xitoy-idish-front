import React, { useState } from "react";
import { Table, Button, Modal, message } from "antd";
import { UserOutlined, EyeOutlined, DollarOutlined } from "@ant-design/icons";
import {
  useGetClientsQuery,
  useGetClientHistoryQuery,
} from "../../context/service/client.service";
import {
  useGetDebtsByClientQuery,
  usePayDebtMutation,
} from "../../context/service/debt.service";

const Client = () => {
  const { data: clients = [] } = useGetClientsQuery();
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDebtModalVisible, setIsDebtModalVisible] = useState(false);
  const { data: clientHistory = [] } = useGetClientHistoryQuery(
    selectedClient?._id,
    {
      skip: !selectedClient,
    }
  );
  const { data: debts = [] } = useGetDebtsByClientQuery(selectedClient?._id, {
    skip: !selectedClient,
  });
  const [payDebt] = usePayDebtMutation();

  const handlePayDebt = async (debtId) => {
    try {
      await payDebt({
        id: debtId,
        amount: debts.find((debt) => debt._id === debtId).remainingAmount,
      }).unwrap();
      message.success("Qarz muvaffaqiyatli to'landi");
    } catch (error) {
      message.error("Qarz to'lashda xatolik yuz berdi");
    }
  };

  const clientColumns = [
    {
      title: "Ismi",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span>
          <UserOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      ),
    },
    { title: "Telefon raqami", dataIndex: "phone", key: "phone" },
    { title: "Manzil", dataIndex: "address", key: "address" },
    {
      title: "Amallar",
      render: (_, record) => {
        const hasPendingDebts = debts.some(
          (debt) => debt.clientId === record._id && debt.status === "pending"
        );

        return (
          <div>
            <Button
              onClick={() => {
                setSelectedClient(record);
                setIsModalVisible(true);
              }}
            >
              <EyeOutlined /> Ko'rish
            </Button>
            <Button
              style={{
                marginLeft: 8,
                backgroundColor: hasPendingDebts ? "red" : "",
              }}
              onClick={() => {
                setSelectedClient(record);
                setIsDebtModalVisible(true);
              }}
            >
              <DollarOutlined /> Qarzlar
            </Button>
          </div>
        );
      },
    },
  ];

  const historyColumns = [
    {
      title: "Tovar nomi",
      dataIndex: ["productId", "name"],
      key: "productId.name",
    },
    {
      title: "Ombor",
      dataIndex: ["warehouseId", "name"],
      key: "warehouseId.name",
    },
    { title: "Soni", dataIndex: "quantity", key: "quantity" },
    {
      title: "Sotish narxi",
      dataIndex: ["productId", "sellingPrice", "value"],
      key: "productId.sellingPrice.value",
    },
    { title: "To'lov usuli", dataIndex: "paymentMethod", key: "paymentMethod" },
    { title: "Sotish sanasi", dataIndex: "saleDate", key: "saleDate" },
  ];

  const debtColumns = [
    {
      title: "Tovar nomi",
      dataIndex: ["productId", "name"],
      key: "productId.name",
    },
    { title: "Soni", dataIndex: "quantity", key: "quantity" },
    { title: "Umumiy summa", dataIndex: "totalAmount", key: "totalAmount" },
    {
      title: "Qoldiq summa",
      dataIndex: "remainingAmount",
      key: "remainingAmount",
    },
    { title: "Qarz muddati", dataIndex: "dueDate", key: "dueDate" },
    {
      title: "Holati",
      dataIndex: "status",
      key: "status",
      render: (status) => (status === "paid" ? "To'langan" : "To'lanmagan"),
    },
    {
      title: "Amallar",
      render: (_, record) =>
        record.status === "pending" && (
          <Button type="primary" onClick={() => handlePayDebt(record._id)}>
            To'lash
          </Button>
        ),
    },
  ];

  return (
    <div>
      <h1>Clientlar</h1>
      <Table columns={clientColumns} dataSource={clients} rowKey="_id" />
      <Modal
        title="Client tarixi"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={1440}
      >
        <h2>{selectedClient?.name}ning tarixi</h2>
        <Table
          columns={historyColumns}
          dataSource={clientHistory?.sales}
          rowKey="_id"
        />
      </Modal>
      <Modal
        title="Client qarzlari"
        visible={isDebtModalVisible}
        onCancel={() => setIsDebtModalVisible(false)}
        footer={null}
        width={1440}
      >
        <h2>{selectedClient?.name}ning qarzlari</h2>
        <Table columns={debtColumns} dataSource={debts} rowKey="_id" />
      </Modal>
    </div>
  );
};

export default Client;
