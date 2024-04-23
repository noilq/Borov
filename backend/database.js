const mysql = require('mysql')

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'borov'
});

db.connect((err) => {
    if(err) {
        console.error('Error while connection to database: ' + err)
        return
    }
    console.log('Connected to database')
});

module.exports = db