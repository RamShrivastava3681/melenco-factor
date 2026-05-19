import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { getDynamoClient, getDynamoTableName } from './dynamoClient';
import {
  IEntity,
  IFrameworkAgreement,
  INOA,
  IPayoutRecord,
  ITransaction
} from '../models/schemas';

type RecordType = 'ENTITY' | 'TRANSACTION' | 'NOA' | 'FRAMEWORK' | 'PAYOUT';

type DynamoRecord = {
  pk: string;
  sk: string;
  recordType: RecordType;
  createdAt: string | Date;
  updatedAt: string | Date;
};

const nowIso = () => new Date().toISOString();

const buildKey = (recordType: RecordType, id: string) => ({
  pk: `${recordType}#${id}`,
  sk: `${recordType}#${id}`
});

const stripMetadata = <T>(item: any): T => {
  if (!item) {
    return item as T;
  }

  const { pk, sk, recordType, ...rest } = item;
  return rest as T;
};

const scanAll = async (filterExpression?: string, expressionValues?: Record<string, any>) => {
  const client = getDynamoClient();
  const tableName = getDynamoTableName();

  let lastKey: Record<string, any> | undefined;
  const items: any[] = [];

  do {
    const response = await client.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionValues,
        ExclusiveStartKey: lastKey
      })
    );

    if (response.Items) {
      items.push(...response.Items);
    }

    lastKey = response.LastEvaluatedKey as Record<string, any> | undefined;
  } while (lastKey);

  return items;
};

const getItem = async <T>(recordType: RecordType, id: string): Promise<T | null> => {
  const client = getDynamoClient();
  const tableName = getDynamoTableName();
  const { pk, sk } = buildKey(recordType, id);

  const response = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk, sk }
    })
  );

  if (!response.Item) {
    return null;
  }

  return stripMetadata<T>(response.Item);
};

const putItem = async <T extends Record<string, any>>(recordType: RecordType, id: string, data: T): Promise<T> => {
  const client = getDynamoClient();
  const tableName = getDynamoTableName();
  const { pk, sk } = buildKey(recordType, id);

  const createdAt = data.createdAt || nowIso();
  const updatedAt = data.updatedAt || nowIso();

  const item: DynamoRecord & T = {
    pk,
    sk,
    recordType,
    createdAt,
    updatedAt,
    ...data
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: item
    })
  );

  return stripMetadata<T>(item);
};

const deleteItem = async (recordType: RecordType, id: string): Promise<void> => {
  const client = getDynamoClient();
  const tableName = getDynamoTableName();
  const { pk, sk } = buildKey(recordType, id);

  await client.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { pk, sk }
    })
  );
};

