// cart.js (phần đã sửa)
console.log("cart.js đã được tải và chạy!");

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOMContentLoaded trong cart.js đã chạy!");

    const cartItems = document.getElementById("cart-items");
    const totalPriceElement = document.getElementById("total-price");
    const cartEmpty = document.getElementById("cart-empty");
    const checkoutBtn = document.getElementById("checkout-btn");
    const buyerInfoModal = document.getElementById("buyerInfoModal");
    const buyerInfoForm = document.getElementById("buyerInfoForm");

    if (!cartItems || !totalPriceElement || !cartEmpty || !checkoutBtn || !buyerInfoModal || !buyerInfoForm) {
        console.error("Không tìm thấy một hoặc nhiều phần tử: cart-items, total-price, cart-empty, checkout-btn, buyerInfoModal, buyerInfoForm");
    }

    let userId = localStorage.getItem("loggedInUserId");
    const loggedInUser = localStorage.getItem("loggedInUser");

    console.log("LoggedInUser:", loggedInUser);
    console.log("UserId từ localStorage trước khi kiểm tra:", userId);

    async function getUserId(username) {
        console.log("Gọi getUserId với username:", username);
        try {
            let response = await fetch(`http://localhost/gomseller/BE/api/user.php?username=${username}`, {
                method: "GET",
            });
            if (!response.ok) {
                throw new Error("Lỗi từ server: " + response.status);
            }
            let result = await response.json();
            console.log("Phản hồi từ user.php:", result);
            if (result.success) {
                return result.user_id;
            } else {
                throw new Error(result.message || "Không thể lấy user_id.");
            }
        } catch (error) {
            console.error("Lỗi getUserId:", error);
            return null;
        }
    }

    async function ensureUserId() {
        console.log("Kiểm tra ensureUserId...");
        let userId = localStorage.getItem("loggedInUserId");
        const loggedInUser = localStorage.getItem("loggedInUser");

        if (!loggedInUser) {
            localStorage.removeItem("loggedInUserId");
            userId = null;
            console.log("Không có người dùng đăng nhập, reset userId");
            return false;
        }

        if (!userId) {
            userId = await getUserId(loggedInUser);
            if (userId) {
                localStorage.setItem("loggedInUserId", userId);
                console.log("User ID được lấy và cập nhật:", userId);
            } else {
                alert("Vui lòng đăng nhập để xem giỏ hàng.");
                window.location.href = "/FE/customer/views/login.html";
                return false;
            }
        }

        console.log("UserId sau khi kiểm tra:", userId);
        return true;
    }

    const isCartPage = window.location.pathname.includes("cart.html");
    if (isCartPage) {
        (async () => {
            if (await ensureUserId()) {
                console.log("Gọi loadCart với userId:", userId);
                loadCart();
            } else {
                console.log("Trạng thái không đăng nhập, gọi loadCart với giỏ hàng trống");
                loadCart(); // Hiển thị giỏ hàng trống
            }
        })();
    }

    async function loadCart() {
        let userId = localStorage.getItem("loggedInUserId");
        if (!userId) {
            console.warn("Không có userId, hiển thị giỏ hàng trống");
            renderCart({ order_items: [] });
            return;
        }

        try {
            console.log("Gửi request GET đến http://localhost/gomseller/BE/api/cart.php?user_id=" + userId);
            let response = await fetch(`http://localhost/gomseller/BE/api/cart.php?user_id=${userId}`, {
                method: "GET",
            });
            console.log("Response status:", response.status);
            let cart = await response.json();
            console.log("Dữ liệu giỏ hàng nhận được:", cart);
            renderCart(cart);
        } catch (error) {
            console.error("Lỗi:", error);
        }
    }

    function renderCart(cart) {
        console.log("Bắt đầu render giỏ hàng với dữ liệu:", cart);
        if (!cartItems) {
            console.error("Không tìm thấy phần tử cart-items");
            return;
        }

        cartItems.innerHTML = "";
        if (!cart.order_items || cart.order_items.length === 0) {
            console.log("Giỏ hàng rỗng, hiển thị thông báo trống");
            cartItems.innerHTML = "<tr><td colspan='5'><p>Giỏ hàng trống.</p></td></tr>";
            totalPriceElement.textContent = "0 VNĐ";
            cartEmpty.style.display = "block";
            if (checkoutBtn) checkoutBtn.style.display = "none";
            return;
        }

        cartEmpty.style.display = "none";
        if (checkoutBtn) checkoutBtn.style.display = "inline-block";
        let totalPrice = 0;
        cart.order_items.forEach(item => {
            console.log("Đang render sản phẩm:", item);
            let cartItem = document.createElement("tr");
            cartItem.innerHTML = `
                <td>${item.product_name}</td>
                <td>${formatPrice(item.price)} VNĐ</td>
                <td><input type="number" min="1" value="${item.quantity}" onchange="updateQuantity(${item.product_id}, this.value)"></td>
                <td>${formatPrice(item.price * item.quantity)} VNĐ</td>
                <td><button onclick="removeItem(${item.product_id})">Xóa</button></td>
            `;
            cartItems.appendChild(cartItem);
            totalPrice += item.price * item.quantity;
        });

        totalPriceElement.textContent = formatPrice(totalPrice) + " VNĐ";
    }

    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    async function updateQuantity(productId, quantity) {
        let userId = localStorage.getItem("loggedInUserId");
        if (!userId || quantity < 1) {
            alert("Số lượng phải lớn hơn 0.");
            return;
        }

        try {
            let response = await fetch(`http://localhost/gomseller/BE/api/cart.php`, {
                method: "PUT",
                body: JSON.stringify({ user_id: userId, product_id: productId, quantity: parseInt(quantity) }),
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                throw new Error("Lỗi cập nhật số lượng: " + response.status);
            }
            loadCart();
            alert("Cập nhật số lượng thành công!");
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Không thể cập nhật số lượng.");
        }
    }

    async function removeItem(productId) {
        let userId = localStorage.getItem("loggedInUserId");
        if (!userId || !confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
            return;
        }

        try {
            let response = await fetch(`http://localhost/gomseller/BE/api/cart.php`, {
                method: "DELETE",
                body: JSON.stringify({ user_id: userId, product_id: productId }),
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                throw new Error("Lỗi xóa sản phẩm: " + response.status);
            }
            loadCart();
            alert("Xóa sản phẩm thành công!");
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Không thể xóa sản phẩm.");
        }
    }

    // Hiển thị modal nhập thông tin người mua khi nhấn Thanh toán
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", async function() {
            let userId = localStorage.getItem("loggedInUserId");
            if (!userId) {
                alert("Vui lòng đăng nhập để thanh toán.");
                window.location.href = "/FE/customer/views/login.html";
                return;
            }

            // Hiển thị modal
            buyerInfoModal.style.display = "flex";

            // Đóng modal khi nhấn nút "x"
            const closeBtn = buyerInfoModal.querySelector(".close");
            closeBtn.onclick = () => {
                buyerInfoModal.style.display = "none";
            };

            // Đóng modal khi nhấn ra ngoài
            window.onclick = (event) => {
                if (event.target === buyerInfoModal) {
                    buyerInfoModal.style.display = "none";
                }
            };
        });
    }

    // Xử lý form thông tin người mua
    if (buyerInfoForm) {
        buyerInfoForm.addEventListener("submit", async function(event) {
            event.preventDefault();

            const buyerName = document.getElementById("buyerName").value;
            const buyerPhone = document.getElementById("buyerPhone").value;
            const buyerAddress = document.getElementById("buyerAddress").value;

            // Lưu thông tin người mua vào localStorage
            const buyerInfo = {
                name: buyerName,
                phone: buyerPhone,
                address: buyerAddress
            };
            localStorage.setItem("buyerInfo", JSON.stringify(buyerInfo));

            // Lấy thông tin giỏ hàng để truyền sang checkout
            let userId = localStorage.getItem("loggedInUserId");
            try {
                let response = await fetch(`http://localhost/gomseller/BE/api/cart.php?user_id=${userId}`, {
                    method: "GET",
                });
                if (!response.ok) {
                    throw new Error("Lỗi tải giỏ hàng: " + response.status);
                }
                let cart = await response.json();
                localStorage.setItem("checkoutCart", JSON.stringify(cart));
                // Đóng modal và chuyển hướng
                buyerInfoModal.style.display = "none";
                window.location.href = "/FE/customer/views/checkout.html";
            } catch (error) {
                console.error("Lỗi:", error);
                alert("Không thể chuyển đến trang thanh toán. Vui lòng thử lại: " + error.message);
            }
        });
    }

    window.getUserId = getUserId;
    window.loadCart = loadCart;
    window.renderCart = renderCart;
    window.formatPrice = formatPrice;
    window.updateQuantity = updateQuantity;
    window.removeItem = removeItem;
});