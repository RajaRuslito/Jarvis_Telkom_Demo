import axios from "axios";

const BASE_URL = "http://localhost:5000"; // Replace with your backend URL

export const fetchMissionStatements = async () => {
  const response = await axios.get(`${BASE_URL}/missionstatements`);
  return response.data;
};