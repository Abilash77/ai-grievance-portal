/**
 * fakeDetection.js
 *
 * Backend service that uses the Gemini API to analyse a grievance complaint
 * and return a structured fake-detection verdict.
 *
 * Score guide:
 *   0  – 39  → genuine
 *   40 – 69  → suspicious
 *   70 – 100 → likely fake / spam
 */

const https = require('https');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = 'gemini-2.5-flash';
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Call Gemini REST API
 * @param {string} promptText
 * @returns {Promise<string>} raw text response
 */
function callGemini(promptText) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 300 },
    });

    const url = new URL(GEMINI_URL);
    const options = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          resolve(text);
        } catch (e) {
          reject(new Error('Failed to parse Gemini response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Keyword-based fallback when Gemini is unavailable
 */
function keywordFallback(title, description) {
  const combined = (title + ' ' + description).toLowerCase().trim();
  const wordCount = combined.split(/\s+/).length;

  // Very short
  if (wordCount < 5) {
    return { isFake: true, score: 80, verdict: 'fake', reason: 'Complaint is extremely short and lacks meaningful details.' };
  }

  // Spam-like repetition
  const words   = combined.split(/\s+/);
  const unique  = new Set(words).size;
  const ratio   = unique / words.length;
  if (ratio < 0.3 && wordCount > 5) {
    return { isFake: true, score: 75, verdict: 'fake', reason: 'Complaint contains highly repetitive text typical of spam.' };
  }

  // Gibberish patterns
  const gibberish = /([a-z])\1{3,}|^[^a-z]{0,3}$/i;
  if (gibberish.test(combined)) {
    return { isFake: true, score: 72, verdict: 'fake', reason: 'Complaint appears to contain gibberish or random characters.' };
  }

  return { isFake: false, score: 15, verdict: 'genuine', reason: 'Complaint appears genuine (AI analysis unavailable).' };
}

/**
 * Main export: analyse a complaint and return a fake-detection result.
 *
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} [params.department]
 * @param {string} [params.category]
 * @param {boolean} [params.hasVoiceNote]
 * @param {boolean} [params.hasProof]
 * @returns {Promise<{isFake: boolean, score: number, verdict: string, reason: string, checkedAt: Date}>}
 */
async function detectFakeComplaint({ title, description, department = '', category = '', hasVoiceNote = false, hasProof = false }) {
  const checkedAt = new Date();

  if (!GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set — using keyword fallback for fake detection.');
    return { ...keywordFallback(title, description), checkedAt };
  }

  const prompt = `You are an AI fraud detection system for a government citizen grievance portal.

Analyse the complaint below and assign a FAKE SCORE from 0 to 100:
  0-39  = Genuine complaint
  40-69 = Suspicious (possibly fake or needs review)
  70-100 = Likely fake, spam, or malicious

Detection criteria (check ALL):
1. Vagueness — no specific location, no concrete incident, no identifiable issue
2. Spam / gibberish — random characters, repeated words, no real meaning
3. Implausible claims — contradictory or physically impossible statements
4. Copy-paste generic text — obviously templated, non-personal language
5. Abusive content — threats, slurs, or harassment disguised as a complaint
6. Extremely short with no substance — fewer than 15 meaningful words
7. Credibility boost factors: having a voice note (hasVoiceNote=true) or proof document (hasProof=true) slightly reduces suspicion

Complaint details:
  Department:  ${department || 'Not specified'}
  Category:    ${category || 'Not specified'}
  Title:       ${title}
  Description: ${description}
  Has voice note: ${hasVoiceNote}
  Has proof file: ${hasProof}

Respond ONLY with a valid JSON object in this exact format — no markdown, no extra text:
{"score": <number 0-100>, "verdict": "<genuine|suspicious|fake>", "reason": "<one concise sentence explaining the score>"}`;

  try {
    const raw = await callGemini(prompt);

    // Strip possible markdown code fences
    const cleaned = raw.replace(/```json|```/gi, '').trim();
    const parsed  = JSON.parse(cleaned);

    const score   = Math.max(0, Math.min(100, Number(parsed.score) || 0));
    const verdict = score >= 70 ? 'fake' : score >= 40 ? 'suspicious' : 'genuine';
    const reason  = parsed.reason || 'AI analysis complete.';
    const isFake  = verdict === 'fake';

    return { isFake, score, verdict, reason, checkedAt };
  } catch (err) {
    console.error('❌ Gemini fake detection failed, using fallback:', err.message);
    return { ...keywordFallback(title, description), checkedAt };
  }
}

module.exports = { detectFakeComplaint };
