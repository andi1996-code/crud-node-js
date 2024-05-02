const express = require('express');
const mysql = require('mysql');
const BodyParser = require('body-parser');
const XLSX = require('xlsx');
const { saveAs } = require('file-saver');


const app = express();

app.use(BodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', 'views');

//buatkan koneksi db mysql
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_data'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Mysql Connected...');

    //get data
    app.get('/', (req, res) => {
        const sql = 'SELECT id, DATE_FORMAT(date, "%Y-%m-%d") AS date, rate, tax FROM data_rate'; // Menggunakan DATE_FORMAT untuk memastikan format tanggal
        db.query(sql, (err, result) => {
            const users = JSON.parse(JSON.stringify(result));
            res.render('index', { users: users, title: 'Form Input' });
        })
    })

    //insert data
    app.post('/addrate', (req, res) => {
        const insertSql = 'INSERT INTO data_rate (id, date, rate, tax) VALUES (?, ?, ?, ?)';
        const values = [req.body.id, req.body.date, req.body.rate, req.body.tax];
        db.query(insertSql, values, (err, result) => {
            if (err) {
                console.error("Error inserting data: ", err);
                res.status(500).send("Error inserting data");
                return;
            }
            console.log("Data inserted successfully");
            res.redirect('/');
        });
    });

    //delete data
    app.get('/delete/:id', (req, res) => {
        const deleteSql = 'DELETE FROM data_rate WHERE id = ?';
        db.query(deleteSql, [req.params.id], (err, result) => {
            if (err) {
                console.error("Error deleting data: ", err);
                res.status(500).send("Error deleting data");
                return;
            }
            console.log("Data deleted successfully");
            res.redirect('/');
        });
    })

    // export data to Excel
    app.get('/export-excel', (req, res) => {
        const sql = 'SELECT * FROM data_rate';
        db.query(sql, (err, result) => {
            if (err) {
                console.error("Error fetching data: ", err);
                res.status(500).send("Error fetching data");
                return;
            }
            const users = JSON.parse(JSON.stringify(result));
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(users);
            const dateFormat = 'dd/mm/yyyy'; // Atur format tanggal yang diinginkan
            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
                const dateCell = XLSX.utils.encode_cell({ c: 3, r: rowNum }); // Menggunakan kolom kedua, karena kolom pertama adalah 'id'
                if (ws[dateCell]) {
                    ws[dateCell].t = 'd'; // Mengatur tipe sel menjadi tanggal
                    ws[dateCell].z = dateFormat; // Mengatur format tanggal
                }
            }
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
            res.attachment('data_rate.xlsx');
            res.send(wbout);
        });
    });

})


app.listen(3000, () => {
    console.log('Server Ready Port 3000');
});