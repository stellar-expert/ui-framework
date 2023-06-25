export default class OperationDescriptor {
    /**
     * @type {BaseOperation} - Operation properties
     * @readonly
     */
    operation
    /**
     * @type {String} - Parent transaction hash
     * @readonly
     */
    txHash
    /**
     * @type {Number} - Application order
     * @readonly
     */
    order
    /**
     * @type {Boolean} - True for unsubmitted|unsuccessful transactions
     * @readonly
     */
    isEphemeral
    /**
     * @type {Boolean} - Whether the enclosing transaction has been successfully executed
     * @readonly
     */
    successful

    /**
     * Prepare descriptors for transaction operations
     * @param {BaseOperation[]} operations
     * @param {String} txHash
     * @param {Boolean} isEphemeral
     * @param {Boolean} successful
     * @return {OperationDescriptor[]}
     */
    static parseOperations(operations, txHash, isEphemeral, successful) {
        return operations.map((operation, i) => {
            const op = new OperationDescriptor()
            Object.assign(op, {
                txHash,
                order: i,
                operation,
                isEphemeral,
                successful
            })
            return op
        })
    }
}