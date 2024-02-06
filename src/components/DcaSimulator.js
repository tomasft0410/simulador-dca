import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Line } from "react-chartjs-2";
import { getHistoricalPrices } from "../services/budaApi";
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineController,
  PointElement,
  LineElement,
} from "chart.js";
Chart.register(
  CategoryScale,
  LinearScale,
  LineController,
  PointElement,
  LineElement
);

const DcaSimulator = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [monthlyTrades, setMonthlyTrades] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const pair = "btc-clp";
      const currentDate = new Date(endDate);
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      const monthlyTradesList = [];

      for (let i = 0; i < 12; i++) {
        const targetDate = new Date(
          currentYear,
          currentMonth - i,
          1,
          12,
          0,
          0,
          0
        );
        const startTimestamp = targetDate.getTime();
        const endTimestamp = startTimestamp - 60 * 60 * 24 * 7;

        try {
          const historicalTrades = await getHistoricalPrices(
            pair,
            startTimestamp,
            endTimestamp
          );

          if (historicalTrades.length > 0) {
            const firstBuyTrade = historicalTrades.find(
              (trade) => trade[3] === "buy"
            );

            if (firstBuyTrade) {
              const timestamp = new Date(parseFloat(firstBuyTrade[0]));
              const timestamp_formatted = `${("0" + timestamp.getDate()).slice(
                -2
              )}/${("0" + (timestamp.getMonth() + 1)).slice(
                -2
              )}/${timestamp.getFullYear()} - ${(
                "0" + timestamp.getHours()
              ).slice(-2)}:${("0" + timestamp.getMinutes()).slice(-2)}:${(
                "0" + timestamp.getSeconds()
              ).slice(-2)}`;

              const price = parseFloat(firstBuyTrade[2]);
              const price_formatted = price.toLocaleString("es-CL", {
                style: "currency",
                currency: "CLP",
              });

              const firstBuyTradeOfMonth = {
                timestamp: timestamp_formatted,
                volume: parseFloat(firstBuyTrade[1]),
                price: firstBuyTrade[2],
                type: firstBuyTrade[3],
                transactionId: firstBuyTrade[4],
              };

              monthlyTradesList.push(firstBuyTradeOfMonth);
            }
          }
        } catch (error) {
          console.error("Error fetching historical prices:", error);
        }
      }

      monthlyTradesList.sort((b, a) => b.timestamp - a.timestamp);
      monthlyTradesList.reverse();
      setLoading(false);
      setMonthlyTrades(monthlyTradesList);
    };

    fetchData();
  }, [startDate, endDate]);

  const handleStartDateChange = (date) => {
    setStartDate(date);
    const newEndDate = new Date(date);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    setEndDate(newEndDate);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    const newStartDate = new Date(date);
    newStartDate.setFullYear(newStartDate.getFullYear() - 1);
    setStartDate(newStartDate);
  };

  const calculateMonthlyGains = () => {
    let totalInvestment = 0;
    const gains = [];

    monthlyTrades.forEach((trade) => {
      totalInvestment += investmentAmount;

      const currentPrice = parseFloat(trade.price.replace(/[^\d.-]/g, ""));
      const currentInvestment = investmentAmount * trade.volume;
      const currentGain =
        currentInvestment *
        (currentPrice /
          parseFloat(monthlyTrades[0].price.replace(/[^\d.-]/g, "")) -
          1);

      gains.push({
        timestamp: trade.timestamp,
        totalInvestment: totalInvestment + currentGain,
        gain: currentGain,
        gainPercentage: (currentGain / totalInvestment) * 100,
        originalPrice: parseFloat(trade.price.replace(/[^\d.-]/g, "")),
      });
    });

    return gains;
  };

  const monthlyGains = calculateMonthlyGains();

  // Combinar ambos conjuntos de datos en el gráfico
  const combinedChartData = {
    labels: monthlyGains.map((gain) => gain.timestamp),
    datasets: [
      {
        label: "Precio Original",
        data: monthlyTrades.map((trade) =>
          parseFloat(trade.price.replace(/[^\d.-]/g, ""))
        ),
        fill: false,
        borderColor: "rgba(75,192,192,1)",
        lineTension: 0.1,
      },
      {
        label: "Ganancia",
        data: monthlyGains.map((gain) => gain.totalInvestment.toFixed(2)),
        fill: false,
        borderColor: "rgba(255,99,132,1)", // Puedes ajustar el color según tus preferencias
        lineTension: 0.1,
      },
    ],
  };

  const tableHeaderStyle = {
    border: "1px solid #dddddd",
    padding: "8px",
    backgroundColor: "#f2f2f2",
  };

  const tableRowStyle = {
    border: "1px solid #dddddd",
    padding: "8px",
  };

  const tableCellStyle = {
    border: "1px solid #dddddd",
    padding: "8px",
  };

  return (
    <div>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        DCA Simulator
      </h1>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <div style={{ marginRight: "20px" }}>
          <label>Inicio:</label>
          <DatePicker selected={startDate} onChange={handleStartDateChange} />
        </div>
        <div style={{ marginRight: "20px" }}>
          <label>Fin:</label>
          <DatePicker selected={endDate} onChange={handleEndDateChange} />
        </div>
        <div>
          <label>Monto de Inversión Mensual (CLP):</label>
          <input
            type="number"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(parseInt(e.target.value))}
          />
        </div>
      </div>
      {loading && <p style={{ textAlign: "center" }}>Cargando...</p>}
      {error && <p style={{ textAlign: "center", color: "red" }}>{error}</p>}
      {monthlyTrades.length > 0 && !loading && (
        <>
          <div
            style={{
              textAlign: "center",
              margin: "20px",
              border: "1px solid #ddd",
              padding: "10px",
            }}
          >
            <h2 style={{ marginBottom: "10px" }}>Gráfico de Ganancias</h2>
            <Line data={combinedChartData} />
            <p style={{ marginTop: "10px" }}></p>
          </div>
          <h2
            style={{
              textAlign: "center",
              marginTop: "20px",
              marginBottom: "10px",
            }}
          >
            Tabla de Ganancias
          </h2>
          <table
            style={{
              borderCollapse: "collapse",
              width: "80%", // Cambia el porcentaje según tus necesidades
              margin: "20px 10%", // Centra la tabla con 'auto' y agrega márgenes arriba y abajo
              fontFamily: "Arial, sans-serif",
              border: "1px solid #dddddd",
            }}
          >
            <thead style={{ backgroundColor: "#f2f2f2" }}>
              <tr>
                <th style={tableHeaderStyle}>Fecha</th>
                <th style={tableHeaderStyle}>Bitcoin Precio</th>
                <th style={tableHeaderStyle}>Monto Invertido</th>
                <th style={tableHeaderStyle}>Valor del Portafolio</th>
                <th style={tableHeaderStyle}>Cambio Σ</th>
                <th style={tableHeaderStyle}>Cambio %</th>
              </tr>
            </thead>
            <tbody>
              {monthlyGains.map((gain) => (
                <tr key={gain.timestamp} style={tableRowStyle}>
                  <td style={tableCellStyle}>{gain.timestamp}</td>
                  <td style={tableCellStyle}>
                    {gain.originalPrice.toFixed(2)}
                  </td>
                  <td style={tableCellStyle}>{investmentAmount.toFixed(2)}</td>
                  <td style={tableCellStyle}>
                    {gain.totalInvestment.toFixed(2)}
                  </td>
                  <td style={tableCellStyle}>{gain.gain.toFixed(2)}</td>
                  <td style={tableCellStyle}>
                    {gain.gainPercentage.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default DcaSimulator;
