const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// =====================================================
// KONFIGURASI LOG
// =====================================================
// Pilihan mode log:
// silent  = tidak tampil di terminal dan tidak menulis log
// summary = hanya log penting dan ringkasan proses
// detail  = log detail untuk debugging
const LOG_MODE = process.env.LOG_MODE || 'summary';

const logFile = path.join(__dirname, 'filter_log.txt');
let loadingInterval = null;
let loadingText = '';
let loadingDots = 0;

global.logFilterInitialized = false;

function writeLogFile(message) {
  if (LOG_MODE === 'silent') return;

  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logMessage = `[${timestamp}] ${message}\n`;

  if (!global.logFilterInitialized) {
    fs.writeFileSync(
      logFile,
      `=== FILTER LOG - ${new Date().toISOString().split('T')[0]} ===\n${logMessage}`
    );
    global.logFilterInitialized = true;
  } else {
    fs.appendFileSync(logFile, logMessage);
  }
}

function logFilter(message, mode = 'summary') {
  if (LOG_MODE === 'silent') return;
  if (mode === 'detail' && LOG_MODE !== 'detail') return;

  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logMessage = `[${timestamp}] ${message}`;

  console.log(logMessage);
  writeLogFile(message);
}

function startLoading(text) {
  if (LOG_MODE === 'silent') return;

  loadingText = text;
  loadingDots = 0;

  if (loadingInterval) clearInterval(loadingInterval);

  loadingInterval = setInterval(() => {
    loadingDots = (loadingDots + 1) % 4;
    const dots = '.'.repeat(loadingDots).padEnd(3, ' ');
    process.stdout.write(`\râ³ ${loadingText}${dots}`);
  }, 500);
}

function updateLoading(text) {
  if (LOG_MODE === 'silent') return;
  loadingText = text;
}

function stopLoading(message) {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }

  if (LOG_MODE !== 'silent') {
    process.stdout.write('\r\x1b[K');
  }

  logFilter(message, 'summary');
}

// =====================================================
// KONFIGURASI DATABASE
// =====================================================
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'otics_tps',
  password: process.env.DB_PASSWORD || 'sukatno_ali',
  database: process.env.DB_NAME || 'database_tps_master',
  multipleStatements: false
});

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

// =====================================================
// MAPPING PRODUK KE TABEL FILTERED
// =====================================================
const productTableMapFiltered = {
  // Common Rail 1
  'ASHOK H6A': 'common_rail_1_filtered',
  'MDE8': 'common_rail_1_filtered',
  'P3267': 'common_rail_1_filtered',
  'E494 (B20)': 'common_rail_1_filtered',
  'P3263': 'common_rail_1_filtered',

  // Common Rail 2
  '902FA': 'common_rail_2_filtered',
  '902FA-PTJ': 'common_rail_2_filtered',

  // Common Rail 3
  '4N13': 'common_rail_3_filtered',
  'VM': 'common_rail_3_filtered',
  'VM USA': 'common_rail_3_filtered',
  'RT56': 'common_rail_3_filtered',
  'JDE20': 'common_rail_3_filtered',
  '902FI': 'common_rail_3_filtered',
  '902F I': 'common_rail_3_filtered',

  // Common Rail 4
  '4N16': 'common_rail_4_filtered',
  '4N16-B': 'common_rail_4_filtered',
  'MDE5': 'common_rail_4_filtered',

  // Common Rail 5
  '902FE': 'common_rail_5_filtered',
  '902FE-SGI167': 'common_rail_5_filtered',
  '902FE-PTJ': 'common_rail_5_filtered',
  'RT-50': 'common_rail_5_filtered',
  'ASHOK N4': 'common_rail_5_filtered',
  'ASHOK N6': 'common_rail_5_filtered',
  '634F': 'common_rail_5_filtered',

  // Common Rail 6
  'RZ4E': 'common_rail_6_filtered',
  'RZE4 B': 'common_rail_6_filtered',
  'RZ4E B': 'common_rail_6_filtered',
  

  // Common Rail 7
  '4N15': 'common_rail_7_filtered',
  '4N15-C': 'common_rail_7_filtered',

  
  'YD2K3': 'common_rail_7_filtered',
  'S320': 'common_rail_7_filtered',
  'YD25': 'common_rail_7_filtered',
  'CR22 B': 'common_rail_7_filtered',

  // Common Rail 8
  '415F': 'common_rail_8_filtered',
  '902FC': 'common_rail_8_filtered',
  '902fc': 'common_rail_8_filtered',
  '902F C': 'common_rail_8_filtered',

  // Common Rail 9
  'GD B': 'common_rail_9_filtered',
  '902FB': 'common_rail_9_filtered',
  '902F-B': 'common_rail_9_filtered',
  '902F B': 'common_rail_9_filtered',

  // Common Rail 10
  '902FG': 'common_rail_10_filtered',
  '902F G' : 'common_rail_10_filtered',

  
  'RG01 B': 'common_rail_10_filtered',
  'RG01': 'common_rail_10_filtered',

  // Common Rail 11
  '902FD': 'common_rail_11_filtered',
  '19MY': 'common_rail_11_filtered',
  'RZ4E A': 'common_rail_11_filtered',

  // Common Rail 12
  '902F-F': 'common_rail_12_filtered',
  'ES01-B': 'common_rail_12_filtered',
  'ES01B': 'common_rail_12_filtered',
  '902F F': 'common_rail_12_filtered'
};

