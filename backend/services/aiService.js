// 1. Đổi tên khi require từ thư viện (Thư viện cũ dùng tên GoogleGenerativeAI)
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// 2. Khởi tạo instance với đúng tên class
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const testAIConnection = async () => {
  try {
    // 3. Sử dụng mô hình mới gemini-2.5-flash
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.5-flash" 
    });

    const result = await model.generateContent("Xin chào! Đây là tin nhắn chạy thử hệ thống quản lý tài chính.");
    const response = await result.response;

    return {
      success: true,
      reply: response.text(),
    };
  } catch (error) {
    console.error(" Lỗi kết nối Gemini API:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  testAIConnection,
};