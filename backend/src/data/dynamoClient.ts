import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

let docClient: DynamoDBDocumentClient | null = null;

export const isDynamoConfigured = (): boolean => {
  return Boolean(process.env.AWS_REGION && process.env.DYNAMODB_TABLE);
};

export const getDynamoTableName = (): string => {
  if (!process.env.DYNAMODB_TABLE) {
    throw new Error('Missing DYNAMODB_TABLE in environment');
  }
  return process.env.DYNAMODB_TABLE;
};

export const getDynamoClient = (): DynamoDBDocumentClient => {
  if (docClient) {
    return docClient;
  }

  if (!process.env.AWS_REGION) {
    throw new Error('Missing AWS_REGION in environment');
  }

  const client = new DynamoDBClient({
    region: process.env.AWS_REGION
  });

  docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true
    }
  });

  return docClient;
};
