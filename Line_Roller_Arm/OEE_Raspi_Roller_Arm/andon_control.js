const mysql = require('mysql');
const util = require('util');
const { exec, spawn } = require('child_process');
const psTree = require('ps-tree');

// Load environment variables from a .env file if needed
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'wanda',
    password: process.env.DB_PASSWORD || 'raspberrypi',
    database: process.env.DB_NAME || 'atabase_tps_roller_arm',
    port: process.env.DB_PORT || 3306
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL server.');
});

// Promisify query for easier async/await usage
const query = util.promisify(connection.query).bind(connection);

let lastAndonStatus = null;
let audioProcess = null;

function killProcessTree(pid) {
    psTree(pid, (err, children) => {
        if (err) {
            console.error('Error fetching process tree:', err);
            return;
        }
        [pid].concat(children.map(p => p.PID)).forEach(tpid => {
            try {
                process.kill(tpid, 'SIGTERM');
            } catch (e) {
                console.error('Error killing process:', e);
            }
        });
    });
}

async function fetchData() {
    try {
        const rows = await query('SELECT id, andon FROM table_andon ORDER BY id ASC LIMIT 1');

        if (rows.length > 0) {
            const currentAndonStatus = rows[0].andon;
            console.log(rows[0]);

            if (currentAndonStatus === 'ON' && lastAndonStatus !== 'ON') {
                if (audioProcess) {
                    console.log('Killing previous audio process');
                    killProcessTree(audioProcess.pid);
                    audioProcess = null;
                }
                console.log('Playing ON audio');
                audioProcess = spawn('mpg123', ['/home/raspi_server_hla/on/project_oee_production/media/10.mp3']);
                audioProcess.on('error', (err) => {
                    console.error('Error playing sound:', err);
                });
            }

            if (currentAndonStatus === 'OFF' && lastAndonStatus !== 'OFF') {
                if (audioProcess) {
                    console.log('Killing previous audio process');
                    killProcessTree(audioProcess.pid);
                    audioProcess = null;
                }
                console.log('Playing OFF audio');
                audioProcess = spawn('mpg123', ['/home/raspi_server_hla/on/project_oee_production/media/selesai.mp3']);
                audioProcess.on('error', (err) => {
                    console.error('Error playing sound:', err);
                });
            }

            lastAndonStatus = currentAndonStatus;
        }
    } catch (err) {
        console.error('Error fetching data:', err);
    }
}

const interval = setInterval(fetchData, 1000); // Execute fetchData every second

process.on('SIGINT', () => {
    clearInterval(interval); // Clear interval to stop the fetchData loop
    if (audioProcess) {
        killProcessTree(audioProcess.pid);
    }
    connection.end(err => {
        if (err) {
            console.error('Error closing the connection:', err);
        } else {
            console.log('Connection closed.');
        }
        process.exit();
    });
});
