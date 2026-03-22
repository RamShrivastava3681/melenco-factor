import { createApiUrl, getApiHeaders } from '@/config/api';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddBuyerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SupplierLimit {
  supplierId: string;
  supplierName: string;
  transactionLimit: number | string;
}

interface BuyerFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  creditLimit: number | string;
  industry: string;
  taxId: string;
  notes: string;
  
  // Supplier Relationships
  supplierLimits: SupplierLimit[];
  
  // Bank Account Details
  beneficiary: string;
  bank: string;
  branch: string;
  ifscCode: string;
  accountNumber: string;
  swiftCode: string;
  correspondentBank: string;
  currency: string;
  bicSwiftCode: string;
  additionalAccDetail: string;
}

export function AddBuyerDialog({ open, onOpenChange }: AddBuyerDialogProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [transactionLimit, setTransactionLimit] = useState<string>('');
  
  const [formData, setFormData] = useState<BuyerFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    phone: '',
    email: '',
    contactPersonName: '',
    contactPersonDesignation: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    creditLimit: '',
    industry: '',
    taxId: '',
    notes: '',
    supplierLimits: [],
    beneficiary: '',
    bank: '',
    branch: '',
    ifscCode: '',
    accountNumber: '',
    swiftCode: '',
    correspondentBank: '',
    currency: 'USD',
    bicSwiftCode: '',
    additionalAccDetail: ''
  });

  // Fetch suppliers when dialog opens
  useEffect(() => {
    if (open) {
      fetchSuppliers();
    }
  }, [open]);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(createApiUrl('/entities/suppliers/list'), {
        headers: getApiHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        setSuppliers(result.data || []);
      } else {
        console.error('API response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const getEntityCurrency = (entity: any) => {
    return String(entity?.currency || entity?.bankDetails?.currency || 'USD').toUpperCase();
  };

  const handleInputChange = (field: keyof BuyerFormData, value: string | number) => {
    if (field === 'currency') {
      const normalizedCurrency = String(value || 'USD').toUpperCase();
      if (formData.supplierLimits.length > 0) {
        const hasMismatch = formData.supplierLimits.some((limit) => {
          const supplier = suppliers.find((item) => (item.id || item._id) === limit.supplierId);
          if (!supplier) return false;
          return getEntityCurrency(supplier) !== normalizedCurrency;
        });

        if (hasMismatch) {
          toast.error('Buyer currency must match linked supplier currencies');
          return;
        }
      }

      setFormData((prev) => ({ ...prev, [field]: normalizedCurrency }));
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSupplierLimit = () => {
    if (!selectedSupplierId || !transactionLimit) {
      toast.error('Please select a supplier and enter a transaction limit');
      return;
    }

    const supplier = suppliers.find(s => (s.id || s._id) === selectedSupplierId);
    if (!supplier) {
      console.error('Supplier not found for ID:', selectedSupplierId);
      toast.error('Selected supplier not found. Please try again.');
      return;
    }

    const supplierCurrency = getEntityCurrency(supplier);
    const buyerCurrency = String(formData.currency || 'USD').toUpperCase();
    if (supplierCurrency !== buyerCurrency) {
      toast.error(`Supplier currency (${supplierCurrency}) must match buyer currency (${buyerCurrency})`);
      return;
    }

    // Check if supplier is already added - handle both id and _id
    const supplierId = supplier.id || supplier._id;
    if (formData.supplierLimits.some(sl => sl.supplierId === supplierId)) {
      toast.error('This supplier is already linked to this buyer');
      return;
    }

    const newSupplierLimit: SupplierLimit = {
      supplierId: supplierId,
      supplierName: supplier.name || supplier.legalName,
      transactionLimit: parseFloat(transactionLimit)
    };

    setFormData(prev => ({
      ...prev,
      supplierLimits: [...prev.supplierLimits, newSupplierLimit]
    }));

    // Reset selection fields
    setSelectedSupplierId('');
    setTransactionLimit('');
  };

  const removeSupplierLimit = (supplierId: string) => {
    setFormData(prev => ({
      ...prev,
      supplierLimits: prev.supplierLimits.filter(sl => sl.supplierId !== supplierId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Calculate credit limit from supplier limits
      const calculatedCreditLimit = formData.supplierLimits.reduce((sum, sl) => sum + (
        typeof sl.transactionLimit === 'number' 
          ? sl.transactionLimit
          : parseFloat(sl.transactionLimit.toString()) || 0
      ), 0);
      
      // Send the data to the backend API
      const response = await fetch(createApiUrl('/entities'), {
        method: 'POST',
        headers: {
          ...getApiHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          creditLimit: calculatedCreditLimit.toString(),
          type: 'buyer'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add buyer');
      }
      
      const result = await response.json();
      
      toast.success('Buyer added successfully!', {
        description: `${formData.name} has been added to your buyer database.`
      });
      
      // Trigger a refresh of the entities list
      window.dispatchEvent(new CustomEvent('refreshEntities'));
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        phone: '',
        email: '',
        contactPersonName: '',
        contactPersonDesignation: '',
        contactPersonEmail: '',
        contactPersonPhone: '',
        creditLimit: '',
        industry: '',
        taxId: '',
        notes: '',
        supplierLimits: [],
        beneficiary: '',
        bank: '',
        branch: '',
        ifscCode: '',
        accountNumber: '',
        swiftCode: '',
        correspondentBank: '',
        currency: 'USD',
        bicSwiftCode: '',
        additionalAccDetail: ''
      });
      
      // Reset supplier selection fields
      setSelectedSupplierId('');
      setTransactionLimit('');
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding buyer:', error);
      toast.error('Failed to add buyer', {
        description: 'Please check your data and try again.'
      });
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-financial-navy">
            Add New Buyer
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="name">Buyer Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter buyer name"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label>Address *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="md:col-span-2">
                        <Input
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Enter street address"
                          required
                        />
                      </div>
                      <div>
                        <Input
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Enter city"
                          required
                        />
                      </div>
                      <div>
                        <Input
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="Enter state"
                          required
                        />
                      </div>
                      <div>
                        <Input
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          placeholder="Enter country"
                          required
                        />
                      </div>
                      <div>
                        <Input
                          value={formData.pincode}
                          onChange={(e) => handleInputChange('pincode', e.target.value)}
                          placeholder="Enter pincode"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="buyer@company.com"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Person */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Person</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactPersonName">Contact Person Name *</Label>
                    <Input
                      id="contactPersonName"
                      value={formData.contactPersonName}
                      onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactPersonDesignation">Designation *</Label>
                    <Input
                      id="contactPersonDesignation"
                      value={formData.contactPersonDesignation}
                      onChange={(e) => handleInputChange('contactPersonDesignation', e.target.value)}
                      placeholder="Procurement Manager"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactPersonEmail">Contact Email *</Label>
                    <Input
                      id="contactPersonEmail"
                      type="email"
                      value={formData.contactPersonEmail}
                      onChange={(e) => handleInputChange('contactPersonEmail', e.target.value)}
                      placeholder="contact@company.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactPersonPhone">Contact Phone *</Label>
                    <Input
                      id="contactPersonPhone"
                      type="tel"
                      value={formData.contactPersonPhone}
                      onChange={(e) => handleInputChange('contactPersonPhone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="creditLimit">
                      Credit Limit (USD) 
                      <span className="text-sm text-gray-500 ml-1">
                        (Auto-calculated from supplier limits)
                      </span>
                    </Label>
                    <Input
                      id="creditLimit"
                      type="text"
                      value={`$${formData.supplierLimits.reduce((sum, sl) => sum + (
                        typeof sl.transactionLimit === 'number' 
                          ? sl.transactionLimit
                          : parseFloat(sl.transactionLimit.toString()) || 0
                      ), 0).toLocaleString()}`}
                      placeholder="$0 (Add suppliers to increase limit)"
                      readOnly
                      className="bg-gray-50 text-gray-700"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      placeholder="Manufacturing, Retail, etc."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="taxId">Tax ID / Registration Number</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                      placeholder="12-3456789"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional information about this buyer..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Supplier Relationships */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supplier Relationships</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/20">
                  <div>
                    <Label htmlFor="supplierSelect">Select Supplier</Label>
                    <Select
                      value={selectedSupplierId}
                      onValueChange={setSelectedSupplierId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.length === 0 ? (
                          <SelectItem value="no-suppliers" disabled>
                            No suppliers available
                          </SelectItem>
                        ) : (
                          suppliers
                            .filter(supplier => {
                              const supplierId = supplier.id || supplier._id;
                              return !formData.supplierLimits.some(sl => sl.supplierId === supplierId);
                            })
                            .map((supplier) => {
                              const supplierId = supplier.id || supplier._id;
                              const supplierName = supplier.name || supplier.legalName || 'Unknown Supplier';
                              
                              if (!supplierId) {
                                console.error('Supplier missing ID:', supplier);
                                return null;
                              }
                              
                              return (
                                <SelectItem key={supplierId} value={supplierId}>
                                  {supplierName}
                                </SelectItem>
                              );
                            })
                            .filter(Boolean)
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="transactionLimit">Transaction Limit (USD)</Label>
                    <Input
                      id="transactionLimit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={transactionLimit}
                      onChange={(e) => setTransactionLimit(e.target.value)}
                      placeholder="Enter limit amount"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <div className="w-full space-y-2">
                      {selectedSupplierId && transactionLimit && (
                        <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <p className="text-green-800">
                            <strong>Preview:</strong> Total credit will be ${(
                              formData.supplierLimits.reduce((sum, sl) => sum + (
                                typeof sl.transactionLimit === 'number' 
                                  ? sl.transactionLimit
                                  : parseFloat(sl.transactionLimit.toString()) || 0
                              ), 0) + (parseFloat(transactionLimit) || 0)
                            ).toLocaleString()}
                            {formData.supplierLimits.length > 0 && (
                              <span className="text-green-600">
                                {' '}(+${parseFloat(transactionLimit).toLocaleString()} from this supplier)
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      <Button
                        type="button"
                        onClick={addSupplierLimit}
                        className="w-full"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Supplier
                      </Button>
                    </div>
                  </div>
                </div>
                
                {formData.supplierLimits.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Linked Suppliers & Limits</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.supplierLimits.map((supplierLimit) => (
                          <Badge
                            key={supplierLimit.supplierId}
                            variant="secondary"
                            className="px-3 py-2 flex items-center gap-2"
                          >
                            <span>{supplierLimit.supplierName}</span>
                            <span className="text-xs">
                              (${typeof supplierLimit.transactionLimit === 'number' 
                                ? supplierLimit.transactionLimit.toLocaleString()
                                : parseFloat(supplierLimit.transactionLimit.toString()).toLocaleString()
                              })
                            </span>
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-destructive"
                              onClick={() => removeSupplierLimit(supplierLimit.supplierId)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Real-time Credit Summary */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-blue-900">Total Credit Facility</h4>
                          <p className="text-xs text-blue-700">Real-time calculation from linked suppliers</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-900">
                            ${formData.supplierLimits
                              .reduce((sum, sl) => sum + (
                                typeof sl.transactionLimit === 'number' 
                                  ? sl.transactionLimit
                                  : parseFloat(sl.transactionLimit.toString()) || 0
                              ), 0)
                              .toLocaleString()
                            }
                          </div>
                          <p className="text-xs text-blue-700">
                            from {formData.supplierLimits.length} supplier{formData.supplierLimits.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-xs text-blue-600">Available</p>
                            <p className="text-sm font-semibold text-green-700">
                              ${formData.supplierLimits
                                .reduce((sum, sl) => sum + (
                                  typeof sl.transactionLimit === 'number' 
                                    ? sl.transactionLimit
                                    : parseFloat(sl.transactionLimit.toString()) || 0
                                ), 0)
                                .toLocaleString()
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600">Used</p>
                            <p className="text-sm font-semibold text-gray-600">$0</p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600">Suppliers</p>
                            <p className="text-sm font-semibold text-blue-700">{formData.supplierLimits.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Buyer's limit will be reduced with each transaction and cannot exceed the set limits per supplier.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Bank Account Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bank Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="beneficiary">Beneficiary *</Label>
                    <Input
                      id="beneficiary"
                      value={formData.beneficiary}
                      onChange={(e) => handleInputChange('beneficiary', e.target.value)}
                      placeholder="Enter beneficiary name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bank">Bank *</Label>
                    <Input
                      id="bank"
                      value={formData.bank}
                      onChange={(e) => handleInputChange('bank', e.target.value)}
                      placeholder="Enter bank name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="branch">Branch *</Label>
                    <Input
                      id="branch"
                      value={formData.branch}
                      onChange={(e) => handleInputChange('branch', e.target.value)}
                      placeholder="Enter branch name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={formData.ifscCode}
                      onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                      placeholder="Enter IFSC code"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      placeholder="Enter account number"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="swiftCode">Swift Code</Label>
                    <Input
                      id="swiftCode"
                      value={formData.swiftCode}
                      onChange={(e) => handleInputChange('swiftCode', e.target.value)}
                      placeholder="Enter Swift code"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="correspondentBank">Correspondent Bank</Label>
                    <Input
                      id="correspondentBank"
                      value={formData.correspondentBank}
                      onChange={(e) => handleInputChange('correspondentBank', e.target.value)}
                      placeholder="Enter correspondent bank"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleInputChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  

                  
                  <div>
                    <Label htmlFor="bicSwiftCode">BIC/Swift Code</Label>
                    <Input
                      id="bicSwiftCode"
                      value={formData.bicSwiftCode}
                      onChange={(e) => handleInputChange('bicSwiftCode', e.target.value)}
                      placeholder="Enter BIC/Swift code"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="additionalAccDetail">Additional Account Detail (FEDWIRE ABA)</Label>
                    <Input
                      id="additionalAccDetail"
                      value={formData.additionalAccDetail}
                      onChange={(e) => handleInputChange('additionalAccDetail', e.target.value)}
                      placeholder="Enter FEDWIRE ABA or other details"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" className="btn-financial">
                Add Buyer
              </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}