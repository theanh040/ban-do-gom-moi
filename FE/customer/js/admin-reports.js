document.addEventListener("DOMContentLoaded", async () => {
    console.log("Admin-reports.js đã được tải và chạy!");

    // Kiểm tra xem Chart.js đã được tải chưa
    if (typeof Chart !== 'function') {
        console.error("Thư viện Chart.js chưa được tải. Kiểm tra tham chiếu trong admin.html.");
        alert("Không thể tải biểu đồ báo cáo. Vui lòng kiểm tra kết nối hoặc cấu hình trang.");
        return;
    }

    // Tải báo cáo mặc định (hàng tháng) khi trang tải
    await loadReports();

    // Gắn sự kiện cho bộ lọc thời gian và ngày
    document.getElementById("reportPeriod").addEventListener("change", loadReports);
    document.getElementById("reportDate").addEventListener("change", loadReports);
    document.querySelector(".report-refresh-btn").addEventListener("click", loadReports);
});

function formatCurrency(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Biến toàn cục để lưu biểu đồ, giúp cập nhật lại khi cần
let reportsChart = null;

async function loadReports() {
    try {
        const period = document.getElementById("reportPeriod").value;
        const date = document.getElementById("reportDate").value;
        const query = new URLSearchParams({
            period: period || "monthly",
            date: date || ""
        }).toString();

        const response = await fetch(`/BE/api/reports.php?${query}`, {
            method: 'GET',
            mode: 'cors',
        });

        if (!response.ok) {
            throw new Error(`Lỗi server: ${response.status} - ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Phản hồi không phải JSON, có thể là HTML lỗi.");
        }

        const reports = await response.json();

        // Chuẩn bị dữ liệu cho biểu đồ
        const labels = reports.map(report => report.period);
        const datasets = [
            {
                label: 'Doanh thu (VND)',
                data: reports.map(report => report.revenue),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            },
            {
                label: 'Số Đơn Hàng',
                data: reports.map(report => report.orders),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            },
            {
                label: 'Số Sản Phẩm Bán',
                data: reports.map(report => report.products_sold),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
            {
                label: 'Số Khách Hàng',
                data: reports.map(report => report.customers),
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
            }
        ];

        // Nếu biểu đồ đã tồn tại, hủy nó trước khi tạo mới
        if (reportsChart) {
            reportsChart.destroy();
        }

        // Lấy context của canvas
        const ctx = document.getElementById('reportsChart').getContext('2d');

        // Tạo biểu đồ cột với tùy chọn responsive
        reportsChart = new Chart(ctx, {
            type: 'bar', // Sử dụng biểu đồ cột
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true, // Giữ responsive
                maintainAspectRatio: true, // Giữ tỷ lệ mặc định của Chart.js
                aspectRatio: 2, // Điều chỉnh tỷ lệ chiều rộng/chiều cao (2:1, bạn có thể thay đổi)
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Giá trị'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Thời gian'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Báo cáo Doanh thu và Hoạt động'
                    }
                }
            }
        });
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu báo cáo:", error);
        alert("Không thể tải dữ liệu báo cáo. Vui lòng thử lại: " + error.message);
    }
}
function exportReportsToCSV() {
    if (!window.currentReports || window.currentReports.length === 0) {
        alert("Không có dữ liệu báo cáo để xuất!");
        return;
    }

    const headers = ["Thời Gian", "Doanh Thu (VND)"];
    const rows = window.currentReports.map(report => [
        report.label,
        report.revenue
    ]);

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reports_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}