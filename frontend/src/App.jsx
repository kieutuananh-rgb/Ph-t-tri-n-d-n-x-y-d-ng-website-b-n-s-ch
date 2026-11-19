import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

// ==========================================
// CÁC HÀM HỖ TRỢ
// ==========================================

function normalizeText(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function getList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getBookId(book) {
  return book.id ?? book.book_id;
}

function getBookTitle(book) {
  return book.title ?? book.tenSach ?? book.name ?? "Tên sách";
}

function getBookAuthor(book) {
  return book.author ?? book.tacGia ?? "Chưa cập nhật tác giả";
}

function getBookPrice(book) {
  return Number(book.price ?? book.donGia ?? book.gia ?? 0);
}

function getBookImage(book) {
  return book.image_url ?? book.image ?? book.cover_image ?? book.thumbnail ?? "";
}

function calcShippingFee(subtotal) {
  return Number(subtotal) >= 300000 ? 0 : 30000;
}
function normStatus(st) {
  const t = String(st || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
  if (t.includes("cho") && t.includes("xac")) return "cho";
  if (t.includes("da") && t.includes("xac")) return "xacnhan";
  if (t.includes("dang") && t.includes("giao")) return "danggiao";
  if (t.includes("da") && t.includes("giao")) return "dagiao";
  if (t.includes("huy")) return "huy";
  if (t.includes("dong")) return "danggiao";
  return t;
}
function displayStatus(st) {
  const n = normStatus(st);
  if (n === "cho") return "Chờ xác nhận";
  if (n === "xacnhan") return "Đã xác nhận";
  if (n === "danggiao") return "Đang giao";
  if (n === "dagiao") return "Đã giao";
  if (n === "huy") return "Đã hủy";
  return String(st || "");
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString("vi-VN") + " ₫";
}

async function readResponse(response) {
  return response.json().catch(() => ({}));
}

// ==========================================
// COMPONENT APP
// ==========================================

export default function App() {
  // Dữ liệu sách
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tìm kiếm và danh mục
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Giỏ hàng
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Thông tin giao hàng (US05.01 + US05.02 + US05.03)
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Đơn hàng - Sprint 2 (US06.01 + US06.02 + US06.03 + US07.02 + US07.03)
  const [currentPage, setCurrentPage] = useState("home"); // home | orders | admin
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [bookForm, setBookForm] = useState({ id: "", title: "", author: "", price: "", stock: "", category_id: "", image_url: "", description: "" });
  const [bookMsg, setBookMsg] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Đăng nhập / đăng ký
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Lưu thông tin đăng nhập
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bookstore_user") || "null");
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("bookstore_token") || ""
  );

  // Thông báo
  const [message, setMessage] = useState("");
const [authFeedback, setAuthFeedback] = useState("");

  // Popup thêm sách vào giỏ hàng
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [cartPopupBook, setCartPopupBook] = useState("");

  // ==========================================
  // TẢI SÁCH VÀ DANH MỤC
  // ==========================================

  useEffect(() => {
    async function loadStore() {
      setLoading(true);

      try {
        const [bookResponse, categoryResponse] = await Promise.all([
          fetch(`${API}/books`),
          fetch(`${API}/categories`),
        ]);

        const bookData = await readResponse(bookResponse);
        const categoryData = await readResponse(categoryResponse);

        if (!bookResponse.ok) {
          throw new Error("Không tải được danh sách sách.");
        }

        setBooks(getList(bookData, "books"));

        setCategories(
          categoryResponse.ok
            ? getList(categoryData, "categories")
            : []
        );
      } catch (error) {
        console.error("Lỗi tải dữ liệu cửa hàng:", error);

        setMessage(
          "Không thể tải dữ liệu. Hãy kiểm tra Backend và kết nối MySQL."
        );
      } finally {
        setLoading(false);
      }
    }

    loadStore();
  }, []);

  // ==========================================
  // TẢI GIỎ HÀNG KHI ĐĂNG NHẬP
  // ==========================================

  useEffect(() => {
    if (token && user) {
      loadCart(token, user);
    } else {
      setCart([]);
    }
  }, [token, user]);

  async function loadCart(currentToken, currentUser) {
    if (!currentToken || !currentUser?.id) {
      setCart([]);
      return;
    }

    try {
      const response = await fetch(
        `${API}/cart/${currentUser.id}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        setCart([]);
        return;
      }

      setCart(data.items || data.cart || []);
    } catch (error) {
      console.error("Lỗi tải giỏ hàng:", error);
      setCart([]);
    }
  }

  // ==========================================
  // ĐĂNG NHẬP / ĐĂNG KÝ
  // ==========================================

  function openLogin() {
    setAuthMode("login");
    setPassword("");
    setShowPassword(false);
    setAuthFeedback("");
    setShowAuth(true);
  }

  function openRegister() {
    setAuthMode("register");
    setPassword("");
    setFullName("");
    setPhone("");
    setShowPassword(false);
    setAuthFeedback("");
    setShowAuth(true);
  }

  function closeAuth() {
    if (authLoading) return;

    setShowAuth(false);
    setPassword("");
    setShowPassword(false);
    setAuthFeedback("");
  }

  async function handleAuth(event) {
    event.preventDefault();

    if (authLoading) return;

    const currentMode = authMode;
const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (currentMode === "register" && cleanName.length < 2) {
      setAuthFeedback("Vui lòng nhập họ tên hợp lệ.");
      return;
    }

    if (!cleanEmail) {
      setAuthFeedback("Vui lòng nhập email.");
      return;
    }

    if (password.length < 8) {
      setAuthFeedback("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setAuthLoading(true);
    setAuthFeedback("");
    setMessage("");

    try {
      const endpoint =
        currentMode === "login"
          ? "/auth/login"
          : "/auth/register";

      const requestBody =
        currentMode === "login"
          ? {
              email: cleanEmail,
              password: password,
            }
          : {
              full_name: cleanName,
              email: cleanEmail,
              password: password,
              phone: cleanPhone || null,
            };

      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(
            "Email này đã được đăng ký. Hãy đăng nhập."
          );
        }

        if (response.status === 401) {
          throw new Error(
            "Email hoặc mật khẩu không chính xác."
          );
        }

        throw new Error(
          data.message || "Yêu cầu thất bại. Vui lòng thử lại."
        );
      }

      // Đăng ký thành công
      if (currentMode === "register") {
        setShowAuth(false);
        setAuthMode("login");
        setPassword("");
        setFullName("");
        setPhone("");
        setEmail(cleanEmail);
        setShowPassword(false);
        setAuthFeedback("");

        setMessage(
          "Đăng ký thành công! Tài khoản đã được tạo. Vui lòng đăng nhập."
        );
        return;
      }

      // Đăng nhập thành công
      if (!data.token || !data.user) {
        throw new Error(
          "Máy chủ không trả về dữ liệu đăng nhập hợp lệ."
        );
      }

      localStorage.setItem("bookstore_token", data.token);
      localStorage.setItem(
        "bookstore_user",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);
      setShowAuth(false);
      setPassword("");
      setShowPassword(false);
      setAuthFeedback("");

      setMessage(
        `Đăng nhập thành công! Xin chào ${
          data.user.full_name || data.user.name || "bạn"
        }.`
      );

      setShowCart(false);
    } catch (error) {
      setAuthFeedback(
        error.message || "Không thể kết nối máy chủ. Hãy thử lại."
      );
    } finally {
setAuthLoading(false);
    }
  }

  // Đăng xuất
  function logout() {
    localStorage.removeItem("bookstore_token");
    localStorage.removeItem("bookstore_user");

    setToken("");
    setUser(null);
    setCart([]);
    setShowCart(false);
    setShowAuth(false);
    setCurrentPage("home");
    setMyOrders([]);
    setSelectedOrder(null);
    setPassword("");
    setMessage("Bạn đã đăng xuất.");
  }

  // ==========================================
  // THÊM SÁCH VÀO GIỎ
  // ==========================================

  async function addToCart(book) {
    if (!user || !token) {
      setMessage("Vui lòng đăng nhập để thêm sách vào giỏ hàng.");
      openLogin();
      return;
    }

    try {
      const response = await fetch(
        `${API}/cart/${user.id}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            book_id: getBookId(book),
            quantity: 1,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Không thể thêm sách vào giỏ hàng."
        );
      }

      await loadCart(token, user);

      // Hiển thị popup giữa màn hình
      setCartPopupBook(getBookTitle(book));
      setShowCartPopup(true);
      setMessage("");
    } catch (error) {
      setMessage(
        error.message || "Có lỗi khi thêm sách vào giỏ hàng."
      );
    }
  }

  // ==========================================
  // CẬP NHẬT SỐ LƯỢNG
  // ==========================================

  async function updateCartItem(item, quantity) {
    if (quantity < 1) {
      await removeCartItem(item);
      return;
    }

    const itemId = item.cart_item_id ?? item.id;

    try {
      const response = await fetch(
        `${API}/cart/${user.id}/items/${itemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Cập nhật số lượng thất bại."
        );
      }

      await loadCart(token, user);
    } catch (error) {
      setMessage(error.message);
    }
  }

  // ==========================================
  // XÓA MỘT SÁCH KHỎI GIỎ
  // ==========================================

  async function removeCartItem(item) {
    const itemId = item.cart_item_id ?? item.id;

    try {
      const response = await fetch(
        `${API}/cart/${user.id}/items/${itemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
throw new Error(data.message || "Xóa sách thất bại.");
      }

      await loadCart(token, user);
      setMessage("Đã xóa sách khỏi giỏ hàng.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  // ==========================================
  // XÓA TOÀN BỘ GIỎ HÀNG
  // ==========================================

  async function clearCart() {
    try {
      const response = await fetch(`${API}/cart/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Không thể xóa giỏ hàng."
        );
      }

      setCart([]);
      setMessage("Đã xóa toàn bộ giỏ hàng.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  // ==========================================
  // THANH TOÁN / ĐẶT HÀNG (CHẤP NHẬN MỌI ĐỊA CHỈ NHẬP VÀO)
  // ==========================================

  async function handleCheckout(event) {
    event.preventDefault();

    if (checkoutLoading) return;

    if (!user || !token) {
      setMessage("Vui lòng đăng nhập trước khi đặt hàng.");
      openLogin();
      return;
    }

    const cleanName = checkoutName.trim();
    const cleanPhone = checkoutPhone.replace(/\\D/g, "");
    const rawAddress = checkoutAddress.trim();

    if (cleanName.length < 2) {
      setMessage("Vui lòng nhập họ tên người nhận (ít nhất 2 ký tự).");
      return;
    }

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      setMessage("Vui lòng nhập số điện thoại hợp lệ (10–11 chữ số).");
      return;
    }

    if (rawAddress.length < 5) {
      setMessage("Vui lòng nhập địa chỉ giao hàng chi tiết (tối thiểu 5 ký tự).");
      return;
    }

    // phí ship tự động theo tổng tiền sách
    const shipFee = calcShippingFee(cartTotal);

    setCheckoutLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient_name: cleanName,
          phone: cleanPhone,
          address: rawAddress,
          shipping_address: rawAddress,
          payment_method: paymentMethod, // COD | BANK
        }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        const serverError =
          data.message ||
          data.error ||
          "Đặt hàng thất bại, vui lòng thử lại.";
        throw new Error(serverError);
      }
      const orderId = data.orderId ?? data.order_id ?? data.id ?? "";
      const orderTotal = data.total ?? cartTotal + shipFee;
      const payText =
        (data.payment_method || paymentMethod) === "BANK"
          ? "Chuyển khoản ngân hàng (demo: Vietcombank 123456789 - BOOKSTORE)"
          : "Thanh toán khi nhận hàng (COD)";

      setCart([]);
      setShowCheckout(false);
      setCheckoutAddress("");

      setMessage(
        `Đặt hàng thành công!${orderId ? ` Mã đơn hàng #${orderId}.` : ""} Giao tới: ${rawAddress}. Tổng thanh toán ${formatPrice(orderTotal)} (ship ${shipFee === 0 ? "miễn phí" : formatPrice(shipFee)}). ${payText}.`
      );
      // Tự chuyển sang trang đơn hàng để xem
      await loadMyOrders();
      setShowCart(false);
      setCurrentPage("orders");
    } catch (error) {
      setMessage(error.message || "Không thể kết nối máy chủ để đặt hàng.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  // ==========================================
  // SPRINT 2: LỊCH SỬ + CHI TIẾT + HỦY ĐƠN (US06.01 + US06.02 + US07.02)
  // ==========================================

  function statusClass(status) {
    const n = normStatus(status);
    if (n === "dagiao") return "status-done";
    if (n === "huy") return "status-cancel";
    if (n === "danggiao") return "status-ship";
    if (n === "xacnhan") return "status-confirm";
    return "status-pending";
  }

  async function loadMyOrders() {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API}/orders/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readResponse(res);
      if (!res.ok) throw new Error(data.message || "Không tải được đơn hàng.");
      setMyOrders(data.orders || []);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setOrdersLoading(false);
    }
  }

  async function openOrderDetail(orderId) {
    setOrderDetailLoading(true);
    setSelectedOrder(null);
    setOrderItems([]);
    try {
      const res = await fetch(`${API}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readResponse(res);
      if (!res.ok) throw new Error(data.message || "Không tải được chi tiết đơn.");
      setSelectedOrder(data.order);
      setOrderItems(data.items || []);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setOrderDetailLoading(false);
    }
  }

  async function cancelMyOrder(orderId) {
    if (!window.confirm(`Hủy đơn hàng #${orderId}? Chỉ hủy được khi đang \"Chờ xác nhận\".`)) return;
    try {
      const res = await fetch(`${API}/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readResponse(res);
      if (!res.ok) throw new Error(data.message || "Không thể hủy đơn.");
      setMessage(`Đã hủy đơn hàng #${orderId}.`);
      await loadMyOrders();
      if (selectedOrder?.id === orderId) await openOrderDetail(orderId);
    } catch (e) {
      setMessage(e.message);
    }
  }

  // ==========================================
  // SPRINT 2: ADMIN (US06.03 + US07.03)
  // ==========================================

  async function loadAdminData() {
    if (!token || user?.role !== "admin") {
      setMessage("Chỉ quản trị viên mới xem được trang này.");
      return;
    }
    setAdminLoading(true);
    try {
      const [oRes, uRes] = await Promise.all([
        fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/auth/users`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const oData = await readResponse(oRes);
      const uData = await readResponse(uRes);
      if (oRes.ok) setAdminOrders(oData.orders || []);
      else setMessage(oData.message || "Không tải được đơn hàng.");
      if (uRes.ok) setAdminUsers(uData.users || []);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setAdminLoading(false);
    }
  }

  // US02.01 + US02.02 + US02.03: Admin quản lý sách (thêm / sửa tồn kho, giá, ảnh, mô tả / xóa)
  async function saveBook(e) {
    e?.preventDefault?.();
    setBookMsg("");
    try {
      const payload = {
        title: bookForm.title.trim(),
        author: bookForm.author.trim() || null,
        price: Number(bookForm.price),
        stock: bookForm.stock === "" ? 0 : Number(bookForm.stock),
        category_id: bookForm.category_id || null,
        image_url: bookForm.image_url || null,
        description: bookForm.description || null,
      };
      if (!payload.title) { setBookMsg("Nhập tên sách."); return; }
      if (!Number.isFinite(payload.price) || payload.price < 0) { setBookMsg("Giá không hợp lệ."); return; }
      const isEdit = !!bookForm.id;
      const url = isEdit ? `${API}/books/${bookForm.id}` : `${API}/books`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await readResponse(res);
      if (!res.ok) throw new Error(data.message || "Lưu sách thất bại.");
      setBookMsg(isEdit ? "Cập nhật sách thành công." : `Thêm sách thành công (ID ${data.bookId}).`);
      setBookForm({ id: "", title: "", author: "", price: "", stock: "", category_id: "", image_url: "", description: "" });
      // tải lại danh sách sách trang chủ
      const br = await fetch(`${API}/books`);
      const bd = await readResponse(br);
      if (br.ok) setBooks(getList(bd, "books"));
    } catch (err) { setBookMsg(err.message); }
  }
  function editBook(b) {
    const id = b.id ?? b.book_id;
    setBookForm({
      id: String(id ?? ""),
      title: b.title ?? "",
      author: b.author ?? "",
      price: String(b.price ?? ""),
      stock: String(b.stock ?? ""),
      category_id: String(b.category_id ?? b.categoryId ?? ""),
      image_url: b.image_url ?? b.image ?? "",
      description: b.description ?? "",
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }
  async function deleteBook(id) {
    if (!window.confirm(`Xóa sách #${id}?`)) return;
    try {
      const res = await fetch(`${API}/books/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await readResponse(res);
      if (!res.ok) throw new Error(data.message || "Xóa thất bại.");
      setBookMsg(`Đã xóa sách #${id}.`);
      const br = await fetch(`${API}/books`);
      const bd = await readResponse(br);
      if (br.ok) setBooks(getList(bd, "books"));
    } catch (err) { setBookMsg(err.message); }
  }

  async function updateStatus(orderId, newStatus) {
    try {
      const res = await fetch(`${API}/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await readResponse(res);
      if (!res.ok) throw new Error(data.message || "Cập nhật thất bại.");
      setMessage(data.message);
      await loadAdminData();
    } catch (e) {
      setMessage(e.message);
    }
  }

  // ==========================================
  // LỌC SÁCH
  // ==========================================

  const filteredBooks = books.filter((book) => {
    const keyword = normalizeText(search);
    const title = normalizeText(getBookTitle(book));
    const author = normalizeText(getBookAuthor(book));

    const matchesSearch =
      !keyword || title.includes(keyword) || author.includes(keyword);

    const categoryId = book.category_id ?? book.categoryId;

    const matchesCategory =
      selectedCategory === "all" ||
      String(categoryId) === String(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  // Tổng số sách trong giỏ
  const cartCount = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  // Tổng tiền
  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.price || item.donGia || 0) *
        Number(item.quantity || 0),
    0
  );

  // ==========================================
  // GIAO DIỆN
  // ==========================================

  return (
    <div className="website">
      <header className="header">
        <div className="header-inner">
          <button
            className="logo"
            onClick={() => {
              setShowCart(false);
              setShowAuth(false);
              setCurrentPage("home");
              setSelectedCategory("all");
              setSearch("");
            }}
          >
            <span className="logo-icon">📚</span>
            <span>
              BOOK<span className="logo-highlight">STORE</span>
            </span>
          </button>

          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm sách, tác giả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="search-btn"
              onClick={() => setSearch(search)}
            >
              🔎
            </button>
          </div>

          <div className="header-actions">
            {user ? (
              <div className="user-area">
                <span className="user-greeting">
                  Xin chào, {user.full_name || user.name || "Bạn"}
                </span>
                <button className="text-btn" onClick={logout}>
Đăng xuất
                </button>
              </div>
            ) : (
              <button className="login-btn" onClick={openLogin}>
                Đăng nhập
              </button>
            )}

            <button
              className="cart-button"
              onClick={() => {
                if (!user) {
                  openLogin();
                  setMessage("Vui lòng đăng nhập để xem giỏ hàng.");
                  return;
                }

                setShowAuth(false);
                setShowCart((previous) => !previous);
              }}
            >
              🛒 <span>Giỏ hàng</span>
              <span className="cart-badge">{cartCount}</span>
            </button>
          </div>
        </div>

        <nav className="nav">
          <button
            onClick={() => {
              setShowCart(false);
              setShowAuth(false);
              setCurrentPage("home");
              setSelectedCategory("all");
              setSearch("");
            }}
          >
            Trang chủ
          </button>

          <button
            onClick={() => {
              setShowCart(false);
              setShowAuth(false);
              setCurrentPage("home");
              setSelectedCategory("all");
            }}
          >
            Tất cả sách
          </button>

          <button
            onClick={() => {
              if (!user) {
                openLogin();
                setMessage("Vui lòng đăng nhập để xem giỏ hàng.");
                return;
              }
              setShowAuth(false);
              setCurrentPage("home");
              setShowCart(true);
            }}
          >
            Giỏ hàng
          </button>

          <button
            onClick={async () => {
              if (!user) {
                openLogin();
                setMessage("Vui lòng đăng nhập để xem đơn hàng.");
                return;
              }
              setShowAuth(false);
              setShowCart(false);
              setCurrentPage("orders");
              await loadMyOrders();
            }}
          >
            📦 Đơn hàng của tôi
          </button>

          {user?.role === "admin" && (
            <button
              onClick={async () => {
                setShowAuth(false);
                setShowCart(false);
                setCurrentPage("admin");
                await loadAdminData();
              }}
            >
              🛠️ Quản trị
            </button>
          )}
        </nav>
      </header>

      {/* THÔNG BÁO */}
      {message && (
        <div className="notice">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}

      {/* TRANG CHỦ */}
      {!showCart && !showAuth && currentPage === "home" && (
        <main>
          <section className="hero">
            <div className="hero-content">
              <p className="hero-small">KHÔNG GIAN TRI THỨC</p>

              <h1>
                MỞ THẾ GIỚI
                <br />
                <span>QUA TỪNG TRANG SÁCH</span>
              </h1>

              <p className="hero-description">
                Tìm kiếm những cuốn sách hay, truyền cảm hứng và đồng hành
                cùng bạn trên hành trình phát triển.
              </p>

              <button
                className="hero-btn"
                onClick={() => {
                  setSelectedCategory("all");
                  document.getElementById("book-section")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                Khám phá sách <span>→</span>
              </button>
            </div>

            <div className="hero-decoration">
              <div className="hero-book">📖</div>
<div className="hero-circle"></div>
            </div>
          </section>

          {/* DANH MỤC */}
          <section className="category-section">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">KHO TÀNG TRI THỨC</p>
                <h2>Danh mục sách</h2>
              </div>
            </div>

            <div className="category-list">
              <button
                className={`category-chip ${
                  selectedCategory === "all" ? "active" : ""
                }`}
                onClick={() => setSelectedCategory("all")}
              >
                Tất cả
              </button>

              {categories.map((category) => {
                const categoryId = category.id ?? category.category_id;
                const categoryName =
                  category.name ?? category.category_name;

                return (
                  <button
                    key={categoryId ?? categoryName}
                    className={`category-chip ${
                      String(selectedCategory) === String(categoryId)
                        ? "active"
                        : ""
                    }`}
                    onClick={() => setSelectedCategory(String(categoryId))}
                  >
                    {categoryName}
                  </button>
                );
              })}
            </div>
          </section>

          {/* DANH SÁCH SÁCH */}
          <section className="book-section" id="book-section">
            <div className="section-heading book-heading">
              <div>
                <p className="section-eyebrow">
                  TUYỂN CHỌN DÀNH CHO BẠN
                </p>
                <h2>Danh sách sách</h2>
              </div>

              <span className="book-count">
                {filteredBooks.length} sản phẩm
              </span>
            </div>

            {loading ? (
              <div className="loading">Đang tải sách...</div>
            ) : filteredBooks.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📚</div>
                <h3>Không tìm thấy sách</h3>
                <p>Hãy thử tên sách, tên tác giả hoặc từ khóa khác.</p>

                <button
                  className="primary-btn"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                  }}
                >
                  Xem tất cả sách
                </button>
              </div>
            ) : (
              <div className="book-grid">
                {filteredBooks.map((book) => (
                  <article
                    className="book-card"
                    key={getBookId(book)}
                  >
                    <div className="book-cover">
                      {getBookImage(book) ? (
<img
                          src={getBookImage(book)}
                          alt={getBookTitle(book)}
                        />
                      ) : (
                        <div className="cover-placeholder">
                          <span className="cover-icon">📖</span>
                          <span className="cover-title">
                            {getBookTitle(book)}
                          </span>
                          <span className="cover-author">
                            {getBookAuthor(book)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="book-info">
                      <p className="book-author">
                        {getBookAuthor(book)}
                      </p>

                      <h3>{getBookTitle(book)}</h3>

                      <p className="book-price">
                        {formatPrice(getBookPrice(book))}
                      </p>

                      <button
                        className="add-cart-btn"
                        onClick={() => addToCart(book)}
                      >
                        + Thêm vào giỏ
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {/* GIỎ HÀNG */}
      {showCart && currentPage === "home" && (
        <section className="cart-page">
          <div className="cart-page-heading">
            <button
              className="back-btn"
              onClick={() => setShowCart(false)}
            >
              ← Tiếp tục mua sắm
            </button>

            <h1>Giỏ hàng của bạn</h1>
          </div>

          {cart.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🛒</div>
              <h3>Giỏ hàng đang trống</h3>
              <p>Hãy chọn những cuốn sách bạn yêu thích.</p>

              <button
                className="primary-btn"
                onClick={() => setShowCart(false)}
              >
                Mua sắm ngay
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div
                    className="cart-item"
                    key={item.cart_item_id ?? item.id}
                  >
                    <div className="cart-book-cover">📘</div>

                    <div className="cart-book-details">
                      <h3>{item.title ?? item.book_title}</h3>
                      <p>{item.author ?? item.book_author}</p>

                      <strong>
                        {formatPrice(item.price ?? item.donGia)}
                      </strong>
                    </div>

                    <div className="quantity-control">
<button
                        onClick={() =>
                          updateCartItem(
                            item,
                            Number(item.quantity) - 1
                          )
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() =>
                          updateCartItem(
                            item,
                            Number(item.quantity) + 1
                          )
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeCartItem(item)}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>

              {/* TỔNG KẾT */}
              <div className="cart-summary">
                <h2>Tổng kết đơn hàng</h2>

                <div className="summary-row">
                  <span>Tổng số sách</span>
                  <span>{cartCount}</span>
                </div>

                <div className="summary-row total">
                  <span>Tổng tiền</span>
                  <strong>{formatPrice(cartTotal)}</strong>
                </div>

                <button
                  className="checkout-btn"
                  onClick={() => {
                    setCheckoutName(
                      user?.full_name || user?.name || ""
                    );
                    setCheckoutPhone(user?.phone || "");
                    setShowCheckout((previous) => !previous);
                  }}
                >
                  {showCheckout
                    ? "Ẩn thông tin thanh toán"
                    : "Tiến hành thanh toán"}
                </button>

                <button
                  className="clear-cart-btn"
                  onClick={clearCart}
                >
                  Xóa toàn bộ giỏ hàng
                </button>
              </div>

              {/* FORM THANH TOÁN */}
              {showCheckout && (
                <div className="checkout-panel">
                  <h2>Thông tin giao hàng</h2>

                  <p className="checkout-help">
                    Vui lòng kiểm tra chính xác thông tin trước khi đặt hàng.
                  </p>

                  <form
                    onSubmit={handleCheckout}
                    className="checkout-form"
                  >
                    <label>Họ tên người nhận</label>
                    <input
                      type="text"
                      value={checkoutName}
                      onChange={(e) => setCheckoutName(e.target.value)}
placeholder="Nhập họ tên người nhận"
                      minLength={2}
                      maxLength={100}
                      required
                      disabled={checkoutLoading}
                    />

                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      value={checkoutPhone}
                      onChange={(e) =>
                        setCheckoutPhone(
                          e.target.value.replace(/[^0-9]/g, "")
                        )
                      }
                      placeholder="10–11 chữ số"
                      minLength={10}
                      maxLength={11}
                      required
                      disabled={checkoutLoading}
                    />

                    <label>Địa chỉ giao hàng</label>
                    <input
                      type="text"
                      value={checkoutAddress}
                      onChange={(e) =>
                        setCheckoutAddress(e.target.value)
                      }
                      placeholder="Nhập bất kỳ địa chỉ nào (VD: Lai Xá, Lai Xá Hà Nội...)"
                      minLength={1}
                      maxLength={255}
                      required
                      disabled={checkoutLoading}
                    />

                    <div className="checkout-payment">
                      <strong>Phương thức thanh toán</strong>
                      <label className="pay-option">
                        <input type="radio" name="pay" value="COD" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} disabled={checkoutLoading} />
                        <span>🚚 Thanh toán khi nhận hàng (COD)</span>
                      </label>
                      <label className="pay-option">
                        <input type="radio" name="pay" value="BANK" checked={paymentMethod === "BANK"} onChange={() => setPaymentMethod("BANK")} disabled={checkoutLoading} />
                        <span>🏦 Chuyển khoản ngân hàng (demo)</span>
                      </label>
                      {paymentMethod === "BANK" && (
                        <div className="bank-info">Vietcombank — STK: 123456789 — Chủ TK: BOOKSTORE.<br />Nội dung: TEN + SDT đặt hàng. (Demo, chưa trừ tiền thật)</div>
                      )}
                    </div>

                    <div className="checkout-cost-row">
                      <span>Tiền sách</span>
                      <strong>{formatPrice(cartTotal)}</strong>
                    </div>

                    <div className="checkout-cost-row">
                      <span>Phí vận chuyển</span>
                      <strong>{calcShippingFee(cartTotal) === 0 ? "Miễn phí" : formatPrice(calcShippingFee(cartTotal))}</strong>
                    </div>

                    <div className="checkout-cost-row checkout-final-total">
                      <span>Tổng thanh toán</span>
                      <strong>{formatPrice(cartTotal + calcShippingFee(cartTotal))}</strong>
                    </div>

                    <button
                      className="checkout-submit"
                      type="submit"
                      disabled={checkoutLoading || cart.length === 0}
                    >
                      {checkoutLoading
                        ? "Đang tạo đơn hàng..."
                        : "Xác nhận đặt hàng"}
                    </button>

                    <button
                      className="checkout-cancel"
                      type="button"
                      onClick={() => setShowCheckout(false)}
                      disabled={checkoutLoading}
                    >
                      Quay lại giỏ hàng
                    </button>
                  </form>
                </div>
              )}
</>
          )}
        </section>
      )}

      {/* ĐĂNG NHẬP / ĐĂNG KÝ */}
      {showAuth && (
        <div
          className="auth-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAuth();
            }
          }}
        >
          <div className="auth-card">
            <button
              className="close-auth"
              type="button"
              onClick={closeAuth}
              disabled={authLoading}
            >
              ×
            </button>

            <div className="auth-logo">📚 BOOKSTORE</div>

            <h2>
              {authMode === "login"
                ? "Chào mừng bạn trở lại!"
                : "Tạo tài khoản"}
            </h2>

            <p className="auth-subtitle">
              {authMode === "login"
                ? "Đăng nhập để tiếp tục mua sắm"
                : "Đăng ký tài khoản để khám phá kho sách"}
            </p>

            {authFeedback && (
              <div className="notice" role="alert">
                {authFeedback}
              </div>
            )}

            <form onSubmit={handleAuth}>
              {authMode === "register" && (
                <>
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên"
                    minLength={2}
                    maxLength={100}
                    required
                    disabled={authLoading}
                  />

                  <label>Số điện thoại (không bắt buộc)</label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    maxLength={11}
                    disabled={authLoading}
                  />
                </>
              )}

              <label>Email</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                maxLength={150}
                required
                disabled={authLoading}
              />

              <label>Mật khẩu</label>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    authMode === "login"
? "current-password"
                      : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu (ít nhất 8 ký tự)"
                  minLength={8}
                  maxLength={72}
                  required
                  disabled={authLoading}
                  style={{ flex: 1, minWidth: 0 }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  disabled={authLoading}
                  aria-label={
                    showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                  }
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>

              <button
                className="auth-submit"
                type="submit"
                disabled={authLoading}
              >
                {authLoading
                  ? "Đang xử lý..."
                  : authMode === "login"
                    ? "Đăng nhập"
                    : "Đăng ký"}
              </button>
            </form>

            <div className="auth-switch">
              {authMode === "login" ? (
                <>
                  Chưa có tài khoản?{" "}
                  <button type="button" onClick={openRegister}>
                    Đăng ký
                  </button>
                </>
              ) : (
                <>
                  Đã có tài khoản?{" "}
                  <button type="button" onClick={openLogin}>
                    Đăng nhập
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POPUP THÊM SÁCH VÀO GIỎ */}
      {showCartPopup && (
        <div
          className="cart-popup-overlay"
          onClick={() => setShowCartPopup(false)}
        >
          <div
            className="cart-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="cart-popup-close"
              type="button"
              onClick={() => setShowCartPopup(false)}
            >
              ×
            </button>

            <div className="cart-popup-icon">✓</div>

            <h2>Đã thêm vào giỏ hàng!</h2>

            <p className="cart-popup-book">{cartPopupBook}</p>

            <p className="cart-popup-text">
              Sản phẩm đã được thêm thành công vào giỏ hàng của bạn.
            </p>

            <div className="cart-popup-actions">
              <button
                className="cart-popup-continue"
                type="button"
                onClick={() => setShowCartPopup(false)}
              >
                Tiếp tục mua
              </button>
<button
                className="cart-popup-view"
                type="button"
                onClick={() => {
                  setShowCartPopup(false);
                  setShowCheckout(false);
                  setShowCart(true);
                }}
              >
                Xem giỏ hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LỊCH SỬ ĐƠN HÀNG - US06.01 + US07.02 */}
      {currentPage === "orders" && !showAuth && (
        <section className="cart-page">
          <div className="cart-page-heading">
            <button className="back-btn" onClick={() => setCurrentPage("home")}>← Tiếp tục mua sắm</button>
            <h1>Đơn hàng của tôi</h1>
            <p className="muted">Theo dõi trạng thái vận chuyển. Chỉ hủy được đơn đang &quot;Chờ xác nhận&quot;.</p>
          </div>
          {ordersLoading ? <div className="loading">Đang tải đơn hàng...</div>
          : myOrders.filter((o) => statusFilter === "all" || normStatus(o.status) === normStatus(statusFilter)).length === 0 ? (
            <div className="empty"><div className="empty-icon">📦</div><h3>{myOrders.length === 0 ? "Bạn chưa có đơn hàng nào" : "Không có đơn ở trạng thái này"}</h3>
            <div className="filter-row">
              {["all","Chờ xác nhận","Đã xác nhận","Đang giao","Đã giao","Đã hủy"].map((st) => (
                <button key={st} className={`category-chip ${statusFilter === st ? "active" : ""}`} onClick={() => setStatusFilter(st)}>{st === "all" ? "Tất cả" : st}</button>
              ))}
            </div></div>
          ) : (
            <>
            <div className="filter-row">
              {["all","Chờ xác nhận","Đã xác nhận","Đang giao","Đã giao","Đã hủy"].map((st) => (
                <button key={st} className={`category-chip ${statusFilter === st ? "active" : ""}`} onClick={() => setStatusFilter(st)}>{st === "all" ? "Tất cả" : st}</button>
              ))}
            </div>
            <div className="order-list">
              {myOrders.filter((o) => statusFilter === "all" || normStatus(o.status) === normStatus(statusFilter)).map((o) => (
                <div key={o.id} className="order-card">
                  <div className="order-head"><strong>#{o.id}</strong><span className={`status-badge ${statusClass(o.status)}`}>{displayStatus(o.status)}</span></div>
                  <div className="order-meta">Ngày: {o.created_at ? new Date(o.created_at).toLocaleString("vi-VN") : "—"} • {o.payment_method === "BANK" ? "Chuyển khoản" : "COD"} • Ship: {Number(o.shipping_fee) === 0 ? "Miễn phí" : formatPrice(o.shipping_fee)}</div>
                  <div className="order-total">Tổng: <strong>{formatPrice(o.total)}</strong></div>
                  <div className="order-actions">
                    <button className="primary-btn" onClick={() => openOrderDetail(o.id)}>Xem chi tiết</button>
                    {normStatus(o.status) === "cho" && (<button className="remove-btn" onClick={() => cancelMyOrder(o.id)}>Hủy đơn</button>)}
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
          {orderDetailLoading && <div className="loading">Đang tải chi tiết...</div>}
          {selectedOrder && (
            <div className="order-detail">
              <h2>Chi tiết đơn #{selectedOrder.id} <span className={`status-badge ${statusClass(selectedOrder.status)}`}>{displayStatus(selectedOrder.status)}</span></h2>
              <p>Người nhận: {selectedOrder.recipient_name} — {selectedOrder.phone}</p>
              <p>Địa chỉ: {selectedOrder.address}</p>
              <p>Thanh toán: {selectedOrder.payment_method === "BANK" ? "Chuyển khoản (Vietcombank 123456789 - BOOKSTORE)" : "COD"}</p>
              <div className="cart-items">
                {orderItems.map((it, idx) => (
                  <div key={idx} className="cart-item">
                    <div className="cart-book-cover">📘</div>
                    <div className="cart-book-details"><h3>{it.book_title}</h3><p>Số lượng: {it.quantity} × {formatPrice(it.price)}</p><strong>{formatPrice(Number(it.quantity) * Number(it.price))}</strong></div>
                  </div>
                ))}
              </div>
              <div className="summary-row"><span>Tiền sách</span><span>{formatPrice(selectedOrder.subtotal)}</span></div>
              <div className="summary-row"><span>Phí ship</span><span>{Number(selectedOrder.shipping_fee) === 0 ? "Miễn phí" : formatPrice(selectedOrder.shipping_fee)}</span></div>
              <div className="summary-row total"><span>Tổng</span><strong>{formatPrice(selectedOrder.total)}</strong></div>
              <div className="order-actions">
                {normStatus(selectedOrder.status) === "cho" && (<button className="clear-cart-btn" onClick={() => cancelMyOrder(selectedOrder.id)}>Hủy đơn hàng này</button>)}
                <button className="text-btn" onClick={() => setSelectedOrder(null)}>Đóng chi tiết</button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TRANG QUẢN TRỊ - US06.03 + US07.03 */}
      {currentPage === "admin" && !showAuth && (
        <section className="cart-page admin-page">
          <div className="cart-page-heading">
            <button className="back-btn" onClick={() => setCurrentPage("home")}>← Về trang chủ</button>
            <h1>Quản trị đơn hàng & tài khoản</h1>
            <p className="muted"> cập nhật trạng thái Xác nhận / Đang giao / Đã giao. xem danh sách tài khoản.</p>
          </div>
          {user?.role !== "admin" ? <div className="empty"><h3>Bạn không có quyền admin</h3><p>Đăng nhập bằng tài khoản admin@bookstore.vn để quản trị.</p></div>
          : adminLoading ? <div className="loading">Đang tải dữ liệu...</div>
          : (
            <>
            <h2>Tất cả đơn hàng ({adminOrders.length})</h2>
            <div className="order-list">
              {adminOrders.map((o) => (
                <div key={o.id} className="order-card">
                  <div className="order-head"><strong>#{o.id} — {o.customer_name || o.recipient_name}</strong><span className={`status-badge ${statusClass(o.status)}`}>{displayStatus(o.status)}</span></div>
                  <div className="order-meta">{o.customer_email || ""} • {o.phone} • {o.address} • {formatPrice(o.total)}</div>
                  <div className="order-actions">
                    <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}>
                      {["Chờ xác nhận","Đã xác nhận","Đang giao","Đã giao","Đã hủy"].map((st) => (<option key={st} value={st}>{st}</option>))}
                    </select>
                    <button className="text-btn" onClick={() => openOrderDetail(o.id)}>Chi tiết</button>
                  </div>
                </div>
              ))}
            </div>
            {selectedOrder && (
              <div className="order-detail"><h2>Chi tiết đơn #{selectedOrder.id}</h2>
                <div className="cart-items">{orderItems.map((it, idx) => (<div key={idx} className="cart-item"><div className="cart-book-details"><h3>{it.book_title}</h3><p>{it.quantity} × {formatPrice(it.price)}</p></div></div>))}</div>
                <button className="text-btn" onClick={() => setSelectedOrder(null)}>Đóng</button>
              </div>
            )}
            <h2 style={{ marginTop: 30 }}>Quản lý sách - Thêm / Sửa tồn kho, giá, ảnh</h2>
            {bookMsg && <p className="muted">{bookMsg}</p>}
            <form onSubmit={saveBook} className="order-detail" style={{ display: "grid", gap: 8 }}>
              <strong>{bookForm.id ? `Sửa sách #${bookForm.id}` : "Thêm sách mới"}</strong>
              <input placeholder="Tên sách *" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} required />
              <input placeholder="Tác giả" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" min="0" placeholder="Giá *" value={bookForm.price} onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })} required style={{ flex: 1 }} />
                <input type="number" min="0" step="1" placeholder="Tồn kho" value={bookForm.stock} onChange={(e) => setBookForm({ ...bookForm, stock: e.target.value })} style={{ flex: 1 }} />
              </div>
              <input placeholder="Link ảnh (image_url)" value={bookForm.image_url} onChange={(e) => setBookForm({ ...bookForm, image_url: e.target.value })} />
              <input placeholder="Mô tả" value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} />
              <select value={bookForm.category_id} onChange={(e) => setBookForm({ ...bookForm, category_id: e.target.value })} style={{ padding: 10, borderRadius: 7, border: "1px solid #e1e7df" }}>
                <option value="">-- Chọn danh mục (loại sách) --</option>
                {categories.map((c) => {
                  const cid = c.id ?? c.category_id;
                  const cname = c.name ?? c.category_name;
                  return <option key={cid} value={cid}>{cname}</option>;
                })}
              </select>
              <div className="order-actions">
                <button className="primary-btn" type="submit">{bookForm.id ? "Cập nhật" : "Thêm sách"}</button>
                {bookForm.id && <button type="button" className="text-btn" onClick={() => setBookForm({ id: "", title: "", author: "", price: "", stock: "", category_id: "", image_url: "", description: "" })}>Hủy sửa</button>}
              </div>
            </form>
            <div className="order-list" style={{ marginTop: 12 }}>
              {books.slice(0, 20).map((b) => (
                <div key={b.id} className="order-card">
                  <div className="order-head"><strong>#{b.id} — {b.title}</strong><span className="muted">Tồn: {b.stock} • {formatPrice(b.price)}</span></div>
                  <div className="order-actions" style={{ marginTop: 8 }}>
                    <button className="text-btn" onClick={() => editBook(b)}>Sửa / nhập tồn kho</button>
                    <button className="remove-btn" onClick={() => deleteBook(b.id)}>Xóa</button>
                  </div>
                </div>
              ))}
            </div>
            <h2 style={{ marginTop: 30 }}>Tài khoản ({adminUsers.length})</h2>
            <div className="cart-items">
              {adminUsers.map((u) => (
                <div key={u.id} className="cart-item"><div className="cart-book-details"><h3>{u.full_name} ({u.role})</h3><p>{u.email} • {u.phone || "—"}</p></div></div>
              ))}
            </div>
            </>
          )}
        </section>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-brand">📚 BOOKSTORE</div>
        <p>Tri thức là kho báu vô giá.</p>
        <p className="footer-copy">
          Website bán sách - Dự án học tập CNTT
        </p>
      </footer>
    </div>
  );
}