'use strict';;
const APPLICATIONS_TABLE_NAME = process.env.APPLICATIONS_TABLE_NAME;

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const AccountApplications = require('./AccountApplications')(APPLICATIONS_TABLE_NAME, docClient);

module.exports.handler = async(event) => {
    try {
        const result = await AccountApplications.findAllByState(event);
        return result;
    } catch (ex) {
        console.error(ex);
        console.info('event', JSON.stringify(event));
    }
};