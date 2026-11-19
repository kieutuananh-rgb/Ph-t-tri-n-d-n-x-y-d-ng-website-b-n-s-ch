
const BASE_URL = "http://localhost:5000/api/auth";

// Tài khoản đã đăng ký thành công ở bài test trước
const testEmail = "register_test_1794986646505@example.com";
const testPassword = "TestPassword123";

async function runTest() {
    let passed = 0;
    const total = 3;

    console.log("===== TEST ĐĂNG NHẬP =====");

    try {
        // TEST 1: Đăng nhập đúng
        console.log("\nTEST 1: Đăng nhập bằng tài khoản hợp lệ");

        const successResponse = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });

        const successData = await successResponse.json();

        console.log("Status:", successResponse.status);
        console.log("Response:", successData);

        if (
            successResponse.status === 200 &&
            successData.token &&
            successData.user
        ) {
            console.log("PASS: Đăng nhập thành công, có JWT Token");
            passed++;
        } else {
            console.log("FAIL: Đăng nhập không thành công");
        }

        // TEST 2: Mật khẩu sai
        console.log("\nTEST 2: Đăng nhập bằng mật khẩu sai");

        const wrongPasswordResponse = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: testEmail,
                password: "WrongPassword123"
            })
        });

        const wrongPasswordData = await wrongPasswordResponse.json();

        console.log("Status:", wrongPasswordResponse.status);
        console.log("Response:", wrongPasswordData);

        if (wrongPasswordResponse.status === 401) {
            console.log("PASS: Hệ thống từ chối mật khẩu sai");
            passed++;
        } else {
            console.log("FAIL: Kiểm tra mật khẩu sai không đạt");
        }

        // TEST 3: Email không tồn tại
        console.log("\nTEST 3: Đăng nhập bằng email không tồn tại");

        const unknownResponse = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: "not_found_123456@example.com",
                password: "TestPassword123"
            })
        });

        const unknownData = await unknownResponse.json();

        console.log("Status:", unknownResponse.status);
        console.log("Response:", unknownData);

        if (unknownResponse.status === 401) {
            console.log("PASS: Hệ thống từ chối email không tồn tại");
            passed++;
        } else {
            console.log("FAIL: Kiểm tra email không tồn tại không đạt");
        }

    } catch (error) {
        console.error("Lỗi khi chạy test:", error.message);
    }

    console.log(`\n===== KẾT QUẢ: ${passed}/${total} TEST THÀNH CÔNG =====`);
}

runTest();
