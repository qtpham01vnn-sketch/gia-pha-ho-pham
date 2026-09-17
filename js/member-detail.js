window.GiaPha = window.GiaPha || {};

window.GiaPha.memberDetailModule = (function() {
    let drawer, overlay, contentContainer;

    function init() {
        drawer = document.getElementById('member-drawer');
        overlay = document.getElementById('drawer-overlay');
        contentContainer = document.getElementById('drawer-content');

        if (!drawer) {
            drawer = document.createElement('div');
            drawer.id = 'member-drawer';
            drawer.className = 'member-drawer';
            document.body.appendChild(drawer);
        }
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'drawer-overlay';
            overlay.className = 'drawer-overlay';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', close);
        }

        if (!contentContainer) {
            contentContainer = document.createElement('div');
            contentContainer.id = 'drawer-content';
            drawer.appendChild(contentContainer);
        }
        
        // Nút đóng
        const closeBtn = document.createElement('button');
        closeBtn.className = 'drawer-close-btn';
        closeBtn.innerHTML = '✕';
        closeBtn.onclick = close;
        drawer.insertBefore(closeBtn, contentContainer);

        document.addEventListener('giapha:member-selected', (e) => {
            showMember(e.detail);
        });

        // Hỗ trợ touch swipe to close trên mobile
        let touchStartY = 0;
        drawer.addEventListener('touchstart', e => {
            touchStartY = e.changedTouches[0].screenY;
        }, {passive: true});
        
        drawer.addEventListener('touchend', e => {
            const touchEndY = e.changedTouches[0].screenY;
            if (touchEndY - touchStartY > 100) {
                close();
            }
        }, {passive: true});
    }

    function showMember(personId) {
        if (!window.GiaPha.dataModule) return;
        const person = window.GiaPha.dataModule.getPerson(personId);
        if (!person) return;

        // Render content
        let avatarInitials = '?';
        if (person.fullName) {
            const parts = person.fullName.trim().split(' ');
            avatarInitials = parts[parts.length - 1].charAt(0).toUpperCase();
        }
        const avatarBg = person.role === 'patriarch' ? '#FEF08A' : (person.gender === 'female' ? '#FBCFE8' : '#BFDBFE');
        const avatarColor = person.role === 'patriarch' ? '#B8860B' : (person.gender === 'female' ? '#EC4899' : '#2563EB');

        let badgesHtml = '';
        if (person.role === 'patriarch') badgesHtml += `<span class="badge badge-gold">👑 Trưởng tộc</span>`;
        if (person.role === 'branch_leader') badgesHtml += `<span class="badge badge-blue">👑 Trưởng chi</span>`;
        if (person.isFirstBorn) badgesHtml += `<span class="badge badge-yellow">⭐ Con trưởng</span>`;
        if (person.isDeceased) badgesHtml += `<span class="badge badge-gray">🪷 Đã mất</span>`;

        let lunarGiỗ = '';
        let solarGiỗ = '';
        if (person.isDeceased && person.deathDateLunar && person.deathDateLunar.day && person.deathDateLunar.month) {
            const currentYear = new Date().getFullYear();
            const lunarMonthName = window.GiaPha.lunar.getLunarMonthName(person.deathDateLunar.month);
            
            // Lấy năm âm lịch lúc mất nếu có, không thì để trống
            let canChiYear = '';
            if (person.deathYear) {
                canChiYear = window.GiaPha.lunar.getCanChiYear(person.deathYear);
            }
            
            lunarGiỗ = `${person.deathDateLunar.day} ${lunarMonthName} ${canChiYear ? ' — ' + canChiYear : ''}`;
            
            const nextSolar = window.GiaPha.lunar.findNextSolarDate(person.deathDateLunar.day, person.deathDateLunar.month, new Date());
            if (nextSolar) {
                const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                const dow = daysOfWeek[nextSolar.dayOfWeek] || '';
                const dd = String(nextSolar.day).padStart(2, '0');
                const mm = String(nextSolar.month).padStart(2, '0');
                const yyyy = nextSolar.year;
                solarGiỗ = `${dd}/${mm}/${yyyy} (${dow})`;
            }
        }

        let familyHtml = '';
        const spouses = window.GiaPha.dataModule.getSpouses(personId);
        if (spouses && spouses.length > 0) {
            familyHtml += `<h4>Vợ/Chồng</h4><div class="family-list">`;
            spouses.forEach(s => {
                familyHtml += `<div class="family-item" style="cursor:pointer; color: #2563EB; text-decoration: underline;" onclick="window.GiaPha.memberDetailModule.showMember('${s.id}')">${s.fullName} (${s.birthYear || '?'} - ${s.isDeceased ? (s.deathYear || '?') : 'nay'})</div>`;
            });
            familyHtml += `</div>`;
        }

        // Tìm con cái
        let children = window.GiaPha.dataModule.getChildren(personId);
        // Nếu là nữ (vợ), thử lấy con qua chồng
        if (children.length === 0 && spouses.length > 0) {
            children = window.GiaPha.dataModule.getChildren(spouses[0].id);
        }
        // Loại bỏ duplicate và spouse_in
        const uniqueChildren = [];
        const seenIds = new Set();
        children.forEach(c => {
            if (!seenIds.has(c.id) && c.role !== 'spouse_in') {
                seenIds.add(c.id);
                uniqueChildren.push(c);
            }
        });
        
        if (uniqueChildren.length > 0) {
            uniqueChildren.sort((a,b) => (a.childOrder || 99) - (b.childOrder || 99));
            familyHtml += `<h4>Con cái</h4><div class="family-list">`;
            uniqueChildren.forEach(c => {
                familyHtml += `<div class="family-item" style="cursor:pointer; color: #2563EB; text-decoration: underline;" onclick="window.GiaPha.memberDetailModule.showMember('${c.id}')">${c.fullName}</div>`;
            });
            familyHtml += `</div>`;
        }

        let avatarSvg = `
            <svg width="80" height="80">
                <circle cx="40" cy="40" r="38" fill="${avatarBg}" stroke="${avatarColor}" stroke-width="2"/>
                <text x="40" y="40" text-anchor="middle" dominant-baseline="central" font-size="32px" font-weight="bold" fill="${avatarColor}">${avatarInitials}</text>
            </svg>
        `;

        if (person.avatarUrl) {
            avatarSvg = `
            <svg width="80" height="80">
                <defs>
                    <clipPath id="drawer-clip">
                        <circle cx="40" cy="40" r="38" />
                    </clipPath>
                </defs>
                <circle cx="40" cy="40" r="38" fill="${avatarBg}" stroke="${avatarColor}" stroke-width="2"/>
                <image href="${person.avatarUrl}" x="0" y="0" width="80" height="80" clip-path="url(#drawer-clip)" preserveAspectRatio="xMidYMid slice" />
            </svg>`;
        }

        contentContainer.innerHTML = `
            <div class="drawer-avatar-section">
                ${avatarSvg}
            </div>
            <h2 class="drawer-name">${person.fullName || 'Chưa rõ tên'}</h2>
            ${person.aliasName ? `<p class="drawer-alias">Tên gọi khác / Tự: ${person.aliasName}</p>` : ''}
            <div class="drawer-badges">${badgesHtml}</div>

            <!-- Nút hành động nhanh trên đầu -->
            <div class="drawer-top-actions" style="margin-top: 15px; display: flex; gap: 8px; justify-content: center;">
                <button style="flex: 1.5; padding: 9px 12px; font-weight: 700; font-size: 13px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; background: #D97706; color: white; border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.15);" onclick="window.GiaPha.memberEditorModule && window.GiaPha.memberEditorModule.openEdit('${person.id}')">
                    ✏️ Sửa Thông Tin
                </button>
                <button style="flex: 1; padding: 9px 10px; font-weight: 600; font-size: 12.5px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; background: #EF4444; color: white; border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.15);" onclick="window.GiaPha.memberEditorModule && window.GiaPha.memberEditorModule.deleteMember('${person.id}')">
                    🗑️ Xóa
                </button>
            </div>

            <div class="drawer-info-grid" style="margin-top: 20px;">
                <div class="info-row">
                    <span class="info-label" style="font-weight: bold; display: block; margin-bottom: 5px;">Vai vế</span>
                    <span class="info-value">${person.familyTitle || `Đời thứ ${person.generation || '?'}`}</span>
                </div>
                <div class="info-row" style="margin-top: 10px;">
                    <span class="info-label" style="font-weight: bold; display: block; margin-bottom: 5px;">Giới tính</span>
                    <span class="info-value">${person.gender === 'male' ? 'Nam' : 'Nữ'}</span>
                </div>
                <div class="info-row" style="margin-top: 10px;">
                    <span class="info-label" style="font-weight: bold; display: block; margin-bottom: 5px;">Năm sinh</span>
                    <span class="info-value">${person.birthYear || 'Chưa rõ'}</span>
                </div>
                <div class="info-row" style="margin-top: 10px;">
                    <span class="info-label" style="font-weight: bold; display: block; margin-bottom: 5px;">Năm mất</span>
                    <span class="info-value">${person.isDeceased ? (person.deathYear || 'Chưa rõ') : 'Còn sống'}</span>
                </div>
                ${lunarGiỗ ? `
                <div class="info-row lunar-highlight" style="margin-top: 12px; background: var(--bg-secondary); border: 1px solid var(--accent); padding: 12px; border-radius: 8px;">
                    <span class="info-label" style="font-weight: 700; color: var(--gold); display: block; margin-bottom: 5px;">📅 Ngày Giỗ (Âm lịch)</span>
                    <span class="info-value" style="font-weight: 700; color: var(--text-primary);">${lunarGiỗ}</span>
                </div>
                <div class="info-row" style="margin-top: 10px; background: var(--bg-secondary); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <span class="info-label" style="font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 5px;">☀️ Ngày Giỗ (Dương lịch ${new Date().getFullYear()})</span>
                    <span class="info-value" style="color: var(--text-primary);">${solarGiỗ}</span>
                </div>
                ` : ''}
                ${person.burialLocation ? `
                <div class="info-row" style="margin-top: 10px; background: var(--bg-secondary); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <span class="info-label" style="font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 5px;">🗺️ Vị trí mộ phần</span>
                    <span class="info-value" style="color: var(--text-primary);">
                        ${person.burialLocation}
                        ${person.mapsUrl ? `<br><a href="${person.mapsUrl}" target="_blank" class="maps-link" style="color: var(--accent); font-weight:700; display:inline-block; margin-top:6px;">📍 Mở Google Maps</a>` : ''}
                    </span>
                </div>
                ` : ''}
            </div>
            ${person.biography ? `
            <div class="drawer-biography" style="margin-top: 20px;">
                <h3 style="border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">Tiểu sử</h3>
                <p style="margin-top: 10px; line-height: 1.5;">${person.biography}</p>
            </div>
            ` : ''}
            <div class="drawer-family" style="margin-top: 20px;">
                <h3 style="border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">Quan hệ gia đình</h3>
                <div style="margin-top: 10px;">
                ${familyHtml || '<p>Không có thông tin</p>'}
                </div>
            </div>

            <!-- Nút hành động cố định ở chân trang -->
            <div class="drawer-actions" style="margin-top: 25px; padding-top: 15px; border-top: 1px solid var(--border-color); display: flex; gap: 10px;">
                <button class="btn-edit-drawer" style="flex: 2; padding: 11px 14px; font-weight: 700; font-size: 13.5px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; background: #D97706; color: white; border: none; box-shadow: 0 2px 5px rgba(0,0,0,0.15);" onclick="window.GiaPha.memberEditorModule && window.GiaPha.memberEditorModule.openEdit('${person.id}')">
                    ✏️ Chỉnh Sửa Thông Tin
                </button>
                <button class="btn-delete-drawer" style="flex: 1; padding: 11px 12px; font-weight: 600; font-size: 13px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; background: #EF4444; color: white; border: none; box-shadow: 0 2px 5px rgba(0,0,0,0.15);" onclick="window.GiaPha.memberEditorModule && window.GiaPha.memberEditorModule.deleteMember('${person.id}')">
                    🗑️ Xóa
                </button>
            </div>
        `;

        drawer.classList.add('active', 'open');
        overlay.classList.add('active', 'show', 'open');
        overlay.onclick = close;
    }

    function close() {
        if (drawer) drawer.classList.remove('active', 'open');
        if (overlay) overlay.classList.remove('active', 'show', 'open');
    }

    return { init, showMember, close };
})();
