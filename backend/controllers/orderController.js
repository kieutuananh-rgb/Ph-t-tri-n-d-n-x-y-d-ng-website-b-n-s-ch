const db = require("../config/database");

// ==========================================
// DÙNG CHUNG CHO US05.02 + US05.03 + US06
// - US05.02: phí vận chuyển tự động
// - US05.03: COD + Chuyển khoản demo
// - US06.01 / US06.02 / US06.03: theo dõi, hủy, admin cập nhật
// ==========================================

const ALLOWED_PAYMENTS = ["COD", "BANK"];
const ALLOWED_STATUS = ["Chờ xác nhận", "Đã xác nhận", "Đang giao", "Đã giao", "Đã hủy"];

function calcShippingFee(subtotal) {
  // US05.02: phí ship tự động
  // >= 300.000đ -> miễn phí, còn lại 30.000đ
  if (Number(subtotal) >= 300000) return 0;
  return 30000;
}

function normKey(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
}
function normalizeStatus(s) {
  return String(s || "").trim();
}
function isPending(st) {
  const k = normKey(st);
  return k.includes("cho") && k.includes("xac");
}
function toDbStatus(vietStatus) {
  // Map trạng thái hiển thị (có dấu) về đúng ENUM trong DB cũ (không dấu) nếu cần
  const k = normKey(vietStatus);
  if (k === "cho" || (k.includes("cho") && k.includes("xac"))) return "Cho xac nhan";
  if (k.includes("da") && k.includes("xac")) return "Da xac nhan";
  if (k.includes("dang") && k.includes("giao")) return "Dang giao";
  if (k.includes("da") && k.includes("giao")) return "Da giao";
  if (k.includes("huy")) return "Da huy";
  return vietStatus;
}

// ==========================================
// 1. TẠO ĐƠN HÀNG (US05.01 + US05.02 + US05.03)
// ==========================================
const createOrder = async (req, res) => {
  let connection;
  try {
    const userId = Number(req.user?.id);
    const { recipient_name, phone, address, shipping_address, payment_method } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Vui lòng đăng nhập để đặt hàng." });
    }

    const name = String(recipient_name || "").trim();
    const cleanPhone = String(phone || "").replace(/\D/g, "");
    const cleanAddress = String(address || shipping_address || "").trim();
    const method = String(payment_method || "COD").trim().toUpperCase();

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ message: "Họ tên người nhận phải từ 2 đến 100 ký tự." });
    }
    if (!/^\d{10,11}$/.test(cleanPhone)) {
      return res.status(400).json({ message: "Số điện thoại phải gồm 10 hoặc 11 chữ số." });
    }
    if (cleanAddress.length < 5 || cleanAddress.length > 255) {
      return res.status(400).json({ message: "Vui lòng nhập địa chỉ giao hàng chi tiết (tối thiểu 5 ký tự)." });
    }
    if (!ALLOWED_PAYMENTS.includes(method)) {
      return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ. Chọn COD hoặc Chuyển khoản." });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.query("INSERT IGNORE INTO carts (user_id) VALUES (?)", [userId]);
    const [carts] = await connection.query("SELECT id FROM carts WHERE user_id = ? LIMIT 1", [userId]);
    if (!carts.length) throw new Error("Không tìm thấy giỏ hàng.");

    const [items] = await connection.query(
      `SELECT ci.id AS cart_item_id, ci.book_id, ci.quantity,
              b.title AS book_title, b.price, b.stock
       FROM cart_items ci
       JOIN books b ON b.id = ci.book_id
       WHERE ci.cart_id = ? FOR UPDATE`,
      [carts[0].id]
    );

    if (!items.length) {
      await connection.rollback();
      return res.status(400).json({ message: "Giỏ hàng đang trống. Hãy thêm sách trước khi đặt hàng." });
    }

    for (const item of items) {
      if (Number(item.quantity) > Number(item.stock)) {
        await connection.rollback();
        return res.status(400).json({
          message: `Sách "${item.book_title}" không đủ số lượng trong kho. Vui lòng giảm số lượng.`
        });
      }
    }

    const subtotal = items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);
    const shippingFee = calcShippingFee(subtotal); // US05.02
    const total = subtotal + shippingFee;

    const [orderResult] = await connection.query(
      `INSERT INTO orders
        (user_id, recipient_name, phone, address, payment_method, subtotal, shipping_fee, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Chờ xác nhận')`,
      [userId, name, cleanPhone, cleanAddress, method, subtotal, shippingFee, total]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items (order_id, book_id, book_title, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.book_id, item.book_title, item.quantity, item.price]
      );
      await connection.query("UPDATE books SET stock = stock - ? WHERE id = ?", [item.quantity, item.book_id]);
    }

    await connection.query("DELETE FROM cart_items WHERE cart_id = ?", [carts[0].id]);
    await connection.commit();

    return res.status(201).json({
      message: "Đặt hàng thành công! Cảm ơn bạn đã mua sách.",
      orderId,
      subtotal,
      shipping_fee: shippingFee,
      total,
      payment_method: method
    });
  } catch (error) {
    if (connection) { try { await connection.rollback(); } catch (_) {} }
    console.error("Lỗi tạo đơn hàng:", error);
    // Nếu DB cũ chưa có cột status / shipping_fee -> báo rõ để chạy file SQL cập nhật
    if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(500).json({
        message: "Cấu trúc bảng orders chưa đúng. Hãy chạy file database_update.sql (đính kèm) trong MySQL rồi đặt hàng lại.",
        error: error.message
      });
    }
    return res.status(500).json({ message: "Không thể tạo đơn hàng. Vui lòng thử lại." });
  } finally {
    if (connection) connection.release();
  }
};

