"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockAlerts = exports.mockDashboardKPIs = exports.mockTransactions = exports.mockSuppliers = exports.mockBuyers = void 0;
exports.mockBuyers = [
    {
        id: 'buyer_1',
        name: 'Tech Solutions Corp',
        legalName: 'Tech Solutions Corporation',
        type: 'buyer',
        status: 'active',
        address: '4567 Corporate Plaza',
        city: 'New York',
        state: 'New York',
        country: 'USA',
        pincode: '10001',
        phone: '+1 (212) 555-4567',
        email: 'procurement@techsolutions.com',
        contactPersonName: 'Jennifer Williams',
        contactPersonDesignation: 'Procurement Director',
        contactPersonEmail: 'jennifer.williams@techsolutions.com',
        contactPersonPhone: '+1 (212) 555-4568',
        creditLimit: 650000,
        industry: 'Technology',
        taxId: 'EIN-44-5566778',
        notes: 'Large technology company with excellent payment history',
        supplierLimits: [
            {
                supplierId: 'supplier_1',
                supplierName: 'TechParts Manufacturing Inc.',
                transactionLimit: 300000
            },
            {
                supplierId: 'supplier_2',
                supplierName: 'Global Logistics Solutions',
                transactionLimit: 350000
            }
        ],
        createdAt: new Date('2024-03-01').toISOString()
    },
    {
        id: 'buyer_2',
        name: 'Manufacturing Excellence Ltd',
        legalName: 'Manufacturing Excellence Limited',
        type: 'buyer',
        status: 'active',
        address: '7890 Industrial Way',
        city: 'Chicago',
        state: 'Illinois',
        country: 'USA',
        pincode: '60601',
        phone: '+1 (312) 555-7890',
        email: 'orders@manufacturingexcellence.com',
        contactPersonName: 'Robert Chen',
        contactPersonDesignation: 'Supply Chain Manager',
        contactPersonEmail: 'robert.chen@manufacturingexcellence.com',
        contactPersonPhone: '+1 (312) 555-7891',
        creditLimit: 450000,
        industry: 'Manufacturing',
        taxId: 'EIN-33-7788990',
        notes: 'Well-established manufacturing company with reliable payment patterns',
        supplierLimits: [
            {
                supplierId: 'supplier_3',
                supplierName: 'Premium Materials Corp',
                transactionLimit: 450000
            }
        ],
        createdAt: new Date('2024-03-05').toISOString()
    }
];
exports.mockSuppliers = [
    {
        id: 'supplier_1',
        name: 'TechParts Manufacturing Inc.',
        legalName: 'TechParts Manufacturing Inc.',
        type: 'supplier',
        status: 'active',
        address: '1234 Industrial Drive',
        city: 'Detroit',
        state: 'Michigan',
        country: 'USA',
        pincode: '48201',
        phone: '+1 (313) 555-1234',
        email: 'procurement@techparts.com',
        contactPersonName: 'Sarah Johnson',
        contactPersonDesignation: 'Sales Manager',
        contactPersonEmail: 'sarah.johnson@techparts.com',
        contactPersonPhone: '+1 (313) 555-1235',
        creditLimit: 500000,
        industry: 'Electronics Manufacturing',
        taxId: 'EIN-12-3456789',
        notes: 'Preferred supplier for electronic components and parts',
        processingFees: 250,
        factoringFees: 2.0,
        setupFee: 1.5,
        setupFeePaymentMethod: 'one_time',
        createdAt: new Date('2024-01-15').toISOString()
    },
    {
        id: 'supplier_2',
        name: 'Global Logistics Solutions',
        legalName: 'Global Logistics Solutions Ltd.',
        type: 'supplier',
        status: 'active',
        address: '5678 Cargo Avenue',
        city: 'Los Angeles',
        state: 'California',
        country: 'USA',
        pincode: '90210',
        phone: '+1 (310) 555-5678',
        email: 'contact@globallogistics.com',
        contactPersonName: 'Michael Chen',
        contactPersonDesignation: 'Account Director',
        contactPersonEmail: 'michael.chen@globallogistics.com',
        contactPersonPhone: '+1 (310) 555-5679',
        creditLimit: 750000,
        industry: 'Logistics & Transportation',
        taxId: 'EIN-98-7654321',
        notes: 'Reliable shipping and transportation services provider',
        processingFees: 300,
        factoringFees: 1.8,
        setupFee: 2.0,
        setupFeePaymentMethod: 'one_time',
        createdAt: new Date('2024-02-01').toISOString()
    },
    {
        id: 'supplier_3',
        name: 'Premium Materials Corp',
        legalName: 'Premium Materials Corporation',
        type: 'supplier',
        status: 'active',
        address: '9876 Materials Boulevard',
        city: 'Houston',
        state: 'Texas',
        country: 'USA',
        pincode: '77001',
        phone: '+1 (713) 555-9876',
        email: 'sales@premiummaterials.com',
        contactPersonName: 'Emma Rodriguez',
        contactPersonDesignation: 'Key Account Manager',
        contactPersonEmail: 'emma.rodriguez@premiummaterials.com',
        contactPersonPhone: '+1 (713) 555-9877',
        creditLimit: 1000000,
        industry: 'Raw Materials',
        taxId: 'EIN-55-1122334',
        notes: 'High-quality raw materials supplier with excellent delivery times',
        processingFees: 500,
        factoringFees: 2.5,
        setupFee: 1.0,
        setupFeePaymentMethod: 'one_time',
        createdAt: new Date('2024-02-10').toISOString()
    },
    {
        id: 'supplier_4',
        name: 'Innovation Software Systems',
        legalName: 'Innovation Software Systems Inc.',
        type: 'supplier',
        status: 'active',
        address: '2468 Tech Park Circle',
        city: 'San Francisco',
        state: 'California',
        country: 'USA',
        pincode: '94102',
        phone: '+1 (415) 555-2468',
        email: 'business@innovationsoftware.com',
        contactPersonName: 'David Kim',
        contactPersonDesignation: 'Business Development Manager',
        contactPersonEmail: 'david.kim@innovationsoftware.com',
        contactPersonPhone: '+1 (415) 555-2469',
        creditLimit: 300000,
        industry: 'Software Development',
        taxId: 'EIN-77-9988776',
        notes: 'Custom software solutions and IT services provider',
        processingFees: 200,
        factoringFees: 3.0,
        setupFee: 0.5,
        setupFeePaymentMethod: 'one_time',
        createdAt: new Date('2024-02-20').toISOString()
    }
];
exports.mockTransactions = [];
exports.mockDashboardKPIs = {
    totalTransactions: {
        value: 0,
        change: 0,
        trend: 'up'
    },
    totalFeesEarned: {
        value: 0,
        change: 0,
        trend: 'up',
        currency: 'USD'
    },
    totalReserves: {
        value: 0,
        change: 0,
        trend: 'up',
        currency: 'USD'
    },
    portfolioUtilization: {
        value: 0,
        change: 0,
        trend: 'up',
        unit: '%'
    }
};
exports.mockAlerts = [];
//# sourceMappingURL=mockData.js.map