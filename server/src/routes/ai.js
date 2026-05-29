import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/suggest', async (req, res) => {
  try {
    const { text, type } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text is required for suggestions' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not configured');
      return res.status(500).json({ error: 'AI Assistant is not configured on the server' });
    }

    let systemPrompt = `You are a social media expert. Given the following social media post text, suggest 5 catchy titles, 5 relevant hashtags, and 3 quick related ideas. 
    Include emojis in the titles and ideas, but keep it professional (use only 1-2 relevant emojis per item). Do not overdo emojis.
    Format the response as a valid JSON object with EXACTLY these keys:
    {
      "titles": ["title1", "title2", ...],
      "hashtags": ["#tag1", "#tag2", ...],
      "ideas": ["idea1", "idea2", ...]
    }
    Return ONLY the JSON string. Do not use markdown blocks like \`\`\`json or \`\`\`.`;

    if (type === 'ideas') {
      systemPrompt = `You are a social media expert. Given the following social media post text, suggest 3 quick related ideas. 
      Include emojis in the ideas, but keep it professional (use only 1-2 relevant emojis per item).
      Format the response as a valid JSON object with EXACTLY this key:
      {
        "ideas": ["idea1", "idea2", "idea3"]
      }
      Return ONLY the JSON string. Do not use markdown blocks like \`\`\`json or \`\`\`.`;
    } else if (type === 'hashtags') {
      systemPrompt = `You are a social media expert. Given the following social media post text, suggest 5 relevant hashtags.
      Format the response as a valid JSON object with EXACTLY this key:
      {
        "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
      }
      Return ONLY the JSON string. Do not use markdown blocks like \`\`\`json or \`\`\`.`;
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    let parsedData;
    
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", content);
      return res.status(500).json({ error: 'Failed to generate suggestions. Please try again.' });
    }

    res.json(parsedData);
  } catch (error) {
    console.error('Error in AI Assistant route:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to process AI request' });
  }
});

export default router;
