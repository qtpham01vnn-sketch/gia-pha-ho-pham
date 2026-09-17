/**
 * Module Cây Phả Hệ Tương Tác — D3.js Interactive Family Tree
 * Thẻ rộng rãi (225px × 92px), tự động hiển thị ảnh chân dung thực tế, không lọt chữ
 */
window.GiaPha = window.GiaPha || {};

window.GiaPha.treeModule = (function () {
  // ═══════════════════════════════════════════
  // HẰNG SỐ THIẾT KẾ (Rộng rãi, chuẩn tỉ lệ)
  // ═══════════════════════════════════════════
  const CARD_W = 225, CARD_H = 92, CARD_R = 10;
  const AVATAR_R = 26, AVATAR_CX = 40, AVATAR_CY = CARD_H / 2;
  const SPOUSE_W = 190, SPOUSE_H = 72;
  const SPOUSE_GAP = 38;              // khoảng cách giữa card chính và card vợ/chồng
  const H_SPACE = 540;                // khoảng cách ngang rộng rãi (540px) tuyệt đối không đè nhánh
  const V_SPACE = 200;                // khoảng cách dọc giữa các thế hệ
  const DURATION = 650;               // thời gian animation (ms)
  const COLLAPSE_R = 12;              // bán kính nút thu gọn

  // Tâm của cặp vợ chồng (so với gốc tọa độ node)
  const COUPLE_MID_X = (CARD_W + SPOUSE_GAP + SPOUSE_W) / 2 - CARD_W / 2; // ~114px

  // ═══════════════════════════════════════════
  // BIẾN TRẠNG THÁI
  // ═══════════════════════════════════════════
  let svg, gContent, gLinks, gNodes;
  let zoomBehavior, rootNode, treeLayout;
  let uidCounter = 0;

  // ═══════════════════════════════════════════
  // HÀM MÀU SẮC & ĐỊNH DẠNG
  // ═══════════════════════════════════════════
  function borderColor(p) {
    if (p.role === 'patriarch') return '#B8860B';
    return p.gender === 'female' ? '#DB2777' : '#2563EB';
  }
  function avatarBg(p) {
    if (p.role === 'patriarch') return '#FEF3C7';
    return p.gender === 'female' ? '#FCE7F3' : '#DBEAFE';
  }
  function avatarText(p) {
    if (p.role === 'patriarch') return '#92400E';
    return p.gender === 'female' ? '#9D174D' : '#1E40AF';
  }
  function initial(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  }
  function clip(str, max = 22) {
    if (!str) return '';
    return str.length > max ? str.substring(0, max) + '…' : str;
  }
  function yearsLabel(p) {
    const b = p.birthYear || '?';
    const d = p.isDeceased ? (p.deathYear || '?') : 'nay';
    return b + ' — ' + d;
  }

  // ═══════════════════════════════════════════
  // KHỞI TẠO
  // ═══════════════════════════════════════════
  function init() {
    const container = d3.select('#tree-container');
    if (container.empty()) return;

    svg = d3.select('#tree-svg');
    svg.selectAll('*').remove();
    svg.style('width', '100%').style('height', '100%');

    // Defs: bộ lọc bóng đổ & clipPath tròn cho Avatar
    const defs = svg.append('defs');
    const shadow = defs.append('filter').attr('id', 'card-shadow')
      .attr('x', '-15%').attr('y', '-15%').attr('width', '140%').attr('height', '150%');
    shadow.append('feDropShadow')
      .attr('dx', 0).attr('dy', 4).attr('stdDeviation', 5)
      .attr('flood-color', 'rgba(70,45,20,0.18)');

    gContent = svg.append('g').attr('class', 'tree-content');
    gLinks = gContent.append('g').attr('class', 'links-layer');
    gNodes = gContent.append('g').attr('class', 'nodes-layer');

    // Zoom & Pan
    zoomBehavior = d3.zoom()
      .scaleExtent([0.15, 2.5])
      .on('zoom', (event) => gContent.attr('transform', event.transform));
    
    svg.call(zoomBehavior).on('dblclick.zoom', null);

    svg.on('dblclick', (e) => {
      if (e.target.tagName === 'svg' || e.target.classList.contains('tree-content')) {
        centerRoot();
      }
    });

    // Layout cây rộng rãi
    treeLayout = d3.tree()
      .nodeSize([H_SPACE, V_SPACE])
      .separation((a, b) => {
        const aHasSpouse = a.data.spouses && a.data.spouses.length > 0;
        const bHasSpouse = b.data.spouses && b.data.spouses.length > 0;
        if (a.parent === b.parent) {
          return (aHasSpouse || bHasSpouse) ? 1.15 : 0.95;
        }
        return (aHasSpouse || bHasSpouse) ? 1.35 : 1.15;
      });

    // Zoom buttons
    bind('zoom-in', () => zoomBy(1.3));
    bind('zoom-out', () => zoomBy(0.75));
    bind('zoom-fit', fitToScreen);

    document.addEventListener('giapha:search-focus', (e) => focusNode(e.detail));
    document.addEventListener('giapha:theme-changed', recolor);

    if (window.GiaPha.dataModule) {
      const tree = window.GiaPha.dataModule.buildFamilyTree();
      if (tree) render(tree);
    }
  }

  function bind(id, fn) { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); }

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  function render(treeData) {
    rootNode = d3.hierarchy(treeData, (d) => d.children);
    rootNode.x0 = 0;
    rootNode.y0 = 0;

    collapseDeep(rootNode, 0, 3);
    update(rootNode);

    setTimeout(centerRoot, 250);
  }

  function collapseDeep(node, depth, maxOpen) {
    if (depth >= maxOpen && node.children) {
      node._children = node.children;
      node.children = null;
    }
    if (node.children) node.children.forEach((c) => collapseDeep(c, depth + 1, maxOpen));
  }

  // ═══════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════
  function update(source) {
    treeLayout(rootNode);
    const nodes = rootNode.descendants();
    const links = rootNode.descendants().slice(1);
    nodes.forEach((d) => { if (!d._uid) d._uid = ++uidCounter; });

    // ──── NODES ────
    const nodeSel = gNodes.selectAll('g.node').data(nodes, (d) => d._uid);

    const enter = nodeSel.enter().append('g')
      .attr('class', 'node')
      .attr('transform', `translate(${source.x0 || 0},${source.y0 || 0})`)
      .style('opacity', 0);

    drawFamilyBoundaryBox(enter);
    drawCard(enter);
    drawSpouse(enter);
    drawCollapseBtn(enter);

    const merged = enter.merge(nodeSel);
    merged.transition().duration(DURATION)
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('opacity', 1);

    merged.select('.collapse-label').text((d) => d._children ? '+' : '−');
    merged.select('.collapse-btn').style('display', (d) => (d.children || d._children) ? null : 'none');

    nodeSel.exit().transition().duration(DURATION)
      .attr('transform', `translate(${source.x},${source.y})`)
      .style('opacity', 0).remove();

    // ──── LINKS (Nối từ giữa cặp Vợ-Chồng xuống con cái) ────
    const linkSel = gLinks.selectAll('path.link').data(links, (d) => d._uid);

    const linkEnter = linkSel.enter().insert('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#A08060')
      .attr('stroke-width', 2.4)
      .attr('stroke-opacity', 0.65)
      .attr('d', () => { const o = { x: source.x0 || 0, y: source.y0 || 0, data: source.data }; return diagonal(o, o); });

    linkEnter.merge(linkSel).transition().duration(DURATION)
      .attr('d', (d) => diagonal(d, d.parent));

    linkSel.exit().transition().duration(DURATION)
      .attr('d', () => { const o = { x: source.x, y: source.y, data: source.data }; return diagonal(o, o); }).remove();

    nodes.forEach((d) => { d.x0 = d.x; d.y0 = d.y; });
  }

  // ═══════════════════════════════════════════
  // VẼ KHUNG HỘP GIA ĐÌNH (Family Unit Box)
  // ═══════════════════════════════════════════
  function drawFamilyBoundaryBox(enter) {
    enter.each(function (d) {
      const hasSpouse = d.data.spouses && d.data.spouses.length > 0;
      if (!hasSpouse) return;

      const parent = d3.select(this);
      const totalW = CARD_W + SPOUSE_GAP + SPOUSE_W + 24;
      const totalH = CARD_H + 20;
      const boxX = -CARD_W / 2 - 12;
      const boxY = -CARD_H / 2 - 10;

      const boxG = parent.append('g').attr('class', 'family-unit-box');

      boxG.append('rect')
        .attr('x', boxX).attr('y', boxY)
        .attr('width', totalW).attr('height', totalH)
        .attr('rx', 14).attr('ry', 14)
        .attr('fill', 'rgba(212,175,55,0.03)')
        .attr('stroke', '#D4AF37')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '5,4')
        .style('pointer-events', 'none');

      const tagG = boxG.append('g')
        .attr('transform', `translate(${COUPLE_MID_X}, ${boxY})`);
      tagG.append('rect')
        .attr('x', -46).attr('y', -8)
        .attr('width', 92).attr('height', 16)
        .attr('rx', 8).attr('fill', '#FFFDF9').attr('stroke', '#D4AF37').attr('stroke-width', 1);
      tagG.append('text')
        .attr('x', 0).attr('y', 4)
        .attr('text-anchor', 'middle')
        .style('font-size', '9.5px').style('font-weight', '800')
        .style('fill', '#B8860B')
        .text('💍 VỢ CHỒNG');
    });
  }

  // ═══════════════════════════════════════════
  // VẼ THẺ CHÍNH (Main Card: 225px x 92px)
  // ═══════════════════════════════════════════
  function drawCard(enter) {
    const card = enter.append('g')
      .attr('class', 'main-card')
      .attr('transform', `translate(${-CARD_W / 2},${-CARD_H / 2})`)
      .style('cursor', 'pointer')
      .on('click', (ev, d) => {
        ev.stopPropagation();
        document.dispatchEvent(new CustomEvent('giapha:member-selected', { detail: d.data.id }));
      });

    // Viền kép vàng kim
    card.append('rect')
      .attr('width', CARD_W + 6).attr('height', CARD_H + 6)
      .attr('x', -3).attr('y', -3)
      .attr('rx', CARD_R + 3)
      .attr('fill', 'none')
      .attr('stroke', '#D4AF37')
      .attr('stroke-width', 1.2)
      .attr('stroke-opacity', 0.5);

    // Nền card
    const theme = document.documentElement.getAttribute('data-theme') || 'traditional';
    card.append('rect')
      .attr('class', 'card-bg')
      .attr('width', CARD_W).attr('height', CARD_H)
      .attr('rx', CARD_R)
      .attr('fill', theme === 'modern' ? '#1E293B' : '#FFFDF9')
      .attr('stroke', (d) => borderColor(d.data))
      .attr('stroke-width', (d) => d.data.role === 'patriarch' ? 2.8 : 2.2)
      .style('filter', 'url(#card-shadow)');

    // Clip path cho avatar ảnh thật
    card.each(function (d) {
      if (d.data.avatarUrl) {
        const cId = `clip-avatar-${d._uid}`;
        d3.select(this).append('clipPath').attr('id', cId)
          .append('circle').attr('cx', AVATAR_CX).attr('cy', AVATAR_CY).attr('r', AVATAR_R);
      }
    });

    // Avatar tròn
    const av = card.append('g');
    av.append('circle').attr('cx', AVATAR_CX).attr('cy', AVATAR_CY).attr('r', AVATAR_R)
      .attr('fill', (d) => avatarBg(d.data))
      .attr('stroke', (d) => borderColor(d.data))
      .attr('stroke-width', 2.5);

    // Nếu có ảnh thật: hiển thị <image>, nếu không: hiển thị chữ cái đầu
    card.each(function (d) {
      const g = d3.select(this);
      if (d.data.avatarUrl) {
        g.append('image')
          .attr('x', AVATAR_CX - AVATAR_R).attr('y', AVATAR_CY - AVATAR_R)
          .attr('width', AVATAR_R * 2).attr('height', AVATAR_R * 2)
          .attr('href', d.data.avatarUrl)
          .attr('clip-path', `url(#clip-avatar-${d._uid})`)
          .attr('preserveAspectRatio', 'xMidYMid slice')
          .style('pointer-events', 'none');
      } else {
        g.append('text')
          .attr('x', AVATAR_CX).attr('y', AVATAR_CY)
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
          .style('font-size', '20px').style('font-weight', '800')
          .style('fill', avatarText(d.data))
          .style('pointer-events', 'none')
          .text(initial(d.data.fullName));
      }
    });

    // Thông tin text
    const tx = AVATAR_CX + AVATAR_R + 12;

    // Họ tên (in đậm, cỡ 14px, không cắt cụt)
    card.append('text').attr('x', tx).attr('y', 26)
      .attr('class', 'node-title')
      .style('font-size', '14px').style('font-weight', '800')
      .style('fill', theme === 'modern' ? '#F8FAFC' : '#1F2937')
      .style('pointer-events', 'none')
      .text((d) => clip(d.data.fullName, 20));

    // Vai vế badge tự co giãn
    card.each(function (d) {
      const g = d3.select(this);
      const titleText = d.data.familyTitle || (`Đời thứ ${d.data.generation || '?'}`);
      const textLen = titleText.length;
      const badgeW = Math.min(130, Math.max(65, textLen * 7.5 + 14));

      const titleG = g.append('g').attr('transform', `translate(${tx}, 34)`);
      titleG.append('rect')
        .attr('rx', 4).attr('ry', 4)
        .attr('width', badgeW)
        .attr('height', 19)
        .attr('fill', d.data.role === 'patriarch' ? 'rgba(184,134,11,0.15)' : (d.data.gender === 'female' ? 'rgba(219,39,119,0.12)' : 'rgba(37,99,235,0.12)'))
        .attr('stroke', borderColor(d.data))
        .attr('stroke-width', 0.8);
      
      titleG.append('text')
        .attr('x', 7).attr('y', 13.5)
        .attr('class', 'node-subtitle')
        .style('font-size', '11px').style('font-weight', '700')
        .style('fill', borderColor(d.data))
        .style('pointer-events', 'none')
        .text(clip(titleText, 17));
    });

    // Năm sinh — mất
    card.append('text').attr('x', tx).attr('y', 70)
      .attr('class', 'node-years')
      .style('font-size', '11px').style('fill', '#8C857B').style('font-weight', '600')
      .style('pointer-events', 'none')
      .text((d) => yearsLabel(d.data));

    // Huy hiệu góc phải
    card.each(function (d) {
      const g = d3.select(this);
      const bx = CARD_W - 18;
      let by = 16;
      if (d.data.role === 'patriarch' || d.data.role === 'branch_leader') {
        g.append('text').text('👑').attr('x', bx).attr('y', by)
          .style('font-size', '13px').style('pointer-events', 'none');
        by += 17;
      }
      if (d.data.isFirstBorn) {
        g.append('text').text('⭐').attr('x', bx).attr('y', by)
          .style('font-size', '12px').style('pointer-events', 'none');
        by += 17;
      }
      if (d.data.isDeceased) {
        g.append('text').text('🪷').attr('x', bx).attr('y', by)
          .style('font-size', '12px').style('pointer-events', 'none');
      }
    });
  }

  // ═══════════════════════════════════════════
  // VẼ THẺ VỢ / CHỒNG (Spouse Card: 190px x 72px)
  // ═══════════════════════════════════════════
  function drawSpouse(enter) {
    enter.each(function (d) {
      const spouses = d.data.spouses;
      if (!spouses || spouses.length === 0) return;
      const parent = d3.select(this);

      spouses.forEach((sp, idx) => {
        const sX = CARD_W / 2 + SPOUSE_GAP;
        const sY = -SPOUSE_H / 2;
        const grp = parent.append('g').attr('class', 'spouse-grp');

        // Đường nối ngang vàng kim
        grp.append('line')
          .attr('x1', CARD_W / 2).attr('y1', 0)
          .attr('x2', sX).attr('y2', 0)
          .attr('stroke', '#D4AF37').attr('stroke-width', 2.5);

        // Biểu tượng nhẫn cưới trung tâm
        const ringG = grp.append('g').attr('transform', `translate(${CARD_W / 2 + SPOUSE_GAP / 2}, 0)`);
        ringG.append('circle').attr('r', 11).attr('fill', '#FFFDF9').attr('stroke', '#D4AF37').attr('stroke-width', 1.2);
        ringG.append('text').text('💍').attr('text-anchor', 'middle').attr('dominant-baseline', 'central').style('font-size', '11px');

        // Spouse Card
        const sc = grp.append('g')
          .attr('transform', `translate(${sX},${sY})`)
          .style('cursor', 'pointer')
          .on('click', (ev) => {
            ev.stopPropagation();
            document.dispatchEvent(new CustomEvent('giapha:member-selected', { detail: sp.id }));
          });

        const theme = document.documentElement.getAttribute('data-theme') || 'traditional';
        sc.append('rect')
          .attr('width', SPOUSE_W).attr('height', SPOUSE_H)
          .attr('rx', 8)
          .attr('fill', theme === 'modern' ? '#1E293B' : '#FFFDF9')
          .attr('stroke', borderColor(sp))
          .attr('stroke-width', 2)
          .style('filter', 'url(#card-shadow)');

        const spClipId = `clip-spouse-${d._uid}-${idx}`;
        if (sp.avatarUrl) {
          sc.append('clipPath').attr('id', spClipId)
            .append('circle').attr('cx', 24).attr('cy', SPOUSE_H / 2).attr('r', 18);
        }

        // Spouse avatar
        sc.append('circle').attr('cx', 24).attr('cy', SPOUSE_H / 2).attr('r', 18)
          .attr('fill', avatarBg(sp)).attr('stroke', borderColor(sp)).attr('stroke-width', 2);

        if (sp.avatarUrl) {
          sc.append('image')
            .attr('x', 6).attr('y', SPOUSE_H / 2 - 18)
            .attr('width', 36).attr('height', 36)
            .attr('href', sp.avatarUrl)
            .attr('clip-path', `url(#${spClipId})`)
            .attr('preserveAspectRatio', 'xMidYMid slice')
            .style('pointer-events', 'none');
        } else {
          sc.append('text')
            .attr('x', 24).attr('y', SPOUSE_H / 2)
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
            .style('font-size', '15px').style('font-weight', '700')
            .style('fill', avatarText(sp)).style('pointer-events', 'none')
            .text(initial(sp.fullName));
        }

        // Spouse tên đầy đủ (13px, không cắt ngắn)
        sc.append('text').attr('x', 48).attr('y', 25)
          .style('font-size', '13px').style('font-weight', '700')
          .style('fill', theme === 'modern' ? '#F8FAFC' : '#1F2937')
          .style('pointer-events', 'none')
          .text(clip(sp.fullName, 17));

        // Spouse vai vế & năm (11px rõ nét)
        sc.append('text').attr('x', 48).attr('y', 45)
          .style('font-size', '11px').style('fill', '#8C857B').style('font-weight', '500')
          .style('pointer-events', 'none')
          .text((sp.familyTitle ? clip(sp.familyTitle, 9) + ' • ' : '') + yearsLabel(sp));

        if (sp.isDeceased) {
          sc.append('text').text('🪷')
            .attr('x', SPOUSE_W - 16).attr('y', 17)
            .style('font-size', '11px').style('pointer-events', 'none');
        }
      });
    });
  }

  // ═══════════════════════════════════════════
  // NÚT THU GỌN / MỞ RỘNG
  // ═══════════════════════════════════════════
  function drawCollapseBtn(enter) {
    const btn = enter.append('g')
      .attr('class', 'collapse-btn')
      .attr('transform', (d) => {
        const hasSpouse = d.data.spouses && d.data.spouses.length > 0;
        const btnX = hasSpouse ? COUPLE_MID_X : 0;
        return `translate(${btnX},${CARD_H / 2 + 8})`;
      })
      .style('cursor', 'pointer')
      .style('display', (d) => (d.children || d._children) ? null : 'none')
      .on('click', (ev, d) => {
        ev.stopPropagation();
        if (d.children) { d._children = d.children; d.children = null; }
        else { d.children = d._children; d._children = null; }
        update(d);
      });

    const theme = document.documentElement.getAttribute('data-theme') || 'traditional';
    btn.append('circle').attr('r', COLLAPSE_R)
      .attr('fill', theme === 'modern' ? '#1E293B' : '#FFFDF9')
      .attr('stroke', '#D4AF37').attr('stroke-width', 1.8);

    btn.append('text')
      .attr('class', 'collapse-label')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .style('font-size', '16px').style('font-weight', '700')
      .style('fill', '#B8860B').style('pointer-events', 'none')
      .text((d) => d._children ? '+' : '−');
  }

  // ═══════════════════════════════════════════
  // ĐƯỜNG NỐI CHA MẸ — CON (Xuất phát từ giữa cặp vợ chồng)
  // ═══════════════════════════════════════════
  function diagonal(child, parent) {
    const parentHasSpouse = parent.data && parent.data.spouses && parent.data.spouses.length > 0;
    const parentX = parent.x + (parentHasSpouse ? COUPLE_MID_X : 0);
    const parentY = parent.y + CARD_H / 2 + 8 + COLLAPSE_R;

    const childY = child.y - CARD_H / 2 - 8;
    const midY = (parentY + childY) / 2;

    return `M ${parentX},${parentY} C ${parentX},${midY} ${child.x},${midY} ${child.x},${childY}`;
  }

  // ═══════════════════════════════════════════
  // ZOOM HELPERS
  // ═══════════════════════════════════════════
  function zoomBy(factor) {
    if (!svg || !zoomBehavior) return;
    const parent = svg.node().parentElement;
    const fw = parent ? parent.clientWidth : window.innerWidth;
    const fh = parent ? parent.clientHeight : window.innerHeight;
    svg.transition().duration(350).call(zoomBehavior.scaleBy, factor, [fw / 2, fh / 2]);
  }

  function centerRoot() {
    if (!svg || !rootNode) return;
    const parent = svg.node().parentElement;
    if (!parent) return;
    const fw = parent.clientWidth;
    const isMobile = fw < 768;
    const scale = isMobile ? 0.72 : 0.9;
    const rootMid = rootNode.x + COUPLE_MID_X;
    const tx = fw / 2 - scale * rootMid;
    const ty = isMobile ? 45 : 70;
    const t = d3.zoomIdentity.translate(tx, ty).scale(scale);
    svg.transition().duration(800).call(zoomBehavior.transform, t);
  }

  function fitToScreen() {
    if (!svg || !rootNode || !gContent.node()) return;
    const box = gContent.node().getBBox();
    const parent = svg.node().parentElement;
    if (!parent) return;
    const fw = parent.clientWidth, fh = parent.clientHeight;
    if (box.width === 0 || box.height === 0) return;

    const isMobile = fw < 768;
    const pad = isMobile ? 20 : 50;
    const calcScale = Math.min(
      (fw - pad * 2) / box.width,
      (fh - pad * 2) / box.height
    );

    const scale = isMobile ? Math.max(0.48, Math.min(calcScale, 0.85)) : Math.max(0.45, Math.min(calcScale, 1.0));
    const midX = box.x + box.width / 2;
    const tx = fw / 2 - scale * midX;
    const ty = isMobile ? 40 : 60;
    const t = d3.zoomIdentity.translate(tx, ty).scale(scale);
    svg.transition().duration(750).call(zoomBehavior.transform, t);
  }

  // ═══════════════════════════════════════════
  // FOCUS NODE
  // ═══════════════════════════════════════════
  function focusNode(input) {
    if (!rootNode) return;
    const personId = (input && typeof input === 'object') ? (input.memberId || input.id) : input;
    if (!personId) return;
    let target = null;

    function find(node, id) {
      if (node.data.id === id) { target = node; return true; }
      if (node.data.spouses && node.data.spouses.some((s) => s.id === id)) { target = node; return true; }
      const kids = node.children || node._children;
      if (!kids) return false;
      for (const c of kids) {
        if (find(c, id)) {
          if (node._children) { node.children = node._children; node._children = null; }
          return true;
        }
      }
      return false;
    }
    find(rootNode, personId);
    if (!target) return;

    update(rootNode);
    setTimeout(() => {
      const p = svg.node().parentElement;
      const scale = 1.15;
      const tx = p.clientWidth / 2 - scale * target.x;
      const ty = p.clientHeight / 2 - scale * target.y;
      const t = d3.zoomIdentity.translate(tx, ty).scale(scale);
      svg.transition().duration(900).call(zoomBehavior.transform, t);

      gNodes.selectAll('g.node .card-bg')
        .filter((d) => d._uid === target._uid)
        .transition().duration(250).attr('stroke', '#EF4444').attr('stroke-width', 4.5)
        .transition().duration(250).attr('stroke', (d) => borderColor(d.data)).attr('stroke-width', 2.2)
        .transition().duration(250).attr('stroke', '#EF4444').attr('stroke-width', 4.5)
        .transition().duration(250).attr('stroke', (d) => borderColor(d.data)).attr('stroke-width', 2.2);
    }, DURATION + 50);
  }

  // ═══════════════════════════════════════════
  // ĐỔI THEME
  // ═══════════════════════════════════════════
  function recolor(e) {
    if (!gContent) return;
    const theme = (e && e.detail && e.detail.theme) || document.documentElement.getAttribute('data-theme') || 'traditional';
    const isDark = theme === 'modern';

    gContent.selectAll('.card-bg').attr('fill', isDark ? '#1E293B' : '#FFFDF9');
    gContent.selectAll('.spouse-grp rect').attr('fill', isDark ? '#1E293B' : '#FFFDF9');
    gContent.selectAll('.collapse-btn circle').attr('fill', isDark ? '#1E293B' : '#FFFDF9');
    gContent.selectAll('.family-unit-box rect').attr('fill', isDark ? 'rgba(56,189,248,0.04)' : 'rgba(212,175,55,0.03)');

    gContent.selectAll('.node-title').style('fill', isDark ? '#F8FAFC' : '#1F2937');
    gContent.selectAll('.spouse-grp text:nth-of-type(2)').style('fill', isDark ? '#F8FAFC' : '#1F2937');
    gContent.selectAll('path.link').attr('stroke', isDark ? '#0284C7' : '#A08060');
  }

  function expandAll() {
    if (!rootNode) return;
    function ex(n) { if (n._children) { n.children = n._children; n._children = null; } if (n.children) n.children.forEach(ex); }
    ex(rootNode);
    update(rootNode);
    setTimeout(fitToScreen, 400);
  }
  function collapseAll() {
    if (!rootNode) return;
    function col(n) { if (n.children) { n._children = n.children; n._children.forEach(col); n.children = null; } }
    if (rootNode.children) rootNode.children.forEach(col);
    update(rootNode);
    setTimeout(centerRoot, 400);
  }

  return { init, render, focusNode, expandAll, collapseAll, fitToScreen, centerRoot };
})();
