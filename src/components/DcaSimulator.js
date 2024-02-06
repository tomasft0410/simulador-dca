import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Line } from "react-chartjs-2";
import { getHistoricalPrices } from "../services/budaApi";
import styled from "styled-components";

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
  const defaultStartDate = new Date(); // Define la fecha de inicio predeterminada
  const defaultEndDate = new Date(); // Define la fecha de fin predeterminada
  defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 2); // Establece la fecha de fin predeterminada como un año después

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const [loading, setLoading] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState(1000000);
  const [monthlyTrades, setMonthlyTrades] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const pair = "btc-clp";
      const currentDate = new Date(endDate);
      const startDateObj = new Date(startDate);
      const currentYear = currentDate.getFullYear();
      const startYear = startDateObj.getFullYear();
      const currentMonth = currentDate.getMonth();
      const startMonth = startDateObj.getMonth();

      const monthlyTradesList = [];

      for (let y = startYear; y <= currentYear; y++) {
        const startMonthLoop = y === startYear ? startMonth : 0;
        const endMonthLoop = y === currentYear ? currentMonth : 11;

        for (let m = startMonthLoop; m <= endMonthLoop; m++) {
          const targetDate = new Date(y, m, 1, 12, 0, 0, 0);
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
                const timestamp_formatted = `${(
                  "0" + timestamp.getDate()
                ).slice(-2)}/${("0" + (timestamp.getMonth() + 1)).slice(
                  -2
                )}/${timestamp.getFullYear()}
                `;

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
      }

      monthlyTradesList.sort((b, a) => b.timestamp - a.timestamp);
      // monthlyTradesList.reverse();
      setLoading(false);
      setMonthlyTrades(monthlyTradesList);
    };

    fetchData();
  }, [startDate, endDate]);

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const calculateMonthlyGains = () => {
    let totalInvestment = 0;
    const gains = [];

    monthlyTrades.forEach((trade, index) => {
      const currentPrice = parseFloat(trade.price.replace(/[^\d.-]/g, ""));
      const currentInvestment = investmentAmount;

      totalInvestment += currentInvestment;

      // Calcular currentGain usando la fórmula proporcionada
      const currentGain =
        totalInvestment *
        ((currentPrice -
          parseFloat(monthlyTrades[0].price.replace(/[^\d.-]/g, ""))) /
          parseFloat(monthlyTrades[0].price.replace(/[^\d.-]/g, "")));

      gains.push({
        timestamp: trade.timestamp,
        totalInvestment: totalInvestment + currentGain,
        gain: currentGain,
        gainPercentage: (currentGain / totalInvestment) * 100,
        originalPrice: parseFloat(trade.price.replace(/[^\d.-]/g, "")),
        accumulatedInvestment: totalInvestment, // Nuevo campo para monto invertido acumulado
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
        label: "Bitcoin Precio",
        data: monthlyTrades.map((trade) =>
          parseFloat(trade.price.replace(/[^\d.-]/g, ""))
        ),
        fill: false,
        borderColor: "rgba(75,192,192,1)",
        lineTension: 0.1,
      },
      {
        label: "Ganancia Acumulada",
        data: monthlyGains.map((gain) => gain.totalInvestment.toFixed(2)),
        fill: false,
        borderColor: "rgba(255,99,132,1)",
        lineTension: 0.1,
      },
    ],
  };

  const tableStyle = {
    borderCollapse: "collapse",
    width: "80%",
    maxWidth: "100%", // Establecer un ancho máximo deseado
    margin: "20px auto", // Centrar la tabla
    fontFamily: "Arial, sans-serif",
    border: "1px solid #dddddd",
    borderRadius: "5px",
    overflowX: "auto", // Agregar desplazamiento horizontal
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Agregar sombra para resaltar la tabla
  };

  const tableHeaderStyle = {
    border: "1px solid #dddddd",
    padding: "8px",
    backgroundColor: "#f2f2f2",
    borderRadius: "5px", // Bordes redondeados
  };

  const tableRowStyle = {
    border: "1px solid #dddddd",
    padding: "8px",
    borderRadius: "5px", // Bordes redondeados
  };

  const getCellStyle = (gain) => ({
    border: "1px solid #dddddd",
    padding: "8px",
    color: gain.gain >= 0 ? "green" : "red",
  });

  const tableCellStyle = {
    border: "1px solid #dddddd",
    padding: "8px",
  };

  const StyledInputContainer = styled.div`
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 20px;
    justify-content: center;

    @media (max-width: 768px) {
      flex-direction: column;
      text-align: center;
    }
  `;

  const StyledInputLabel = styled.label`
    margin-right: 20px;
    color: #333; // Color del texto
  `;

  const StyledInput = styled.input`
    type: number;
    padding: 8px;
    border: 1px solid #ccc; // Borde del input
    border-radius: 5px; // Bordes redondeados
    outline: none; // Elimina el contorno al hacer clic
    transition: border 0.3s; // Animación de transición para el borde

    &:focus {
      border-color: #007bff; // Cambia el color del borde al hacer clic
    }
  `;

  const chartContainerStyle = {
    textAlign: "center",
    border: "1px solid #ddd",
    padding: "10px",
    position: "relative",
    borderRadius: "5px",
    margin: "20px 10%",  // Margen predeterminado
  };

  const totalInvestmentAmount =
    monthlyGains.length > 0
      ? monthlyGains[monthlyGains.length - 1].accumulatedInvestment
      : 0;
  const currentPortfolioValue =
    monthlyGains.length > 0
      ? monthlyGains[monthlyGains.length - 1].totalInvestment
      : 0;
  const percentageDifference =
    ((currentPortfolioValue - totalInvestmentAmount) / totalInvestmentAmount) *
    100;
  const totalGains = currentPortfolioValue - totalInvestmentAmount;

  return (
    <div>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        DCA Simulator
      </h1>
      <StyledInputContainer>
        <div>
          <StyledInputLabel>Inicio:</StyledInputLabel>
          <DatePicker selected={startDate} onChange={handleStartDateChange} />
        </div>
        <div>
          <StyledInputLabel>Fin:</StyledInputLabel>
          <DatePicker selected={endDate} onChange={handleEndDateChange} />
        </div>
        <div>
          <StyledInputLabel>Monto de Inversión Mensual (CLP):</StyledInputLabel>
          <StyledInput
            type="number"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(parseInt(e.target.value))}
          />
        </div>
      </StyledInputContainer>
      {loading && <p style={{ textAlign: "center" }}>Cargando...</p>}
      {error && <p style={{ textAlign: "center", color: "red" }}>{error}</p>}
      {monthlyTrades.length > 0 && !loading && (
        <>
          <div
            style={{
              backgroundColor: "rgb(242, 242, 242)",
              borderRadius: "5px",
              width: "80%",
              margin: "0% 10%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <p>
              <strong>Inversión Total:</strong>{" "}
              {totalInvestmentAmount.toLocaleString("es-CL", {
                style: "currency",
                currency: "CLP",
              })}
            </p>
            <p>
              <strong>Valor Actual del Portafolio:</strong>{" "}
              {currentPortfolioValue.toLocaleString("es-CL", {
                style: "currency",
                currency: "CLP",
              })}
            </p>
            <p>
              <strong>Diferencia:</strong> {percentageDifference.toFixed(2)}%
              <span
                style={{ color: percentageDifference > 0 ? "green" : "red" }}
              >
                {percentageDifference > 0 ? " (Ganancia)" : " (Pérdida)"}
              </span>
              <span
                style={{ color: percentageDifference > 0 ? "green" : "red" }}
              >
                {totalGains.toLocaleString("es-CL", {
                  style: "currency",
                  currency: "CLP",
                })}
              </span>
            </p>
          </div>
          <div style={chartContainerStyle}>
            <h2 style={{ marginBottom: "10px" }}>Gráfico de Ganancias</h2>
            <Line data={combinedChartData} />
            <p style={{ marginTop: "10px" }}>
              <strong style={{ color: "rgba(75,192,192,1)" }}>
                Bitcoin Precio:
              </strong>{" "}
              Precio de Bitcoin en CLP
              <br />
              <strong style={{ color: "rgba(255,99,132,1)" }}>
                Ganancia Acumulada:
              </strong>{" "}
              Monto total invertido más ganancias acumuladas
            </p>
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
          <table style={tableStyle}>
            <thead style={{ backgroundColor: "#f2f2f2" }}>
              <tr>
                <th style={tableHeaderStyle}>Fecha</th>
                <th style={tableHeaderStyle}>Bitcoin Precio</th>
                <th style={tableHeaderStyle}>Monto Invertido Acumulado</th>{" "}
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
                    {gain.originalPrice.toLocaleString("es-CL", {
                      style: "currency",
                      currency: "CLP",
                    })}
                  </td>
                  <td style={tableCellStyle}>
                    {gain.accumulatedInvestment.toLocaleString("es-CL", {
                      style: "currency",
                      currency: "CLP",
                    })}
                  </td>
                  <td style={tableCellStyle}>
                    {gain.totalInvestment.toLocaleString("es-CL", {
                      style: "currency",
                      currency: "CLP",
                    })}
                  </td>
                  <td style={getCellStyle(gain)}>
                    {gain.gain.toLocaleString("es-CL", {
                      style: "currency",
                      currency: "CLP",
                    })}
                  </td>
                  <td style={getCellStyle(gain)}>
                    {gain.gainPercentage >= 0
                      ? `+${gain.gainPercentage.toFixed(2)}%`
                      : `${gain.gainPercentage.toFixed(2)}%`}
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
