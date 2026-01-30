'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Search, Gift, ArrowUpRight, ArrowDownRight, User } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface CreditTransaction {
  id: number
  amount: string
  type: 'earned' | 'used' | 'expired' | 'adjusted'
  source: 'sale' | 'purchase' | 'referral_sale' | 'referral_signup' | 'manual'
  referenceId: string | null
  description: string
  balance: string
  expiresAt: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

interface UserInfo {
  id: number
  first: string | null
  last: string | null
  email: string
}

interface CreditData {
  user: UserInfo
  balance: number
  transactions: CreditTransaction[]
}

export default function RewardsCreditsPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [creditData, setCreditData] = useState<CreditData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    setIsLoading(true)
    setError(null)
    setCreditData(null)

    try {
      const response = await api.get(`/api/credits/admin/user?email=${encodeURIComponent(email.trim())}`)
      setCreditData(response.data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch credit data'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } }
        if (axiosError.response?.data?.error) {
          setError(axiosError.response.data.error)
        } else {
          setError(errorMessage)
        }
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (amount: number) => {
    if (amount > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />
    }
    return <ArrowDownRight className="h-4 w-4 text-red-600" />
  }

  const getTypeBadge = (type: string) => {
    const badges: Record<string, React.ReactNode> = {
      earned: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Earned</Badge>,
      used: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Used</Badge>,
      expired: <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Expired</Badge>,
      adjusted: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Adjusted</Badge>,
    }
    return badges[type] || <Badge>{type}</Badge>
  }

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      sale: 'Direct Sale',
      purchase: 'Purchase',
      referral_sale: 'Referral Sale',
      referral_signup: 'Referral Signup',
      manual: 'Manual Adjustment',
    }
    return labels[source] || source
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Member Credits</h1>
        <p className="text-muted-foreground">
          Search for a member by email to view their credit balance and transaction history
        </p>
      </div>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Search Member</CardTitle>
          <CardDescription>
            Enter the member&apos;s email address to look up their credit information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="email" className="sr-only">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter member email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Search</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {creditData && (
        <>
          {/* User Info & Balance Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {creditData.user.first && creditData.user.last 
                        ? `${creditData.user.first} ${creditData.user.last}`
                        : creditData.user.email}
                    </h3>
                    <p className="text-sm text-muted-foreground">{creditData.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      User ID:{' '}
                      <a 
                        href={`https://admin.deepenglish.com/users/${creditData.user.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {creditData.user.id}
                      </a>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Gift className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Credit Balance</span>
                  </div>
                  <p className="text-3xl font-bold text-primary">{creditData.balance}</p>
                  <p className="text-xs text-muted-foreground">
                    {creditData.balance === 0 && "No discount"}
                    {creditData.balance === 1 && "33% off next payment"}
                    {creditData.balance === 2 && "66% off next payment"}
                    {creditData.balance >= 3 && "FREE next payment!"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                {creditData.transactions.length} transaction{creditData.transactions.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {creditData.transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No transactions yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditData.transactions.map((transaction) => {
                        const amount = parseFloat(transaction.amount)
                        return (
                          <TableRow key={transaction.id}>
                            <TableCell className="whitespace-nowrap text-sm">
                              {formatDate(transaction.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTransactionIcon(amount)}
                                <span className="text-sm">{transaction.description}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getTypeBadge(transaction.type)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {getSourceLabel(transaction.source)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {amount > 0 ? '+' : ''}{amount}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {parseFloat(transaction.balance)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
