export const DISCLAIMER =
  'Informational only. This is not medical advice; speak to a qualified professional before changing your diet.';

export const SYSTEM_PROMPT = `You are a careful nutrition planning assistant inside a fitness tracking app.
Rules:
- Use only the RETRIEVED_CONTEXT for nutrition guidance and grounding.
- Never diagnose, treat, or promise medical outcomes.
- If the context is not enough, say so in the assumptions list.
- Use the requested diet preference and avoid listed allergies.
- Keep calories and macros sensible; never output extreme targets.
- Reply with JSON only. No markdown fences, prose, or comments.
- Cite the retrieved chunk ids you rely on in citations.
- Always include a clear disclaimer.`;

const planShape = {
  summary: 'string up to 300 characters',
  assumptions: ['string'],
  dailyTargets: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  days: [
    {
      day: 'mon',
      meals: [
        {
          type: 'breakfast',
          time: '08:00',
          notes: '',
          items: [
            {
              name: 'string',
              quantity: 0,
              unit: 'g',
              calories: 0,
              proteinG: 0,
              carbsG: 0,
              fatG: 0
            }
          ]
        }
      ]
    }
  ],
  citations: [{ source: 'string', chunkId: 'string' }],
  warnings: ['string'],
  disclaimer: 'string'
};

const mealShape = {
  meal: {
    type: 'lunch',
    time: '13:00',
    notes: '',
    items: [
      {
        name: 'string',
        quantity: 0,
        unit: 'g',
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0
      }
    ]
  },
  assumptions: ['string'],
  warnings: ['string'],
  citations: [{ source: 'string', chunkId: 'string' }],
  disclaimer: 'string'
};

export function responseShape(mode) {
  return mode === 'meal' ? mealShape : planShape;
}

export function buildQuery(input, user) {
  const profile = user.profile ?? {};
  return [
    input.goal,
    input.dietPreference,
    input.cuisine,
    input.notes,
    ...(input.allergies ?? []),
    profile.goal,
    profile.dietPreference,
    profile.weightKg ? `${profile.weightKg} kg` : '',
    profile.experience
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildPrompt({ input, user, chunks, mode }) {
  const context = chunks.length
    ? chunks
        .map(
          (chunk, index) =>
            `[${index + 1}] source=${chunk.sourceName} chunkId=${chunk._id} page=${chunk.page ?? 'n/a'}\n${chunk.text}`
        )
        .join('\n\n')
    : 'NO_CONTEXT_RETRIEVED';

  return [
    `INPUT_JSON: ${JSON.stringify(input)}`,
    `USER_PROFILE: ${JSON.stringify(user.profile ?? {})}`,
    `RETRIEVED_CONTEXT:\n${context}`,
    `Return JSON only with exactly this shape:\n${JSON.stringify(responseShape(mode), null, 2)}`
  ].join('\n\n');
}
