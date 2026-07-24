"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMyProfile, type UpdateProfileRequest } from "@/lib/api/user-service/profile";
import { profileKeys, authKeys } from "@/lib/query-keys";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => updateMyProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
    },
  });
}
