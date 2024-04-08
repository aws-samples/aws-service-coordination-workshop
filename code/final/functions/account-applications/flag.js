'use strict';
const APPLICATIONS_TABLE_NAME = process.env.APPLICATIONS_TABLE_NAME;

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const AccountApplications = require('./AccountApplications')(APPLICATIONS_TABLE_NAME, docClient);

const flagForReview = async (data) => {
    const { id, flagType, checks, taskToken } = data;

    if (flagType !== 'REVIEW' && flagType !== 'UNPROCESSABLE_DATA') {
        throw new Error("flagType must be REVIEW or UNPROCESSABLE_DATA")
    };

    let attrs = {};
    if (flagType === 'REVIEW') {
        attrs.state = 'FLAGGED_FOR_REVIEW';
        if (checks) {
            let reasons = [];
            checks.forEach(check => {
                if (check.reason){
                    reasons.push(check.reason);
                }
            });
            const reason = reasons.join(', ');
            attrs.reason = reason;
        }
    }
    else {
        attrs.state = 'FLAGGED_WITH_UNPROCESSABLE_DATA';
        attrs.reason = JSON.parse(data.errorInfo.Cause).errorMessage;        
    }

    if (taskToken) {
        attrs.taskToken = taskToken;
    }   

    const updatedApplication = await AccountApplications.update(
        id,
        attrs
    );
    return updatedApplication;
}

module.exports.handler = async(event) => {
    try {
        const result = await flagForReview(event);
        return result;
    } catch (ex) {
        console.error(ex);
        console.info('event', JSON.stringify(event));
        throw ex;
    }
};