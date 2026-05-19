import { useMemo, useState, useEffect } from 'react';
import { FileCheck2, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createApiUrl, getApiHeaders } from '@/config/api';
import { useToast } from '@/hooks/use-toast';


type SentAgreement = { 
  agreementId: string; 
  sellerName: string; 
  buyerName: string; 
  status: string; 
  recipientEmail: string; 
  emailSentAt?: string; 
  acknowledgedAt?: string; 
};
type PaymentTerm = { range: string; description: string };
type FeeTier = { range: string; fee: string };
type ContactPerson = { firstName: string; lastName: string; company: string; email: string; phone: string };
type BankAccount = { currency: string; accountHolder: string; accountNumber: string; swiftCode: string };

const defaultPaymentTerms: PaymentTerm[] = [
  { range: '0-30 calendar days', description: 'Short-term settlement of approved receivables.' },
  { range: '31-60 calendar days', description: 'Standard settlement window for approved buyers.' },
  { range: '61-90 calendar days', description: 'Extended settlement for strategic buyers.' },
  { range: '91-120 calendar days', description: 'Long-dated settlement with additional risk review.' },
];

const defaultFeeTiers: FeeTier[] = [
  { range: '0-30 calendar days', fee: '' },
  { range: '31-60 calendar days', fee: '' },
  { range: '61-90 calendar days', fee: '' },
  { range: '91-120 calendar days', fee: '' },
];

