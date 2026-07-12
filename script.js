/* ========================================
   Yach1yo Personal Homepage — Scripts
   Features: CRUD, File Upload, localStorage
   ======================================== */

// ---------- 数据模型 ----------
const STORAGE_KEY = 'yach1yo_portfolio_data';

const defaultData = {
  profile: {
    name: 'Yach1yo',
    tagline: '探索技术的边界',
    bio: '这里写一段简短的自我介绍，介绍你的研究方向、兴趣爱好和技术栈。',
    skills: ['Python', 'JavaScript', 'AI/ML', 'NLP'],
    socialLinks: [
      { name: 'GitHub', url: 'https://github.com/yach1yo' }
    ]
  },
  research: [],
  vibe: []
};

// 初始化时清空示例数据 -> 实际使用
// const defaultData = { profile: {...}, research: [], vibe: [] };

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('数据加载失败，使用默认数据');
  }
  return JSON.parse(JSON.stringify(defaultData));
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    showToast('存储空间不足，请清理一些文件', 'error');
  }
}

let appData = loadData();

// ---------- Toast ----------
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ---------- 头像 ----------
function initAvatar() {
  const wrapper = document.getElementById('avatarWrapper');
  const input = document.getElementById('avatarUpload');
  const img = document.getElementById('avatarImg');

  // 加载已保存的头像
  const savedAvatar = localStorage.getItem('yach1yo_avatar');
  if (savedAvatar) {
    img.src = savedAvatar;
  }

  wrapper.addEventListener('click', () => input.click());
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      img.src = ev.target.result;
      try {
        localStorage.setItem('yach1yo_avatar', ev.target.result);
      } catch (e) {
        // 图片太大，压缩存储
        showToast('头像过大，建议使用小于500KB的图片', 'error');
      }
      showToast('头像已更新', 'success');
    };
    reader.readAsDataURL(file);
  });
}

// ---------- 个人资料编辑 ----------
function initProfileEditor() {
  const nameEl = document.getElementById('profileName');
  const taglineEl = document.getElementById('profileTagline');
  const bioEl = document.getElementById('bioContent');

  // 加载
  nameEl.textContent = appData.profile.name;
  taglineEl.textContent = appData.profile.tagline;
  bioEl.textContent = appData.profile.bio;

  // 保存
  const saveProfile = () => {
    appData.profile.name = nameEl.textContent.trim() || 'Yach1yo';
    appData.profile.tagline = taglineEl.textContent.trim() || '探索技术的边界';
    appData.profile.bio = bioEl.textContent.trim() || '';
    saveData(appData);
  };

  [nameEl, taglineEl].forEach(el => {
    el.addEventListener('blur', saveProfile);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
    });
  });

  bioEl.addEventListener('blur', saveProfile);
}

// ---------- 技能标签 ----------
function initSkills() {
  renderSkills();

  document.getElementById('addSkillBtn').addEventListener('click', () => {
    const container = document.getElementById('skillsTags');
    const addBtn = document.getElementById('addSkillBtn');

    const newTag = document.createElement('span');
    newTag.className = 'skill-tag';
    newTag.contentEditable = 'true';
    newTag.textContent = '新技能';
    container.insertBefore(newTag, addBtn);

    newTag.focus();
    // 选中全部文字
    const range = document.createRange();
    range.selectNodeContents(newTag);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    // 失焦时保存
    newTag.addEventListener('blur', () => collectAndSaveSkills());
    newTag.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); newTag.blur(); }
    });
  });
}

function renderSkills() {
  const container = document.getElementById('skillsTags');
  // 清空但保留添加按钮
  const addBtn = document.getElementById('addSkillBtn');
  container.innerHTML = '';

  (appData.profile.skills || []).forEach((skill, idx) => {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.contentEditable = 'true';
    tag.textContent = skill;
    tag.addEventListener('blur', () => collectAndSaveSkills());
    tag.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); tag.blur(); }
      if (e.key === 'Backspace' && tag.textContent === '') {
        e.preventDefault();
        tag.remove();
        collectAndSaveSkills();
      }
    });
    container.appendChild(tag);
  });
  container.appendChild(addBtn);
}