// =====================================================
// MAPPING TABEL FILTERED KE TABEL SOURCE
// =====================================================
const sourceTableMap = {
  'common_rail_1_filtered': 'common_rail_1',
  'common_rail_2_filtered': 'common_rail_2',
  'common_rail_3_filtered': 'common_rail_3',
  'common_rail_4_filtered': 'common_rail_4',
  'common_rail_5_filtered': 'common_rail_5',
  'common_rail_6_filtered': 'common_rail_6',
  'common_rail_7_filtered': 'common_rail_7',
  'common_rail_8_filtered': 'common_rail_8',
  'common_rail_9_filtered': 'common_rail_9',
  'common_rail_10_filtered': 'common_rail_10',
  'common_rail_11_filtered': 'common_rail_11',
  'common_rail_12_filtered': 'common_rail_12'
};

// =====================================================
// JADWAL SHIFT
// Tetap disimpan jika nanti dibutuhkan untuk pengembangan.
// =====================================================
const shift1Slots = [
  { start: 7 * 60 + 10, end: 8 * 60 + 10, label: '07:10 - 08:10', theme: 'Schedule' },
  { start: 8 * 60 + 10, end: 9 * 60 + 10, label: '08:10 - 09:10', theme: 'Schedule' },
  { start: 9 * 60 + 30, end: 10 * 60 + 20, label: '09:30 - 10:20', theme: 'Schedule' },
  { start: 10 * 60 + 20, end: 11 * 60 + 20, label: '10:20 - 11:20', theme: 'Schedule' },
  { start: 12 * 60 + 40, end: 13 * 60 + 0, label: '12:40 - 13:00', theme: 'Schedule' },
  { start: 13 * 60 + 0, end: 14 * 60 + 0, label: '13:00 - 14:00', theme: 'Schedule' },
  { start: 14 * 60 + 30, end: 15 * 60 + 10, label: '14:30 - 15:10', theme: 'Schedule' },
  { start: 15 * 60 + 10, end: 16 * 60 + 10, label: '15:10 - 16:10', theme: 'Schedule' },
  { start: 16 * 60 + 30, end: 17 * 60 + 30, label: '16:30 - 17:30', theme: 'Overtime' },
  { start: 17 * 60 + 30, end: 18 * 60 + 30, label: '17:30 - 18:30', theme: 'Overtime' },
  { start: 19 * 60 + 0, end: 20 * 60 + 0, label: '19:00 - 20:00', theme: 'Overtime' }
];

const shift2Slots = [
  { start: 19 * 60 + 50, end: 20 * 60 + 50, label: '19:50 - 20:50', theme: 'Schedule' },
  { start: 20 * 60 + 50, end: 21 * 60 + 50, label: '20:50 - 21:50', theme: 'Schedule' },
  { start: 22 * 60 + 0, end: 23 * 60 + 0, label: '22:00 - 23:00', theme: 'Schedule' },
  { start: 23 * 60 + 0, end: 24 * 60 + 0, label: '23:00 - 00:00', theme: 'Schedule' },
  { start: 10, end: 70, label: '00:10 - 01:10', theme: 'Schedule' },
  { start: 70, end: 130, label: '01:10 - 02:10', theme: 'Schedule' },
  { start: 170, end: 230, label: '02:50 - 03:50', theme: 'Schedule' },
  { start: 230, end: 290, label: '03:50 - 04:50', theme: 'Schedule' },
  { start: 310, end: 370, label: '05:10 - 06:10', theme: 'Overtime' },
  { start: 370, end: 430, label: '06:10 - 07:10', theme: 'Overtime' }
];

const allScheduleSlots = [...shift1Slots, ...shift2Slots];

