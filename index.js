const { time } = require('console');
const express = require('express');
const os = require('os');
const app = express();
const PORT = 3000;

app.use(express.static('public'));

let formattedDate = '';
const apiKey ='';

async function fetchData() {

    const now = new Date();

    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = String(now.getFullYear());
    const time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

    formattedDate = `${month}/${day}/${year}`;

    console.log(formattedDate + ' ' + time);

    const url = `https://www3.whentowork.com/cgi-bin/w2wC.dll/api/AssignedShiftList?start_date=${formattedDate}&end_date=${formattedDate}&key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        return data.AssignedShiftList
            .map(shift => ({
                firstName: shift.FIRST_NAME,
                lastName: shift.LAST_NAME,
                positionName: shift.POSITION_NAME,
                categoryName: shift.CATEGORY_NAME,
                startTime: shift.START_TIME,
                endTime: shift.END_TIME,
                shiftDisc: shift.DESCRIPTION,
                date: formattedDate,
            }));

    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
}

app.get('/shifts', async (req, res) => {
    const shifts = await fetchData();
    res.json(shifts);
});

// Function to get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    return 'localhost';
}

// Listen on all network interfaces (0.0.0.0) to enable LAN access
app.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`Today's date: ${formattedDate + time}`);
    console.log(`Server running on:`);
    console.log(`  Local:    http://localhost:${PORT}`);
    console.log(`  Network:  http://${localIP}:${PORT}`);
    console.log(`\nOther devices on your LAN can access it at: http://${localIP}:${PORT}`);
});