function collectAndSaveSkills() {
  const container = document.getElementById('skillsTags');
  const tags = container.querySelectorAll('.skill-tag:not(.add-skill-btn)');
  appData.profile.skills = Array.from(tags)
    .map(t => t.textContent.trim())
    .filter(t => t.length > 0);
  saveData(appData);
  // 移除空标签
  tags.forEach(t => { if (!t.textContent.trim()) t.remove(); });
}

// ---------- 社交链接 ----------
function initSocialLinks() {
  renderSocialLinks();

  document.getElementById('addSocialBtn').addEventListener('click', () => {
    openSocialModal();
  });
}

function renderSocialLinks() {
  const container = document.getElementById('socialLinks');
  container.innerHTML = '';

  (appData.profile.socialLinks || []).forEach((link, idx) => {
    const a = document.createElement('a');
    a.className = 'social-link';
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener';

    const icon = getSocialIcon(link.name);
    a.innerHTML = `${icon}<span>${link.name}</span>`;

    // 右键删除
    a.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (confirm(`确定删除链接 "${link.name}" 吗？`)) {
        appData.profile.socialLinks.splice(idx, 1);
        saveData(appData);
        renderSocialLinks();
        showToast('链接已删除', 'info');
      }
    });

    container.appendChild(a);
  });

  const addBtn = document.createElement('div');
  addBtn.className = 'social-link add-social';
  addBtn.id = 'addSocialBtn';
  addBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span>添加链接</span>';
  addBtn.addEventListener('click', () => openSocialModal());
  container.appendChild(addBtn);
}

function getSocialIcon(name) {
  const map = {
    'GitHub': '<i class="fa-brands fa-github"></i>',
    'Twitter': '<i class="fa-brands fa-twitter"></i>',
    'X': '<i class="fa-brands fa-x-twitter"></i>',
    'LinkedIn': '<i class="fa-brands fa-linkedin"></i>',
    'Blog': '<i class="fa-solid fa-blog"></i>',
    'Email': '<i class="fa-solid fa-envelope"></i>',
    'Website': '<i class="fa-solid fa-globe"></i>',
    'Bilibili': '<i class="fa-brands fa-bilibili"></i>',
    '知乎': '<i class="fa-brands fa-zhihu"></i>',
    'Google Scholar': '<i class="fa-solid fa-graduation-cap"></i>',
    'ORCID': '<i class="fa-brands fa-orcid"></i>',
  };
  return map[name] || '<i class="fa-solid fa-link"></i>';
}

function openSocialModal(editIndex = null) {
  const overlay = document.getElementById('socialModalOverlay');
  const nameInput = document.getElementById('socialName');
  const urlInput = document.getElementById('socialUrl');

  nameInput.value = '';
  urlInput.value = '';
  overlay.classList.add('active');

  const close = () => overlay.classList.remove('active');
  const save = () => {
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    if (!name || !url) {
      showToast('请填写完整信息', 'error');
      return;
    }
    appData.profile.socialLinks.push({ name, url });
    saveData(appData);
    renderSocialLinks();
    close();
    showToast('链接已添加', 'success');
  };

  document.getElementById('socialModalClose').onclick = close;
  document.getElementById('socialModalCancel').onclick = close;
  document.getElementById('socialModalSave').onclick = save;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  setTimeout(() => nameInput.focus(), 200);
}

// ---------- 卡片 CRUD ----------
const CATEGORIES = {
  research: { grid: 'researchGrid', empty: 'researchEmpty', badge: 'researchCount', label: '研究项目' },
  vibe: { grid: 'vibeGrid', empty: 'vibeEmpty', badge: 'vibeCount', label: 'Vibe Coding 试作品' }
};

