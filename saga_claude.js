// TRUNCATE TABLE common_rail_1_transit_manhour;

const pool = require('./config/db_core');
const MIN_ACTUAL_PCS = 5; // ✅ Threshold PCS
const HOLIDAYS = new Set([]); // Daftar hari libur (kosong untuk sekarang)

// ============== KONFIGURASI MANPOWER DAN setup_ct ==============
const PRODUCT_CONFIG = {
  /* ======================= PG 2.2 ======================= */
  "ASHOK H6A": { manpower: 3, setup_ct: 234, linegai: 124 },
  "P3263":     { manpower: 3, setup_ct: 406, linegai: 124 },
  "P3267":     { manpower: 0, setup_ct: 332, linegai: 124 },
  "MDE8":      { manpower: 0, setup_ct: 0,   linegai: 124 },
  "E494":      { manpower: 0, setup_ct: 0,   linegai: 124 },
  "902FA":     { manpower: 3, setup_ct: 91,  linegai: 124 },
  "4N13":      { manpower: 0, setup_ct: 104, linegai: 124 },
  "VM":        { manpower: 0, setup_ct: 65,  linegai: 124 },
  "VM USA":    { manpower: 0, setup_ct: 107, linegai: 124 },
  "RT56":      { manpower: 0, setup_ct: 65,  linegai: 124 },
  "JDE20":     { manpower: 0, setup_ct: 0,   linegai: 124 },
  "902F I":    { manpower: 4, setup_ct: 98,  linegai: 124 },
  "902F E":    { manpower: 0, setup_ct: 88,  linegai: 124 },
  "RT50":      { manpower: 0, setup_ct: 167, linegai: 124 },
  "Ashok N4":  { manpower: 4, setup_ct: 269, linegai: 124 },
  "Ashok N6":  { manpower: 3, setup_ct: 412, linegai: 124 },
  "N4":        { manpower: 0, setup_ct: 0,   linegai: 124 },
  "634F":      { manpower: 0, setup_ct: 0,   linegai: 124 },
  "RZ4E-B":    { manpower: 4, setup_ct: 94.5,linegai: 124 },
  "4N16":      { manpower: 4, setup_ct: 82,  linegai: 124 }, 
  
  /* ======================= PG 2.1 ======================= */
  "YD25":      { manpower: 0, setup_ct: 107, linegai: 124 },
  "YD2K3":     { manpower: 4, setup_ct: 104, linegai: 124 },
  "4N15 C":    { manpower: 0, setup_ct: 107, linegai: 124 },
  "4D56":      { manpower: 0, setup_ct: 0,   linegai: 124 },
  "CR22 B":    { manpower: 0, setup_ct: 94.8,linegai: 124 },
  "S320":      { manpower: 4, setup_ct: 92,  linegai: 124 },
  "902F C":    { manpower: 4, setup_ct: 80,  linegai: 124 },
  "415F":      { manpower: 0, setup_ct: 97,  linegai: 124 },
  "1KD":       { manpower: 0, setup_ct: 0,   linegai: 124 },
  "GD B":      { manpower: 4, setup_ct: 82,  linegai: 124 },
  "902F B":    { manpower: 4, setup_ct: 80.5,linegai: 124 },
  "902FG":     { manpower: 4, setup_ct: 80.4,linegai: 124 },
  "RG01 B":    { manpower: 4, setup_ct: 91.9,linegai: 124 },
  "902FD":     { manpower: 4, setup_ct: 86.4,linegai: 124 },
  "19MY":      { manpower: 0, setup_ct: 102, linegai: 124 },
  "RZ4E-A":    { manpower: 0, setup_ct: 102, linegai: 124 },
  "902F-F":    { manpower: 4, setup_ct: 88.4,linegai: 124 },
  "ES01-B":    { manpower: 4, setup_ct: 93.7,linegai: 124 },
  
};

