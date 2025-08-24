const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db'); // Import the database connection pool

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/img', express.static(path.join(__dirname, 'img')));

// Multer Storage Configuration (This part stays the same)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'img/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage: storage });

// --- API Endpoints ---

// Login Endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await db.execute('SELECT password_hash FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const hash = rows[0].password_hash;
        const isMatch = await bcrypt.compare(password, hash);
        if (isMatch) {
            res.status(200).json({ message: 'Login successful.' });
        } else {
            res.status(401).json({ message: 'Invalid credentials.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error.');
    }
});

// Change Password Endpoint
app.post('/api/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const [rows] = await db.execute('SELECT password_hash FROM users WHERE username = ?', ['admin']);
        if (rows.length === 0) return res.status(404).send('Admin user not found.');
        
        const hash = rows[0].password_hash;
        const isMatch = await bcrypt.compare(currentPassword, hash);
        if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect.' });
        
        const newHash = await bcrypt.hash(newPassword, 10);
        await db.execute('UPDATE users SET password_hash = ? WHERE username = ?', [newHash, 'admin']);
        res.status(200).json({ message: 'Password changed successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error.');
    }
});

// Get All Photos Endpoint
app.get('/api/photos', async (req, res) => {
    try {
        const [photos] = await db.execute('SELECT id, src, title, description, date, displayOrder AS `order` FROM photos ORDER BY displayOrder ASC');
        res.json(photos);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error reading photo data.');
    }
});

// Upload Photos Endpoint
app.post('/api/upload', upload.array('photos', 100), async (req, res) => {
    try {
        const { title, date, description } = req.body;
        const [maxOrderRow] = await db.execute('SELECT MAX(displayOrder) as maxOrder FROM photos');
        let maxOrder = maxOrderRow[0].maxOrder || 0;

        for (const [index, file] of req.files.entries()) {
            const photoTitle = title || file.originalname;
            const photoDate = date || new Date().toISOString().split('T')[0];
            const photoDescription = description || '';

            const sql = 'INSERT INTO photos (src, title, description, date, uploadDate, displayOrder) VALUES (?, ?, ?, ?, ?, ?)';
            await db.execute(sql, [
                `img/${file.filename}`,
                req.files.length > 1 ? `${photoTitle} (${index + 1})` : photoTitle,
                photoDescription,
                photoDate,
                new Date(),
                ++maxOrder
            ]);
        }
        res.status(201).json({ message: 'Photos uploaded successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving photo data.');
    }
});

// Delete Photo Endpoint
app.delete('/api/photos/:id', async (req, res) => {
    try {
        const photoId = Number(req.params.id);
        const [rows] = await db.execute('SELECT src FROM photos WHERE id = ?', [photoId]);
        if (rows.length === 0) return res.status(404).send('Photo not found.');

        // Delete the file
        fs.unlink(path.join(__dirname, rows[0].src), (err) => {
            if (err) console.error("Error deleting file:", err);
        });
        
        // Delete the database record
        await db.execute('DELETE FROM photos WHERE id = ?', [photoId]);
        res.status(200).json({ message: 'Photo deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error.');
    }
});

// Reorder Photos Endpoint
app.post('/api/photos/order', async (req, res) => {
    try {
        const { order } = req.body; // Array of photo IDs
        for (const [index, photoId] of order.entries()) {
            await db.execute('UPDATE photos SET displayOrder = ? WHERE id = ?', [index + 1, photoId]);
        }
        res.status(200).json({ message: 'Gallery order updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving new order.');
    }
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});