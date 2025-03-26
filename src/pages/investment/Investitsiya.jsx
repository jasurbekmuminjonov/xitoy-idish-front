import React from "react";
import { Card, Space, Divider } from "antd";
import { useGetWarehousesQuery } from "../../context/service/ombor.service";
import { useGetProductsByWarehouseQuery } from "../../context/service/product.service";
import { useGetUsdRateQuery } from "../../context/service/usd.service";
import { useGetSalesHistoryQuery } from "../../context/service/sotuv.service";
import { useGetAllDebtorsQuery } from "../../context/service/debt.service";
import { useGetProductsQuery } from "../../context/service/product.service";
import { useGetExpensesQuery } from "../../context/service/expense.service";
import { DollarOutlined, ShoppingCartOutlined, CreditCardOutlined, CalendarOutlined, RiseOutlined, HomeOutlined } from "@ant-design/icons";
import moment from "moment";
import "./investment.css";

const cardGradients = [
     "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
     "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
     "linear-gradient(135deg, #f3e7e9 0%, #e3eeff 100%)",
     "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
     "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
];

// Компонент для карточки склада
const WarehouseCard = ({ ombor, usdRate, sales, index }) => {
     const { data: mahsulotlar = [] } = useGetProductsByWarehouseQuery(ombor._id);

     const calculateStats = (products, warehouseSales) => {
          // Расход (Xarajat) — стоимость текущих остатков на складе
          const purchaseUSD = products.reduce((sum, product) => {
               const quantity = Number(product.quantity) || 0;
               const purchaseValue = Number(product.purchasePrice?.value) || 0;
               return sum + purchaseValue * quantity;
          }, 0);

          const purchaseUZS = purchaseUSD * usdRate;

          // Прибыль (Foyda) — только на основе фактических продаж
          let profitUSD = 0;
          let profitUZS = 0;

          if (warehouseSales.length > 0) {
               profitUSD = warehouseSales.reduce((sum, sale) => {
                    const quantity = Number(sale.quantity) || 0;
                    const sellingPrice = Number(sale.sellingPrice) || 0;
                    const purchasePrice = Number(sale?.productId?.purchasePrice?.value) || 0;
                    return sum + (quantity * (sellingPrice - purchasePrice));
               }, 0);

               profitUZS = profitUSD * usdRate;
          }

          // Остаток (Jami mavjud) — вычитаем проданное количество из текущего остатка
          const totalQuantity = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
          const soldQuantity = warehouseSales.reduce((sum, sale) => sum + (Number(sale.quantity) || 0), 0);
          const remainingQuantity = totalQuantity - soldQuantity;

          // Дата — берем из sales, если есть продажи, иначе из products
          let latestDate = "Нет продаж";
          if (warehouseSales.length > 0) {
               latestDate = moment(Math.max(...warehouseSales.map(sale => new Date(sale.createdAt || Date.now())))).format("DD.MM.YYYY");
          } else if (products.length > 0) {
               latestDate = moment(Math.max(...products.map(p => new Date(p.createdAt || Date.now())))).format("DD.MM.YYYY");
          }

          return { purchaseUZS, purchaseUSD, profitUZS, profitUSD, remainingQuantity, latestDate };
     };

     const warehouseSales = sales.filter(sale => sale?.productId?.warehouse?._id === ombor._id);
     const stats = mahsulotlar.length > 0 || warehouseSales.length > 0 ? calculateStats(mahsulotlar, warehouseSales) : null;

     const cardStyle = {
          background: cardGradients[index % cardGradients.length],
          border: "none",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
     };

     return (
          <Card
               key={ombor._id}
               title={ombor.name}
               className="warehouse-card"
               style={cardStyle}
               headStyle={{ borderBottom: "none", fontSize: "20px", fontWeight: 700, color: "#333" }}
               extra={<Space></Space>}
          >
               <p className="warehouse-address"><HomeOutlined /> {ombor.address}</p>
               {stats ? (
                    <div className="warehouse-stats">
                         <div className="stat-item">
                              <p><strong><CalendarOutlined /> Sana:</strong> <span className="date">{stats.latestDate}</span></p>
                         </div>
                         <Divider style={{ margin: "10px 0", borderColor: "#e8e8e8" }} />
                         <div className="stat-item">
                              <p><strong><DollarOutlined /> Xarajat:</strong></p>
                              <p><span className="purchase">{stats.purchaseUZS.toLocaleString("uz-UZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UZS</span></p>
                              <p><span className="purchase">{stats.purchaseUSD.toFixed(2)} $</span></p>
                         </div>
                         <Divider style={{ margin: "10px 0", borderColor: "#e8e8e8" }} />
                         <div className="stat-item">
                              <p><strong><RiseOutlined /> Foyda:</strong></p>
                              <p><span className="profit">{stats.profitUZS.toLocaleString("uz-UZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UZS</span></p>
                              <p><span className="profit">{stats.profitUSD.toFixed(2)} $</span></p>
                         </div>
                         <Divider style={{ margin: "10px 0", borderColor: "#e8e8e8" }} />
                         <div className="stat-item">
                              <p><strong><ShoppingCartOutlined /> Jami (mavjud):</strong> <span className="quantity">{stats.remainingQuantity} dona</span></p>
                         </div>
                    </div>
               ) : (
                    <p className="no-data">Bu omborda mahsulotlar yo'q.</p>
               )}
          </Card>
     );
};

// Компонент для общей статистики
const SummaryCard = ({ expenses, debtors, products, sales, usdRate }) => {
     const totalExpensesUZS = expenses.reduce((total, item) => total + (Number(item.amount) || 0), 0);
     const totalExpensesUSD = totalExpensesUZS / usdRate;

     const totalDebtUZS = debtors.reduce((total, b) => {
          const quantity = Number(b.quantity) || 0;
          const sellingPrice = Number(b.sellingPrice) || 0;
          return total + quantity * sellingPrice;
     }, 0);
     const totalDebtUSD = totalDebtUZS / usdRate;

     const totalPurchaseUSD = products.reduce((total, item) => {
          const quantity = Number(item.quantity) || 0;
          const purchaseValue = Number(item.purchasePrice?.value) || 0;
          return total + purchaseValue * quantity;
     }, 0);
     const totalPurchaseUZS = totalPurchaseUSD * usdRate;

     const totalSalesProfitUSD = sales.reduce((total, b) => {
          const quantity = Number(b.quantity) || 0;
          const sellingPrice = Number(b.sellingPrice) || 0;
          const purchasePrice = Number(b?.productId?.purchasePrice?.value) || 0;
          return total + (quantity * (sellingPrice - purchasePrice));
     }, 0);
     const totalSalesProfitUZS = totalSalesProfitUSD * usdRate;

     return (
          <Card
               title="Umumiy statistika"
               className="summary-card"
               headStyle={{ borderBottom: "none", fontSize: "20px", fontWeight: 700, color: "white" }}
          >
               <div className="warehouse-stats">
                    <div className="stat-item">
                         <p><strong><DollarOutlined /> Umumiy xarajat:</strong></p>
                         <p><span className="purchase">{totalExpensesUZS.toLocaleString("uz-UZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} so'm</span></p>
                         <p><span className="purchase">{totalExpensesUSD.toFixed(2)} $</span></p>
                    </div>
                    <Divider style={{ margin: "10px 0", borderColor: "rgba(255, 255, 255, 0.2)" }} />
                    <div className="stat-item">
                         <p><strong><CreditCardOutlined /> Umumiy nasiya:</strong></p>
                         <p><span className="debt">{totalDebtUZS.toLocaleString("uz-UZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} so'm</span></p>
                         <p><span className="debt">{totalDebtUSD.toFixed(2)} $</span></p>
                    </div>
                    <Divider style={{ margin: "10px 0", borderColor: "rgba(255, 255, 255, 0.2)" }} />
                    <div className="stat-item">
                         <p><strong><ShoppingCartOutlined /> Umumiy mahsulotlar tan narxi:</strong></p>
                         <p><span className="purchase">{totalPurchaseUZS.toLocaleString("uz-UZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} so'm</span></p>
                         <p><span className="purchase">{totalPurchaseUSD.toFixed(2)} $</span></p>
                    </div>
                    <Divider style={{ margin: "10px 0", borderColor: "rgba(255, 255, 255, 0.2)" }} />
                    <div className="stat-item">
                         <p><strong><RiseOutlined /> Sotuvning sof daromadi:</strong></p>
                         <p><span className="profit">{totalSalesProfitUZS.toLocaleString("uz-UZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} so'm</span></p>
                         <p><span className="profit">{totalSalesProfitUSD.toFixed(2)} $</span></p>
                    </div>
               </div>
          </Card>
     );
};

// Основной компонент
export default function Investitsiya() {
     const { data: omborlar = [] } = useGetWarehousesQuery();
     const { data: usdRateData, isLoading: usdLoading } = useGetUsdRateQuery();
     const { data: sales = [], isLoading: salesLoading } = useGetSalesHistoryQuery();
     const { data: debtors = [], isLoading: debtorsLoading } = useGetAllDebtorsQuery();
     const { data: products = [], isLoading: productsLoading } = useGetProductsQuery();
     const { data: expenses = [], isLoading: expensesLoading } = useGetExpensesQuery();

     const usdRate = usdRateData?.rate || 12960;

     if (usdLoading || salesLoading || debtorsLoading || productsLoading || expensesLoading) {
          return <div className="loading">Yuklanmoqda...</div>;
     }

     return (
          <div className="investment-container">
               <div className="warehouse-cards">
                    <SummaryCard expenses={expenses} debtors={debtors} products={products} sales={sales} usdRate={usdRate} />
                    {omborlar.map((ombor, index) => (
                         <WarehouseCard key={ombor._id} ombor={ombor} usdRate={usdRate} sales={sales} index={index} />
                    ))}
               </div>
          </div>
     );
}