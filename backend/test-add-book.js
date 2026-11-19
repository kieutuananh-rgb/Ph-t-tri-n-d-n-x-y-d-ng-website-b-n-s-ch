const book = {
    code: "BOOK001",
    title: "Lap trinh Java co ban",
    author: "Nguyen Van A",
    publisher: "Nha Xuat Ban Tre",
    price: 85000,
    stock: 20,
    description: "Sach hoc lap trinh Java co ban",
    image_url: "",
    category_id: 4
};

fetch("http://localhost:5000/api/books", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(book)
})
.then(async response => {
    const data = await response.json();
    console.log("HTTP Status:", response.status);
    console.log("Ket qua:", data);
})
.catch(error => {
    console.error("Loi gui yeu cau:", error.message);
});