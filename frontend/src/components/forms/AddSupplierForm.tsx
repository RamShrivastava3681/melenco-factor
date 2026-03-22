import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface AddSupplierFormProps {
  onSubmit: (data: SupplierFormData) => void;
  onCancel: () => void;
}

export interface SupplierFormData {
  // Basic Information
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  
  // Contact Person
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  
  // Financial Information
  totalLimitSanctioned: number | string;
  advanceRate: number | string;
  gracePeriod: number | string;
  
  // Advance Data
  transactionFees: {
    days0to30: number | string;
    days31to60: number | string;
    days61to90: number | string;
    days91to120: number | string;
    days121to150: number | string;
  };
  feeDeductionMethod: 'from_advance' | 'from_reserved';
  feeChargeMethod: 'face_value' | 'advance_amount';
  feeTimingMethod: 'prorated_advance' | 'entire_tenure';
  noaRequired: boolean;
  collateralTaken: boolean;
  
  // Fees
  lateFees: number | string;
  lateFeesFrequency: 'annually' | 'monthly';
  lateFeesCalculationBase: 'advance' | 'face_value';
  lateFeesCalculationMethod: 'prorated' | 'entire_month';
  gracePeriodDays: number | string;
  processingFees: number | string;
  factoringFees: number | string;
  setupFee: number | string;
  setupFeePaymentMethod: 'one_time' | 'per_invoice';
  otherFees: number | string;
  
  // Notes
  notes: string;
  
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
  
  // Agreement Framework Document
  agreementFrameworkDocument: File | null;
}

