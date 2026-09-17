/**
 * Module Nguồn Gốc Gia Tộc & Phả Ký — Family History & Genealogy Chronicle
 */
window.GiaPha = window.GiaPha || {};

window.GiaPha.familyHistoryModule = (function () {
  let modal, openBtn, closeBtn;

  function init() {
    modal = document.getElementById('family-history-modal');
    openBtn = document.getElementById('btn-family-history');
    closeBtn = document.getElementById('history-modal-close');

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
  }

  function open() {
    if (!modal) modal = document.getElementById('family-history-modal');
    renderContent();
    if (modal) modal.classList.add('active', 'open');
    const overlay = document.getElementById('drawer-overlay');
    if (overlay) {
      overlay.classList.add('active', 'show', 'open');
      overlay.onclick = close;
    }
  }

  function close() {
    if (modal) modal.classList.remove('active', 'open');
    const overlay = document.getElementById('drawer-overlay');
    if (overlay) overlay.classList.remove('active', 'show', 'open');
  }

  function renderContent() {
    const container = document.getElementById('family-history-body');
    if (!container) return;

    const info = (window.GiaPha.data && window.GiaPha.data.familyInfo) || {};
    const temple = info.ancestorTemple || {};
    const rules = info.familyRules || [];

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px double #D4AF37; padding-bottom: 16px;">
        <div style="font-size: 32px; margin-bottom: 8px;">🏛️</div>
        <h2 style="font-size: 22px; font-weight: 800; color: var(--gold); margin: 0; font-family: serif; letter-spacing: 1px;">
          PHẢ KÝ DÒNG HỌ ${info.familyName ? info.familyName.toUpperCase() : 'PHẠM'}
        </h2>
        <p style="font-style: italic; color: var(--text-secondary); margin: 6px 0 0; font-size: 13.5px;">
          "${info.motto || 'Uống nước nhớ nguồn — Gia đạo trường tồn'}"
        </p>
      </div>

      <!-- 1. Nguồn gốc & Khởi tổ -->
      <div style="background: var(--bg-card); border: 1.5px solid var(--border-color); border-radius: 10px; padding: 18px; margin-bottom: 18px; box-shadow: var(--shadow-sm);">
        <h3 style="font-size: 15px; font-weight: 700; color: var(--accent); margin-top: 0; display:flex; align-items:center; gap: 8px;">
          <span>🌱</span> Nguồn Gốc Thiên Di & Quê Quán Gốc
        </h3>
        <p style="font-size: 13.5px; line-height: 1.7; color: var(--text-primary); margin: 8px 0 0;">
          ${info.history || 'Dòng họ định cư lâu đời, truyền đời gìn giữ gia phong hiếu học và nhân nghĩa.'}
        </p>
        <div style="margin-top: 10px; font-size: 13px; color: var(--text-secondary);">
          📍 <strong>Địa bàn cư trú chính:</strong> ${info.originPlace || 'Chưa cập nhật'}
        </div>
      </div>

      <!-- 2. Từ Đường & Thờ Tự -->
      <div style="background: var(--bg-card); border: 1.5px solid var(--border-color); border-radius: 10px; padding: 18px; margin-bottom: 18px; box-shadow: var(--shadow-sm);">
        <h3 style="font-size: 15px; font-weight: 700; color: var(--accent); margin-top: 0; display:flex; align-items:center; gap: 8px;">
          <span>🏮</span> Từ Đường & Ngày Lễ Tế Tổ Hằng Năm
        </h3>
        <div style="font-size: 13.5px; line-height: 1.7; color: var(--text-primary);">
          <div>🏛️ <strong>Tên nhà thờ:</strong> ${temple.name || 'Từ Đường Họ Phạm'}</div>
          <div>📍 <strong>Địa chỉ:</strong> ${temple.address || 'Làng Đông Ngạc, Bắc Từ Liêm, Hà Nội'}</div>
          ${temple.establishedYear ? `<div>⏳ <strong>Năm khởi dựng:</strong> Năm ${temple.establishedYear}</div>` : ''}
          <div style="margin-top: 8px; background: rgba(212,175,55,0.1); padding: 8px 12px; border-radius: 6px; border-left: 3px solid #D4AF37;">
            🎉 <strong>Dịp tế lễ chính:</strong> ${temple.annualCeremony || 'Rằm tháng Giêng & Ngày Giỗ Tổ'}
          </div>
        </div>
      </div>

      <!-- 3. Tộc Ước Gia Phong (Lời răn dạy của tiền nhân) -->
      <div style="background: var(--bg-card); border: 1.5px solid var(--border-color); border-radius: 10px; padding: 18px; margin-bottom: 18px; box-shadow: var(--shadow-sm);">
        <h3 style="font-size: 15px; font-weight: 700; color: var(--accent); margin-top: 0; display:flex; align-items:center; gap: 8px;">
          <span>📜</span> Tộc Ước Gia Phong (Gia Huấn Truyền Đời)
        </h3>
        <div style="display:flex; flex-direction:column; gap: 10px; margin-top: 10px;">
          ${rules.map((rule) => `
            <div style="font-size: 13.5px; line-height: 1.6; color: var(--text-primary); padding: 6px 10px; background: var(--bg-secondary); border-radius: 6px;">
              ${rule}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  return { init, open, close };
})();
