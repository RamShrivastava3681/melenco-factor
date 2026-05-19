import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  TrendingUp, 
  Shield, 
  DollarSign,
  Eye,
  Edit,
  MoreVertical,
  Upload,
  Download,
  Trash
} from 'lucide-react';import { mockBuyers, mockSuppliers } from '@/data/demoData';
import { createApiUrl, getApiHeaders } from '@/config/api';import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AddSupplierDialog } from '@/components/forms/AddSupplierDialog';
import { AddBuyerDialog } from '@/components/forms/AddBuyerDialog';
import { EntityDetailsDialog } from '@/components/EntityDetailsDialog';
import { AdjustLimitsDialog } from '@/components/forms/AdjustLimitsDialog';
import { EditEntityDialog } from '@/components/forms/EditEntityDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Entities() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'supplier' | 'buyer'>('all');
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false);
  const [isAddBuyerDialogOpen, setIsAddBuyerDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [isEditingEntity, setIsEditingEntity] = useState(false);
  const [isAdjustLimitsOpen, setIsAdjustLimitsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<any>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityStats, setEntityStats] = useState({
    totalSuppliers: 0,
    totalBuyers: 0,
    totalCreditLimit: 0,
    averageRiskScore: 0,
    activeEntities: 0,
    pendingApproval: 0
  });

  // Load data on component mount
  useEffect(() => {
    fetchEntities();
  }, []);

  // Custom event listener for refreshing entities
  useEffect(() => {
    const handleRefreshEntities = () => {
      fetchEntities();
    };

    window.addEventListener('refreshEntities', handleRefreshEntities);
    return () => {
      window.removeEventListener('refreshEntities', handleRefreshEntities);
    };
  }, []);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching entities from backend...');
      const response = await fetch(createApiUrl('/entities'), {
        headers: getApiHeaders()
      });
      
      console.log('📡 API Response status:', response.status, response.ok);
      
      if (response.ok) {
        const result = await response.json();
        const backendEntities = result.data || [];
        
        console.log('✅ Backend entities received:', backendEntities.length);
        console.log('📄 Backend entities:', backendEntities);
        
        // Combine backend entities with mock data for demonstration
        // In production, you would use only backend entities
        const buyersWithType = mockBuyers.map(buyer => ({
          ...buyer,
          type: 'buyer',
          name: buyer.legalName,
          entityId: buyer.id
        }));
        
        const suppliersWithType = mockSuppliers.map(supplier => ({
          ...supplier,
          type: 'supplier',
          name: supplier.legalName,
          entityId: supplier.id
        }));
        
        // Add backend entities (these are the new ones created via API)
        // Normalize backend entities to have consistent ID field
        const normalizedBackendEntities = backendEntities.map(entity => ({
          ...entity,
          id: entity._id || entity.id, // Prefer backend-provided identifiers when available
          entityId: entity.entityId || entity.id || entity._id // Keep entityId for reference
        }));
        
        const allEntities = [...buyersWithType, ...suppliersWithType, ...normalizedBackendEntities];
        console.log('🔗 Total entities after combining:', allEntities.length);
        console.log('🔍 First backend entity ID mapping:', normalizedBackendEntities[0]?.id, normalizedBackendEntities[0]?._id);
        setEntities(allEntities);
        
        // Calculate stats from actual backend entities only (avoid double counting with mock data)
        const totalCreditLimit = backendEntities.reduce((sum: number, entity: any) => {
          if (entity.type === 'supplier') {
            return sum + (parseFloat(entity.totalLimitSanctioned) || parseFloat(entity.creditLimit) || 0);
          } else if (entity.type === 'buyer') {
            return sum + (parseFloat(entity.creditLimit) || parseFloat(entity.exposureLimit) || 0);
          }
          return sum;
        }, 0);
        const totalRiskScore = allEntities.reduce((sum, entity) => sum + (entity.riskScore || entity.supplierRating === 'A+' ? 95 : entity.supplierRating === 'A' ? 90 : entity.supplierRating === 'A-' ? 85 : entity.supplierRating === 'B+' ? 80 : 75), 0);
        
        const backendSuppliers = backendEntities.filter(e => e.type === 'supplier').length;
        const backendBuyers = backendEntities.filter(e => e.type === 'buyer').length;
        
        setEntityStats({
          totalSuppliers: mockSuppliers.length + backendSuppliers,
          totalBuyers: mockBuyers.length + backendBuyers,
          totalCreditLimit,
          averageRiskScore: Math.round(totalRiskScore / allEntities.length),
          activeEntities: allEntities.filter(e => e.status === 'active' || e.status === 'approved').length,
          pendingApproval: allEntities.filter(e => e.status === 'pending' || e.status === 'pending_review').length
        });
      } else {
        console.error('❌ Failed to fetch entities from backend, status:', response.status);
        // Fallback to mock data only
        const buyersWithType = mockBuyers.map(buyer => ({
          ...buyer,
          type: 'buyer',
          name: buyer.legalName,
          entityId: buyer.id
        }));
        
        const suppliersWithType = mockSuppliers.map(supplier => ({
          ...supplier,
          type: 'supplier',
          name: supplier.legalName,
          entityId: supplier.id
        }));
        
        const allEntities = [...buyersWithType, ...suppliersWithType];
        setEntities(allEntities);
        
        // Calculate stats with mock data only (simple calculation)
        const totalCreditLimit = mockSuppliers.reduce((sum, supplier) => 
          sum + (supplier.totalLimitSanctioned || supplier.creditLimit || 0), 0
        ) + mockBuyers.reduce((sum, buyer) => 
          sum + (buyer.creditLimit || buyer.exposureLimit || 0), 0
        );
        const totalRiskScore = allEntities.reduce((sum, entity) => sum + (entity.riskScore || entity.supplierRating === 'A+' ? 95 : entity.supplierRating === 'A' ? 90 : entity.supplierRating === 'A-' ? 85 : entity.supplierRating === 'B+' ? 80 : 75), 0);
        
        setEntityStats({
          totalSuppliers: mockSuppliers.length,
          totalBuyers: mockBuyers.length,
          totalCreditLimit,
          averageRiskScore: Math.round(totalRiskScore / allEntities.length),
          activeEntities: allEntities.filter(e => e.status === 'active' || e.status === 'approved').length,
          pendingApproval: allEntities.filter(e => e.status === 'pending' || e.status === 'pending_review').length
        });
      }
    } catch (error) {
      console.error('🚨 Network error fetching entities:', error);
      // Fallback to mock data only in case of network error
      const buyersWithType = mockBuyers.map(buyer => ({
        ...buyer,
        type: 'buyer',
        name: buyer.legalName,
        entityId: buyer.id
      }));
      
      const suppliersWithType = mockSuppliers.map(supplier => ({
        ...supplier,
        type: 'supplier',
        name: supplier.legalName,
        entityId: supplier.id
      }));
      
      const allEntities = [...buyersWithType, ...suppliersWithType];
      setEntities(allEntities);
      
      // Calculate stats with mock data only (simple calculation)
      const totalCreditLimit = mockSuppliers.reduce((sum, supplier) => 
        sum + (supplier.totalLimitSanctioned || supplier.creditLimit || 0), 0
      ) + mockBuyers.reduce((sum, buyer) => 
        sum + (buyer.creditLimit || buyer.exposureLimit || 0), 0
      );
      const totalRiskScore = allEntities.reduce((sum, entity) => sum + (entity.riskScore || entity.supplierRating === 'A+' ? 95 : entity.supplierRating === 'A' ? 90 : entity.supplierRating === 'A-' ? 85 : entity.supplierRating === 'B+' ? 80 : 75), 0);
      
      setEntityStats({
        totalSuppliers: mockSuppliers.length,
        totalBuyers: mockBuyers.length,
        totalCreditLimit,
        averageRiskScore: Math.round(totalRiskScore / allEntities.length),
        activeEntities: allEntities.filter(e => e.status === 'active' || e.status === 'approved').length,
        pendingApproval: allEntities.filter(e => e.status === 'pending' || e.status === 'pending_review').length
      });
    }
    
    setTimeout(() => setLoading(false), 500);
  };

  // Handle view entity details
  const handleViewDetails = (entity: any) => {
    console.log('🔍 View Details clicked for entity:', entity);
    console.log('📋 Entity data:', JSON.stringify(entity, null, 2));
    setSelectedEntity(entity);
    setIsViewingDetails(true);
    console.log('✅ Selected entity set, dialog should open');
  };

  // Handle edit entity
  const handleEditEntity = (entity: any) => {
    setSelectedEntity(entity);
    setIsEditingEntity(true);
  };

  const handleAdjustLimits = (entity: any) => {
    setSelectedEntity(entity);
    setIsAdjustLimitsOpen(true);
  };

  // Handle delete entity
  const handleDeleteEntity = (entity: any) => {
    // Check if this is a mock entity (these shouldn't be deleted via API)
    if (!entity._id && !entity.id?.includes('-')) {
      import('sonner').then(({ toast }) => {
        toast.error('Cannot delete demo entity', {
          description: 'Demo entities cannot be deleted. Only entities created in this system can be removed.'
        });
      });
      return;
    }
    
    setEntityToDelete(entity);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete entity
  const confirmDeleteEntity = async () => {
    if (!entityToDelete) return;
    
    try {
      console.log('🗑️ Deleting entity:', entityToDelete.name, 'ID:', entityToDelete.id);
      
      const response = await fetch(createApiUrl(`/entities/${entityToDelete.id}`), {
        method: 'DELETE',
        headers: getApiHeaders()
      });
      
      console.log('📡 Delete response status:', response.status, response.ok);
      
      if (response.ok) {
        // Remove entity from local state
        setEntities(prev => prev.filter(e => e.id !== entityToDelete.id));
        
        // Show success toast
        import('sonner').then(({ toast }) => {
          toast.success('Entity deleted successfully', {
            description: `${entityToDelete.name} has been removed from your ${entityToDelete.type} database.`
          });
        });
        
        // Refresh entities to update stats
        fetchEntities();
      } else {
        // Try to get error message from response
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Failed to delete entity (${response.status})`;
        
        console.error('❌ Delete failed:', response.status, errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting entity:', error);
      import('sonner').then(({ toast }) => {
        toast.error('Failed to delete entity', {
          description: error instanceof Error ? error.message : 'Please try again later.'
        });
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setEntityToDelete(null);
    }
  };

  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entity.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || entity.type === selectedType;
    return matchesSearch && matchesType;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-success/10 text-success border-success/20',
      pending: 'bg-warning/10 text-warning border-warning/20',
      inactive: 'bg-muted text-muted-foreground',
      suspended: 'bg-destructive/10 text-destructive border-destructive/20'
    };
    return variants[status] || variants.inactive;
  };

  // Calculate cumulative limit for buyers from supplier assignments
  const calculateBuyerLimit = (buyer: any) => {
    if (buyer.type !== 'buyer' || !buyer.supplierLimits) {
      return { totalLimit: 0, usedLimit: 0, availableLimit: 0 };
    }
    
    const totalLimit = buyer.supplierLimits.reduce((sum: number, sl: any) => 
      sum + (parseFloat(sl.transactionLimit) || 0), 0
    );
    
    // Since no actual transactions have been processed yet, used limit is 0
    const usedLimit = 0;
    const availableLimit = totalLimit - usedLimit;
    
    return { totalLimit, usedLimit, availableLimit };
  };

  // Get display values for credit facility
  const getCreditFacilityDisplay = (entity: any) => {
    if (entity.type === 'supplier') {
      return {
        totalLimit: entity.totalLimitSanctioned || entity.creditLimit || 0,
        usedLimit: entity.usedLimit || entity.utilizedLimit || 0,
        availableLimit: entity.availableLimit || 0,
        showAsSupplierLimit: true
      };
    } else if (entity.type === 'buyer') {
      const buyerLimits = calculateBuyerLimit(entity);
      return {
        totalLimit: buyerLimits.totalLimit,
        usedLimit: buyerLimits.usedLimit,
        availableLimit: buyerLimits.availableLimit,
        showAsSupplierLimit: false
      };
    }
    return { totalLimit: 0, usedLimit: 0, availableLimit: 0, showAsSupplierLimit: false };
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-financial-navy">Suppliers & Buyers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage factoring counterparties and credit facilities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          {/* Context-aware Add buttons */}
          {selectedType === 'all' ? (
            <>
              <Button 
                className="btn-financial"
                onClick={() => setIsAddBuyerDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Buyer
              </Button>
              <Button 
                className="btn-financial"
                onClick={() => setIsAddSupplierDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            </>
          ) : selectedType === 'buyer' ? (
            <Button 
              className="btn-financial"
              onClick={() => setIsAddBuyerDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Buyer
            </Button>
          ) : (
            <Button 
              className="btn-financial"
              onClick={() => setIsAddSupplierDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-financial-navy">
                  {entityStats.totalSuppliers + entityStats.totalBuyers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {entityStats.totalSuppliers} suppliers • {entityStats.totalBuyers} buyers
                </p>
              </div>
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Credit Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-financial-navy">
                  {formatCurrency(entityStats.totalCreditLimit)}
                </div>
                <p className="text-xs text-success">+12.5% from last month</p>
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-financial-navy">{entityStats.pendingApproval}</div>
                <p className="text-xs text-muted-foreground">Require review</p>
              </div>
              <Shield className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={selectedType === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedType('all')}
          >
            All
          </Button>
          <Button 
            variant={selectedType === 'supplier' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedType('supplier')}
          >
            Suppliers
          </Button>
          <Button 
            variant={selectedType === 'buyer' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedType('buyer')}
          >
            Buyers
          </Button>
        </div>
      </div>

      {/* Entities Data Table */}
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-financial-navy">
            Entity Directory ({filteredEntities.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="font-semibold">Entity Details</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Credit Facility</TableHead>
                <TableHead className="font-semibold">Last Activity</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="space-y-3">
                      <p className="text-muted-foreground text-lg">No entities available</p>
                      <p className="text-sm text-muted-foreground">
                        {entities.length === 0 
                          ? "Start by adding suppliers and buyers to your factoring platform."
                          : "No entities match your current search criteria."
                        }
                      </p>
                      {/* Context-aware empty state button */}
                      {selectedType === 'all' ? (
                        <div className="flex gap-3 mt-4">
                          <Button 
                            className="btn-financial"
                            onClick={() => setIsAddSupplierDialogOpen(true)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Supplier
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setIsAddBuyerDialogOpen(true)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Buyer
                          </Button>
                        </div>
                      ) : selectedType === 'buyer' ? (
                        <Button 
                          className="btn-financial mt-4"
                          onClick={() => setIsAddBuyerDialogOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Buyer
                        </Button>
                      ) : (
                        <Button 
                          className="btn-financial mt-4"
                          onClick={() => setIsAddSupplierDialogOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Supplier
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntities.map((entity) => (
                <TableRow key={entity.id} className="border-border hover:bg-muted/30">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-financial-navy">{entity.name}</p>
                      <p className="text-xs text-muted-foreground">{entity.entityId}</p>
                      <p className="text-xs text-muted-foreground">{entity.contactEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {entity.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge className={getStatusBadge(entity.status)}>
                        {entity.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const facilityData = getCreditFacilityDisplay(entity);
                      const usagePercent = facilityData.totalLimit > 0 
                        ? (facilityData.usedLimit / facilityData.totalLimit) * 100 
                        : 0;
                      
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {formatCurrency(facilityData.totalLimit)}
                            </p>
                            {!facilityData.showAsSupplierLimit && facilityData.totalLimit > 0 && (
                              <span className="text-xs text-muted-foreground">(from suppliers)</span>
                            )}
                          </div>
                          {facilityData.totalLimit > 0 ? (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Used: {formatCurrency(facilityData.usedLimit)}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div 
                                  className="bg-primary rounded-full h-1.5 transition-all"
                                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Available: {formatCurrency(facilityData.availableLimit)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {entity.type === 'buyer' ? 'No supplier limits assigned' : 'No limit set'}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">
                        {entity.lastTransaction 
                          ? formatDate(entity.lastTransaction)
                          : 'No transactions'
                        }
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(entity)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditEntity(entity)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Entity
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAdjustLimits(entity)}>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Adjust Limits
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteEntity(entity)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Delete Entity
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddSupplierDialog 
        open={isAddSupplierDialogOpen}
        onOpenChange={setIsAddSupplierDialogOpen}
      />
      
      <AddBuyerDialog 
        open={isAddBuyerDialogOpen}
        onOpenChange={setIsAddBuyerDialogOpen}
      />
      
      <EntityDetailsDialog 
        open={isViewingDetails}
        onOpenChange={setIsViewingDetails}
        entity={selectedEntity}
      />
      
      <AdjustLimitsDialog 
        open={isAdjustLimitsOpen}
        onOpenChange={setIsAdjustLimitsOpen}
        entity={selectedEntity}
        onSuccess={fetchEntities}
      />
      
      <EditEntityDialog 
        open={isEditingEntity}
        onOpenChange={setIsEditingEntity}
        entity={selectedEntity}
        onSuccess={fetchEntities}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{entityToDelete?.name}</strong>? 
              This action cannot be undone and will permanently remove this {entityToDelete?.type} 
              from your system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteEntity}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Entity
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
