const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/database");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API kiểm tra Backend
app.get("/", (req, res) => {
    res.send("Backend website ban sach dang hoat dong!");
});

// API kiểm tra kết nối Database
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

// Khởi động Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Backend dang chay tai http://localhost:${PORT}`);
});