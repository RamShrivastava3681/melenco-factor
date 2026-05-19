"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamoClient_1 = require("./src/data/dynamoClient");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function clearDB() {
    const client = (0, dynamoClient_1.getDynamoClient)();
    const tableName = (0, dynamoClient_1.getDynamoTableName)();
    console.log(`Starting to clear database table: ${tableName}`);
    let lastEvaluatedKey = undefined;
    let count = 0;
    do {
        const scanResult = await client.send(new lib_dynamodb_1.ScanCommand({
            TableName: tableName,
            ExclusiveStartKey: lastEvaluatedKey
        }));
        if (scanResult.Items && scanResult.Items.length > 0) {
            for (const item of scanResult.Items) {
                await client.send(new lib_dynamodb_1.DeleteCommand({
                    TableName: tableName,
                    Key: {
                        pk: item.pk,
                        sk: item.sk
                    }
                }));
                count++;
                console.log(`Deleted: pk=${item.pk}, sk=${item.sk}`);
            }
        }
        lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    console.log(`Completed clearing database. Deleted ${count} items.`);
}
clearDB().catch(console.error);
//# sourceMappingURL=clear-db.js.map