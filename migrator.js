// migrator.js (带调试和超时功能)
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const localDB = require('./database.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK 初始化成功。');
} catch (e) {
  console.error('❌ Firebase Admin SDK 初始化失败:', e);
  process.exit(1); // 初始化失败，直接退出
}

const db = admin.firestore();
console.log('✅ Firestore 实例已获取。');

async function migrateData() {
  console.log('开始迁移数据...');

  const categories = Object.keys(localDB);

  for (const category of categories) {
    console.log(`-- 正在处理: ${category}`);
    const items = localDB[category];

    if (!items || items.length === 0) {
      console.log(`-- ${category} 为空，跳过。`);
      continue;
    }

    const collectionRef = db.collection(category);
    console.log(`-- 准备写入 ${items.length} 个项目到 '${category}' 集合...`);

    let counter = 0;
    for (const item of items) {
      const { id, category: itemCategory, ...dataToUpload } = item;

      try {
        // 打印将要上传的数据
        const title = dataToUpload.title || '无标题项目';
        console.log(`---- 正在上传: ${title}`);

        // **设置一个超时**
        const addPromise = collectionRef.add(dataToUpload);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('写入超时 (15秒)。请检查网络/防火墙。')), 15000)
        );

        // 看是写入成功还是超时
        await Promise.race([addPromise, timeoutPromise]);

        counter++;
        if (counter % 20 === 0 || counter === items.length) { // 每20个或最后一个打印进度
            console.log(`---- ...已上传 ${counter} / ${items.length} ...`);
        }

      } catch (error) {
        // 错误可能是超时，也可能是其他问题
        console.error(`❌ 上传项目失败: ${dataToUpload.title}`, error.message);
        console.error('迁移在第一个错误处停止。请检查上述错误。');
        return; // 退出函数
      }
    }
    console.log(`✅ ${category} (${items.length} 个项目) 迁移完成。`);
  }

  console.log('🎉 全部数据迁移成功！');
}

migrateData().catch(e => {
    console.error('迁移过程中发生未捕获的严重错误:', e);
});