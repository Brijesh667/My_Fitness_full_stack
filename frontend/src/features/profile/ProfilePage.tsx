import { useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Camera, Loader2, LogOut, Trash2, UserRound } from 'lucide-react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Field } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getApiError } from '@/lib/api';
import {
  DIET_LABELS,
  EXPERIENCE_LABELS,
  GENDER_LABELS,
  GOAL_LABELS
} from '@/lib/dates';
import { profileFormSchema, type ProfileFormValues } from '@/lib/schemas/profile';
import { assetUrl } from '@/lib/utils';
import { useAvatarMutations, useLogout, useMe, useUpdateProfile } from '@/features/auth/api';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ProfilePage() {
  const { data: user } = useMe();
  const updateProfile = useUpdateProfile();
  const { upload, remove } = useAvatarMutations();
  const logout = useLogout();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name ?? '',
      age: user?.profile?.age,
      gender: user?.profile?.gender,
      heightCm: user?.profile?.heightCm,
      weightKg: user?.profile?.weightKg,
      goal: user?.profile?.goal,
      experience: user?.profile?.experience,
      dietPreference: user?.profile?.dietPreference
    }
  });

  if (!user) return null;

  const avatar = assetUrl(user.avatarUrl);

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile.mutate(
      {
        name: values.name,
        profile: {
          age: values.age,
          gender: values.gender,
          heightCm: values.heightCm,
          weightKg: values.weightKg,
          goal: values.goal,
          experience: values.experience,
          dietPreference: values.dietPreference
        }
      },
      {
        onSuccess: () => {
          toast.success('Profile saved.');
          reset(values);
        },
        onError: (error) => {
          const apiError = getApiError(error);
          if (apiError.fields) {
            for (const [key, message] of Object.entries(apiError.fields)) {
              setError(key.replace(/^profile\./, '') as keyof ProfileFormValues, {
                type: 'server',
                message
              });
            }
          } else {
            toast.error(apiError.message);
          }
        }
      }
    );
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error('Choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image must be 2 MB or smaller.');
      return;
    }

    upload.mutate(file, {
      onSuccess: () => toast.success('Photo updated.'),
      onError: (error) => toast.error(getApiError(error).message)
    });
  };

  const onLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        toast.success('Logged out.');
        navigate('/', { replace: true });
      }
    });
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Optional details help the diet assistant tune its suggestions.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border bg-muted">
                  {avatar ? (
                    <img src={avatar} alt={`${user.name}'s avatar`} className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-10 w-10 text-muted-foreground" aria-hidden />
                  )}
                </div>
                {upload.isPending ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <Loader2 className="h-6 w-6 animate-spin text-white" aria-label="Uploading" />
                  </div>
                ) : null}
              </div>
              <p className="mt-3 font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>

            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onFileChange}
            />
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => fileInput.current?.click()}
                disabled={upload.isPending}
              >
                <Camera className="h-4 w-4" /> Upload photo
              </Button>
              {user.avatarUrl ? (
                <Button
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmRemove(true)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-4 w-4" /> Remove photo
                </Button>
              ) : null}
              <p className="text-center text-xs text-muted-foreground">JPG, PNG or WebP up to 2 MB.</p>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" className="w-full" onClick={onLogout} disabled={logout.isPending}>
                <LogOut className="h-4 w-4" /> Log out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="profile-name" error={errors.name?.message}>
                  <Input id="profile-name" autoComplete="name" {...register('name')} />
                </Field>

                <Field label="Age" htmlFor="profile-age" error={errors.age?.message}>
                  <Input
                    id="profile-age"
                    type="number"
                    inputMode="numeric"
                    min={13}
                    max={100}
                    placeholder="e.g. 28"
                    {...register('age')}
                  />
                </Field>

                <Field label="Gender" htmlFor="profile-gender" error={errors.gender?.message}>
                  <Select id="profile-gender" {...register('gender')}>
                    <option value="">Not set</option>
                    {Object.entries(GENDER_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Goal" htmlFor="profile-goal" error={errors.goal?.message}>
                  <Select id="profile-goal" {...register('goal')}>
                    <option value="">Not set</option>
                    {Object.entries(GOAL_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Height (cm)" htmlFor="profile-height" error={errors.heightCm?.message}>
                  <Input
                    id="profile-height"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={50}
                    max={260}
                    placeholder="e.g. 174"
                    {...register('heightCm')}
                  />
                </Field>

                <Field label="Weight (kg)" htmlFor="profile-weight" error={errors.weightKg?.message}>
                  <Input
                    id="profile-weight"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={20}
                    max={400}
                    placeholder="e.g. 72.5"
                    {...register('weightKg')}
                  />
                </Field>

                <Field label="Experience" htmlFor="profile-experience" error={errors.experience?.message}>
                  <Select id="profile-experience" {...register('experience')}>
                    <option value="">Not set</option>
                    {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="Diet preference"
                  htmlFor="profile-diet"
                  error={errors.dietPreference?.message}
                >
                  <Select id="profile-diet" {...register('dietPreference')}>
                    <option value="">Not set</option>
                    {Object.entries(DIET_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">Every field is optional.</p>
                <Button type="submit" disabled={updateProfile.isPending || !isDirty}>
                  {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Remove profile photo?"
        description="Your avatar will be deleted and replaced with your initials."
        confirmLabel="Remove photo"
        destructive
        pending={remove.isPending}
        onConfirm={() => {
          remove.mutate(undefined, {
            onSuccess: () => {
              setConfirmRemove(false);
              toast.success('Photo removed.');
            },
            onError: (error) => toast.error(getApiError(error).message)
          });
        }}
      />
    </div>
  );
}
