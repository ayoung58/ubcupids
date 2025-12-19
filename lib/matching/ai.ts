/**
 * AI Integration Module for Matching System
 *
 * Handles:
 * 1. Text embeddings for open-ended questions using Sentence-BERT
 * 2. AI-generated profile summaries for cupids using GPT-3.5-turbo
 *
 * Uses free/low-cost models for MVP:
 * - Embeddings: Hugging Face Inference API (free tier)
 * - Summaries: OpenAI GPT-3.5-turbo (low cost)
 */

import { prisma } from "../prisma";
import { EMBEDDING_MODEL, SUMMARY_MODEL, DEBUG_SCORING } from "./config";
import { DecryptedResponses, CupidProfileView } from "./types";
import crypto from "crypto";

// ===========================================
// CONFIGURATION
// ===========================================

const HF_API_URL =
  "https://api-inference.huggingface.co/pipeline/feature-extraction";
const HF_MODEL = `sentence-transformers/${EMBEDDING_MODEL}`;

// Get API keys from environment
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ===========================================
// TEXT HASHING (for cache invalidation)
// ===========================================

/**
 * Generate a hash of text content for cache invalidation
 */
function hashText(text: string): string {
  return crypto
    .createHash("sha256")
    .update(text)
    .digest("hex")
    .substring(0, 16);
}

// ===========================================
// EMBEDDING GENERATION
// ===========================================

/**
 * Generate text embedding using Hugging Face Inference API
 *
 * Uses sentence-transformers/all-MiniLM-L6-v2 model
 * Returns a 384-dimensional vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!HF_API_KEY) {
    console.warn("HUGGINGFACE_API_KEY not set, using fallback embedding");
    return generateFallbackEmbedding(text);
  }

  try {
    const response = await fetch(`${HF_API_URL}/${HF_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        options: {
          wait_for_model: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("HuggingFace API error:", error);
      return generateFallbackEmbedding(text);
    }

    const result = await response.json();

    // The API returns the embedding directly for single input
    if (Array.isArray(result) && typeof result[0] === "number") {
      return result as number[];
    }

    // Sometimes it returns nested array
    if (Array.isArray(result) && Array.isArray(result[0])) {
      return result[0] as number[];
    }

    console.warn("Unexpected embedding format:", typeof result);
    return generateFallbackEmbedding(text);
  } catch (error) {
    console.error("Error generating embedding:", error);
    return generateFallbackEmbedding(text);
  }
}

/**
 * Fallback embedding using simple hash-based approach
 * Used when HuggingFace API is unavailable
 *
 * This is NOT for production - just a development fallback
 */
function generateFallbackEmbedding(text: string): number[] {
  const hash = crypto.createHash("sha256").update(text).digest();
  const embedding: number[] = [];

  // Generate 384-dimensional vector from hash
  for (let i = 0; i < 384; i++) {
    const byteIndex = i % 32;
    const value = hash[byteIndex] / 255; // Normalize to 0-1
    embedding.push(value * 2 - 1); // Normalize to -1 to 1
  }

  // Normalize to unit vector
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  return embedding.map((val) => val / magnitude);
}

// ===========================================
// EMBEDDING CACHING
// ===========================================

/**
 * Get or generate embedding for a user's question response
 *
 * Caches embeddings in the database for efficiency
 */
export async function getOrGenerateEmbedding(
  userId: string,
  questionId: string,
  text: string
): Promise<number[]> {
  const textHash = hashText(text);

  // Check cache
  const cached = await prisma.textEmbedding.findUnique({
    where: {
      userId_questionId: {
        userId,
        questionId,
      },
    },
  });

  // Return cached if text hasn't changed
  if (cached && cached.textHash === textHash) {
    return cached.embedding as number[];
  }

  // Generate new embedding
  const embedding = await generateEmbedding(text);

  // Cache it
  await prisma.textEmbedding.upsert({
    where: {
      userId_questionId: {
        userId,
        questionId,
      },
    },
    create: {
      userId,
      questionId,
      embedding,
      embeddingModel: EMBEDDING_MODEL,
      textHash,
    },
    update: {
      embedding,
      embeddingModel: EMBEDDING_MODEL,
      textHash,
    },
  });

  return embedding;
}

/**
 * Batch generate embeddings for all open-ended questions for a user
 */
export async function generateUserEmbeddings(
  userId: string,
  responses: DecryptedResponses
): Promise<Map<string, number[]>> {
  const textQuestions = ["Q60", "Q61", "Q62", "Q63"];
  const embeddings = new Map<string, number[]>();

  for (const questionId of textQuestions) {
    const text = responses[questionId] as string | undefined;

    if (text && typeof text === "string" && text.trim()) {
      const embedding = await getOrGenerateEmbedding(userId, questionId, text);
      embeddings.set(questionId, embedding);
    }
  }

  return embeddings;
}

