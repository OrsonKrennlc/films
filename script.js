// script.js (第5版 - 完整CMS版)

document.addEventListener('DOMContentLoaded', () => {

    // === 0. 获取 Firebase 实例 ===
    const { db, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } = window.firebase;
    if (!db) {
        console.error("Firebase 初始化失败！请检查 index.html 中的配置。");
        return;
    }

    // === 1. DOM 元素选择 ===
    // 导航
    const navLinks = document.querySelectorAll('.nav-link');
    const diskFilterContainer = document.getElementById('disk-filter-container');
    const diskFilterButtons = document.querySelectorAll('.filter-btn');
    const movieGrid = document.getElementById('movie-grid');

    // 添加模态框
    const addMovieBtn = document.getElementById('add-movie-btn');
    const addModal = document.getElementById('add-modal');
    const addModalCloseBtn = document.getElementById('add-modal-close-btn');
    const addForm = document.getElementById('add-form');
    const addFormTitle = document.getElementById('add-form-title');
    const addFormSubmitBtn = document.getElementById('add-form-submit-btn');
    const categorySelect = document.getElementById('category');

    // 【新】密码模态框
    const passwordModal = document.getElementById('password-modal');
    const passwordModalCloseBtn = document.getElementById('password-modal-close-btn');
    const passwordForm = document.getElementById('password-form');
    const passwordInput = document.getElementById('password-input');
    const passwordError = document.getElementById('password-error');
    const ADMIN_PASSWORD = '615243'; // 【新】你的密码

    // 【新】详情模态框
    const detailsModal = document.getElementById('details-modal');
    const detailsModalCloseBtn = document.getElementById('details-modal-close-btn');
    const detailEditBtn = document.getElementById('detail-edit-btn');
    const detailDeleteBtn = document.getElementById('detail-delete-btn');


    // === 2. 状态变量 ===
    let fullDatabase = {};
    let currentCategory = 'movies';
    let currentDisk = 'all';
    let currentEditingItem = null; // 【新】用于跟踪正在编辑的项目

    // === 3. 核心功能函数 ===

    /**
     * @description 从 Firebase 加载所有数据 (无需更改)
     */
    async function loadDatabase() {
        // ... (此函数与第4版完全相同)
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
                    return { id: doc.id, ...doc.data() };
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
     * @description 渲染内容 (无需更改)
     */
    function renderContent() {
        // ... (此函数与第4版完全相同, 按年份排序)
        movieGrid.innerHTML = '';
        const items = fullDatabase[currentCategory] || [];
        if (!items) return;

        const itemsToRender = items
            .filter(item => (currentDisk === 'all' || item.disk === currentDisk))
            .sort((a, b) => (b.year || 0) - (a.year || 0));

        if (itemsToRender.length === 0) {
            movieGrid.innerHTML = `<p style="color: var(--text-secondary); ...">这个分类下没有影片。</p>`;
            return;
        }

        itemsToRender.forEach(item => {
            let posterElement = (item.posterLink && item.posterLink.trim() !== '')
                ? `<img src="${item.posterLink}" alt="${item.title}" class="card-poster is-image">`
                : `<div class="card-poster"></div>`;

            const metaParts = [
                item.year || null,
                item.rating !== 'NA' ? item.rating : null,
                item.imdb ? `${item.imdb} IMDb` : null
            ].filter(Boolean);

            const cardHTML = `
                <div class="movie-card" data-id="${item.id}" data-category="${currentCategory}">
                    ${posterElement}
                    <div class="card-info">
                        <h3 class="card-title" title="${item.title}">${item.title}</h3>
                        <p class="card-meta">${metaParts.join(' | ') || ' '}</p>
                    </div>
                </div>
            `;
            movieGrid.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    /**
     * @description 更新分盘筛选器的可见性 (无需更改)
     */
    function updateDiskFilterVisibility() {
        // ... (此函数与第4版完全相同)
        if (currentCategory === 'movies') {
            diskFilterContainer.style.display = 'flex';
        } else {
            diskFilterContainer.style.display = 'none';
        }
    }

    /**
     * @description 【新】检查密码会话
     */
    function checkAuthSession() {
        const authTimestamp = localStorage.getItem('passwordTimestamp');
        if (!authTimestamp) {
            return false;
        }
        const thirtyMinutes = 30 * 60 * 1000;
        const isSessionValid = (Date.now() - parseInt(authTimestamp)) < thirtyMinutes;
        return isSessionValid;
    }

    /**
     * @description 【新】打开 "添加/编辑" 模态框
     * @param {object | null} item - 如果是编辑, 传入 item 对象; 如果是添加, 传入 null
     */
    function openAddModal(item = null) {
        addForm.reset();
        currentEditingItem = item; // 跟踪正在编辑的项目

        if (item) {
            // --- 编辑模式 ---
            addFormTitle.textContent = '编辑影片';
            addFormSubmitBtn.textContent = '更新';

            // 预填充表单
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
            document.getElementById('posterLink').value = item.posterLink;

        } else {
            // --- 添加模式 ---
            addFormTitle.textContent = '添加新影片';
            addFormSubmitBtn.textContent = '保存影片';
            // 自动将模态框的类别设置为当前查看的类别
            categorySelect.value = currentCategory.slice(0, -1);
        }

        addModal.style.display = 'flex';
    }


    /**
     * @description 【新】显示详情模态框
     * @param {object} item - 被点击的影片对象
     */
    function showDetailsModal(item) {
        // 填充数据
        document.getElementById('detail-poster').src = item.posterLink || '';
        document.getElementById('detail-title').textContent = item.title || '无标题';

        const metaParts = [
            item.year || null,
            item.imdb ? `${item.imdb} IMDb` : null
        ].filter(Boolean);
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

        // 关键: 将 item 的 id 和 category 存储在按钮上, 以便编辑/删除
        detailEditBtn.dataset.itemId = item.id;
        detailEditBtn.dataset.itemCategory = item.category;
        detailDeleteBtn.dataset.itemId = item.id;
        detailDeleteBtn.dataset.itemCategory = item.category;

        detailsModal.style.display = 'flex';
    }


    /**
     * @description 【大改】处理表单提交 (添加 或 更新)
     */
    async function handleFormSubmit(e) {
        e.preventDefault();

        // 1. 收集数据
        const itemData = {
            disk: document.getElementById('disk').value,
            title: document.getElementById('title').value,
            year: parseInt(document.getElementById('year').value) || null,
            doubanLink: document.getElementById('doubanLink').value,
            resolution: document.getElementById('resolution').value || 'NA',
            format: document.getElementById('format').value || 'NA',
            audio_dts: 'NA', // (简化)
            audio_dd: 'NA',  // (简化)
            rating: document.getElementById('rating').value || 'NA',
            imdb: parseFloat(document.getElementById('imdb').value) || null,
            notes: document.getElementById('notes').value,
            posterLink: document.getElementById('posterLink').value
        };

        const categoryValue = document.getElementById('category').value;
        let collectionName = (categoryValue === 'documentary') ? 'documentaries' : `${categoryValue}s`;

        try {
            if (currentEditingItem) {
                // --- 更新逻辑 ---
                console.log(`正在更新 ID: ${currentEditingItem.id}`);
                const itemRef = doc(db, collectionName, currentEditingItem.id);
                await updateDoc(itemRef, itemData);

                // 更新本地内存
                const index = fullDatabase[collectionName].findIndex(i => i.id === currentEditingItem.id);
                if (index > -1) {
                    fullDatabase[collectionName][index] = { id: currentEditingItem.id, ...itemData, category: collectionName };
                }
                currentEditingItem = null; // 重置编辑状态

            } else {
                // --- 添加逻辑 ---
                console.log("正在添加新影片...");
                const docRef = await addDoc(collection(db, collectionName), itemData);

                // 更新本地内存
                const newItemWithId = { id: docRef.id, ...itemData, category: collectionName };
                if (!fullDatabase[collectionName]) fullDatabase[collectionName] = [];
                fullDatabase[collectionName].push(newItemWithId);
            }

            renderContent(); // 重新渲染
            addModal.style.display = 'none'; // 关闭模态框

        } catch (error) {
            console.error("❌ 保存到 Firebase 失败: ", error);
            alert("保存失败，请检查控制台。");
        }
    }


    // === 4. 事件监听器 ===

    // 导航栏切换 (无需更改)
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // ... (与第4版相同)
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

    // 分盘筛选器 (无需更改)
    diskFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // ... (与第4版相同)
            currentDisk = button.dataset.disk;
            diskFilterButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            renderContent();
        });
    });

    // --- 【新】密码与模态框控制 ---

    // 1. 点击 "＋ 添加" 按钮
    addMovieBtn.addEventListener('click', () => {
        if (checkAuthSession()) {
            // 30分钟内, 直接打开
            openAddModal(null); // 传入 null 表示是 "添加" 模式
        } else {
            // 超过30分钟, 要求输密码
            passwordModal.style.display = 'flex';
            passwordInput.focus();
            passwordError.style.display = 'none';
        }
    });

    // 2. 提交密码
    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (passwordInput.value === ADMIN_PASSWORD) {
            // 密码正确
            localStorage.setItem('passwordTimestamp', Date.now()); // 存入时间戳
            passwordModal.style.display = 'none';
            passwordInput.value = '';
            openAddModal(null); // 打开 "添加" 模态框
        } else {
            // 密码错误
            passwordError.style.display = 'block';
        }
    });

    // 3. 提交 "添加" 或 "更新" 表单
    addForm.addEventListener('submit', handleFormSubmit);

    // 4. 【新】点击网格中的卡片, 打开详情
    movieGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.movie-card');
        if (!card) return; // 没有点在卡片上

        const itemId = card.dataset.id;
        const itemCategory = card.dataset.category;

        // 从本地数据库中找到这个 item
        const item = fullDatabase[itemCategory].find(i => i.id === itemId);

        if (item) {
            // 传入完整的 item 对象 (包含 category, 因为 itemData 里没有)
            showDetailsModal({ ...item, category: itemCategory });
        }
    });

    // 5. 【新】点击详情页的 "编辑" 按钮
    detailEditBtn.addEventListener('click', () => {
        const itemId = detailEditBtn.dataset.itemId;
        const itemCategory = detailEditBtn.dataset.itemCategory;

        const item = fullDatabase[itemCategory].find(i => i.id === itemId);
        if (item) {
            detailsModal.style.display = 'none'; // 关闭详情
            openAddModal({ ...item, category: itemCategory }); // 打开 "编辑" 模态框
        }
    });

    // 6. 【新】点击详情页的 "删除" 按钮
    detailDeleteBtn.addEventListener('click', async () => {
        const itemId = detailDeleteBtn.dataset.itemId;
        const itemCategory = detailDeleteBtn.dataset.itemCategory;

        if (confirm(`你确定要删除这部影片吗？\n(ID: ${itemId})`)) {
            try {
                console.log(`正在删除: ${itemCategory}/${itemId}`);
                // 从 Firebase 删除
                await deleteDoc(doc(db, itemCategory, itemId));

                // 从本地内存删除
                fullDatabase[itemCategory] = fullDatabase[itemCategory].filter(i => i.id !== itemId);

                renderContent(); // 重新渲染
                detailsModal.style.display = 'none'; // 关闭详情

            } catch (error) {
                console.error("❌ 删除失败:", error);
                alert("删除失败，请检查控制台。");
            }
        }
    });

    // --- 关闭模态框的按钮 ---
    addModalCloseBtn.addEventListener('click', () => addModal.style.display = 'none');
    passwordModalCloseBtn.addEventListener('click', () => passwordModal.style.display = 'none');
    detailsModalCloseBtn.addEventListener('click', () => detailsModal.style.display = 'none');

    // 点击灰色背景关闭
    [addModal, passwordModal, detailsModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    });

    // === 5. 启动 ===
    loadDatabase();

});