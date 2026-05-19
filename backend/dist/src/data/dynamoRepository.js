"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayoutRecord = exports.getPayoutRecordById = exports.listPayoutRecords = exports.updateFrameworkAgreement = exports.createFrameworkAgreement = exports.getFrameworkAgreementById = exports.listFrameworkAgreementsByStatus = exports.listFrameworkAgreements = exports.updateNoa = exports.createNoa = exports.getNoaByTransactionId = exports.getNoaByToken = exports.listNoasByStatus = exports.listNoas = exports.updateTransactionsByIds = exports.deleteTransaction = exports.updateTransaction = exports.createTransaction = exports.getTransactionById = exports.listTransactionsByStatus = exports.listTransactions = exports.deleteEntity = exports.updateEntity = exports.createEntity = exports.getEntityById = exports.listEntitiesByType = exports.listEntities = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamoClient_1 = require("./dynamoClient");
const nowIso = () => new Date().toISOString();
const buildKey = (recordType, id) => ({
    pk: `${recordType}#${id}`,
    sk: `${recordType}#${id}`
});
const stripMetadata = (item) => {
    if (!item) {
        return item;
    }
    const { pk, sk, recordType, ...rest } = item;
    return rest;
};
const scanAll = async (filterExpression, expressionValues) => {
    const client = (0, dynamoClient_1.getDynamoClient)();
    const tableName = (0, dynamoClient_1.getDynamoTableName)();
    let lastKey;
    const items = [];
    do {
        const response = await client.send(new lib_dynamodb_1.ScanCommand({
            TableName: tableName,
            FilterExpression: filterExpression,
            ExpressionAttributeValues: expressionValues,
            ExclusiveStartKey: lastKey
        }));
        if (response.Items) {
            items.push(...response.Items);
        }
        lastKey = response.LastEvaluatedKey;
    } while (lastKey);
    return items;
};
const getItem = async (recordType, id) => {
    const client = (0, dynamoClient_1.getDynamoClient)();
    const tableName = (0, dynamoClient_1.getDynamoTableName)();
    const { pk, sk } = buildKey(recordType, id);
    const response = await client.send(new lib_dynamodb_1.GetCommand({
        TableName: tableName,
        Key: { pk, sk }
    }));
    if (!response.Item) {
        return null;
    }
    return stripMetadata(response.Item);
};
const putItem = async (recordType, id, data) => {
    const client = (0, dynamoClient_1.getDynamoClient)();
    const tableName = (0, dynamoClient_1.getDynamoTableName)();
    const { pk, sk } = buildKey(recordType, id);
    const createdAt = data.createdAt || nowIso();
    const updatedAt = data.updatedAt || nowIso();
    const item = {
        pk,
        sk,
        recordType,
        createdAt,
        updatedAt,
        ...data
    };
    await client.send(new lib_dynamodb_1.PutCommand({
        TableName: tableName,
        Item: item
    }));
    return stripMetadata(item);
};
const deleteItem = async (recordType, id) => {
    const client = (0, dynamoClient_1.getDynamoClient)();
    const tableName = (0, dynamoClient_1.getDynamoTableName)();
    const { pk, sk } = buildKey(recordType, id);
    await client.send(new lib_dynamodb_1.DeleteCommand({
        TableName: tableName,
        Key: { pk, sk }
    }));
};
const sortByCreatedAtDesc = (items) => {
    return items.sort((a, b) => {
        const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
    });
};
const listEntities = async () => {
    const items = await scanAll('recordType = :type', { ':type': 'ENTITY' });
    return sortByCreatedAtDesc(items.map((stripMetadata)));
};
exports.listEntities = listEntities;
const listEntitiesByType = async (type) => {
    const entities = await (0, exports.listEntities)();
    return entities.filter((entity) => entity.type === type);
};
exports.listEntitiesByType = listEntitiesByType;
const getEntityById = async (id) => {
    if (!id) {
        return null;
    }
    const direct = await getItem('ENTITY', id);
    if (direct) {
        return direct;
    }
    const entities = await (0, exports.listEntities)();
    return entities.find((entity) => String(entity.entityId || '').toLowerCase() === String(id).toLowerCase() ||
        String(entity._id || '').toLowerCase() === String(id).toLowerCase() ||
        String(entity.id || '').toLowerCase() === String(id).toLowerCase()) || null;
};
exports.getEntityById = getEntityById;
const createEntity = async (entity) => {
    return putItem('ENTITY', entity.entityId, {
        ...entity,
        createdAt: entity.createdAt || nowIso(),
        updatedAt: entity.updatedAt || nowIso()
    });
};
exports.createEntity = createEntity;
const updateEntity = async (id, updates) => {
    const existing = await (0, exports.getEntityById)(id);
    if (!existing) {
        return null;
    }
    const merged = {
        ...existing,
        ...updates,
        entityId: existing.entityId,
        updatedAt: nowIso()
    };
    return putItem('ENTITY', existing.entityId, merged);
};
exports.updateEntity = updateEntity;
const deleteEntity = async (id) => {
    const existing = await (0, exports.getEntityById)(id);
    if (!existing) {
        return null;
    }
    await deleteItem('ENTITY', existing.entityId);
    return existing;
};
exports.deleteEntity = deleteEntity;
const listTransactions = async () => {
    const items = await scanAll('recordType = :type', { ':type': 'TRANSACTION' });
    return sortByCreatedAtDesc(items.map((stripMetadata)));
};
exports.listTransactions = listTransactions;
const listTransactionsByStatus = async (statuses) => {
    const transactions = await (0, exports.listTransactions)();
    const normalized = new Set(statuses.map((status) => String(status).toLowerCase()));
    return transactions.filter((transaction) => normalized.has(String(transaction.status || '').toLowerCase()));
};
exports.listTransactionsByStatus = listTransactionsByStatus;
const getTransactionById = async (id) => {
    if (!id) {
        return null;
    }
    const direct = await getItem('TRANSACTION', id);
    if (direct) {
        return direct;
    }
    const transactions = await (0, exports.listTransactions)();
    return transactions.find((transaction) => String(transaction.transactionId || '').toLowerCase() === String(id).toLowerCase() ||
        String(transaction._id || '').toLowerCase() === String(id).toLowerCase() ||
        String(transaction.id || '').toLowerCase() === String(id).toLowerCase()) || null;
};
exports.getTransactionById = getTransactionById;
const createTransaction = async (transaction) => {
    return putItem('TRANSACTION', transaction.transactionId, {
        ...transaction,
        createdAt: transaction.createdAt || nowIso(),
        updatedAt: transaction.updatedAt || nowIso()
    });
};
exports.createTransaction = createTransaction;
const updateTransaction = async (id, updates) => {
    const existing = await (0, exports.getTransactionById)(id);
    if (!existing) {
        return null;
    }
    const merged = {
        ...existing,
        ...updates,
        transactionId: existing.transactionId,
        updatedAt: nowIso()
    };
    return putItem('TRANSACTION', existing.transactionId, merged);
};
exports.updateTransaction = updateTransaction;
const deleteTransaction = async (id) => {
    const existing = await (0, exports.getTransactionById)(id);
    if (!existing) {
        return null;
    }
    await deleteItem('TRANSACTION', existing.transactionId);
    return existing;
};
exports.deleteTransaction = deleteTransaction;
const updateTransactionsByIds = async (ids, updates) => {
    const updated = [];
    for (const id of ids) {
        const next = await (0, exports.updateTransaction)(id, updates);
        if (next) {
            updated.push(next);
        }
    }
    return updated;
};
exports.updateTransactionsByIds = updateTransactionsByIds;
const listNoas = async () => {
    const items = await scanAll('recordType = :type', { ':type': 'NOA' });
    return sortByCreatedAtDesc(items.map((stripMetadata)));
};
exports.listNoas = listNoas;
const listNoasByStatus = async (status) => {
    const noas = await (0, exports.listNoas)();
    return noas.filter((noa) => String(noa.status || '').toLowerCase() === String(status).toLowerCase());
};
exports.listNoasByStatus = listNoasByStatus;
const getNoaByToken = async (token) => {
    return getItem('NOA', token);
};
exports.getNoaByToken = getNoaByToken;
const getNoaByTransactionId = async (transactionId) => {
    const noas = await (0, exports.listNoas)();
    return noas.find((noa) => noa.transactionId === transactionId) || null;
};
exports.getNoaByTransactionId = getNoaByTransactionId;
const createNoa = async (noa) => {
    return putItem('NOA', noa.noaId, {
        ...noa,
        createdAt: noa.createdAt || nowIso(),
        updatedAt: noa.updatedAt || nowIso()
    });
};
exports.createNoa = createNoa;
const updateNoa = async (token, updates) => {
    const existing = await (0, exports.getNoaByToken)(token);
    if (!existing) {
        return null;
    }
    const merged = {
        ...existing,
        ...updates,
        noaId: existing.noaId,
        updatedAt: nowIso()
    };
    return putItem('NOA', existing.noaId, merged);
};
exports.updateNoa = updateNoa;
const listFrameworkAgreements = async () => {
    const items = await scanAll('recordType = :type', { ':type': 'FRAMEWORK' });
    return sortByCreatedAtDesc(items.map((stripMetadata)));
};
exports.listFrameworkAgreements = listFrameworkAgreements;
const listFrameworkAgreementsByStatus = async (status) => {
    const agreements = await (0, exports.listFrameworkAgreements)();
    return agreements.filter((agreement) => String(agreement.status || '').toLowerCase() === String(status).toLowerCase());
};
exports.listFrameworkAgreementsByStatus = listFrameworkAgreementsByStatus;
const getFrameworkAgreementById = async (id) => {
    return getItem('FRAMEWORK', id);
};
exports.getFrameworkAgreementById = getFrameworkAgreementById;
const createFrameworkAgreement = async (agreement) => {
    return putItem('FRAMEWORK', agreement.agreementId, {
        ...agreement,
        createdAt: agreement.createdAt || nowIso(),
        updatedAt: agreement.updatedAt || nowIso()
    });
};
exports.createFrameworkAgreement = createFrameworkAgreement;
const updateFrameworkAgreement = async (id, updates) => {
    const existing = await (0, exports.getFrameworkAgreementById)(id);
    if (!existing) {
        return null;
    }
    const merged = {
        ...existing,
        ...updates,
        agreementId: existing.agreementId,
        updatedAt: nowIso()
    };
    return putItem('FRAMEWORK', existing.agreementId, merged);
};
exports.updateFrameworkAgreement = updateFrameworkAgreement;
const listPayoutRecords = async () => {
    const items = await scanAll('recordType = :type', { ':type': 'PAYOUT' });
    return sortByCreatedAtDesc(items.map((stripMetadata)));
};
exports.listPayoutRecords = listPayoutRecords;
const getPayoutRecordById = async (id) => {
    return getItem('PAYOUT', id);
};
exports.getPayoutRecordById = getPayoutRecordById;
const createPayoutRecord = async (record) => {
    return putItem('PAYOUT', record.payoutId, {
        ...record,
        createdAt: record.createdAt || nowIso(),
        updatedAt: record.updatedAt || nowIso()
    });
};
exports.createPayoutRecord = createPayoutRecord;
//# sourceMappingURL=dynamoRepository.js.map