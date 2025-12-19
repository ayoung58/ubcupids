# AI Setup for Matching System

The UBCupids matching system uses AI in two ways, **both completely FREE** through HuggingFace:

1. **Text Embeddings** - Convert open-ended responses to vectors for semantic similarity
2. **Profile Summaries** - Generate concise summaries for cupids to review

## Required API Key

You only need **ONE** API key: **HuggingFace API Token** (100% FREE!)

### Getting Your Free HuggingFace API Token

1. Go to [https://huggingface.co/join](https://huggingface.co/join)
2. Create a free account (no credit card required)
3. Navigate to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
4. Click "New token"
5. Give it a name (e.g., "UBCupids Matching")
6. Select "Read" permissions (default)
7. Click "Generate"
8. Copy the token (starts with `hf_...`)

### Add to Environment Variables

Add this line to your `.env` file:

```env
HUGGINGFACE_API_KEY=hf_YourTokenHere
```

That's it! No paid subscriptions needed.

---

## Models Used

### 1. Text Embeddings: `sentence-transformers/all-MiniLM-L6-v2`

**Purpose:** Convert text responses (Q60-Q63) into 384-dimensional vectors for semantic similarity comparison.

**Why this model:**

- FREE on HuggingFace Inference API
- Fast inference (~100ms per text)
- High quality embeddings for short texts
- 384 dimensions (good balance of quality vs speed)

**Rate Limits:**

- Free tier: ~1,000 requests per hour
- For 250 users × 4 questions = 1,000 requests (perfect fit!)

### 2. Profile Summaries: `mistralai/Mistral-7B-Instruct-v0.2`

**Purpose:** Generate concise personality summaries and key traits for cupid review.

**Why this model:**

- FREE on HuggingFace Inference API
- Excellent instruction following (better than GPT-3.5 for structured outputs)
- Fast inference (~5-10 seconds per summary)
- High quality text generation

**Rate Limits:**

- Free tier: ~1,000 requests per hour
- For 250 users = 250 requests (well within limits)

**First-time usage note:** The model may need to "warm up" on first request (20-30 seconds). The code automatically retries once if this happens.

---

## Fallback Behavior

If HuggingFace API is unavailable or the key is missing, the system uses fallbacks:

### Text Embeddings Fallback

- Uses deterministic hash-based vectors
- **Not recommended for production** but fine for testing
- Ensures the system doesn't crash

### Profile Summaries Fallback

- Generates basic summaries from questionnaire responses
- Extracts traits based on answer patterns
- **Good enough for MVP** but AI summaries are much better

---

## Testing AI Integration

### Test Text Embeddings

```bash
npx tsx -e "
import { generateEmbedding, cosineSimilarity } from './lib/matching/ai';

const text1 = 'I love hiking and outdoor adventures';
const text2 = 'I enjoy nature walks and mountain climbing';
const text3 = 'I prefer staying indoors and gaming';

Promise.all([
  generateEmbedding(text1),
  generateEmbedding(text2),
  generateEmbedding(text3)
]).then(([e1, e2, e3]) => {
  console.log('Similar texts:', cosineSimilarity(e1, e2).toFixed(3));
  console.log('Different texts:', cosineSimilarity(e1, e3).toFixed(3));
});
"
```

**Expected output:**

```
Similar texts: 0.75-0.85
Different texts: 0.30-0.50
```

### Test Profile Summary Generation

```bash
npx tsx -e "
import { generateProfileSummary } from './lib/matching/ai';

const sampleResponses = {
  Q4: 'early-active',
  Q5: 'talk-out',
  Q10: 'wholesome-goofy',
  Q60: 'Honesty and communication are essential',
  Q61: 'I love urban planning and transit systems',
  Q62: 'I take time to open up but I'm loyal'
};

generateProfileSummary('test-user', sampleResponses, 'Alex', 21)
  .then(summary => console.log(JSON.stringify(summary, null, 2)));
"
```

**Expected output:**

```json
{
  "userId": "test-user",
  "firstName": "Alex",
  "age": 21,
  "summary": "Alex is an active, social person who values communication...",
  "keyTraits": ["Communicative", "Active", "Wholesome", "Loyal"],
  "lookingFor": "Someone who values honesty and can appreciate their passion for urban planning",
  "highlights": []
}
```

---

## Performance Expectations

### During Matching Algorithm Run (250 users)

| Operation         | Count                           | Time       | Total          |
| ----------------- | ------------------------------- | ---------- | -------------- |
| Text Embeddings   | 1,000 (250 users × 4 questions) | 100ms each | ~100 seconds   |
| Profile Summaries | 250                             | 5-10s each | ~20-40 minutes |

**Total time:** ~25-45 minutes for initial run

**Note:** Results are cached in the database, so subsequent runs are instant!

### Caching Strategy

- **Embeddings:** Cached in `TextEmbedding` table (keyed by userId + questionId)
- **Summaries:** Cached in `CupidProfileSummary` table (keyed by userId)
- **Cache invalidation:** Uses SHA-256 hash of responses; regenerates if responses change

---

## Troubleshooting

### "Model is loading" error

**Cause:** HuggingFace models go to sleep after inactivity

**Solution:** The code automatically waits 20 seconds and retries. First request may be slow.

**Manual retry:**

```bash
# Just run the matching algorithm again - it will retry
curl -X POST http://localhost:3000/api/matches/generate \
  -d '{"action": "run_matching", "batchNumber": 1}'
```

### Rate Limit Exceeded

**Cause:** Made too many requests in 1 hour (>1,000)

**Solution:**

- Wait 1 hour for rate limit reset
- Or batch your requests (the code already does this)
- Consider upgrading to HuggingFace Pro ($9/month for unlimited)

### Slow Performance

**Cause:** HuggingFace free tier can be slower during peak hours

**Solutions:**

- Run matching during off-peak hours (late night PST)
- Results are cached, so slowness is only on first run
- Consider HuggingFace Pro for faster inference

### API Key Invalid

**Error:** `Authorization header is invalid`

**Solution:**

1. Regenerate token at https://huggingface.co/settings/tokens
2. Ensure token starts with `hf_`
3. Update `.env` file
4. Restart dev server

---

## Cost Analysis

| Service     | Model               | Free Tier    | Cost for 250 users |
| ----------- | ------------------- | ------------ | ------------------ |
| HuggingFace | all-MiniLM-L6-v2    | 1,000 req/hr | **$0.00**          |
| HuggingFace | Mistral-7B-Instruct | 1,000 req/hr | **$0.00**          |
| **TOTAL**   |                     |              | **$0.00**          |

**For comparison:**

- OpenAI GPT-3.5-turbo would cost ~$0.05-0.10 per summary × 250 = **$12.50-25.00**
- OpenAI text-embedding-3-small would cost ~$0.0001 per text × 1000 = **$0.10**

**Using HuggingFace saves $12.60-25.10 per matching run!**

---

## Production Considerations

### For MVP (250 users)

- ✅ Free tier is perfect
- ✅ No credit card needed
- ✅ Cache keeps it fast after first run

### For Scale (1,000+ users)

Consider:

- HuggingFace Pro ($9/month) for faster inference
- Self-hosting Mistral-7B on your own server
- Using OpenAI for summaries only (embeddings stay free)

### Recommendation

Start with free HuggingFace. Only upgrade if you need faster speeds or hit rate limits consistently.

---

## Alternative Free Models

If Mistral-7B is slow or unavailable, you can switch to:

### Option 1: Flan-T5 Large (Faster, lower quality)

```typescript
// In lib/matching/config.ts
export const SUMMARY_MODEL = "google/flan-t5-large";
```

### Option 2: Llama-2-7B (Similar quality)

```typescript
// In lib/matching/config.ts
export const SUMMARY_MODEL = "meta-llama/Llama-2-7b-chat-hf";
```

No code changes needed - just update the model name!

---

## Need Help?

- HuggingFace docs: https://huggingface.co/docs/api-inference
- Model cards:
  - [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
  - [Mistral-7B-Instruct-v0.2](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2)
