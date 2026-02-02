import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Types for duplicate users
export interface UserPlanInfo {
  id: number;
  planId: number;
  planName: string;
  planType: string | null;
  planPrice: number | null;
  planTrial: boolean;
  productName: string | null;
  status: boolean;
  mm_status: number;
  start_date: string | null;
  end_date: string | null;
  paymentRef: Record<string, unknown> | null;
}

export interface DuplicateUser {
  id: number;
  first: string | null;
  last: string | null;
  email: string;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  is_deleted: boolean;
  plans: UserPlanInfo[];
  planCount: number;
  activePlanCount: number;
}

export interface DuplicateGroup {
  email: string;
  accountCount: number;
  users: DuplicateUser[];
}

export interface DuplicateUsersResponse {
  status: string;
  data: DuplicateGroup[];
  totalGroups: number;
  totalDuplicateAccounts: number;
}

// Fetch all duplicate users grouped by email
export function useDuplicateUsers() {
  return useQuery({
    queryKey: ['admin', 'duplicate-users'],
    queryFn: async (): Promise<DuplicateUsersResponse> => {
      const response = await api.get<DuplicateUsersResponse>(
        '/api/admin/duplicate-users'
      );
      
      if (response.data.status === 'success') {
        return response.data;
      }
      throw new Error('Failed to load duplicate users');
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// Move a plan from one user to another
export function useMovePlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userPlanId, 
      fromUserId, 
      toUserId 
    }: { 
      userPlanId: number; 
      fromUserId: number; 
      toUserId: number;
    }) => {
      try {
        const response = await api.post<{ status: string; message: string }>(
          '/api/admin/move-userplan',
          { userPlanId, fromUserId, toUserId }
        );
        
        if (response.data.status === 'success') {
          return response.data;
        }
        throw new Error('Failed to move plan');
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: { error?: string } } };
          if (axiosError.response?.data?.error) {
            throw new Error(axiosError.response.data.error);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate to refresh the duplicate users list
      queryClient.invalidateQueries({ queryKey: ['admin', 'duplicate-users'] });
    },
  });
}

// Delete a user plan
export function useDeleteUserPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      planId 
    }: { 
      userId: number; 
      planId: number;
    }) => {
      try {
        const response = await api.post<{ status: string; message: string }>(
          '/api/admin/deleteuserplan',
          { UserId: userId, PlanId: planId }
        );
        
        if (response.data.status === 'success') {
          return response.data;
        }
        throw new Error('Failed to delete plan');
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: { error?: string } } };
          if (axiosError.response?.data?.error) {
            throw new Error(axiosError.response.data.error);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate to refresh the duplicate users list
      queryClient.invalidateQueries({ queryKey: ['admin', 'duplicate-users'] });
    },
  });
}

// Delete an empty user (no plans)
export function useDeleteEmptyUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: number) => {
      try {
        const response = await api.post<{ status: string; message: string }>(
          '/api/admin/delete-empty-user',
          { userId }
        );
        
        if (response.data.status === 'success') {
          return response.data;
        }
        throw new Error('Failed to delete user');
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: { error?: string } } };
          if (axiosError.response?.data?.error) {
            throw new Error(axiosError.response.data.error);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate to refresh the duplicate users list
      queryClient.invalidateQueries({ queryKey: ['admin', 'duplicate-users'] });
    },
  });
}

// Update a user's email
export function useUpdateUserEmail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, email }: { userId: number; email: string }) => {
      try {
        const response = await api.post<{ status: string; message: string }>(
          '/api/admin/update-user-email',
          { userId, email }
        );
        
        if (response.data.status === 'success') {
          return response.data;
        }
        throw new Error('Failed to update email');
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: { error?: string } } };
          if (axiosError.response?.data?.error) {
            throw new Error(axiosError.response.data.error);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate to refresh the duplicate users list
      queryClient.invalidateQueries({ queryKey: ['admin', 'duplicate-users'] });
    },
  });
}

// Helper function to get status label
export function getPlanStatusLabel(mm_status: number): string {
  switch (mm_status) {
    case 1:
      return 'Active';
    case 2:
      return 'Canceled';
    case 3:
      return 'Paused';
    case 5:
      return 'Overdue';
    case 9:
      return 'Pending Cancellation';
    default:
      return 'Unknown';
  }
}

// Helper function to get status color
export function getPlanStatusColor(mm_status: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (mm_status) {
    case 1:
    case 9:
      return 'default'; // Active / Pending Cancellation - green-ish
    case 2:
      return 'destructive'; // Canceled - red
    case 3:
    case 5:
      return 'secondary'; // Paused / Overdue - gray/yellow
    default:
      return 'outline';
  }
}
