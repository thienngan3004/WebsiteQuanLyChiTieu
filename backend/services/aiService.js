const axios = require("axios");
require("dotenv").config();

// Base URL for Ollama API (update based on your setup)
const OLLAMA_API_URL = "https://ollama.com/api"; // or "https://ollama.com/api"

const testAIConnection = async () => {
  try {
    // Send a request to the Ollama API
    const response = await axios.post(
      `${OLLAMA_API_URL}/generate`,
      {
        model: "minimax-m2.5", // Specify the model
        prompt: "Xin chào! Đây là tin nhắn chạy thử hệ thống quản lý tài chính.",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      reply: response.data.text, // Assuming the response contains a `text` field
    };
  } catch (error) {
    console.error("Lỗi kết nối Ollama API:", error.response?.data || error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  testAIConnection,
};