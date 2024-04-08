'use strict';
const APPLICATIONS_TABLE_NAME = process.env.APPLICATIONS_TABLE_NAME

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const AccountApplications = require('./AccountApplications')(APPLICATIONS_TABLE_NAME, docClient)

const submitNewAccountApplication = async (data) => {
    const { name, address } = data
    const application = await AccountApplications.create({ name, address, state: 'SUBMITTED' })
    return application
} 

module.exports.handler = async(event) => {
    let application
    try {
        application = await submitNewAccountApplication(event)
        return application
    } catch (ex) {
        if (application !== undefined) {
            await AccountApplications.delete(application.id)
        }

        console.error(ex)
        console.info('event', JSON.stringify(event))
        throw ex
    }
}