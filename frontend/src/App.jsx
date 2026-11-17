
import { useMemo, useState } from "react";
import "./App.css";

// ==========================================
// 1. DỮ LIỆU MẪU BAN ĐẦU
// ==========================================

const initialCategories = [
  "Văn học",
  "Kỹ năng sống",
  "Tâm lý học",
  "Công nghệ",
];

const initialBooks = [
  {
    id: 1,
    code: "S001",
    title: "Đắc Nhân Tâm",
    author: "Dale Carnegie",
    publisher: "NXB Tổng hợp TP.HCM",
    price: 75000,
    category: "Kỹ năng sống",
    stock: 30,
    description:
      "Cuốn sách chia sẻ những nguyên tắc giao tiếp và ứng xử giúp xây dựng các mối quan hệ tích cực.",
    icon: "📘",
  },
  {
    id: 2,
    code: "S002",
    title: "Nhà Giả Kim",
    author: "Paulo Coelho",
    publisher: "NXB Hội Nhà Văn",
    price: 68000,
    category: "Văn học",
    stock: 25,
    description:
      "Câu chuyện về hành trình theo đuổi ước mơ và khám phá ý nghĩa cuộc sống.",
    icon: "📙",
  },
  {
    id: 3,
    code: "S003",
    title: "Tuổi Trẻ Đáng Giá Bao Nhiêu",
    author: "Rosie Nguyễn",
    publisher: "NXB Hội Nhà Văn",
    price: 85000,
    category: "Kỹ năng sống",
    stock: 20,
    description:
      "Cuốn sách chia sẻ kinh nghiệm học tập, trải nghiệm và phát triển bản thân.",
    icon: "📗",
  },
  {
    id: 4,
    code: "S004",
    title: "Tư Duy Nhanh Và Chậm",
    author: "Daniel Kahneman",
    publisher: "NXB Thế Giới",
    price: 120000,
    category: "Tâm lý học",
    stock: 15,
    description:
      "Tìm hiểu hai hệ thống tư duy và cách con người đưa ra quyết định.",
    icon: "📕",
  },
  {
    id: 5,
    code: "S005",
    title: "Dế Mèn Phiêu Lưu Ký",
    author: "Tô Hoài",
    publisher: "NXB Kim Đồng",
    price: 55000,
    category: "Văn học",
    stock: 40,
    description:
      "Tác phẩm văn học thiếu nhi nổi tiếng kể về những chuyến phiêu lưu của Dế Mèn.",
    icon: "📔",
  },
  {
    id: 6,
    code: "S006",
    title: "Lập Trình Với Java",
    author: "Nguyễn Văn A",
    publisher: "NXB Giáo dục Việt Nam",
    price: 150000,
    category: "Công nghệ",
    stock: 12,
    description:
      "Tài liệu giới thiệu kiến thức lập trình Java và lập trình hướng đối tượng.",
    icon: "💻",
  },
];

// ==========================================
// 2. CÁC HÀM HỖ TRỢ
// ==========================================

const formatPrice = (price) =>
  Number(price).toLocaleString("vi-VN") + "đ";