// Fungsi untuk mendapatkan konfigurasi produk berdasarkan nama produk
function getProductConfig(productName) {
  if (!productName) return { manpower: 0, setup_ct: 0, linegai: 124 };
  
  const cleanProductName = productName.trim();
  
  // Cari exact match
  if (PRODUCT_CONFIG[cleanProductName]) {
    return PRODUCT_CONFIG[cleanProductName];
  }
  
  // Coba cari partial match (untuk handle kemungkinan format berbeda)
  const matchingKey = Object.keys(PRODUCT_CONFIG).find(key => {
    const searchKey = key.toLowerCase();
    const searchProduct = cleanProductName.toLowerCase();
    return searchProduct.includes(searchKey) || searchKey.includes(searchProduct);
  });
  
  if (matchingKey) {
    return PRODUCT_CONFIG[matchingKey];
  }
  
  return { manpower: 0, setup_ct: 0, linegai: 124 }; // Default jika tidak ditemukan
}

// ============== FUNGSI HELPER ==============
function getDayName(date) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
}

function createTimeForDate(baseDate, hour, minute, second = 0) {
  const date = new Date(baseDate);
  date.setHours(hour, minute, second, 0);
  return date;
}

function isHoliday(date) {
  const dateStr = date.toISOString().split('T')[0];
  return HOLIDAYS.has(dateStr);
}

// ============== FUNGSI DETERMINASI SHIFT ==============
function getShiftFromTime(dateTime) {
  const hour = dateTime.getHours();
  const minute = dateTime.getMinutes();
  const totalMinutes = hour * 60 + minute;
  
  // Shift 1: 07:10 - 20:10
  const shift1Start = 7 * 60 + 10; // 07:10
  const shift1End = 20 * 60 + 10;  // 20:10
  
  if (totalMinutes >= shift1Start && totalMinutes < shift1End) {
    return 'Shift 1';
  } else {
    return 'Shift 2';
  }
}

// ============== BREAK SCHEDULES ==============
function getDailyBreakSchedulesForDate(dateInput) {
  if (isHoliday(dateInput)) return [];
  
  const dayName = getDayName(dateInput);
  const isFriday = dayName === 'Jumat';
  const schedules = [];

  if (isFriday) {
    schedules.push(
      { start: createTimeForDate(dateInput, 9, 20), end: createTimeForDate(dateInput, 9, 30) },
      { start: createTimeForDate(dateInput, 11, 40), end: createTimeForDate(dateInput, 12, 50) },
      { start: createTimeForDate(dateInput, 14, 50), end: createTimeForDate(dateInput, 15, 0) },
      { start: createTimeForDate(dateInput, 16, 30), end: createTimeForDate(dateInput, 16, 40) },
      { start: createTimeForDate(dateInput, 16, 40), end: createTimeForDate(dateInput, 17, 0) },
      { start: createTimeForDate(dateInput, 18, 0), end: createTimeForDate(dateInput, 18, 30) }
    );
  } else {
    schedules.push(
      { start: createTimeForDate(dateInput, 9, 20), end: createTimeForDate(dateInput, 9, 30) },
      { start: createTimeForDate(dateInput, 12, 0), end: createTimeForDate(dateInput, 12, 40) },
      { start: createTimeForDate(dateInput, 14, 20), end: createTimeForDate(dateInput, 14, 30) },
      { start: createTimeForDate(dateInput, 16, 0), end: createTimeForDate(dateInput, 16, 10) },
      { start: createTimeForDate(dateInput, 16, 10), end: createTimeForDate(dateInput, 16, 30) },
      { start: createTimeForDate(dateInput, 18, 30), end: createTimeForDate(dateInput, 19, 0) }
    );
  }

  // Jadwal Shift 2
  schedules.push(
    { start: createTimeForDate(dateInput, 21, 50), end: createTimeForDate(dateInput, 22, 0) },
    { start: createTimeForDate(dateInput, 0, 0), end: createTimeForDate(dateInput, 0, 10) },
    { start: createTimeForDate(dateInput, 2, 10), end: createTimeForDate(dateInput, 2, 50) },
    { start: createTimeForDate(dateInput, 4, 40), end: createTimeForDate(dateInput, 4, 50) }
  );

  const nextDay = new Date(dateInput);
  nextDay.setDate(dateInput.getDate() + 1);
  schedules.push({ start: createTimeForDate(nextDay, 4, 50), end: createTimeForDate(nextDay, 5, 10) });

  return schedules;
}

