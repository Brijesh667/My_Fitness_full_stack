import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Dumbbell, Trash2, Target, ChevronDown, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import ExerciseForm from "../component/ExerciseForm";
import axiosClient from "../utils/axiosClient"; 
import { getWeekWorkout } from "../utils/workoutSlice";
import { useDispatch} from 'react-redux';


// ─── Zod Schema ───────────────────────────────────────────────────────────────
const daySchema = z.object({
  day_name: z.enum(
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    { errorMap: () => ({ message: "Please select a day" }) }
  ),
  description: z.string().max(200, "Max 200 characters").optional(),
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─── Component ────────────────────────────────────────────────────────────────
export default function DayForm({ onSubmit: onFinalSubmit }) {
  // react-hook-form (only for day_name + description)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(daySchema),
    defaultValues: { day_name: "", description: "" },
  });

  // ── Local state for goals ──
  const [goalInput, setGoalInput] = useState("");
  const [goalInputError, setGoalInputError] = useState("");
  const dispatch = useDispatch();

  // goals: [{ name: string, exercises: ExerciseData[] }]
  const [goals, setGoals] = useState([]);

  // which goal is currently opening the exercise modal
  const [activeGoalIndex, setActiveGoalIndex] = useState(null);

  // ── API states ──
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // ── Goal helpers ──
  const handleAddGoal = () => {
    const trimmed = goalInput.trim();
    if (!trimmed) {
      setGoalInputError("Goal name cannot be empty");
      return;
    }
    if (trimmed.length > 50) {
      setGoalInputError("Max 50 characters");
      return;
    }
    if (goals.length >= 2) {
      setGoalInputError("Maximum 2 goals allowed");
      return;
    }
    setGoals((prev) => [...prev, { name: trimmed, exercises: [] }]);
    setGoalInput("");
    setGoalInputError("");
  };

  const handleRemoveGoal = (index) => {
    setGoals((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Exercise helpers ──
  const handleSaveExercise = (exerciseData) => {
    if (activeGoalIndex === null) return;
    setGoals((prev) =>
      prev.map((g, i) =>
        i === activeGoalIndex
          ? { ...g, exercises: [...g.exercises, exerciseData] }
          : g
      )
    );
    setActiveGoalIndex(null);
  };

  const handleRemoveExercise = (goalIndex, exIndex) => {
    setGoals((prev) =>
      prev.map((g, i) =>
        i === goalIndex
          ? { ...g, exercises: g.exercises.filter((_, ei) => ei !== exIndex) }
          : g
      )
    );
  };

  // ── Final submit ──
  const onSubmit = async (formData) => {
    if (goals.length === 0) return;

    // Build the final Day object matching the Mongoose schema
    const dayObject = {
      day_name: formData.day_name,
      day_goal: goals.map((g) => g.name),
      description: formData.description || "",
      exercises: goals.flatMap((g) => g.exercises),
    };

    try {
      setIsLoading(true);
      setApiError("");
      setIsSuccess(false);

      const response = await axiosClient.post('/save/create', dayObject);
      dispatch(getWeekWorkout());


      setIsSuccess(true);
      if (onFinalSubmit) onFinalSubmit(response.data);
    } catch (err) {
      // Axios error response se message lo, warna fallback
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Something went wrong. Please try again.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* ── Page header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Create Workout Day
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Set your training day, add goals, and build your workout plan.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Card: Day Info ── */}
          <div className="rounded-2xl bg-[#0f0f0f] border border-[#1e1e1e] p-6 space-y-5">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Day Info
            </h2>

            {/* Day Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Day Name
              </label>
              <div className="relative">
                <select
                  {...register("day_name")}
                  className="w-full appearance-none bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all cursor-pointer"
                >
                  <option value="">— Select a day —</option>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                />
              </div>
              {errors.day_name && (
                <p className="mt-1.5 text-xs text-red-400">{errors.day_name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Description{" "}
                <span className="text-zinc-600 font-normal text-xs">(optional)</span>
              </label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="What's the focus of this day? e.g. Heavy compound lifts for hypertrophy"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all"
              />
              {errors.description && (
                <p className="mt-1.5 text-xs text-red-400">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* ── Card: Goals ── */}
          <div className="rounded-2xl bg-[#0f0f0f] border border-[#1e1e1e] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Goals{" "}
                <span className="normal-case font-normal text-zinc-600">
                  ({goals.length}/2)
                </span>
              </h2>
            </div>

            {/* Add Goal Input */}
            {goals.length < 2 && (
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    value={goalInput}
                    onChange={(e) => {
                      setGoalInput(e.target.value);
                      if (goalInputError) setGoalInputError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddGoal())}
                    placeholder="e.g. Chest, Back, Legs..."
                    maxLength={50}
                    className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddGoal}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-orange-500/10 text-orange-400 text-sm font-medium hover:bg-orange-500/20 border border-orange-500/20 transition-all whitespace-nowrap"
                  >
                    <Plus size={15} /> Add Goal
                  </button>
                </div>
                {goalInputError && (
                  <p className="mt-1.5 text-xs text-red-400">{goalInputError}</p>
                )}
              </div>
            )}

            {goals.length === 0 && (
              <div className="text-center py-8 text-zinc-600 text-sm border border-dashed border-[#1e1e1e] rounded-xl">
                <Target size={24} className="mx-auto mb-2 opacity-40" />
                Add a goal to start building your workout
              </div>
            )}

            {/* Goal Cards */}
            <div className="space-y-4">
              {goals.map((goal, goalIndex) => (
                <div
                  key={goalIndex}
                  className="rounded-xl border border-[#252525] bg-[#141414] overflow-hidden"
                >
                  {/* Goal Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <span className="text-white font-semibold text-sm">{goal.name}</span>
                      <span className="text-xs text-zinc-600">
                        {goal.exercises.length} exercise{goal.exercises.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveGoalIndex(goalIndex)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-medium hover:bg-orange-500/20 transition-all"
                      >
                        <Dumbbell size={12} /> Add Exercise
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveGoal(goalIndex)}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Exercises List */}
                  {goal.exercises.length > 0 ? (
                    <div className="divide-y divide-[#1a1a1a]">
                      {goal.exercises.map((ex, exIndex) => (
                        <div
                          key={exIndex}
                          className="flex items-start justify-between px-4 py-3"
                        >
                          <div>
                            <p className="text-white text-sm font-medium">{ex.exercise_name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-zinc-500 capitalize">{ex.level}</span>
                              <span className="text-xs text-zinc-600">•</span>
                              <span className="text-xs text-zinc-500">
                                {ex.sets.length} set{ex.sets.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(goalIndex, exIndex)}
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all mt-0.5"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-5 text-center text-zinc-600 text-xs">
                      No exercises yet — click "Add Exercise" above
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── API Error Banner ── */}
          {apiError && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* ── Success Banner ── */}
          {isSuccess && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>Workout day saved successfully!</span>
            </div>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={goals.length === 0 || isLoading}
            className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-base tracking-wide hover:bg-orange-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Workout Day"
            )}
          </button>
        </form>
      </div>

      {/* ── Exercise Modal ── */}
      {activeGoalIndex !== null && (
        <ExerciseForm
          goalName={goals[activeGoalIndex]?.name}
          onSave={handleSaveExercise}
          onClose={() => setActiveGoalIndex(null)}
        />
      )}
    </div>
  );
}