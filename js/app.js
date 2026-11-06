// Application Logic for Jerry Shen's Film Library

// State Management
const state = {
    filters: {
        category: 'all',
        disk: 'all',
        rating: 'all',
        sort: 'year-desc',
        search: '',
        decade: 'all',
        imdbRange: 'all'
    },
    viewMode: 'grid', // 'grid' or 'list'
    filteredData: [],
    stats: {
        total: 0,
        averageImdb: 0,
        categoryCounts: {},
        ratingCounts: {},
        decadeCounts: {}
    }
};

// Rating Descriptions Mapping
const ratingDescriptions = {
    'G': '大众级 (General Audiences) — 适合所有年龄段。影片内容对父母而言均可接受，无性爱、裸体场面，极少暴力与吸毒镜头。',
    'PG': '普通辅导级 (Parental Guidance Suggested) — 建议在父母陪伴下观看。某些镜头可能不适合儿童，可能有轻微不适感，但无持续暴力或吸毒镜头。',
    'PG-13': '特别辅导级 (Parents Strongly Cautioned) — 13岁以下儿童需由父母陪同并进行指导。影片可能包含吸毒镜头、较粗俗语言或适度暴力。',
    'R': '限制级 (Restricted) — 17岁以下必须由父母或监护人陪伴。包含成人内容，内有较多暴力、吸毒、脏话及性爱场面。',
    'NC-17': '限制未成年 (No One 17 and Under Admitted) — 17岁及以下禁止观看。属于完全成人级影片，包含清晰的性爱、大量吸毒或暴力镜头。',
    'TV-MA': '成人电视节目 (Mature Audience Only) — 专为成年人设计，不适合17岁以下未成年人。可能包含强烈的暴力、粗俗语言或明确的性爱内容。',
    'TV-14': '家长电视指导 (Parents Strongly Cautioned) — 针对14岁以下观众，建议家长严加监督。可能含有强烈的性暗示、粗俗语言或暴力。',
    'UR': '未评级 (Unrated) — 影片没有提交给官方机构评级，或属于导演剪辑版等非公映版本。可能包含限制级内容。',
    'TV-PG': '家长电视辅导 (Parental Guidance Suggested) — 建议在家长陪同下观看，可能包含适度脏话、性暗示或暴力。'
};

// SVG Generative Poster Patterns
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

