import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:5000", // Flask backend URL
});

// New function to submit the contact form data to the backend
export const submitContactForm = (data) => {
    // This assumes your Flask backend has an endpoint /contact that handles email sending
    return API.post("/contact", data);
};

export default API;