'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Gift, 
  Webhook, 
  Database, 
  Code, 
  CheckCircle2,
  ArrowRight,
  Percent
} from 'lucide-react'

export default function RewardsDocumentationPage() {
  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Credit Rewards System Documentation</h1>
        <p className="text-muted-foreground">
          How credits are recorded, tracked, and used for member discounts
        </p>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The Credit Rewards System allows members to earn credits through referrals and use them as discounts on their FFF subscription payments.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <div className="text-2xl font-bold text-green-600">1 Credit</div>
              <div className="text-sm text-green-700 dark:text-green-400">33% off next payment</div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
              <div className="text-2xl font-bold text-blue-600">2 Credits</div>
              <div className="text-sm text-blue-700 dark:text-blue-400">66% off next payment</div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
              <div className="text-2xl font-bold text-purple-600">3 Credits</div>
              <div className="text-sm text-purple-700 dark:text-purple-400">100% off (free month!)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: How Credits Are Earned */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            How Credits Are Earned
          </CardTitle>
          <CardDescription>
            Credits are awarded automatically via PushLap Growth webhook events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PushLap Event</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-sm">referral.created</TableCell>
                  <TableCell>Records trial signup (tracking only)</TableCell>
                  <TableCell><Badge variant="secondary">0</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-sm">sale.created</TableCell>
                  <TableCell>Awards credit to the referrer</TableCell>
                  <TableCell><Badge className="bg-green-100 text-green-800">+1</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-sm">sale.deleted (NOT TESTED)</TableCell>
                  <TableCell>Revokes credit (cancellation/refund)</TableCell>
                  <TableCell><Badge className="bg-red-100 text-red-800">-1</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Webhook className="h-4 w-4" />
              Webhook Endpoint
            </div>
            <code className="text-sm bg-background px-2 py-1 rounded">POST /api/webhooks/pushlap</code>
          </div>
        </CardContent>
      </Card>

      {/* Step 4: How Credits Are Applied (Automatic) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            How Credits Are Applied (Automatic)
          </CardTitle>
          <CardDescription>
            Credits are applied automatically via Stripe webhook when an invoice is created
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900 mb-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Webhook className="h-4 w-4" />
              Trigger: Stripe Webhook
            </div>
            <code className="text-sm bg-background px-2 py-1 rounded">POST /api/webhooks/stripe → invoice.created</code>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">1</div>
              <div>
                <div className="font-medium">Stripe sends invoice.created webhook</div>
                <div className="text-sm text-muted-foreground">When a subscription payment is due, Stripe creates a draft invoice and sends a webhook</div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">2</div>
              <div>
                <div className="font-medium">Find user by email &amp; check credit balance</div>
                <div className="text-sm text-muted-foreground">System looks up the user by the invoice&apos;s customer email and checks their credit balance</div>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">3</div>
              <div>
                <div className="font-medium">Apply coupon to draft invoice</div>
                <div className="text-sm text-muted-foreground">
                  If user has credits, applies appropriate coupon to the draft invoice:
                  <span className="block mt-1">
                    1 credit → <code className="text-xs bg-background px-1 rounded">referral_33</code> (33% off)
                  </span>
                  <span className="block">
                    2 credits → <code className="text-xs bg-background px-1 rounded">referral_66</code> (66% off)
                  </span>
                  <span className="block">
                    3+ credits → <code className="text-xs bg-background px-1 rounded">referral_100</code> (100% off)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">4</div>
              <div>
                <div className="font-medium">Deduct credits</div>
                <div className="text-sm text-muted-foreground">Creates a &quot;used&quot; transaction record with the invoice ID as reference</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New User Referral Discount */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            New User Referral Discount
          </CardTitle>
          <CardDescription>
            When someone purchases using a referral link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Percent className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-green-800 dark:text-green-200">50% OFF First Payment</div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  New users who purchase via a referral link automatically receive coupon{' '}
                  <code className="bg-green-100 dark:bg-green-900 px-1 rounded">REFERRAL_50</code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Coupons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Stripe Coupons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">For Referrer Credits (existing members)</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coupon ID</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-sm">referral_33</TableCell>
                    <TableCell>33% off</TableCell>
                    <TableCell>Once</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">referral_66</TableCell>
                    <TableCell>66% off</TableCell>
                    <TableCell>Once</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">referral_100</TableCell>
                    <TableCell>100% off</TableCell>
                    <TableCell>Once</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">For New Referred Users</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coupon ID</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-sm">REFERRAL_50</TableCell>
                    <TableCell>50% off</TableCell>
                    <TableCell>First payment only</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
