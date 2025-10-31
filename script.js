// script.js (第3版 - 最终完整版)

document.addEventListener('DOMContentLoaded', () => {

    // === 1. DOM 元素选择 ===
    const navLinks = document.querySelectorAll('.nav-link');
    const diskFilterContainer = document.getElementById('disk-filter-container');
    const diskFilterButtons = document.querySelectorAll('.filter-btn');
    const movieGrid = document.getElementById('movie-grid');

    // 模态框 (Modal) 元素
    const addMovieBtn = document.getElementById('add-movie-btn');
    const addModal = document.getElementById('add-modal');
    const closeModalBtn = document.getElementById('modal-close-btn');
    const addForm = document.getElementById('add-form');
    const categorySelect = document.getElementById('category');

    // === 2. 状态变量 ===
    let fullDatabase = {};
    let currentCategory = 'movies';
    let currentDisk = 'all';

    // === 3. 核心功能函数 ===

    /**
     * @description 加载 database.json 文件
     */
    async function loadDatabase() {
        try {
            // 添加一个时间戳 "cache buster" 来防止浏览器缓存
            const response = await fetch(`database.json?t=${new Date().getTime()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            fullDatabase = await response.json();
            console.log("✅ 数据库加载成功:", fullDatabase);

            renderContent();
            updateDiskFilterVisibility();

        } catch (error) {
            console.error("❌ 加载 database.json 失败:", error);
            movieGrid.innerHTML = `<p style="color: red; grid-column: 1 / -1;">加载数据失败。请确保 database.json 文件在同一目录下，并且你正在使用 http-server 运行。</p>`;
        }
    }

    /**
     * @description 根据当前状态 (currentCategory, currentDisk) 渲染内容
     */
    function renderContent() {
        movieGrid.innerHTML = '';

        const items = fullDatabase[currentCategory] || [];
        if (!items) return;

        const itemsToRender = items
            .filter(item => (currentDisk === 'all' || item.disk === currentDisk))
            .sort((a, b) => (b.year || 0) - (a.year || 0)); // 按年份降序排序

        if (itemsToRender.length === 0) {
            movieGrid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center; margin-top: 40px;">这个分类下没有影片。</p>`;
            return;
        }

        itemsToRender.forEach(item => {

            // *** 海报逻辑更新 ***
            let posterElement = '';
            // 检查是否有 posterLink 并且它不是一个空字符串
            if (item.posterLink && item.posterLink.trim() !== '') {
                // 如果有链接, 使用 <img> 标签
                posterElement = `<img src="${item.posterLink}" alt="${item.title}" class="card-poster is-image">`;
            } else {
                // 否则, 使用 <div> 占位符
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
     * @description 更新分盘筛选器的可见性
     */
    function updateDiskFilterVisibility() {
        if (currentCategory === 'movies') {
            diskFilterContainer.style.display = 'flex';
        } else {
            diskFilterContainer.style.display = 'none';
        }
    }

    /**
     * @description 处理表单提交
     */
    function handleFormSubmit(e) {
        e.preventDefault(); // 阻止表单默认提交

        // 1. 从表单收集数据
        const formData = new FormData(addForm);
        const newItem = {
            // 我们用时间戳生成一个简单的唯一 ID
            id: 'new-' + Date.now(),

            // 从表单的 input id 中获取值
            category: document.getElementById('category').value,
            disk: document.getElementById('disk').value,
            title: document.getElementById('title').value,
            year: parseInt(document.getElementById('year').value) || null,
            doubanLink: document.getElementById('doubanLink').value,
            resolution: document.getElementById('resolution').value || 'NA',
            format: document.getElementById('format').value || 'NA',
            audio_dts: 'NA', // (我们简化了表单, 暂不添加)
            audio_dd: 'NA',  // (我们简化了表单, 暂不添加)
            rating: document.getElementById('rating').value || 'NA',
            imdb: parseFloat(document.getElementById('imdb').value) || null,
            notes: document.getElementById('notes').value,

            // *** 新增海报链接 ***
            posterLink: document.getElementById('posterLink').value
        };

        // 2. 将新项目添加到内存中的数据库
        // (注意: 'movie' -> 'movies')
        const categoryArrayName = `${newItem.category}s`;
        if (fullDatabase[categoryArrayName]) {
            fullDatabase[categoryArrayName].push(newItem);
        } else {
            // 如果这个类别不存在 (虽然不太可能), 创建它
            fullDatabase[categoryArrayName] = [newItem];
        }

        // 3. 检查当前视图是否需要刷新
        // (如果用户在 'movies' 视图下添加了 'tv_show', 不需要刷新)
        if (categoryArrayName === currentCategory) {
            renderContent();
        }

        // 4. 关闭模态框
        addModal.style.display = 'none';

        console.log("✅ 新影片已添加:", newItem);
    }

    // === 4. 事件监听器 ===

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

    // *** 激活表单提交事件 ***
    addForm.addEventListener('submit', handleFormSubmit);


    // === 5. 启动 ===
    loadDatabase();

});