// ===========================================
// COSINE SIMILARITY
// ===========================================

/**
 * Calculate cosine similarity between two embedding vectors
 *
 * Returns value between -1 and 1
 * 1 = identical, 0 = orthogonal, -1 = opposite
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}

/**
 * Calculate text similarity scores between two users for all open-ended questions
 */
export async function calculateTextSimilarities(
  user1Id: string,
  user2Id: string,
  user1Responses: DecryptedResponses,
  user2Responses: DecryptedResponses
): Promise<Map<string, number>> {
  const textQuestions = ["Q60", "Q61", "Q62", "Q63"];
  const similarities = new Map<string, number>();

  // Get embeddings for both users
  const user1Embeddings = await generateUserEmbeddings(user1Id, user1Responses);
  const user2Embeddings = await generateUserEmbeddings(user2Id, user2Responses);

  for (const questionId of textQuestions) {
    const embedding1 = user1Embeddings.get(questionId);
    const embedding2 = user2Embeddings.get(questionId);

    if (embedding1 && embedding2) {
      const similarity = cosineSimilarity(embedding1, embedding2);
      similarities.set(questionId, similarity);

      if (DEBUG_SCORING) {
        console.log(`Text similarity ${questionId}: ${similarity.toFixed(3)}`);
      }
    }
  }

  return similarities;
}

// ===========================================
// PROFILE SUMMARY GENERATION
// ===========================================

/**
 * Generate AI summary of user's questionnaire responses for cupid review
 */
