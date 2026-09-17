window.GiaPha = window.GiaPha || {};

window.GiaPha.pwaModule = {
  register: function() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(registration => {
            console.log('ServiceWorker đăng ký thành công. Phạm vi: ', registration.scope);
          })
          .catch(err => {
            console.log('ServiceWorker đăng ký thất bại: ', err);
          });
      });

      // Lắng nghe sự kiện beforeinstallprompt để bắt prompt cài đặt PWA
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.GiaPha.deferredPrompt = e;
        console.log('Sẵn sàng cài đặt PWA (beforeinstallprompt)');
        // Tại đây có thể hiện UI tùy chỉnh để mời cài đặt ứng dụng
      });
    } else {
      console.log('Service Worker không được hỗ trợ trên trình duyệt này.');
    }
  }
};
