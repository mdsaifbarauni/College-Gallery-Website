const bcrypt = require('bcrypt');
const fs = require('fs');

// --- STEP 1: Change this value to your new password ---
const plainPassword = 'saif@9852'; 
const saltRounds = 10; 

console.log('Hashing new password...');

bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }

    const credentials = {
        username: 'admin',
        passwordHash: hash
    };

    fs.writeFile('credentials.json', JSON.stringify(credentials, null, 2), (writeErr) => {
        if (writeErr) {
            console.error('Error saving credentials file:', writeErr);
            return;
        }
        console.log('Password has been reset. credentials.json is updated.');
    });
});