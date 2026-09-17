/**
 * Module Dashboard — Thống kê KPI & Tìm kiếm thành viên thông minh
 */
window.GiaPha = window.GiaPha || {};

window.GiaPha.dashboardModule = {
  init: function () {
    this.updateStats();
    this.initSearch();
    this.initLineageToggle();
  },

  initLineageToggle: function () {
    const btns = document.querySelectorAll('.lineage-btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        btns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const lineage = btn.getAttribute('data-lineage');
        if (lineage === 'maternal') {
          // Chuyển sang nhánh Dòng Ngoại (Bà Phạm Thị Hoa & Lê Văn Bình)
          if (window.GiaPha.treeModule && typeof window.GiaPha.treeModule.focusNode === 'function') {
            window.GiaPha.treeModule.focusNode('P004');
          }
        } else {
          // Trở về Cụ Khởi Tổ Dòng Nội
          if (window.GiaPha.treeModule && typeof window.GiaPha.treeModule.centerRoot === 'function') {
            window.GiaPha.treeModule.centerRoot();
          }
        }
      });
    });
  },

  // Hiệu ứng tăng dần số liệu
  animateValue: function (id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentValue = Math.floor(progress * (end - start) + start);
      obj.innerHTML = currentValue;

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.innerHTML = end;
      }
    };
    window.requestAnimationFrame(step);
  },

  updateStats: function () {
    if (!window.GiaPha.dataModule) return;

    const stats = window.GiaPha.dataModule.getStats();

    this.animateValue('kpi-total', 0, stats.total, 500);
    this.animateValue('kpi-generations', 0, stats.generations, 500);
    this.animateValue('kpi-male', 0, stats.male, 500);
    this.animateValue('kpi-female', 0, stats.female, 500);
    this.animateValue('kpi-living', 0, stats.living, 500);
    this.animateValue('kpi-deceased', 0, stats.deceased, 500);
  },

  initSearch: function () {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    if (!searchInput || !searchResults) return;

    let debounceTimer;
    let currentResults = [];
    let selectedIndex = -1;

    const highlightItem = (index) => {
      const items = searchResults.querySelectorAll('.search-result-item');
      items.forEach((it, idx) => {
        if (idx === index) {
          it.style.backgroundColor = 'rgba(212,175,55,0.22)';
          it.scrollIntoView({ block: 'nearest' });
        } else {
          it.style.backgroundColor = 'transparent';
        }
      });
    };

    const performSearch = () => {
      const query = searchInput.value;
      if (query.trim() === '') {
        searchResults.classList.add('hidden');
        currentResults = [];
        selectedIndex = -1;
        return;
      }

      currentResults = window.GiaPha.dataModule.search(query);
      searchResults.innerHTML = '';
      selectedIndex = 0; // Mặc định chọn phần tử đầu tiên

      if (currentResults.length === 0) {
        searchResults.innerHTML = `
          <div style="padding: 14px; color: var(--text-secondary); text-align: center; font-size: 13px;">
            🔍 Không tìm thấy thành viên "${query}"
          </div>
        `;
      } else {
        const displayResults = currentResults.slice(0, 10);
        displayResults.forEach((person, idx) => {
          const item = document.createElement('div');
          item.className = 'search-result-item';
          item.style.padding = '10px 14px';
          item.style.cursor = 'pointer';
          item.style.borderBottom = '1px solid var(--border-color)';
          item.style.display = 'flex';
          item.style.alignItems = 'center';
          item.style.gap = '12px';
          item.style.transition = 'background-color 0.2s';
          if (idx === 0) item.style.backgroundColor = 'rgba(212,175,55,0.18)';

          const initial = (person.fullName || '?').charAt(0).toUpperCase();
          const avatarBg = person.role === 'patriarch' ? '#B8860B' : (person.gender === 'male' ? '#2563EB' : '#DB2777');

          let avatarMarkup = `
            <div style="width:36px; height:36px; border-radius:50%; background:${avatarBg}; color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:15px; flex-shrink:0;">
              ${initial}
            </div>
          `;
          if (person.avatarUrl) {
            avatarMarkup = `
              <img src="${person.avatarUrl}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1.5px solid ${avatarBg}; flex-shrink:0;">
            `;
          }

          item.innerHTML = `
            ${avatarMarkup}
            <div style="flex:1;">
              <div style="font-weight:700; font-size:13.5px; color:var(--text-primary);">${person.fullName || 'Chưa rõ tên'}</div>
              <div style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">
                Đời ${person.generation || '?'} ${person.familyTitle ? ' • ' + person.familyTitle : ''} ${person.birthYear ? `(${person.birthYear})` : ''}
              </div>
            </div>
            <span style="font-size:11px; color:var(--accent); font-weight:600;">Xem ➔</span>
          `;

          item.onmouseenter = () => {
            selectedIndex = idx;
            highlightItem(selectedIndex);
          };

          item.addEventListener('click', () => {
            searchResults.classList.add('hidden');
            if (window.GiaPha.treeModule && typeof window.GiaPha.treeModule.focusNode === 'function') {
              window.GiaPha.treeModule.focusNode(person.id);
            }
          });

          searchResults.appendChild(item);
        });
      }

      searchResults.classList.remove('hidden');
    };

    // Tìm kiếm tức thì khi gõ
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(performSearch, 150);
    });

    // Bàn phím: Mũi tên lên / xuống để chọn, Enter để bay tới
    searchInput.addEventListener('keydown', (e) => {
      const items = searchResults.querySelectorAll('.search-result-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length > 0) {
          selectedIndex = (selectedIndex + 1) % items.length;
          highlightItem(selectedIndex);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length > 0) {
          selectedIndex = (selectedIndex - 1 + items.length) % items.length;
          highlightItem(selectedIndex);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentResults.length > 0) {
          const targetPerson = currentResults[selectedIndex >= 0 ? selectedIndex : 0];
          searchResults.classList.add('hidden');
          if (targetPerson && window.GiaPha.treeModule && typeof window.GiaPha.treeModule.focusNode === 'function') {
            window.GiaPha.treeModule.focusNode(targetPerson.id);
          }
        }
      } else if (e.key === 'Escape') {
        searchResults.classList.add('hidden');
        searchInput.blur();
      }
    });

    // Hiện kết quả khi click lại vào ô tìm kiếm
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim() !== '') {
        performSearch();
      }
    });

    // Ẩn khi click ra ngoài
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });
  }
};
