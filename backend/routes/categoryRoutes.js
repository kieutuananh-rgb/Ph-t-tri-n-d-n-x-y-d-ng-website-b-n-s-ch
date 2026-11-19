const express = require("express");
const router = express.Router();

const { getCategories } = require("../controllers/categoryController");

// API lấy danh sách danh mục
router.get("/", getCategories);

module.exports = router;