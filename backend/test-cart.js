
const BASE_URL = "http://localhost:5000/api";
const EMAIL = "register_test_1794986646505@example.com";
const PASSWORD = "TestPassword123";

async function runTest() {
    let passed = 0;
    let token = "";
    let cartItemId = null;

    const userId = 2;
    const bookId = 1;

    console.log("===== TEST JWT + GIO HANG =====");

    try {
        // TEST 1: Truy cap khi chua dang nhap
        console.log("\nTEST 1: Truy cap gio hang khi chua dang nhap");

        const unauthorizedResponse = await fetch(
            `${BASE_URL}/cart/${userId}`
        );

        console.log("Status:", unauthorizedResponse.status);

        if (unauthorizedResponse.status === 401) {
            console.log("PASS: Da chan truy cap khong co token");
            passed++;
        } else {
            console.log("FAIL: API chua chan truy cap");
        }

        // TEST 2: Dang nhap lay JWT Token
        console.log("\nTEST 2: Dang nhap lay JWT Token");

        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: EMAIL,
                password: PASSWORD
            })
        });

        const loginData = await loginResponse.json();

        console.log("Status:", loginResponse.status);

        if (loginResponse.status === 200 && loginData.token) {
            token = loginData.token;
            console.log("PASS: Lay JWT Token thanh cong");
            passed++;
        } else {
            throw new Error("Dang nhap that bai, khong lay duoc token");
        }

        // Header xac thuc
        const authHeaders = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };

        // DON GIO HANG TRUOC KHI TEST
        console.log("\nDANG DON GIO HANG CU...");

        const resetResponse = await fetch(
            `${BASE_URL}/cart/${userId}`,
            {
                method: "DELETE",
                headers: authHeaders
            }
        );

        if (resetResponse.status !== 200) {
            throw new Error("Khong don duoc gio hang truoc khi test");
        }

        console.log("Da don gio hang, bat dau test.");

        // TEST 3: Lay gio hang
        console.log("\nTEST 3: Lay gio hang bang token");

        const getCartResponse = await fetch(
            `${BASE_URL}/cart/${userId}`,
            {
                headers: authHeaders
            }
        );

        const getCartData = await getCartResponse.json();

        console.log("Status:", getCartResponse.status);
        console.log("Response:", getCartData);

        if (
            getCartResponse.status === 200 &&
            getCartData.items.length === 0
        ) {
            console.log("PASS: Lay gio hang trong thanh cong");
            passed++;
        } else {
            throw new Error("Gio hang ban dau khong trong");
        }

        // TEST 4: Them sach vao gio hang
        console.log("\nTEST 4: Them sach vao gio hang");

        const addResponse = await fetch(
            `${BASE_URL}/cart/${userId}/items`,
            {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({
                    book_id: bookId,
                    quantity: 2
                })
            }
        );

        const addData = await addResponse.json();

        console.log("Status:", addResponse.status);
        console.log("Response:", addData);

        if (
            addResponse.status === 201 ||
            addResponse.status === 200
        ) {
            console.log("PASS: Them sach thanh cong");
            passed++;
        } else {
            throw new Error("Them sach that bai");
        }

        // TEST 5: Kiem tra sach da them
        console.log("\nTEST 5: Kiem tra noi dung gio hang");

        const verifyResponse = await fetch(
            `${BASE_URL}/cart/${userId}`,
            {
                headers: authHeaders
            }
        );

        const verifyData = await verifyResponse.json();

        console.log("Status:", verifyResponse.status);
        console.log("Response:", verifyData);

        const item = verifyData.items?.find(
            (item) => Number(item.book_id) === bookId
        );

        if (item && Number(item.quantity) === 2) {
            cartItemId = item.cart_item_id;

            console.log("PASS: Sach va so luong duoc luu dung");
            passed++;
        } else {
            throw new Error("So luong sach trong gio khong dung");
        }

        // TEST 6: Cap nhat so luong
        console.log("\nTEST 6: Cap nhat so luong sach");

        const updateResponse = await fetch(
            `${BASE_URL}/cart/${userId}/items/${cartItemId}`,
            {
                method: "PUT",
                headers: authHeaders,
                body: JSON.stringify({
                    quantity: 4
                })
            }
        );

        const updateData = await updateResponse.json();

        console.log("Status:", updateResponse.status);
        console.log("Response:", updateData);

        if (updateResponse.status === 200) {
            console.log("PASS: Cap nhat so luong thanh cong");
            passed++;
        } else {
            throw new Error("Cap nhat so luong that bai");
        }

        // TEST 7: Xoa mot san pham
        console.log("\nTEST 7: Xoa san pham khoi gio");

        const deleteItemResponse = await fetch(
            `${BASE_URL}/cart/${userId}/items/${cartItemId}`,
            {
                method: "DELETE",
                headers: authHeaders
            }
        );

        const deleteItemData = await deleteItemResponse.json();

        console.log("Status:", deleteItemResponse.status);
        console.log("Response:", deleteItemData);

        if (deleteItemResponse.status === 200) {
            console.log("PASS: Xoa san pham thanh cong");
            passed++;
        } else {
            throw new Error("Xoa san pham that bai");
        }

        // TEST 8: Them lai sach
        console.log("\nTEST 8: Them sach lai vao gio");

        const addAgainResponse = await fetch(
            `${BASE_URL}/cart/${userId}/items`,
            {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({
                    book_id: bookId,
                    quantity: 2
                })
            }
        );

        const addAgainData = await addAgainResponse.json();

        console.log("Status:", addAgainResponse.status);
        console.log("Response:", addAgainData);

        if (
            addAgainResponse.status === 201 ||
            addAgainResponse.status === 200
        ) {
            console.log("PASS: Them sach lai thanh cong");
            passed++;
        } else {
            throw new Error("Them sach lai that bai");
        }

        // TEST 9: Xoa toan bo gio hang
        console.log("\nTEST 9: Xoa toan bo gio hang");

        const clearResponse = await fetch(
            `${BASE_URL}/cart/${userId}`,
            {
                method: "DELETE",
                headers: authHeaders
            }
        );

        const clearData = await clearResponse.json();

        console.log("Status:", clearResponse.status);
        console.log("Response:", clearData);

        if (clearResponse.status === 200) {
            console.log("PASS: Xoa toan bo gio hang thanh cong");
            passed++;
        } else {
            throw new Error("Xoa toan bo gio hang that bai");
        }

        // TEST 10: Kiem tra gio hang sau khi xoa
        console.log("\nTEST 10: Kiem tra gio hang sau khi xoa");

        const finalResponse = await fetch(
            `${BASE_URL}/cart/${userId}`,
            {
                headers: authHeaders
            }
        );

        const finalData = await finalResponse.json();

        console.log("Status:", finalResponse.status);
        console.log("Response:", finalData);

        if (
            finalResponse.status === 200 &&
            (!finalData.items || finalData.items.length === 0)
        ) {
            console.log("PASS: Gio hang da trong");
            passed++;
        } else {
            console.log("FAIL: Gio hang van con san pham");
        }

    } catch (error) {
        console.error("\nTEST LOI:", error.message);
    }

    console.log(
        `\n===== KET QUA: ${passed}/10 TEST THANH CONG =====`
    );
}

runTest();
