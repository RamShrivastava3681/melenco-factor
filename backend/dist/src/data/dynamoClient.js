"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDynamoClient = exports.getDynamoTableName = exports.isDynamoConfigured = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
let docClient = null;
const isDynamoConfigured = () => {
    return Boolean(process.env.AWS_REGION && process.env.DYNAMODB_TABLE);
};
exports.isDynamoConfigured = isDynamoConfigured;
const getDynamoTableName = () => {
    if (!process.env.DYNAMODB_TABLE) {
        throw new Error('Missing DYNAMODB_TABLE in environment');
    }
    return process.env.DYNAMODB_TABLE;
};
exports.getDynamoTableName = getDynamoTableName;
const getDynamoClient = () => {
    if (docClient) {
        return docClient;
    }
    if (!process.env.AWS_REGION) {
        throw new Error('Missing AWS_REGION in environment');
    }
    const client = new client_dynamodb_1.DynamoDBClient({
        region: process.env.AWS_REGION
    });
    docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client, {
        marshallOptions: {
            removeUndefinedValues: true
        }
    });
    return docClient;
};
exports.getDynamoClient = getDynamoClient;
//# sourceMappingURL=dynamoClient.js.map