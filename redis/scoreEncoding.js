// combined_score = (hot_score + OFFSET) * 10^10 + created_at_epoch
//
// Why: Redis ZSET only sorts by a single numeric score. We need a compound sort
// (hot_score primary, created_at as tie-breaker, newer wins). Shifting hot_score
// left by 10 digits reserves space for the epoch timestamp (~10 digits today),
// so the two values occupy separate digit "zones" that never bleed into each other.
//
// TWO REAL BUGS WE HIT AND FIXED HERE (worth understanding, not just trusting):
//
// 1. hot_score CAN BE NEGATIVE (posts before the reference date, or downvoted
//    posts). Multiplying a negative number by 1e10 and adding a positive epoch
//    does NOT keep them in separate digit zones — it partially cancels them,
//    corrupting the epoch. Fix: add a fixed positive OFFSET to hot_score before
//    encoding, so it's always positive. Adding the same constant to every score
//    never changes their relative order, so ranking is unaffected.
//
// 2. Even after making hot_score positive, keeping decimal precision (e.g.
//    99996.434) made the shifted score itself too large — multiplying it by 1e10
//    produced a number with MORE significant digits than a 64-bit float can
//    represent exactly (~15-17 digits), silently corrupting the epoch digits
//    again. Fix: round hot_score to a WHOLE number before encoding. We don't
//    lose meaningful precision here because created_at (not hot_score decimals)
//    is our actual tie-breaker.

export const EPOCH_DIGIT_SHIFT = 1e10; // reserves 10 digits for the epoch timestamp

// Large enough to keep (hot_score + OFFSET) positive even for posts created
// up to ~10 years before the app's reference date, or heavily downvoted posts
// (whose log-scale penalty is small, at most single digits negative).
export const HOT_SCORE_OFFSET = 100000;

export function encodeCombinedScore(hotScore, createdAt) {
  const epochSeconds = Math.floor(new Date(createdAt).getTime() / 1000);
  const shiftedScore = Math.round(hotScore + HOT_SCORE_OFFSET); // whole number, always positive
  return shiftedScore * EPOCH_DIGIT_SHIFT + epochSeconds;
}