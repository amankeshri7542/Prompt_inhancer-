import { cookies } from 'next/headers';

const LIMITS = {
  fast: 5,
  pro: 3,
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  cookieName: string;
  newValue: string;
};

export async function checkRateLimit(mode: 'fast' | 'pro'): Promise<RateLimitResult> {
  const cookieStore = await cookies();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const cookieName = `${mode}-limit-${today}`;
  
  const currentUsageStr = cookieStore.get(cookieName)?.value;
  const currentUsage = currentUsageStr ? parseInt(currentUsageStr, 10) : 0;
  const limit = LIMITS[mode];

  if (currentUsage >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      cookieName,
      newValue: currentUsage.toString(),
    };
  }

  return {
    allowed: true,
    limit,
    remaining: limit - (currentUsage + 1),
    cookieName,
    newValue: (currentUsage + 1).toString(),
  };
}
