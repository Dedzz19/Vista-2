const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;
const SECRET_KEY = 'your_secret_key'; // Replace with a secure secret key


app.use(bodyParser.json());
app.use(cors()); // Enable CORS

const users = [
    { id: 1, username: 'Sean', email: 'seanomoera@gmail.com', password: '$2a$10$uIQiJ5.YuYbVVKwJwTYvGOkXKAPsxcjqh65fV0hFfrXJmnrbmfvaG' }, // Example hashed password
    { id: 2, username: 'Danladi Ogunle', email: 'bob@example.com', password: '$2a$10$39jN6UhfjIPeTec95BQhteHLhx0c4WJqfH6ww0ti7DHnF4s/RGX52' } // Example hashed password
];
const requests = []; // Array to store requests

// Register a new user
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const newUser = { id, username, email, password: hashedPassword };
    users.push(newUser);
    res.status(201).json(newUser);
});

// Login user and generate JWT
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({ message: 'Cannot find user' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(403).json({ message: 'Invalid credentials' });

    const accessToken = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' }); // Generate token
    res.json({ accessToken });
});

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Protected route example (requires JWT authentication)
app.get('/user', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});


// Middleware to clean up old requests older than 10 minutes
setInterval(() => {
    const tenMinutesAgo = moment().subtract(10, 'minutes');
    for (let i = requests.length - 1; i >= 0; i--) {
        if (moment(requests[i].timestamp).isBefore(tenMinutesAgo)) {
            requests.splice(i, 1); // Remove request if older than 10 minutes
        }
    }
}, 60 * 1000); // Run every minute (adjust as needed)

// Endpoint to store requests
app.post('/store-request', (req, res) => {
    const { requestId, requestData } = req.body; // Assuming you have requestId and requestData

    // Store request with current timestamp
    const timestamp = moment();
    requests.push({ id: requestId, data: requestData, timestamp });

    res.status(200).json({ message: 'Request stored successfully' });
});

// Endpoint to retrieve all stored requests
app.get('/requests', (req, res) => {
    res.json(requests);
});