#baru 

const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

// =====================================================
// KONFIGURASI SYNC
// =====================================================

// Hanya proses N data terbaru per produk
const SYNC_LIMIT = Number(process.env.SYNC_LIMIT || 350);

// Cron default: setiap 5 menit
//  */5 * * * * = menit 0,5,10,15,20,25,30,35,40,45,50,55
const SYNC_CRON = process.env.SYNC_CRON || '*/5 * * * *';

// =====================================================
// KONFIGURASI LOG
// =====================================================
//
// Pilihan mode:
// silent  = tidak tampil di terminal dan tidak menulis log
// summary = hanya log penting dan ringkasan proses
// detail  = log detail untuk debugging
//

const LOG_MODE = process.env.LOG_MODE || 'summary';

const logFile = path.join(__dirname, 'filter_log.txt');

let loadingInterval = null;
let loadingText = '';
let loadingDots = 0;

global.logFilterInitialized = false;

// =====================================================
// LOG FILE
// =====================================================

function writeLogFile(message) {
  if (LOG_MODE === 'silent') return;

  const timestamp = new Date()
    .toISOString()
    .replace('T', ' ')
    .substring(0, 19);

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

// =====================================================
// LOG CONSOLE
// =====================================================

function logFilter(message, mode = 'summary') {
  if (LOG_MODE === 'silent') return;

  if (mode === 'detail' && LOG_MODE !== 'detail') {
    return;
  }

  const timestamp = new Date()
    .toISOString()
    .replace('T', ' ')
    .substring(0, 19);

  const logMessage = `[${timestamp}] ${message}`;

  console.log(logMessage);
  writeLogFile(message);
}

// =====================================================
// LOADING
// =====================================================

function startLoading(text) {
  if (LOG_MODE === 'silent') return;

  loadingText = text;
  loadingDots = 0;

  if (loadingInterval) {
    clearInterval(loadingInterval);
  }

  loadingInterval = setInterval(() => {
    loadingDots = (loadingDots + 1) % 4;

    const dots = '.'.repeat(loadingDots).padEnd(3, ' ');

    process.stdout.write(`\r[SYNC] ${loadingText}${dots}`);
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

// =====================================================
// QUERY ASYNC
// =====================================================

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        return reject(err);
      }

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
  '902F G': 'common_rail_10_filtered',
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
// =====================================================

const shift1Slots = [
  {
    start: 7 * 60 + 10,
    end: 8 * 60 + 10,
    label: '07:10 - 08:10',
    theme: 'Schedule'
  },
  {
    start: 8 * 60 + 10,
    end: 9 * 60 + 10,
    label: '08:10 - 09:10',
    theme: 'Schedule'
  },
  {
    start: 9 * 60 + 30,
    end: 10 * 60 + 20,
    label: '09:30 - 10:20',
    theme: 'Schedule'
  },
  {
    start: 10 * 60 + 20,
    end: 11 * 60 + 20,
    label: '10:20 - 11:20',
    theme: 'Schedule'
  },
  {
    start: 12 * 60 + 40,
    end: 13 * 60 + 0,
    label: '12:40 - 13:00',
    theme: 'Schedule'
  },
  {
    start: 13 * 60 + 0,
    end: 14 * 60 + 0,
    label: '13:00 - 14:00',
    theme: 'Schedule'
  },
  {
    start: 14 * 60 + 30,
    end: 15 * 60 + 10,
    label: '14:30 - 15:10',
    theme: 'Schedule'
  },
  {
    start: 15 * 60 + 10,
    end: 16 * 60 + 10,
    label: '15:10 - 16:10',
    theme: 'Schedule'
  },
  {
    start: 16 * 60 + 30,
    end: 17 * 60 + 30,
    label: '16:30 - 17:30',
    theme: 'Overtime'
  },
  {
    start: 17 * 60 + 30,
    end: 18 * 60 + 30,
    label: '17:30 - 18:30',
    theme: 'Overtime'
  },
  {
    start: 19 * 60 + 0,
    end: 20 * 60 + 0,
    label: '19:00 - 20:00',
    theme: 'Overtime'
  }
];

const shift2Slots = [
  {
    start: 19 * 60 + 50,
    end: 20 * 60 + 50,
    label: '19:50 - 20:50',
    theme: 'Schedule'
  },
  {
    start: 20 * 60 + 50,
    end: 21 * 60 + 50,
    label: '20:50 - 21:50',
    theme: 'Schedule'
  },
  {
    start: 22 * 60 + 0,
    end: 23 * 60 + 0,
    label: '22:00 - 23:00',
    theme: 'Schedule'
  },
  {
    start: 23 * 60 + 0,
    end: 24 * 60 + 0,
    label: '23:00 - 00:00',
    theme: 'Schedule'
  },
  {
    start: 10,
    end: 70,
    label: '00:10 - 01:10',
    theme: 'Schedule'
  },
  {
    start: 70,
    end: 130,
    label: '01:10 - 02:10',
    theme: 'Schedule'
  },
  {
    start: 170,
    end: 230,
    label: '02:50 - 03:50',
    theme: 'Schedule'
  },
  {
    start: 230,
    end: 290,
    label: '03:50 - 04:50',
    theme: 'Schedule'
  },
  {
    start: 310,
    end: 370,
    label: '05:10 - 06:10',
    theme: 'Overtime'
  },
  {
    start: 370,
    end: 430,
    label: '06:10 - 07:10',
    theme: 'Overtime'
  }
];

const allScheduleSlots = [...shift1Slots, ...shift2Slots];

// Supaya variable tetap tersedia jika dipakai untuk pengembangan berikutnya
void allScheduleSlots;

// =====================================================
// HELPER
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

// =====================================================
// VALIDASI ANGKA
// =====================================================

function isInvalidNumber(value) {
  if (value === null || value === undefined) {
    return true;
  }

  if (value === '') {
    return true;
  }

  if (value === '-') {
    return true;
  }

  if (value === '0') {
    return true;
  }

  const numberValue = Number(value);

  return Number.isNaN(numberValue) || numberValue <= 0;
}

// =====================================================
// VALIDASI DATA
// =====================================================

function isDataValid(row, stats) {

  // actual tidak valid
  if (isInvalidNumber(row.actual)) {
    stats.actualInvalid++;

    logFilter(
      `FILTER actual invalid. id_uuid: ${row.id_uuid}, actual: ${row.actual}`,
      'detail'
    );

    return false;
  }

  // target tidak valid
  if (isInvalidNumber(row.target)) {
    stats.targetInvalid++;

    logFilter(
      `FILTER target invalid. id_uuid: ${row.id_uuid}, target: ${row.target}`,
      'detail'
    );

    return false;
  }

  const actualValue = Number(row.actual);

  const timePart = getTimePart(row.created_at);

  // Filter waktu 18:30 - 19:00
  if (timePart >= '18:30:00' && timePart <= '19:00:00') {
    stats.timeSkipped++;

    logFilter(
      `FILTER jam 18:30 sampai 19:00. id_uuid: ${row.id_uuid}, waktu: ${timePart}`,
      'detail'
    );

    return false;
  }

  // Filter actual > 100 antara 07:10 - 10:00
  if (
    timePart >= '07:10:00' &&
    timePart < '10:00:00' &&
    actualValue > 100
  ) {
    stats.actualTooHigh++;

    logFilter(
      `FILTER actual > 100 pada jam 07:10 sampai 10:00. id_uuid: ${row.id_uuid}`,
      'detail'
    );

    return false;
  }

  return true;
}

// =====================================================
// SUMMARY
// =====================================================

function createEmptyProductSummary(
  product,
  sourceTable = '-',
  targetTable = '-'
) {
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
// SYNC PER PRODUK
// =====================================================

async function syncDataByProduct(nameProduct) {

  const tableName = productTableMapFiltered[nameProduct];

  // Produk tidak ditemukan
  if (!tableName) {
    return createEmptyProductSummary(nameProduct);
  }

  const sourceTable = sourceTableMap[tableName];

  // Source table tidak ditemukan
  if (!sourceTable) {
    const result = createEmptyProductSummary(
      nameProduct,
      '-',
      tableName
    );

    result.error = `Source table tidak ditemukan untuk target ${tableName}`;

    return result;
  }

  // ===================================================
  // STATISTIK FILTER
  // ===================================================

  const stats = {
    actualInvalid: 0,
    targetInvalid: 0,
    timeSkipped: 0,
    actualTooHigh: 0
  };

  const summary = createEmptyProductSummary(
    nameProduct,
    sourceTable,
    tableName
  );

  // ===================================================
  // AMBIL HANYA 350 DATA TERBARU
  // ===================================================
  //
  // DESC = terbaru ke terlama
  //
  const selectQuery = `
    SELECT *
    FROM ${sourceTable}
    WHERE name_product = ?
    ORDER BY created_at DESC
    LIMIT ${SYNC_LIMIT}
  `;

  const results = await queryAsync(
    selectQuery,
    [nameProduct]
  );

  summary.total = results.length;

  // Tidak ada data
  if (results.length === 0) {
    return summary;
  }

  logFilter(
    `[${nameProduct}] Mengambil ${results.length} data terbaru dari ${sourceTable}`,
    'detail'
  );

  // ===================================================
  // FILTER DATA
  // ===================================================

  const validData = results.filter(row =>
    isDataValid(row, stats)
  );

  summary.valid = validData.length;
  summary.filtered = results.length - validData.length;

  summary.actualInvalid = stats.actualInvalid;
  summary.targetInvalid = stats.targetInvalid;
  summary.timeSkipped = stats.timeSkipped;
  summary.actualTooHigh = stats.actualTooHigh;

  // Tidak ada data valid
  if (validData.length === 0) {
    return summary;
  }

  // ===================================================
  // CEK ID YANG SUDAH ADA
  // HANYA UNTUK 350 DATA TERBARU YANG SEDANG DIPROSES
  // ===================================================

  const uuidList = validData
    .map(row => row.id_uuid)
    .filter(uuid => uuid !== null && uuid !== undefined && uuid !== '');

  if (uuidList.length === 0) {
    return summary;
  }

  const placeholders = uuidList.map(() => '?').join(',');

  const existingQuery = `
    SELECT id_uuid
    FROM ${tableName}
    WHERE name_product = ?
      AND id_uuid IN (${placeholders})
  `;

  const existingResults = await queryAsync(
    existingQuery,
    [nameProduct, ...uuidList]
  );

  const existingUUIDs = new Set(
    existingResults.map(row => row.id_uuid)
  );

  // ===================================================
  // DATA BARU SAJA
  // ===================================================

  const newData = validData.filter(
    row => !existingUUIDs.has(row.id_uuid)
  );

  summary.skipped = validData.length - newData.length;

  // Semua sudah pernah diinsert
  if (newData.length === 0) {
    return summary;
  }

  // ===================================================
  // INSERT
  // ===================================================

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
    )
    VALUES ?
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

  const insertResult = await queryAsync(
    insertQuery,
    [values]
  );

  summary.inserted = insertResult.affectedRows || 0;

  return summary;
}

// =====================================================
// SYNC SEMUA PRODUK
// =====================================================

let isSyncRunning = false;

async function syncAllProducts() {

  // Mencegah proses overlap
  if (isSyncRunning) {
    logFilter(
      'WARNING: Sinkronisasi sebelumnya masih berjalan. Proses baru dilewati.'
    );

    return;
  }

  isSyncRunning = true;

  global.logFilterInitialized = false;

  const products = Object.keys(
    productTableMapFiltered
  );

  // ===================================================
  // TOTAL SUMMARY
  // ===================================================

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

  startLoading(
    `Sinkronisasi 0/${products.length} | Limit ${SYNC_LIMIT}`
  );

  try {

    // =================================================
    // PROCESS PRODUCT SATU PER SATU
    // =================================================

    for (let i = 0; i < products.length; i++) {

      const product = products[i];

      updateLoading(
        `Sinkronisasi ${i + 1}/${products.length} | ${product}`
      );

      try {

        const result = await syncDataByProduct(
          product
        );

        // =============================================
        // SUMMARY
        // =============================================

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

        // =============================================
        // ERROR
        // =============================================

        if (result.error) {

          totalSummary.errors++;

          logFilter(
            `ERROR ${product}: ${result.error}`
          );
        }

        // =============================================
        // DETAIL
        // =============================================

        logFilter(
          `Ringkasan ${product}: ` +
          `total=${result.total}, ` +
          `valid=${result.valid}, ` +
          `filtered=${result.filtered}, ` +
          `inserted=${result.inserted}, ` +
          `skipped=${result.skipped}`,
          'detail'
        );

      } catch (err) {

        totalSummary.errors++;

        logFilter(
          `ERROR produk ${product}: ${err.message}`
        );
      }
    }

    // =================================================
    // STOP LOADING
    // =================================================

    stopLoading(
      `SYNC selesai | ` +
      `Produk=${totalSummary.productCount} | ` +
      `Data=${totalSummary.total} | ` +
      `Valid=${totalSummary.valid} | ` +
      `Filtered=${totalSummary.filtered} | ` +
      `Inserted=${totalSummary.inserted} | ` +
      `Skipped=${totalSummary.skipped} | ` +
      `Error=${totalSummary.errors}`
    );

    // =================================================
    // DETAIL FILTER
    // =================================================

    logFilter(
      `Detail filter: ` +
      `actual invalid=${totalSummary.actualInvalid}, ` +
      `target invalid=${totalSummary.targetInvalid}, ` +
      `jam 18:30-19:00=${totalSummary.timeSkipped}, ` +
      `actual > 100 pagi=${totalSummary.actualTooHigh}`,
      'summary'
    );

  } finally {

    isSyncRunning = false;
  }
}

// =====================================================
// START APP
// =====================================================

function startApp() {

  db.connect((err) => {

    if (err) {

      logFilter(
        `ERROR koneksi database: ${err.message}`
      );

      console.error(err);

      return;
    }

    // =================================================
    // DATABASE CONNECTED
    // =================================================

    logFilter(
      'Database berhasil terhubung'
    );

    logFilter(
      `Konfigurasi: SYNC_LIMIT=${SYNC_LIMIT}`
    );

    logFilter(
      `Konfigurasi: SYNC_CRON=${SYNC_CRON}`
    );

    // =================================================
    // SYNC AWAL
    // =================================================

    logFilter(
      `Sinkronisasi awal dimulai. Maksimal ${SYNC_LIMIT} data terbaru per produk.`
    );

    syncAllProducts();

    // =================================================
    // CRON SETIAP 5 MENIT
    // =================================================

    cron.schedule(
      SYNC_CRON,
      () => {

        logFilter(
          `Sinkronisasi terjadwal dimulai. Maksimal ${SYNC_LIMIT} data terbaru per produk.`
        );

        syncAllProducts();
      }
    );

    logFilter(
      `Cron aktif: setiap 5 menit`
    );
  });
}

// =====================================================
// SHUTDOWN SIGINT
// =====================================================

process.on('SIGINT', () => {

  logFilter(
    'Aplikasi dihentikan oleh user'
  );

  if (loadingInterval) {
    clearInterval(loadingInterval);
  }

  db.end(() => {
    process.exit(0);
  });
});

// =====================================================
// UNHANDLED REJECTION
// =====================================================

process.on(
  'unhandledRejection',
  (err) => {

    logFilter(
      `Unhandled rejection: ${err.message || err}`
    );
  }
);

// =====================================================
// UNCAUGHT EXCEPTION
// =====================================================

process.on(
  'uncaughtException',
  (err) => {

    logFilter(
      `Uncaught exception: ${err.message}`
    );

    if (loadingInterval) {
      clearInterval(loadingInterval);
    }

    db.end(() => {
      process.exit(1);
    });
  }
);

// =====================================================
// RUN
// =====================================================

startApp();