function generatePosterSvg(title, rating) {
    const hash = hashCode(title);
    
    // Aesthetic muted palettes (matching portfolio styling)
    const palettes = [
        { primary: '#02542D', secondary: '#1A3326', accent: '#48A977' }, // Deep forest green
        { primary: '#2D3142', secondary: '#1F222E', accent: '#7C859B' }, // Midnight blue/grey
        { primary: '#4F1A25', secondary: '#331018', accent: '#A84455' }, // Crimson/maroon
        { primary: '#593F30', secondary: '#38281E', accent: '#B89B88' }, // Warm sand/earth
        { primary: '#284B63', secondary: '#1D3545', accent: '#5E93B5' }, // Steel blue
        { primary: '#3D348B', secondary: '#241F53', accent: '#867DBE' }, // Deep purple
        { primary: '#0F1A1C', secondary: '#060B0C', accent: '#3A5A60' }  // Dark slate
    ];
    
    const palette = palettes[hash % palettes.length];
    
    // Choose geometric background style
    const styleIndex = hash % 4;
    let svgContent = '';
    
    if (styleIndex === 0) {
        // Overlapping circles with blur-like opacities
        const cx1 = 20 + (hash % 60);
        const cy1 = 20 + ((hash >> 2) % 60);
        const r1 = 40 + (hash % 80);
        const cx2 = 40 + ((hash >> 4) % 60);
        const cy2 = 60 + ((hash >> 6) % 40);
        const r2 = 30 + (hash % 60);
        svgContent = `
            <circle cx="${cx1}%" cy="${cy1}%" r="${r1}" fill="${palette.accent}" opacity="0.25" />
            <circle cx="${cx2}%" cy="${cy2}%" r="${r2}" fill="${palette.primary}" opacity="0.4" />
            <circle cx="${100 - cx1}%" cy="${100 - cy1}%" r="${r1 * 0.7}" fill="${palette.secondary}" opacity="0.3" />
        `;
    } else if (styleIndex === 1) {
        // Diagonal layered polygon panels
        const offset = 10 + (hash % 40);
        svgContent = `
            <polygon points="0,0 100,0 ${100 - offset},100 0,100" fill="${palette.secondary}" opacity="0.5" />
            <polygon points="100,0 100,100 ${offset},100" fill="${palette.accent}" opacity="0.15" />
            <line x1="0" y1="${offset}%" x2="100" y2="${100 - offset}%" stroke="${palette.accent}" stroke-width="1.5" opacity="0.3" />
        `;
    } else if (styleIndex === 2) {
        // Wave/Sine path structures
        const waveAmp = 10 + (hash % 30);
        const waveFreq = 2 + (hash % 3);
        let path1 = `M 0 120 `;
        let path2 = `M 0 150 `;
        for(let x = 0; x <= 300; x += 10) {
            const y1 = 120 + Math.sin(x * 0.05 * waveFreq + hash) * waveAmp;
            const y2 = 150 + Math.sin(x * 0.04 * waveFreq + hash + 1) * (waveAmp * 0.8);
            path1 += `L ${x} ${y1} `;
            path2 += `L ${x} ${y2} `;
        }
        path1 += `L 300 400 L 0 400 Z`;
        path2 += `L 300 400 L 0 400 Z`;
        svgContent = `
            <path d="${path1}" fill="${palette.primary}" opacity="0.4" />
            <path d="${path2}" fill="${palette.accent}" opacity="0.25" />
        `;
    } else {
        // Grid lines with minimalist box highlights
        const lineCount = 4 + (hash % 5);
        let lines = '';
        for (let i = 1; i <= lineCount; i++) {
            const pos = (100 / (lineCount + 1)) * i;
            lines += `<line x1="${pos}%" y1="0" x2="${pos}%" y2="100%" stroke="${palette.accent}" stroke-width="1" opacity="0.1" />`;
            lines += `<line x1="0" y1="${pos}%" x2="100%" y2="${pos}%" stroke="${palette.accent}" stroke-width="1" opacity="0.1" />`;
        }
        const boxX = 20 + (hash % 50);
        const boxY = 20 + ((hash >> 2) % 50);
        const boxW = 30 + (hash % 40);
        const boxH = 40 + (hash % 60);
        svgContent = `
            ${lines}
            <rect x="${boxX}%" y="${boxY}%" width="${boxW}%" height="${boxH}%" rx="8" fill="none" stroke="${palette.accent}" stroke-width="2" opacity="0.25" />
            <rect x="${boxX + 5}%" y="${boxY + 5}%" width="${boxW}%" height="${boxH}%" rx="8" fill="${palette.primary}" opacity="0.3" />
        `;
    }
    
    // Base SVG wrapper with radial background gradient
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
            <defs>
                <radialGradient id="grad-${hash}" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stop-color="${palette.primary}" />
                    <stop offset="100%" stop-color="${palette.secondary}" />
                </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad-${hash})" />
            ${svgContent}
            <!-- Subtitle/Accent -->
            <text x="20" y="380" font-family="'Anonymous Pro', monospace" font-size="12" fill="${palette.accent}" opacity="0.7">${rating || '未评级'}</text>
            <text x="280" y="380" font-family="'Anonymous Pro', monospace" font-size="12" fill="${palette.accent}" opacity="0.7" text-anchor="end">${hash % 100}A</text>
        </svg>
    `;
    
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Process all stats & filter lists
    calculateStats();
    renderStats();
    buildFilterSelectors();
    bindEvents();
    
    // Initial Render
    applyFilters();
});

// Calculate metrics from the raw FILMS_DATA
function calculateStats() {
    state.stats.total = FILMS_DATA.length;
    
    let imdbSum = 0;
    let imdbCount = 0;
    
    state.stats.categoryCounts = {};
    state.stats.diskCounts = {};
    state.stats.ratingCounts = {};
    state.stats.decadeCounts = {
        '1940s-1970s': 0,
        '1980s': 0,
        '1990s': 0,
        '2000s': 0,
        '2010s': 0,
        '2020s': 0
    };
    
    FILMS_DATA.forEach(film => {
        // Category counts
        let cat = film.category;
        state.stats.categoryCounts[cat] = (state.stats.categoryCounts[cat] || 0) + 1;
        
        // Location (disk) count tracking
        if (film.disk) {
            const disks = film.disk.split(/[,，/ ]+/).map(d => d.trim()).filter(Boolean);
            disks.forEach(d => {
                state.stats.diskCounts[d] = (state.stats.diskCounts[d] || 0) + 1;
            });
        }
        
        // IMDb average
        if (film.imdb && !isNaN(parseFloat(film.imdb))) {
            imdbSum += parseFloat(film.imdb);
            imdbCount++;
        }
        
        // Rating counts
        let rating = film.rating || 'UR';
        state.stats.ratingCounts[rating] = (state.stats.ratingCounts[rating] || 0) + 1;
        
        // Decade calculations
        if (film.year) {
            let year = parseInt(film.year.split('-')[0]); // handle ranges like 2018-2019
            if (!isNaN(year)) {
                if (year < 1980) state.stats.decadeCounts['1940s-1970s']++;
                else if (year >= 1980 && year < 1990) state.stats.decadeCounts['1980s']++;
                else if (year >= 1990 && year < 2000) state.stats.decadeCounts['1990s']++;
                else if (year >= 2000 && year < 2010) state.stats.decadeCounts['2000s']++;
                else if (year >= 2010 && year < 2020) state.stats.decadeCounts['2010s']++;
                else if (year >= 2020) state.stats.decadeCounts['2020s']++;
            }
        }
    });
    
    state.stats.averageImdb = imdbCount > 0 ? (imdbSum / imdbCount).toFixed(2) : 0;
}

// Write high-level statistics into the simple stats bar above search
function renderStats() {
    const statsBar = document.getElementById('simple-stats-bar');
    if (!statsBar) return;
    
    const total = state.stats.total;
    const movies = state.stats.categoryCounts['电影'] || 0;
    const series = state.stats.categoryCounts['电视剧'] || 0;
    const docs = state.stats.categoryCounts['纪录片'] || 0;
    const concerts = state.stats.categoryCounts['演唱会'] || 0;
    const avgImdb = state.stats.averageImdb;

    statsBar.innerHTML = `
        <a href="https://orsonkrennlc.github.io/index.html#home" class="stats-author" title="Jerry Shen 个人主页">Jerry Shen</a>
        <span class="stats-sep">/</span>
        <span class="stats-item">共收录 <strong class="stats-num">${total}</strong> 部作品</span>
        <span class="stats-sep">·</span>
        <span class="stats-item">电影 <strong class="stats-num">${movies}</strong></span>
        <span class="stats-sep">·</span>
        <span class="stats-item">电视剧 <strong class="stats-num">${series}</strong></span>
        <span class="stats-sep">·</span>
        <span class="stats-item">纪录片 <strong class="stats-num">${docs}</strong></span>
        <span class="stats-sep">·</span>
        <span class="stats-item">演唱会 <strong class="stats-num">${concerts}</strong></span>
        <span class="stats-sep">·</span>
        <span class="stats-item">平均 IMDb <strong class="stats-num">${avgImdb}</strong></span>
    `;
}

// Generate the pills for filter selections
function buildFilterSelectors() {
    // Collect ratings sorted by count descending
    const ratingGroup = document.getElementById('filter-rating-group');
    ratingGroup.innerHTML = '<span class="pill active" data-rating="all">全部</span>';
    
    const sortedRatings = Object.keys(state.stats.ratingCounts).sort((a,b) => state.stats.ratingCounts[b] - state.stats.ratingCounts[a]);
    sortedRatings.forEach(rating => {
        if (rating !== '') {
            ratingGroup.innerHTML += `<span class="pill" data-rating="${rating}">${rating} (${state.stats.ratingCounts[rating]})</span>`;
        }
    });

    // Location pills
    const locationGroup = document.getElementById('filter-location-group');
    if (locationGroup) {
        locationGroup.innerHTML = '<span class="pill active" data-disk="all">全部位置</span>';
        const diskOrder = { 'disk1': 1, 'disk2': 2, 'disk3': 3, '阿里云盘': 4 };
        const sortedDisks = Object.keys(state.stats.diskCounts).sort((a, b) => {
            const ordA = diskOrder[a] || 99;
            const ordB = diskOrder[b] || 99;
            if (ordA !== ordB) return ordA - ordB;
            return a.localeCompare(b);
        });
        sortedDisks.forEach(disk => {
            const count = state.stats.diskCounts[disk] || 0;
            locationGroup.innerHTML += `<span class="pill" data-disk="${disk}">${disk} (${count}部)</span>`;
        });
    }
}

// Bind clicks & search keyups
function bindEvents() {
    // Tab filtering (Category)
    document.querySelectorAll('#filter-category-group .pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            document.querySelectorAll('#filter-category-group .pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            
            const cat = pill.getAttribute('data-category');
            state.filters.category = cat;
            
            // Reset decade filter if changed category
            state.filters.decade = 'all';
            updateDecadePillHighlights();
            
            applyFilters();
        });
    });

    // Location filtering
    const locationGroup = document.getElementById('filter-location-group');
    if (locationGroup) {
        locationGroup.addEventListener('click', (e) => {
            const pill = e.target.closest('.pill');
            if (!pill) return;
            
            document.querySelectorAll('#filter-location-group .pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            
            state.filters.disk = pill.getAttribute('data-disk');
            applyFilters();
        });
    }

    // Rating filtering
    document.getElementById('filter-rating-group').addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        
        document.querySelectorAll('#filter-rating-group .pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        state.filters.rating = pill.getAttribute('data-rating');
        applyFilters();
    });

    // Sort select
    document.getElementById('sort-select').addEventListener('change', (e) => {
        state.filters.sort = e.target.value;
        applyFilters();
    });

    // Search bar
    const searchInput = document.getElementById('search-bar');
    searchInput.addEventListener('input', (e) => {
        state.filters.search = e.target.value.toLowerCase().trim();
        applyFilters();
    });

    // View toggle (Grid vs List)
    document.getElementById('btn-view-grid').addEventListener('click', () => {
        document.getElementById('btn-view-grid').classList.add('active');
        document.getElementById('btn-view-list').classList.remove('active');
        state.viewMode = 'grid';
        renderFilms();
    });
    document.getElementById('btn-view-list').addEventListener('click', () => {
        document.getElementById('btn-view-list').classList.add('active');
        document.getElementById('btn-view-grid').classList.remove('active');
        state.viewMode = 'list';
        renderFilms();
    });

    // Collapsible Filters Toggle
    const filterToggleBtn = document.getElementById('btn-toggle-filters');
    const collapsibleFilters = document.getElementById('collapsible-filters');
    const filterToggleText = document.getElementById('filter-toggle-text');

    if (filterToggleBtn && collapsibleFilters) {
        filterToggleBtn.addEventListener('click', () => {
            const isCollapsed = collapsibleFilters.classList.toggle('collapsed');
            filterToggleBtn.classList.toggle('active', !isCollapsed);
            filterToggleBtn.setAttribute('aria-expanded', !isCollapsed);
            if (filterToggleText) {
                filterToggleText.textContent = isCollapsed ? '筛选' : '收起';
            }
        });
    }

    // Modal Close Button & Backdrop click
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('lucky-modal-close').addEventListener('click', closeLuckyModal);
    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
                closeLuckyModal();
            }
        });
    });

    // Floating action button - Liquid Glass Gacha
    document.getElementById('fab-lucky').addEventListener('click', openLuckyModal);
    document.getElementById('lucky-start-btn').addEventListener('click', handleGachaButtonClick);
    document.getElementById('winner-detail-btn').addEventListener('click', () => {
        if (!gachaWinnerFilm) return;
        closeLuckyModal();
        openDetailModal(gachaWinnerFilm);
    });
    document.getElementById('winner-retry-btn').addEventListener('click', () => {
        resetGachaStage();
        startGachaSpinning();
    });
    document.getElementById('gacha-reel-viewport').addEventListener('click', () => {
        if (gachaState === 'spinning') {
            stopGachaSpinning();
        }
    });
    document.querySelectorAll('#gacha-pool-selector .pool-chip').forEach(chip => {
        chip.addEventListener('click', () => handlePoolChipClick(chip));
    });
}

// Filter datasets and sort accordingly
function applyFilters() {
    let results = FILMS_DATA;
    
    // 1. Category filter
    if (state.filters.category !== 'all') {
        results = results.filter(film => film.category === state.filters.category);
    }
    
    // 2. Location filter
    if (state.filters.disk !== 'all') {
        results = results.filter(film => {
            if (!film.disk) return false;
            const disks = film.disk.split(/[,，/ ]+/).map(d => d.trim());
            return disks.includes(state.filters.disk);
        });
    }
    
    // 3. Rating filter
    if (state.filters.rating !== 'all') {
        results = results.filter(film => (film.rating || 'UR') === state.filters.rating);
    }
    
    // 4. Decade filter (interactive charts trigger this)
    if (state.filters.decade !== 'all') {
        results = results.filter(film => {
            if (!film.year) return false;
            const year = parseInt(film.year.split('-')[0]);
            if (isNaN(year)) return false;
            
            if (state.filters.decade === '1940s-1970s') return year < 1980;
            if (state.filters.decade === '1980s') return year >= 1980 && year < 1990;
            if (state.filters.decade === '1990s') return year >= 1990 && year < 2000;
            if (state.filters.decade === '2000s') return year >= 2000 && year < 2010;
            if (state.filters.decade === '2010s') return year >= 2010 && year < 2020;
            if (state.filters.decade === '2020s') return year >= 2020;
            return true;
        });
    }
    
    // 5. Text search filter
    if (state.filters.search !== '') {
        const query = state.filters.search;
        results = results.filter(film => 
            film.title.toLowerCase().includes(query) ||
            film.year.toLowerCase().includes(query) ||
            film.rating.toLowerCase().includes(query) ||
            film.why.toLowerCase().includes(query)
        );
    }
    
    // 6. Sorting logic
    results.sort((a, b) => {
        if (state.filters.sort === 'year-desc') {
            return b.year.localeCompare(a.year);
        } else if (state.filters.sort === 'year-asc') {
            return a.year.localeCompare(b.year);
        } else if (state.filters.sort === 'douban-desc') {
            const scoreA = parseFloat(a.douban) || 0;
            const scoreB = parseFloat(b.douban) || 0;
            return scoreB - scoreA;
        } else if (state.filters.sort === 'rt-desc') {
            const scoreA = parseFloat(a.rotten_tomatoes) || 0;
            const scoreB = parseFloat(b.rotten_tomatoes) || 0;
            return scoreB - scoreA;
        } else if (state.filters.sort === 'imdb-desc') {
            const scoreA = parseFloat(a.imdb) || 0;
            const scoreB = parseFloat(b.imdb) || 0;
            return scoreB - scoreA;
        } else if (state.filters.sort === 'imdb-asc') {
            const scoreA = parseFloat(a.imdb) || 0;
            const scoreB = parseFloat(b.imdb) || 0;
            return scoreA - scoreB;
        } else if (state.filters.sort === 'title') {
            return a.title.localeCompare(b.title, 'zh');
        }
        return 0;
    });
    
    state.filteredData = results;
    
    // Update count display
    const countEl = document.getElementById('filtered-count');
    if (countEl) countEl.innerText = results.length;

    // Toggle indicator on filter button if filters are customized
    const filterToggleBtn = document.getElementById('btn-toggle-filters');
    if (filterToggleBtn) {
        const hasActiveFilter = state.filters.category !== 'all' || 
                                state.filters.disk !== 'all' || 
                                state.filters.rating !== 'all';
        filterToggleBtn.classList.toggle('has-filter', hasActiveFilter);
    }
    
    renderFilms();
}

function updateDecadePillHighlights() {
    const subTitle = document.querySelector('.glitch-subtitle');
    if (!subTitle) return;
    if (state.filters.decade !== 'all') {
        subTitle.innerHTML = `已选择年代: ${state.filters.decade}`;
        subTitle.style.color = '#48a977';
    }
}

// Render dynamic elements to the page
function renderFilms() {
    const container = document.getElementById('films-container');
    container.innerHTML = '';
    
    if (state.filteredData.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 100px 0; color: #888; font-family: var(--font-zh);">
                <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom:15px; opacity:0.5;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                </svg>
                <p style="font-size: 16px;">没有找到符合筛选条件的影片</p>
            </div>
        `;
        return;
    }
    
    if (state.viewMode === 'grid') {
        container.className = 'films-grid';
        state.filteredData.forEach((film, index) => {
            const card = document.createElement('article');
            card.className = 'film-card';
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            const ratingClass = getRatingClass(film.rating);
            const fallbackSrc = generatePosterSvg(film.title, film.rating);
            const hasRealPoster = film.poster && film.poster !== "";
            const imageSrc = hasRealPoster ? film.poster : fallbackSrc;
            
            // Build poster title based on length
            let verticalTitle = film.title;
            if (film.title.length > 8) {
                verticalTitle = film.title.substring(0, 7) + '...';
            }
            
            card.innerHTML = `
                <div class="card-poster ${hasRealPoster ? 'has-real-poster' : ''}">
                    <img class="poster-image" src="${imageSrc}" 
                         onerror="this.onerror=null; this.src='${fallbackSrc}'; this.closest('.card-poster').classList.remove('has-real-poster');" 
                         alt="${film.title} Cover">
                    <div class="poster-overlay"></div>
                    <div class="poster-title-vertical">${verticalTitle}</div>
                </div>
                <div class="card-details">
                    <div class="card-title-row">
                        <h3 class="film-title-zh" title="${film.title}">${film.title}</h3>
                        ${film.english_title ? `<p class="film-title-en" title="${film.english_title}">${film.english_title}</p>` : ''}
                    </div>
                    <div class="film-meta-row">
                        <span class="film-year-tag">${film.year} · ${film.category}</span>
                        ${film.rating ? `<span class="film-rating-badge ${ratingClass}">${film.rating}</span>` : ''}
                    </div>
                    <div class="film-score-row" style="margin-top: 10px;">
                        <div class="score-badge-group" title="IMDb 评分">
                            <span class="imdb-logo">IMDb</span>
                            <span class="imdb-val">${film.imdb || '—'}</span>
                        </div>
                        <div class="score-badge-group" title="豆瓣评分">
                            <span class="douban-logo">豆</span>
                            <span class="douban-val">${film.douban || '—'}</span>
                        </div>
                        <div class="score-badge-group" title="烂番茄新鲜度">
                            <span class="rt-logo">🍅</span>
                            <span class="rt-val">${film.rotten_tomatoes ? film.rotten_tomatoes + '%' : '—'}</span>
                        </div>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => openDetailModal(film));
            container.appendChild(card);
            
            // Stagger load transition
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 20); // 20ms stagger
        });
    } else {
        // List/Table view
        container.className = 'films-list-container';
        
        const table = document.createElement('table');
        table.className = 'films-list-view';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>片名</th>
                    <th>年份</th>
                    <th>类别</th>
                    <th>分级</th>
                    <th>豆瓣</th>
                    <th>烂番茄</th>
                    <th>IMDb</th>
                    <th>位置</th>
                </tr>
            </thead>
            <tbody id="list-tbody"></tbody>
        `;
        
        container.appendChild(table);
        const tbody = document.getElementById('list-tbody');
        
        state.filteredData.forEach(film => {
            const tr = document.createElement('tr');
            const ratingClass = getRatingClass(film.rating);
            const fallbackSrc = generatePosterSvg(film.title, film.rating);
            const imageSrc = film.poster && film.poster !== "" ? film.poster : fallbackSrc;
            
            tr.innerHTML = `
                <td>
                    <div class="list-title-cell">
                        <div class="list-mini-poster">
                            <img src="${imageSrc}" onerror="this.onerror=null; this.src='${fallbackSrc}';" style="width:100%; height:100%; object-fit:cover;" alt="">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:2px; max-width: 400px; overflow: hidden;">
                            <span class="list-title-text" style="display:flex; align-items:center;">
                                ${film.title}
                                ${film.link ? `<a href="${film.link}" target="_blank" class="list-link-icon" title="在豆瓣查看">🔗</a>` : ''}
                            </span>
                            ${film.english_title ? `<span style="font-family:var(--font-en); font-size:12px; color:var(--text-gray-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${film.english_title}">${film.english_title}</span>` : ''}
                        </div>
                    </div>
                </td>
                <td class="list-year">${film.year}</td>
                <td><span style="font-family: var(--font-zh); font-size:13px; color:#4a4a4a;">${film.category}</span></td>
                <td>${film.rating ? `<span class="film-rating-badge ${ratingClass}">${film.rating}</span>` : '—'}</td>
                <td class="list-douban">${film.douban ? film.douban : '—'}</td>
                <td class="list-rt">${film.rotten_tomatoes ? film.rotten_tomatoes + '%' : '—'}</td>
                <td class="list-imdb">${film.imdb ? film.imdb : '—'}</td>
                <td><span style="font-family: var(--font-en); font-size:12px; color:#888;">${film.disk || '—'}</span></td>
            `;
            
            tr.addEventListener('click', (e) => {
                // Ignore clicks on links directly
                if (e.target.tagName !== 'A') {
                    openDetailModal(film);
                }
            });
            tbody.appendChild(tr);
        });
    }
}

// Return styling class name for ratings
function getRatingClass(rating) {
    if (!rating) return 'badge-other';
    const r = rating.toUpperCase();
    if (r === 'G') return 'badge-g';
    if (r === 'PG') return 'badge-pg';
    if (r === 'PG-13') return 'badge-pg13';
    if (r === 'R') return 'badge-r';
    if (r === 'NC-17') return 'badge-nc17';
    if (r.startsWith('TV-M')) return 'badge-r';
    return 'badge-other';
}

// Modal handling
function openDetailModal(film) {
    const modal = document.getElementById('detail-modal');
    
    // Modal Left Poster
    const fallbackSrc = generatePosterSvg(film.title, film.rating);
    const posterSrc = film.poster && film.poster !== "" ? film.poster : fallbackSrc;
    const modalPoster = document.getElementById('modal-poster');
    const modalPosterBlur = document.getElementById('modal-poster-blur');
    if (modalPosterBlur) modalPosterBlur.src = posterSrc;
    modalPoster.src = posterSrc;
    modalPoster.onerror = function() {
        this.onerror = null;
        this.src = fallbackSrc;
        if (modalPosterBlur) modalPosterBlur.src = fallbackSrc;
    };
    
    // Modal Right Details
    document.getElementById('modal-title-zh').innerText = film.title;
    const modalTitleEn = document.getElementById('modal-title-en');
    if (film.english_title) {
        modalTitleEn.style.display = 'block';
        modalTitleEn.innerText = film.english_title;
    } else {
        modalTitleEn.style.display = 'none';
    }
    document.getElementById('modal-year').innerText = film.year;
    document.getElementById('modal-category').innerText = film.category;
    document.getElementById('modal-disk').innerText = film.disk || '—';
    document.getElementById('modal-imdb').innerText = film.imdb || '—';
    document.getElementById('modal-douban').innerText = film.douban || '—';
    document.getElementById('modal-rt').innerText = film.rotten_tomatoes ? `${film.rotten_tomatoes}%` : '—';
    
    // Rating tag
    const ratingTag = document.getElementById('modal-rating');
    if (film.rating) {
        ratingTag.style.display = 'inline-block';
        ratingTag.className = `film-rating-badge ${getRatingClass(film.rating)}`;
        ratingTag.innerText = film.rating;
        
        // Rating full explanation
        const descBlock = document.getElementById('rating-desc-block');
        const descText = ratingDescriptions[film.rating.toUpperCase()] || '普通分类影片。';
        descBlock.style.display = 'block';
        descBlock.innerHTML = `
            <div class="rating-desc-title">分级说明 (${film.rating})</div>
            <p>${descText}</p>
        `;
    } else {
        ratingTag.style.display = 'none';
        document.getElementById('rating-desc-block').style.display = 'none';
    }
    
    // Curator Note ("Why it's here")
    const noteBlock = document.getElementById('curator-note-block');
    if (film.why) {
        noteBlock.style.display = 'block';
        noteBlock.innerHTML = `
            <div class="curator-note-title">推荐缘由</div>
            <p>"${film.why}"</p>
        `;
    } else {
        noteBlock.style.display = 'none';
    }
    
    // Action Buttons
    const doubanBtn = document.getElementById('modal-douban-btn');
    if (film.link) {
        doubanBtn.style.display = 'inline-flex';
        doubanBtn.href = film.link;
    } else {
        doubanBtn.style.display = 'none';
    }
    
    // IMDb lookup search button
    const imdbBtn = document.getElementById('modal-imdb-btn');
    imdbBtn.href = `https://www.imdb.com/find?q=${encodeURIComponent(film.title)}`;
    
    // Show Modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Lock body scroll
}

function closeModal() {
    const modal = document.getElementById('detail-modal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scroll
}

// ==========================================
// Cinematic Gacha Random Film Picker
// ==========================================
let gachaState = 'idle'; // 'idle' | 'spinning' | 'stopping' | 'revealed'
let gachaSelectedCategory = 'all'; // 'all' | '电影' | '电视剧' | '纪录片' | '演唱会'
let gachaWinnerFilm = null;
let gachaRafId = null;
let gachaCurrentX = 0;
let gachaLastTime = null;

// Gacha Reel Dimensions & Constants
const GACHA_ITEM_WIDTH = 170;
const GACHA_ITEM_GAP = 16;
const GACHA_SLOT_WIDTH = GACHA_ITEM_WIDTH + GACHA_ITEM_GAP; // 186px
const GACHA_SPIN_SPEED = 1350; // px/sec steady spinning velocity

// Helper to get candidate films based on category
function getGachaPoolCandidates() {
    if (gachaSelectedCategory === 'all') {
        return FILMS_DATA;
    }
    return FILMS_DATA.filter(film => film.category === gachaSelectedCategory);
}

// Update counts on the category chips
function updateGachaPoolCounts() {
    const totalAll = FILMS_DATA.length;
    const totalMovie = FILMS_DATA.filter(f => f.category === '电影').length;
    const totalTv = FILMS_DATA.filter(f => f.category === '电视剧').length;
    const totalDoc = FILMS_DATA.filter(f => f.category === '纪录片').length;
    const totalConcert = FILMS_DATA.filter(f => f.category === '演唱会').length;

    const elAll = document.getElementById('pool-count-all');
    if (elAll) elAll.innerText = `(${totalAll})`;
    const elMovie = document.getElementById('pool-count-movie');
    if (elMovie) elMovie.innerText = `(${totalMovie})`;
    const elTv = document.getElementById('pool-count-tv');
    if (elTv) elTv.innerText = `(${totalTv})`;
    const elDoc = document.getElementById('pool-count-doc');
    if (elDoc) elDoc.innerText = `(${totalDoc})`;
    const elConcert = document.getElementById('pool-count-concert');
    if (elConcert) elConcert.innerText = `(${totalConcert})`;
}

function openLuckyModal() {
    const modal = document.getElementById('lucky-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    updateGachaPoolCounts();
    resetGachaStage();
}

function closeLuckyModal() {
    if (gachaState === 'spinning' || gachaState === 'stopping') return;
    const modal = document.getElementById('lucky-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (gachaRafId) {
        cancelAnimationFrame(gachaRafId);
        gachaRafId = null;
    }
}

function createReelItem(film) {
    const item = document.createElement('div');
    item.className = 'reel-item';
    const posterSrc = film.poster || generatePosterSvg(film.title, film.rating);
    item.innerHTML = `
        <img src="${posterSrc}" alt="${film.title}" loading="lazy">
        <div class="reel-rating-badge">${film.rating || 'UR'}</div>
        <div class="reel-item-title">${film.title}</div>
        <div class="reel-shine" aria-hidden="true"></div>
    `;
    item._film = film;
    return item;
}

function updateReelItem(item, film) {
    if (!item || !film) return;
    const posterSrc = film.poster || generatePosterSvg(film.title, film.rating);
    const img = item.querySelector('img');
    if (img && img.src !== posterSrc) {
        img.src = posterSrc;
        img.alt = film.title;
    }
    const badge = item.querySelector('.reel-rating-badge');
    if (badge) badge.innerText = film.rating || 'UR';
    const title = item.querySelector('.reel-item-title');
    if (title) title.innerText = film.title;
    item._film = film;
}

function resetGachaStage() {
    if (gachaRafId) {
        cancelAnimationFrame(gachaRafId);
        gachaRafId = null;
    }
    gachaState = 'idle';
    gachaLastTime = null;

    const stage = document.getElementById('gacha-stage');
    if (stage) {
        stage.classList.remove('spinning', 'stopping', 'revealed');
    }

    const track = document.getElementById('gacha-reel-track');
    if (track) {
        track.classList.remove('winner-revealed');
        track.innerHTML = '';
        track.style.transform = 'translateX(0px)';
    }

    const winnerMeta = document.getElementById('gacha-winner-meta');
    if (winnerMeta) winnerMeta.classList.remove('visible');

    const winnerActions = document.getElementById('gacha-winner-actions');
    if (winnerActions) winnerActions.style.display = 'none';

    const startBtn = document.getElementById('lucky-start-btn');
    if (startBtn) {
        startBtn.style.display = 'inline-flex';
        startBtn.classList.remove('stopping-state');
        startBtn.disabled = false;
        document.getElementById('btn-icon').innerText = '🎲';
        document.getElementById('btn-text').innerText = '开始抽选';
    }

    // Enable pool chips
    document.querySelectorAll('.pool-chip').forEach(c => c.removeAttribute('disabled'));
}

function handlePoolChipClick(chip) {
    if (gachaState === 'spinning' || gachaState === 'stopping') return;

    document.querySelectorAll('.pool-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    gachaSelectedCategory = chip.getAttribute('data-category');

    const poolInfo = document.getElementById('gacha-pool-info');
    const catName = gachaSelectedCategory === 'all' ? '全片库' : gachaSelectedCategory;
    const candidates = getGachaPoolCandidates();
    if (poolInfo) {
        poolInfo.innerText = `在 ${catName}（共 ${candidates.length} 部作品）中抽取一部影片`;
    }

    resetGachaStage();
}

function handleGachaButtonClick() {
    if (gachaState === 'idle') {
        startGachaSpinning();
    } else if (gachaState === 'spinning') {
        stopGachaSpinning();
    }
}

function startGachaSpinning() {
    const candidates = getGachaPoolCandidates();
    if (!candidates || candidates.length === 0) {
        alert('当前分类暂无可抽选的影片！');
        return;
    }

    gachaState = 'spinning';
    gachaLastTime = null;

    // Disable pool chips during spin
    document.querySelectorAll('.pool-chip').forEach(c => c.setAttribute('disabled', 'true'));

    const stage = document.getElementById('gacha-stage');
    stage.classList.remove('stopping', 'revealed');
    stage.classList.add('spinning');

    const winnerMeta = document.getElementById('gacha-winner-meta');
    winnerMeta.classList.remove('visible');

    const winnerActions = document.getElementById('gacha-winner-actions');
    winnerActions.style.display = 'none';

    // Switch main button to "Stop"
    const startBtn = document.getElementById('lucky-start-btn');
    startBtn.style.display = 'inline-flex';
    startBtn.classList.add('stopping-state');
    startBtn.disabled = false;
    document.getElementById('btn-icon').innerText = '⏹';
    document.getElementById('btn-text').innerText = '停！揭晓影片';

    // Populate track with 28 items
    const track = document.getElementById('gacha-reel-track');
    track.classList.remove('winner-revealed');
    track.innerHTML = '';

    const itemCount = 28;
    for (let i = 0; i < itemCount; i++) {
        const randIndex = Math.floor(Math.random() * candidates.length);
        const item = createReelItem(candidates[randIndex]);
        track.appendChild(item);
    }

    gachaCurrentX = 0;
    track.style.transform = `translateX(0px)`;

    function spinLoop(now) {
        if (gachaState !== 'spinning') return;

        if (gachaLastTime === null) {
            gachaLastTime = now;
            gachaRafId = requestAnimationFrame(spinLoop);
            return;
        }

        const dt = Math.min((now - gachaLastTime) / 1000, 0.05); // cap delta time
        gachaLastTime = now;

        gachaCurrentX -= GACHA_SPIN_SPEED * dt;

        // Infinite conveyor belt wrapping:
        // When first element fully leaves view on left, move it to end and shift coordinate by slot width
        while (gachaCurrentX <= -GACHA_SLOT_WIDTH) {
            const firstChild = track.firstElementChild;
            const randIndex = Math.floor(Math.random() * candidates.length);
            updateReelItem(firstChild, candidates[randIndex]);
            track.appendChild(firstChild);
            gachaCurrentX += GACHA_SLOT_WIDTH;
        }

        track.style.transform = `translateX(${gachaCurrentX}px)`;
        gachaRafId = requestAnimationFrame(spinLoop);
    }

    gachaRafId = requestAnimationFrame(spinLoop);
}

function stopGachaSpinning() {
    if (gachaState !== 'spinning') return;
    gachaState = 'stopping';

    if (gachaRafId) {
        cancelAnimationFrame(gachaRafId);
        gachaRafId = null;
    }

    const startBtn = document.getElementById('lucky-start-btn');
    startBtn.disabled = true;
    startBtn.classList.remove('stopping-state');
    document.getElementById('btn-icon').innerText = '⏳';
    document.getElementById('btn-text').innerText = '正在锁定...';

    const stage = document.getElementById('gacha-stage');
    stage.classList.remove('spinning');
    stage.classList.add('stopping');

    const candidates = getGachaPoolCandidates();
    // Pick the winning film
    gachaWinnerFilm = candidates[Math.floor(Math.random() * candidates.length)];

    const track = document.getElementById('gacha-reel-track');
    const viewport = document.getElementById('gacha-reel-viewport');
    const viewportWidth = viewport.clientWidth || 550;

    // Viewport center is viewportWidth / 2.
    // An item centered in viewport has its left edge at (viewportWidth - GACHA_ITEM_WIDTH) / 2.
    const centerOffset = (viewportWidth - GACHA_ITEM_WIDTH) / 2;

    // Select target slot K in the track (index 10 is well off-screen to the right)
    const K = 10;
    const targetItem = track.children[K];
    if (targetItem) {
        updateReelItem(targetItem, gachaWinnerFilm);
    }

    // Mathematical stop position where track.children[K] is centered in reticle:
    // ScreenLeft(K) = X_final + K * GACHA_SLOT_WIDTH = centerOffset
    // => X_final = centerOffset - (K * GACHA_SLOT_WIDTH)
    const X_final = centerOffset - (K * GACHA_SLOT_WIDTH);

    // Current position X_0:
    const X_0 = gachaCurrentX;

    // Actual travel distance:
    const D = X_0 - X_final; // D > 0

    // PES 2021 Uniform Deceleration Physics Model:
    // Initial velocity v_0 = GACHA_SPIN_SPEED (px/s).
    // Velocity v(t) = v_0 * (1 - t / T).
    // Initial speed has ZERO jump: ds/dt at t=0 is exactly v_0!
    // Final speed is 0: ds/dt at t=T is 0.
    // Total duration T = 2 * D / v_0.
    const v0 = GACHA_SPIN_SPEED;
    const duration = (2 * D / v0) * 1000; // in milliseconds

    const startTime = performance.now();

    function decelerateLoop(now) {
        const elapsed = now - startTime;
        const u = Math.min(Math.max(elapsed / duration, 0), 1);

        // Uniform deceleration equation: s(u) = D * (2*u - u^2)
        // Check: ds/du = D * (2 - 2u). At u=0: ds/dt = (ds/du)*(1/T) = 2*D/T = v0.
        // At u=1: ds/dt = 0.
        // Constant acceleration: a = -v0 / T.
        const currentPos = X_0 - (D * (2 * u - (u * u)));
        gachaCurrentX = currentPos;
        track.style.transform = `translateX(${currentPos}px)`;

        if (u < 1) {
            gachaRafId = requestAnimationFrame(decelerateLoop);
        } else {
            // Deceleration complete! Lock EXACTLY at X_final with 0px error
            gachaCurrentX = X_final;
            track.style.transform = `translateX(${X_final}px)`;

            // Trigger winner reveal sequence
            revealWinner(gachaWinnerFilm, targetItem);
        }
    }

    gachaRafId = requestAnimationFrame(decelerateLoop);
}

function revealWinner(film, winningItem) {
    gachaState = 'revealed';

    const stage = document.getElementById('gacha-stage');
    stage.classList.remove('stopping');
    stage.classList.add('revealed');

    const track = document.getElementById('gacha-reel-track');
    track.classList.add('winner-revealed');

    // Add lock & shine to winning item
    if (winningItem) {
        winningItem.classList.add('winner-locked');
    }

    // Populate Winner Details
    document.getElementById('winner-title').innerText = film.title;
    document.getElementById('winner-en-title').innerText = film.en_title || '';
    document.getElementById('winner-year').innerText = film.year || '未知年份';
    document.getElementById('winner-category').innerText = film.category || '电影';
    document.getElementById('winner-disk').innerText = film.disk || 'disk1';

    let scores = [];
    if (film.imdb) scores.push(`IMDb ${film.imdb}`);
    if (film.douban) scores.push(`豆瓣 ${film.douban}`);
    if (film.rotten_tomatoes) scores.push(`烂番茄 ${film.rotten_tomatoes}%`);
    document.getElementById('winner-scores').innerText = scores.join(' · ') || '暂无评分';

    // 200ms after lock, trigger the 3D flip on the winning card
    setTimeout(() => {
        if (winningItem) {
            winningItem.classList.add('flipped-reveal');
        }

        // Show metadata smoothly
        setTimeout(() => {
            const winnerMeta = document.getElementById('gacha-winner-meta');
            if (winnerMeta) winnerMeta.classList.add('visible');

            // Switch action buttons
            const startBtn = document.getElementById('lucky-start-btn');
            if (startBtn) startBtn.style.display = 'none';

            const winnerActions = document.getElementById('gacha-winner-actions');
            if (winnerActions) winnerActions.style.display = 'flex';

            // Re-enable pool chips
            document.querySelectorAll('.pool-chip').forEach(c => c.removeAttribute('disabled'));
        }, 350);
    }, 200);
}
