
const jwt = require("jsonwebtoken");

// ==========================================
// MIDDLEWARE XÁC THỰC JWT
// ==========================================
const verifyToken = (req, res, next) => {
    try {
        // Lấy token từ Header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Vui lòng đăng nhập để tiếp tục!"
            });
        }

        // Tách token khỏi chuỗi Bearer
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token không hợp lệ!"
            });
        }

        // Xác thực token bằng JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Lưu thông tin người dùng vào request
        req.user = decoded;

        // Cho phép tiếp tục xử lý
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Token không hợp lệ hoặc đã hết hạn!"
        });
    }
};

module.exports = { verifyToken };
