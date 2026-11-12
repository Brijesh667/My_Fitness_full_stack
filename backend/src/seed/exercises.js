import { Exercise } from '../models/Exercise.js';
import { defaultSets } from '../models/subSchemas.js';

// Real exercise names with short, factual descriptions. Library links stay empty.
const lib = (name, targetMuscle, description) => ({ name, targetMuscle, description });

export const LIBRARY_EXERCISES = [
  lib('Barbell Bench Press', 'chest', 'Press a barbell from the chest while lying on a flat bench.'),
  lib('Incline Dumbbell Press', 'chest', 'Press dumbbells on an incline bench to target the upper chest.'),
  lib('Push-Up', 'chest', 'Bodyweight press from the floor with a straight body line.'),
  lib('Cable Fly', 'chest', 'Bring cable handles together in front of the chest with a soft elbow bend.'),
  lib('Machine Chest Press', 'chest', 'Guided pressing movement for the chest.'),
  lib('Chest Dip', 'chest', 'Dip with a forward lean to emphasise the chest.'),

  lib('Deadlift', 'back', 'Lift a loaded barbell from the floor to standing.'),
  lib('Pull-Up', 'back', 'Pull your body up until the chin clears the bar.'),
  lib('Bent-Over Barbell Row', 'back', 'Row a barbell toward the lower ribs with a hinged torso.'),
  lib('Lat Pulldown', 'back', 'Pull a bar down toward the upper chest while seated.'),
  lib('Seated Cable Row', 'back', 'Row a cable handle to the torso with an upright chest.'),
  lib('Single-Arm Dumbbell Row', 'back', 'Row one dumbbell with support from a bench.'),

  lib('Overhead Press', 'shoulders', 'Press a barbell overhead from shoulder height.'),
  lib('Seated Dumbbell Press', 'shoulders', 'Press dumbbells overhead while seated with back support.'),
  lib('Lateral Raise', 'shoulders', 'Raise dumbbells out to the sides to shoulder height.'),
  lib('Front Raise', 'shoulders', 'Raise a weight forward to shoulder height with a straight arm.'),
  lib('Reverse Pec Deck', 'shoulders', 'Open the arms against resistance to work the rear shoulders.'),
  lib('Arnold Press', 'shoulders', 'Rotating dumbbell press from palms-in to palms-out.'),

  lib('Barbell Curl', 'biceps', 'Curl a barbell from the thighs to chest height.'),
  lib('Dumbbell Hammer Curl', 'biceps', 'Curl dumbbells with palms facing each other.'),
  lib('Preacher Curl', 'biceps', 'Curl with the upper arm supported on a preacher pad.'),
  lib('Cable Curl', 'biceps', 'Curl a low cable handle with a steady torso.'),
  lib('Incline Dumbbell Curl', 'biceps', 'Curl dumbbells while seated on an incline bench.'),

  lib('Close-Grip Bench Press', 'triceps', 'Bench press with a narrow grip to stress the triceps.'),
  lib('Triceps Pushdown', 'triceps', 'Push a cable attachment down while keeping elbows still.'),
  lib('Overhead Triceps Extension', 'triceps', 'Extend the elbows overhead with a weight behind the head.'),
  lib('Skull Crusher', 'triceps', 'Lower a bar toward the forehead while lying on a bench.'),
  lib('Bench Dip', 'triceps', 'Lower the body between benches using the arms.'),

  lib('Wrist Curl', 'forearms', 'Curl the wrists upward with forearms supported.'),
  lib('Reverse Wrist Curl', 'forearms', 'Extend the wrists upward with forearms supported.'),
  lib('Reverse Curl', 'forearms', 'Curl a bar with an overhand grip.'),
  lib("Farmer's Carry", 'forearms', 'Walk while holding heavy weights at your sides.'),

  lib('Plank', 'abs', 'Hold a straight body line on forearms and toes.'),
  lib('Hanging Leg Raise', 'abs', 'Raise straight or bent legs while hanging from a bar.'),
  lib('Cable Crunch', 'abs', 'Kneel and crunch down against a high cable.'),
  lib('Bicycle Crunch', 'abs', 'Alternate elbow-to-opposite-knee crunches while lying down.'),
  lib('Ab Wheel Rollout', 'abs', 'Roll a wheel forward from the knees and return.'),
  lib('Russian Twist', 'abs', 'Rotate the torso side to side while seated with feet lifted.'),

  lib('Barbell Shrug', 'traps', 'Lift the shoulders straight up while holding a barbell.'),
  lib('Dumbbell Shrug', 'traps', 'Shrug dumbbells upward with a brief hold.'),
  lib('Face Pull', 'traps', 'Pull a rope toward the face with high elbows.'),
  lib('Upright Row', 'traps', 'Raise a bar along the body toward the chin.'),

  lib('Back Squat', 'quads', 'Squat with a barbell across the upper back.'),
  lib('Front Squat', 'quads', 'Squat with a barbell held on the front shoulders.'),
  lib('Leg Press', 'quads', 'Push a loaded sled away with the feet.'),
  lib('Walking Lunge', 'quads', 'Step forward into alternating lunges.'),
  lib('Leg Extension', 'quads', 'Straighten the knees against a padded lever.'),
  lib('Goblet Squat', 'quads', 'Squat while holding one weight at the chest.'),
  lib('Bulgarian Split Squat', 'quads', 'Single-leg squat with the rear foot elevated.'),

  lib('Romanian Deadlift', 'hamstrings', 'Hinge at the hips with a barbell and lower to mid-shin.'),
  lib('Leg Curl', 'hamstrings', 'Bend the knees against resistance while lying or seated.'),
  lib('Good Morning', 'hamstrings', 'Hinge forward with a bar across the shoulders.'),
  lib('Nordic Curl', 'hamstrings', 'Lower the torso forward with anchored ankles.'),
  lib('Stiff-Leg Deadlift', 'hamstrings', 'Deadlift with nearly straight legs and a hip hinge.'),

  lib('Hip Thrust', 'glutes', 'Drive the hips up with shoulders supported on a bench.'),
  lib('Glute Bridge', 'glutes', 'Lift the hips from the floor while lying on your back.'),
  lib('Cable Kickback', 'glutes', 'Extend one leg back against a low cable.'),
  lib('Sumo Deadlift', 'glutes', 'Deadlift with a wide stance and toes turned out.'),
  lib('Step-Up', 'glutes', 'Step onto a platform one leg at a time.'),

  lib('Standing Calf Raise', 'calves', 'Rise onto the toes while standing under load.'),
  lib('Seated Calf Raise', 'calves', 'Rise onto the toes from a seated position.'),
  lib('Donkey Calf Raise', 'calves', 'Calf raise with the torso hinged forward.'),
  lib('Single-Leg Calf Raise', 'calves', 'Calf raise on one leg for extra balance work.'),

  lib('Treadmill Run', 'cardio', 'Steady or interval running on a treadmill.'),
  lib('Incline Walk', 'cardio', 'Walk uphill on a treadmill at a steady pace.'),
  lib('Stationary Cycling', 'cardio', 'Ride a stationary bike at a chosen resistance.'),
  lib('Rowing Machine', 'cardio', 'Row for distance or intervals on an ergometer.'),
  lib('Jump Rope', 'cardio', 'Skip with a rope at a steady or interval rhythm.'),
  lib('Stair Climber', 'cardio', 'Climb continuously on a stair machine.'),
  lib('Elliptical Trainer', 'cardio', 'Low-impact striding on an elliptical machine.')
];

export async function seedExerciseLibrary() {
  const operations = LIBRARY_EXERCISES.map((exercise) => ({
    updateOne: {
      filter: { owner: null, nameLower: exercise.name.toLowerCase() },
      update: {
        $setOnInsert: {
          name: exercise.name,
          nameLower: exercise.name.toLowerCase(),
          targetMuscle: exercise.targetMuscle,
          description: exercise.description,
          sets: defaultSets(),
          links: [],
          owner: null,
          isCustom: false
        }
      },
      upsert: true
    }
  }));

  await Exercise.bulkWrite(operations);
  return Exercise.countDocuments({ owner: null, nameLower: { $exists: true } });
}
