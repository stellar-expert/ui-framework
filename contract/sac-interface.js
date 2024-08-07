export const sacInterface = {
    functions: {
        allowance: {
            inputs: {
                from: {type: 'address'},
                spender: {type: 'address'}
            },
            outputs: ['i128'],
            doc: `Returns the allowance for "spender" to transfer from "from".
# Arguments
* "from" - The address holding the balance of tokens to be drawn from.
* "spender" - The address spending the tokens held by "from".`
        },
        approve: {
            inputs: {
                from: {type: 'address'},
                spender: {type: 'address'},
                amount: {type: 'i128'},
                expiration_ledger: {type: 'u32'}
            },
            doc: `Set the allowance by "amount" for "spender" to transfer/burn from "from".
# Arguments
* "from" - The address holding the balance of tokens to be drawn from.
* "spender" - The address being authorized to spend the tokens held by "from".
* "amount" - The tokens to be made available to "spender".
* "expiration_ledger" - The ledger number where this allowance expires. Cannot be less than the current ledger number unless the amount is being set to 0. An expired entry (where expiration_ledger < the current ledger number) should be treated as a 0 amount allowance.
# Events
Emits an event with topics "["approve", from: Address, spender: Address], data = [amount: i128, expiration_ledger: u32]"`
        },
        balance: {
            inputs: {
                id: {type: 'address'}
            },
            outputs: ['i128'],
            doc: `Returns the balance of "id".
# Arguments
* "id" - The address for which a balance is being queried. If the address has no existing balance, returns 0.`
        },
        transfer: {
            inputs: {
                from: {type: 'address'},
                to: {type: 'address'},
                amount: {type: 'i128'}
            },
            doc: `Transfer "amount" from "from" to "to".
# Arguments
* "from" - The address holding the balance of tokens which will be withdrawn from.
* "to" - The address which will receive the transferred tokens.
* "amount" - The amount of tokens to be transferred.
# Events
Emits an event with topics "["transfer", from: Address, to: Address], data = [amount: i128]"`
        },
        transfer_from: {
            inputs: {
                spender: {type: 'address'},
                from: {type: 'address'},
                to: {type: 'address'},
                amount: {type: 'i128'}
            },
            doc: `Transfer "amount" from "from" to "to", consuming the allowance of "spender". Authorized by spender ("spender.require_auth()").
# Arguments
* "spender" - The address authorizing the transfer, and having its allowance consumed during the transfer.
* "from" - The address holding the balance of tokens which will be withdrawn from.
* "to" - The address which will receive the transferred tokens.
* "amount" - The amount of tokens to be transferred.
# Events
Emits an event with topics "["transfer", from: Address, to: Address], data = [amount: i128]"`
        },
        mint: {
            inputs: {
                spender: {type: 'address'},
                to: {type: 'address'},
                amount: {type: 'i128'}
            },
            doc: `Mint "amount" of tokens to "to".
# Arguments
* "spender" - The address authorizing the mint.
* "to" - The address which will receive the minted tokens.
* "amount" - The amount of tokens to be minted.
# Events
Emits an event with topics "["mint", spender: Address, from: Address], data = [amount: i128]"`
        },
        burn: {
            inputs: {
                from: {type: 'address'},
                amount: {type: 'i128'}
            },
            doc: `Burn "amount" from "from".
# Arguments
* "from" - The address holding the balance of tokens which will be burned from.
* "amount" - The amount of tokens to be burned.
# Events
Emits an event with topics "["burn", from: Address], data = [amount: i128]"`
        },
        burn_from: {
            inputs: {
                spender: {type: 'address'},
                from: {type: 'address'},
                amount: {type: 'i128'}
            },
            doc: `Burn "amount" from "from", consuming the allowance of "spender".
# Arguments
* "spender" - The address authorizing the burn, and having its allowance consumed during the burn.
* "from" - The address holding the balance of tokens which will be burned from.
* "amount" - The amount of tokens to be burned.
# Events
Emits an event with topics "["burn", from: Address], data = [amount: i128]"`
        },
        decimals: {
            inputs: {},
            outputs: ['u32'],
            doc: `Returns the number of decimals used to represent amounts of this token.
# Panics
If the contract has not yet been initialized.`
        },
        name: {
            inputs: {},
            outputs: ['String'],
            doc: `Returns the name for this token.
# Panics
If the contract has not yet been initialized.`
        },
        symbol: {
            inputs: {},
            outputs: ['String'],
            doc: `Returns the symbol for this token.
# Panics
If the contract has not yet been initialized.`
        }
    }
}