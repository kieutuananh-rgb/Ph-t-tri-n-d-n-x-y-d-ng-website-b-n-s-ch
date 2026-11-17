
import { useState } from "react";
import "./App.css";

const books = [
  {
    id: 1,
    title: "Đắc Nhân Tâm",
    author: "Dale Carnegie",
    price: 75000,
    category: "Kỹ năng sống",
    cover: "cover-1",
    icon: "📘",
  },
  {
    id: 2,
    title: "Nhà Giả Kim",
    author: "Paulo Coelho",
    price: 68000,
    category: "Văn học",
    cover: "cover-2",
    icon: "📙",
  },
  {
    id: 3,
    title: "Tuổi Trẻ Đáng Giá Bao Nhiêu",
    author: "Rosie Nguyễn",
    price: 85000,
    category: "Kỹ năng sống",
    cover: "cover-3",
    icon: "📗",
  },
  {
    id: 4,
    title: "Tư Duy Nhanh Và Chậm",
    author: "Daniel Kahneman",
    price: 120000,
    category: "Tâm lý học",
    cover: "cover-4",
    icon: "📕",
  },
  {
    id: 5,
    title: "Dế Mèn Phiêu Lưu Ký",
    author: "Tô Hoài",
    price: 55000,
    category: "Văn học",
    cover: "cover-5",
    icon: "📔",
  },
  {
    id: 6,
    title: "Lập Trình Với Java",
    author: "Nguyễn Văn A",
    price: 150000,
    category: "Công nghệ",
    cover: "cover-6",
    icon: "💻",
  },
];

function App() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState("Tất cả");

  const categories = [
    "Tất cả",
    "Văn học",
    "Kỹ năng sống",
    "Tâm lý học",
    "Công nghệ",
  ];

  const filteredBooks = books.filter((book) => {
    const matchSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      category === "Tất cả" || book.category === category;

    return matchSearch && matchCategory;
  });

  const addToCart = (book) => {
    setCart([...cart, book]);
    alert("Đã thêm " + book.title + " vào giỏ hàng!");
  };

  const formatPrice = (price) =>
    price.toLocaleString("vi-VN") + "đ";

  return (
    <div className="app">
      <header className="header">
        <div className="header-container">
          <a className="logo" href="#">
            <span className="logo-icon">📚</span>
            BookStore
          </a>

          <nav className="navigation">
            <a href="#home">Trang chủ</a>
            <a href="#books">Sách</a>
            <a href="#about">Giới thiệu</a>
          </nav>

          <div className="header-actions">
            <span className="cart">
              🛒 Giỏ hàng ({cart.length})
            </span>
            <button className="login-button">Đăng nhập</button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="hero-label">CHÀO MỪNG ĐẾN VỚI BOOKSTORE</span>
            <h1>
              Mở sách ra,
              <br />
              <span>mở thế giới mới</span>
            </h1>
            <p>
              Khám phá hàng ngàn cuốn sách hay và tìm kiếm
              nguồn cảm hứng mỗi ngày.
            </p>
            <a href="#books" className="hero-button">
              Khám phá sách ngay →
            </a>
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
              <span className="section-label">KHO SÁCH CỦA CHÚNG TÔI</span>
              <h2>Sách nổi bật</h2>
              <p>Những cuốn sách được nhiều độc giả yêu thích.</p>
            </div>
          </div>

          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm tên sách hoặc tác giả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="categories">
            {categories.map((item) => (
              <button
                key={item}
                className={category === item ? "category active" : "category"}
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
                  <div className={`book-cover ${book.cover}`}>
                    <span>{book.icon}</span>
                    <small>{book.title}</small>
                  </div>

                  <div className="book-info">
                    <span className="book-category">{book.category}</span>
                    <h3>{book.title}</h3>
                    <p>Tác giả: {book.author}</p>

                    <div className="book-bottom">
                      <strong>{formatPrice(book.price)}</strong>
                      <button onClick={() => addToCart(book)}>
                        + Thêm
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-result">
                Không tìm thấy cuốn sách phù hợp.
              </p>
            )}
          </div>
        </section>

        <section className="about" id="about">
          <h2>BookStore – Không gian dành cho người yêu sách</h2>
          <p>
            Chúng tôi mong muốn mang đến cho bạn những cuốn sách
            chất lượng, giúp việc đọc sách trở nên dễ dàng và thú vị hơn.
          </p>
        </section>
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
