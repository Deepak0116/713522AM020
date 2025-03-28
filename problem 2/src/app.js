const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const app = express();
const cache = new NodeCache({ stdTTL: 60 }); 
const BASE_URL = 'http://20.244.56.144/test';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzMTQ5MDI1LCJpYXQiOjE3NDMxNDg3MjUsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImMzZGUzZmI4LWMwZjMtNDhkMC05NzI0LTkwZDBmZjM5ZmQ3NSIsInN1YiI6ImRlZXBha2FpbWwwMTE2QGdtYWlsLmNvbSJ9LCJjb21wYW55TmFtZSI6ImdvTWFydCIsImNsaWVudElEIjoiYzNkZTNmYjgtYzBmMy00OGQwLTk3MjQtOTBkMGZmMzlmZDc1IiwiY2xpZW50U2VjcmV0IjoiT2RzaGhObmJNWlBKd3F1cSIsIm93bmVyTmFtZSI6IlJhZ2h1bCIsIm93bmVyRW1haWwiOiJkZWVwYWthaW1sMDExNkBnbWFpbC5jb20iLCJyb2xsTm8iOiI3MTM1MjJBTTAyMCJ9.27LgMMWyHd3AmjyEUidxzWfC9VnY24ylwm5SczEXO9Q';
axios.defaults.headers.common['Authorization'] = `Bearer ${TOKEN}`;
async function fetchWithCache(url, cacheKey) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) return cachedData;
    const response = await axios.get(url);
    cache.set(cacheKey, response.data);
    return response.data;
}
app.get('/users', async (req, res) => {
    try {
        const users = await fetchWithCache(`${BASE_URL}/users`, 'users');
        const userPostCounts = new Map();
        for (const userId in users.users) {
            const posts = await fetchWithCache(`${BASE_URL}/users/${userId}/posts`, `posts-${userId}`);
            userPostCounts.set(userId, posts.length || 0);
        }
const response = {
            users: {}
        };
        Array.from(userPostCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([userId, _]) => {
                response.users[userId] = users.users[userId];
            });
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/posts', async (req, res) => {
    try {
        const { type = 'latest' } = req.query;
        const postsResponse = await axios.get(`${BASE_URL}/posts`, {
            params: { type }
        });
        if (type === 'popular') {
            const post = postsResponse.data[0]; 
            if (post && post.id) {
                const commentsResponse = await axios.get(`${BASE_URL}/posts/${post.id}/comments`);
                return res.json({
                    comments: commentsResponse.data.comments || []
                });
            }
            return res.json({ comments: [] });
        } else {
           
            return res.json(postsResponse.data.slice(0, 5));
        }
    } catch (error) {
        console.error('Error details:', error.response?.data || error.message);
        return res.status(500).json({ 
            error: 'Failed to fetch posts',
            details: error.response?.data || error.message 
        });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
    console.error('Failed to start server:', error.message);
});