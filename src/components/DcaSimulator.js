import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getHistoricalPrices } from "../services/budaApi";

const DcaSimulator = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [monthlyTrades, setMonthlyTrades] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const pair = "btc-clp";
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      const monthlyTradesList = [];

      for (let i = 0; i < 12; i++) {
        // Restar i meses al mes actual
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
                price: price_formatted,
                type: firstBuyTrade[3],
                transactionId: firstBuyTrade[4],
              };

              // Agregar a la lista de trades mensuales
              monthlyTradesList.push(firstBuyTradeOfMonth);

            }
          }
        } catch (error) {
          console.error("Error fetching historical prices:", error);
        }
      }

      // Ordenar la lista por fecha ascendente
      monthlyTradesList.sort((a, b) => a.timestamp - b.timestamp);
      setLoading(false);

      // Actualizar el estado con la lista de trades mensuales
      setMonthlyTrades(monthlyTradesList);
      console.log("Monthly Trades:", monthlyTradesList);
    };

    fetchData();
  }, [startDate, endDate]);

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
      <h1>DCA Simulator</h1>
      <div>
        <label>Inicio:</label>
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
        />
      </div>
      <div>
        <label>Fin:</label>
        <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} />
      </div>
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {monthlyTrades.length > 0 && !loading && (
        <>
          <h2 style={{ textAlign: "center" }}>Tabla de Transacciones</h2>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              margin: "20px 0",
              fontFamily: "Arial, sans-serif",
              border: "1px solid #dddddd",
            }}
          >
            <thead style={{ backgroundColor: "#f2f2f2" }}>
              <tr>
                <th style={tableHeaderStyle}>Fecha</th>
                <th style={tableHeaderStyle}>Precio</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrades.map((trade) => (
                <tr key={trade.transactionId} style={tableRowStyle}>
                  <td style={tableCellStyle}>{trade.timestamp.toString()}</td>
                  <td style={tableCellStyle}>{trade.price}</td>
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
