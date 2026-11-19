
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/database");

const categoryRoutes = require("./routes/categoryRoutes");
const bookRoutes = require("./routes/bookRoutes");
const cartRoutes = require("./routes/cartRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

// Kiểm tra Backend
app.get("/", (req, res) => {
    res.send("Backend website ban sach dang hoat dong!");
});

// Kiểm tra kết nối MySQL
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT DATABASE() AS database_name");

        res.json({
            message: "Ket noi MySQL thanh cong!",
            database: rows[0].database_name
        });
    } catch (error) {
        console.error("Loi ket noi MySQL:", error.message);

        res.status(500).json({
            message: "Ket noi MySQL that bai!",
            error: error.message
        });
    }
});

// Khởi chạy Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Backend dang chay tai http://localhost:${PORT}`);
});
