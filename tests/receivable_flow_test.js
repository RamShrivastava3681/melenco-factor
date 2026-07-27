const fetch = require('node-fetch');

const API_URL = 'http://localhost:6767/api';
const HEADERS = {
  'Content-Type': 'application/json',
  // Add Authorization header if needed
  // 'Authorization': 'Bearer your-jwt-token'
};

async function apiPost(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error at ${endpoint}: ${response.status} ${response.statusText} - ${errorText}`);
  }
  return response.json();
}

async function apiGet(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`, { headers: HEADERS });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error at ${endpoint}: ${response.status} ${response.statusText} - ${errorText}`);
  }
  return response.json();
}

async function apiDelete(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE', headers: HEADERS });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error at ${endpoint}: ${response.status} ${response.statusText} - ${errorText}`);
  }
  return response.json();
}

async function runTest() {
  const testData = {
    supplier: null,
    buyer: null,
    buyerTx: null,
    supplierTx: null
  };

  try {
    console.log('--- 🧪 Starting Receivable-Side Transaction Flow Test ---');

    // 1. Create Supplier
    console.log('\nStep 1: Creating Test Supplier...');
    const supplierData = {
      name: 'TestFlow Supplier',
      type: 'supplier',
      email: 'testflow.supplier@example.com',
      creditLimit: 500000,
      totalLimitSanctioned: 500000,
      currency: 'USD'
    };
    const supplierRes = await apiPost('/entities', supplierData);
    testData.supplier = supplierRes.data;
    console.log(`✅ Supplier created with ID: ${testData.supplier.entityId}`);

    // 2. Create Buyer
    console.log('\nStep 2: Creating Test Buyer...');
    const buyerData = {
      name: 'TestFlow Buyer',
      type: 'buyer',
      email: 'testflow.buyer@example.com',
      creditLimit: 1000000,
      currency: 'USD',
      supplierLimits: [{
        supplierId: testData.supplier.entityId,
        supplierName: testData.supplier.name,
        transactionLimit: 250000
      }]
    };
    const buyerRes = await apiPost('/entities', buyerData);
    testData.buyer = buyerRes.data;
    console.log(`✅ Buyer created with ID: ${testData.buyer.entityId}`);

    // 3. Create Receivable-Side Transaction
    console.log('\nStep 3: Creating Receivable-Side Transaction...');
    const transactionData = {
      isReceivableInvoice: true,
      supplierId: testData.supplier.entityId,
      buyerId: testData.buyer.entityId,
      supplierName: testData.supplier.name,
      buyerName: testData.buyer.name,
      currency: 'USD',
      buyerInvoice: {
        number: 'BUY-INV-123',
        date: '2026-06-01',
        amount: '150000',
        dueDate: '2026-08-30'
      },
      supplierInvoice: {
        number: 'SUP-INV-456',
        date: '2026-06-05',
        amount: '145000',
        dueDate: '2026-07-31'
      },
      // These are still required by the backend validation, even if not used directly
      invoiceNumber: 'placeholder',
      invoiceDate: '2026-06-05',
      invoiceAmount: 150000,
      buyerEmail: 'testflow.buyer@example.com'
    };

    const txRes = await apiPost('/transactions', transactionData);
    testData.buyerTx = txRes.data.buyerTransaction;
    testData.supplierTx = txRes.data.supplierTransaction;
    console.log(`✅ Buyer Transaction created with ID: ${testData.buyerTx.transactionId} (Status: ${testData.buyerTx.status})`);
    console.log(`✅ Supplier Transaction created with ID: ${testData.supplierTx.transactionId} (Status: ${testData.supplierTx.status})`);

    // 4. Verify Transaction Creation
    console.log('\nStep 4: Verifying Transactions...');
    if (testData.buyerTx.status !== 'monitoring') {
      throw new Error(`Buyer transaction status is '${testData.buyerTx.status}', expected 'monitoring'.`);
    }
    if (testData.supplierTx.status !== 'pending') {
      throw new Error(`Supplier transaction status is '${testData.supplierTx.status}', expected 'pending'.`);
    }
    if (testData.buyerTx.relatedTransactionId !== testData.supplierTx.transactionId) {
      throw new Error('Buyer transaction is not linked correctly to supplier transaction.');
    }
    if (testData.supplierTx.relatedTransactionId !== testData.buyerTx.transactionId) {
        throw new Error('Supplier transaction is not linked correctly to buyer transaction.');
    }
    console.log('✅ Transactions created with correct initial statuses and links.');

    // 5. Simulate Treasury Funding (Update supplier transaction status)
    console.log('\nStep 5: Simulating Treasury Funding...');
    const fundingUpdate = { status: 'funded' };
    const fundedTxRes = await apiPost(`/transactions/${testData.supplierTx.transactionId}`, fundingUpdate);
    console.log(`✅ Supplier transaction ${fundedTxRes.data.transactionId} status updated to 'funded'.`);

    // 6. Simulate Buyer Payment (Update buyer transaction status)
    console.log('\nStep 6: Simulating Buyer Payment...');
    const paymentUpdate = { status: 'settled' };
    const settledTxRes = await apiPost(`/transactions/${testData.buyerTx.transactionId}`, paymentUpdate);
    console.log(`✅ Buyer transaction ${settledTxRes.data.transactionId} status updated to 'settled'.`);
    
    // 7. Simulate Closing both transactions
    console.log('\nStep 7: Simulating Closing Transactions...');
    const closeUpdate = { status: 'closed' };
    const closedSupplierRes = await apiPost(`/transactions/${testData.supplierTx.transactionId}`, closeUpdate);
    const closedBuyerRes = await apiPost(`/transactions/${testData.buyerTx.transactionId}`, closeUpdate);
    console.log(`✅ Supplier transaction ${closedSupplierRes.data.transactionId} status updated to 'closed'.`);
    console.log(`✅ Buyer transaction ${closedBuyerRes.data.transactionId} status updated to 'closed'.`);

    console.log('\n--- ✅ Test Flow Completed Successfully ---');

  } catch (error) {
    console.error('\n--- ❌ Test Flow Failed ---');
    console.error(error.message);
  } finally {
    // 8. Cleanup
    console.log('\n--- 🧹 Cleaning up test data ---');
    try {
      if (testData.buyerTx) await apiDelete(`/transactions/${testData.buyerTx.transactionId}`);
      if (testData.supplierTx) await apiDelete(`/transactions/${testData.supplierTx.transactionId}`);
      console.log('🗑️ Transactions deleted.');
      if (testData.buyer) await apiDelete(`/entities/${testData.buyer.entityId}`);
      console.log('🗑️ Buyer deleted.');
      if (testData.supplier) await apiDelete(`/entities/${testData.supplier.entityId}`);
      console.log('🗑️ Supplier deleted.');
      console.log('--- ✅ Cleanup Complete ---');
    } catch (cleanupError) {
      console.error('--- ❌ Cleanup Failed ---');
      console.error(cleanupError.message);
    }
  }
}

runTest();
