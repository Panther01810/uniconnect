/**
 * Database Seeding Script
 * Creates test accounts and sample data for development/testing
 * Run with: node backend/scripts/seed.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import models
const User = require('../models/User');
const Post = require('../models/Post');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kyu-connect';

// Test account data - Instagram-style realistic accounts
const testUsers = [
  {
    username: 'sarah.adventures',
    email: 'sarah@example.com',
    password: 'SecurePass123!',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    bio: '✈️ Travel enthusiast | 📸 Photographer | 🌍 Explorer',
    profilePicture: 'https://i.pravatar.cc/200?img=1',
    location: 'San Francisco, CA',
    websiteUrl: 'https://sarahmitchell.com',
    followers: []
  },
  {
    username: 'david.fitness',
    email: 'david@example.com',
    password: 'SecurePass123!',
    firstName: 'David',
    lastName: 'Chen',
    bio: '💪 Fitness Coach | 🏋️ Gym Enthusiast | 🥗 Nutrition Tips',
    profilePicture: 'https://i.pravatar.cc/200?img=2',
    location: 'Los Angeles, CA',
    websiteUrl: 'https://davidchen-fitness.com',
    followers: []
  },
  {
    username: 'emma.design',
    email: 'emma@example.com',
    password: 'SecurePass123!',
    firstName: 'Emma',
    lastName: 'Rodriguez',
    bio: '🎨 Graphic Designer | 💻 UI/UX | 🌈 Creative Mind',
    profilePicture: 'https://i.pravatar.cc/200?img=3',
    location: 'New York, NY',
    websiteUrl: 'https://emmadesigns.io',
    followers: []
  },
  {
    username: 'marcus.tech',
    email: 'marcus@example.com',
    password: 'SecurePass123!',
    firstName: 'Marcus',
    lastName: 'Johnson',
    bio: '👨‍💻 Full Stack Developer | 🚀 Tech Evangelist | 🤖 AI Enthusiast',
    profilePicture: 'https://i.pravatar.cc/200?img=4',
    location: 'Seattle, WA',
    websiteUrl: 'https://marcustech.dev',
    followers: []
  },
  {
    username: 'olivia.food',
    email: 'olivia@example.com',
    password: 'SecurePass123!',
    firstName: 'Olivia',
    lastName: 'Williams',
    bio: '🍳 Food Blogger | 👨‍🍳 Home Chef | 🌮 Foodie',
    profilePicture: 'https://i.pravatar.cc/200?img=5',
    location: 'Austin, TX',
    websiteUrl: 'https://oliviacooks.blog',
    followers: []
  },
  {
    username: 'james.music',
    email: 'james@example.com',
    password: 'SecurePass123!',
    firstName: 'James',
    lastName: 'Anderson',
    bio: '🎵 Musician | 🎸 Guitar Player | 🎼 Producer',
    profilePicture: 'https://i.pravatar.cc/200?img=6',
    location: 'Nashville, TN',
    websiteUrl: 'https://jamesandersonmusic.com',
    followers: []
  },
  {
    username: 'sophia.art',
    email: 'sophia@example.com',
    password: 'SecurePass123!',
    firstName: 'Sophia',
    lastName: 'Thompson',
    bio: '🎭 Artist | 🖌️ Digital Art | ✨ Creative Expression',
    profilePicture: 'https://i.pravatar.cc/200?img=7',
    location: 'Brooklyn, NY',
    websiteUrl: 'https://sophiathompson.art',
    followers: []
  },
  {
    username: 'alex.photography',
    email: 'alex@example.com',
    password: 'SecurePass123!',
    firstName: 'Alex',
    lastName: 'Kumar',
    bio: '📷 Photographer | 🌅 Nature & Landscape | 🎬 Videographer',
    profilePicture: 'https://i.pravatar.cc/200?img=8',
    location: 'Denver, CO',
    websiteUrl: 'https://alexkumarphotography.com',
    followers: []
  },
  {
    username: 'jessica.fashion',
    email: 'jessica@example.com',
    password: 'SecurePass123!',
    firstName: 'Jessica',
    lastName: 'Bennett',
    bio: '👗 Fashion Influencer | 💄 Style Tips | ✨ Glamour',
    profilePicture: 'https://i.pravatar.cc/200?img=9',
    location: 'Los Angeles, CA',
    websiteUrl: 'https://jessicabennett-fashion.com',
    followers: []
  },
  {
    username: 'nathan.gaming',
    email: 'nathan@example.com',
    password: 'SecurePass123!',
    firstName: 'Nathan',
    lastName: 'Pierce',
    bio: '🎮 Gamer | 🏆 Esports | 📺 Content Creator',
    profilePicture: 'https://i.pravatar.cc/200?img=10',
    location: 'Chicago, IL',
    websiteUrl: 'https://nathanpierce-gaming.twitch.tv',
    followers: []
  }
];

// Sample posts for each user
const samplePostsContent = [
  {
    caption: 'Just finished an amazing hike! 🥾⛰️ #nature #hiking #outdoors',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500'
  },
  {
    caption: 'Coffee and coding sessions ☕💻 #developer #morning #coffeelover',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500'
  },
  {
    caption: 'Sunset vibes 🌅✨ #sunset #evening #nature',
    image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500'
  },
  {
    caption: 'Gym day! 💪🔥 #fitness #workout #motivation',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500'
  },
  {
    caption: 'Homemade pasta night 🍝👨‍🍳 #foodblog #cooking #homemade',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500'
  },
  {
    caption: 'Weekend vibes with friends 🎉👯 #friends #weekend #fun',
    image: 'https://images.unsplash.com/photo-1503066211613-c17ebc9daef0?w=500'
  },
  {
    caption: 'New design project release! 🎨✨ #design #ui #ux',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500'
  },
  {
    caption: 'Concert night! 🎸🎵 #music #livemusic #concert',
    image: 'https://images.unsplash.com/photo-1460749411175-04ec19b151df?w=500'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Post.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create test users
    console.log('👥 Creating test users...');
    const createdUsers = [];
    
    for (const userData of testUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`  ✅ Created user: ${user.username}`);
    }

    // Create follower relationships (create some following network)
    console.log('🔗 Setting up follower relationships...');
    const followerMap = {
      0: [1, 2, 4, 5],        // sarah follows david, emma, olivia, james
      1: [0, 2, 3],           // david follows sarah, emma, marcus
      2: [0, 1, 3, 6],        // emma follows sarah, david, marcus, sophia
      3: [1, 2, 7],           // marcus follows david, emma, alex
      4: [2, 5, 8],           // olivia follows emma, james, jessica
      5: [0, 4, 9],           // james follows sarah, olivia, nathan
      6: [2, 7],              // sophia follows emma, alex
      7: [0, 3, 6],           // alex follows sarah, marcus, sophia
      8: [4, 5, 6],           // jessica follows olivia, james, sophia
      9: [1, 3, 7]            // nathan follows david, marcus, alex
    };

    for (const [followerId, followingIds] of Object.entries(followerMap)) {
      const user = createdUsers[parseInt(followerId)];
      for (const followingId of followingIds) {
        const followingUser = createdUsers[followingId];
        user.followers.push(followingUser._id);
        if (!followingUser.followers) followingUser.followers = [];
      }
      await user.save();
    }
    console.log('✅ Follower relationships created');

    // Create sample posts
    console.log('📝 Creating sample posts...');
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      // Each user gets 2-3 sample posts
      const postCount = Math.floor(Math.random() * 2) + 2;
      
      for (let j = 0; j < postCount; j++) {
        const samplePost = samplePostsContent[Math.floor(Math.random() * samplePostsContent.length)];
        const post = await Post.create({
          content: samplePost.caption,
          imageUrl: samplePost.image,
          author: user._id,
          comments: [],
          likes: [],
          createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) // Random date within last 10 days
        });
        console.log(`  ✅ Created post for ${user.username}`);
      }
    }

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📋 Test Accounts Created:');
    console.log('================================');
    createdUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: SecurePass123!`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log('');
    });

    console.log('🔓 Default Password for all accounts: SecurePass123!');
    console.log('\n💡 Tip: Use these credentials to test the application');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

// Run seed function
seedDatabase();