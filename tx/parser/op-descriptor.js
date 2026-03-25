export default class OperationDescriptor {
    /**
     * @type {BaseOperation} - Operation properties
     * @readonly
     */
    operation
    /**
     * @type {string} - Parent transaction hash
     * @readonly
     */
    txHash
    /**
     * @type {number} - Application order
     * @readonly
     */
    order
    /**
     * @type {boolean} - True for unsubmitted|unsuccessful transactions
     * @readonly
     */
    isEphemeral
    /**
     * @type {boolean} - Whether the enclosing transaction has been successfully executed
     * @readonly
     */
    successful

    /**
     * Prepare descriptors for transaction operations
     * @param {BaseOperation[]} operations
     * @param {string} txHash
     * @param {boolean} isEphemeral
     * @param {boolean} successful
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