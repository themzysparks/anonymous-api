const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL connection setup
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // PostgreSQL connection string from Render
    ssl: {
        rejectUnauthorized: false
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' folder

// Function to create table if it doesn't exist
async function createTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(query);
        console.log("✅ Messages table is ready!");
    } catch (err) {
        console.error("❌ Error creating table:", err);
    }
}
createTable();

// Fetch all messages
app.get('/messages', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM messages ORDER BY timestamp DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add a new message
app.post('/messages', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Message content is required" });

        const result = await pool.query(
            'INSERT INTO messages (content) VALUES ($1) RETURNING *',
            [message]
        );

        res.json({ success: true, message: result.rows[0] });  // ✅ Include success field
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});

// Delete a message
app.delete('/messages/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: "Message not found" });

        res.json({ success: true, message: "Message deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
