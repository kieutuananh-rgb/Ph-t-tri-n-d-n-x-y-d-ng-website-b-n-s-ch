const db = require("../config/database");

// ==========================================
// 1. LẤY DANH SÁCH SÁCH
// ==========================================
const getBooks = async (req, res) => {
    try {
        const [books] = await db.query(
            "SELECT * FROM books ORDER BY id DESC"
        );

        res.json(books);
    } catch (error) {
        console.error("Loi lay danh sach sach:", error.message);

        res.status(500).json({
            message: "Khong the lay danh sach sach"
        });
    }
};

// ==========================================
// 2. LẤY CHI TIẾT SÁCH THEO ID
// ==========================================
const getBookById = async (req, res) => {
    try {
        const bookId = req.params.id;

        const [books] = await db.query(
            "SELECT * FROM books WHERE id = ?",
            [bookId]
        );

        if (books.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay sach"
            });
        }

        res.json(books[0]);
    } catch (error) {
        console.error("Loi lay chi tiet sach:", error.message);

        res.status(500).json({
            message: "Khong the lay chi tiet sach"
        });
    }
};

// ==========================================
// 3. THÊM SÁCH MỚI
// ==========================================
const createBook = async (req, res) => {
    try {
        const {
            code,
            title,
            author,
            publisher,
            price,
            stock,
            description,
            image_url,
            category_id
        } = req.body;

        // Kiểm tra tên sách
        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Ten sach khong duoc de trong"
            });
        }

        // Kiểm tra giá sách
        if (
            price === undefined ||
            price === null ||
            price === "" ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        ) {
            return res.status(400).json({
                message: "Gia sach khong hop le"
            });
        }

        // Kiểm tra số lượng sách
        if (
            stock !== undefined &&
            stock !== "" &&
            (!Number.isInteger(Number(stock)) || Number(stock) < 0)
        ) {
            return res.status(400).json({
                message: "So luong sach khong hop le"
            });
        }

        // Thêm sách vào Database
        const [result] = await db.query(
            `INSERT INTO books
            (code, title, author, publisher, price, stock, description, image_url, category_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                code || null,
                title.trim(),
                author || null,
                publisher || null,
                Number(price),
                stock === undefined || stock === "" ? 0 : Number(stock),
                description || null,
                image_url || null,
                category_id || null
            ]
        );

        res.status(201).json({
            message: "Them sach thanh cong!",
            bookId: result.insertId
        });
    } catch (error) {
        console.error("Loi them sach:", error.message);

        res.status(500).json({
            message: "Khong the them sach",
            error: error.message
        });
    }
};

// ==========================================
// 4. CẬP NHẬT THÔNG TIN SÁCH
// ==========================================
const updateBook = async (req, res) => {
    try {
        const bookId = req.params.id;

        const {
            code,
            title,
            author,
            publisher,
            price,
            stock,
            description,
            image_url,
            category_id
        } = req.body;

        // Kiểm tra tên sách
        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Ten sach khong duoc de trong"
            });
        }

        // Kiểm tra giá sách
        if (
            price === undefined ||
            price === null ||
            price === "" ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        ) {
            return res.status(400).json({
                message: "Gia sach khong hop le"
            });
        }

        // Kiểm tra số lượng sách
        if (
            stock !== undefined &&
            stock !== "" &&
            (!Number.isInteger(Number(stock)) || Number(stock) < 0)
        ) {
            return res.status(400).json({
                message: "So luong sach khong hop le"
            });
        }

        // Kiểm tra sách có tồn tại không
        const [existingBooks] = await db.query(
            "SELECT id FROM books WHERE id = ?",
            [bookId]
        );

        if (existingBooks.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay sach"
            });
        }

        // Cập nhật sách
        await db.query(
            `UPDATE books SET
                code = ?,
                title = ?,
                author = ?,
                publisher = ?,
                price = ?,
                stock = ?,
                description = ?,
                image_url = ?,
                category_id = ?
            WHERE id = ?`,
            [
                code || null,
                title.trim(),
                author || null,
                publisher || null,
                Number(price),
                stock === undefined || stock === "" ? 0 : Number(stock),
                description || null,
                image_url || null,
                category_id || null,
                bookId
            ]
        );

        res.json({
            message: "Cap nhat sach thanh cong!"
        });
    } catch (error) {
        console.error("Loi cap nhat sach:", error.message);

        res.status(500).json({
            message: "Khong the cap nhat sach",
            error: error.message
        });
    }
};

// ==========================================
// 5. XÓA SÁCH
// ==========================================
const deleteBook = async (req, res) => {
    try {
        const bookId = req.params.id;

        // Kiểm tra sách tồn tại
        const [books] = await db.query(
            "SELECT id FROM books WHERE id = ?",
            [bookId]
        );

        if (books.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay sach"
            });
        }

        // Xóa sách khỏi Database
        await db.query(
            "DELETE FROM books WHERE id = ?",
            [bookId]
        );

        res.json({
            message: "Xoa sach thanh cong!"
        });
    } catch (error) {
        console.error("Loi xoa sach:", error.message);

        res.status(500).json({
            message: "Khong the xoa sach",
            error: error.message
        });
    }
};

// ==========================================
// 6. EXPORT CÁC HÀM
// ==========================================
module.exports = {
    getBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook
};