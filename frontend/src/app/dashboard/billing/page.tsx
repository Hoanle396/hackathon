'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowUpCircle,
  Wallet,
  ExternalLink
} from 'lucide-react';
import { ethers, BrowserProvider } from 'ethers';

// Extend Window interface for Web3
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Subscription {
  id: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'canceled' | 'expired' | 'past_due' | 'trialing';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  currentMonthReviews: number;
  monthlyReviewLimit: number;
  price: number;
  walletAddress?: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  transactionHash?: string;
  chainId?: number;
  blockNumber?: number;
  fromAddress?: string;
  toAddress?: string;
  createdAt: string;
}

interface UsageStats {
  currentMonthReviews: number;
  monthlyReviewLimit: number;
  usagePercentage: number;
  remainingReviews: number;
}

interface SupportedChain {
  chainId: number;
  name: string;
  usdcAddress: string;
}

const PLAN_PRICES = {
  free: 0,
  starter: 29,
  professional: 99,
  enterprise: 299,
};

// USDC Token ABI (minimal)
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Web3 states
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [supportedChains, setSupportedChains] = useState<SupportedChain[]>([]);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchBillingData();
    checkWalletConnection();
    
    // Check if user came from pricing page with a plan selection
    const planParam = searchParams.get('plan');
    if (planParam && planParam.toLowerCase() !== 'free') {
      // Show info about selected plan
      toast.success(`Selected ${planParam} plan. Connect wallet to proceed with payment.`);
    }
  }, [searchParams]);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0].address);
        }
      } catch (error) {
        console.error('Failed to check wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('Please install MetaMask or another Web3 wallet');
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setWalletAddress(accounts[0]);
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    toast.success('Wallet disconnected');
  };

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const subRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (subRes.ok) {
        const subData = await subRes.json();
        
        // Only set subscription if data exists
        if (subData && subData.id) {
          setSubscription(subData);
          
          // Fetch usage and payments
          const [usageRes, paymentsRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subData.id}/usage`, {
              headers: { 'Authorization': `Bearer ${token}` },
            }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subData.id}/payments`, {
              headers: { 'Authorization': `Bearer ${token}` },
            }),
          ]);

          if (usageRes.ok) {
            const usageData = await usageRes.json();
            setUsage(usageData);
          }

          if (paymentsRes.ok) {
            const paymentsData = await paymentsRes.json();
            setPayments(paymentsData);
          }
        }
      } else if (subRes.status === 404) {
        // No subscription yet - this is normal for new users
        setSubscription(null);
      } else {
        throw new Error('Failed to fetch subscription');
      }
    } catch (error) {
      console.error('Billing data error:', error);
      toast.error('Unable to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async (plan: string) => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Update or create subscription
      let subId = subscription?.id;
      let currentSub = subscription;
      
      if (subId) {
        // Update existing subscription
        const updateRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            plan: plan.toLowerCase(),
            billingCycle: 'monthly'
          }),
        });

        if (!updateRes.ok) throw new Error('Failed to update subscription');
        currentSub = await updateRes.json();
        setSubscription(currentSub);
      } else {
        // Create new subscription
        const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            plan: plan.toLowerCase(),
            billingCycle: 'monthly'
          }),
        });

        if (!createRes.ok) throw new Error('Failed to create subscription');
        currentSub = await createRes.json();
        subId = currentSub?.id || '';
        setSubscription(currentSub);
      }

      // Create payment intent
      const amount = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];
      const paymentRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subId}/payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount,
            walletAddress,
            metadata: { plan },
          }),
        }
      );

      if (!paymentRes.ok) throw new Error('Failed to create payment');
      
      const paymentData = await paymentRes.json();
      setPendingPayment(paymentData);
      setSupportedChains(paymentData.supportedChains);
      
      toast.success('Payment created! Please send USDC to complete.');
      return paymentData;
    } catch (error) {
      console.error('Payment creation failed:', error);
      toast.error('Failed to create payment');
    }
  };

  const sendUSDCPayment = async (chainId: number) => {
    if (!pendingPayment || !walletAddress) return;

    setProcessingPayment(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Switch to correct chain
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      } catch (error: any) {
        if (error.code === 4902) {
          toast.error('Please add this network to your wallet');
          setProcessingPayment(false);
          return;
        }
      }

      // Find chain details
      const chain = supportedChains.find(c => c.chainId === chainId);
      if (!chain) throw new Error('Chain not supported');

      // Create USDC contract instance
      const usdcContract = new ethers.Contract(
        chain.usdcAddress,
        USDC_ABI,
        signer
      );

      // Send USDC
      const amount = ethers.parseUnits(pendingPayment.amount.toString(), 6); // USDC has 6 decimals
      const tx = await usdcContract.transfer(pendingPayment.receiverAddress, amount);
      
      toast.success('Transaction sent! Waiting for confirmation...');
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      toast.success('Transaction confirmed! Verifying...');

      // Verify payment on backend
      const token = localStorage.getItem('token');
      const verifyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/payment/${pendingPayment.payment.id}/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            transactionHash: receipt.hash,
            chainId,
          }),
        }
      );

      if (!verifyRes.ok) throw new Error('Payment verification failed');

      toast.success('Payment verified! Subscription activated!');
      setPendingPayment(null);
      fetchBillingData();
      
    } catch (error: any) {
      console.error('Payment failed:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subscription?.id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error();

      toast.success('Subscription cancelled successfully');
      fetchBillingData();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'default',
      canceled: 'secondary',
      expired: 'destructive',
      past_due: 'destructive',
      trialing: 'secondary',
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'secondary',
      succeeded: 'default',
      failed: 'destructive',
      refunded: 'secondary',
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const calculateProgress = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getBlockExplorerUrl = (chainId: number, txHash: string) => {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io',
      11155111: 'https://sepolia.etherscan.io',
      137: 'https://polygonscan.com',
      80001: 'https://mumbai.polygonscan.com',
      42161: 'https://arbiscan.io',
      421614: 'https://sepolia.arbiscan.io',
      8453: 'https://basescan.org',
      84532: 'https://sepolia.basescan.org',
    };
    return `${explorers[chainId]}/tx/${txHash}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription with USDC payments</p>
        </div>
        <div className="flex gap-2">
          {walletAddress ? (
            <Button variant="outline" onClick={disconnectWallet}>
              <Wallet className="h-4 w-4 mr-2" />
              {formatAddress(walletAddress)}
            </Button>
          ) : (
            <Button onClick={connectWallet} disabled={isConnecting}>
              <Wallet className="h-4 w-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
          <Button onClick={() => router.push('/pricing')}>
            <TrendingUp className="h-4 w-4 mr-2" />
            View Pricing
          </Button>
        </div>
      </div>

      {/* Pending Payment */}
      {pendingPayment && (
        <Card className="border-blue-500 bg-blue-50">
          <CardHeader>
            <CardTitle>Complete Payment</CardTitle>
            <CardDescription>
              Send {pendingPayment.amount} USDC to complete your subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Receiver Address</div>
              <code className="block p-2 bg-white rounded border text-sm">
                {pendingPayment.receiverAddress}
              </code>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Select Network</div>
              <div className="grid grid-cols-2 gap-2">
                {supportedChains.map((chain) => (
                  <Button
                    key={chain.chainId}
                    variant="outline"
                    onClick={() => sendUSDCPayment(chain.chainId)}
                    disabled={processingPayment}
                  >
                    {chain.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>Your current plan and status</CardDescription>
            </div>
            {subscription && getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Plan</div>
                  <div className="text-2xl font-bold">{subscription.plan}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Price</div>
                  <div className="text-2xl font-bold">${subscription.price} USDC/month</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Billing Cycle</div>
                  <div className="text-lg font-medium">{subscription.billingCycle}</div>
                </div>
              </div>

              {subscription.walletAddress && (
                <div className="text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4 inline mr-1" />
                  Payment Wallet: {formatAddress(subscription.walletAddress)}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </div>

              <div className="flex gap-2 pt-4 flex-wrap">
                {subscription.plan === 'free' && (
                  <>
                    <Button onClick={async () => {
                      const token = localStorage.getItem('token');
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subscription.id}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ plan: 'starter' }),
                      });
                      if (res.ok) {
                        toast.success('Upgraded to Starter!');
                        fetchBillingData();
                      }
                    }} variant="outline">
                      Quick Upgrade to Starter (Demo)
                    </Button>
                    <Button onClick={async () => {
                      const token = localStorage.getItem('token');
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subscription.id}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ plan: 'professional' }),
                      });
                      if (res.ok) {
                        toast.success('Upgraded to Professional!');
                        fetchBillingData();
                      }
                    }}>
                      Quick Upgrade to Pro (Demo)
                    </Button>
                  </>
                )}
                {subscription.plan === 'starter' && (
                  <Button onClick={async () => {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subscription.id}`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify({ plan: 'PROFESSIONAL' }),
                    });
                    if (res.ok) {
                      toast.success('Upgraded to Professional!');
                      fetchBillingData();
                    }
                  }}>
                    Quick Upgrade to Pro (Demo)
                  </Button>
                )}
                {walletAddress && subscription.plan !== 'enterprise' && (
                  <Button onClick={() => createPaymentIntent(subscription.plan === 'free' ? 'starter' : 'professional')} variant="secondary">
                    <Wallet className="h-4 w-4 mr-2" />
                    Pay with USDC
                  </Button>
                )}
                {!walletAddress && subscription.plan !== 'enterprise' && (
                  <Button onClick={connectWallet} variant="secondary">
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                )}
                {subscription.status === 'active' && subscription.plan !== 'free' && (
                  <Button variant="destructive" onClick={handleCancelSubscription}>
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No active subscription</p>
              <Button onClick={() => router.push('/pricing')}>
                View Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      {usage && subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Code Reviews</span>
                <span className="text-sm text-muted-foreground">
                  {usage.currentMonthReviews} / {usage.monthlyReviewLimit === -1 ? '∞' : usage.monthlyReviewLimit}
                </span>
              </div>
              <Progress value={usage.usagePercentage} />
              {usage.monthlyReviewLimit !== -1 && usage.usagePercentage >= 80 && (
                <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  Approaching limit! Consider upgrading.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>USDC transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      payment.status === 'succeeded' ? 'bg-green-100' : 
                      payment.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {payment.status === 'succeeded' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : payment.status === 'failed' ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {payment.amount} {payment.currency}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </div>
                      {payment.transactionHash && payment.chainId && (
                        <a
                          href={getBlockExplorerUrl(payment.chainId, payment.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          View on Explorer
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {payment.fromAddress && (
                      <span className="text-sm text-muted-foreground">
                        {formatAddress(payment.fromAddress)}
                      </span>
                    )}
                    {getPaymentStatusBadge(payment.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
