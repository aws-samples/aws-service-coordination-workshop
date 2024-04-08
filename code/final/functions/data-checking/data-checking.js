'use strict';

const checkName = (data) => {
    const { name } = data

    if (name.includes("UNPROCESSABLE_DATA")) {
        const simulatedError = new Error(`Simulated error: Name '${name}' is not possible to check.`)
        simulatedError.name = 'UnprocessableDataException'
        throw simulatedError
    }

    const flagged = name.includes('evil')
    if (flagged) {
        const reason = "Invalid Name - contains the word evil!"
        return { flagged, reason }
    }
    return { flagged }
}

const checkAddress = (data) => {
    const { address } = data

    const flagged = (address.match(/(\d+ \w+)|(\w+ \d+)/g) === null)
    
    if (flagged) {
        const reason = "Invalid Address - does not contain a number and a word"
        return { flagged, reason }
    }
    
    return { flagged }
}


const commandHandlers = {
    'CHECK_NAME': checkName,
    'CHECK_ADDRESS': checkAddress,
}

module.exports.handler = (event, context, callback) => {
    try {
        const { command, data } = event

        const result = commandHandlers[command](data)
        callback(null, result)
    } catch (ex) {
        console.error(ex)
        console.info('event', JSON.stringify(event))
        callback(ex)
    }
};