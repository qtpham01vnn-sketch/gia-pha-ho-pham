// Khởi tạo namespace
window.GiaPha = window.GiaPha || {};

document.addEventListener('DOMContentLoaded', () => {
  // Đăng ký Service Worker
  if (window.GiaPha.pwaModule) {
    window.GiaPha.pwaModule.register();
  }

  // Khởi tạo giao diện
  if (window.GiaPha.themeModule) {
    window.GiaPha.themeModule.init();
  }

  // Tải dữ liệu
  if (window.GiaPha.dataModule) {
    window.GiaPha.dataModule.load()
      .catch(error => {
        console.error('Lỗi khi tải dữ liệu:', error);
        const loadingContent = document.querySelector('.loading-content');
        if (loadingContent) {
          loadingContent.innerHTML = '<h2>❌ Lỗi tải dữ liệu</h2><p>Không thể tải dữ liệu phả hệ. Vui lòng kiểm tra lại cấu hình hoặc dữ liệu.</p>';
        }
      });
  }
});

// Lắng nghe sự kiện dữ liệu đã tải xong
document.addEventListener('giapha:data-loaded', (e) => {
  console.log('Dữ liệu đã tải xong, khởi tạo các module giao diện...');
  
  // Khởi tạo các module
  if (window.GiaPha.dashboardModule) window.GiaPha.dashboardModule.init();
  if (window.GiaPha.treeModule) window.GiaPha.treeModule.init();
  if (window.GiaPha.memberDetailModule) window.GiaPha.memberDetailModule.init();
  if (window.GiaPha.memorialModule) window.GiaPha.memorialModule.init();
  if (window.GiaPha.familyHistoryModule) window.GiaPha.familyHistoryModule.init();
  if (window.GiaPha.memberEditorModule) window.GiaPha.memberEditorModule.init();
  if (window.GiaPha.exportModule) window.GiaPha.exportModule.init();

  // Ẩn màn hình loading với animation fade out
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }
});
