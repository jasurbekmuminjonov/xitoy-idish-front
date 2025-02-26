import React, { useState } from "react";
import { Table, Button, Modal } from "antd";
import { UserOutlined, EyeOutlined } from "@ant-design/icons";
import {
  useGetClientsQuery,
  useGetClientHistoryQuery,
} from "../../context/service/client.service";

const Client = () => {
  const { data: clients = [] } = useGetClientsQuery();
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { data: clientHistory = [] } = useGetClientHistoryQuery(
    selectedClient?._id,
    {
      skip: !selectedClient,
    }
  );

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
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => {
            setSelectedClient(record);
            setIsModalVisible(true);
          }}
          icon={<EyeOutlined />}
        >
         
        </Button>
      ),
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
    </div>
  );
};

export default Client;
