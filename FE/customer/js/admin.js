document.addEventListener("DOMContentLoaded", () => {
    // Hiển thị nội dung mặc định (Tổng quan) khi tải trang
    showContent('overview');
    loadOverviewStats(); // Gọi hàm để tải dữ liệu tổng quan
    loadDailyRevenue(); // Thêm hàm để tải doanh thu theo ngày
});

function showContent(sectionId) {
    // Ẩn tất cả các phần nội dung
    const contents = document.querySelectorAll('.content');
    contents.forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });

    // Hiển thị phần nội dung được chọn
    const activeContent = document.getElementById(sectionId);
    if (activeContent) {
        activeContent.style.display = 'block';
        activeContent.classList.add('active');
    }

    // Xử lý active class cho sidebar menu
    const sidebarItems = document.querySelectorAll('.sidebar > ul > li');
    sidebarItems.forEach(item => item.classList.remove('active'));
    const activeItem = [...sidebarItems].find(item => {
        const text = item.textContent.trim();
        return text === activeContent.querySelector('h2')?.textContent.trim() || 
               (text === "Sản phẩm" && ['createPr', 'delPr', 'updatePr'].includes(sectionId));
    });
    if (activeItem) activeItem.classList.add('active');
}

function toggleSubMenu(event, submenuId) {
    event.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài
    const submenu = document.getElementById(submenuId);
    if (submenu) {
        submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
    }
}

// Tải dữ liệu tổng quan từ API
async function loadOverviewStats() {
    try {
        const response = await fetch('/BE/api/overview_stats.php', {
            method: 'GET',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Lỗi từ server (overview_stats.php):", errorText);
            throw new Error(`Lỗi khi tải dữ liệu tổng quan: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("Dữ liệu tổng quan từ API:", data);

        if (data.success) {
            // Cập nhật dữ liệu lên giao diện
            document.getElementById('totalRevenue').textContent = formatCurrency(data.totalRevenue) + ' VND';
            document.getElementById('totalOrders').textContent = data.totalOrders;
            document.getElementById('totalProductsSold').textContent = data.totalProductsSold;
            document.getElementById('newCustomers').textContent = data.newCustomers;
        } else {
            throw new Error(data.message || "Không thể tải dữ liệu tổng quan.");
        }
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Không thể tải dữ liệu tổng quan. Vui lòng thử lại: ' + error.message);
    }
}

// Thêm hàm tải doanh thu theo ngày
async function loadDailyRevenue() {
    try {
        const response = await fetch('/BE/api/daily_revenue.php', {
            method: 'GET',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Lỗi từ server (daily_revenue.php):", errorText);
            throw new Error(`Lỗi khi tải doanh thu theo ngày: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("Dữ liệu doanh thu theo ngày từ API:", data);

        const tbody = document.getElementById('dailyRevenueBody');
        tbody.innerHTML = ''; // Xóa nội dung cũ

        if (Array.isArray(data)) {
            data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td data-label="Ngày">${item.date}</td>
                    <td data-label="Doanh thu (VND)">${formatCurrency(item.revenue)} VND</td>
                    <td data-label="Số Đơn Hàng">${item.orders}</td>
                    <td data-label="Số Sản Phẩm Bán">${item.products_sold}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            throw new Error("Dữ liệu doanh thu theo ngày không hợp lệ.");
        }
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Không thể tải doanh thu theo ngày. Vui lòng thử lại: ' + error.message);
    }
}

// Hàm định dạng tiền tệ
function formatCurrency(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Điều hướng đến trang cụ thể (bạn có thể mở rộng nếu cần)
function navigateToPage(page) {
    window.location.href = page;
}

// Xử lý đăng xuất
document.querySelector('.log-out a').addEventListener('click', () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInUserId");
    console.log("Đã đăng xuất, xóa thông tin localStorage.");
});