// =====================================================
// HELPER DATA
// =====================================================
function getTimePart(createdAt) {
  if (!createdAt) return '';

  if (createdAt instanceof Date) {
    const hours = createdAt.getHours().toString().padStart(2, '0');
    const minutes = createdAt.getMinutes().toString().padStart(2, '0');
    const seconds = createdAt.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  if (typeof createdAt === 'string') {
    if (createdAt.includes(' ')) {
      return createdAt.split(' ')[1];
    }

    if (createdAt.includes('T')) {
      const timeSection = createdAt.split('T')[1] || '';
      return timeSection.substring(0, 8);
    }
  }

  if (typeof createdAt === 'object' && createdAt !== null) {
    const dateString = createdAt.toString();
    const parts = dateString.split(' ');

    if (parts.length >= 5) {
      return parts[4];
    }
  }

  return '';
}

function isInvalidNumber(value) {
  if (value === null || value === undefined) return true;
  if (value === '') return true;
  if (value === '-') return true;
  if (value === '0') return true;

  const numberValue = Number(value);
  return Number.isNaN(numberValue) || numberValue <= 0;
}

function isDataValid(row, stats) {
  if (isInvalidNumber(row.actual)) {
    stats.actualInvalid++;
    logFilter(`DIFILTER actual invalid. id_uuid: ${row.id_uuid}, actual: ${row.actual}`, 'detail');
    return false;
  }

  if (isInvalidNumber(row.target)) {
    stats.targetInvalid++;
    logFilter(`DIFILTER target invalid. id_uuid: ${row.id_uuid}, target: ${row.target}`, 'detail');
    return false;
  }

  const actualValue = Number(row.actual);
  const timePart = getTimePart(row.created_at);

  if (timePart >= '18:30:00' && timePart <= '19:00:00') {
    stats.timeSkipped++;
    logFilter(`DIFILTER jam 18:30 sampai 19:00. id_uuid: ${row.id_uuid}, waktu: ${timePart}`, 'detail');
    return false;
  }

  if (timePart >= '07:10:00' && timePart < '10:00:00' && actualValue > 100) {
    stats.actualTooHigh++;
    logFilter(`DIFILTER actual > 100 pada jam 07:10 sampai 10:00. id_uuid: ${row.id_uuid}`, 'detail');
    return false;
  }

  return true;
}

function createEmptyProductSummary(product, sourceTable = '-', targetTable = '-') {
  return {
    product,
    sourceTable,
    targetTable,
    total: 0,
    valid: 0,
    filtered: 0,
    inserted: 0,
    skipped: 0,
    actualInvalid: 0,
    targetInvalid: 0,
    timeSkipped: 0,
    actualTooHigh: 0,
    error: null
  };
}

// =====================================================
// PROSES SINKRONISASI PER PRODUK
// =====================================================
async function syncDataByProduct(nameProduct) {
  const tableName = productTableMapFiltered[nameProduct];

  if (!tableName) {
    return createEmptyProductSummary(nameProduct);
  }

  const sourceTable = sourceTableMap[tableName];

  if (!sourceTable) {
    const result = createEmptyProductSummary(nameProduct, '-', tableName);
    result.error = `Source table tidak ditemukan untuk target ${tableName}`;
    return result;
  }

  const stats = {
    actualInvalid: 0,
    targetInvalid: 0,
    timeSkipped: 0,
    actualTooHigh: 0
  };

  const summary = createEmptyProductSummary(nameProduct, sourceTable, tableName);

  const selectQuery = `
    SELECT * FROM ${sourceTable}
    WHERE name_product = ?
    ORDER BY created_at ASC
  `;

  const results = await queryAsync(selectQuery, [nameProduct]);

  summary.total = results.length;

  if (results.length === 0) {
    return summary;
  }

  const validData = results.filter(row => isDataValid(row, stats));

  summary.valid = validData.length;
  summary.filtered = results.length - validData.length;
  summary.actualInvalid = stats.actualInvalid;
  summary.targetInvalid = stats.targetInvalid;
  summary.timeSkipped = stats.timeSkipped;
  summary.actualTooHigh = stats.actualTooHigh;

  if (validData.length === 0) {
    return summary;
  }

  const existingQuery = `
    SELECT id_uuid FROM ${tableName}
    WHERE name_product = ?
  `;

  const existingResults = await queryAsync(existingQuery, [nameProduct]);
  const existingUUIDs = new Set(existingResults.map(row => row.id_uuid));
  const newData = validData.filter(row => !existingUUIDs.has(row.id_uuid));

  summary.skipped = validData.length - newData.length;

  if (newData.length === 0) {
    return summary;
  }

  const insertQuery = `
    INSERT INTO ${tableName} (
      created_at,
      id_uuid,
      line_id,
      pg,
      line_name,
      name_product,
      target,
      actual,
      loading_time,
      efficiency,
      delay,
      cycle_time,
      status,
      time_trouble,
      time_trouble_quality,
      andon
    ) VALUES ?
  `;

  const values = newData.map(row => [
    row.created_at,
    row.id_uuid,
    row.line_id,
    row.pg,
    row.line_name,
    row.name_product,
    row.target,
    row.actual,
    row.loading_time,
    row.efficiency,
    row.delay,
    row.cycle_time,
    row.status,
    row.time_trouble,
    row.time_trouble_quality,
    row.andon
  ]);

  const insertResult = await queryAsync(insertQuery, [values]);
  summary.inserted = insertResult.affectedRows || 0;

  return summary;
}

// =====================================================
// PROSES SINKRONISASI SEMUA PRODUK
// =====================================================
let isSyncRunning = false;

async function syncAllProducts() {
  if (isSyncRunning) {
    logFilter('âš ï¸ Sinkronisasi sebelumnya masih berjalan. Proses baru dilewati.');
    return;
  }

  isSyncRunning = true;
  global.logFilterInitialized = false;

  const products = Object.keys(productTableMapFiltered);

  const totalSummary = {
    productCount: 0,
    total: 0,
    valid: 0,
    filtered: 0,
    inserted: 0,
    skipped: 0,
    actualInvalid: 0,
    targetInvalid: 0,
    timeSkipped: 0,
    actualTooHigh: 0,
    errors: 0
  };

  startLoading(`Sinkronisasi filter berjalan 0/${products.length}`);

  try {
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      updateLoading(`Sinkronisasi filter berjalan ${i + 1}/${products.length}`);

      try {
        const result = await syncDataByProduct(product);

        totalSummary.productCount++;
        totalSummary.total += result.total;
        totalSummary.valid += result.valid;
        totalSummary.filtered += result.filtered;
        totalSummary.inserted += result.inserted;
        totalSummary.skipped += result.skipped;
        totalSummary.actualInvalid += result.actualInvalid;
        totalSummary.targetInvalid += result.targetInvalid;
        totalSummary.timeSkipped += result.timeSkipped;
        totalSummary.actualTooHigh += result.actualTooHigh;

        if (result.error) {
          totalSummary.errors++;
          logFilter(`âŒ ${product}: ${result.error}`);
        }

        logFilter(
          `Ringkasan ${product}: total=${result.total}, valid=${result.valid}, filtered=${result.filtered}, inserted=${result.inserted}, skipped=${result.skipped}`,
          'detail'
        );
      } catch (err) {
        totalSummary.errors++;
        logFilter(`âŒ ERROR produk ${product}: ${err.message}`);
      }
    }

    stopLoading(
      `âœ… Sinkronisasi selesai. Produk: ${totalSummary.productCount}, Total data: ${totalSummary.total}, Valid: ${totalSummary.valid}, Filtered: ${totalSummary.filtered}, Inserted: ${totalSummary.inserted}, Skipped: ${totalSummary.skipped}, Error: ${totalSummary.errors}`
    );

    logFilter(
      `Detail filter: actual invalid=${totalSummary.actualInvalid}, target invalid=${totalSummary.targetInvalid}, jam 18:30-19:00=${totalSummary.timeSkipped}, actual > 100 pagi=${totalSummary.actualTooHigh}`,
      'summary'
    );
  } finally {
    isSyncRunning = false;
  }
}

// =====================================================
// START APLIKASI
// =====================================================
function startApp() {
  db.connect((err) => {
    if (err) {
      logFilter(`âŒ Gagal koneksi database: ${err.message}`);
      console.error(err);
      return;
    }

    logFilter('ðŸ”Œ Database berhasil terhubung');
    logFilter('ðŸš€ Sinkronisasi awal dimulai');

    syncAllProducts();

    cron.schedule('*/30 * * * *', () => {
      logFilter('â° Sinkronisasi terjadwal dimulai');
      syncAllProducts();
    });

    logFilter('â° Cron aktif setiap 30 menit');
  });
}

process.on('SIGINT', () => {
  logFilter('ðŸ›‘ Aplikasi dihentikan oleh user');

  if (loadingInterval) {
    clearInterval(loadingInterval);
  }

  db.end(() => {
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  logFilter(`âŒ Unhandled rejection: ${err.message || err}`);
});

process.on('uncaughtException', (err) => {
  logFilter(`âŒ Uncaught exception: ${err.message}`);

  if (loadingInterval) {
    clearInterval(loadingInterval);
  }

  db.end(() => {
    process.exit(1);
  });
});

startApp();
