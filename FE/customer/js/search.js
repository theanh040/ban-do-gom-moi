document.addEventListener("DOMContentLoaded", async () => {
    console.log("Search.js đã được tải và chạy!");

    // Lấy query từ URL (từ khóa tìm kiếm)
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    const searchQueryElement = document.getElementById("searchQuery");
    if (!searchQueryElement) {
        console.error("Không tìm thấy phần tử #searchQuery trong DOM.");
        alert("Không thể hiển thị từ khóa tìm kiếm. Vui lòng kiểm tra HTML.");
        return;
    }
    searchQueryElement.textContent = query || "Không có từ khóa";

    // Lấy input tìm kiếm trên thanh điều hướng
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.value = query || ""; // Đặt giá trị từ URL vào ô tìm kiếm
    } else {
        console.warn("Không tìm thấy phần tử #searchInput trong DOM trên trang này.");
    }

    try {
        // Gọi API để tìm kiếm sản phẩm
        const response = await fetch(`http://localhost/gomseller/BE/api/search_products.php?q=${encodeURIComponent(query || '')}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Lỗi từ server (search_products.php):", errorText);
            throw new Error(`Lỗi khi tìm kiếm sản phẩm: ${response.status} - ${errorText}`);
        }

        const products = await response.json();
        console.log("Dữ liệu sản phẩm tìm kiếm nhận được:", products); // Debug

        const searchResultsGrid = document.getElementById("searchResultsGrid");
        const noResults = document.getElementById("noResults");

        if (!searchResultsGrid || !noResults) {
            console.error("Không tìm thấy phần tử #searchResultsGrid hoặc #noResults trong DOM.");
            alert("Không thể hiển thị kết quả tìm kiếm. Vui lòng kiểm tra HTML.");
            return;
        }

        if (!products || products.length === 0) {
            searchResultsGrid.style.display = "none";
            noResults.style.display = "block";
        } else {
            noResults.style.display = "none";
            renderProducts(products);
        }
    } catch (error) {
        console.error("Lỗi khi tìm kiếm sản phẩm:", error);
        alert("Không thể tải kết quả tìm kiếm. Vui lòng thử lại: " + error.message);
    }

    // Xử lý tìm kiếm mới từ ô tìm kiếm trên trang
    const searchForm = document.getElementById("searchForm");
    if (searchForm) {
        searchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const searchQuery = searchInput?.value.trim();
            if (searchQuery) {
                window.location.href = `/FE/customer/views/search.html?q=${encodeURIComponent(searchQuery)}`;
            }
        });
    } else {
        console.warn("Không tìm thấy phần tử #searchForm trong DOM trên trang này.");
    }
});

// Hàm hiển thị sản phẩm
function renderProducts(products) {
    const container = document.getElementById("searchResultsGrid");
    if (!container) {
        console.error("Không tìm thấy phần tử #searchResultsGrid trong DOM.");
        alert("Không thể hiển thị sản phẩm. Vui lòng kiểm tra HTML.");
        return;
    }

    container.innerHTML = ""; // Xóa nội dung cũ

    products.forEach((product) => {
        const productHTML = `
    <div class="product-item" onclick="window.location.href='/FE/customer/views/product-detail.html?id=${product.product_id}'">
        <img src="${product.image}" alt="${product.product_name}" onerror="this.src='http://localhost/gomseller/BE/uploads/default.jpg'">
        <div class="search-result-text">
            <h4>${product.product_name}</h4>
            <p>${parseInt(product.price).toLocaleString()}đ</p>
        </div>
        <button class="buy-btn" data-product-id="${product.product_id}">Thêm vào giỏ</button>
    </div>
`;
        container.innerHTML += productHTML;
    });

    // Gắn sự kiện cho nút "Thêm vào giỏ"
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.getAttribute('data-product-id'));
            addToCart(productId);
        });
    });
}

// Hàm thêm sản phẩm vào giỏ hàng
async function addToCart(productId) {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
        alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
        window.location.href = "/FE/customer/views/login.html";
        return;
    }

    let userId = localStorage.getItem("loggedInUserId");
    if (!userId) {
        userId = await window.getUserId(loggedInUser);
        if (!userId) {
            alert("Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.");
            return;
        }
        localStorage.setItem("loggedInUserId", userId);
    }

    if (!productId || isNaN(productId) || productId <= 0) {
        alert("Sản phẩm không hợp lệ. Vui lòng thử lại.");
        console.error("Product ID không hợp lệ:", productId);
        return;
    }

    try {
        let response = await fetch(`http://localhost/gomseller/BE/api/cart.php`, {
            method: "PUT",
            body: JSON.stringify({ user_id: userId, product_id: productId, quantity: 1 }),
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            let errorText = await response.text();
            console.error("Lỗi từ server:", errorText);
            throw new Error("Lỗi thêm sản phẩm vào giỏ: " + errorText);
        }

        let result = await response.json();
        if (result.success) {
            alert("Thêm vào giỏ thành công!");
            // Tùy chọn: Chuyển hướng về giỏ hàng
            // window.location.href = "/FE/customer/views/cart.html";
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Không thể thêm sản phẩm vào giỏ. Vui lòng thử lại: " + error.message);
    }
}

// Định nghĩa window.getUserId
window.getUserId = async (username) => {
    try {
        let response = await fetch(`http://localhost/gomseller/BE/api/user.php?username=${username}`, {
            method: "GET",
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Lỗi từ server (user.php):", errorText);
            throw new Error(`Lỗi khi lấy user_id: ${response.status} - ${errorText}`);
        }
        let result = await response.json();
        if (result.success) return result.user_id;
        return null;
    } catch (error) {
        console.error("Lỗi getUserId:", error);
        return null;
    }
};