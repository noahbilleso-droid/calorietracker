import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ActivityLevel = 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very Active';

export interface UserProfile {
  dailyCalorieGoal: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
}

const DEFAULT_PROFILE: UserProfile = {
  dailyCalorieGoal: 2000,
  weightKg: 75,
  heightCm: 175,
  activityLevel: 'Moderate',
};

export const useProfileStore = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  // Fetch or create profile on mount
  useEffect(() => {
    if (!user) {
      setProfile(DEFAULT_PROFILE);
      setLoading(false);
      return;
    }

    const fetchOrCreateProfile = async () => {
      setLoading(true);

      // Try to fetch existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      if (data) {
        // Profile exists
        setProfile({
          dailyCalorieGoal: data.daily_calorie_goal,
          weightKg: Number(data.weight_kg),
          heightCm: data.height_cm,
          activityLevel: data.activity_level as ActivityLevel,
        });
      } else {
        // Create default profile
        const { error: insertError } = await supabase.from('profiles').insert({
          user_id: user.id,
          daily_calorie_goal: DEFAULT_PROFILE.dailyCalorieGoal,
          weight_kg: DEFAULT_PROFILE.weightKg,
          height_cm: DEFAULT_PROFILE.heightCm,
          activity_level: DEFAULT_PROFILE.activityLevel,
        });

        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
        // Use default profile
        setProfile(DEFAULT_PROFILE);
      }

      setLoading(false);
    };

    fetchOrCreateProfile();
  }, [user]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) return { error: new Error('Not authenticated') };

      const dbUpdates: Record<string, unknown> = {};
      if (updates.dailyCalorieGoal !== undefined) {
        dbUpdates.daily_calorie_goal = updates.dailyCalorieGoal;
      }
      if (updates.weightKg !== undefined) {
        dbUpdates.weight_kg = updates.weightKg;
      }
      if (updates.heightCm !== undefined) {
        dbUpdates.height_cm = updates.heightCm;
      }
      if (updates.activityLevel !== undefined) {
        dbUpdates.activity_level = updates.activityLevel;
      }

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return { error };
      }

      // Update local state
      setProfile((prev) => ({ ...prev, ...updates }));
      return { error: null };
    },
    [user]
  );

  return {
    profile,
    loading,
    updateProfile,
  };
};
