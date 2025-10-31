// script.js (v12 - 统一鉴权与刷新版)

// --- 0. 导入 Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc,
  doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- 1. Firebase 配置 (使用最小化配置) ---
const firebaseConfig = {
  apiKey: "AIzaSyDm7J8PpBr2uMhVUvDdExeTiut1Ogrr0F4",
  authDomain: "my-film-library-8f972.firebaseapp.com",
  projectId: "my-film-library-8f972",
};

// --- 2. 初始化 Firebase ---
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("✅ Firebase 初始化成功！(v12 - 统一鉴权版)");
} catch (error) {
  console.error("❌ Firebase 初始化失败:", error);
  document.body.innerHTML = `<h1 style="color: red; text-align: center; margin-top: 50px;">Firebase 初始化失败！请检查 script.js 中的 firebaseConfig。</h1>`;
  throw new Error("Firebase init failed");
}


// --- 3. 主应用代码 ---
document.addEventListener('DOMContentLoaded', () => {

    // === 3.1 DOM 元素选择 ===
    // (与 v11 相同)
    const navLinks = document.querySelectorAll('.nav-link');
    const diskFilterContainer = document.getElementById('disk-filter-container');
    const diskFilterButtons = document.querySelectorAll('.filter-btn');
    const movieGrid = document.getElementById('movie-grid');
    const addMovieBtn = document.getElementById('add-movie-btn');
    const addModal = document.getElementById('add-modal');
    const addModalCloseBtn = document.getElementById('add-modal-close-btn');
    const addForm = document.getElementById('add-form');
    const addFormTitle = document.getElementById('add-form-title');
    const addFormSubmitBtn = document.getElementById('add-form-submit-btn');
    const categorySelect = document.getElementById('category');
    const passwordModal = document.getElementById('password-modal');
    const passwordModalCloseBtn = document.getElementById('password-modal-close-btn');
    const passwordForm = document.getElementById('password-form');
    const passwordInput = document.getElementById('password-input');
    const passwordError = document.getElementById('password-error');
    const ADMIN_PASSWORD = '615243';
    const detailsModal = document.getElementById('details-modal');
    const detailsModalCloseBtn = document.getElementById('details-modal-close-btn');
    const detailEditBtn = document.getElementById('detail-edit-btn');
    const detailDeleteBtn = document.getElementById('detail-delete-btn');

    // === 3.2 状态变量 ===
    let fullDatabase = {};
    let currentCategory = 'movies';
    let currentDisk = 'all';
    let currentEditingItem = null;
    let pendingAction = null; // 【新】用于跟踪需要鉴权的操作

    // === 3.3 核心功能函数 ===

    /**
     * @description 从 Firebase 加载所有数据 (与 v11 相同)
     */
    async function loadDatabase() {
        console.log("正在从 Firebase 加载数据...");
        movieGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center;">正在加载...</p>`;

        try {
            const categories = ['movies', 'documentaries', 'tv_shows', 'concerts'];
            const promises = categories.map(category => getDocs(collection(db, category)));
            const results = await Promise.all(promises);

            fullDatabase = {};
            results.forEach((snapshot, index) => {
                const categoryName = categories[index];
                fullDatabase[categoryName] = snapshot.docs.map(doc => {
                    return {
                        id: doc.id,
                        category: categoryName,
                        ...doc.data()
                    };
                });
            });

            console.log("✅ 数据库加载成功:", fullDatabase);
            renderContent();
            updateDiskFilterVisibility();
        } catch (error) {
            console.error("❌ 加载 Firestore 数据失败:", error);
            movieGrid.innerHTML = `<p style="color: red; grid-column: 1 / -1;">加载数据失败。</p>`;
        }
    }

    /**
     * @description 渲染内容 (与 v11 相同)
     */
    function renderContent() {
        movieGrid.innerHTML = '';
        const items = fullDatabase[currentCategory] || [];
        if (!items) return;

        const itemsToRender = items
            .filter(item => (currentDisk === 'all' || item.disk === currentDisk))
            .sort((a, b) => (b.year || 0) - (a.year || 0));

        if (itemsToRender.length === 0) {
            movieGrid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center; margin-top: 40px;">这个分类下没有影片。</p>`;
            return;
        }

        itemsToRender.forEach(item => {
            const notesEl = item.notes ? `<span class="card-notes" title="${item.notes}">${item.notes}</span>` : '';
            const yearEl = item.year ? `<span>${item.year}</span>` : '';
            const imdbEl = item.imdb ? `<span>${item.imdb} IMDb</span>` : '';
            const cardHTML = `
                <div class="movie-card" data-id="${item.id}" data-category="${currentCategory}">
                    <div class="card-info">
                        <h3 class="card-title" title="${item.title}">${item.title}</h3>
                        <div class="card-meta">
                            ${notesEl}
                            ${yearEl}
                            ${imdbEl}
                        </div>
                    </div>
                </div>
            `;
            movieGrid.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    /**
     * @description 更新分盘筛选器的可见性 (与 v11 相同)
     */
    function updateDiskFilterVisibility() {
        if (currentCategory === 'movies') {
            diskFilterContainer.style.display = 'flex';
        } else {
            diskFilterContainer.style.display = 'none';
        }
    }

    /**
     * @description 检查密码会话 (与 v11 相同)
     */
    function checkAuthSession() {
        const authTimestamp = localStorage.getItem('passwordTimestamp');
        if (!authTimestamp) return false;
        const thirtyMinutes = 30 * 60 * 1000;
        return (Date.now() - parseInt(authTimestamp)) < thirtyMinutes;
    }

    /**
     * @description 打开 "添加/编辑" 模态框 (与 v11 相同)
     */
    function openAddModal(item = null) {
        addForm.reset();
        currentEditingItem = item;
        if (item) {
            addFormTitle.textContent = '编辑影片';
            addFormSubmitBtn.textContent = '更新';
            document.getElementById('category').value = item.category.slice(0, -1);
            document.getElementById('disk').value = item.disk;
            document.getElementById('title').value = item.title;
            document.getElementById('year').value = item.year;
            document.getElementById('doubanLink').value = item.doubanLink;
            document.getElementById('resolution').value = item.resolution;
            document.getElementById('format').value = item.format;
            document.getElementById('rating').value = item.rating;
            document.getElementById('imdb').value = item.imdb;
            document.getElementById('notes').value = item.notes;
        } else {
            addFormTitle.textContent = '添加新影片';
            addFormSubmitBtn.textContent = '保存影片';
            categorySelect.value = currentCategory.slice(0, -1);
        }
        addModal.style.display = 'flex';
    }

    /**
     * @description 显示详情模态框 (与 v11 相同)
     */
    function showDetailsModal(item) {
        document.getElementById('detail-title').textContent = item.title || '无标题';
        const metaParts = [ item.year || null, item.imdb ? `${item.imdb} IMDb` : null ].filter(Boolean);
        document.getElementById('detail-meta').textContent = metaParts.join(' | ');
        document.getElementById('detail-notes').textContent = item.notes || '';
        document.getElementById('detail-resolution').textContent = item.resolution || 'N/A';
        document.getElementById('detail-format').textContent = item.format || 'N/A';
        document.getElementById('detail-rating').textContent = item.rating || 'N/A';
        document.getElementById('detail-disk').textContent = item.disk || 'N/A';
        const doubanLink = document.getElementById('detail-douban');
        if (item.doubanLink) {
            doubanLink.href = item.doubanLink;
            doubanLink.style.display = 'inline';
        } else {
            doubanLink.style.display = 'none';
        }
        detailEditBtn.dataset.itemId = item.id;
        detailEditBtn.dataset.itemCategory = item.category;
        detailDeleteBtn.dataset.itemId = item.id;
        detailDeleteBtn.dataset.itemCategory = item.category;
        detailsModal.style.display = 'flex';
    }

    /**
     * @description 【已修改】处理表单提交 (添加提示和刷新)
     */
    async function handleFormSubmit(e) {
        e.preventDefault();
        const itemData = {
            disk: document.getElementById('disk').value,
            title: document.getElementById('title').value,
            year: parseInt(document.getElementById('year').value) || null,
            doubanLink: document.getElementById('doubanLink').value,
            resolution: document.getElementById('resolution').value || 'NA',
            format: document.getElementById('format').value || 'NA',
            audio_dts: 'NA',
            audio_dd: 'NA',
            rating: document.getElementById('rating').value || 'NA',
            imdb: parseFloat(document.getElementById('imdb').value) || null,
            notes: document.getElementById('notes').value,
        };
        const categoryValue = document.getElementById('category').value;
        let collectionName = (categoryValue === 'documentary') ? 'documentaries' : `${categoryValue}s`;

        try {
            if (currentEditingItem) {
                // 更新
                const itemRef = doc(db, collectionName, currentEditingItem.id);
                await updateDoc(itemRef, itemData);
            } else {
                // 添加
                await addDoc(collection(db, collectionName), itemData);
            }

            // 【新】成功提示并刷新
            alert("操作成功！");
            location.reload();
            // 注意：我们不再需要手动更新 fullDatabase，因为页面将刷新并从 Firebase 重新获取所有数据。

        } catch (error) {
            console.error("❌ 保存到 Firebase 失败: ", error);
            alert("保存失败，请检查控制台。");
        }
    }

    /**
     * @description 【新】处理删除逻辑
     */
    async function handleDelete(item) {
        if (!item) return;

        if (confirm(`你确定要删除这部影片吗？\n${item.title}`)) {
            try {
                // 从 Firebase 删除
                await deleteDoc(doc(db, item.category, item.id));

                // 【新】成功提示并刷新
                alert("删除成功！");
                location.reload();
                // 同样, 不再需要手动更新 fullDatabase

            } catch (error) {
                console.error("❌ 删除失败:", error);
                alert("删除失败，请检查控制台。");
            }
        }
    }

    /**
     * @description 【新】触发鉴权流程
     */
    function triggerAuthFlow() {
        if (checkAuthSession()) {
            executePendingAction(); // 30分钟内, 直接执行
        } else {
            // 需要输密码
            passwordModal.style.display = 'flex';
            passwordInput.focus();
            passwordError.style.display = 'none';
        }
    }

    /**
     * @description 【新】执行待定操作
     */
    function executePendingAction() {
        if (!pendingAction) return;

        const { type, item } = pendingAction;

        if (type === 'add') {
            openAddModal(null);
        }
        else if (type === 'edit' && item) {
            openAddModal(item);
        }
        else if (type === 'delete' && item) {
            handleDelete(item);
        }

        pendingAction = null; // 重置
    }

    /**
     * @description 关闭添加/编辑模态框 (与 v11 相同)
     */
    function closeAddModal() {
        addModal.style.display = 'none';
        currentEditingItem = null;
    }

    // === 3.4 事件监听器 (已重构) ===

    // 导航栏切换 (无变化)
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentCategory = link.dataset.category;
            currentDisk = 'all';
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            diskFilterButtons.forEach(b => b.classList.remove('active'));
            document.querySelector('.filter-btn[data-disk="all"]').classList.add('active');
            updateDiskFilterVisibility();
            renderContent();
        });
    });

    // 分盘筛选器 (无变化)
    diskFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentDisk = button.dataset.disk;
            diskFilterButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            renderContent();
        });
    });

    // 【已修改】点击 "＋ 添加" 按钮
    addMovieBtn.addEventListener('click', () => {
        pendingAction = { type: 'add' }; // 记录意图
        triggerAuthFlow(); // 触发鉴权
    });

    // 【已修改】提交密码
    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (passwordInput.value === ADMIN_PASSWORD) {
            localStorage.setItem('passwordTimestamp', Date.now()); // 存入时间戳
            passwordModal.style.display = 'none';
            passwordInput.value = '';
            executePendingAction(); // 执行待定操作
        } else {
            passwordError.style.display = 'block';
        }
    });

    // 提交 "添加" 或 "更新" 表单 (无变化)
    addForm.addEventListener('submit', handleFormSubmit);

    // 点击网格中的卡片, 打开详情 (无变化)
    movieGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.movie-card');
        if (!card) return;
        const itemId = card.dataset.id;
        const itemCategory = card.dataset.category;
        if (!itemCategory) {
            console.error('卡片缺少 data-category 属性！', card);
            return;
        }
        const item = fullDatabase[itemCategory].find(i => i.id === itemId);
        if (item) {
            showDetailsModal(item);
        }
    });

    // 【已修改】点击详情页的 "编辑" 按钮
    detailEditBtn.addEventListener('click', () => {
        const itemId = detailEditBtn.dataset.itemId;
        const itemCategory = detailEditBtn.dataset.itemCategory;
        const item = fullDatabase[itemCategory].find(i => i.id === itemId);

        if (item) {
            detailsModal.style.display = 'none'; // 先关闭详情
            pendingAction = { type: 'edit', item: item }; // 记录意图
            triggerAuthFlow(); // 触发鉴权
        }
    });

    // 【已修改】点击详情页的 "删除" 按钮
    detailDeleteBtn.addEventListener('click', async () => {
        const itemId = detailDeleteBtn.dataset.itemId;
        const itemCategory = detailDeleteBtn.dataset.itemCategory;
        const item = fullDatabase[itemCategory].find(i => i.id === itemId);

        if (item) {
            detailsModal.style.display = 'none'; // 先关闭详情
            pendingAction = { type: 'delete', item: item }; // 记录意图
            triggerAuthFlow(); // 触发鉴权
        }
    });

    // --- 关闭模态框的按钮 ---
    addModalCloseBtn.addEventListener('click', closeAddModal);
    passwordModalCloseBtn.addEventListener('click', () => passwordModal.style.display = 'none');
    detailsModalCloseBtn.addEventListener('click', () => detailsModal.style.display = 'none');

    passwordModal.addEventListener('click', (e) => {
        if (e.target === passwordModal) passwordModal.style.display = 'none';
    });
    detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) detailsModal.style.display = 'none';
    });
    addModal.addEventListener('click', (e) => {
        if (e.target === addModal) closeAddModal();
    });

    // === 3.5 启动 ===
    if (db) {
        loadDatabase();
    } else {
        console.error("DB 未定义, 无法加载数据库。");
    }

}); // 结束 DOMContentLoaded