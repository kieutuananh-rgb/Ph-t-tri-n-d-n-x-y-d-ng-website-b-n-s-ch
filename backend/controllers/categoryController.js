const db = require("../config/database");

// Lấy danh sách danh mục sách
const getCategories = async (req, res) => {
    try {
        const [categories] = await db.query(
            "SELECT * FROM categories ORDER BY id ASC"
        );

        res.json(categories);
    } catch (error) {
        console.error("Loi lay danh muc:", error.message);

        res.status(500).json({
            message: "Khong the lay danh sach danh muc"
        });
    }
};

module.exports = { getCategories };