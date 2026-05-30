const express = require('express');
const { body, validationResult } = require('express-validator');
const OpenAI = require('openai');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// AI conversation history (in production, use database)
const conversationHistory = new Map();

// @desc    Chat with AI assistant
// @route   POST /api/ai/chat
// @access  Private
router.post('/chat', protect, [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('context')
    .optional()
    .isIn(['general', 'dating', 'profile', 'conversation', 'safety'])
    .withMessage('Invalid context')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { message, context = 'general' } = req.body;
    const userId = req.user._id.toString();

    // Get or initialize conversation history
    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, []);
    }

    const history = conversationHistory.get(userId);

    // Add user message to history
    history.push({ role: 'user', content: message });

    // Keep only last 20 messages to avoid token limits
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    // Create system prompt based on context
    let systemPrompt = `You are KYU Connect's AI dating assistant. You help university students with dating advice, profile optimization, conversation starters, and relationship guidance. Be friendly, supportive, and appropriate. Keep responses concise but helpful.`;

    switch (context) {
      case 'dating':
        systemPrompt += ` Focus on general dating advice and relationship guidance.`;
        break;
      case 'profile':
        systemPrompt += ` Focus on profile creation, bio writing, and photo selection advice.`;
        break;
      case 'conversation':
        systemPrompt += ` Focus on conversation starters, messaging tips, and communication skills.`;
        break;
      case 'safety':
        systemPrompt += ` Focus on online safety, red flags, and healthy relationship practices.`;
        break;
    }

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7
      });

      const aiResponse = completion.choices[0].message.content;

      // Add AI response to history
      history.push({ role: 'assistant', content: aiResponse });

      res.json({
        success: true,
        response: aiResponse,
        context
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);

      // Fallback responses for common queries
      const fallbackResponse = getFallbackResponse(message, context);

      // Add fallback response to history
      history.push({ role: 'assistant', content: fallbackResponse });

      res.json({
        success: true,
        response: fallbackResponse,
        context,
        fallback: true
      });
    }
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get AI suggestions
// @route   GET /api/ai/suggestions/:type
// @access  Private
router.get('/suggestions/:type', protect, async (req, res) => {
  try {
    const { type } = req.params;
    let suggestions = [];

    switch (type) {
      case 'conversation-starters':
        suggestions = [
          "What's the most interesting thing about you that isn't in your bio?",
          "If you could instantly master any skill, what would it be?",
          "What's your go-to comfort food and why?",
          "What's the best piece of advice you've ever received?",
          "What's a movie or show you could watch over and over?",
          "If you could travel anywhere right now, where would you go?",
          "What's your favorite way to spend a weekend?",
          "What's something you're passionate about?"
        ];
        break;

      case 'profile-tips':
        suggestions = [
          "Use a clear, high-quality profile picture",
          "Write a bio that shows your personality",
          "Include your interests and hobbies",
          "Be specific about what you're looking for",
          "Keep it positive and authentic",
          "Mention your university and year",
          "Add a touch of humor if it fits your style",
          "Update regularly to show you're active"
        ];
        break;

      case 'safety-tips':
        suggestions = [
          "Never share personal information early",
          "Use the app's messaging system initially",
          "Video call before meeting in person",
          "Tell a friend about your plans",
          "Trust your instincts",
          "Report any suspicious behavior",
          "Take things slowly",
          "Be aware of your surroundings when meeting"
        ];
        break;

      case 'date-ideas':
        suggestions = [
          "Coffee shop conversation",
          "Campus library study date",
          "Local café with board games",
          "Walk in a nearby park",
          "Museum or art gallery visit",
          "Bowling or mini-golf",
          "Cooking class together",
          "Hiking or outdoor activity",
          "Movie night with discussion",
          "Visit a local market or fair"
        ];
        break;

      default:
        suggestions = [
          "Focus on shared interests",
          "Ask open-ended questions",
          "Be genuine and authentic",
          "Listen more than you talk",
          "Keep it light and fun initially",
          "Respect boundaries",
          "Be patient and don't rush",
          "Stay positive and encouraging"
        ];
    }

    res.json({
      success: true,
      suggestions,
      type
    });
  } catch (error) {
    console.error('Get AI suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Analyze profile compatibility
// @route   POST /api/ai/compatibility
// @access  Private
router.post('/compatibility', protect, [
  body('userInterests')
    .isArray()
    .withMessage('User interests must be an array'),
  body('otherInterests')
    .isArray()
    .withMessage('Other interests must be an array'),
  body('userBio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('otherBio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userInterests, otherInterests, userBio, otherBio } = req.body;

    // Calculate interest overlap
    const commonInterests = userInterests.filter(interest =>
      otherInterests.some(otherInterest =>
        otherInterest.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(otherInterest.toLowerCase())
      )
    );

    const compatibilityScore = Math.min(
      Math.round((commonInterests.length / Math.max(userInterests.length, otherInterests.length)) * 100),
      100
    );

    // Generate compatibility analysis
    let analysis = '';
    if (compatibilityScore >= 80) {
      analysis = 'Excellent match! You share many interests and could have great chemistry.';
    } else if (compatibilityScore >= 60) {
      analysis = 'Good potential! You have some shared interests that could lead to meaningful conversations.';
    } else if (compatibilityScore >= 40) {
      analysis = 'Fair match. You might have different interests, but that could bring fresh perspectives.';
    } else {
      analysis = 'Limited overlap in interests, but sometimes opposites attract!';
    }

    if (commonInterests.length > 0) {
      analysis += ` Common interests: ${commonInterests.join(', ')}.`;
    }

    res.json({
      success: true,
      compatibility: {
        score: compatibilityScore,
        commonInterests,
        analysis
      }
    });
  } catch (error) {
    console.error('Compatibility analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Clear conversation history
// @route   DELETE /api/ai/history
// @access  Private
router.delete('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    conversationHistory.delete(userId);

    res.json({
      success: true,
      message: 'Conversation history cleared'
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Fallback responses when OpenAI is unavailable
function getFallbackResponse(message, context) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('profile') || lowerMessage.includes('bio')) {
    return "For a great profile bio, be authentic and specific! Include your interests, what you're looking for, and add personality. Keep it 2-3 sentences and show your unique self. Authenticity attracts genuine connections!";
  }

  if (lowerMessage.includes('conversation') || lowerMessage.includes('talk') || lowerMessage.includes('message')) {
    return "Great conversation starters: 'What's the most interesting thing about you?', 'What's your favorite way to spend weekends?', or 'If you could travel anywhere, where would you go?' Ask follow-up questions and show genuine interest!";
  }

  if (lowerMessage.includes('safe') || lowerMessage.includes('safety')) {
    return "Safety first! Never share personal info early, use app messaging initially, video call before meeting, tell friends your plans, trust your instincts, and report suspicious behavior. Your safety matters most!";
  }

  if (lowerMessage.includes('match') || lowerMessage.includes('compatible')) {
    return "Find compatible matches by completing your profile, using filters, reading bios carefully, and focusing on shared interests. Quality over quantity - be selective and genuine in your interactions!";
  }

  // Default fallback
  return "I'm here to help with dating advice, profile tips, conversation starters, and safety guidance. Feel free to ask me anything about connecting with others on KYU Connect!";
}

module.exports = router;