import React, { useState } from "react";
import { Table, Button, message, Modal, Input } from "antd";
import {
  useGetAllDebtorsQuery,
  usePayDebtMutation,
} from "../../context/service/debt.service";
import { EyeOutlined } from "@ant-design/icons";

const Debtors = () => {
  const { data: debtors = [] } = useGetAllDebtorsQuery();
  const [payDebt] = usePayDebtMutation();
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const handlePayDebt = async (debtId) => {
    try {
      await payDebt({ id: debtId, amount: paymentAmount }).unwrap();
      message.success("Qarz muvaffaqiyatli to'landi");
      setIsModalVisible(false);
    } catch (error) {
      message.error("Qarz to'lashda xatolik yuz berdi");
    }
  };

  const debtorsColumn = [
    {
      title: "Mijoz ismi",
      dataIndex: ["clientId", "name"],
      key: "clientId.name",
    },
    {
      title: "Telefon raqami",
      dataIndex: ["clientId", "phone"],
      key: "clientId.phone",
    },
    {
      title: "Manzil",
      dataIndex: ["clientId", "address"],
      key: "clientId.address",
    },
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
      render: (_, record) => (
        <div>
          {record.status === "pending" && (
            <Button
              type="primary"
              onClick={() => {
                setSelectedDebtor(record);
                setIsModalVisible(true);
              }}
            >
              To'lash
            </Button>
          )}
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedDebtor(record);
              setIsHistoryModalVisible(true);
            }}
          >
            Tarix
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1>Qarzdorlar</h1>
      <Table columns={debtorsColumn} dataSource={debtors} rowKey="_id" />
      <Modal
        title="Qarz to'lash"
        visible={isModalVisible}
        onOk={() => handlePayDebt(selectedDebtor._id)}
        onCancel={() => setIsModalVisible(false)}
      >
        <Input
          type="number"
          placeholder="To'lov miqdorini kiriting"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
        />
      </Modal>
      <Modal
        title="To'lovlar tarixi"
        visible={isHistoryModalVisible}
        onCancel={() => setIsHistoryModalVisible(false)}
        footer={null}
      >
        <Table
          columns={[
            {
              title: "To'lov miqdori",
              dataIndex: "amount",
              key: "amount",
            },
            {
              title: "To'lov sanasi",
              dataIndex: "date",
              key: "date",
              render: (date) => new Date(date).toLocaleString(),
            },
          ]}
          dataSource={selectedDebtor ? selectedDebtor.paymentHistory : []}
          rowKey={(record) => record.date}
        />
      </Modal>
    </div>
  );
};

export default Debtors;
