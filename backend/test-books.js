// ==========================================
// FILE KIỂM TRA API QUẢN LÝ SÁCH
// ==========================================

const BASE_URL = "http://localhost:5000/api/books";

// Hàm gửi yêu cầu API và hiển thị kết quả
async function testAPI(name, url, options = {}) {
    try {
        const response = await fetch(url, options);
        const data = await response.json();

        console.log("\n================================");
        console.log(name);
        console.log("HTTP Status:", response.status);
        console.log("Ket qua:", data);
        console.log("================================");

        return { response, data };
    } catch (error) {
        console.error("\nLoi khi kiem tra:", name);
        console.error(error.message);

        return null;
    }
}

// Hàm chạy toàn bộ kiểm tra
async function runTests() {
    console.log("BAT DAU KIEM TRA API SACH");

    // 1. Kiểm tra lấy danh sách sách
    await testAPI(
        "1. GET - Lay danh sach sach",
        BASE_URL
    );

    // 2. Tạo sách thử nghiệm với mã riêng để tránh trùng
    const testCode = "TEST" + Date.now();

    const newBook = {
        code: testCode,
        title: "Sach kiem tra API",
        author: "Tac gia test",
        publisher: "Nha xuat ban test",
        price: 50000,
        stock: 10,
        description: "Du lieu sach tao ra de kiem tra API",
        image_url: "",
        category_id: 4
    };

    // 3. Kiểm tra thêm sách
    const createResult = await testAPI(
        "2. POST - Them sach moi",
        BASE_URL,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newBook)
        }
    );

    // Nếu thêm sách thất bại thì dừng các bước phụ thuộc
    if (!createResult || createResult.response.status !== 201) {
        console.log("Khong tao duoc sach test. Dung kiem tra.");
        return;
    }

    const bookId = createResult.data.bookId;

    console.log("ID sach test:", bookId);

    // 4. Kiểm tra lấy chi tiết sách
    await testAPI(
        "3. GET - Lay chi tiet sach",
        `${BASE_URL}/${bookId}`
    );

    // 5. Kiểm tra cập nhật sách
    const updatedBook = {
        code: testCode,
        title: "Sach kiem tra API - Da cap nhat",
        author: "Tac gia test",
        publisher: "Nha xuat ban test",
        price: 75000,
        stock: 15,
        description: "Sach test sau khi cap nhat",
        image_url: "",
        category_id: 4
    };

    const updateResult = await testAPI(
        "4. PUT - Cap nhat sach",
        `${BASE_URL}/${bookId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedBook)
        }
    );

    // 6. Kiểm tra lại dữ liệu sau cập nhật
    if (updateResult && updateResult.response.ok) {
        await testAPI(
            "5. GET - Kiem tra sach sau cap nhat",
            `${BASE_URL}/${bookId}`
        );
    }

    // 7. Xóa sách test vừa tạo để không giữ dữ liệu rác
    await testAPI(
        "6. DELETE - Xoa sach test",
        `${BASE_URL}/${bookId}`,
        {
            method: "DELETE"
        }
    );

    // 8. Kiểm tra sách đã bị xóa chưa
    await testAPI(
        "7. GET - Kiem tra sach sau khi xoa",
        `${BASE_URL}/${bookId}`
    );

    console.log("\nHOAN TAT KIEM TRA API SACH!");
}

// Chạy chương trình
runTests();