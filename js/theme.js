window.GiaPha = window.GiaPha || {};

window.GiaPha.themeModule = {
  init: function() {
    // Đọc theme từ localStorage hoặc mặc định 'traditional'
    const savedTheme = localStorage.getItem('gia-pha-theme') || 'traditional';
    this.setTheme(savedTheme);
    
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }
  },

  toggle: function() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'traditional' ? 'modern' : 'traditional';
    this.setTheme(newTheme);
  },

  setTheme: function(themeName) {
    const html = document.documentElement;
    html.setAttribute('data-theme', themeName);
    localStorage.setItem('gia-pha-theme', themeName);
    
    // Cập nhật meta theme-color cho thanh trạng thái di động
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeName === 'traditional' ? '#D4AF37' : '#2A5C82');
    }

    // Áp dụng hiệu ứng xoay cho nút toggle
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.style.transform = 'rotate(180deg)';
      setTimeout(() => {
        toggleBtn.style.transition = 'none';
        toggleBtn.style.transform = 'rotate(0deg)';
        setTimeout(() => {
          toggleBtn.style.transition = 'transform 0.3s ease';
        }, 50);
      }, 300);
      
      const tradIcon = toggleBtn.querySelector('.traditional-icon');
      const modIcon = toggleBtn.querySelector('.modern-icon');
      
      // Chuyển đổi hiển thị icon
      if (themeName === 'traditional') {
        if(tradIcon) tradIcon.style.display = 'inline';
        if(modIcon) modIcon.style.display = 'none';
      } else {
        if(tradIcon) tradIcon.style.display = 'none';
        if(modIcon) modIcon.style.display = 'inline';
      }
    }
    
    // Phát sự kiện theme-changed để các component khác có thể phản hồi
    document.dispatchEvent(new CustomEvent('giapha:theme-changed', {detail: {theme: themeName}}));
  }
};
