import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export const joinQueue = async (playerId: string) => {
  const response = await axios.post(`${API_BASE_URL}/queue/join`, { playerId });
  return response.data;
};

export const leaveQueue = async (playerId: string) => {
  const response = await axios.delete(`${API_BASE_URL}/queue/leave/${playerId}`);
  return response.data;
};