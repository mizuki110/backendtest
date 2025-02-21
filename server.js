const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors({ origin: '*' })); // Allow all origins
app.use(express.json());

app.get('/api/roblox/user/:username', async (req, res) => {
  try {
    const username = req.params.username;
    
    // First API call - Get user ID (Updated API)
    const userResponse = await axios.post(
      'https://users.roblox.com/v1/usernames/users',
      { usernames: [username], excludeBannedUsers: false },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    // Check if user exists
    if (!userResponse.data || !userResponse.data.data.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResponse.data.data[0].id;

    // Second API call - Get detailed user info
    const profileResponse = await axios.get(`https://users.roblox.com/v1/users/${userId}`);

    // Third API call - Get user profile picture (PFP)
    const pfpResponse = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
    
    const pfpUrl = pfpResponse.data?.data?.[0]?.imageUrl || '';

    // Check if profile data exists
    if (!profileResponse.data) {
      return res.status(404).json({ error: 'Could not fetch user profile' });
    }

    // Prepare user data
    const userData = {
      id: userId,
      name: profileResponse.data.name,
      displayName: profileResponse.data.displayName || username,
      description: profileResponse.data.description || '',
      created: profileResponse.data.created,
      isBanned: profileResponse.data.isBanned || false,
      profilePicture: pfpUrl
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching Roblox data:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response?.status === 404) {
      res.status(404).json({ error: 'User not found' });
    } else if (error.response?.status === 403) {
      res.status(403).json({ error: 'Access forbidden. API may have rate limits.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch user data. Please try again later.' });
    }
  }
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
