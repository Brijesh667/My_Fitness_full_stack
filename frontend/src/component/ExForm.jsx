import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Dumbbell, Plus, Trash2 } from "lucide-react";
import { useParams, useNavigate } from "react-router";
import axiosClient from "../utils/axiosClient";
import { getWeekWorkout } from "../utils/workoutSlice";
import { useDispatch } from "react-redux";

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const setSchema = z.object({
  set_name: z.string().min(1, "Set name required").max(30, "Max 30 characters"),
  reps: z
    .number({ invalid_type_error: "Reps must be a number" })
    .min(1, "Min 1 rep")
    .max(100, "Max 100 reps"),
  set_description: z.string().max(100, "Max 100 characters").optional(),
});

const exerciseSchema = z.object({
  exercise_name: z
    .string()
    .min(1, "Exercise name required")
    .max(50, "Max 50 characters"),
  level: z.enum(["beginner", "intermediate", "advanced", "everyone"]),
  sets: z
    .array(setSchema)
    .min(1, "At least one set required")
    .max(5, "Max 5 sets allowed"),
  exercise_description: z.string().max(300, "Max 300 characters").optional(),
  // ✅ FIX 1: exercise_goal schema mein add kiya — warna Zod strip kar deta hai
  exercise_goal: z.string().optional(),
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function ExForm() {
  const { _id, day_name, goal } = useParams();
 
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ✅ FIX 2: onClose ab is file mein hi define hai — dusri file ki zarurat nahi
  const onClose = () => {
    navigate(-1);
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      exercise_name: "",
      // ✅ FIX 3: exercise_goal params se default set ho raha hai
      exercise_goal: goal,
      level: "everyone",
      sets: [],
      exercise_description: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "sets",
  });

  // ✅ FIX 4: addSet ab is file mein hi hai — bahar se import ki zarurat nahi
  const addSet = () => {
    if (fields.length >= 5) return;
    append({
      set_name: `Set ${fields.length + 1}`,
      reps: "",
      set_description: "",
    });
  };

  const onSubmit = async (data) => {
    try {
      // ✅ FIX 5: goal explicitly payload mein inject — form value + params dono se safe
      const payload = { ...data, exercise_goal: goal };

      // Step 1: Exercise create karo
      const res = await axiosClient.post("/exercise/create", payload);

      // Backend response ke andar nested ho sakta hai
      const exerciseId = res.data?.data?._id || res.data?._id;

      if (!exerciseId) {
        console.error("Exercise ID nahi mila response mein:", res.data);
        return;
      }

      // Step 2: Current day fetch karo (patch ke liye validation chahiye backend mein)
      const dayRes = await axiosClient.get(`/day/getDay/${_id}`);
      const currentDay = dayRes.data?.data;

      if (!currentDay) {
        console.error("Day fetch fail ho gayi");
        return;
      }

      // Existing workout IDs extract karo (object ya string dono handle)
      const existingWorkoutIds = (currentDay.workout || []).map(
        (w) => w._id || w
      );

      // Step 3: Day update karo — naya exercise ID add karke
      await axiosClient.patch(`/day/update/${_id}`, {
        day_name: currentDay.day_name,
        day_goal: currentDay.day_goal,
        workout: [...existingWorkoutIds, exerciseId],
      });

      // ✅ FIX 6: getWeekWorkout ek thunk hai — dispatch(getWeekWorkout()) sahi hai
      // Agar yeh async thunk hai toh: dispatch(getWeekWorkout())
      // Agar action creator hai toh bhi same syntax kaam karega
      dispatch(getWeekWorkout());

      // Form band karo aur peeche navigate karo
      onClose();
    } catch (err) {
      console.error("Submit error:", err);
      if (err.response) {
        console.error("Backend response:", err.response.data);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0f0f0f] border border-[#2a2a2a] shadow-2xl">

        {/* ── Header ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0f0f0f] border-b border-[#1e1e1e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Dumbbell size={18} />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg leading-none">
                Add Exercise
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Goal: <span className="text-orange-400">{goal}</span>
              </p>
            </div>
          </div>

          {/* ✅ FIX 7: X button — onClick={onClose} directly kaam karega */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">

          {/* Exercise Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
              Exercise Name
            </label>
            <input
              {...register("exercise_name")}
              placeholder="e.g. Bench Press"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all"
            />
            {errors.exercise_name && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.exercise_name.message}
              </p>
            )}
          </div>

          {/* Level */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
              Level
            </label>
            <select
              {...register("level")}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 transition-all appearance-none cursor-pointer"
            >
              <option value="everyone">Everyone</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Sets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                Sets{" "}
                <span className="normal-case text-zinc-600 font-normal">
                  ({fields.length}/5)
                </span>
              </label>

              {/* ✅ FIX 8: Add Set button — addSet() ab is file mein hi defined hai */}
              <button
                type="button"
                onClick={addSet}
                disabled={fields.length >= 5}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-medium hover:bg-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Plus size={13} /> Add Set
              </button>
            </div>

            {/* Set-level validation errors */}
            {errors.sets?.root && (
              <p className="mb-2 text-xs text-red-400">
                {errors.sets.root.message}
              </p>
            )}
            {errors.sets &&
              !errors.sets.root &&
              typeof errors.sets.message === "string" && (
                <p className="mb-2 text-xs text-red-400">
                  {errors.sets.message}
                </p>
              )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative rounded-xl border border-[#252525] bg-[#141414] p-4"
                >
                  {/* Set header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                      Set {index + 1}
                    </span>

                    {/* ✅ FIX 9: Trash button — remove(index) ab seedha kaam karega */}
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Set Name */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs text-zinc-500 mb-1.5">
                        Set Name
                      </label>
                      <input
                        {...register(`sets.${index}.set_name`)}
                        placeholder="e.g. Warm-up Set"
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                      />
                      {errors.sets?.[index]?.set_name && (
                        <p className="mt-1 text-xs text-red-400">
                          {errors.sets[index].set_name.message}
                        </p>
                      )}
                    </div>

                    {/* Reps */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs text-zinc-500 mb-1.5">
                        Reps
                      </label>
                      <input
                        {...register(`sets.${index}.reps`, {
                          valueAsNumber: true,
                        })}
                        type="number"
                        placeholder="12"
                        min={1}
                        max={100}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                      />
                      {errors.sets?.[index]?.reps && (
                        <p className="mt-1 text-xs text-red-400">
                          {errors.sets[index].reps.message}
                        </p>
                      )}
                    </div>

                    {/* Set Description */}
                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-500 mb-1.5">
                        Set Description{" "}
                        <span className="text-zinc-700">(optional)</span>
                      </label>
                      <input
                        {...register(`sets.${index}.set_description`)}
                        placeholder="e.g. Go slow on eccentric phase"
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {fields.length === 0 && (
                <div className="text-center py-6 text-zinc-600 text-sm border border-dashed border-[#222] rounded-xl">
                  Click "Add Set" to get started
                </div>
              )}
            </div>
          </div>

          {/* Exercise Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
              Exercise Description{" "}
              <span className="normal-case font-normal text-zinc-600">
                (optional)
              </span>
            </label>
            <textarea
              {...register("exercise_description")}
              rows={3}
              placeholder="Brief notes about form, tempo, or focus..."
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all"
            />
            {errors.exercise_description && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.exercise_description.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {/* ✅ FIX 10: Cancel button — onClose() ab directly kaam karega */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#2a2a2a] text-zinc-400 text-sm font-medium hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-400 active:scale-95 transition-all"
            >
              Save Exercise
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}