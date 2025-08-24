const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '127.0.0.1',      // Your XAMPP MySQL host
    user: 'root',           // Default XAMPP username
    password: '',           // Default XAMPP password is empty
    database: 'photo_gallery_db', // The database you just created
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('Database connection pool created.');

module.exports = pool;