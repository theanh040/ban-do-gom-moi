// nav.js
document.addEventListener("DOMContentLoaded", function() {
    checkLoginStatus();

    const searchInput = document.getElementById("searchInput");
    const searchForm = document.querySelector(".search");

    if (searchForm) {
        searchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const searchQuery = searchInput.value.trim();
            if (searchQuery) {
                window.location.href = `/FE/customer/views/search.html?q=${encodeURIComponent(searchQuery)}`;
            }
        });

        // Tự động tìm kiếm khi nhập (tùy chọn, như trong hình ảnh)
        searchInput.addEventListener("input", handleSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener("input", handleSearch);
    }

    // Ẩn kết quả tìm kiếm khi click ra ngoài
    document.addEventListener("click", function(event) {
        if (!document.querySelector(".search").contains(event.target)) {
            document.getElementById("searchResultsContainer").style.display = "none";
        }
    });
});

async function handleSearch() {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    const resultsContainer = document.getElementById("searchResultsContainer");

    if (query === "") {
        resultsContainer.style.display = "none";
        return;
    }

    try {
        const response = await fetch("/BE/api/get_products.php");
        const products = await response.json();

        // Lọc sản phẩm theo từ khóa
        const filteredProducts = products.filter(product =>
            product.product_name.toLowerCase().includes(query)
        );

        if (filteredProducts.length === 0) {
            resultsContainer.innerHTML = "<p style='padding: 10px; color: #666;'>Không tìm thấy sản phẩm.</p>";
            resultsContainer.style.display = "block";
            return;
        }

        // Hiển thị tối đa 4 sản phẩm và nút "Xem thêm"
        const visibleProducts = filteredProducts.slice(0, 4);
        resultsContainer.innerHTML = visibleProducts.map(product => `
            <div class="search-result-item" onclick="window.location.href='/FE/customer/views/product-detail.html?id=${product.product_id}'">
                <img src="${product.image}" alt="${product.product_name}" onerror="this.src='/FE/customer/img/default.jpg'" style="width: 50px; height: 50px; object-fit: contain;">
                <div class="search-result-text">
                    <h4>${product.product_name}</h4>
                    <p>${parseInt(product.price).toLocaleString()}đ</p>
                </div>
            </div>
        `).join("");

        if (filteredProducts.length > 4) {
            resultsContainer.innerHTML += `
                <div class="view-more" onclick="window.location.href='/FE/customer/views/search.html?q=${encodeURIComponent(query)}'">
                    Xem thêm ${filteredProducts.length - 4} sản phẩm
                </div>
            `;
        }

        resultsContainer.style.display = "block";
    } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
        resultsContainer.innerHTML = "<p style='padding: 10px; color: #666;'>Có lỗi xảy ra khi tải sản phẩm.</p>";
        resultsContainer.style.display = "block";
    }
}

function checkLoginStatus() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    console.log("loggedInUser from checkLoginStatus:", loggedInUser); // Kiểm tra giá trị
    const userButton = document.getElementById("userButton");
    if (loggedInUser && userButton) {
        userButton.innerHTML = `
            <button class="user-btn" type="button" onclick="handleLogout()">
                <i class="fa-solid fa-user"></i>
                <span class="label">${loggedInUser}</span>
            </button>
        `;
        userButton.href = "javascript:void(0)";
    } else {
        if (userButton) {
            userButton.innerHTML = `
                <button class="user-btn" type="button">
                    <i class="fa-solid fa-circle-user fa-shake"></i>
                    <span class="label">Tài khoản</span>
                </button>
            `;
            userButton.href = "/FE/customer/views/login.html";
        }
    }
}

function handleLogout() {
    localStorage.clear();
    console.log("Đăng xuất thành công, xóa toàn bộ localStorage");
    window.location.href = "/FE/index.html";
}