// File này GIỮ NGUYÊN - Không cần sửa gì hết
const express = require("express");
const { testAIConnection } = require("../services/aiService");

const router = express.Router();

router.get("/test-connection", async (req, res) => {
  const result = await testAIConnection();
  if (result.success) {
    return res.status(200).json({
      message: "Kết nối Gemini thành công!",
      ai_reply: result.reply
    });
  } else {
    return res.status(500).json({
      message: "Lỗi kết nối API!",
      error: result.error
    });
  }
});

module.exports = router;