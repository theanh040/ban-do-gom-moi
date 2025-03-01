// lienhe.js
document.addEventListener("DOMContentLoaded", () => {
    console.log("Lienhe.js đã được tải và chạy!");

    // Xử lý form liên hệ
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = {
                name: document.getElementById("name").value.trim(),
                email: document.getElementById("email").value.trim(),
                phone: document.getElementById("phone").value.trim(),
                message: document.getElementById("message").value.trim()
            };

            // Lấy user_id nếu người dùng đã đăng nhập
            const loggedInUserId = localStorage.getItem("loggedInUserId");
            if (loggedInUserId) {
                formData.user_id = parseInt(loggedInUserId);
            }

            if (!formData.name || !formData.email || !formData.message) {
                alert("Vui lòng điền đầy đủ các trường bắt buộc (Họ và Tên, Email, Nội Dung).");
                return;
            }

            try {
                const response = await fetch("http://localhost/gomseller/BE/api/contact.php", {
                    method: "POST",
                    body: JSON.stringify(formData),
                    headers: { "Content-Type": "application/json" }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Lỗi từ server (contact.php):", errorText);
                    throw new Error(`Lỗi khi gửi liên hệ: ${response.status} - ${errorText}`);
                }

                const result = await response.json();
                if (result.success) {
                    alert("Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.");
                    contactForm.reset();
                } else {
                    alert("Lỗi: " + result.message);
                }
            } catch (error) {
                console.error("Lỗi:", error);
                alert("Không thể gửi liên hệ. Vui lòng thử lại: " + error.message);
            }
        });
    }

    // Khởi tạo bản đồ Google Maps
    function initMap() {
        const location = { lat: 10.7769, lng: 106.7009 }; // Tọa độ TP. Hồ Chí Minh (giả sử)
        const map = new google.maps.Map(document.getElementById("map"), {
            center: location,
            zoom: 15
        });

        new google.maps.Marker({
            position: location,
            map: map,
            title: "Lạc Hồng Store"
        });
    }

    // Gọi initMap khi bản đồ được tải
    window.initMap = initMap;

    // Hàm tìm kiếm (từ nav.js, giữ nguyên)
    function handleSearch() {
        const query = document.getElementById("searchInput").value.trim().toLowerCase();
        const resultsContainer = document.getElementById("searchResultsContainer");

        if (!resultsContainer) {
            console.error("Không tìm thấy phần tử #searchResultsContainer trong DOM.");
            return;
        }

        if (query === "") {
            resultsContainer.style.display = "none";
            return;
        }

        // Logic tìm kiếm (giả sử sử dụng API tương tự như trước)
        // Bạn có thể giữ nguyên hoặc điều chỉnh từ nav.js
        // Dưới đây là logic cơ bản, bạn có thể tích hợp từ nav.js
        async function fetchSearchResults() {
            try {
                const response = await fetch(`http://localhost/gomseller/BE/api/search_products.php?q=${encodeURIComponent(query)}`);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Lỗi từ server (search_products.php):", errorText);
                    throw new Error(`Lỗi khi tìm kiếm sản phẩm: ${response.status} - ${errorText}`);
                }

                const products = await response.json();
                console.log("Danh sách sản phẩm tìm kiếm từ API:", products);

                let html = "";
                if (products && products.length > 0) {
                    const visibleProducts = products.slice(0, 4);
                    visibleProducts.forEach(product => {
                        html += `
                            <div class="search-result-item" onclick="window.location.href='/FE/customer/views/product-detail.html?id=${product.product_id}'" style="cursor: pointer; padding: 10px; display: flex; align-items: center; border-bottom: 1px solid #ddd;">
                                <img src="http://localhost/gomseller/BE/uploads/${product.image}" alt="${product.product_name}" onerror="this.src='/FE/customer/img/default.jpg'" style="width: 50px; height: 50px; object-fit: contain; margin-right: 10px;">
                                <div class="search-result-text">
                                    <h4 style="margin: 0; color: #333; font-size: 14px;">${product.product_name}</h4>
                                    <p style="margin: 5px 0; color: #007bff; font-size: 12px;">${parseInt(product.price).toLocaleString()} VNĐ</p>
                                </div>
                            </div>
                        `;
                    });
                    html += `
                        <div class="view-more" onclick="window.location.href='/FE/customer/views/search.html?query=${encodeURIComponent(query)}'" style="padding: 10px; color: #2b7ed1; cursor: pointer; text-align: center; font-size: 12px;">
                            Xem thêm ${products.length - 4} sản phẩm
                        </div>
                    `;
                } else {
                    html = "<p style='padding: 10px; color: #666;'>Không tìm thấy sản phẩm.</p>";
                }
                resultsContainer.innerHTML = html;
                resultsContainer.style.display = "block";
                resultsContainer.style.position = "absolute";
                resultsContainer.style.background = "#fff";
                resultsContainer.style.border = "1px solid #ddd";
                resultsContainer.style.borderRadius = "4px";
                resultsContainer.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
                resultsContainer.style.width = "300px";
                resultsContainer.style.maxHeight = "300px";
                resultsContainer.style.overflowY = "auto";
                resultsContainer.style.zIndex = "1000";
            } catch (error) {
                console.error("Lỗi khi tìm kiếm sản phẩm:", error);
                resultsContainer.innerHTML = "<p style='padding: 10px; color: #666;'>Có lỗi xảy ra khi tải sản phẩm.</p>";
                resultsContainer.style.display = "block";
            }
        }

        fetchSearchResults();

        // Ẩn kết quả khi click ra ngoài
        document.addEventListener("click", function (event) {
            if (!document.querySelector(".search").contains(event.target)) {
                document.getElementById("searchResultsContainer").style.display = "none";
            }
        });
    }
});