// ==========================================
// 2. LỊCH SỬ ĐƠN HÀNG CỦA KHÁCH (US06.01 + US07.02)
// GET /api/orders/my
// ==========================================
const getMyOrders = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    const [orders] = await db.query(
      `SELECT id, recipient_name, phone, address, payment_method,
              subtotal, shipping_fee, total, status, created_at
       FROM orders WHERE user_id = ? ORDER BY id DESC`,
      [userId]
    );
    return res.json({ orders });
  } catch (error) {
    console.error("Lỗi lấy lịch sử đơn:", error.message);
    return res.status(500).json({ message: "Không thể lấy lịch sử đơn hàng." });
  }
};

// ==========================================
// 3. CHI TIẾT 1 ĐƠN HÀNG (US06.01)
// GET /api/orders/:id
// ==========================================
const getOrderById = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    const isAdmin = req.user?.role === "admin";
    const orderId = Number(req.params.id);

    const [orders] = await db.query(
      `SELECT id, user_id, recipient_name, phone, address, payment_method,
              subtotal, shipping_fee, total, status, created_at
       FROM orders WHERE id = ?`,
      [orderId]
    );
    if (!orders.length) return res.status(404).json({ message: "Không tìm thấy đơn hàng." });

    const order = orders[0];
    if (!isAdmin && Number(order.user_id) !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xem đơn hàng này." });
    }

    const [items] = await db.query(
      `SELECT oi.book_id, oi.book_title, oi.quantity, oi.price,
              (oi.quantity * oi.price) AS subtotal,
              b.author, b.image_url
       FROM order_items oi
       LEFT JOIN books b ON b.id = oi.book_id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    return res.json({ order, items });
  } catch (error) {
    console.error("Lỗi lấy chi tiết đơn:", error.message);
    return res.status(500).json({ message: "Không thể lấy chi tiết đơn hàng." });
  }
};

// ==========================================
// 4. HỦY ĐƠN HÀNG (US06.02) - chỉ khi "Chờ xác nhận"
// PUT /api/orders/:id/cancel
// ==========================================
const cancelOrder = async (req, res) => {
  let connection;
  try {
    const userId = Number(req.user?.id);
    const orderId = Number(req.params.id);

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [orders] = await connection.query("SELECT * FROM orders WHERE id = ? FOR UPDATE", [orderId]);
    if (!orders.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }
    const order = orders[0];
    if (Number(order.user_id) !== userId) {
      await connection.rollback();
      return res.status(403).json({ message: "Bạn không có quyền hủy đơn này." });
    }
    if (!isPending(order.status)) {
      await connection.rollback();
      return res.status(400).json({
        message: `Chỉ được hủy đơn khi đang "Chờ xác nhận". Trạng thái hiện tại: ${order.status}.`
      });
    }

    // Hoàn lại tồn kho
    const [items] = await connection.query("SELECT book_id, quantity FROM order_items WHERE order_id = ?", [orderId]);
    for (const it of items) {
      await connection.query("UPDATE books SET stock = stock + ? WHERE id = ?", [it.quantity, it.book_id]);
    }

    await connection.query("UPDATE orders SET status = 'Đã hủy' WHERE id = ?", [orderId]);
    await connection.commit();
    return res.json({ message: "Đã hủy đơn hàng thành công." });
  } catch (error) {
    if (connection) { try { await connection.rollback(); } catch (_) {} }
    console.error("Lỗi hủy đơn:", error);
    return res.status(500).json({ message: "Không thể hủy đơn hàng." });
  } finally {
    if (connection) connection.release();
  }
};

// ==========================================
// 5. ADMIN: XEM TẤT CẢ ĐƠN (US06.03)
// GET /api/orders
// ==========================================
const getAllOrders = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Chỉ quản trị viên mới xem được tất cả đơn hàng." });
    }
    const [orders] = await db.query(
      `SELECT o.id, o.user_id, u.full_name AS customer_name, u.email AS customer_email,
              o.recipient_name, o.phone, o.address, o.payment_method,
              o.subtotal, o.shipping_fee, o.total, o.status, o.created_at
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ORDER BY o.id DESC`
    );
    return res.json({ orders });
  } catch (error) {
    console.error("Lỗi lấy tất cả đơn:", error.message);
    return res.status(500).json({ message: "Không thể lấy danh sách đơn hàng." });
  }
};

// ==========================================
// 6. ADMIN: CẬP NHẬT TRẠNG THÁI (US06.03)
// PUT /api/orders/:id/status  body: { status }
// ==========================================
const updateOrderStatus = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Chỉ quản trị viên mới được cập nhật trạng thái." });
    }
    const orderId = Number(req.params.id);
    const rawStatus = normalizeStatus(req.body.status);
    // Chấp nhận cả "Đang giao" và "Dang giao"
    const k = normKey(rawStatus);
    let ok = false;
    for (const a of ALLOWED_STATUS) { if (normKey(a) === k) { ok = true; break; } }
    if (!ok && !["cho xac nhan","da xac nhan","dang giao","da giao","da huy","dang dong goi","dong goi"].some(x => normKey(x) === k)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ.", allowed: ALLOWED_STATUS });
    }
    // Lưu đúng ENUM của DB cũ (không dấu) để không lỗi ENUM
    let status = rawStatus;
    try {
      const [cols] = await db.query("SHOW COLUMNS FROM orders LIKE \'status\'");
      const colType = String(cols?.[0]?.Type || "");
      if (colType.toLowerCase().startsWith("enum")) {
        status = toDbStatus(rawStatus);
      }
    } catch (_) { status = rawStatus; }

    const [orders] = await db.query("SELECT id, status FROM orders WHERE id = ?", [orderId]);
    if (!orders.length) return res.status(404).json({ message: "Không tìm thấy đơn hàng." });

    // Không cho sửa đơn đã hủy / đã giao (trừ khi muốn mở lại -> chặn để đúng quy trình)
    if (orders[0].status === "Đã hủy" && status !== "Đã hủy") {
      return res.status(400).json({ message: "Đơn đã hủy không thể chuyển trạng thái khác." });
    }

    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
    return res.json({ message: `Đã cập nhật đơn #${orderId} sang "${status}".` });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái:", error.message);
    return res.status(500).json({ message: "Không thể cập nhật trạng thái." });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  calcShippingFee
};