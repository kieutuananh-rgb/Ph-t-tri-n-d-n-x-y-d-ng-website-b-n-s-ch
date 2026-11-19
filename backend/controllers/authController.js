
const db = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==========================================
// ĐĂNG KÝ TÀI KHOẢN
// ==========================================
const register = async (req, res) => {
    try {
        const { full_name, email, phone, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu!"
            });
        }

        const fullName = full_name.trim();
        const userEmail = email.trim().toLowerCase();
        const userPhone = phone ? phone.trim() : null;

        if (fullName.length < 2 || fullName.length > 100) {
            return res.status(400).json({
                message: "Họ tên phải từ 2 đến 100 ký tự!"
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(userEmail) || userEmail.length > 150) {
            return res.status(400).json({
                message: "Email không hợp lệ!"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Mật khẩu phải có ít nhất 8 ký tự!"
            });
        }

        if (Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({
                message: "Mật khẩu không được vượt quá 72 byte!"
            });
        }

        if (userPhone && !/^[0-9]{10,11}$/.test(userPhone)) {
            return res.status(400).json({
                message: "Số điện thoại phải gồm 10 hoặc 11 chữ số!"
            });
        }

        const [existingUsers] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [userEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "Email này đã được đăng ký!"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users (full_name, email, phone, password_hash, role)
             VALUES (?, ?, ?, ?, ?)`,
            [fullName, userEmail, userPhone, passwordHash, "customer"]
        );

        res.status(201).json({
            message: "Đăng ký tài khoản thành công!",
            user: {
                id: result.insertId,
                full_name: fullName,
                email: userEmail,
                phone: userPhone,
                role: "customer"
            }
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Email này đã được đăng ký!"
            });
        }

        console.error("Lỗi đăng ký:", error.message);

        res.status(500).json({
            message: "Lỗi máy chủ khi đăng ký tài khoản!"
        });
    }
};

// ==========================================
// ĐĂNG NHẬP TÀI KHOẢN
// ==========================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Kiểm tra dữ liệu
        if (!email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập email và mật khẩu!"
            });
        }

        // 2. Chuẩn hóa email
        const userEmail = email.trim().toLowerCase();

        // 3. Tìm tài khoản trong database
        const [users] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [userEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không chính xác!"
            });
        }

        const user = users[0];

        // 4. So sánh mật khẩu
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không chính xác!"
            });
        }

        // 5. Kiểm tra JWT secret trong môi trường
        if (!process.env.JWT_SECRET) {
            console.error("Chưa cấu hình JWT_SECRET trong file .env");

            return res.status(500).json({
                message: "Server chưa được cấu hình xác thực!"
            });
        }

        // 6. Tạo JWT Token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // 7. Trả kết quả
        res.json({
            message: "Đăng nhập thành công!",
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Lỗi đăng nhập:", error.message);

        res.status(500).json({
            message: "Lỗi máy chủ khi đăng nhập!"
        });
    }
};
// US07.03: ADMIN XEM DANH SÁCH TÀI KHOẢN
const getAllUsers = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ message: "Chỉ admin mới xem được." });
    const [users] = await db.query("SELECT id, full_name, email, phone, role, created_at FROM users ORDER BY id DESC");
    return res.json({ users });
  } catch (e) { return res.status(500).json({ message: "Không lấy được tài khoản." }); }
};
module.exports = { register, login, getAllUsers };