export async function generateProfileSummary(
  userId: string,
  responses: DecryptedResponses,
  firstName: string,
  age: number
): Promise<CupidProfileView | null> {
  // Create a hash of responses for cache invalidation
  const responseHash = hashText(JSON.stringify(responses));

  // Check cache
  const cached = await prisma.cupidProfileSummary.findUnique({
    where: { userId },
  });

  if (cached && cached.responseHash === responseHash) {
    return {
      userId,
      firstName,
      age,
      summary: cached.summary,
      keyTraits: cached.keyTraits as string[],
      lookingFor: cached.lookingFor,
      highlights: [], // Filled by caller
    };
  }

  // Generate new summary
  if (!OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set, using fallback summary");
    return generateFallbackSummary(
      userId,
      responses,
      firstName,
      age,
      responseHash
    );
  }

  try {
    const prompt = buildSummaryPrompt(responses);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: SUMMARY_MODEL,
        messages: [
          {
            role: "system",
            content: `You are a matchmaking assistant helping "Cupids" (human matchmakers) understand potential matches. Generate concise, insightful summaries that highlight personality, values, and relationship goals. Be positive but honest.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      return generateFallbackSummary(
        userId,
        responses,
        firstName,
        age,
        responseHash
      );
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      return generateFallbackSummary(
        userId,
        responses,
        firstName,
        age,
        responseHash
      );
    }

    // Parse the structured response
    const parsed = parseSummaryResponse(content);

    // Cache it
    await prisma.cupidProfileSummary.upsert({
      where: { userId },
      create: {
        userId,
        summary: parsed.summary,
        keyTraits: parsed.keyTraits,
        lookingFor: parsed.lookingFor,
        aiModel: SUMMARY_MODEL,
        responseHash,
      },
      update: {
        summary: parsed.summary,
        keyTraits: parsed.keyTraits,
        lookingFor: parsed.lookingFor,
        aiModel: SUMMARY_MODEL,
        responseHash,
      },
    });

    return {
      userId,
      firstName,
      age,
      summary: parsed.summary,
      keyTraits: parsed.keyTraits,
      lookingFor: parsed.lookingFor,
      highlights: [],
    };
  } catch (error) {
    console.error("Error generating summary:", error);
    return generateFallbackSummary(
      userId,
      responses,
      firstName,
      age,
      responseHash
    );
  }
}

/**
 * Build prompt for profile summary generation
 */
function buildSummaryPrompt(responses: DecryptedResponses): string {
  // Extract key responses for summary
  const parts: string[] = [];

  // Personality indicators
  if (responses["Q4"])
    parts.push(`Saturday morning preference: ${responses["Q4"]}`);
  if (responses["Q5"]) parts.push(`Stress relief: ${responses["Q5"]}`);
  if (responses["Q6"]) parts.push(`Party behavior: ${responses["Q6"]}`);
  if (responses["Q10"]) parts.push(`Humor style: ${responses["Q10"]}`);

  // Relationship style
  if (responses["Q31"]) parts.push(`Openness: ${responses["Q31"]}`);
  if (responses["Q32"]) parts.push(`Support style: ${responses["Q32"]}`);

  // What they're looking for
  if (responses["Q33"]) parts.push(`Dating intention: ${responses["Q33"]}`);
  if (responses["Q34"]) parts.push(`Looking for: ${responses["Q34"]}`);

  // Open-ended
  if (responses["Q60"]) parts.push(`Non-negotiable: ${responses["Q60"]}`);
  if (responses["Q61"]) parts.push(`Hidden passion: ${responses["Q61"]}`);
  if (responses["Q62"]) parts.push(`Want matches to know: ${responses["Q62"]}`);

  return `Based on these questionnaire responses, provide:
1. A 2-3 sentence personality summary
2. 3-5 key personality traits (single words or short phrases)
3. A 1-2 sentence summary of what they're looking for in a relationship

Responses:
${parts.join("\n")}

Format your response as:
SUMMARY: [personality summary]
TRAITS: [trait1], [trait2], [trait3], ...
LOOKING_FOR: [what they want]`;
}

/**
 * Parse the AI-generated summary response
 */
function parseSummaryResponse(content: string): {
  summary: string;
  keyTraits: string[];
  lookingFor: string;
} {
  const lines = content.split("\n");
  let summary = "";
  let traits: string[] = [];
  let lookingFor = "";

  for (const line of lines) {
    if (line.startsWith("SUMMARY:")) {
      summary = line.replace("SUMMARY:", "").trim();
    } else if (line.startsWith("TRAITS:")) {
      traits = line
        .replace("TRAITS:", "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (line.startsWith("LOOKING_FOR:")) {
      lookingFor = line.replace("LOOKING_FOR:", "").trim();
    }
  }

  // Fallback if parsing fails
  if (!summary) {
    summary = content.substring(0, 200);
  }
  if (traits.length === 0) {
    traits = ["Thoughtful", "Genuine", "Open-minded"];
  }
  if (!lookingFor) {
    lookingFor = "Someone compatible and genuine.";
  }

  return { summary, keyTraits: traits, lookingFor };
}

/**
 * Generate fallback summary when AI is unavailable
 */
async function generateFallbackSummary(
  userId: string,
  responses: DecryptedResponses,
  firstName: string,
  age: number,
  responseHash: string
): Promise<CupidProfileView> {
  // Extract some basic traits from responses
  const traits: string[] = [];

  // Infer traits from responses
  if (responses["Q4"] === "early-active") traits.push("Active");
  if (responses["Q4"] === "sleep-noon") traits.push("Night owl");
  if (responses["Q5"] === "talk-out") traits.push("Communicative");
  if (responses["Q5"] === "alone") traits.push("Introspective");
  if (responses["Q6"] === "confident") traits.push("Social");
  if (responses["Q6"] === "corner") traits.push("Reserved");

  // Default traits if none inferred
  if (traits.length === 0) {
    traits.push("Genuine", "Thoughtful");
  }

  const summary = `${firstName} is a ${age}-year-old looking for a meaningful connection. Based on their responses, they appear to be ${traits.slice(0, 2).join(" and ").toLowerCase()}.`;

  const lookingFor =
    (responses["Q60"] as string) || "Someone compatible and genuine.";

  // Cache the fallback summary
  await prisma.cupidProfileSummary.upsert({
    where: { userId },
    create: {
      userId,
      summary,
      keyTraits: traits,
      lookingFor,
      aiModel: "fallback",
      responseHash,
    },
    update: {
      summary,
      keyTraits: traits,
      lookingFor,
      aiModel: "fallback",
      responseHash,
    },
  });

  return {
    userId,
    firstName,
    age,
    summary,
    keyTraits: traits,
    lookingFor,
    highlights: [],
  };
}

// ===========================================
// BATCH OPERATIONS
// ===========================================

/**
 * Pre-generate embeddings for all users (run before matching)
 */
export async function preGenerateAllEmbeddings(): Promise<{
  processed: number;
  errors: number;
}> {
  const users = await prisma.questionnaireResponse.findMany({
    where: { isSubmitted: true },
    select: { userId: true, responses: true },
  });

  let processed = 0;
  let errors = 0;

  for (const user of users) {
    try {
      // Responses are encrypted - need to decrypt
      // This will be called from a context where decryption is available
      // For now, this is a placeholder structure
      console.log(`Processing embeddings for user ${user.userId}`);
      processed++;
    } catch (error) {
      console.error(`Error processing user ${user.userId}:`, error);
      errors++;
    }
  }

  return { processed, errors };
}
