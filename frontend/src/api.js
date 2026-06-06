// Axios client + raw API calls to the FastAPI backend.
import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

// Surface the backend's `detail` message (e.g. "model not loaded") as the error.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail;
    return Promise.reject(new Error(detail || err.message || "Request failed"));
  }
);

export const getHealth = () => client.get("/").then((r) => r.data);

export const getPrices = (start, end) =>
  client.get("/prices", { params: { start, end } }).then((r) => r.data);

export const runSimulation = (params) =>
  client.get("/simulate", { params }).then((r) => r.data);

export const predictSentiment = (text) =>
  client.post("/predict", { text }).then((r) => r.data);
