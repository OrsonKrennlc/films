// script.js (第4版 - Firebase 云端版)

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {

    // === 0. 获取 Firebase 实例 ===
    // (这些是由 index.html 中的 <script type="module"> 提供的)
    const { db, collection, getDocs, addDoc } = window.firebase;
    if (!db) {
        console.error("Firebase 初始化失败！请检查 index.html 中的配置。");
        return;
    }

    // === 1. DOM 元素选择 ===
    const navLinks = document.querySelectorAll('.nav-link');
    const diskFilterContainer = document.getElementById('disk-filter-container');
    const diskFilterButtons = document.querySelectorAll('.filter-btn');
    const movieGrid = document.getElementById('movie-grid');

    const addMovieBtn = document.getElementById('add-movie-btn');
    const addModal = document.getElementById('add-modal');
    const closeModalBtn = document.getElementById('modal-close-btn');
    const addForm = document.getElementById('add-form');
    const categorySelect = document.getElementById('category');

    // === 2. 状态变量 ===
    let fullDatabase = {}; // { movies: [], documentaries: [], ... }
    let currentCategory = 'movies';
    let currentDisk = 'all';

    // === 3. 核心功能函数 ===

    /**
     * @description 从 Firebase 加载所有数据
     */
    async function loadDatabase() {
        console.log("正在从 Firebase 加载数据...");
        movieGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center;">正在加载...</p>`;

        try {
            const categories = ['movies', 'documentaries', 'tv_shows', 'concerts'];

            // 并行获取所有类别的数据
            const promises = categories.map(category => getDocs(collection(db, category)));
            const results = await Promise.all(promises);

            // 清空本地数据库
            fullDatabase = {};

            results.forEach((snapshot, index) => {
                const categoryName = categories[index];

                // 将 Firebase 文档转换为我们熟悉的数组结构
                fullDatabase[categoryName] = snapshot.docs.map(doc => {
                    return {
                        id: doc.id,     // 这是 Firestore 自动生成的 ID
                        ...doc.data() // 这是文档中的所有数据
                    };
                });
            });

            console.log("✅ 数据库加载成功:", fullDatabase);

            // 首次加载，渲染默认内容 (电影)
            renderContent();
            updateDiskFilterVisibility();

        } catch (error) {
            console.error("❌ 加载 Firestore 数据失败:", error);
            movieGrid.innerHTML = `<p style="color: red; grid-column: 1 / -1;">加载数据失败。请检查 Firebase 配置和安全规则。</p>`;
        }
    }

    /**
     * @description 渲染内容 (此函数无需更改！)
     * (唯一的区别是 item.id 现在是 Firebase ID)
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
            let posterElement = '';
            if (item.posterLink && item.posterLink.trim() !== '') {
                posterElement = `<img src="${item.posterLink}" alt="${item.title}" class="card-poster is-image">`;
            } else {
                posterElement = `<div class="card-poster"></div>`;
            }

            const metaParts = [
                item.year || null,
                item.rating !== 'NA' ? item.rating : null,
                item.imdb ? `${item.imdb} IMDb` : null
            ].filter(Boolean);

            const cardHTML = `
                <div class="movie-card" data-id="${item.id}">
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
        if (currentCategory === 'movies') {
            diskFilterContainer.style.display = 'flex';
        } else {
            diskFilterContainer.style.display = 'none';
        }
    }

    /**
     * @description 处理表单提交 (已更新为写入 Firebase)
     */
    async function handleFormSubmit(e) {
        e.preventDefault();

        // 1. 从表单收集数据
        const newItem = {
            // (我们不再需要 'id' 或 'category',
            // 'id' 由 Firebase 生成, 'category' 由集合名称决定)
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
            posterLink: document.getElementById('posterLink').value
        };

        // ... 在 handleFormSubmit 函数内部 ...

        // 2. 决定要写入哪个 "Collection"
        const categoryValue = document.getElementById('category').value; // e.g., 'documentary'

        // --- 修正开始 ---
        let collectionName = '';
        if (categoryValue === 'documentary') {
            collectionName = 'documentaries'; // 正确处理 'documentary' 的复数
        } else {
            collectionName = `${categoryValue}s`; // 'movie' -> 'movies', 'tv_show' -> 'tv_shows'
        }
        // --- 修正结束 ---

        try {
            // 3. 将新文档添加到 Firebase
            const docRef = await addDoc(collection(db, collectionName), newItem);
            // ...

            console.log("✅ 新影片已添加, ID: ", docRef.id);

            // 4. (优化) 将新项目添加到本地内存, 避免重新加载
            const itemWithId = { id: docRef.id, ...newItem };
            if (!fullDatabase[collectionName]) {
                fullDatabase[collectionName] = [];
            }
            fullDatabase[collectionName].push(itemWithId);

            // 5. 检查当前视图是否需要刷新
            if (collectionName === currentCategory) {
                renderContent(); // 重新渲染当前视图
            }

            // 6. 关闭模态框
            addModal.style.display = 'none';

        } catch (error) {
            console.error("❌ 添加文档失败: ", error);
            alert("保存失败，请检查网络连接或控制台报错。");
        }
    }

    // === 4. 事件监听器 (无需更改) ===

    // 导航栏切换
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

    // 分盘筛选器
    diskFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentDisk = button.dataset.disk;
            diskFilterButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            renderContent();
        });
    });

    // --- 模态框 (Modal) 控制 ---
    addMovieBtn.addEventListener('click', () => {
        addForm.reset();
        categorySelect.value = currentCategory.slice(0, -1);
        addModal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
        addModal.style.display = 'none';
    });

    addModal.addEventListener('click', (e) => {
        if (e.target === addModal) {
            addModal.style.display = 'none';
        }
    });

    // 激活表单提交事件
    addForm.addEventListener('submit', handleFormSubmit);

    // === 5. 启动 ===
    loadDatabase(); // 启动时从 Firebase 加载数据

});