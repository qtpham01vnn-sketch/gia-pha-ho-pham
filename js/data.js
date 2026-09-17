window.GiaPha = window.GiaPha || {};

window.GiaPha.dataModule = {
  load: function() {
    return fetch('./data/data.json')
      .then(r => {
        if (!r.ok) throw new Error('Network response was not ok');
        return r.json();
      })
      .catch(() => {
        // Fallback cho giao thức file://
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', './data/data.json', true);
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 0) { // status 0 dùng cho file://
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch(e) {
                reject(new Error('Lỗi phân tích JSON'));
              }
            } else {
              reject(new Error('Không thể tải dữ liệu'));
            }
          };
          xhr.onerror = () => reject(new Error('Không thể tải dữ liệu (CORS/Network error)'));
          xhr.send();
        });
      })
      .then(data => {
        // Kiểm tra xem có dữ liệu tùy chỉnh lưu trong localStorage không
        try {
          const savedDataStr = localStorage.getItem('gia-pha-custom-data');
          if (savedDataStr) {
            const savedData = JSON.parse(savedDataStr);
            if (savedData && savedData.people && savedData.people.length >= data.people.length) {
              data = savedData;
            }
          }
        } catch (e) {
          console.warn('Không thể đọc localStorage:', e);
        }

        window.GiaPha.data = data;
        window.GiaPha.peopleMap = new Map();
        
        if (data && data.people) {
          data.people.forEach(p => window.GiaPha.peopleMap.set(p.id, p));
        }
        
        // Phát sự kiện dữ liệu đã tải xong
        document.dispatchEvent(new CustomEvent('giapha:data-loaded', {detail: data}));
        return data;
      });
  },

  getPerson: function(id) {
    return window.GiaPha.peopleMap.get(id);
  },

  // Lấy relationship record của một người
  _getRelationship: function(personId) {
    const data = window.GiaPha.data;
    if (!data || !data.relationships) return null;
    return data.relationships.find(r => r.personId === personId);
  },

  getChildren: function(personId) {
    const rel = this._getRelationship(personId);
    if (!rel || !rel.childrenIds) return [];
    return rel.childrenIds.map(id => this.getPerson(id)).filter(Boolean);
  },

  getSpouses: function(personId) {
    const rel = this._getRelationship(personId);
    if (!rel || !rel.spouseIds) return [];
    return rel.spouseIds.map(id => this.getPerson(id)).filter(Boolean);
  },

  getParents: function(personId) {
    const rel = this._getRelationship(personId);
    if (!rel) return [];
    const parents = [];
    if (rel.fatherId) { const f = this.getPerson(rel.fatherId); if (f) parents.push(f); }
    if (rel.motherId) { const m = this.getPerson(rel.motherId); if (m) parents.push(m); }
    return parents;
  },

  getSiblings: function(personId) {
    const parents = this.getParents(personId);
    if (parents.length === 0) return [];
    // Lấy con của cha (hoặc mẹ), loại trừ chính mình
    return this.getChildren(parents[0].id).filter(p => p.id !== personId);
  },

  buildFamilyTree: function() {
    const people = Array.from(window.GiaPha.peopleMap.values());
    if (people.length === 0) return null;

    // Tìm người thủy tổ: role patriarch hoặc thế hệ 1 không có cha
    let rootPerson = people.find(p => p.role === 'patriarch') ||
                     people.find(p => p.generation === 1 && p.gender === 'male' && !this._getRelationship(p.id)?.fatherId);

    if (!rootPerson) rootPerson = people[0];
    if (!rootPerson) return null;

    const visited = new Set(); // Tránh vòng lặp

    // Đệ quy xây dựng cây — flatten person props vào node để D3 truy cập trực tiếp
    const buildNode = (person) => {
      if (visited.has(person.id)) return null;
      visited.add(person.id);

      // Spread tất cả thuộc tính person vào node (fullName, gender, birthYear...)
      // để d3.hierarchy truy cập d.data.fullName trực tiếp
      const node = Object.assign({}, person, {
        children: [],
        spouses: this.getSpouses(person.id)
      });

      // Chỉ lấy children từ record relationship của người này (tránh duplicate từ vợ)
      const rel = this._getRelationship(person.id);
      if (rel && rel.childrenIds) {
        const childNodes = [];
        rel.childrenIds.forEach(childId => {
          if (visited.has(childId)) return;
          const childPerson = this.getPerson(childId);
          if (!childPerson) return;
          const childRel = this._getRelationship(childId);
          if (childRel && (childRel.fatherId === person.id || childRel.motherId === person.id)) {
            if (person.gender === 'male' || !childRel.fatherId || childRel.fatherId === person.id) {
              const childNode = buildNode(childPerson);
              if (childNode) childNodes.push(childNode);
            }
          }
        });
        // Sắp xếp theo childOrder (đọc trực tiếp từ node đã flatten)
        childNodes.sort((a, b) => (a.childOrder || 99) - (b.childOrder || 99));
        node.children = childNodes;
      }

      return node;
    };

    return buildNode(rootPerson);
  },

  search: function(query) {
    if (!query || query.trim() === '') return [];

    // Loại bỏ dấu tiếng Việt cho tìm kiếm
    const removeAccents = (str) => {
      return (str || '').normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd').replace(/Đ/g, 'D')
                .toLowerCase().trim();
    };

    const q = removeAccents(query);
    const results = [];

    window.GiaPha.peopleMap.forEach(person => {
      const name = removeAccents(person.fullName);
      const title = removeAccents(person.familyTitle);
      const alias = removeAccents(person.aliasName);
      
      let score = 0;
      const words = name.split(/\s+/);
      const lastName = words[words.length - 1] || '';

      if (name === q) score = 100;
      else if (lastName === q) score = 80;
      else if (name.startsWith(q)) score = 60;
      else if (name.includes(q)) score = 40;
      else if (title.includes(q) || alias.includes(q)) score = 20;

      if (score > 0) {
        // Ưu tiên người mang họ gốc dòng họ (role patriarch hoặc họ Phạm)
        if (person.role === 'patriarch' || (person.fullName && person.fullName.toLowerCase().startsWith('phạm'))) {
          score += 5;
        }
        results.push({ person, score });
      }
    });

    results.sort((a, b) => b.score - a.score);
    return results.map(r => r.person);
  },

  getStats: function() {
    const people = Array.from(window.GiaPha.peopleMap.values());
    let maxGen = 0, male = 0, female = 0, living = 0, deceased = 0;

    people.forEach(p => {
      if (p.generation > maxGen) maxGen = p.generation;
      if (p.gender === 'male') male++;
      else if (p.gender === 'female') female++;
      if (p.isDeceased) deceased++;
      else living++;
    });

    return { total: people.length, generations: maxGen, male, female, living, deceased };
  }
};
