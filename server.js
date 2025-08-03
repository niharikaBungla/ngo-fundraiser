// server.js - Node.js Backend with Express
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// In-memory database (replace with MongoDB/PostgreSQL in production)
let users = [
    {
        id: 1,
        name: "Alex Johnson",
        email: "alex@email.com",
        password: "password123", // In production, hash passwords!
        school: "Stanford University",
        referralCode: "ALEX2025",
        totalRaised: 5250,
        donationCount: 42,
        createdAt: new Date('2024-01-15')
    },
    {
        id: 2,
        name: "Sarah Chen",
        email: "sarah@email.com",
        password: "password123",
        school: "MIT",
        referralCode: "SARAH2025",
        totalRaised: 4800,
        donationCount: 38,
        createdAt: new Date('2024-01-20')
    },
    {
        id: 3,
        name: "Mike Rodriguez",
        email: "mike@email.com",
        password: "password123",
        school: "UC Berkeley",
        referralCode: "MIKE2025",
        totalRaised: 4200,
        donationCount: 35,
        createdAt: new Date('2024-01-10')
    },
    {
        id: 4,
        name: "Emma Davis",
        email: "emma@email.com",
        password: "password123",
        school: "Harvard",
        referralCode: "EMMA2025",
        totalRaised: 3950,
        donationCount: 31,
        createdAt: new Date('2024-01-25')
    },
    {
        id: 5,
        name: "David Park",
        email: "david@email.com",
        password: "password123",
        school: "UCLA",
        referralCode: "DAVID2025",
        totalRaised: 3600,
        donationCount: 28,
        createdAt: new Date('2024-01-30')
    }
];

let donations = [
    { id: 1, userId: 1, amount: 150, donorName: "John Smith", date: new Date('2024-12-01') },
    { id: 2, userId: 1, amount: 200, donorName: "Jane Doe", date: new Date('2024-12-02') },
    { id: 3, userId: 2, amount: 175, donorName: "Bob Wilson", date: new Date('2024-12-01') },
    { id: 4, userId: 3, amount: 300, donorName: "Lisa Brown", date: new Date('2024-12-03') }
];

const rewards = [
    { id: 1, title: "First Donation", description: "Receive your first donation", threshold: 1, icon: "🎯" },
    { id: 2, title: "Fundraising Rookie", description: "Raise $500", threshold: 500, icon: "🌟" },
    { id: 3, title: "Rising Star", description: "Raise $1,000", threshold: 1000, icon: "⭐" },
    { id: 4, title: "Fundraising Pro", description: "Raise $2,500", threshold: 2500, icon: "🏆" },
    { id: 5, title: "Top Performer", description: "Raise $5,000", threshold: 5000, icon: "👑" },
    { id: 6, title: "Fundraising Legend", description: "Raise $10,000", threshold: 10000, icon: "🎖️" }
];

// Helper Functions
function generateReferralCode(name) {
    return name.split(' ')[0].toUpperCase() + '2025';
}

function calculateRank(userId) {
    const sortedUsers = users.sort((a, b) => b.totalRaised - a.totalRaised);
    return sortedUsers.findIndex(user => user.id === userId) + 1;
}

function getUserRewards(totalRaised) {
    return rewards.map(reward => ({
        ...reward,
        unlocked: totalRaised >= reward.threshold
    }));
}

// API Routes

// 🔐 Authentication Routes
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
        success: true,
        user: userWithoutPassword,
        token: `fake-jwt-token-${user.id}` // In production, use real JWT
    });
});

app.post('/api/auth/signup', (req, res) => {
    const { name, email, password, school } = req.body;
    
    if (!name || !email || !password || !school) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ error: 'User already exists' });
    }
    
    const newUser = {
        id: users.length + 1,
        name,
        email,
        password, // In production, hash this!
        school,
        referralCode: generateReferralCode(name),
        totalRaised: 0,
        donationCount: 0,
        createdAt: new Date()
    };
    
    users.push(newUser);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
        success: true,
        user: userWithoutPassword,
        token: `fake-jwt-token-${newUser.id}`
    });
});

