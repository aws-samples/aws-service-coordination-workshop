const { v4: uuidv4 } = require('uuid');
const { GetCommand, PutCommand, UpdateCommand, QueryCommand, DeleteCommand} = require('@aws-sdk/lib-dynamodb');
const { ConditionalCheckFailedException } = require('@aws-sdk/client-dynamodb');

class AccountApplications {
    constructor(tableName, docClient) {
        this.tableName = tableName;
        this.dynamo = docClient;
    }

    async create(attributes) {
        const applicationKey = id => `application_${id}`;
        const id = uuidv4();
        const application = Object.assign(attributes, { id: applicationKey(id) })
        const command = new PutCommand({
            TableName: this.tableName,
            Item: application
        });
        await this.dynamo.send(command);
        return application;
    }   

    async get(id) {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: {
                id: id
            },
        });
    
        const result = await this.dynamo.send(command);
        return result.Item;
    }

    async update(id, attributes) {
        let updateExpression = "SET ";
        let expressionAttributeNames = {};
        let expressionAttributeValues = {};

        for(let key in attributes) {
            // Add # symbol to start of key for expression attribute name
            let attributeName = "#" + key; 
            updateExpression += attributeName + " = :" + key + ", ";
            expressionAttributeNames[attributeName] = key;
            expressionAttributeValues[":"+key] = attributes[key];
        }
        updateExpression = updateExpression.slice(0, -2); // Remove extra comma
        const command = new UpdateCommand({
            TableName: this.tableName, 
            Key: { id },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,  
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(id)',
            ReturnValues: "ALL_NEW"
        });

        try {
            const response = await this.dynamo.send(command);
            const {Attributes} = response;
            const updatedApplication = Attributes;
            return updatedApplication;
        } catch (e) {
            if (e instanceof ConditionalCheckFailedException) {
                throw new Error("Existing Application does not exist with id:", id);
            } else {
                throw e;
            }
        }
    }

    async findAllByState(data) {
        const { state } = data
        const command = new QueryCommand ({
            TableName: this.tableName,
            IndexName: 'state',
            KeyConditionExpression: '#state = :state',
            // ExclusiveStartKey: paginationKey,
            ExpressionAttributeNames: { '#state': 'state' },
            ExpressionAttributeValues: { ':state': state }
        });
        const result = await this.dynamo.send(command);
        return result;
    }

    async delete(id) {
        const command = DeleteCommand({
          TableName: this.tableName,
          Key: { id: id }
        });
        const result = await this.dynamo.send(command);
        return result.Item;
    }
}

module.exports = exports = (tableName, docClient) => ( new AccountApplications(tableName, docClient) )