export default function FrameworkAgreement() {
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [sellerCorporateId, setSellerCorporateId] = useState('');
  const [sellerTaxId, setSellerTaxId] = useState('');
  const [sellerContactPerson, setSellerContactPerson] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [agreementDate, setAgreementDate] = useState('');
  const [place, setPlace] = useState('');
  const [factoringFee, setFactoringFee] = useState('');
  const [advanceRate, setAdvanceRate] = useState('');
  const [setupFee, setSetupFee] = useState('');
  const [lateFee, setLateFee] = useState('');
  const [referenceRate, setReferenceRate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>(defaultPaymentTerms);
  const [transactionFeeTiers, setTransactionFeeTiers] = useState<FeeTier[]>(defaultFeeTiers);
  const [contacts, setContacts] = useState<ContactPerson[]>([
    { firstName: '', lastName: '', company: '', email: '', phone: '' },
  ]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    { currency: '', accountHolder: '', accountNumber: '', swiftCode: '' },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [sentAgreements, setSentAgreements] = useState<SentAgreement[]>([]);
  const [isLoadingAgreements, setIsLoadingAgreements] = useState(true);

  const fetchAgreements = async () => {
    try {
      const response = await fetch(createApiUrl('/documents/framework-agreement'));
      const result = await response.json();
      if (result.success) {
        setSentAgreements(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load framework agreements:', error);
    } finally {
      setIsLoadingAgreements(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const agreementData = useMemo(() => {
    return {
      agreementDate,
      place,
      buyer: {
        name: buyerName,
        address: buyerAddress,
      },
      seller: {
        name: sellerName,
        address: sellerAddress,
      },
      sellerCorporateId,
      sellerTaxId,
      sellerContactPerson,
      sellerEmail,
      sellerPhone,
      paymentTerms,
      transactionFeeTiers,
      factoringFee,
      advanceRate,
      setupFee,
      lateFee,
      referenceRate,
      schedule1: {
        primaryContacts: contacts,
        bankAccounts,
        sellerSignatureName: sellerName,
        scheduleDate: agreementDate,
        schedulePlace: place,
      },
    };
  }, [
    advanceRate,
    agreementDate,
    bankAccounts,
    buyerAddress,
    buyerName,
    contacts,
    factoringFee,
    lateFee,
    paymentTerms,
    place,
    referenceRate,
    sellerAddress,
    sellerContactPerson,
    sellerCorporateId,
    sellerEmail,
    sellerName,
    sellerPhone,
    sellerTaxId,
    setupFee,
    transactionFeeTiers,
  ]);

  const updatePaymentTerm = (index: number, field: keyof PaymentTerm, value: string) => {
    setPaymentTerms((prev) => prev.map((term, idx) => (idx === index ? { ...term, [field]: value } : term)));
  };

  const updateFeeTier = (index: number, value: string) => {
    setTransactionFeeTiers((prev) => prev.map((tier, idx) => (idx === index ? { ...tier, fee: value } : tier)));
  };

  const updateFeeTierRange = (index: number, value: string) => {
    setTransactionFeeTiers((prev) => prev.map((tier, idx) => (idx === index ? { ...tier, range: value } : tier)));
  };

  const updateContact = (index: number, field: keyof ContactPerson, value: string) => {
    setContacts((prev) => prev.map((contact, idx) => (idx === index ? { ...contact, [field]: value } : contact)));
  };

  const updateBankAccount = (index: number, field: keyof BankAccount, value: string) => {
    setBankAccounts((prev) => prev.map((account, idx) => (idx === index ? { ...account, [field]: value } : account)));
  };

  const addContact = () => {
    setContacts((prev) => [...prev, { firstName: '', lastName: '', company: '', email: '', phone: '' }]);
  };

  const removeContact = (index: number) => {
    setContacts((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addBankAccount = () => {
    setBankAccounts((prev) => [...prev, { currency: '', accountHolder: '', accountNumber: '', swiftCode: '' }]);
  };

  const removeBankAccount = (index: number) => {
    setBankAccounts((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePreview = async () => {
    try {
      setIsPreviewing(true);
      const response = await fetch(createApiUrl('/documents/framework-agreement'), {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(agreementData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: 'Preview failed',
        description: 'Please check the agreement details and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSend = async () => {
    if (!recipientEmail) {
      toast({
        title: 'Recipient email required',
        description: 'Add the client email before sending the agreement.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSending(true);
      const response = await fetch(createApiUrl('/documents/framework-agreement/email'), {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          recipientEmail,
          agreementData,
          sellerName,
          sellerEmail,
          buyerName,
          subject: `Framework Agreement - ${sellerName || 'Seller'}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send agreement');
      }

      toast({
        title: 'Agreement sent',
        description: `Framework agreement emailed to ${recipientEmail}.`,
      });
      fetchAgreements(); // refresh list
    } catch (error) {
      console.error('Send error:', error);
      toast({
        title: 'Send failed',
        description: 'Please verify SMTP settings and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex items-center gap-3">
          <FileCheck2 className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold text-financial-navy">Framework Agreement</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Collect agreement details, preview the document, and email it to the client.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 financial-card">
          <CardHeader>
            <CardTitle>Agreement details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyer-name">Buyer name</Label>
                <Input id="buyer-name" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-name">Seller name</Label>
                <Input id="seller-name" value={sellerName} onChange={(e) => setSellerName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agreement-date">Agreement date</Label>
                <Input id="agreement-date" value={agreementDate} onChange={(e) => setAgreementDate(e.target.value)} placeholder="18 July 2024" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="place">Place</Label>
                <Input id="place" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="New Delhi" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyer-address">Buyer address</Label>
                <Textarea id="buyer-address" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-address">Seller address</Label>
                <Textarea id="seller-address" value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} rows={3} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seller-corporate-id">Seller corporate ID</Label>
                <Input id="seller-corporate-id" value={sellerCorporateId} onChange={(e) => setSellerCorporateId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-tax-id">Seller GST/VAT</Label>
                <Input id="seller-tax-id" value={sellerTaxId} onChange={(e) => setSellerTaxId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-contact">Seller contact person</Label>
                <Input id="seller-contact" value={sellerContactPerson} onChange={(e) => setSellerContactPerson(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-email">Seller email</Label>
                <Input id="seller-email" value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-phone">Seller phone</Label>
                <Input id="seller-phone" value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Payment terms</Label>
                <Badge variant="outline">Edit ranges as needed</Badge>
              </div>
              <div className="space-y-3">
                {paymentTerms.map((term, index) => (
                  <div key={term.range} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input value={term.range} onChange={(e) => updatePaymentTerm(index, 'range', e.target.value)} />
                    <div className="md:col-span-2">
                      <Input value={term.description} onChange={(e) => updatePaymentTerm(index, 'description', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Transaction fee tiers</Label>
              <div className="space-y-3">
                {transactionFeeTiers.map((tier, index) => (
                  <div key={tier.range} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input value={tier.range} onChange={(e) => updateFeeTierRange(index, e.target.value)} />
                    <div className="md:col-span-2">
                      <Input value={tier.fee} onChange={(e) => updateFeeTier(index, e.target.value)} placeholder="e.g. 1.25%" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="factoring-fee">Factoring fee</Label>
                <Input id="factoring-fee" value={factoringFee} onChange={(e) => setFactoringFee(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advance-rate">Advance rate</Label>
                <Input id="advance-rate" value={advanceRate} onChange={(e) => setAdvanceRate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-fee">Set-up fee</Label>
                <Input id="setup-fee" value={setupFee} onChange={(e) => setSetupFee(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="late-fee">Late fee</Label>
                <Input id="late-fee" value={lateFee} onChange={(e) => setLateFee(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reference-rate">Reference rate</Label>
                <Input id="reference-rate" value={referenceRate} onChange={(e) => setReferenceRate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Schedule 1 contacts</Label>
                <Button variant="outline" size="sm" onClick={addContact}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add contact
                </Button>
              </div>
              <div className="space-y-4">
                {contacts.map((contact, index) => (
                  <div key={`${contact.email}-${index}`} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Contact {index + 1}</span>
                      {contacts.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeContact(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input value={contact.firstName} onChange={(e) => updateContact(index, 'firstName', e.target.value)} placeholder="First name" />
                      <Input value={contact.lastName} onChange={(e) => updateContact(index, 'lastName', e.target.value)} placeholder="Last name" />
                      <Input value={contact.company} onChange={(e) => updateContact(index, 'company', e.target.value)} placeholder="Company" />
                      <Input value={contact.email} onChange={(e) => updateContact(index, 'email', e.target.value)} placeholder="Email" />
                      <Input value={contact.phone} onChange={(e) => updateContact(index, 'phone', e.target.value)} placeholder="Phone" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Schedule 1 bank accounts</Label>
                <Button variant="outline" size="sm" onClick={addBankAccount}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add account
                </Button>
              </div>
              <div className="space-y-4">
                {bankAccounts.map((account, index) => (
                  <div key={`${account.currency}-${index}`} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Account {index + 1}</span>
                      {bankAccounts.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeBankAccount(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input value={account.currency} onChange={(e) => updateBankAccount(index, 'currency', e.target.value)} placeholder="Currency" />
                      <Input value={account.accountHolder} onChange={(e) => updateBankAccount(index, 'accountHolder', e.target.value)} placeholder="Account holder" />
                      <Input value={account.accountNumber} onChange={(e) => updateBankAccount(index, 'accountNumber', e.target.value)} placeholder="Account number" />
                      <Input value={account.swiftCode} onChange={(e) => updateBankAccount(index, 'swiftCode', e.target.value)} placeholder="SWIFT code" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient-email">Client email</Label>
                <Input id="recipient-email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} type="email" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button className="btn-financial" onClick={handlePreview} disabled={isPreviewing}>
                {isPreviewing ? 'Generating preview...' : 'Preview agreement'}
              </Button>
              <Button variant="outline" onClick={handleSend} disabled={isSending}>
                {isSending ? 'Sending...' : 'Send to client'}
              </Button>
              {previewUrl && (
                <Button variant="ghost" onClick={() => window.open(previewUrl, '_blank')}>
                  View last preview
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader>
            <CardTitle>Current status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Agreement</span>
              <Badge variant="outline">Draft</Badge>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Next steps after sending:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Client reviews and signs the framework.</li>
                <li>Approval unlocks buyer and transaction setup.</li>
                <li>Proceed with onboarding and limits.</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-financial-navy mb-6">Sent Framework Agreements</h2>
        <Card className="financial-card">
          <CardContent className="p-0">
            {isLoadingAgreements ? (
              <div className="p-8 text-center text-muted-foreground">Loading agreements...</div>
            ) : sentAgreements.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No framework agreements sent yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="p-4 text-left font-medium text-slate-500">ID</th>
                      <th className="p-4 text-left font-medium text-slate-500">Seller</th>
                      <th className="p-4 text-left font-medium text-slate-500">Buyer</th>
                      <th className="p-4 text-left font-medium text-slate-500">Recipient</th>
                      <th className="p-4 text-left font-medium text-slate-500">Status</th>
                      <th className="p-4 text-left font-medium text-slate-500">Sent Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentAgreements.map((agreement) => (
                      <tr key={agreement.agreementId} className="border-b">
                        <td className="p-4 font-mono text-xs">{agreement.agreementId.substring(0, 8)}...</td>
                        <td className="p-4">{agreement.sellerName}</td>
                        <td className="p-4">{agreement.buyerName}</td>
                        <td className="p-4">{agreement.recipientEmail}</td>
                        <td className="p-4">
                          <Badge variant={agreement.status === 'acknowledged' ? 'default' : 'secondary'}>
                            {agreement.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {agreement.emailSentAt ? new Date(agreement.emailSentAt).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
