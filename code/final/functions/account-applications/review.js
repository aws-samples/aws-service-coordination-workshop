'use strict';
const REGION = process.env.REGION
const APPLICATIONS_TABLE_NAME = process.env.APPLICATIONS_TABLE_NAME

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const AccountApplications = require('./AccountApplications')(APPLICATIONS_TABLE_NAME, docClient)

const { SFN, SendTaskSuccessCommand } = require('@aws-sdk/client-sfn');
const stepfunctions = new SFN({
    region: REGION
});

const updateApplicationWithDecision = (id, decision) => {
    if (decision !== 'APPROVE' && decision !== 'REJECT') {
        throw new Error("Required `decision` parameter must be 'APPROVE' or 'REJECT'")
    }

    switch(decision) {
        case 'APPROVE': return AccountApplications.update(id, { state: 'REVIEW_APPROVED' })
        case 'REJECT': return AccountApplications.update(id, { state: 'REVIEW_REJECTED' })
    }
}

const updateWorkflowWithReviewDecision = async (data) => {
    const { id, decision } = data

    const updatedApplication = await updateApplicationWithDecision(id, decision)

    const command = new SendTaskSuccessCommand({
        output: JSON.stringify({ decision }),
        taskToken: updatedApplication.taskToken
    });
    await stepfunctions.send(command);

    return updatedApplication
}

module.exports.handler = async(event) => {
    try {
        const result = await updateWorkflowWithReviewDecision(event)
        return result
    } catch (ex) {
        console.error(ex)
        console.info('event', JSON.stringify(event))
        throw ex
    }
};