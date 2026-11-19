const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { createOrder, getMyOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus } = require("../controllers/orderController");
router.use(verifyToken);
router.post("/", createOrder);
router.get("/my", getMyOrders);
router.get("/", getAllOrders); // admin, phải đặt trước /:id
router.get("/:id", getOrderById);
router.put("/:id/cancel", cancelOrder);
router.put("/:id/status", updateOrderStatus);
module.exports = router;