const sortByCreatedAtDesc = <T extends { createdAt?: string | Date }>(items: T[]): T[] => {
  return items.sort((a, b) => {
    const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
};

export const listEntities = async (): Promise<IEntity[]> => {
  const items = await scanAll('recordType = :type', { ':type': 'ENTITY' });
  return sortByCreatedAtDesc(items.map(stripMetadata<IEntity>));
};

export const listEntitiesByType = async (type: string): Promise<IEntity[]> => {
  const entities = await listEntities();
  return entities.filter((entity) => entity.type === type);
};

export const getEntityById = async (id: string): Promise<IEntity | null> => {
  if (!id) {
    return null;
  }

  const direct = await getItem<IEntity>('ENTITY', id);
  if (direct) {
    return direct;
  }

  const entities = await listEntities();
  return entities.find((entity) =>
    String(entity.entityId || '').toLowerCase() === String(id).toLowerCase() ||
    String((entity as any)._id || '').toLowerCase() === String(id).toLowerCase() ||
    String((entity as any).id || '').toLowerCase() === String(id).toLowerCase()
  ) || null;
};

export const createEntity = async (entity: IEntity): Promise<IEntity> => {
  return putItem<IEntity>('ENTITY', entity.entityId, {
    ...entity,
    createdAt: entity.createdAt || nowIso(),
    updatedAt: entity.updatedAt || nowIso()
  });
};

export const updateEntity = async (id: string, updates: Partial<IEntity>): Promise<IEntity | null> => {
  const existing = await getEntityById(id);
  if (!existing) {
    return null;
  }

  const merged: IEntity = {
    ...existing,
    ...updates,
    entityId: existing.entityId,
    updatedAt: nowIso()
  };

  return putItem<IEntity>('ENTITY', existing.entityId, merged);
};

export const deleteEntity = async (id: string): Promise<IEntity | null> => {
  const existing = await getEntityById(id);
  if (!existing) {
    return null;
  }

  await deleteItem('ENTITY', existing.entityId);
  return existing;
};

export const listTransactions = async (): Promise<ITransaction[]> => {
  const items = await scanAll('recordType = :type', { ':type': 'TRANSACTION' });
  return sortByCreatedAtDesc(items.map(stripMetadata<ITransaction>));
};

export const listTransactionsByStatus = async (statuses: string[]): Promise<ITransaction[]> => {
  const transactions = await listTransactions();
  const normalized = new Set(statuses.map((status) => String(status).toLowerCase()));
  return transactions.filter((transaction) => normalized.has(String(transaction.status || '').toLowerCase()));
};

export const getTransactionById = async (id: string): Promise<ITransaction | null> => {
  if (!id) {
    return null;
  }

  const direct = await getItem<ITransaction>('TRANSACTION', id);
  if (direct) {
    return direct;
  }

  const transactions = await listTransactions();
  return transactions.find((transaction) =>
    String(transaction.transactionId || '').toLowerCase() === String(id).toLowerCase() ||
    String((transaction as any)._id || '').toLowerCase() === String(id).toLowerCase() ||
    String((transaction as any).id || '').toLowerCase() === String(id).toLowerCase()
  ) || null;
};

export const createTransaction = async (transaction: ITransaction): Promise<ITransaction> => {
  return putItem<ITransaction>('TRANSACTION', transaction.transactionId, {
    ...transaction,
    createdAt: transaction.createdAt || nowIso(),
    updatedAt: transaction.updatedAt || nowIso()
  });
};

export const updateTransaction = async (id: string, updates: Partial<ITransaction>): Promise<ITransaction | null> => {
  const existing = await getTransactionById(id);
  if (!existing) {
    return null;
  }

  const merged: ITransaction = {
    ...existing,
    ...updates,
    transactionId: existing.transactionId,
    updatedAt: nowIso()
  };

  return putItem<ITransaction>('TRANSACTION', existing.transactionId, merged);
};

export const deleteTransaction = async (id: string): Promise<ITransaction | null> => {
  const existing = await getTransactionById(id);
  if (!existing) {
    return null;
  }

  await deleteItem('TRANSACTION', existing.transactionId);
  return existing;
};

export const updateTransactionsByIds = async (ids: string[], updates: Partial<ITransaction>): Promise<ITransaction[]> => {
  const updated: ITransaction[] = [];
  for (const id of ids) {
    const next = await updateTransaction(id, updates);
    if (next) {
      updated.push(next);
    }
  }
  return updated;
};

export const listNoas = async (): Promise<INOA[]> => {
  const items = await scanAll('recordType = :type', { ':type': 'NOA' });
  return sortByCreatedAtDesc(items.map(stripMetadata<INOA>));
};

export const listNoasByStatus = async (status: string): Promise<INOA[]> => {
  const noas = await listNoas();
  return noas.filter((noa) => String(noa.status || '').toLowerCase() === String(status).toLowerCase());
};

export const getNoaByToken = async (token: string): Promise<INOA | null> => {
  return getItem<INOA>('NOA', token);
};

export const getNoaByTransactionId = async (transactionId: string): Promise<INOA | null> => {
  const noas = await listNoas();
  return noas.find((noa) => noa.transactionId === transactionId) || null;
};

export const createNoa = async (noa: INOA): Promise<INOA> => {
  return putItem<INOA>('NOA', noa.noaId, {
    ...noa,
    createdAt: noa.createdAt || nowIso(),
    updatedAt: noa.updatedAt || nowIso()
  });
};

export const updateNoa = async (token: string, updates: Partial<INOA>): Promise<INOA | null> => {
  const existing = await getNoaByToken(token);
  if (!existing) {
    return null;
  }

  const merged: INOA = {
    ...existing,
    ...updates,
    noaId: existing.noaId,
    updatedAt: nowIso()
  };

  return putItem<INOA>('NOA', existing.noaId, merged);
};

export const listFrameworkAgreements = async (): Promise<IFrameworkAgreement[]> => {
  const items = await scanAll('recordType = :type', { ':type': 'FRAMEWORK' });
  return sortByCreatedAtDesc(items.map(stripMetadata<IFrameworkAgreement>));
};

export const listFrameworkAgreementsByStatus = async (status: string): Promise<IFrameworkAgreement[]> => {
  const agreements = await listFrameworkAgreements();
  return agreements.filter((agreement) => String(agreement.status || '').toLowerCase() === String(status).toLowerCase());
};

export const getFrameworkAgreementById = async (id: string): Promise<IFrameworkAgreement | null> => {
  return getItem<IFrameworkAgreement>('FRAMEWORK', id);
};

export const createFrameworkAgreement = async (agreement: IFrameworkAgreement): Promise<IFrameworkAgreement> => {
  return putItem<IFrameworkAgreement>('FRAMEWORK', agreement.agreementId, {
    ...agreement,
    createdAt: agreement.createdAt || nowIso(),
    updatedAt: agreement.updatedAt || nowIso()
  });
};

export const updateFrameworkAgreement = async (id: string, updates: Partial<IFrameworkAgreement>): Promise<IFrameworkAgreement | null> => {
  const existing = await getFrameworkAgreementById(id);
  if (!existing) {
    return null;
  }

  const merged: IFrameworkAgreement = {
    ...existing,
    ...updates,
    agreementId: existing.agreementId,
    updatedAt: nowIso()
  };

  return putItem<IFrameworkAgreement>('FRAMEWORK', existing.agreementId, merged);
};

export const listPayoutRecords = async (): Promise<IPayoutRecord[]> => {
  const items = await scanAll('recordType = :type', { ':type': 'PAYOUT' });
  return sortByCreatedAtDesc(items.map(stripMetadata<IPayoutRecord>));
};

export const getPayoutRecordById = async (id: string): Promise<IPayoutRecord | null> => {
  return getItem<IPayoutRecord>('PAYOUT', id);
};

export const createPayoutRecord = async (record: IPayoutRecord): Promise<IPayoutRecord> => {
  return putItem<IPayoutRecord>('PAYOUT', record.payoutId, {
    ...record,
    createdAt: record.createdAt || nowIso(),
    updatedAt: record.updatedAt || nowIso()
  });
};
