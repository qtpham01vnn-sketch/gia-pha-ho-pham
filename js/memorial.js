/**
 * Module Lịch Giỗ & Sự Kiện — Memorial Tracker
 * Tự động tính toán ngày giỗ âm lịch, chuyển đổi dương lịch và đếm ngược
 */
window.GiaPha = window.GiaPha || {};

window.GiaPha.memorialModule = (function () {
  let panel, toggleBtn, closeBtn, badge, content;

  function init() {
    panel = document.getElementById('memorial-panel');
    toggleBtn = document.getElementById('memorial-toggle');
    closeBtn = document.getElementById('memorial-close');
    badge = document.getElementById('memorial-badge');
    content = document.getElementById('memorial-content');

    if (toggleBtn) toggleBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);

    // Tính toán và hiển thị ngay khi khởi tạo
    buildMemorialList();

    // Lắng nghe khi dữ liệu thay đổi
    document.addEventListener('giapha:data-loaded', buildMemorialList);
    document.addEventListener('giapha:data-updated', buildMemorialList);
  }

  function open() {
    if (!panel) panel = document.getElementById('memorial-panel');
    if (!content) content = document.getElementById('memorial-content');
    
    // Luôn tính toán lại danh sách mới nhất khi mở
    buildMemorialList();

    if (panel) panel.classList.add('active', 'open');
    const overlay = document.getElementById('drawer-overlay');
    if (overlay) {
      overlay.classList.add('active', 'show', 'open');
      overlay.onclick = close;
    }
  }

  function close() {
    if (panel) panel.classList.remove('active', 'open');
    const overlay = document.getElementById('drawer-overlay');
    if (overlay) overlay.classList.remove('active', 'show', 'open');
  }

  function getAvatarColors(person) {
    const bg = person.role === 'patriarch' ? '#FEF3C7' : (person.gender === 'female' ? '#FCE7F3' : '#DBEAFE');
    const color = person.role === 'patriarch' ? '#B8860B' : (person.gender === 'female' ? '#DB2777' : '#2563EB');
    return { bg, color };
  }

  function getAvatarInitials(fullName) {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  }

  function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${dd}/${mm}/${yyyy} (${daysOfWeek[date.getDay()]})`;
  }

  function buildMemorialList() {
    if (!window.GiaPha.data) return;
    if (!content) content = document.getElementById('memorial-content');
    if (!badge) badge = document.getElementById('memorial-badge');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const memorials = [];
    const people = window.GiaPha.data.people || [];

    people.forEach((person) => {
      if (person.isDeceased && person.deathDateLunar && person.deathDateLunar.day && person.deathDateLunar.month) {
        if (window.GiaPha.lunar && typeof window.GiaPha.lunar.findNextSolarDate === 'function') {
          const nextSolarObj = window.GiaPha.lunar.findNextSolarDate(person.deathDateLunar.day, person.deathDateLunar.month, today);
          if (nextSolarObj) {
            const nextSolar = new Date(nextSolarObj.year, nextSolarObj.month - 1, nextSolarObj.day);
            nextSolar.setHours(0, 0, 0, 0);
            const diffTime = nextSolar.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            memorials.push({
              person: person,
              solarDate: nextSolar,
              daysRemaining: diffDays,
              lunarMonth: person.deathDateLunar.month,
              lunarDay: person.deathDateLunar.day
            });
          }
        }
      }
    });

    // Sắp xếp ngày giỗ gần nhất lên đầu
    memorials.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Cập nhật số lượng giỗ sắp đến trong 30 ngày lên Badge
    const upcomingCount = memorials.filter((m) => m.daysRemaining >= 0 && m.daysRemaining <= 30).length;
    if (badge) {
      badge.textContent = upcomingCount;
      badge.style.display = upcomingCount > 0 ? 'inline-flex' : 'none';
    }

    render(memorials);
  }

  function render(memorials) {
    if (!content) return;

    if (memorials.length === 0) {
      content.innerHTML = `
        <div style="text-align:center; padding: 40px 20px; color: var(--text-secondary);">
          <div style="font-size: 40px; margin-bottom: 12px;">🪷</div>
          <h3>Chưa có dữ liệu ngày giỗ</h3>
          <p style="font-size: 13px; margin-top: 6px;">Vui lòng cập nhật thông tin ngày giỗ âm lịch cho các tiền nhân đã khuất.</p>
        </div>
      `;
      return;
    }

    let html = '';

    // 1. Thẻ ngày giỗ gần nhất (Hero Card)
    const upcoming = memorials.find((m) => m.daysRemaining >= 0);
    if (upcoming) {
      const p = upcoming.person;
      const c = getAvatarColors(p);
      const mName = window.GiaPha.lunar ? window.GiaPha.lunar.getLunarMonthName(upcoming.lunarMonth) : `Tháng ${upcoming.lunarMonth}`;
      
      let badgeColor = '#10B981'; // Xanh lá
      let badgeText = `Còn ${upcoming.daysRemaining} ngày`;
      if (upcoming.daysRemaining === 0) {
        badgeColor = '#EF4444';
        badgeText = 'HÔM NAY';
      } else if (upcoming.daysRemaining <= 7) {
        badgeColor = '#EF4444';
        badgeText = `SẮP ĐẾN (Còn ${upcoming.daysRemaining} ngày)`;
      } else if (upcoming.daysRemaining <= 30) {
        badgeColor = '#F59E0B';
        badgeText = `Còn ${upcoming.daysRemaining} ngày`;
      }

      html += `
        <div style="background: linear-gradient(135deg, rgba(212,175,55,0.15), rgba(184,134,11,0.05)); border: 1.5px solid #D4AF37; border-radius: 12px; padding: 16px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
            <span style="font-size: 11px; font-weight: 800; text-transform:uppercase; letter-spacing: 0.5px; color: #B8860B;">🪷 NGÀY GIỖ GẦN NHẤT</span>
            <span style="background:${badgeColor}; color:#fff; font-size:11px; font-weight:700; padding: 3px 8px; border-radius:12px;">${badgeText}</span>
          </div>
          
          <div style="display:flex; align-items:center; gap: 14px; margin-bottom: 12px;">
            <div style="width:48px; height:48px; border-radius:50%; background:${c.bg}; border: 2.5px solid ${c.color}; color:${c.color}; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:800; flex-shrink:0;">
              ${getAvatarInitials(p.fullName)}
            </div>
            <div>
              <h3 style="margin:0; font-size: 16px; font-weight:700; color:var(--text-primary); cursor:pointer;" onclick="window.GiaPha.memberDetailModule.showMember('${p.id}')">${p.fullName}</h3>
              <p style="margin:2px 0 0; font-size: 12px; color:var(--text-secondary); font-weight:500;">${p.familyTitle || 'Thành viên dòng họ'}</p>
            </div>
          </div>

          <div style="background:var(--bg-card); padding: 10px 12px; border-radius: 8px; font-size: 12.5px; line-height: 1.6; border: 1px solid var(--border-color);">
            <div>📅 <strong>Âm lịch:</strong> Ngày ${upcoming.lunarDay} ${mName}</div>
            <div>☀️ <strong>Dương lịch năm nay:</strong> ${formatDate(upcoming.solarDate)}</div>
            ${p.burialLocation ? `<div style="margin-top:4px;">📍 <strong>Mộ phần:</strong> ${p.burialLocation}</div>` : ''}
          </div>

          <div style="display:flex; gap: 8px; margin-top: 12px;">
            <button style="flex:1; padding: 6px 10px; background:var(--accent); color:#fff; border:none; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;" onclick="window.GiaPha.memberDetailModule.showMember('${p.id}')">👤 Xem Hồ Sơ</button>
            ${p.mapsUrl ? `<a href="${p.mapsUrl}" target="_blank" style="padding: 6px 10px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--border-color); border-radius:6px; font-size:12px; font-weight:600; text-decoration:none; display:flex; align-items:center; gap:4px;">📍 Google Maps</a>` : ''}
          </div>
        </div>
      `;
    }

    // 2. Danh sách tất cả ngày giỗ trong năm (nhóm theo tháng)
    html += `<h3 style="font-size: 14px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom: 12px; color:var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 6px;">📋 Danh Sách Ngày Giỗ 12 Tháng</h3>`;

    const grouped = {};
    memorials.forEach((m) => {
      if (!grouped[m.lunarMonth]) grouped[m.lunarMonth] = [];
      grouped[m.lunarMonth].push(m);
    });

    const sortedMonths = Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b));

    sortedMonths.forEach((month) => {
      const mName = window.GiaPha.lunar ? window.GiaPha.lunar.getLunarMonthName(parseInt(month)) : `Tháng ${month}`;
      html += `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 700; color: #B8860B; background: rgba(212,175,55,0.12); padding: 4px 10px; border-radius: 4px; margin-bottom: 8px;">
            🏮 ${mName}
          </div>
      `;

      grouped[month].sort((a, b) => a.lunarDay - b.lunarDay);

      grouped[month].forEach((m) => {
        const p = m.person;
        const c = getAvatarColors(p);

        let badgeBg = '#6B7280';
        let badgeText = 'Đã qua';
        if (m.daysRemaining === 0) {
          badgeBg = '#EF4444';
          badgeText = 'Hôm nay';
        } else if (m.daysRemaining > 0 && m.daysRemaining <= 7) {
          badgeBg = '#EF4444';
          badgeText = `${m.daysRemaining} ngày`;
        } else if (m.daysRemaining > 7 && m.daysRemaining <= 30) {
          badgeBg = '#F59E0B';
          badgeText = `${m.daysRemaining} ngày`;
        } else if (m.daysRemaining > 30) {
          badgeBg = '#10B981';
          badgeText = `${m.daysRemaining} ngày`;
        }

        html += `
          <div style="display:flex; align-items:center; justify-content:space-between; padding: 10px; border-radius: 8px; background:var(--bg-card); border: 1px solid var(--border-color); margin-bottom: 8px; cursor:pointer; transition: all 0.2s;" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border-color)'" onclick="window.GiaPha.memberDetailModule.showMember('${p.id}')">
            <div style="display:flex; align-items:center; gap: 10px;">
              <div style="width:36px; height:36px; border-radius:50%; background:${c.bg}; border: 2px solid ${c.color}; color:${c.color}; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; flex-shrink:0;">
                ${getAvatarInitials(p.fullName)}
              </div>
              <div>
                <div style="font-size: 13.5px; font-weight:700; color:var(--text-primary);">${p.fullName}</div>
                <div style="font-size: 11.5px; color:var(--text-secondary);">Ngày ${m.lunarDay} âm • ${formatDate(m.solarDate)}</div>
              </div>
            </div>
            <div>
              <span style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 10px; background:${badgeBg}; color:#fff; white-space:nowrap;">${badgeText}</span>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    });

    content.innerHTML = html;
  }

  return { init, open, close, buildMemorialList };
})();
