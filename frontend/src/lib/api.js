import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

export const fetchText = async ({ source, difficulty, count }) => {
  const { data } = await client.get("/text", {
    params: { source, difficulty, count },
  });
  return data;
};

export const submitScore = async (payload) => {
  const { data } = await client.post("/scores", payload);
  return data;
};

export const fetchLeaderboard = async (mode) => {
  const { data } = await client.get("/leaderboard", {
    params: { mode, limit: 20 },
  });
  return data;
};

export const fetchGlobalStats = async () => {
  const { data } = await client.get("/stats");
  return data;
};

export default client;
