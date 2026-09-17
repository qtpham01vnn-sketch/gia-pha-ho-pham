/**
 * Module Xuất File — PNG, SVG, PDF
 * Tự động tính toán khung hình thực tế của cây và xuất file siêu nét
 */
window.GiaPha = window.GiaPha || {};

window.GiaPha.exportModule = (function () {
  function init() {
    const btnPNG = document.getElementById('btn-export-png');
    const btnSVG = document.getElementById('btn-export-svg');
    const btnPDF = document.getElementById('btn-export-pdf');

    if (btnPNG) btnPNG.addEventListener('click', exportPNG);
    if (btnSVG) btnSVG.addEventListener('click', exportSVG);
    if (btnPDF) btnPDF.addEventListener('click', exportPDF);
  }

  function showToast(message, type = 'info') {
    // Xóa toast cũ nếu có
    const old = document.querySelector('.giapha-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'giapha-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: type === 'error' ? '#EF4444' : (type === 'success' ? '#10B981' : '#3B82F6'),
      color: '#FFFFFF',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      zIndex: '99999',
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      opacity: '0',
      transition: 'opacity 0.3s ease'
    });

    document.body.appendChild(toast);
    setTimeout(() => (toast.style.opacity = '1'), 20);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }

  function getDateStr() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${d}-${m}-${now.getFullYear()}`;
  }

  /**
   * Tạo chuỗi SVG độc lập chứa toàn bộ cây phả hệ
   */
  function generateCleanSVG() {
    const originalSvg = document.getElementById('tree-svg');
    if (!originalSvg) throw new Error('Không tìm thấy cây phả hệ!');

    const gContent = originalSvg.querySelector('.tree-content');
    if (!gContent) throw new Error('Không có dữ liệu cây để xuất!');

    // Lấy BBox thực tế từ DOM
    const rawBox = gContent.getBBox();
    const pad = 60;
    const box = {
      x: rawBox.x - pad,
      y: rawBox.y - pad,
      w: Math.max(rawBox.width + pad * 2, 800),
      h: Math.max(rawBox.height + pad * 2, 500)
    };

    const isDark = document.documentElement.getAttribute('data-theme') === 'modern';
    const bgColor = isDark ? '#0F172A' : '#F5EFEB';
    const headerTitle = 'GIA PHẢ HỌ PHẠM';
    const headerMotto = 'Uống nước nhớ nguồn — Gia đạo trường tồn';

    // Tạo SVG độc lập
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgEl.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svgEl.setAttribute('viewBox', `${box.x} ${box.y - 70} ${box.w} ${box.h + 70}`);
    svgEl.setAttribute('width', box.w);
    svgEl.setAttribute('height', box.h + 70);

    // 1. Defs & Shadow
    const defs = originalSvg.querySelector('defs');
    if (defs) svgEl.appendChild(defs.cloneNode(true));

    // 2. Nền giấy
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', box.x);
    bg.setAttribute('y', box.y - 70);
    bg.setAttribute('width', box.w);
    bg.setAttribute('height', box.h + 70);
    bg.setAttribute('fill', bgColor);
    svgEl.appendChild(bg);

    // 3. Tiêu đề đầu trang
    const headerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('x', box.x + box.w / 2);
    titleText.setAttribute('y', box.y - 30);
    titleText.setAttribute('text-anchor', 'middle');
    titleText.setAttribute('font-size', '24px');
    titleText.setAttribute('font-weight', 'bold');
    titleText.setAttribute('font-family', 'serif');
    titleText.setAttribute('fill', isDark ? '#38BDF8' : '#B8860B');
    titleText.textContent = headerTitle;
    headerG.appendChild(titleText);

    const mottoText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    mottoText.setAttribute('x', box.x + box.w / 2);
    mottoText.setAttribute('y', box.y - 8);
    mottoText.setAttribute('text-anchor', 'middle');
    mottoText.setAttribute('font-size', '13px');
    mottoText.setAttribute('font-family', 'sans-serif');
    mottoText.setAttribute('font-style', 'italic');
    mottoText.setAttribute('fill', isDark ? '#94A3B8' : '#78716C');
    mottoText.textContent = headerMotto;
    headerG.appendChild(mottoText);
    svgEl.appendChild(headerG);

    // 4. Cây phả hệ (clone layer không có transform zoom)
    const treeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    treeG.innerHTML = gContent.innerHTML;
    svgEl.appendChild(treeG);

    const serializer = new XMLSerializer();
    const svgString = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + serializer.serializeToString(svgEl);

    return {
      svgString,
      width: box.w,
      height: box.h + 70,
      bgColor
    };
  }

  // ═══════════════════════════════════════════
  // XUẤT SVG
  // ═══════════════════════════════════════════
  function exportSVG() {
    try {
      showToast('Đang tạo file SVG...', 'info');
      const { svgString } = generateCleanSVG();
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gia-pha-ho-pham-${getDateStr()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Xuất SVG thành công!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi xuất file SVG', 'error');
    }
  }

  // ═══════════════════════════════════════════
  // XUẤT PNG (Độ phân giải 2x siêu nét)
  // ═══════════════════════════════════════════
  function exportPNG() {
    try {
      showToast('Đang tạo ảnh PNG siêu nét...', 'info');
      const { svgString, width, height, bgColor } = generateCleanSVG();

      const img = new Image();
      const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

      img.onload = function () {
        const scale = 2; // 2x Retina
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');

        // Nền
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Vẽ ảnh SVG lên canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(function (blob) {
          if (!blob) {
            showToast('Không thể tạo file ảnh', 'error');
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `gia-pha-ho-pham-${getDateStr()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          showToast('Xuất ảnh PNG thành công!', 'success');
        }, 'image/png');
      };

      img.onerror = function (e) {
        console.error('Lỗi load SVG vào Image:', e);
        showToast('Lỗi kết xuất ảnh PNG', 'error');
      };

      img.src = svgDataUrl;
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi xuất PNG', 'error');
    }
  }

  // ═══════════════════════════════════════════
  // XUẤT PDF (Khổ giấy tỷ lệ chuẩn)
  // ═══════════════════════════════════════════
  function exportPDF() {
    try {
      showToast('Đang tạo file PDF in ấn...', 'info');
      const { svgString, width, height, bgColor } = generateCleanSVG();

      const img = new Image();
      const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

      img.onload = function () {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Khởi tạo jsPDF
        const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!jsPDFClass) {
          showToast('Chưa tải thư viện PDF', 'error');
          return;
        }

        // Tạo PDF khổ ngang vừa với kích thước cây
        const pdf = new jsPDFClass({
          orientation: width > height ? 'l' : 'p',
          unit: 'px',
          format: [width, height]
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
        pdf.save(`gia-pha-ho-pham-${getDateStr()}.pdf`);
        showToast('Xuất file PDF thành công!', 'success');
      };

      img.onerror = function () {
        showToast('Lỗi tạo PDF từ ảnh', 'error');
      };

      img.src = svgDataUrl;
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi xuất PDF', 'error');
    }
  }

  return { init, exportPNG, exportSVG, exportPDF };
})();
