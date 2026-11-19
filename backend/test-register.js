
const BASE_URL = "http://localhost:5000/api/auth";

// Tạo email riêng cho lần kiểm tra này
const testEmail = `register_test_${Date.now()}@example.com`;

async function runTest() {
    console.log("===== TEST ĐĂNG KÝ TÀI KHOẢN =====");

    try {
        // TEST 1: Đăng ký tài khoản mới
        console.log("\nTEST 1: Đăng ký tài khoản mới");

        const registerResponse = await fetch(`${BASE_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                full_name: "Nguyen Van Test",
                email: testEmail,
                phone: "0987654321",
                password: "TestPassword123"
            })
        });

        const registerData = await registerResponse.json();

        console.log("Status:", registerResponse.status);
        console.log("Response:", registerData);

        if (registerResponse.status !== 201) {
            throw new Error("Đăng ký tài khoản mới thất bại!");
        }

        console.log("PASS: Đăng ký tài khoản mới thành công");

        // TEST 2: Đăng ký lại email vừa dùng
        console.log("\nTEST 2: Kiểm tra email trùng");

        const duplicateResponse = await fetch(`${BASE_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                full_name: "Nguyen Van Test",
                email: testEmail,
                phone: "0987654321",
                password: "TestPassword123"
            })
        });

        const duplicateData = await duplicateResponse.json();

        console.log("Status:", duplicateResponse.status);
        console.log("Response:", duplicateData);

        if (duplicateResponse.status !== 409) {
            throw new Error("Kiểm tra email trùng không đúng!");
        }

        console.log("PASS: Hệ thống đã phát hiện email trùng");

        // TEST 3: Kiểm tra mật khẩu quá ngắn
        console.log("\nTEST 3: Kiểm tra mật khẩu không hợp lệ");

        const invalidResponse = await fetch(`${BASE_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                full_name: "Nguyen Van Test",
                email: `invalid_${Date.now()}@example.com`,
                password: "123"
            })
        });

        const invalidData = await invalidResponse.json();

        console.log("Status:", invalidResponse.status);
        console.log("Response:", invalidData);

        if (invalidResponse.status !== 400) {
            throw new Error("Kiểm tra mật khẩu không hợp lệ thất bại!");
        }

        console.log("PASS: Hệ thống từ chối mật khẩu quá ngắn");

        console.log("\n===== KẾT QUẢ: 3/3 TEST THÀNH CÔNG =====");

    } catch (error) {
        console.error("\nTEST THẤT BẠI:", error.message);
    }
}

runTest();
