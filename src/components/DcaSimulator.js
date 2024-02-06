import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getHistoricalPrices } from "../services/budaApi";

const DcaSimulator = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [data, setData] = useState({ labels: [], datasets: [] });
  const [formattedTrades, setFormattedTrades] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const pair = "btc-clp";
      const currentDate = new Date();
      const startTimestamp = currentDate.getTime() - 60 * 60 * 24 * 7;
      const endTimestamp = currentDate.getTime();

      try {
        const historicalTrades = await getHistoricalPrices(
          pair,
          startTimestamp,
          endTimestamp
        );

        const labels = historicalTrades.map(
          (entry) => new Date(entry[0] * 1000)
        );
        const datasets = [
          {
            label: "Precio de cierre",
            data: historicalTrades.map((entry) => parseFloat(entry[1])),
          },
        ];

        setData({ labels, datasets });

        const formattedTrades = historicalTrades.map((entry) => {
          const timestamp = new Date(parseFloat(entry[0]));
          const fechaFormateada = `${("0" + timestamp.getDate()).slice(-2)}/${("0" + (timestamp.getMonth() + 1)).slice(-2)}/${timestamp.getFullYear()} - ${("0" + timestamp.getHours()).slice(-2)}:${("0" + timestamp.getMinutes()).slice(-2)}:${("0" + timestamp.getSeconds()).slice(-2)}`;

          const precio = parseFloat(entry[2]);
          const precioFormateado = precio.toLocaleString("es-CL", {
            style: "currency",
            currency: "CLP",
          });
        
          return {
            timestamp: fechaFormateada,
            volume: parseFloat(entry[1]),
            price: precioFormateado,
            type: entry[3],
            transactionId: entry[4],
          };
        });
        

        console.log("Formatted Trades:", formattedTrades);
        setFormattedTrades(formattedTrades);
      } catch (error) {
        console.error("Error fetching historical prices:", error);
      }
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
      {data.labels.length > 0 && (
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
                <th style={tableHeaderStyle}>Timestamp</th>
                <th style={tableHeaderStyle}>Precio</th>
                <th style={tableHeaderStyle}>Volumen</th>
                <th style={tableHeaderStyle}>Tipo</th>
                <th style={tableHeaderStyle}>ID de Transacción</th>
              </tr>
            </thead>
            <tbody>
              {formattedTrades.map((trade) => (
                <tr key={trade.transactionId} style={tableRowStyle}>
                  <td style={tableCellStyle}>{trade.timestamp.toString()}</td>
                  <td style={tableCellStyle}>{trade.price}</td>
                  <td style={tableCellStyle}>{trade.volume}</td>
                  <td style={tableCellStyle}>{trade.type}</td>
                  <td style={tableCellStyle}>{trade.transactionId}</td>
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