function getBreakSchedulesForDateRange(startDate, endDate) {
  const allSchedules = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  const endLoopDate = new Date(endDate);
  endLoopDate.setHours(0, 0, 0, 0);

  while (currentDate <= endLoopDate) {
    const dailySchedules = getDailyBreakSchedulesForDate(currentDate);
    allSchedules.push(...dailySchedules);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return allSchedules;
}

function calculateBreakTime(startTime, stopTime) {
  if (startTime >= stopTime) return 0;

  const startDay = new Date(startTime);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(stopTime);
  endDay.setHours(0, 0, 0, 0);

  const allSchedules = getBreakSchedulesForDateRange(startDay, endDay);
  let totalBreakSeconds = 0;

  for (const { start, end } of allSchedules) {
    const overlapStart = new Date(Math.max(start.getTime(), startTime.getTime()));
    const overlapEnd = new Date(Math.min(end.getTime(), stopTime.getTime()));

    if (overlapStart < overlapEnd) {
      totalBreakSeconds += (overlapEnd - overlapStart) / 1000;
    }
  }
  return totalBreakSeconds;
}

// ============== SHIFT START TIME ==============
function getShiftStartTime(stopTime) {
  const hour = stopTime.getHours();
  const minute = stopTime.getMinutes();
  const shiftStart = new Date(stopTime);
  
  if (getShiftFromTime(stopTime) === 'Shift 1') {
    shiftStart.setHours(7, 10, 0, 0);
  } else {
    if (hour > 19 || (hour === 19 && minute >= 50)) {
      shiftStart.setHours(19, 50, 0, 0);
    } else {
      shiftStart.setDate(shiftStart.getDate() - 1);
      shiftStart.setHours(19, 50, 0, 0);
    }
  }
  
  return shiftStart;
}

// ============== LOADING TIME BY SHIFT ==============
function calculateLoadingTimeByShift(stopTime) {
  const shiftStartTime = getShiftStartTime(stopTime);
  const stopTimeDate = new Date(stopTime);
  
  const totalDurationSeconds = Math.floor((stopTimeDate - shiftStartTime) / 1000);
  const breakTimeSeconds = calculateBreakTime(shiftStartTime, stopTimeDate);
  const netDurationSeconds = Math.max(0, totalDurationSeconds - breakTimeSeconds);
  const netDurationMinutes = (netDurationSeconds / 60).toFixed(2);
  
  return {
    totalSeconds: totalDurationSeconds,
    breakSeconds: breakTimeSeconds,
    netSeconds: netDurationSeconds,
    netMinutes: parseFloat(netDurationMinutes),
    loadingTimeText: `${netDurationMinutes} menit`,
    shiftStartTime: shiftStartTime
  };
}

// ============== FIND START-STOP PAIRS ==============
function findStartStopPairs(rows) {
  const cycles = [];
  let startRecord = null;

  for (const row of rows) {
    if (row.status === 'START') {
      startRecord = row;
    } else if (row.status === 'STOP' && startRecord) {
      cycles.push({ start: startRecord, stop: row });
      startRecord = null;
    }
  }

  return cycles;
}

// ============== CALCULATE MANHOUR METRICS ==============
function calculateManhourMetrics(actual, cycleTime, loadingTime, manpower, manpowerHelp = 0, loadingTimeHelp = 0, fiveS = 10, linegai = 124) {
  // ⑥ manhour_in_line = manpower * loading_time
  const manhourInLine = manpower * loadingTime;
  
  // ⑦ manhour_helper = manpower_help * loading_time_manpower_help
  const manhourHelper = manpowerHelp * loadingTimeHelp;
  
  // ⑧ manhour_five_s = manpower * five_s
  const manhourFiveS = manpower * fiveS;
  
  // ⑨ linegai = 124 (default)
  
  // ⑩ total_manhour = manhour_in_line + manhour_helper + manhour_five_s + linegai
  const totalManhour = manhourInLine + manhourHelper + manhourFiveS + linegai;
  
  // ⑪ manhour_man_minutes_per_pcs = total_manhour / actual
  const manhourPerPcs = actual > 0 ? (totalManhour / actual).toFixed(4) : '0';
  
  // PE = ((actual * cycle_time) / 60 / loading_time) * 100
  const pe = loadingTime > 0 ? (((actual * cycleTime) / 60 / loadingTime) * 100).toFixed(2) : '0';
  
  return {
    manhourInLine: manhourInLine.toFixed(2),
    manhourHelper: manhourHelper.toFixed(2),
    manhourFiveS: manhourFiveS.toFixed(2),
    totalManhour: totalManhour.toFixed(2),
    manhourPerPcs: manhourPerPcs,
    pe: pe
  };
}

// ============== CALCULATE PRODUCTION METRICS ==============
function calculateProductionMetrics(cycles) {
  const processedRecords = [];

  for (const cycle of cycles) {
    const { start, stop } = cycle;
    
    const startActual = parseInt(start.actual) || 0;
    const stopActual = parseInt(stop.actual) || 0;
    const produced = stopActual - startActual;

    if (produced < MIN_ACTUAL_PCS) {
      continue;
    }

    const startTime = new Date(start.created_at);
    const stopTime = new Date(stop.created_at);
    
    // Hitung durasi START-STOP untuk delta_time
    const totalDurationSec = Math.floor((stopTime - startTime) / 1000);
    const breakTimeSec = calculateBreakTime(startTime, stopTime);
    const netDurationSec = Math.max(0, totalDurationSec - breakTimeSec);

    const totalDurationMin = (totalDurationSec / 60).toFixed(2);
    const breakTimeMin = (breakTimeSec / 60).toFixed(2);
    const netDurationMin = (netDurationSec / 60).toFixed(2);

    // Hitung loading time berdasarkan shift
    const loadingTimeData = calculateLoadingTimeByShift(stopTime);
    
    const productConfig = getProductConfig(start.name_product);
    
    // Cycle time dalam detik (asumsi dari database)
    const cycleTime = parseFloat(start.cycle_time) / 10 || 0;
    
    // Hitung manhour metrics
    const manhourMetrics = calculateManhourMetrics(
      produced,
      cycleTime,
      loadingTimeData.netMinutes,
      productConfig.manpower,
      0, // manpower_help (default 0)
      0, // loading_time_manpower_help (default 0)
      10, // five_s (default 10 menit)
      productConfig.linegai
    );

    // ✅ TAMBAHAN: Hitung pcs_hour
    // pcs_hour = actual / (loading_time * 60)
    const loadingTimeHours = loadingTimeData.netMinutes / 60;
    const pcsHour = loadingTimeHours > 0 ? (produced / loadingTimeHours).toFixed(2) : '0';

    // Siapkan records
    const startRecord = prepareRecord(
      start, 
      startTime, 
      productConfig,
      produced,
      totalDurationMin,
      breakTimeMin,
      loadingTimeData,
      manhourMetrics,
      pcsHour  // ✅ TAMBAHAN: Pass pcs_hour
    );

    const stopRecord = prepareRecord(
      stop,
      stopTime,
      productConfig,
      produced,
      totalDurationMin,
      breakTimeMin,
      loadingTimeData,
      manhourMetrics,
      pcsHour  // ✅ TAMBAHAN: Pass pcs_hour
    );

    processedRecords.push(startRecord, stopRecord);
  }

  console.log(`📈 ${processedRecords.length} record memenuhi kriteria produksi (≥ ${MIN_ACTUAL_PCS} pcs)`);
  return processedRecords;
}

// ============== PREPARE RECORD ==============
function prepareRecord(originalRecord, time, productConfig, produced, totalDuration, breakTime, loadingTimeData, manhourMetrics, pcsHour) {  // ✅ TAMBAHAN parameter pcsHour
  const record = { ...originalRecord };
  
  // Tambahkan kolom waktu
  record.year = time.getFullYear();
  record.month = time.getMonth() + 1;
  record.day = getDayName(time);
  record.shift = getShiftFromTime(time);
  record.time_only = time.toTimeString().split(' ')[0];
  
  // Tambahkan metrik produksi
  record.delta_time = `${produced} pcs dalam ${totalDuration} menit`;
  record.loading_time_server = loadingTimeData.loadingTimeText;
  record.total_break = parseFloat(breakTime);
  
  // ✅ TAMBAHAN: Set pcs_hour
  record.pcs_hour = pcsHour;
  
  // Tambahkan konfigurasi
  record.manpower = productConfig.manpower.toString();
  record.setup_ct = productConfig.setup_ct.toString();
  record.linegai = productConfig.linegai.toString();  // ✅ TAMBAHAN: Set linegai
  
  // Tambahkan manhour metrics (sesuai analisa)
  record.manpower_help = '0'; // Default
  record.loading_time_manpower_help = '0'; // Default
  record.five_s = '10'; // Default 10 menit
  record.manhour_in_line = manhourMetrics.manhourInLine;
  record.manhour_helper = manhourMetrics.manhourHelper;
  record.manhour_five_s = manhourMetrics.manhourFiveS;
  record.total_manhour = manhourMetrics.totalManhour;
  record.manhour_man_minutes_per_pcs = manhourMetrics.manhourPerPcs;
  record.pe = manhourMetrics.pe;
  
  // Kolom tambahan (dapat diisi sesuai kebutuhan)
  record.machine_fault_preq = originalRecord.machine_fault_preq || null;
  record.machine_fault_duration = originalRecord.machine_fault_duration || null;
  record.quality_check = originalRecord.quality_check || null;
  record.another = originalRecord.another || null;
  record.kaizen = originalRecord.kaizen || null;
  record.bottle_neck_process = originalRecord.bottle_neck_process || null;
  record.bottle_neck_process_duration = originalRecord.bottle_neck_process_duration || null;
  record.bottle_neck_mct = originalRecord.bottle_neck_mct || null;
  record.bottle_neck_mct_duration = originalRecord.bottle_neck_mct_duration || null;
  record.setup_manpower = originalRecord.setup_manpower || null;
  record.dangae = originalRecord.dangae || null;
  record.loading_time_start = originalRecord.loading_time_start || null;
  record.loading_time_stop = originalRecord.loading_time_stop || null;
  
  return record;
}

// ============== LAYER 1: SYNC SOURCE -> TRANSIT ==============
async function syncOneTable(sourceTable) {
  const targetTable = `${sourceTable}_transit_manhour`;
  const connection = await pool.getConnection();

  try {
    console.log(`\n🚀 Mulai sinkronisasi data dari ${sourceTable}...`);
    const [rows] = await connection.query(`
      SELECT *
      FROM ${sourceTable}
      WHERE status IN ('START', 'STOP')
    `);

    if (rows.length === 0) {
      console.log(`✅ Tidak ada data START/STOP pada ${sourceTable}.`);
      return;
    }

    console.log(`📦 ${sourceTable}: ditemukan ${rows.length} data.`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ${targetTable} LIKE ${sourceTable}
    `).catch(() => {});

    let processed = 0;

    for (const row of rows) {
      await connection.query(
        `
        INSERT INTO ${targetTable} (
          line_id, pg, line_name, name_product, target, actual,
          loading_time, efficiency, delay, cycle_time, status,
          time_trouble, time_trouble_quality, andon, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          pg = VALUES(pg),
          line_name = VALUES(line_name),
          name_product = VALUES(name_product),
          target = VALUES(target),
          actual = VALUES(actual),
          loading_time = VALUES(loading_time),
          efficiency = VALUES(efficiency),
          delay = VALUES(delay),
          cycle_time = VALUES(cycle_time),
          time_trouble = VALUES(time_trouble),
          time_trouble_quality = VALUES(time_trouble_quality),
          andon = VALUES(andon)
        `,
        [
          row.line_id, row.pg, row.line_name, row.name_product,
          row.target, row.actual, row.loading_time, row.efficiency,
          row.delay, row.cycle_time, row.status, row.time_trouble,
          row.time_trouble_quality, row.andon, row.created_at
        ]
      );
      processed++;
    }

    console.log(`✅ ${sourceTable} selesai — ${processed} data diproses.`);
  } catch (err) {
    console.error(`❌ Gagal sinkronisasi ${sourceTable}:`, err.message);
  } finally {
    connection.release();
  }
}

async function syncAllTables() {
  console.log("=== 🚀 Mulai sinkronisasi semua common_rail_X ke transit ===");

  for (let i = 1; i <= 12; i++) {
    await syncOneTable(`common_rail_${i}`);
  }

  console.log("\n✅ Semua tabel source -> transit sudah disinkronisasi.");
}

// ============== LAYER 2: PROCESS TRANSIT -> CORE ==============
async function processOneLine(sourceTable, targetTable) {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log(`\n🔄 Memproses ${sourceTable} -> ${targetTable}...`);

    const [maxCreatedResult] = await connection.query(`
      SELECT MAX(created_at) as latest_processed_created_at FROM ${targetTable}
    `);
    const latestProcessedCreatedAt = maxCreatedResult[0].latest_processed_created_at;
    console.log(`🔍 Tabel ${targetTable}: Waktu terakhir diproses adalah ${latestProcessedCreatedAt || 'NULL'}`);

    let sourceQuery = `
      SELECT * FROM ${sourceTable} 
      WHERE status IN ('START', 'STOP')
    `;
    let sourceParams = [];
    if (latestProcessedCreatedAt) {
      sourceQuery += ` AND created_at > ?`;
      sourceParams.push(latestProcessedCreatedAt);
    }
    sourceQuery += ` ORDER BY created_at ASC`;
    
    const [rows] = await connection.query(sourceQuery, sourceParams);
    
    if (rows.length === 0) {
      console.log(`✅ Tidak ada data baru di ${sourceTable}.`);
      return;
    }
    
    console.log(`📊 Ditemukan ${rows.length} record baru di ${sourceTable}.`);
    
    const cycles = findStartStopPairs(rows);
    
    if (cycles.length === 0) {
      console.log(`ℹ️ Tidak ada siklus START-STOP yang lengkap.`);
      return;
    }
    
    const processedRecords = calculateProductionMetrics(cycles);
    
    if (processedRecords.length === 0) {
      console.log(`ℹ️ Tidak ada siklus baru ≥ ${MIN_ACTUAL_PCS} pcs.`);
      return;
    }

    const sample = processedRecords[0];
    const columns = Object.keys(sample).filter(col => col !== 'id' && col !== 'id_uuid');
    
    const query = `
      INSERT IGNORE INTO ${targetTable} (${columns.join(', ')})
      VALUES ?
    `;

    const values = processedRecords.map(rec => columns.map(col => rec[col]));
    const [result] = await connection.query(query, [values]);

    console.log(`✅ ${targetTable}: ${result.affectedRows} record baru tersimpan`);
    
  } catch (err) {
    console.error(`❌ Error memproses ${sourceTable}:`, err.message);
  } finally {
    if (connection) connection.release();
  }
}

async function processAllLines() {
  console.log("\n=== 🚀 Mulai pemrosesan semua transit -> core ===");

  for (let i = 1; i <= 12; i++) {
    await processOneLine(`common_rail_${i}_transit_manhour`, `common_rail_${i}_core`);
  }

  console.log(`\n✅ Semua line transit -> core selesai diproses.`);
}

// ============== EKSEKUSI BERURUTAN ==============
(async () => {
  console.log("🕗 Proses dimulai pada:", new Date().toLocaleString('id-ID'));
  
  await syncAllTables();
  await processAllLines();
  
  console.log("\n🎉 Seluruh proses sinkronisasi selesai!");
  process.exit(0);
})();
