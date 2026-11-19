
const express = require("express");
const router = express.Router();

const {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
} = require("../controllers/cartController");

const { verifyToken } = require("../middleware/authMiddleware");

// Xác thực người dùng và lấy userId từ token
router.use("/:userId", verifyToken, (req, res, next) => {
    req.params.userId = String(req.user.id);
    next();
});

// Lấy giỏ hàng
router.get("/:userId", getCart);

// Thêm sách vào giỏ hàng
router.post("/:userId/items", addToCart);

// Cập nhật số lượng
router.put("/:userId/items/:itemId", updateCartItem);

// Xóa một sản phẩm
router.delete("/:userId/items/:itemId", removeCartItem);

// Xóa toàn bộ giỏ hàng
router.delete("/:userId", clearCart);

module.exports = router;
