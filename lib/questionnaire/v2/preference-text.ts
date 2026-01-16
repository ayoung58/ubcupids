/**
 * Preference Text Dictionary
 *
 * Customizable preference text for all questions that have preference sections.
 * This allows you to easily modify the wording of preference statements without
 * touching the component logic.
 *
 * Format: "I prefer my match to [preference text]"
 */

export const PREFERENCE_TEXT: Record<string, string> = {
  // SECTION 1 - Lifestyle / Surface Compatibility

  // Q3: Sexual Orientation
  q3: "I prefer my match to have one of these orientations",

  // Q4: Age
  q4: "I prefer my match to be within my preferred age range",

  // Q5: Cultural / Ethnic Background
  q5: "I prefer my match to be of the following backgrounds",

  // Q6: Religious Beliefs
  q6: "I prefer my match's religious beliefs to be...",

  // Q7: Political Leaning
  q7: "I prefer my match's political views to be...",

  // Q8: Alcohol Consumption
  q8: "I prefer my match to drink alcohol...",

  // Q9a: Drug Use - Substances
  q9a: "I prefer my match to use these substances",

  // Q9b: Drug Use - Frequency
  q9b: "I prefer my match to use substances at a frequency that is...",

  // Q10: Exercise / Physical Activity Level (NEWLY ADDED)
  q10: "Compared to me, I prefer my match's physically activity level to be...",

  // Q11: Relationship Style Preference
  q11: "I prefer my match's relationship style to be",

  // Q12: Sexual Activity Expectations
  q12: "I prefer my match's expectations around sexual activity to be...",

  // Q13: Relationship Intent
  q13: "I prefer my match to be looking for",

  // Q14: Field of Study / Faculty
  q14: "I prefer my match to be studying in",

  // Q15: Living Situation
  q15: "I prefer my match to be living...",

  // Q16: Academic / Career Ambition Level
  q16: "I prefer my match's ambition level to be...",

  // Q17: Financial Attitudes
  q17: "I prefer my match's financial attitudes to be...",

  // Q18: Time Availability / Ideal Frequency
  q18: "I prefer my match's availability to be...",

  // Q19: Pet Ownership / Attitude
  q19: "I prefer my match's attitude toward pets to be...",

  // Q20: Relationship Experience
  q20: "I prefer my match to have...",

  // SECTION 2 - Personality / Interaction Style

  // Q21: Love Languages
  q21: "I prefer my match to show love in ways I like to receive it",

  // Q22: Social Energy Level
  q22: "I prefer my match's social energy level to be...",

  // Q23: Battery Recharge Style
  q23: "I prefer my match to recharge their energy in a way that is...",

  // Q24: Party / Nightlife Interest
  q24: "I prefer my match's interest in partying and nightlife to be...",

  // Q25: Conflict Resolution Approach
  q25: "I prefer my match's approach to conflict to be...",

  // Q26: Texting Frequency
  q26: "I prefer my match to text at a frequency that is...",

  // Q27: Physical Affection Comfort (Public)
  q27: "I prefer my match's feelings towards PDA to be...",

  // Q28: Planning vs Spontaneity
  q28: "I prefer my match's spontaneity levels to be...",

  // Q29: Sleep Schedule
  q29: "I prefer my match's sleep schedule to be...",

  // Q30: Cleanliness / Organization
  q30: "I prefer my match's standards for cleanliness and organization to be...",

  // Q31: Openness to Trying New Things
  q31: "I prefer my match's openness to trying new activities to be...",

  // Q32: What Counts as Cheating
  q32: "I prefer my match's definition of cheating to be...",

  // Q33: Group Socializing Preference
  q33: "I prefer my match's socializing preference to be...",

  // Q34: Outdoor vs Indoor Activities
  q34: "I prefer my match's preference for activities to be...",

  // Q35: Communication Directness
  q35: "I prefer my match's communication style to be...",

  // Q36: Emotional Processing Style
  q36: "I prefer my match to handle emotions in a way that is...",
};

/**
 * Get the preference text for a specific question
 * Returns a default if the question ID is not found
 */
export function getPreferenceText(questionId: string): string {
  return PREFERENCE_TEXT[questionId] || "match these preferences";
}