export function AddSupplierForm({ onSubmit, onCancel }: AddSupplierFormProps) {
  const [formData, setFormData] = useState<SupplierFormData>({
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
    totalLimitSanctioned: '',
    advanceRate: '',
    gracePeriod: '',
    transactionFees: {
      days0to30: '',
      days31to60: '',
      days61to90: '',
      days91to120: '',
      days121to150: '',
    },
    feeDeductionMethod: 'from_advance',
    feeChargeMethod: 'face_value',
    feeTimingMethod: 'prorated_advance',
    noaRequired: false,
    collateralTaken: false,
    lateFees: '',
    lateFeesFrequency: 'monthly',
    lateFeesCalculationBase: 'advance',
    lateFeesCalculationMethod: 'prorated',
    gracePeriodDays: '0',
    processingFees: '',
    factoringFees: '',
    setupFee: '',
    setupFeePaymentMethod: 'one_time',
    otherFees: '',
    notes: '',
    beneficiary: '',
    bank: '',
    branch: '',
    ifscCode: '',
    accountNumber: '',
    swiftCode: '',
    correspondentBank: '',
    currency: 'USD',
    bicSwiftCode: '',
    additionalAccDetail: '',
    agreementFrameworkDocument: null
  });

  const handleInputChange = (field: keyof SupplierFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTransactionFeeChange = (dayRange: keyof SupplierFormData['transactionFees'], value: number | string) => {
    setFormData(prev => ({
      ...prev,
      transactionFees: {
        ...prev.transactionFees,
        [dayRange]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  const handleAgreementDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      agreementFrameworkDocument: file
    }));
  };
  
  const removeAgreementDocument = () => {
    setFormData(prev => ({
      ...prev,
      agreementFrameworkDocument: null
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter supplier name"
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
                placeholder="supplier@company.com"
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
                placeholder="Finance Manager"
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

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Financial Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalLimitSanctioned">Total Limit Sanctioned (USD) *</Label>
              <Input
                id="totalLimitSanctioned"
                type="number"
                min="0"
                step="1000"
                value={formData.totalLimitSanctioned}
                onChange={(e) => handleInputChange('totalLimitSanctioned', e.target.value)}
                placeholder="Enter total limit sanctioned"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="advanceRate">Advance Rate (%) *</Label>
              <Input
                id="advanceRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.advanceRate}
                onChange={(e) => handleInputChange('advanceRate', e.target.value)}
                placeholder="Enter advance rate percentage"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="gracePeriod">Grace Period (Days) *</Label>
              <Input
                id="gracePeriod"
                type="number"
                min="0"
                max="365"
                step="1"
                value={formData.gracePeriod}
                onChange={(e) => handleInputChange('gracePeriod', e.target.value)}
                placeholder="Enter grace period in days"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advance Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advance Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transaction Fee Configuration */}
          <div>
            <Label className="text-base font-medium mb-4 block">Transaction Fee (%)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/20">
              <div>
                <Label htmlFor="days0to30">0 to 30 days</Label>
                <Input
                  id="days0to30"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.transactionFees.days0to30}
                  onChange={(e) => handleTransactionFeeChange('days0to30', e.target.value)}
                  placeholder="Enter fee percentage"
                />
              </div>
              
              <div>
                <Label htmlFor="days31to60">31 to 60 days</Label>
                <Input
                  id="days31to60"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.transactionFees.days31to60}
                  onChange={(e) => handleTransactionFeeChange('days31to60', e.target.value)}
                  placeholder="Enter fee percentage"
                />
              </div>
              
              <div>
                <Label htmlFor="days61to90">61 to 90 days</Label>
                <Input
                  id="days61to90"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.transactionFees.days61to90}
                  onChange={(e) => handleTransactionFeeChange('days61to90', e.target.value)}
                  placeholder="Enter fee percentage"
                />
              </div>
              
              <div>
                <Label htmlFor="days91to120">91 to 120 days</Label>
                <Input
                  id="days91to120"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.transactionFees.days91to120}
                  onChange={(e) => handleTransactionFeeChange('days91to120', e.target.value)}
                  placeholder="Enter fee percentage"
                />
              </div>
              
              <div>
                <Label htmlFor="days121to150">121 to 150 days</Label>
                <Input
                  id="days121to150"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.transactionFees.days121to150}
                  onChange={(e) => handleTransactionFeeChange('days121to150', e.target.value)}
                  placeholder="Enter fee percentage"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="feeDeductionMethod">Fee Deduction Method</Label>
              <Select
                value={formData.feeDeductionMethod}
                onValueChange={(value) => handleInputChange('feeDeductionMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select deduction method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="from_advance">From Advance</SelectItem>
                  <SelectItem value="from_reserved">From Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="feeChargeMethod">Fee Calculation Base</Label>
              <Select
                value={formData.feeChargeMethod}
                onValueChange={(value) => handleInputChange('feeChargeMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select charge method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="face_value">Face Value of Invoice</SelectItem>
                  <SelectItem value="advance_amount">On Advance Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="feeTimingMethod">Fee Timing Method</Label>
              <Select
                value={formData.feeTimingMethod}
                onValueChange={(value) => handleInputChange('feeTimingMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timing method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prorated_advance">Prorated on Advance Dates</SelectItem>
                  <SelectItem value="entire_tenure">Entire Tenure of Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>NoA Required</Label>
                <p className="text-sm text-muted-foreground">Notice of Assignment required</p>
              </div>
              <Switch
                checked={formData.noaRequired}
                onCheckedChange={(checked) => handleInputChange('noaRequired', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Collateral Taken</Label>
                <p className="text-sm text-muted-foreground">Any collateral security taken</p>
              </div>
              <Switch
                checked={formData.collateralTaken}
                onCheckedChange={(checked) => handleInputChange('collateralTaken', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fee Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-base font-medium">Late Fees Configuration</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                <div>
                  <Label htmlFor="lateFees">Rate (%)</Label>
                  <Input
                    id="lateFees"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.lateFees}
                    onChange={(e) => handleInputChange('lateFees', e.target.value)}
                    placeholder="Enter rate"
                  />
                </div>
                
                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={formData.lateFeesFrequency}
                    onValueChange={(value: 'annually' | 'monthly') => handleInputChange('lateFeesFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annually">Annually</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Calculation Base</Label>
                  <Select
                    value={formData.lateFeesCalculationBase}
                    onValueChange={(value: 'advance' | 'face_value') => handleInputChange('lateFeesCalculationBase', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select base" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advance">Advance</SelectItem>
                      <SelectItem value="face_value">Face Value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Calculation Method</Label>
                  <Select
                    value={formData.lateFeesCalculationMethod}
                    onValueChange={(value: 'prorated' | 'entire_month') => handleInputChange('lateFeesCalculationMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prorated">Prorated</SelectItem>
                      <SelectItem value="entire_month">Entire Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="gracePeriodDays">Grace Period (Days)</Label>
                  <Input
                    id="gracePeriodDays"
                    type="number"
                    min="0"
                    max="365"
                    value={formData.gracePeriodDays}
                    onChange={(e) => handleInputChange('gracePeriodDays', e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of days after due date before late fees apply
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="processingFees">Processing Fees (USD)</Label>
              <Input
                id="processingFees"
                type="number"
                min="0"
                step="0.01"
                value={formData.processingFees}
                onChange={(e) => handleInputChange('processingFees', e.target.value)}
                placeholder="Enter processing fees"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Charged on transaction of advance as well as the reserves
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Setup Fee Payment Method</Label>
                <RadioGroup
                  value={formData.setupFeePaymentMethod}
                  onValueChange={(value) => handleInputChange('setupFeePaymentMethod', value as 'one_time' | 'per_invoice')}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="one_time" id="one_time" />
                    <Label htmlFor="one_time" className="cursor-pointer">
                      One-time payment (applied on credit limit)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="per_invoice" id="per_invoice" />
                    <Label htmlFor="per_invoice" className="cursor-pointer">
                      Minimum percentage on every invoice
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label htmlFor="setupFee">
                  Setup Fee (%) - {formData.setupFeePaymentMethod === 'one_time' ? 'One-time' : 'Per Invoice'}
                </Label>
                <Input
                  id="setupFee"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.setupFee}
                  onChange={(e) => handleInputChange('setupFee', e.target.value)}
                  placeholder="2.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.setupFeePaymentMethod === 'one_time' 
                    ? 'Applied once on the credit limit when first transaction is made'
                    : 'Applied as minimum percentage on every invoice amount'
                  }
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="factoringFees">Factoring Fees (%)</Label>
              <Input
                id="factoringFees"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.factoringFees}
                onChange={(e) => handleInputChange('factoringFees', e.target.value)}
                placeholder="2.5"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="otherFees">Other Fees (USD)</Label>
              <Input
                id="otherFees"
                type="number"
                min="0"
                step="0.01"
                value={formData.otherFees}
                onChange={(e) => handleInputChange('otherFees', e.target.value)}
                placeholder="Enter other fees"
              />
            </div>
          </div>
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
      
      {/* Agreement Framework Document */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agreement Framework Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="agreementDocument" className="block mb-2">Upload Agreement Framework Document *</Label>
            <Input
              id="agreementDocument"
              type="file"
              onChange={handleAgreementDocumentChange}
              accept=".pdf,.doc,.docx"
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            <small className="text-gray-500 block mt-1">
              Supported formats: PDF, DOC, DOCX (Max 10MB)
            </small>
          </div>
          
          {formData.agreementFrameworkDocument && (
            <div>
              <Label className="block mb-2">Uploaded Document:</Label>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">📄</span>
                  <span className="text-sm">{formData.agreementFrameworkDocument.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(formData.agreementFrameworkDocument.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeAgreementDocument}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  ✕
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter any additional notes or special instructions..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="btn-financial">
          Add Supplier
        </Button>
      </div>
    </form>
  );
}