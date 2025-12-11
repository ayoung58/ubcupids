import { PrismaClient } from "@prisma/client";

// Use the shared Prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Server-side rate limiting using database
 *
 * Prevents abuse by tracking attempts per identifier (email/IP)
 * Persists across page refreshes and server restarts
 *
 * Example usage:
 * ```typescript
 * const rateLimitResult = await checkRateLimit(
 *   'user@example.com',
 *   'resend-verification',
 *   { maxAttempts: 3, windowMinutes: 15 }
 * );
 *
 * if (!rateLimitResult.allowed) {
 *   return { error: rateLimitResult.message };
 * }
 * ```
 */

interface RateLimitConfig {
  maxAttempts: number; // Max attempts allowed
  windowMinutes: number; // Time window in minutes
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  message?: string;
}

/**
 * Check if action is rate limited
 *
 * @param identifier - Unique identifier (email address or IP)
 * @param action - Action being rate limited (e.g., 'resend-verification')
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(
    now.getTime() - config.windowMinutes * 60 * 1000
  );

  // Find or create rate limit record
  let rateLimit = await prisma.rateLimit.findUnique({
    where: {
      identifier_action: {
        identifier,
        action,
      },
    },
  });

  // If no record exists, create one (first attempt)
  if (!rateLimit) {
    const expiresAt = new Date(
      now.getTime() + config.windowMinutes * 60 * 1000
    );

    rateLimit = await prisma.rateLimit.create({
      data: {
        identifier,
        action,
        attempts: 1,
        windowStart: now,
        expiresAt,
      },
    });

    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: expiresAt,
    };
  }

  // Check if rate limit window has expired
  if (rateLimit.expiresAt < now) {
    // Window expired, reset counter
    const expiresAt = new Date(
      now.getTime() + config.windowMinutes * 60 * 1000
    );

    rateLimit = await prisma.rateLimit.update({
      where: { id: rateLimit.id },
      data: {
        attempts: 1,
        windowStart: now,
        expiresAt,
      },
    });

    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: expiresAt,
    };
  }

  // Check if max attempts exceeded
  if (rateLimit.attempts >= config.maxAttempts) {
    const minutesRemaining = Math.ceil(
      (rateLimit.expiresAt.getTime() - now.getTime()) / 1000 / 60
    );

    return {
      allowed: false,
      remaining: 0,
      resetAt: rateLimit.expiresAt,
      message: `Too many attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? "s" : ""}.`,
    };
  }

  // Increment attempts
  rateLimit = await prisma.rateLimit.update({
    where: { id: rateLimit.id },
    data: {
      attempts: {
        increment: 1,
      },
    },
  });

  return {
    allowed: true,
    remaining: config.maxAttempts - rateLimit.attempts,
    resetAt: rateLimit.expiresAt,
  };
}

/**
 * Clean up expired rate limit records
 *
 * Run this periodically (e.g., daily cron job) to prevent table bloat
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const result = await prisma.rateLimit.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}
