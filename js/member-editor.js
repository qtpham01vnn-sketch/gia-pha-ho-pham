/**
 * Module Thêm / Sửa Thành Viên Trực Tiếp (CRUD Form)
 * Hỗ trợ tải ảnh chân dung thực tế, tự động tính toán thế hệ cha -> con chuẩn xác
 */
window.GiaPha = window.GiaPha || {};

window.GiaPha.memberEditorModule = (function () {
  let modal, openBtn, closeBtn, form, saveBtn, downloadBtn;
  let avatarFileInput, avatarUrlInput, avatarPreviewContainer, avatarPreviewImg;
  let fatherSelect, generationSelect;

  function init() {
    modal = document.getElementById('member-editor-modal');
    openBtn = document.getElementById('btn-add-member');
    closeBtn = document.getElementById('editor-modal-close');
    form = document.getElementById('member-editor-form');
    saveBtn = document.getElementById('btn-save-member');
    downloadBtn = document.getElementById('btn-download-json');
    
    avatarFileInput = document.getElementById('field-avatar-file');
    avatarUrlInput = document.getElementById('field-avatar-url');
    avatarPreviewContainer = document.getElementById('avatar-preview-container');
    avatarPreviewImg = document.getElementById('avatar-preview-img');
    fatherSelect = document.getElementById('field-father-id');
    generationSelect = document.getElementById('field-generation');

    const spouseSelect = document.getElementById('field-spouse-id');

    if (openBtn) openBtn.addEventListener('click', () => openNew());
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (saveBtn) saveBtn.addEventListener('click', handleSave);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadCurrentJSON);

    // Xử lý tải ảnh chân dung thực tế
    if (avatarFileInput) {
      avatarFileInput.addEventListener('change', handleAvatarUpload);
    }

    // Tự động tính toán thế hệ khi chọn Cha / Mẹ
    if (fatherSelect) {
      fatherSelect.addEventListener('change', handleFatherChange);
    }

    // Tự động đồng bộ thế hệ khi chọn Vợ / Chồng
    if (spouseSelect) {
      spouseSelect.addEventListener('change', handleSpouseChange);
    }

    // Xử lý ẩn hiện phần ngày giỗ khi chọn Còn sống / Đã khuất
    const deceasedCheckbox = document.getElementById('field-is-deceased');
    if (deceasedCheckbox) {
      deceasedCheckbox.addEventListener('change', (e) => {
        const memorialSection = document.getElementById('memorial-input-group');
        if (memorialSection) memorialSection.style.display = e.target.checked ? 'block' : 'none';
      });
    }
  }

  function handleFatherChange() {
    if (!fatherSelect || !generationSelect) return;
    const parentId = fatherSelect.value;
    if (parentId && window.GiaPha.dataModule) {
      const parent = window.GiaPha.dataModule.getPerson(parentId);
      if (parent && parent.generation) {
        // Con thì luôn luôn bằng thế hệ của Cha + 1
        const childGen = String(parent.generation + 1);
        generationSelect.value = childGen;
      }
    }
  }

  function handleSpouseChange() {
    const spouseSel = document.getElementById('field-spouse-id');
    if (!spouseSel || !generationSelect) return;
    const spouseId = spouseSel.value;
    if (spouseId && window.GiaPha.dataModule && (!fatherSelect || !fatherSelect.value)) {
      const spouse = window.GiaPha.dataModule.getPerson(spouseId);
      if (spouse && spouse.generation) {
        // Vợ/Chồng cùng thế hệ với người hôn phối
        generationSelect.value = String(spouse.generation);
      }
    }
  }

  function handleAvatarUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Giới hạn kích thước ảnh 3MB
    if (file.size > 3 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh dung lượng dưới 3MB để đảm bảo hiệu năng!');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      const base64Url = event.target.result;
      if (avatarUrlInput) avatarUrlInput.value = base64Url;
      if (avatarPreviewImg) avatarPreviewImg.src = base64Url;
      if (avatarPreviewContainer) avatarPreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  function populateDropdowns(selectedFatherId = null, selectedSpouseId = null) {
    const fatherSel = document.getElementById('field-father-id');
    const spouseSel = document.getElementById('field-spouse-id');
    const people = (window.GiaPha.data && window.GiaPha.data.people) || [];

    if (fatherSel) {
      fatherSel.innerHTML = '<option value="">-- Không chọn (Thế hệ đầu / Chưa rõ) --</option>';
      people.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `[Đời ${p.generation || '?'}] ${p.fullName} (${p.gender === 'male' ? 'Nam' : 'Nữ'})`;
        if (p.id === selectedFatherId) opt.selected = true;
        fatherSel.appendChild(opt);
      });
    }

    if (spouseSel) {
      spouseSel.innerHTML = '<option value="">-- Không có / Chưa kết hôn --</option>';
      people.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `[Đời ${p.generation || '?'}] ${p.fullName}`;
        if (p.id === selectedSpouseId) opt.selected = true;
        spouseSel.appendChild(opt);
      });
    }
  }

  function openNew() {
    if (!modal) modal = document.getElementById('member-editor-modal');
    if (form) form.reset();

    if (avatarPreviewContainer) avatarPreviewContainer.style.display = 'none';
    if (avatarPreviewImg) avatarPreviewImg.src = '';
    if (avatarUrlInput) avatarUrlInput.value = '';

    const titleElem = modal ? modal.querySelector('.modal-header h3') : null;
    if (titleElem) titleElem.innerHTML = '➕ Thêm Thành Viên Mới';

    const people = (window.GiaPha.data && window.GiaPha.data.people) || [];
    let maxNum = 0;
    people.forEach((p) => {
      const match = p.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const newId = 'P' + String(maxNum + 1).padStart(3, '0');
    const idField = document.getElementById('field-id');
    if (idField) idField.value = newId;

    populateDropdowns();

    const memorialSection = document.getElementById('memorial-input-group');
    if (memorialSection) memorialSection.style.display = 'none';

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

  function handleSave(e) {
    if (e) e.preventDefault();

    const id = document.getElementById('field-id').value.trim();
    const fullName = document.getElementById('field-full-name').value.trim();
    if (!fullName) {
      alert('Vui lòng nhập Họ và Tên thành viên!');
      return;
    }

    const aliasName = document.getElementById('field-alias').value.trim();
    const gender = document.getElementById('field-gender').value;
    const generation = parseInt(document.getElementById('field-generation').value, 10) || 1;
    const familyTitle = document.getElementById('field-family-title').value.trim();
    const birthYear = parseInt(document.getElementById('field-birth-year').value, 10) || null;
    const isDeceased = document.getElementById('field-is-deceased').checked;
    const deathYear = isDeceased ? (parseInt(document.getElementById('field-death-year').value, 10) || null) : null;
    
    let deathDateLunar = null;
    if (isDeceased) {
      const lDay = parseInt(document.getElementById('field-lunar-day').value, 10);
      const lMonth = parseInt(document.getElementById('field-lunar-month').value, 10);
      if (lDay && lMonth) {
        deathDateLunar = { day: lDay, month: lMonth };
      }
    }

    const burialLocation = document.getElementById('field-burial-location').value.trim();
    const mapsUrl = document.getElementById('field-maps-url').value.trim();
    const biography = document.getElementById('field-biography').value.trim();
    const parentId = document.getElementById('field-father-id').value;
    const spouseId = document.getElementById('field-spouse-id').value;
    const avatarUrl = (avatarUrlInput && avatarUrlInput.value) || null;

    let personRole = 'member';
    if (spouseId && !parentId) {
      personRole = 'spouse_in';
    }

    const newPerson = {
      id,
      fullName,
      aliasName,
      gender,
      generation,
      birthYear,
      deathYear,
      deathDateLunar,
      isDeceased,
      isFirstBorn: false,
      role: personRole,
      branchName: null,
      childOrder: 1,
      familyTitle: familyTitle || (personRole === 'spouse_in' ? 'Vợ / Chồng' : `Đời thứ ${generation}`),
      burialLocation,
      mapsUrl,
      biography,
      avatarUrl
    };

    // 1. Cập nhật vào mảng people
    const people = window.GiaPha.data.people;
    const existingIdx = people.findIndex((p) => p.id === id);
    if (existingIdx >= 0) {
      people[existingIdx] = Object.assign(people[existingIdx], newPerson);
    } else {
      people.push(newPerson);
    }
    window.GiaPha.peopleMap.set(id, newPerson);

    // 2. Cập nhật quan hệ (relationships)
    window.GiaPha.data.relationships = window.GiaPha.data.relationships || [];
    let rel = window.GiaPha.data.relationships.find((r) => r.personId === id);
    if (!rel) {
      rel = { personId: id, fatherId: null, motherId: null, spouseIds: [], childrenIds: [] };
      window.GiaPha.data.relationships.push(rel);
    }

    if (parentId) {
      rel.fatherId = parentId;
      let parentRel = window.GiaPha.data.relationships.find((r) => r.personId === parentId);
      if (!parentRel) {
        parentRel = { personId: parentId, fatherId: null, motherId: null, spouseIds: [], childrenIds: [] };
        window.GiaPha.data.relationships.push(parentRel);
      }
      if (!parentRel.childrenIds.includes(id)) {
        parentRel.childrenIds.push(id);
      }
    }

    if (spouseId) {
      if (!rel.spouseIds.includes(spouseId)) rel.spouseIds.push(spouseId);
      let spouseRel = window.GiaPha.data.relationships.find((r) => r.personId === spouseId);
      if (spouseRel && !spouseRel.spouseIds.includes(id)) {
        spouseRel.spouseIds.push(id);
      }
    }

    // 3. Lưu vào LocalStorage
    try {
      localStorage.setItem('gia-pha-custom-data', JSON.stringify(window.GiaPha.data));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }

    // 4. Phát sự kiện cập nhật
    document.dispatchEvent(new CustomEvent('giapha:data-updated', { detail: window.GiaPha.data }));

    // 5. Cập nhật cây, thống kê, lịch giỗ
    if (window.GiaPha.dataModule && window.GiaPha.treeModule) {
      const tree = window.GiaPha.dataModule.buildFamilyTree();
      if (tree) window.GiaPha.treeModule.render(tree);
    }
    if (window.GiaPha.dashboardModule) window.GiaPha.dashboardModule.updateStats();
    if (window.GiaPha.memorialModule) window.GiaPha.memorialModule.buildMemorialList();

    close();

    // Focus vào thành viên
    setTimeout(() => {
      if (window.GiaPha.treeModule) window.GiaPha.treeModule.focusNode(id);
    }, 600);

    alert(`✅ Đã lưu thông tin "${fullName}" thành công vào cây phả hệ!`);
  }

  function openEdit(personId) {
    if (!personId || !window.GiaPha.dataModule) return;
    const person = window.GiaPha.dataModule.getPerson(personId);
    if (!person) return;

    if (!modal) modal = document.getElementById('member-editor-modal');
    if (form) form.reset();

    const titleElem = modal.querySelector('.modal-header h3');
    if (titleElem) titleElem.innerHTML = `✏️ Chỉnh Sửa: <span style="color:var(--accent);">${person.fullName}</span>`;

    const idField = document.getElementById('field-id');
    if (idField) idField.value = person.id;

    const fullNameField = document.getElementById('field-full-name');
    if (fullNameField) fullNameField.value = person.fullName || '';

    const aliasField = document.getElementById('field-alias');
    if (aliasField) aliasField.value = person.aliasName || '';

    const genderField = document.getElementById('field-gender');
    if (genderField) genderField.value = person.gender || 'male';

    const genField = document.getElementById('field-generation');
    if (genField) genField.value = String(person.generation || 1);

    const titleField = document.getElementById('field-family-title');
    if (titleField) titleField.value = person.familyTitle || '';

    const birthField = document.getElementById('field-birth-year');
    if (birthField) birthField.value = person.birthYear || '';

    const isDeceasedField = document.getElementById('field-is-deceased');
    const deathField = document.getElementById('field-death-year');
    const lunarDayField = document.getElementById('field-lunar-day');
    const lunarMonthField = document.getElementById('field-lunar-month');
    const memorialSection = document.getElementById('memorial-input-group');

    if (isDeceasedField) {
      isDeceasedField.checked = !!person.isDeceased;
      if (memorialSection) memorialSection.style.display = person.isDeceased ? 'block' : 'none';
      if (deathField) deathField.value = person.deathYear || '';
      if (person.deathDateLunar) {
        if (lunarDayField) lunarDayField.value = person.deathDateLunar.day || '';
        if (lunarMonthField) lunarMonthField.value = person.deathDateLunar.month || '';
      }
    }

    const burialField = document.getElementById('field-burial-location');
    if (burialField) burialField.value = person.burialLocation || '';

    const mapsField = document.getElementById('field-maps-url');
    if (mapsField) mapsField.value = person.mapsUrl || '';

    const bioField = document.getElementById('field-biography');
    if (bioField) bioField.value = person.biography || '';

    // Ảnh đại diện
    if (avatarUrlInput) avatarUrlInput.value = person.avatarUrl || '';
    if (person.avatarUrl) {
      if (avatarPreviewImg) avatarPreviewImg.src = person.avatarUrl;
      if (avatarPreviewContainer) avatarPreviewContainer.style.display = 'block';
    } else {
      if (avatarPreviewContainer) avatarPreviewContainer.style.display = 'none';
    }

    // Quan hệ
    const rel = window.GiaPha.dataModule._getRelationship(personId);
    const selectedFatherId = rel ? (rel.fatherId || rel.motherId) : null;
    const selectedSpouseId = (rel && rel.spouseIds && rel.spouseIds[0]) ? rel.spouseIds[0] : null;

    populateDropdowns(selectedFatherId, selectedSpouseId);

    // Đóng drawer chi tiết nếu đang mở
    if (window.GiaPha.memberDetailModule) window.GiaPha.memberDetailModule.close();

    if (modal) modal.classList.add('active', 'open');
    const overlay = document.getElementById('drawer-overlay');
    if (overlay) {
      overlay.classList.add('active', 'show', 'open');
      overlay.onclick = close;
    }
  }

  function deleteMember(personId) {
    if (!personId || !window.GiaPha.dataModule) return;
    const person = window.GiaPha.dataModule.getPerson(personId);
    if (!person) return;

    if (person.role === 'patriarch') {
      alert('Không thể xóa Cụ Khởi Tổ của dòng họ!');
      return;
    }

    const confirmDel = confirm(`Bạn có chắc chắn muốn xóa thành viên "${person.fullName}" khỏi cây phả hệ không?`);
    if (!confirmDel) return;

    // 1. Xóa khỏi danh sách people
    window.GiaPha.data.people = window.GiaPha.data.people.filter(p => p.id !== personId);
    window.GiaPha.peopleMap.delete(personId);

    // 2. Xóa khỏi relationships
    window.GiaPha.data.relationships = window.GiaPha.data.relationships.filter(r => r.personId !== personId);
    window.GiaPha.data.relationships.forEach(r => {
      if (r.fatherId === personId) r.fatherId = null;
      if (r.motherId === personId) r.motherId = null;
      r.spouseIds = (r.spouseIds || []).filter(sid => sid !== personId);
      r.childrenIds = (r.childrenIds || []).filter(cid => cid !== personId);
    });

    // 3. Lưu LocalStorage
    try {
      localStorage.setItem('gia-pha-custom-data', JSON.stringify(window.GiaPha.data));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }

    // 4. Cập nhật UI
    if (window.GiaPha.memberDetailModule) window.GiaPha.memberDetailModule.close();
    if (window.GiaPha.dataModule && window.GiaPha.treeModule) {
      const tree = window.GiaPha.dataModule.buildFamilyTree();
      if (tree) window.GiaPha.treeModule.render(tree);
    }
    if (window.GiaPha.dashboardModule) window.GiaPha.dashboardModule.updateStats();
    if (window.GiaPha.memorialModule) window.GiaPha.memorialModule.buildMemorialList();

    alert(`✅ Đã xóa thành viên "${person.fullName}" khỏi cây phả hệ!`);
  }

  function downloadCurrentJSON() {
    if (!window.GiaPha.data) return;
    const jsonStr = JSON.stringify(window.GiaPha.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return { init, openNew, openEdit, deleteMember, close, downloadCurrentJSON };
})();