// 👤 User Routes
app.get('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    const rank = calculateRank(userId);
    
    res.json({
        ...userWithoutPassword,
        rank
    });
});

app.get('/api/users/:id/stats', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const userDonations = donations.filter(d => d.userId === userId);
    const rank = calculateRank(userId);
    
    res.json({
        totalRaised: user.totalRaised,
        donationCount: user.donationCount,
        rank,
        referralCode: user.referralCode,
        recentDonations: userDonations.slice(-5) // Last 5 donations
    });
});

// 🏆 Rewards Routes
app.get('/api/rewards', (req, res) => {
    res.json(rewards);
});

app.get('/api/users/:id/rewards', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const userRewards = getUserRewards(user.totalRaised);
    res.json(userRewards);
});

// 🥇 Leaderboard Routes
app.get('/api/leaderboard', (req, res) => {
    const sortedUsers = users
        .map(({ password, ...user }) => user) // Remove passwords
        .sort((a, b) => b.totalRaised - a.totalRaised)
        .map((user, index) => ({
            ...user,
            rank: index + 1
        }));
    
    res.json(sortedUsers);
});

app.get('/api/leaderboard/top/:limit', (req, res) => {
    const limit = parseInt(req.params.limit) || 10;
    const sortedUsers = users
        .map(({ password, ...user }) => user)
        .sort((a, b) => b.totalRaised - a.totalRaised)
        .slice(0, limit)
        .map((user, index) => ({
            ...user,
            rank: index + 1
        }));
    
    res.json(sortedUsers);
});

// 💰 Donations Routes
app.get('/api/donations', (req, res) => {
    const allDonations = donations.map(donation => {
        const user = users.find(u => u.id === donation.userId);
        return {
            ...donation,
            internName: user ? user.name : 'Unknown'
        };
    });
    
    res.json(allDonations);
});

app.get('/api/users/:id/donations', (req, res) => {
    const userId = parseInt(req.params.id);
    const userDonations = donations.filter(d => d.userId === userId);
    
    res.json(userDonations);
});

app.post('/api/donations', (req, res) => {
    const { userId, amount, donorName } = req.body;
    
    if (!userId || !amount || !donorName) {
        return res.status(400).json({ error: 'userId, amount, and donorName are required' });
    }
    
    const user = users.find(u => u.id === parseInt(userId));
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const newDonation = {
        id: donations.length + 1,
        userId: parseInt(userId),
        amount: parseFloat(amount),
        donorName,
        date: new Date()
    };
    
    donations.push(newDonation);
    
    // Update user stats
    user.totalRaised += newDonation.amount;
    user.donationCount += 1;
    
    res.status(201).json({
        success: true,
        donation: newDonation,
        newStats: {
            totalRaised: user.totalRaised,
            donationCount: user.donationCount,
            rank: calculateRank(user.id)
        }
    });
});

// 📊 Analytics Routes
app.get('/api/analytics/overview', (req, res) => {
    const totalUsers = users.length;
    const totalRaised = users.reduce((sum, user) => sum + user.totalRaised, 0);
    const totalDonations = donations.length;
    const averagePerUser = totalRaised / totalUsers;
    
    res.json({
        totalUsers,
        totalRaised,
        totalDonations,
        averagePerUser: Math.round(averagePerUser * 100) / 100
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 FundRaise Pro Backend Server running on port ${PORT}`);
    console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    console.log('\n📋 Available Endpoints:');
    console.log('   POST /api/auth/login');
    console.log('   POST /api/auth/signup');
    console.log('   GET  /api/users/:id');
    console.log('   GET  /api/users/:id/stats');
    console.log('   GET  /api/users/:id/rewards');
    console.log('   GET  /api/users/:id/donations');
    console.log('   GET  /api/rewards');
    console.log('   GET  /api/leaderboard');
    console.log('   GET  /api/leaderboard/top/:limit');
    console.log('   GET  /api/donations');
    console.log('   POST /api/donations');
    console.log('   GET  /api/analytics/overview');
    console.log('   GET  /api/health');
});

module.exports = app;