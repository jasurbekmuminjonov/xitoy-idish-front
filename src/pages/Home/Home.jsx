import React, { useState } from "react";
import { Layout, Menu, Button } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  HomeOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import Admin from "../Adminlar/Adminlar";
import Ombor from "../Ombor/Ombor";
import Product from "../Product/Product";
import Kassa from "../Kassa/Kassa";
import Adminlar from "../Adminlar/Adminlar";
// import "./Home.css";

const { Header, Sider, Content } = Layout;

export default function Home() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedPage, setSelectedPage] = useState("home");

  const toggle = () => {
    setCollapsed(!collapsed);
  };

  const renderContent = () => {
    switch (selectedPage) {
      case "admin":
        return <Admin />;
      case "ombor":
        return <Ombor />;
      case "product":
        return <Product />;
      case "kassa":
        return <Kassa />;
      case "home":
      default:
        return <h1>statistika</h1>;
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["home"]}
          selectedKeys={[selectedPage]}
          onClick={(e) => setSelectedPage(e.key)}
        >
          <Menu.Item key="home" icon={<HomeOutlined />}>
            Home
          </Menu.Item>
          <Menu.Item key="admin" icon={<UserOutlined />}>
            Adminlar
          </Menu.Item>
          <Menu.Item key="ombor" icon={<AppstoreOutlined />}>
            Omborlar
          </Menu.Item>
          <Menu.Item key="product" icon={<ShoppingOutlined />}>
            Mahsulotlar
          </Menu.Item>
          <Menu.Item key="kassa" icon={<DollarOutlined />}>
            Kassa
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: 0 }}>
          <Button type="primary" onClick={toggle} style={{ marginBottom: 16 }}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </Button>
        </Header>
        <Content
          className="site-layout-background"
          style={{
            // margin: "24px 16px",
            padding: 6,
            minHeight: 280,
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}