function App() {
  // Dữ liệu sách và danh mục
  const [books, setBooks] = useState(initialBooks);
  const [categories, setCategories] = useState(initialCategories);

  // Điều hướng giao diện
  const [page, setPage] = useState("home");

  // Tìm kiếm và lọc sách
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tất cả");

  // Chi tiết sách
  const [selectedBook, setSelectedBook] = useState(null);

  // Giỏ hàng
  const [cart, setCart] = useState([]);

  // Đặt hàng
  const [orders, setOrders] = useState([]);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [payment, setPayment] = useState("COD");

  // Quản lý sách
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState({
    code: "",
    title: "",
    author: "",
    publisher: "",
    price: "",
    category: initialCategories[0],
    stock: "",
    description: "",
    icon: "📚",
  });

  // Quản lý danh mục
  const [newCategory, setNewCategory] = useState("");

  // ==========================================
  // 3. TÌM KIẾM VÀ LỌC SÁCH
  // ==========================================

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const keyword = search.toLowerCase().trim();

      const matchSearch =
        book.title.toLowerCase().includes(keyword) ||
        book.author.toLowerCase().includes(keyword) ||
        book.code.toLowerCase().includes(keyword);

      const matchCategory =
        category === "Tất cả" || book.category === category;

      return matchSearch && matchCategory && book.stock > 0;
    });
  }, [books, search, category]);

  // ==========================================
  // 4. QUẢN LÝ GIỎ HÀNG
  // ==========================================

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Phí vận chuyển mô phỏng: miễn phí khi đơn từ 300.000đ
  const shippingFee = subtotal === 0 || subtotal >= 300000 ? 0 : 30000;

  const total = subtotal + shippingFee;

  const addToCart = (book) => {
    if (book.stock <= 0) {
      alert("Sách hiện đã hết hàng.");
      return;
    }

    const existingItem = cart.find((item) => item.id === book.id);

    if (existingItem && existingItem.quantity >= book.stock) {
      alert("Số lượng trong giỏ đã đạt số lượng tồn kho.");
      return;
    }

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === book.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...book, quantity: 1 }]);
    }

    alert("Đã thêm sách vào giỏ hàng!");
  };

  const changeQuantity = (id, amount) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.id !== id) return item;

          const book = books.find((book) => book.id === id);
          const newQuantity = item.quantity + amount;

          if (newQuantity > (book?.stock || 0)) {
            alert("Số lượng vượt quá tồn kho.");
            return item;
          }

          return { ...item, quantity: newQuantity };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // ==========================================
  // 5. ĐẶT HÀNG
  // ==========================================

  const handleCheckout = (event) => {
    event.preventDefault();

    if (cart.length === 0) {
      alert("Giỏ hàng đang trống.");
      return;
    }

    if (!customer.name.trim() ||
        !customer.phone.trim() ||
        !customer.address.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin giao hàng.");
      return;
    }

    const invalidItem = cart.find((item) => {
      const book = books.find((book) => book.id === item.id);
      return !book || book.stock < item.quantity;
    });

    if (invalidItem) {
      alert("Có sản phẩm không đủ số lượng tồn kho.");
      return;
    }

    const newOrder = {
      id: "DH" + Date.now(),
      customer: { ...customer },
      items: [...cart],
      subtotal,
      shippingFee,
      total,
      payment,
      status: "Chờ xác nhận",
      createdAt: new Date().toLocaleString("vi-VN"),
    };

    // Cập nhật số lượng tồn kho
    setBooks((currentBooks) =>
      currentBooks.map((book) => {
        const orderedItem = cart.find((item) => item.id === book.id);

        if (!orderedItem) return book;

        return {
          ...book,
          stock: book.stock - orderedItem.quantity,
        };
      })
    );

    setOrders((currentOrders) => [...currentOrders, newOrder]);
    setCart([]);

    setCustomer({
      name: "",
      phone: "",
      address: "",
    });

    alert("Đặt hàng thành công! Mã đơn hàng: " + newOrder.id);
    setPage("orders");
  };

  // ==========================================
  // 6. QUẢN LÝ THÔNG TIN SÁCH
  // ==========================================

  const resetBookForm = () => {
    setEditingBook(null);
    setBookForm({
      code: "",
      title: "",
      author: "",
      publisher: "",
      price: "",
      category: categories[0] || "",
      stock: "",
      description: "",
      icon: "📚",
    });
  };

  const handleBookSubmit = (event) => {
    event.preventDefault();

    const price = Number(bookForm.price);
    const stock = Number(bookForm.stock);

    if (
      !bookForm.code.trim() ||
      !bookForm.title.trim() ||
      !bookForm.author.trim() ||
      !bookForm.category ||
      !bookForm.publisher.trim()
    ) {
      alert("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      alert("Giá bán phải lớn hơn 0.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      alert("Số lượng tồn kho phải là số nguyên không âm.");
      return;
    }

    const duplicateCode = books.some(
      (book) =>
        book.code.toLowerCase() === bookForm.code.trim().toLowerCase() &&
        book.id !== editingBook
    );

    if (duplicateCode) {
      alert("Mã sách đã tồn tại.");
      return;
    }

    if (editingBook) {
      setBooks((currentBooks) =>
        currentBooks.map((book) =>
          book.id === editingBook
            ? {
                ...book,
                ...bookForm,
                price,
                stock,
              }
            : book
        )
      );

      alert("Cập nhật thông tin sách thành công.");
    } else {
      const newBook = {
        id: Date.now(),
        ...bookForm,
        code: bookForm.code.trim(),
        price,
        stock,
      };

      setBooks((currentBooks) => [...currentBooks, newBook]);
      alert("Thêm sách mới thành công.");
    }

    resetBookForm();
  };

  const editBook = (book) => {
    setEditingBook(book.id);
    setBookForm({
      code: book.code,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      price: book.price,
      category: book.category,
      stock: book.stock,
      description: book.description,
      icon: book.icon,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteBook = (id) => {
    const isInCart = cart.some((item) => item.id === id);

    if (isInCart) {
      alert("Không thể xóa sách đang có trong giỏ hàng.");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn xóa sách này?")) return;

    setBooks(books.filter((book) => book.id !== id));
  };

  // ==========================================
  // 7. QUẢN LÝ DANH MỤC SÁCH
  // ==========================================

  const addCategory = (event) => {
    event.preventDefault();

    const name = newCategory.trim();

    if (!name) {
      alert("Vui lòng nhập tên danh mục.");
      return;
    }

    if (
      categories.some(
        (item) => item.toLowerCase() === name.toLowerCase()
      )
    ) {
      alert("Danh mục đã tồn tại.");
      return;
    }

    setCategories([...categories, name]);
    setNewCategory("");
    alert("Thêm danh mục thành công.");
  };

  const deleteCategory = (name) => {
    const hasBooks = books.some((book) => book.category === name);

    if (hasBooks) {
      alert("Không thể xóa danh mục đang chứa sách.");
      return;
    }

    if (!window.confirm("Xóa danh mục " + name + "?")) return;

    setCategories(categories.filter((item) => item !== name));
  };

  // ==========================================
  // 8. GIAO DIỆN HEADER
  // ==========================================

  return (
    <div className="app">
      <header className="header">
        <div className="header-container">
          <button
            className="logo"
            onClick={() => setPage("home")}
          >
            <span className="logo-icon">📚</span>
            BookStore
          </button>

          <nav className="navigation">
            <button onClick={() => setPage("home")}>
              Trang chủ
            </button>

            <button
              onClick={() => {
                setPage("home");
                document
                  .getElementById("books")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Sách
            </button>

            <button onClick={() => setPage("orders")}>
              Đơn hàng
            </button>

            <button onClick={() => setPage("about")}>
              Giới thiệu
            </button>
          </nav>

          <div className="header-actions">
            <button
              className="cart"
              onClick={() => setPage("cart")}
            >
              🛒 Giỏ hàng ({cartCount})
            </button>

            <button
              className="login-button"
              onClick={() => setPage("admin")}
            >
              Quản lý
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ==================================
            TRANG CHỦ VÀ DANH SÁCH SÁCH
        ================================== */}

        {page === "home" && (
          <>
            <section className="hero" id="home">
              <div className="hero-content">
                <span className="hero-label">
                  CHÀO MỪNG ĐẾN VỚI BOOKSTORE
                </span>

                <h1>
                  Mở sách ra,
                  <br />
                  <span>mở thế giới mới</span>
                </h1>

                <p>
                  Khám phá những cuốn sách hay và tìm kiếm
                  nguồn cảm hứng mỗi ngày.
                </p>

                <button
                  className="hero-button"
                  onClick={() =>
                    document
                      .getElementById("books")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Khám phá sách ngay →
                </button>
              </div>

              <div className="hero-decoration">
                <div className="hero-book">📚</div>
                <span>Tri thức là sức mạnh</span>
              </div>
            </section>

            <section className="benefits">
              <div>🚚 Giao hàng toàn quốc</div>
              <div>📖 Sách đa dạng thể loại</div>
              <div>🎁 Ưu đãi hấp dẫn</div>
            </section>

            <section className="book-section" id="books">
              <div className="section-heading">
                <div>
                  <span className="section-label">
                    KHO SÁCH CỦA CHÚNG TÔI
                  </span>
                  <h2>Danh sách sách</h2>
                  <p>
                    Lựa chọn những cuốn sách phù hợp với bạn.
                  </p>
                </div>
              </div>

              <div className="search-box">
                <span>🔍</span>

                <input
                  type="text"
                  placeholder="Tìm theo tên sách, tác giả hoặc mã sách..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

              <div className="categories">
                {["Tất cả", ...categories].map((item) => (
                  <button
                    key={item}
                    className={
                      category === item
                        ? "category active"
                        : "category"
                    }
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="book-grid">
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((book) => (
                    <div className="book-card" key={book.id}>
                      <div className="book-cover">
                        <span>{book.icon}</span>
                        <small>{book.title}</small>
                      </div>

                      <div className="book-info">
                        <span className="book-category">
                          {book.category}
                        </span>

                        <h3>{book.title}</h3>

                        <p>Tác giả: {book.author}</p>
                        <p>Mã sách: {book.code}</p>

                        <p>
                          Còn lại: {book.stock} cuốn
                        </p>

                        <div className="book-bottom">
                          <strong>
                            {formatPrice(book.price)}
                          </strong>

                          <div className="book-buttons">
                            <button
                              className="detail-button"
                              onClick={() =>
                                setSelectedBook(book)
                              }
                            >
                              Chi tiết
                            </button>

                            <button
                              onClick={() => addToCart(book)}
                            >
                              + Thêm
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-result">
                    Không tìm thấy sách phù hợp.
                  </p>
                )}
              </div>
            </section>

            <section className="about" id="about">
              <h2>
                BookStore – Không gian dành cho người yêu sách
              </h2>

              <p>
                Chúng tôi mong muốn mang đến những cuốn sách
                chất lượng, giúp việc đọc sách trở nên dễ dàng
                và thú vị hơn.
              </p>
            </section>
          </>
        )}

        {/* ==================================
            CHI TIẾT SÁCH
        ================================== */}

        {selectedBook && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedBook(null)}
          >
            <div
              className="book-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="close-modal"
                onClick={() => setSelectedBook(null)}
              >
                ×
              </button>

              <div className="modal-cover">
                <span>{selectedBook.icon}</span>
                <h3>{selectedBook.title}</h3>
              </div>

              <div className="modal-info">
                <span className="book-category">
                  {selectedBook.category}
                </span>

                <h2>{selectedBook.title}</h2>

                <p>
                  <strong>Mã sách:</strong> {selectedBook.code}
                </p>

                <p>
                  <strong>Tác giả:</strong> {selectedBook.author}
                </p>

                <p>
                  <strong>Nhà xuất bản:</strong>{" "}
                  {selectedBook.publisher}
                </p>

                <p>
                  <strong>Số lượng tồn:</strong>{" "}
                  {selectedBook.stock}
                </p>

                <p>{selectedBook.description}</p>

                <h3>{formatPrice(selectedBook.price)}</h3>

                <button
                  className="modal-add-button"
                  onClick={() => {
                    addToCart(selectedBook);
                    setSelectedBook(null);
                  }}
                >
                  🛒 Thêm vào giỏ hàng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================
            GIỎ HÀNG
        ================================== */}

        {page === "cart" && (
          <section className="page-section">
            <h2>Giỏ hàng của bạn</h2>

            {cart.length === 0 ? (
              <div className="empty-state">
                <p>🛒 Giỏ hàng hiện đang trống.</p>

                <button
                  className="primary-button"
                  onClick={() => setPage("home")}
                >
                  Tiếp tục mua sách
                </button>
              </div>
            ) : (
              <>
                <div className="cart-list">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <div className="cart-book-icon">
                        {item.icon}
                      </div>

                      <div className="cart-item-info">
                        <h3>{item.title}</h3>
                        <p>{item.author}</p>
                        <strong>
                          {formatPrice(item.price)}
                        </strong>
                      </div>

                      <div className="quantity-control">
                        <button
                          onClick={() =>
                            changeQuantity(item.id, -1)
                          }
                        >
                          -
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() =>
                            changeQuantity(item.id, 1)
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="delete-button"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <p>
                    Tạm tính: <strong>{formatPrice(subtotal)}</strong>
                  </p>

                  <p>
                    Phí vận chuyển:{" "}
                    <strong>{formatPrice(shippingFee)}</strong>
                  </p>

                  <h3>
                    Tổng tiền: {formatPrice(total)}
                  </h3>

                  <button
                    className="primary-button"
                    onClick={() => setPage("checkout")}
                  >
                    Tiến hành đặt hàng
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {/* ==================================
            ĐẶT HÀNG
        ================================== */}

        {page === "checkout" && (
          <section className="page-section">
            <h2>Thông tin đặt hàng</h2>

            {cart.length === 0 ? (
              <div className="empty-state">
                <p>Giỏ hàng đang trống.</p>
                <button
                  className="primary-button"
                  onClick={() => setPage("home")}
                >
                  Quay lại trang chủ
                </button>
              </div>
            ) : (
              <form
                className="checkout-form"
                onSubmit={handleCheckout}
              >
                <h3>Thông tin người nhận</h3>

                <label>Họ và tên</label>
                <input
                  required
                  value={customer.name}
                  onChange={(event) =>
                    setCustomer({
                      ...customer,
                      name: event.target.value,
                    })
                  }
                  placeholder="Nhập họ và tên"
                />

                <label>Số điện thoại</label>
                <input
                  required
                  type="tel"
                  value={customer.phone}
                  onChange={(event) =>
                    setCustomer({
                      ...customer,
                      phone: event.target.value,
                    })
                  }
                  placeholder="Nhập số điện thoại"
                />

                <label>Địa chỉ giao hàng</label>
                <textarea
                  required
                  value={customer.address}
                  onChange={(event) =>
                    setCustomer({
                      ...customer,
                      address: event.target.value,
                    })
                  }
                  placeholder="Nhập địa chỉ nhận hàng"
                />

                <h3>Phương thức thanh toán</h3>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={payment === "COD"}
                    onChange={(event) =>
                      setPayment(event.target.value)
                    }
                  />
                  Thanh toán khi nhận hàng (COD)
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="Chuyển khoản"
                    checked={payment === "Chuyển khoản"}
                    onChange={(event) =>
                      setPayment(event.target.value)
                    }
                  />
                  Chuyển khoản (mô phỏng)
                </label>

                <div className="cart-summary">
                  <p>Tạm tính: {formatPrice(subtotal)}</p>
                  <p>Phí vận chuyển: {formatPrice(shippingFee)}</p>
                  <h3>Tổng thanh toán: {formatPrice(total)}</h3>
                </div>

                <button
                  className="primary-button"
                  type="submit"
                >
                  Xác nhận đặt hàng
                </button>
              </form>
            )}
          </section>
        )}

        {/* ==================================
            DANH SÁCH ĐƠN HÀNG
        ================================== */}

        {page === "orders" && (
          <section className="page-section">
            <h2>Đơn hàng đã tạo</h2>

            {orders.length === 0 ? (
              <div className="empty-state">
                <p>Bạn chưa có đơn hàng nào.</p>
                <button
                  className="primary-button"
                  onClick={() => setPage("home")}
                >
                  Mua sách ngay
                </button>
              </div>
            ) : (
              <div className="order-list">
                {orders.map((order) => (
                  <div className="order-card" key={order.id}>
                    <h3>Đơn hàng: {order.id}</h3>

                    <p>Người nhận: {order.customer.name}</p>
                    <p>Số điện thoại: {order.customer.phone}</p>
                    <p>Địa chỉ: {order.customer.address}</p>
                    <p>Ngày đặt: {order.createdAt}</p>
                    <p>Thanh toán: {order.payment}</p>
                    <p>Trạng thái: {order.status}</p>

                    <div>
                      {order.items.map((item) => (
                        <p key={item.id}>
                          {item.title} × {item.quantity}
                        </p>
                      ))}
                    </div>

                    <strong>
                      Tổng tiền: {formatPrice(order.total)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ==================================
            QUẢN LÝ SÁCH VÀ DANH MỤC
        ================================== */}

        {page === "admin" && (
          <section className="page-section admin-section">
            <h2>Khu vực quản lý</h2>

            <p>
              Quản lý thông tin sách, số lượng tồn kho và danh mục.
            </p>

            <div className="admin-panel">
              <h3>
                {editingBook
                  ? "Cập nhật thông tin sách"
                  : "Thêm sách mới"}
              </h3>

              <form
                className="admin-form"
                onSubmit={handleBookSubmit}
              >
                <label>Mã sách *</label>
                <input
                  required
                  value={bookForm.code}
                  onChange={(event) =>
                    setBookForm({
                      ...bookForm,
                      code: event.target.value,
                    })
                  }
                  placeholder="Ví dụ: S007"
                />

                <label>Tên sách *</label>
                <input
                  required
                  value={bookForm.title}
                  onChange={(event) =>
                    setBookForm({
                      ...bookForm,
                      title: event.target.value,
                    })
                  }
                  placeholder="Nhập tên sách"
                />

                <label>Tác giả *</label>
                <input
                  required
                  value={bookForm.author}
                  onChange={(event) =>
                    setBookForm({
                      ...bookForm,
                      author: event.target.value,
                    })
                  }
                  placeholder="Nhập tên tác giả"
                />

                <label>Nhà xuất bản *</label>
                <input
                  required
                  value={bookForm.publisher}
                  onChange={(event) =>
                    setBookForm({
                      ...bookForm,
                      publisher: event.target.value,
                    })
                  }
                  placeholder="Nhập nhà xuất bản"
                />

                <label>Giá bán *</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={bookForm.price}
                  onChange={(event) =>
                    setBookForm({
                      ...bookForm,
                      price: event.target.value,
                    })
                  }
                  placeholder="Nhập giá bán"
                />

                <label>Số lượng tồn kho *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={bookForm.stock}
                  onChange={(event) =>
                    setBookForm({
                      ...bookForm,
                      stock: event.target.value,
                    })
                  }
                  placeholder="Nhập số lượng tồn"
                />

                <label>Danh mục *</label>
                <select
                  required
                  value={bookForm.category}
                  onChange={(event) =>
                    setBookForm({
                      ...bookForm,
                      category: event.target.value,
                    })
                  }
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <label>Biểu tượng minh họa</label>
                <input
                  value={bookForm.icon}
                  onChange={(event) =>
                    setBookForm({
                      ...bookForm,
                      icon: event.target.value,
                    })
                  }
                />

                <label>Mô tả sách</label>
                <textarea
                  value={bookForm.description}
                  onChange={(event) =>
                    setBookForm({
                      ...bookForm,
                      description: event.target.value,
                    })
                  }
                  placeholder="Nhập mô tả sách"
                />

                <div className="admin-form-buttons">
                  <button
                    className="primary-button"
                    type="submit"
                  >
                    {editingBook ? "Lưu thay đổi" : "Thêm sách"}
                  </button>

                  {editingBook && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={resetBookForm}
                    >
                      Hủy chỉnh sửa
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="admin-panel">
              <h3>Quản lý danh mục sách</h3>

              <form
                className="category-form"
                onSubmit={addCategory}
              >
                <input
                  value={newCategory}
                  onChange={(event) =>
                    setNewCategory(event.target.value)
                  }
                  placeholder="Nhập tên danh mục mới"
                />

                <button className="primary-button" type="submit">
                  Thêm danh mục
                </button>
              </form>

              <div className="admin-category-list">
                {categories.map((item) => (
                  <div key={item}>
                    <span>{item}</span>
                    <button
                      className="delete-button"
                      onClick={() => deleteCategory(item)}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-panel">
              <h3>Danh sách sách trong hệ thống</h3>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã sách</th>
                      <th>Tên sách</th>
                      <th>Danh mục</th>
                      <th>Giá bán</th>
                      <th>Tồn kho</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {books.map((book) => (
                      <tr key={book.id}>
                        <td>{book.code}</td>
                        <td>{book.title}</td>
                        <td>{book.category}</td>
                        <td>{formatPrice(book.price)}</td>
                        <td>{book.stock}</td>
                        <td>
                          <button
                            className="detail-button"
                            onClick={() => editBook(book)}
                          >
                            Sửa
                          </button>

                          <button
                            className="delete-button"
                            onClick={() => deleteBook(book.id)}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ==================================
            GIỚI THIỆU
        ================================== */}

        {page === "about" && (
          <section className="page-section">
            <h2>Giới thiệu BookStore</h2>

            <p>
              BookStore là website bán sách trực tuyến được xây dựng
              nhằm hỗ trợ khách hàng tìm kiếm, lựa chọn và đặt mua
              sách. Hệ thống đồng thời hỗ trợ người quản lý theo dõi
              thông tin sách, danh mục, số lượng tồn kho và đơn hàng.
            </p>

            <button
              className="primary-button"
              onClick={() => setPage("home")}
            >
              Quay lại trang chủ
            </button>
          </section>
        )}
      </main>

      <footer className="footer">
        <h2>📚 BookStore</h2>
        <p>Đọc sách hôm nay – Kiến tạo tương lai.</p>
        <p>© 2026 BookStore. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
