const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
require('dotenv').config()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// In-memory storage
const users = {};
let userIdCounter = 1;

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// POST /api/users to create a new user
app.post('/api/users', (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }
    const userId = userIdCounter++;
    users[userId] = { _id: userId.toString(), username, exercises: [] };
    res.json(users[userId]);
});

// GET /api/users to list all users
app.get('/api/users', (req, res) => {
    const allUsers = Object.values(users).map(userData=>({'_id':userData._id.toString(),'username':userData.username}));
    res.json(allUsers);
});

// POST /api/users/:_id/exercises to add an exercise
app.post('/api/users/:_id/exercises', (req, res) => {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    const user = users[userId];
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (!description || !duration) {
        return res.status(400).json({ error: 'Description and duration are required' });
    }


    const exerciseDate = date ? new Date(date) : new Date();
    const exercise = { description, duration:Number(duration), date: exerciseDate.toDateString() };
    console.log('user',{user,...exercise});
    res.json({_id:user._id,username:user.username,...exercise});
    user.exercises.push(exercise);
});

// GET /api/users/:_id/logs to get exercise log
app.get('/api/users/:_id/logs', (req, res) => {
    const userId = req.params._id;
    const user = users[userId];

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const { from, to, limit } = req.query;
    let logs = user.exercises;

    // Filter logs by date range
    if (from || to) {
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;

        logs = logs.filter(log => {
            const logDate = new Date(log.date);
            return (!fromDate || logDate >= fromDate) && (!toDate || logDate <= toDate);
        });
    }

    // Limit the number of logs returned
    if (limit) {
        logs = logs.slice(0, Number(limit));
    }

    res.json({ _id: userId, username: user.username, count: logs.length, log: logs });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
