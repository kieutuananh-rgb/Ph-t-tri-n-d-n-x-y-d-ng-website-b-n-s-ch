const db = require("../config/database");

// ==========================================
// HÀM LẤY HOẶC TẠO GIỎ HÀNG
// ==========================================
const getOrCreateCart = async (connection, userId) => {
    await connection.query(
        "INSERT IGNORE INTO carts (user_id) VALUES (?)",
        [userId]
    );

    const [carts] = await connection.query(
        "SELECT id FROM carts WHERE user_id = ?",
        [userId]
    );

    return carts[0];
};

// ==========================================
// 1. LẤY GIỎ HÀNG CỦA NGƯỜI DÙNG
// ==========================================
const getCart = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
            return res.status(400).json({
                message: "User ID khong hop le"
            });
        }

        const cart = await getOrCreateCart(db, userId);

        const [items] = await db.query(
            `SELECT
                cart_items.id AS cart_item_id,
                cart_items.book_id,
                cart_items.quantity,
                books.title,
                books.author,
                books.price,
                books.image_url,
                books.stock,
                (books.price * cart_items.quantity) AS subtotal
            FROM cart_items
            JOIN books ON cart_items.book_id = books.id
            WHERE cart_items.cart_id = ?
            ORDER BY cart_items.id DESC`,
            [cart.id]
        );

        const total = items.reduce(
            (sum, item) => sum + Number(item.subtotal),
            0
        );

        res.json({
            userId: Number(userId),
            cartId: cart.id,
            items: items,
            total: total
        });
    } catch (error) {
        console.error("Loi lay gio hang:", error.message);

        res.status(500).json({
            message: "Khong the lay gio hang"
        });
    }
};

// ==========================================
// 2. THÊM SÁCH VÀO GIỎ HÀNG
// ==========================================
const addToCart = async (req, res) => {
    let connection;

    try {
        const userId = req.params.userId;
        const { book_id, quantity } = req.body;

        if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
            return res.status(400).json({
                message: "User ID khong hop le"
            });
        }

        if (
            !Number.isInteger(Number(book_id)) ||
            Number(book_id) <= 0
        ) {
            return res.status(400).json({
                message: "Book ID khong hop le"
            });
        }

        if (
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) <= 0
        ) {
            return res.status(400).json({
                message: "So luong sach phai lon hon 0"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Kiểm tra sách
        const [books] = await connection.query(
            "SELECT id, title, stock FROM books WHERE id = ? FOR UPDATE",
            [book_id]
        );

        if (books.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Khong tim thay sach"
            });
        }

        const book = books[0];

        if (Number(book.stock) <= 0) {
            await connection.rollback();

            return res.status(400).json({
                message: "Sach da het hang"
            });
        }

        // Lấy hoặc tạo giỏ hàng
        const cart = await getOrCreateCart(connection, userId);

        // Kiểm tra sách đã có trong giỏ chưa
        const [existingItems] = await connection.query(
            `SELECT id, quantity
            FROM cart_items
            WHERE cart_id = ? AND book_id = ?
            LIMIT 1`,
            [cart.id, book_id]
        );

        if (existingItems.length > 0) {
            const newQuantity =
                Number(existingItems[0].quantity) + Number(quantity);

            if (newQuantity > Number(book.stock)) {
                await connection.rollback();

                return res.status(400).json({
                    message: "So luong sach trong gio vuot qua ton kho",
                    stock: book.stock
                });
            }

            await connection.query(
                "UPDATE cart_items SET quantity = ? WHERE id = ?",
                [newQuantity, existingItems[0].id]
            );
        } else {
            if (Number(quantity) > Number(book.stock)) {
                await connection.rollback();

                return res.status(400).json({
                    message: "So luong sach vuot qua ton kho",
                    stock: book.stock
                });
            }

            await connection.query(
                `INSERT INTO cart_items (cart_id, book_id, quantity)
                VALUES (?, ?, ?)`,
                [cart.id, book_id, quantity]
            );
        }

        await connection.commit();

        res.status(201).json({
            message: "Them sach vao gio hang thanh cong!",
            bookId: Number(book_id),
            quantity: Number(quantity)
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Loi them sach vao gio:", error.message);

        res.status(500).json({
            message: "Khong the them sach vao gio hang"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ==========================================
// 3. CẬP NHẬT SỐ LƯỢNG SÁCH TRONG GIỎ
// ==========================================
const updateCartItem = async (req, res) => {
    let connection;

    try {
        const { userId, itemId } = req.params;
        const { quantity } = req.body;

        if (
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) <= 0
        ) {
            return res.status(400).json({
                message: "So luong phai lon hon 0"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const cart = await getOrCreateCart(connection, userId);

        const [items] = await connection.query(
            `SELECT cart_items.id, cart_items.book_id, books.stock
            FROM cart_items
            JOIN books ON cart_items.book_id = books.id
            WHERE cart_items.id = ? AND cart_items.cart_id = ?
            FOR UPDATE`,
            [itemId, cart.id]
        );

        if (items.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Khong tim thay san pham trong gio hang"
            });
        }

        if (Number(quantity) > Number(items[0].stock)) {
            await connection.rollback();

            return res.status(400).json({
                message: "So luong vuot qua ton kho",
                stock: items[0].stock
            });
        }

        await connection.query(
            "UPDATE cart_items SET quantity = ? WHERE id = ?",
            [quantity, itemId]
        );

        await connection.commit();

        res.json({
            message: "Cap nhat so luong thanh cong!",
            itemId: Number(itemId),
            quantity: Number(quantity)
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Loi cap nhat gio hang:", error.message);

        res.status(500).json({
            message: "Khong the cap nhat gio hang"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ==========================================
// 4. XÓA MỘT SẢN PHẨM KHỎI GIỎ
// ==========================================
const removeCartItem = async (req, res) => {
    try {
        const { userId, itemId } = req.params;

        const cart = await getOrCreateCart(db, userId);

        const [result] = await db.query(
            "DELETE FROM cart_items WHERE id = ? AND cart_id = ?",
            [itemId, cart.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay san pham trong gio hang"
            });
        }

        res.json({
            message: "Xoa san pham khoi gio hang thanh cong!"
        });
    } catch (error) {
        console.error("Loi xoa san pham khoi gio:", error.message);

        res.status(500).json({
            message: "Khong the xoa san pham khoi gio hang"
        });
    }
};

// ==========================================
// 5. XÓA TOÀN BỘ GIỎ HÀNG
// ==========================================
const clearCart = async (req, res) => {
    try {
        const userId = req.params.userId;

        const cart = await getOrCreateCart(db, userId);

        await db.query(
            "DELETE FROM cart_items WHERE cart_id = ?",
            [cart.id]
        );

        res.json({
            message: "Da xoa toan bo gio hang!"
        });
    } catch (error) {
        console.error("Loi xoa gio hang:", error.message);

        res.status(500).json({
            message: "Khong the xoa gio hang"
        });
    }
};

// ==========================================
// EXPORT
// ==========================================
module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
};