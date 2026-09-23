import axios from "axios";

// Atlas ID auth server. Only its public session endpoints are called, so
// no auth headers are attached here.
const externalApi = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000") + "/api",
});

export default externalApi;