let currentModalContext = { category: null, editId: null, tempFiles: [] };

function renderCards(category) {
  const cfg = CATEGORIES[category];
  const grid = document.getElementById(cfg.grid);
  const empty = document.getElementById(cfg.empty);
  const badge = document.getElementById(cfg.badge);
  const items = appData[category];

  grid.innerHTML = '';
  badge.textContent = `${items.length} 个${items.length > 0 ? '' : ''}`;

  if (items.length === 0) {
    empty.classList.add('visible');
    return;
  }
  empty.classList.remove('visible');

  items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(item.title || '未命名')}</h3>
        <div class="card-actions">
          <button class="card-action-btn" data-action="edit" data-idx="${idx}" title="编辑">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="card-action-btn delete" data-action="delete" data-idx="${idx}" title="删除">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
      ${item.desc ? `<p class="card-desc">${escapeHtml(item.desc)}</p>` : ''}
      ${item.tags && item.tags.length > 0 ? `
        <div class="card-tags">
          ${item.tags.map(t => `<span class="card-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      ` : ''}
      ${item.files && item.files.length > 0 ? `
        <div class="card-files">
          ${item.files.map(f => {
            if (f.data) {
              return `<span class="card-file" data-file-idx="${item.files.indexOf(f)}"><i class="fa-solid fa-paperclip"></i>${escapeHtml(f.name)}</span>`;
            }
            return `<a class="card-file" href="${escapeHtml(f.url || '#')}" target="_blank" rel="noopener"><i class="fa-solid fa-link"></i>${escapeHtml(f.name)}</a>`;
          }).join('')}
        </div>
      ` : ''}
      ${item.link ? `<a class="card-link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i>查看详情</a>` : ''}
    `;

    // 附件下载
    card.querySelectorAll('.card-file[data-file-idx]').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const fi = parseInt(el.dataset.fileIdx);
        if (item.files[fi] && item.files[fi].data) {
          downloadFile(item.files[fi]);
        }
      });
    });

    // 编辑/删除
    card.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(category, idx);
    });
    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`确定删除"${item.title}"吗？`)) {
        appData[category].splice(idx, 1);
        saveData(appData);
        renderCards(category);
        showToast('已删除', 'info');
      }
    });

    // 点击卡片编辑
    card.addEventListener('click', () => openModal(category, idx));

    grid.appendChild(card);
  });
}

function openModal(category, editId = null) {
  currentModalContext = { category, editId, tempFiles: [] };
  const overlay = document.getElementById('modalOverlay');
  const titleEl = document.getElementById('modalTitle');
  const titleInput = document.getElementById('modalItemTitle');
  const descInput = document.getElementById('modalItemDesc');
  const tagsInput = document.getElementById('modalItemTags');
  const linkInput = document.getElementById('modalItemLink');
  const fileList = document.getElementById('modalFileList');

  const label = CATEGORIES[category].label;

  if (editId !== null) {
    const item = appData[category][editId];
    titleEl.textContent = `编辑${label}`;
    titleInput.value = item.title || '';
    descInput.value = item.desc || '';
    tagsInput.value = (item.tags || []).join(', ');
    linkInput.value = item.link || '';
    currentModalContext.tempFiles = [...(item.files || [])];
  } else {
    titleEl.textContent = `新增${label}`;
    titleInput.value = '';
    descInput.value = '';
    tagsInput.value = '';
    linkInput.value = '';
    currentModalContext.tempFiles = [];
  }

  renderModalFileList();
  overlay.classList.add('active');

  const close = () => {
    overlay.classList.remove('active');
    currentModalContext = { category: null, editId: null, tempFiles: [] };
  };

  const save = () => {
    const title = titleInput.value.trim();
    if (!title) {
      showToast('请输入标题', 'error');
      return;
    }

    const item = {
      title,
      desc: descInput.value.trim(),
      tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
      link: linkInput.value.trim(),
      files: currentModalContext.tempFiles,
      updatedAt: new Date().toISOString()
    };

    if (editId !== null) {
      appData[category][editId] = item;
    } else {
      appData[category].unshift(item);
    }

    saveData(appData);
    renderCards(category);
    close();
    showToast(editId !== null ? '已更新' : '已创建', 'success');
  };

  document.getElementById('modalClose').onclick = close;
  document.getElementById('modalCancel').onclick = close;
  document.getElementById('modalSave').onclick = save;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  setTimeout(() => titleInput.focus(), 200);
}

// ---------- 文件处理 ----------
function renderModalFileList() {
  const container = document.getElementById('modalFileList');
  container.innerHTML = '';

  currentModalContext.tempFiles.forEach((file, idx) => {
    const div = document.createElement('div');
    div.className = 'file-item';
    const sizeStr = file.data
      ? formatBytes(Math.round(file.data.length * 0.75))
      : '外部链接';
    div.innerHTML = `
      <div class="file-item-info">
        <i class="fa-solid fa-file-lines"></i>
        <span class="file-item-name">${escapeHtml(file.name)}</span>
        <span class="file-item-size">${sizeStr}</span>
      </div>
      <button class="file-item-remove" data-idx="${idx}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    div.querySelector('.file-item-remove').addEventListener('click', () => {
      currentModalContext.tempFiles.splice(idx, 1);
      renderModalFileList();
    });
    container.appendChild(div);
  });
}

