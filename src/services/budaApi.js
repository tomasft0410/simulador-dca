// budaApi.js
import axios from 'axios';

const BUDA_API_URL = '/api/v2'; // Cambiado para apuntar al proxy

export const getHistoricalPrices = async (pair, startDateTimestamp, endDateTimestamp, limit = 50) => {
  try {
    const response = await axios.get(`${BUDA_API_URL}/markets/${pair}/trades`, {
      params: {
        timestamp: startDateTimestamp,
        limit: limit,
      },
    });

    const historicalPrices = response.data.trades.entries;

    return historicalPrices;

  } catch (error) {
    throw error;
  }
};
