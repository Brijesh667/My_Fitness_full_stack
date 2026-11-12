// Deterministic, dependency-free embedding used when RAG_MOCK=true.
const DIMENSIONS = 384;

function hash(value) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function wordsOf(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((word) => word.length > 1);
}

export function mockEmbedding(text) {
  const vector = new Array(DIMENSIONS).fill(0);
  for (const word of wordsOf(text)) {
    const hashed = hash(word);
    const index = hashed % DIMENSIONS;
    vector[index] += hashed % 2 === 0 ? 1 : -1;
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return norm === 0 ? vector : vector.map((value) => value / norm);
}

const MEAL_PLAN = [
  { type: 'breakfast', time: '08:00' },
  { type: 'lunch', time: '13:00' },
  { type: 'dinner', time: '20:00' },
  { type: 'snack', time: '17:00' },
  { type: 'pre_workout', time: '18:30' },
  { type: 'post_workout', time: '21:00' }
];

const ITEM_TEMPLATES = {
  breakfast: { name: 'Oats with milk', quantity: 250, unit: 'g', calories: 350, proteinG: 16, carbsG: 55, fatG: 8 },
  lunch: { name: 'Rice and dal', quantity: 350, unit: 'g', calories: 520, proteinG: 22, carbsG: 80, fatG: 10 },
  snack: { name: 'Fruit and curd', quantity: 200, unit: 'g', calories: 180, proteinG: 8, carbsG: 28, fatG: 4 },
  dinner: { name: 'Roti with vegetables', quantity: 300, unit: 'g', calories: 430, proteinG: 18, carbsG: 60, fatG: 12 },
  pre_workout: { name: 'Banana', quantity: 1, unit: 'piece', calories: 105, proteinG: 1, carbsG: 27, fatG: 0 },
  post_workout: { name: 'Whey protein shake', quantity: 300, unit: 'ml', calories: 180, proteinG: 25, carbsG: 8, fatG: 3 }
};

function parseInput(userPrompt) {
  const match = userPrompt.match(/INPUT_JSON: (.+)/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function mealFor(type, day) {
  const template = ITEM_TEMPLATES[type] ?? ITEM_TEMPLATES.lunch;
  return {
    type,
    ...MEAL_PLAN.find((entry) => entry.type === type),
    notes: `${day} ${type} suggestion. Adjust portions to your needs.`,
    items: [{ ...template, name: `${template.name}` }]
  };
}

export const mockProvider = {
  name: 'mock',

  async embed(texts) {
    return texts.map((text) => mockEmbedding(text));
  },

  async generate({ user }) {
    const input = parseInput(user) ?? {};
    const disclaimer =
      'Informational only; this is not medical advice. Speak to a qualified professional before changing your diet.';

    if (input.mode === 'meal') {
      return {
        meal: mealFor(input.mealType ?? 'lunch', input.day ?? 'mon'),
        assumptions: ['Portions are general suggestions and should be adjusted to your needs.'],
        warnings: [],
        citations: [],
        disclaimer
      };
    }

    const mealsPerDay = Math.min(6, Math.max(3, Number(input.mealsPerDay) || 4));
    const meals = MEAL_PLAN.slice(0, mealsPerDay).map((entry) => mealFor(entry.type, 'day'));
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => ({
      day,
      meals: meals.map((meal) => ({ ...meal, notes: `${day} ${meal.type} suggestion. Adjust portions to your needs.` }))
    }));

    return {
      summary: 'A balanced daily template with regular meals and a mix of protein, carbohydrates and fat.',
      assumptions: [
        'Targets are general starting points and may need adjustment over time.',
        ...(input.allergies?.length ? [`Allergies noted: ${input.allergies.join(', ')}.`] : [])
      ],
      dailyTargets: { calories: 2000, proteinG: 120, carbsG: 230, fatG: 60 },
      days,
      citations: [],
      warnings: [],
      disclaimer
    };
  }
};
