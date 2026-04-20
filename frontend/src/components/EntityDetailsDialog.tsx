import { createApiUrl, getApiHeaders } from '@/config/api';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp } from 'lucide-react';

interface BuyerAssignment {
  buyerId: string;
  buyerName: string;
  transactionLimit: number;
  usedAmount: number;
  availableAmount: number;
}

interface EntityDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: any | null;
}

export function EntityDetailsDialog({ open, onOpenChange, entity }: EntityDetailsDialogProps) {
  const [assignedBuyers, setAssignedBuyers] = useState<BuyerAssignment[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  
  const fetchAssignedBuyers = async (supplierId: string) => {
    setLoadingBuyers(true);
    try {
      // Fetch all buyers and filter those that have this supplier assigned
      const response = await fetch(createApiUrl('/entities/buyers/list'), {
        headers: getApiHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        const buyers = result.data || [];
        
        // Filter buyers who have this supplier assigned and calculate their limits
        const assignments: BuyerAssignment[] = buyers
          .filter((buyer: any) => 
            buyer.supplierLimits && 
            buyer.supplierLimits.some((sl: any) => sl.supplierId === supplierId)
          )
          .map((buyer: any) => {
            const supplierLimit = buyer.supplierLimits.find((sl: any) => sl.supplierId === supplierId);
            const transactionLimit = parseFloat(supplierLimit.transactionLimit) || 0;
            // Since no actual transactions have been processed yet, used amount is 0
            const usedAmount = 0;
            
            return {
              buyerId: buyer.id,
              buyerName: buyer.name || buyer.legalName,
              transactionLimit,
              usedAmount,
              availableAmount: transactionLimit - usedAmount
            };
          });
        
        setAssignedBuyers(assignments);
      }
    } catch (error) {
      console.error('Error fetching assigned buyers:', error);
    } finally {
      setLoadingBuyers(false);
    }
  };

  // Fetch assigned buyers when viewing a supplier - must be called before any conditional returns
  useEffect(() => {
    if (open && entity && entity.type === 'supplier') {
      fetchAssignedBuyers(entity.id);
    }
  }, [open, entity]);

  console.log('🔧 EntityDetailsDialog props:', { open, entity: !!entity, entityId: entity?.id });
  
  if (!entity) {
    console.log('⚠️ EntityDetailsDialog: No entity provided, returning null');
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatAddress = (entity: any) => {
    const parts = [];
    if (entity.address) parts.push(entity.address);
    if (entity.city) parts.push(entity.city);
    if (entity.state) parts.push(entity.state);
    if (entity.country) parts.push(entity.country);
    if (entity.pincode) parts.push(entity.pincode);
    return parts.join(', ') || 'Address not provided';
  };

  const downloadDocument = (key: string, fileName?: string) => {
    const query = new URLSearchParams({ key });
    if (fileName) {
      query.set('fileName', fileName);
    }
    window.open(createApiUrl(`/documents/download?${query.toString()}`), '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-financial-navy flex items-center gap-2">
            <Badge variant={entity.type === 'supplier' ? 'default' : 'secondary'}>
              {entity.type?.toUpperCase() || 'ENTITY'}
            </Badge>
            {entity.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Entity ID</label>
                  <p className="font-mono">{entity.entityId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2">
                    <Badge variant={entity.status === 'active' ? 'default' : 'secondary'}>
                      {entity.status?.toUpperCase() || 'UNKNOWN'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p>{entity.contactEmail || entity.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p>{entity.phone || 'Not provided'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p>{formatAddress(entity)}</p>
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
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p>{entity.contactPersonName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Designation</label>
                  <p>{entity.contactPersonDesignation || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p>{entity.contactPersonEmail || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p>{entity.contactPersonPhone || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Credit Limit</label>
                  <p className="text-lg font-semibold">
                    {formatCurrency(entity.creditLimit || entity.totalLimitSanctioned || 0)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Utilized Limit</label>
                  <p className="text-lg font-semibold text-warning">
                    {formatCurrency(entity.utilizedLimit || 0)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Available Limit</label>
                  <p className="text-lg font-semibold text-success">
                    {formatCurrency(entity.availableLimit || 0)}
                  </p>
                </div>
              </div>

              {entity.type === 'supplier' && (
                <>
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">Transaction Fee Structure</label>
                    {/* Debug transaction fees structure */}
                    {console.log('🔍 Entity transaction fees:', entity.transactionFees)}
                    {console.log('🔍 Full entity data:', entity)}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-2">
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">0-30 days</p>
                        <p className="font-semibold">{
                          typeof entity.transactionFees === 'object' && entity.transactionFees?.days0to30 
                            ? `${entity.transactionFees.days0to30}%`
                            : entity.transactionFees
                            ? `${entity.transactionFees}%` 
                            : '0%'
                        }</p>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">31-60 days</p>
                        <p className="font-semibold">{
                          typeof entity.transactionFees === 'object' && entity.transactionFees?.days31to60 
                            ? `${entity.transactionFees.days31to60}%`
                            : '0%'
                        }</p>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">61-90 days</p>
                        <p className="font-semibold">{
                          typeof entity.transactionFees === 'object' && entity.transactionFees?.days61to90 
                            ? `${entity.transactionFees.days61to90}%`
                            : '0%'
                        }</p>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">91-120 days</p>
                        <p className="font-semibold">{
                          typeof entity.transactionFees === 'object' && entity.transactionFees?.days91to120 
                            ? `${entity.transactionFees.days91to120}%`
                            : '0%'
                        }</p>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">121-150 days</p>
                        <p className="font-semibold">{
                          typeof entity.transactionFees === 'object' && entity.transactionFees?.days121to150 
                            ? `${entity.transactionFees.days121to150}%`
                            : '0%'
                        }</p>
                      </div>
                    </div>
                  </div>

                  {/* Complete Fee Structure */}
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">Complete Fee Structure</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs text-muted-foreground">Advance Rate</p>
                        <p className="font-semibold text-blue-700">{entity.advanceRate || 0}%</p>
                      </div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-xs text-muted-foreground">Processing Fees</p>
                        <p className="font-semibold text-green-700">${entity.processingFees || 0}</p>
                      </div>
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                        <p className="text-xs text-muted-foreground">Factoring Fees</p>
                        <p className="font-semibold text-purple-700">{entity.factoringFees || 0}%</p>
                      </div>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-muted-foreground">Setup Fee</p>
                        <p className="font-semibold text-yellow-700">{entity.setupFee || 0}%</p>
                        <p className="text-xs text-yellow-600 mt-1">One-time on supplier limit</p>
                      </div>
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                        <p className="text-xs text-muted-foreground">Late Fees</p>
                        <p className="font-semibold text-orange-700">{entity.lateFees || 0}% {entity.lateFeesFrequency ? `(${entity.lateFeesFrequency})` : ''}</p>
                      </div>
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded">
                        <p className="text-xs text-muted-foreground">Grace Period</p>
                        <p className="font-semibold text-indigo-700">{entity.gracePeriod || 0} days</p>
                      </div>
                      {entity.otherFees && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                          <p className="text-xs text-muted-foreground">Other Fees</p>
                          <p className="font-semibold text-gray-700">
                            {typeof entity.otherFees === 'number' ? formatCurrency(entity.otherFees) : `$${entity.otherFees}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fee Calculation Methods */}
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">Fee Calculation Methods</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Fee Deduction Method</p>
                        <Badge variant="outline" className="capitalize mt-1">
                          {entity.feeDeductionMethod ? entity.feeDeductionMethod.replace('_', ' ') : 'Not specified'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fee Charge Method</p>
                        <Badge variant="outline" className="capitalize mt-1">
                          {entity.feeChargeMethod ? entity.feeChargeMethod.replace('_', ' ') : 'Not specified'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fee Timing Method</p>
                        <Badge variant="outline" className="capitalize mt-1">
                          {entity.feeTimingMethod ? entity.feeTimingMethod.replace('_', ' ') : 'Not specified'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Late Fees Calculation</p>
                        <Badge variant="outline" className="capitalize mt-1">
                          {entity.lateFeesCalculationMethod ? `${entity.lateFeesCalculationMethod} on ${entity.lateFeesCalculationBase}`.replace('_', ' ') : 'Not specified'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Additional Requirements */}
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">Additional Requirements</label>
                    <div className="flex gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={entity.noaRequired ? 'default' : 'secondary'}>
                          NOA Required: {entity.noaRequired ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={entity.collateralTaken ? 'default' : 'secondary'}>
                          Collateral Taken: {entity.collateralTaken ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Banking Information - For Suppliers Only */}
          {entity.type === 'supplier' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Banking Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Beneficiary Name</label>
                    <p>{entity.beneficiary || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                    <p>{entity.bank || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Branch</label>
                    <p>{entity.branch || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                    <p className="font-mono">{entity.accountNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">IFSC Code</label>
                    <p className="font-mono">{entity.ifscCode || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SWIFT Code</label>
                    <p className="font-mono">{entity.swiftCode || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Correspondent Bank</label>
                    <p>{entity.correspondentBank || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Currency</label>
                    <Badge variant="outline">{entity.currency || 'USD'}</Badge>
                  </div>
                  {entity.bicSwiftCode && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">BIC/SWIFT Code</label>
                      <p className="font-mono">{entity.bicSwiftCode}</p>
                    </div>
                  )}
                </div>
                {entity.additionalAccDetail && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Additional Account Details</label>
                    <p className="text-sm mt-1 p-2 bg-muted rounded">{entity.additionalAccDetail}</p>
                  </div>
                )}

                {entity.agreementFrameworkDocumentKey && (
                  <div className="pt-2">
                    <label className="text-sm font-medium text-muted-foreground">Agreement Framework Document</label>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadDocument(
                            entity.agreementFrameworkDocumentKey,
                            entity.agreementFrameworkDocumentName || 'agreement-framework-document'
                          )
                        }
                      >
                        Download Agreement Document
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Supplier Relationships - For Buyers Only */}
          {entity.type === 'buyer' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Supplier Relationships
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entity.supplierLimits && entity.supplierLimits.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {entity.supplierLimits.map((supplierLimit: any, index: number) => (
                        <div key={supplierLimit.supplierId || index} className="p-4 border rounded-lg bg-muted/20">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{supplierLimit.supplierName}</h4>
                            <Badge variant="outline" className="text-xs">
                              Active
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Transaction Limit:</span>
                              <span className="font-semibold">{formatCurrency(supplierLimit.transactionLimit || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Used Amount:</span>
                              <span className="text-warning font-medium">{formatCurrency(0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Available:</span>
                              <span className="text-success font-medium">{formatCurrency(supplierLimit.transactionLimit || 0)}</span>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary rounded-full h-2 transition-all duration-300"
                                style={{ width: "0%" }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-800">Total Credit Facility</p>
                          <p className="text-blue-700 mt-1">
                            This buyer has a total credit facility of {formatCurrency(entity.supplierLimits.reduce((sum: number, sl: any) => sum + (parseFloat(sl.transactionLimit) || 0), 0))} 
                            from {entity.supplierLimits.length} supplier{entity.supplierLimits.length !== 1 ? 's' : ''}.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No supplier limits assigned to this buyer yet</p>
                    <p className="text-xs mt-1">Edit this buyer to add supplier relationships and transaction limits</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assigned Buyers - For Suppliers Only */}
          {entity.type === 'supplier' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assigned Buyers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingBuyers ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Loading assigned buyers...</p>
                  </div>
                ) : assignedBuyers.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {assignedBuyers.map((assignment) => (
                        <div key={assignment.buyerId} className="p-4 border rounded-lg bg-muted/20">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{assignment.buyerName}</h4>
                            <Badge variant="outline" className="text-xs">
                              {((assignment.usedAmount / assignment.transactionLimit) * 100).toFixed(1)}% Used
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Transaction Limit:</span>
                              <span className="font-semibold">{formatCurrency(assignment.transactionLimit)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Used Amount:</span>
                              <span className="text-warning font-medium">{formatCurrency(assignment.usedAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Available:</span>
                              <span className="text-success font-medium">{formatCurrency(assignment.availableAmount)}</span>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary rounded-full h-2 transition-all duration-300"
                                style={{
                                  width: `${Math.min((assignment.usedAmount / assignment.transactionLimit) * 100, 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-800">Cumulative Limit System</p>
                          <p className="text-blue-700 mt-1">
                            As buyers are added with transaction amounts, their individual limits accumulate. 
                            Each buyer's limit is tracked separately and will be reduced with each transaction.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No buyers assigned to this supplier yet</p>
                    <p className="text-xs mt-1">Buyers will appear here when linked through the buyer creation process</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {entity.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{entity.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p>{entity.createdAt ? new Date(entity.createdAt).toLocaleString() : 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p>{entity.updatedAt ? new Date(entity.updatedAt).toLocaleString() : 'Unknown'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}