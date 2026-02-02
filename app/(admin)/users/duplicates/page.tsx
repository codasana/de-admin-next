'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  useDuplicateUsers,
  useMovePlan,
  useDeleteUserPlan,
  useDeleteEmptyUser,
  useUpdateUserEmail,
  getPlanStatusLabel,
  getPlanStatusColor,
  type DuplicateUser,
  type DuplicateGroup,
  type UserPlanInfo,
} from '@/hooks/useDuplicateUsers'
import { Input } from "@/components/ui/input"
import { 
  IconRefresh, 
  IconChevronDown, 
  IconChevronRight,
  IconArrowRight,
  IconTrash,
  IconUser,
  IconCalendar,
  IconMail,
  IconEdit,
} from "@tabler/icons-react"
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Type for the move plan dialog state
interface MovePlanDialogState {
  isOpen: boolean;
  plan: UserPlanInfo | null;
  fromUser: DuplicateUser | null;
  toUser: DuplicateUser | null;
  group: DuplicateGroup | null;
}

// Type for the delete plan dialog state
interface DeletePlanDialogState {
  isOpen: boolean;
  plan: UserPlanInfo | null;
  user: DuplicateUser | null;
}

// Type for the delete user dialog state
interface DeleteUserDialogState {
  isOpen: boolean;
  user: DuplicateUser | null;
}

// Type for the edit email dialog state
interface EditEmailDialogState {
  isOpen: boolean;
  user: DuplicateUser | null;
  email: string;
}

