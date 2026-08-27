import axios from "axios";

const socketApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_SOCKET_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default socketApi;
