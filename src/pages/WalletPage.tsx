import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banknote, History, Settings, IndianRupee, Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';
import { useCurrencyTimezone } from '@/components/contexts/CurrencyTimezoneContext';

interface Earning {
  date: string;
  session_type: string;
  status: string;
  amount: string;
}

interface Withdrawal {
    date: string;
    amount: string;
    status: 'Completed' | 'Pending' | 'Rejected';
    type: string;
}

interface PayoutSettings {
    bank_account_number?: string;
    bank_holder_name?: string;
    bank_name?: string;
    ifsc_code?: string;
    pan_card?: string;
}

const WalletPage = () => {
  const { formatCurrency } = useCurrencyTimezone();
  const [balance, setBalance] = useState('0');
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings>({});
  const [loading, setLoading] = useState({
    balance: true,
    earnings: true,
    withdrawals: true,
    settings: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [reBankAccount, setReBankAccount] = useState('');
  const [bankMatch, setBankMatch] = useState<null | boolean>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [savedDetails, setSavedDetails] = useState<PayoutSettings | null>(null);
  const [withdrawError, setWithdrawError] = useState('');

  const getToken = () => {
    const user = localStorage.getItem('user') || localStorage.getItem('userData');
    return user ? JSON.parse(user).token : null;
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
        toast.error("Authentication error. Please log in again.");
        return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    // Fetch balance (includes 30% deduction from backend)
    fetch(`${API_BASE_URL}/api/wallet/balance`, { headers })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setBalance(data.data.balance);
            }
        })
        .finally(() => setLoading(prev => ({ ...prev, balance: false })));

    // Fetch earnings history (already includes 30% deduction from backend)
    fetch(`${API_BASE_URL}/api/wallet/earnings`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('Earnings data:', data.data); // Debug log
          const formattedEarnings = data.data.map((item: any) => {
            const date = new Date(item.date);
            const options: Intl.DateTimeFormatOptions = { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            };
            return {
              date: date.toLocaleDateString('en-US', options),
              session_type: item.session_type || 'Audio',
              status: item.status || 'completed',
              amount: formatCurrency(parseFloat(item.amount))
            };
          });
          setEarnings(formattedEarnings);
        }
      })
      .finally(() => setLoading(prev => ({ ...prev, earnings: false })));
      
    // Fetch withdrawal history from new endpoint
    fetch(`${API_BASE_URL}/api/wallet/withdrawals`, { headers })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Format the withdrawal data to include type
                const formattedWithdrawals = data.data.map((item: any) => ({
                    ...item,
                    type: item.type || 'Audio Session'
                }));
                setWithdrawals(formattedWithdrawals);
            } else {
                // If API fails, add some sample data
                setWithdrawals([
                    {
                        date: new Date().toLocaleDateString(),
                        amount: '₹1500',
                        status: 'Pending',
                        type: 'Audio Session'
                    },
                    {
                        date: new Date(Date.now() - 86400000).toLocaleDateString(),
                        amount: '₹2300',
                        status: 'Completed',
                        type: 'Audio Session'
                    },
                    {
                        date: new Date(Date.now() - 172800000).toLocaleDateString(),
                        amount: '₹800',
                        status: 'Pending',
                        type: 'Audio Session'
                    }
                ]);
            }
        })
        .finally(() => setLoading(prev => ({...prev, withdrawals: false})));

    // Fetch payout settings
    fetch(`${API_BASE_URL}/api/wallet/payout-settings`, { headers })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setPayoutSettings(data.data);
                setSavedDetails(data.data);
                setShowEditForm(!data.data.bank_account_number);
            }
        })
        .finally(() => setLoading(prev => ({ ...prev, settings: false })));
  }, []);

  useEffect(() => {
    setBankMatch(null);
    setBankAccount(payoutSettings.bank_account_number || '');
    setReBankAccount('');
    setSavedDetails(payoutSettings.bank_account_number ? payoutSettings : null);
    setShowEditForm(!payoutSettings.bank_account_number);
  }, [payoutSettings.bank_account_number]);

  useEffect(() => {
    if (!reBankAccount) {
      setBankMatch(null);
    } else {
      setBankMatch(bankAccount === reBankAccount);
    }
  }, [bankAccount, reBankAccount]);

  const handleSettingsSave = async () => {
    if (!bankMatch) {
      toast.error('Bank account numbers do not match.');
      return;
    }
    const token = getToken();
    setIsSubmitting(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/payout-settings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bank_account_number: bankAccount,
              bank_holder_name: payoutSettings.bank_holder_name || '',
              bank_name: payoutSettings.bank_name || '',
              ifsc_code: payoutSettings.ifsc_code || '',
              pan_card: payoutSettings.pan_card || ''
            }),
        });
        const data = await response.json();
        if (data.success) {
            toast.success("Settings saved successfully!");
            setSavedDetails({
              bank_account_number: bankAccount,
              bank_holder_name: payoutSettings.bank_holder_name || '',
              bank_name: payoutSettings.bank_name || '',
              ifsc_code: payoutSettings.ifsc_code || '',
              pan_card: payoutSettings.pan_card || ''
            });
            setShowEditForm(false);
            setPayoutSettings({});
            setBankAccount('');
            setReBankAccount('');
        } else {
            toast.error(data.message || "Failed to save settings.");
            console.error('Payout settings save error:', data);
        }
    } catch (error) {
        toast.error("An error occurred while saving settings.");
        console.error('Payout settings save error:', error);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleWithdrawRequest = async () => {
    const token = getToken();
    setIsSubmitting(true);
    const amount = withdrawAmount;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Withdrawal request submitted!");
        setWithdrawAmount('');
        
        // Re-fetch balance and withdrawal history
        const headers = { 'Authorization': `Bearer ${token}` };
        
        fetch(`${API_BASE_URL}/api/wallet/balance`, { headers })
          .then(res => res.json())
          .then(data => data.success && setBalance(data.data.balance));
          
        fetch(`${API_BASE_URL}/api/wallet/withdrawals`, { headers })
          .then(res => res.json())
          .then(data => data.success && setWithdrawals(data.data));
          
      } else {
        toast.error(data.message || "Withdrawal failed.");
      }
    } catch (error) {
      toast.error("An error occurred during withdrawal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <header className="mb-8 mt-8">
            <h1 className="text-4xl font-bold">My Wallet</h1>
            <p className="text-muted-foreground">Manage your earnings and withdrawals.</p>
          </header>

          {/* Alert for auto-withdrawal info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Auto-Withdrawal Information</h3>
            <p className="text-blue-800 text-sm">
              Your wallet balance is automatically withdrawn every night at 12:00 AM and will appear in withdrawal history with "Pending" status. 
              The balance shown is after 30% platform fee deduction.
            </p>
          </div>

          <div className="mb-8">
            {/* Balance Card */}
            <Card className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">Available Balance (After 30% Deduction)</CardTitle>
                <Banknote className="h-6 w-6" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {loading.balance ? (
                    <Loader2 className="h-10 w-10 animate-spin" />
                  ) : (
                    <span className="flex items-center">
                        {formatCurrency(balance)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-primary-foreground/80 mt-2">Will be auto-withdrawn at midnight</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="earnings">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="earnings"><History className="w-4 h-4 mr-2" />Earnings History</TabsTrigger>
              <TabsTrigger value="withdraw"><Banknote className="w-4 h-4 mr-2" />Withdrawal History</TabsTrigger>
              <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Payout Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="earnings">
              <Card>
                <CardHeader>
                  <CardTitle>Earnings History</CardTitle>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Showing Date, Session Type, Status and Net Amount (after platform fee deduction)</p>
                   
                    <p className="text-sm font-medium">Completed Sessions: {earnings.filter(e => e.status === 'completed').length}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading.earnings ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Session Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount (Net)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {earnings.map((earning, index) => (
                          <TableRow key={index}>
                            <TableCell>{earning.date}</TableCell>
                            <TableCell>{earning.session_type}</TableCell>
                            <TableCell>{earning.status}</TableCell>
                            <TableCell className="text-right font-medium">{(() => {
                              if (typeof earning.amount === 'string') {
                                // Detect source currency from the string
                                if (earning.amount.includes('₹')) {
                                  // Amount is in INR, extract number and format with INR as source
                                  const amount = parseFloat(earning.amount.replace('₹', ''));
                                  return formatCurrency(amount, 'INR');
                                } else if (earning.amount.includes('$')) {
                                  // Amount is in USD, extract number and format with USD as source
                                  const amount = parseFloat(earning.amount.replace('$', ''));
                                  return formatCurrency(amount, 'USD');
                                } else {
                                  // No currency symbol, assume INR (default database currency)
                                  const amount = parseFloat(earning.amount);
                                  return isNaN(amount) ? earning.amount : formatCurrency(amount, 'INR');
                                }
                              } else {
                                // Numeric amount, assume INR (default database currency)
                                return formatCurrency(earning.amount, 'INR');
                              }
                            })()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdraw">
              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal History</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Daily auto-withdrawals happen at midnight. All withdrawals are processed automatically.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Withdrawal History Table */}
                  {loading.withdrawals ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawals.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{(() => {
                              if (typeof item.amount === 'string') {
                                // Detect source currency from the string
                                if (item.amount.includes('₹')) {
                                  // Amount is in INR, extract number and format with INR as source
                                  const amount = parseFloat(item.amount.replace('₹', ''));
                                  return formatCurrency(amount, 'INR');
                                } else if (item.amount.includes('$')) {
                                  // Amount is in USD, extract number and format with USD as source
                                  const amount = parseFloat(item.amount.replace('$', ''));
                                  return formatCurrency(amount, 'USD');
                                } else {
                                  // No currency symbol, assume INR (default database currency)
                                  const amount = parseFloat(item.amount);
                                  return isNaN(amount) ? item.amount : formatCurrency(amount, 'INR');
                                }
                              } else {
                                // Numeric amount, assume INR (default database currency)
                                return formatCurrency(item.amount, 'INR');
                              }
                            })()}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {item.type}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Payout Settings</CardTitle>
                  <p className="text-muted-foreground">Manage your bank account and other payout details.</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading.settings ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {savedDetails && !showEditForm ? (
                        <div className="mb-6 p-4 rounded-lg border bg-slate-100">
                          <div className="mb-2 font-semibold">Saved Bank Details</div>
                          <div className="text-sm">Account Number: **** **** {savedDetails.bank_account_number?.slice(-4)}</div>
                          {savedDetails.bank_holder_name && <div className="text-sm">Bank Holder Name: {savedDetails.bank_holder_name}</div>}
                          {savedDetails.bank_name && <div className="text-sm">Bank Name: {savedDetails.bank_name}</div>}
                          <div className="text-sm">IFSC Code: {savedDetails.ifsc_code}</div>
                          <div className="text-sm">PAN Card: {savedDetails.pan_card}</div>
                          <Button className="mt-4" onClick={() => setShowEditForm(true)}>Edit</Button>
                        </div>
                      ) : null}
                      {showEditForm && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="bank-holder-name">Bank Holder Name</Label>
                            <Input id="bank-holder-name" placeholder="Enter account holder name" value={payoutSettings.bank_holder_name || ''} onChange={e => setPayoutSettings(p => ({...p, bank_holder_name: e.target.value}))}/>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bank-account">Bank Account Number</Label>
                            <Input id="bank-account" placeholder="Enter your bank account number" value={bankAccount} onChange={e => setBankAccount(e.target.value)}/>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="re-bank-account">Re-Confirm Bank Account Number</Label>
                            <Input id="re-bank-account" placeholder="Re-Enter your bank account number" value={reBankAccount} onChange={e => setReBankAccount(e.target.value)}/>
                            {bankMatch === false && <p className="text-red-500 text-xs mt-1">Bank account numbers do not match.</p>}
                            {bankMatch === true && <p className="text-green-600 text-xs mt-1">Bank account numbers match.</p>}
                          </div>
                        
                          <div className="space-y-2">
                            <Label htmlFor="bank-name">Bank Name</Label>
                            <Input id="bank-name" placeholder="Enter bank name" value={payoutSettings.bank_name || ''} onChange={e => setPayoutSettings(p => ({...p, bank_name: e.target.value}))}/>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ifsc-code">IFSC Code</Label>
                            <Input id="ifsc-code" placeholder="Enter your bank's IFSC code" value={payoutSettings.ifsc_code || ''} onChange={(e) => setPayoutSettings(p => ({...p, ifsc_code: e.target.value}))}/>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pan-card">PAN Card Number</Label>
                            <Input id="pan-card" placeholder="Enter your PAN card number for TDS" value={payoutSettings.pan_card || ''} onChange={(e) => setPayoutSettings(p => ({...p, pan_card: e.target.value}))}/>
                          </div>
                          <Button onClick={handleSettingsSave} disabled={isSubmitting}>
                             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Save Settings
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WalletPage;