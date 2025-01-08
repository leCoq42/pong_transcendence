import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

export const joinQueue = async (playerId: string | undefined) => {
  const response = await axios.post(
    `${API_BASE_URL}/queue/join`,
    { playerId },
    { withCredentials: true }
  );
  return response.data;
};

export const leaveQueue = async (playerId: string | undefined) => {
  const response = await axios.delete(
    `${API_BASE_URL}/queue/leave/${playerId}`,
    { withCredentials: true }
  );
  return response.data;
};
