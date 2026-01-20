import axios from "axios"; // Import axios library

const api = axios.create({
  // Create an axios instance
  baseURL: import.meta.env.VITE_BASEURL, // Set the base URL from environment variables
});

export default api; // Export the axios instance for use in other parts of the application
