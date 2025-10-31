// parser.js (已修复)
const fs = require('fs');
const path = require('path');
const { marked } = require('marked'); // 引入 marked 库
const { v4: uuidv4 } = require('uuid'); // 用来生成唯一ID

// 1. 读取 Markdown 文件
const mdContent = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');

// 2. 使用 marked 解析 MD
const tokens = marked.lexer(mdContent);

// 3. 定义数据结构
const database = {
    movies: [],
    documentaries: [],
    concerts: [],
    tv_shows: []
};

let currentCategory = 'unknown'; // 当前解析的类别
let currentDisk = 'unknown'; // 当前解析的分盘

// 4. 遍历 MD 的“词法单元” (tokens)
tokens.forEach(token => {
    // 识别主标题 (## 电影, ## 纪录片 ...)
    if (token.type === 'heading' && token.depth === 2) {
        if (token.text.includes('电影')) currentCategory = 'movies';
        else if (token.text.includes('纪录片')) currentCategory = 'documentaries';
        else if (token.text.includes('演唱会')) currentCategory = 'concerts';
        else if (token.text.includes('电视剧')) currentCategory = 'tv_shows';
        else currentCategory = 'unknown'; // 重置

        currentDisk = 'unknown'; // 重置分盘
    }

    // 识别子标题 (### disk1, ### disk2 ...)
    if (token.type === 'heading' && token.depth === 3) {
        if (token.text.startsWith('disk')) {
            currentDisk = token.text.trim();
        }
    }

    // 识别表格
    if (token.type === 'table') {
        const headers = token.header.map(h => h.text.trim()); // 表头
        const rows = token.rows;

        // 获取表头中每个字段的位置
        const colMap = {
            title: headers.indexOf('片名'),
            year: headers.indexOf('年份'),
            resolution: headers.indexOf('清晰度'),
            format: headers.indexOf('格式'),
            dts: headers.indexOf('DTS'),
            dd: headers.indexOf('DD'),
            rating: headers.indexOf('分级'),
            imdb: headers.indexOf('IMDb'),
            notes: headers.indexOf('Why it\'s here') // 对应 disk3
        };

        // *** 修复开始 ***
        rows.forEach(row => {
            // 辅助函数：安全地获取单元格的 .text 属性
            const getCellText = (colIndex) => {
                if (colIndex === -1 || !row[colIndex]) {
                    return ''; // 列不存在或单元格为空
                }
                return row[colIndex].text.trim(); // 返回 .text 属性
            };

            // 解析片名和豆瓣链接
            let titleText = getCellText(colMap.title); // <-- 修正
            let doubanLink = '';

            // 正则匹配链接
            const linkMatch = /\[(.*?)\]\((.*?)\)/.exec(titleText);

            if (linkMatch) {
                titleText = linkMatch[1]; // 链接内的文本
                doubanLink = linkMatch[2]; // 链接 URL
            } else {
                // 处理没有链接的片名 (如 '亲爱的同志')
                // 这一行 (旧的73行) 现在可以正常工作了
                titleText = titleText.replace(/\[|\]/g, '');
            }

            // 创建标准化的影片对象
            const entry = {
                id: uuidv4(),
                category: currentCategory.slice(0, -1), // 'movies' -> 'movie'
                disk: currentDisk,
                title: titleText.trim(),
                year: parseInt(getCellText(colMap.year)) || null, // <-- 修正
                doubanLink: doubanLink,
                resolution: getCellText(colMap.resolution) || 'NA', // <-- 修正
                format: getCellText(colMap.format) || 'NA', // <-- 修正
                audio_dts: getCellText(colMap.dts) || 'NA', // <-- 修正
                audio_dd: getCellText(colMap.dd) || 'NA', // <-- 修正
                rating: getCellText(colMap.rating) || 'NA', // <-- 修正
                imdb: parseFloat(getCellText(colMap.imdb)) || null, // <-- 修正
                notes: getCellText(colMap.notes) || '' // <-- 修正
            };
            // *** 修复结束 ***

            // 将条目添加到对应的类别数组中
            if (database[currentCategory]) {
                database[currentCategory].push(entry);
            }
        });
    }
});

// 5. 写入 database.json 文件
fs.writeFileSync(
    path.join(__dirname, 'database.json'),
    JSON.stringify(database, null, 2), // 格式化输出
    'utf8'
);

console.log('✅ 转换完成! `database.json` 已生成。');
console.log(`- 电影: ${database.movies.length} 部`);
console.log(`- 纪录片: ${database.documentaries.length} 部`);
console.log(`- 演唱会: ${database.concerts.length} 部`);
console.log(`- 电视剧: ${database.tv_shows.length} 部`);