function initFileUpload() {
  const area = document.getElementById('modalFileArea');
  const input = document.getElementById('modalFileInput');

  area.addEventListener('click', () => input.click());

  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('drag-over');
  });
  area.addEventListener('dragleave', () => {
    area.classList.remove('drag-over');
  });
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  input.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    input.value = '';
  });
}

function handleFiles(fileList) {
  Array.from(fileList).forEach(file => {
    if (file.size > 10 * 1024 * 1024) {
      showToast(`文件 ${file.name} 超过10MB限制`, 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      currentModalContext.tempFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: e.target.result
      });
      renderModalFileList();
      showToast(`已添加: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
  });
}

function downloadFile(file) {
  const a = document.createElement('a');
  a.href = file.data;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- 导出备份 ----------
function initExport() {
  document.getElementById('btnExport').addEventListener('click', () => {
    const exportData = {
      profile: appData.profile,
      research: appData.research.map(item => ({
        ...item,
        files: item.files?.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size,
          url: f.url || null,
          data: f.data || null
        })) || []
      })),
      vibe: appData.vibe.map(item => ({
        ...item,
        files: item.files?.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size,
          url: f.url || null,
          data: f.data || null
        })) || []
      })),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yach1yo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('数据已导出', 'success');
  });
}

// ---------- 按钮事件绑定 ----------
function initButtons() {
  document.getElementById('btnAddResearch').addEventListener('click', () => openModal('research'));
  document.getElementById('btnAddVibe').addEventListener('click', () => openModal('vibe'));
}

// ---------- 快捷键 ----------
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+S 触发导出
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // 保存数据
      saveData(appData);
      showToast('数据已保存', 'success');
    }
    // Escape 关闭弹窗
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(ov => {
        ov.classList.remove('active');
      });
    }
  });
}

// ---------- 初始化 ----------
function init() {
  initAvatar();
  initProfileEditor();
  initSkills();
  initSocialLinks();
  initFileUpload();
  initButtons();
  initExport();
  initKeyboard();

  renderCards('research');
  renderCards('vibe');

  console.log('🚀 Yach1yo 个人主页已就绪');
  console.log('💡 提示：所有数据自动保存至浏览器 localStorage');
  console.log('📦 点击"导出备份"可下载 JSON 数据文件');
}

document.addEventListener('DOMContentLoaded', init);
