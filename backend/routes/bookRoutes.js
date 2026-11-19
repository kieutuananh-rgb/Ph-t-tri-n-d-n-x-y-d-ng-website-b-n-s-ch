const express = require("express");
const router = express.Router();

const {
    getBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook
} = require("../controllers/bookController");

// Lấy danh sách sách
router.get("/", getBooks);

// Lấy chi tiết sách theo ID
router.get("/:id", getBookById);

// Thêm sách mới
router.post("/", createBook);

// Cập nhật thông tin sách
router.put("/:id", updateBook);

// Xóa sách
router.delete("/:id", deleteBook);

module.exports = router;