export default function DuplicateUsersPage() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null)
  const [updatingEmailUserId, setUpdatingEmailUserId] = useState<number | null>(null)
  const [movePlanDialog, setMovePlanDialog] = useState<MovePlanDialogState>({
    isOpen: false,
    plan: null,
    fromUser: null,
    toUser: null,
    group: null,
  })
  const [deletePlanDialog, setDeletePlanDialog] = useState<DeletePlanDialogState>({
    isOpen: false,
    plan: null,
    user: null,
  })
  const [deleteUserDialog, setDeleteUserDialog] = useState<DeleteUserDialogState>({
    isOpen: false,
    user: null,
  })
  const [editEmailDialog, setEditEmailDialog] = useState<EditEmailDialogState>({
    isOpen: false,
    user: null,
    email: '',
  })

  const { data, isLoading, error, refetch } = useDuplicateUsers()
  const movePlanMutation = useMovePlan()
  const deletePlanMutation = useDeleteUserPlan()
  const deleteUserMutation = useDeleteEmptyUser()
  const updateEmailMutation = useUpdateUserEmail()

  // Clear deletingUserId when the user is no longer in the data (after successful deletion)
  useEffect(() => {
    if (deletingUserId && data?.data) {
      const userStillExists = data.data.some(group => 
        group.users.some(user => user.id === deletingUserId)
      )
      if (!userStillExists) {
        setDeletingUserId(null)
      }
    }
  }, [data, deletingUserId])

  // Clear deletingPlanId when the plan is no longer in the data (after successful deletion)
  useEffect(() => {
    if (deletingPlanId && data?.data) {
      const planStillExists = data.data.some(group => 
        group.users.some(user => 
          user.plans.some(plan => plan.id === deletingPlanId)
        )
      )
      if (!planStillExists) {
        setDeletingPlanId(null)
      }
    }
  }, [data, deletingPlanId])

  const toggleGroup = (email: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(email)) {
        next.delete(email)
      } else {
        next.add(email)
      }
      return next
    })
  }

  const expandAll = () => {
    if (data?.data) {
      setExpandedGroups(new Set(data.data.map(g => g.email)))
    }
  }

  const collapseAll = () => {
    setExpandedGroups(new Set())
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '-'
    return `$${price.toFixed(2)}`
  }

  // Handle move plan
  const handleMovePlan = (plan: UserPlanInfo, fromUser: DuplicateUser, group: DuplicateGroup) => {
    // Find the other user in the group to move to
    const otherUsers = group.users.filter(u => u.id !== fromUser.id)
    if (otherUsers.length === 1) {
      // Only one other user, use that
      setMovePlanDialog({
        isOpen: true,
        plan,
        fromUser,
        toUser: otherUsers[0],
        group,
      })
    } else {
      // Multiple users, need to select (for now just pick the first one)
      // In future, could show a select dialog
      setMovePlanDialog({
        isOpen: true,
        plan,
        fromUser,
        toUser: otherUsers[0],
        group,
      })
    }
  }

  const confirmMovePlan = async () => {
    if (!movePlanDialog.plan || !movePlanDialog.fromUser || !movePlanDialog.toUser) return
    
    try {
      await movePlanMutation.mutateAsync({
        userPlanId: movePlanDialog.plan.id,
        fromUserId: movePlanDialog.fromUser.id,
        toUserId: movePlanDialog.toUser.id,
      })
      toast.success('Plan moved successfully')
      setMovePlanDialog({ isOpen: false, plan: null, fromUser: null, toUser: null, group: null })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to move plan')
    }
  }

  // Handle delete plan
  const handleDeletePlan = (plan: UserPlanInfo, user: DuplicateUser) => {
    setDeletePlanDialog({
      isOpen: true,
      plan,
      user,
    })
  }

  const confirmDeletePlan = async () => {
    if (!deletePlanDialog.plan || !deletePlanDialog.user) return
    
    const planId = deletePlanDialog.plan.id
    const userId = deletePlanDialog.user.id
    const planPlanId = deletePlanDialog.plan.planId
    
    setDeletingPlanId(planId)
    setDeletePlanDialog({ isOpen: false, plan: null, user: null })
    
    try {
      await deletePlanMutation.mutateAsync({
        userId: userId,
        planId: planPlanId,
      })
      toast.success('Plan deleted successfully')
      // Note: deletingPlanId will clear when plan disappears from data after refetch
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete plan')
      setDeletingPlanId(null)
    }
  }

  // Handle delete user
  const handleDeleteUser = (user: DuplicateUser) => {
    setDeleteUserDialog({
      isOpen: true,
      user,
    })
  }

  // Handle edit email
  const handleEditEmail = (user: DuplicateUser) => {
    setEditEmailDialog({
      isOpen: true,
      user,
      email: user.email,
    })
  }

  const confirmEditEmail = async () => {
    if (!editEmailDialog.user || !editEmailDialog.email.trim()) return
    
    const userId = editEmailDialog.user.id
    setUpdatingEmailUserId(userId)
    setEditEmailDialog({ isOpen: false, user: null, email: '' })
    
    try {
      await updateEmailMutation.mutateAsync({
        userId: userId,
        email: editEmailDialog.email.trim(),
      })
      toast.success('Email updated successfully')
      setUpdatingEmailUserId(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update email')
      setUpdatingEmailUserId(null)
    }
  }

  const confirmDeleteUser = async () => {
    if (!deleteUserDialog.user) return
    
    const userId = deleteUserDialog.user.id
    setDeletingUserId(userId)
    setDeleteUserDialog({ isOpen: false, user: null })
    
    try {
      await deleteUserMutation.mutateAsync(userId)
      toast.success('User deleted successfully')
      // Note: deletingUserId will clear when user disappears from data after refetch
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
      setDeletingUserId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Duplicate User Accounts</h1>
          <p className="text-muted-foreground">
            Manage and merge users with the same email address
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={expandAll} disabled={isLoading || !data?.data?.length}>
            Expand All
          </Button>
          <Button variant="outline" onClick={collapseAll} disabled={isLoading || expandedGroups.size === 0}>
            Collapse All
          </Button>
          <Button onClick={() => refetch()} disabled={isLoading}>
            <IconRefresh className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary */}
      {data && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span><strong>{data.totalGroups}</strong> duplicate email groups</span>
          <span>|</span>
          <span><strong>{data.totalDuplicateAccounts}</strong> total accounts</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading duplicate users...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Error loading duplicate users: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.data?.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No duplicate user accounts found.</p>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Groups */}
      {!isLoading && !error && data?.data && data.data.length > 0 && (
        <div className="flex flex-col gap-4">
          {data.data.map((group) => (
            <Card key={group.email} className="overflow-hidden">
              {/* Group Header */}
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleGroup(group.email)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedGroups.has(group.email) ? (
                      <IconChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <IconChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex items-center gap-2">
                      <IconMail className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{group.email}</CardTitle>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {group.accountCount} accounts
                  </Badge>
                </div>
              </CardHeader>

              {/* Group Content - User Cards */}
              {expandedGroups.has(group.email) && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.users.map((user) => (
                      <Card key={user.id} className={`border-2 ${user.is_deleted ? 'opacity-60 bg-muted/50' : ''}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                <IconUser className="h-4 w-4" />
                                {user.first || user.last 
                                  ? `${user.first || ''} ${user.last || ''}`.trim()
                                  : 'No Name'}
                                {user.is_deleted && (
                                  <Badge variant="destructive" className="text-xs">Deleted</Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="mt-1 space-y-0.5">
                                <div className="font-mono text-xs">ID: {user.id}</div>
                                <div className="text-xs flex items-center gap-1">
                                  {updatingEmailUserId === user.id ? (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      <span className="text-muted-foreground">Updating email...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>{user.email}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditEmail(user)
                                        }}
                                      >
                                        <IconEdit className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </CardDescription>
                            </div>
                            <Badge variant={user.planCount > 0 ? 'default' : 'outline'}>
                              {user.planCount} plan{user.planCount !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* User Details */}
                          <div className="text-sm space-y-1 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <IconCalendar className="h-4 w-4" />
                              <span>Created: {formatDate(user.createdAt)}</span>
                            </div>
                            {user.phone && (
                              <div>Phone: {user.phone}</div>
                            )}
                            {user.notes && (
                              <div className="text-xs bg-muted p-2 rounded">
                                Notes: {user.notes}
                              </div>
                            )}
                          </div>

                          {/* Plans */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Plans:</h4>
                            {user.plans.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic">No plans</p>
                            ) : (
                              <div className="space-y-2">
                                {user.plans.map((plan) => (
                                  <div 
                                    key={plan.id} 
                                    className="border rounded-lg p-3 space-y-2 bg-muted/30"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <div className="font-medium text-sm">{plan.planName}</div>
                                        {plan.productName && (
                                          <div className="text-xs text-muted-foreground">
                                            {plan.productName}
                                          </div>
                                        )}
                                      </div>
                                      <Badge variant={getPlanStatusColor(plan.mm_status)}>
                                        {getPlanStatusLabel(plan.mm_status)}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                      <div>Price: {formatPrice(plan.planPrice)}</div>
                                      <div>Start: {formatDate(plan.start_date)}</div>
                                      {plan.end_date && (
                                        <div>End: {formatDate(plan.end_date)}</div>
                                      )}
                                      {plan.planTrial && (
                                        <Badge variant="outline" className="text-xs">Trial</Badge>
                                      )}
                                    </div>
                                    {/* Plan Actions */}
                                    <div className="flex gap-2 pt-1">
                                      {group.users.length > 1 && (
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleMovePlan(plan, user, group)}
                                          disabled={movePlanMutation.isPending}
                                        >
                                          <IconArrowRight className="h-3 w-3 mr-1" />
                                          Move
                                        </Button>
                                      )}
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleDeletePlan(plan, user)}
                                        disabled={deletingPlanId === plan.id}
                                      >
                                        {deletingPlanId === plan.id ? (
                                          <>
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                            Deleting...
                                          </>
                                        ) : (
                                          <>
                                            <IconTrash className="h-3 w-3 mr-1" />
                                            Delete
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Delete User Button - show if user has no plans */}
                          {user.planCount === 0 && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => handleDeleteUser(user)}
                              disabled={deletingUserId === user.id}
                            >
                              {deletingUserId === user.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <IconTrash className="h-4 w-4 mr-2" />
                                  {user.is_deleted ? 'Permanently Delete' : 'Delete This Account'}
                                </>
                              )}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Move Plan Dialog */}
      <AlertDialog open={movePlanDialog.isOpen} onOpenChange={(open) => !open && setMovePlanDialog({ isOpen: false, plan: null, fromUser: null, toUser: null, group: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move Plan to Another Account</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Are you sure you want to move this plan?</p>
                {movePlanDialog.plan && movePlanDialog.fromUser && movePlanDialog.toUser && (
                  <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
                    <div><strong>Plan:</strong> {movePlanDialog.plan.planName}</div>
                    <div><strong>From:</strong> User #{movePlanDialog.fromUser.id} ({movePlanDialog.fromUser.first || movePlanDialog.fromUser.email})</div>
                    <div><strong>To:</strong> User #{movePlanDialog.toUser.id} ({movePlanDialog.toUser.first || movePlanDialog.toUser.email})</div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMovePlan} disabled={movePlanMutation.isPending}>
              {movePlanMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Moving...
                </>
              ) : (
                'Move Plan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Plan Dialog */}
      <AlertDialog open={deletePlanDialog.isOpen} onOpenChange={(open) => !open && setDeletePlanDialog({ isOpen: false, plan: null, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Are you sure you want to delete this plan? This action cannot be undone.</p>
                {deletePlanDialog.plan && deletePlanDialog.user && (
                  <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                    <div><strong>Plan:</strong> {deletePlanDialog.plan.planName}</div>
                    <div><strong>User:</strong> #{deletePlanDialog.user.id} ({deletePlanDialog.user.email})</div>
                    <div><strong>Status:</strong> {getPlanStatusLabel(deletePlanDialog.plan.mm_status)}</div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePlan} 
              disabled={deletePlanMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePlanMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Plan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteUserDialog.isOpen} onOpenChange={(open) => !open && setDeleteUserDialog({ isOpen: false, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Are you sure you want to <strong>permanently delete</strong> this user account? This action cannot be undone.</p>
                {deleteUserDialog.user && (
                  <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                    <div><strong>User ID:</strong> {deleteUserDialog.user.id}</div>
                    <div><strong>Email:</strong> {deleteUserDialog.user.email}</div>
                    <div><strong>Name:</strong> {deleteUserDialog.user.first || deleteUserDialog.user.last ? `${deleteUserDialog.user.first || ''} ${deleteUserDialog.user.last || ''}`.trim() : 'No name'}</div>
                    <div><strong>Created:</strong> {formatDate(deleteUserDialog.user.createdAt)}</div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser} 
              disabled={deleteUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Email Dialog */}
      <AlertDialog open={editEmailDialog.isOpen} onOpenChange={(open) => !open && setEditEmailDialog({ isOpen: false, user: null, email: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Email Address</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Update the email address for this user.</p>
                {editEmailDialog.user && (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <strong>User:</strong> #{editEmailDialog.user.id} - {editEmailDialog.user.first || editEmailDialog.user.last ? `${editEmailDialog.user.first || ''} ${editEmailDialog.user.last || ''}`.trim() : 'No name'}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={editEmailDialog.email}
                        onChange={(e) => setEditEmailDialog(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter new email address"
                      />
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmEditEmail} 
              disabled={updateEmailMutation.isPending || !editEmailDialog.email.trim()}
            >
              {updateEmailMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Email'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
