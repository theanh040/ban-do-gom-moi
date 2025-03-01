document.addEventListener("DOMContentLoaded", async () => {
    console.log("Checkout.js đã được tải và chạy!");

    const orderItems = document.getElementById("order-items");
    const totalOrderPrice = document.getElementById("total-order-price");
    const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
    const confirmPaymentBtn = document.getElementById("confirm-payment-btn");
    const qrContainer = document.getElementById("qr-container");
    const qrCodeImg = document.getElementById("qrCode");
    const qrAmount = document.getElementById("qr-amount");
    const confirmQrPaymentBtn = document.getElementById("confirm-qr-payment");
    const paymentResult = document.getElementById("payment-result");

    let userId = localStorage.getItem("loggedInUserId");
    const loggedInUser = localStorage.getItem("loggedInUser");

    // Kiểm tra đăng nhập
    async function ensureUserId() {
        if (!loggedInUser) {
            alert("Vui lòng đăng nhập để thanh toán.");
            window.location.href = "/FE/customer/views/login.html";
            return false;
        }

        if (!userId) {
            userId = await window.getUserId(loggedInUser);
            if (!userId) {
                alert("Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.");
                window.location.href = "/FE/customer/views/login.html";
                return false;
            }
            localStorage.setItem("loggedInUserId", userId);
        }
        return true;
    }

    // Load thông tin giỏ hàng từ localStorage
    function loadCartFromLocalStorage() {
        const cartData = localStorage.getItem("checkoutCart");
        if (!cartData) {
            alert("Không có thông tin đơn hàng. Vui lòng quay lại giỏ hàng.");
            window.location.href = "/FE/customer/views/cart.html";
            return null;
        }
        return JSON.parse(cartData);
    }

    // Render thông tin đơn hàng
    function renderOrderSummary(cart) {
        orderItems.innerHTML = "";
        if (!cart.order_items || cart.order_items.length === 0) {
            orderItems.innerHTML = "<tr><td colspan='4'><p>Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.</p></td></tr>";
            totalOrderPrice.textContent = "0 VNĐ";
            confirmPaymentBtn.disabled = true;
            return;
        }

        let totalPrice = 0;
        cart.order_items.forEach(item => {
            let orderItem = document.createElement("tr");
            orderItem.innerHTML = `
                <td>${item.product_name}</td>
                <td>${formatPrice(item.price)} VNĐ</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.price * item.quantity)} VNĐ</td>
            `;
            orderItems.appendChild(orderItem);
            totalPrice += item.price * item.quantity;
        });

        totalOrderPrice.textContent = formatPrice(totalPrice) + " VNĐ";
        confirmPaymentBtn.disabled = false;
    }

    // Hàm định dạng giá tiền
    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Xử lý chọn phương thức thanh toán
    paymentMethodRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            confirmPaymentBtn.disabled = false;
            if (radio.value === "qr") {
                qrContainer.style.display = "block";
                const cart = loadCartFromLocalStorage();
                if (cart) {
                    const total = cart.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    qrAmount.textContent = formatPrice(total);
                    // Cập nhật URL mã QR với số tiền (nếu VietQR hỗ trợ)
                    qrCodeImg.src = `https://api.vietqr.io/image/970407-19073820149015-NGefe7a.jpg?accountName=NGUYEN%20THE%20ANH&amount=${total}`;
                }
            } else {
                qrContainer.style.display = "none";
            }
        });
    });

    // Xử lý xác nhận thanh toán
    confirmPaymentBtn.addEventListener("click", async () => {
        if (!(await ensureUserId())) return;

        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
        if (!paymentMethod) {
            alert("Vui lòng chọn phương thức thanh toán.");
            return;
        }

        try {
            let response;
            if (paymentMethod === "qr") {
                // Xác nhận thanh toán qua QR (gọi API để kiểm tra giao dịch)
                response = await handleQRPayment(userId);
            } else if (paymentMethod === "cod") {
                // Xử lý thanh toán COD
                response = await handleCODPayment(userId);
            }

            if (!response.ok) {
                let errorText = await response.text();
                console.error("Lỗi từ server:", errorText);
                throw new Error("Lỗi thanh toán: " + errorText);
            }

            let result = await response.json();
            paymentResult.className = "payment-result success";
            paymentResult.textContent = "Thanh toán thành công!";
            // Xóa dữ liệu giỏ hàng khỏi localStorage sau thanh toán
            localStorage.removeItem("checkoutCart");
            // Chuyển hướng về cart.html sau 2 giây
            setTimeout(() => {
                window.location.href = "/FE/customer/views/cart.html";
            }, 2000);
        } catch (error) {
            console.error("Lỗi:", error);
            paymentResult.className = "payment-result error";
            paymentResult.textContent = "Thanh toán thất bại: " + error.message;
        }
    });

    // Xử lý xác nhận thanh toán QR
    if (confirmQrPaymentBtn) {
        confirmQrPaymentBtn.addEventListener("click", async () => {
            if (!(await ensureUserId())) return;

            try {
                let response = await handleQRPayment(userId);
                if (!response.ok) {
                    let errorText = await response.text();
                    console.error("Lỗi từ server:", errorText);
                    throw new Error("Lỗi xác nhận thanh toán QR: " + errorText);
                }

                let result = await response.json();
                paymentResult.className = "payment-result success";
                paymentResult.textContent = "Thanh toán thành công!";
                // Xóa dữ liệu giỏ hàng khỏi localStorage sau thanh toán
                localStorage.removeItem("checkoutCart");
                // Chuyển hướng về cart.html sau 2 giây
                setTimeout(() => {
                    window.location.href = "/FE/customer/views/cart.html";
                }, 2000);
            } catch (error) {
                console.error("Lỗi:", error);
                paymentResult.className = "payment-result error";
                paymentResult.textContent = "Xác nhận thanh toán QR thất bại: " + error.message;
            }
        });
    }

    // Hàm xử lý thanh toán QR
    async function handleQRPayment(userId) {
        console.log("Thực hiện xác nhận thanh toán QR cho user_id:", userId);
        const cart = loadCartFromLocalStorage();
        if (!cart) return;
        const orderTotal = cart.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let response = await fetch(`http://localhost:3000/BE/api/checkout_qr.php`, {
            method: "POST",
            body: JSON.stringify({ user_id: userId, amount: orderTotal }),
            headers: { "Content-Type": "application/json" },
        });
        return response;
    }

    // Hàm xử lý thanh toán COD
    async function handleCODPayment(userId) {
        console.log("Thực hiện thanh toán COD cho user_id:", userId);
        const cart = loadCartFromLocalStorage();
        if (!cart) return;
        let response = await fetch(`http://localhost:3000/BE/api/checkout_cod.php`, {
            method: "POST",
            body: JSON.stringify({ user_id: userId }),
            headers: { "Content-Type": "application/json" },
        });
        return response;
    }

    // Tải giỏ hàng khi vào trang
    const cart = loadCartFromLocalStorage();
    if (cart) {
        renderOrderSummary(cart);
    }
});