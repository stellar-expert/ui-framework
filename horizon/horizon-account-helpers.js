import {applyListQueryParameters, initHorizon} from './horizon-client-helpers'

/**
 * Retrieve account status from Horizon
 * @param {String} accountAddress
 * @returns {Promise<AccountResponse>}
 */
export function loadAccount(accountAddress) {
    return initHorizon()
        .loadAccount(accountAddress)
}

/**
 * Load assets issued by the account from Horizon
 * @param {String} account - Account address
 * @param {ListQueryParams} [queryParams] - Query parameters (optional)
 * @return {Promise<Array<Object>>}
 */
export function loadIssuedAssets(account, queryParams = null) {
    const query = applyListQueryParameters(initHorizon().assets().forIssuer(account).limit(200), queryParams)
    return query.call()
        .then(({records}) => {
            if (records && records.length) {
                records.sort((a, b) => a.asset_code - b.asset_code)
            }
            return records || []
        })
}

/**
 * Load offer from Horizon for the particular account
 * @param {String} account - Account address
 * @param {ListQueryParams} [queryParams] - Query parameters (optional)
 * @return {Promise<Array<Object>>}
 */
export function loadAccountOffers(account, queryParams = null) {
    const query = applyListQueryParameters(initHorizon().offers().forAccount(account), queryParams)
    return loadAllHorizonRecords(query)
        .then(r => r.records)
}


/**
 * Load pending claimable balances for a given account pubkey
 * @param {String} account - Account address
 * @return {Promise<Array<Object>>}
 */
export function loadAccountClaimableBalances(account) {
    return initHorizon().claimableBalances()
        .claimant(account)
        .limit(100)
        .call()
        .then(r => r.records)
}

/**
 * Detect account lock status based on the signers configuration
 * @param {AccountResponse} account - Account info from Horizon
 * @returns {'unlocked'|'locked'|'partially locked'}
 */
export function getAccountLockStatus(account) {
    const {high_threshold, med_threshold, low_threshold} = account.thresholds

    //calculate the sum of all signers weights
    const totalSignersWeight = account.signers.reduce((res, signer) => res + signer.weight, 0)

    if (totalSignersWeight > 0) {
        //compare it with med_threshold and high_threshold
        if (totalSignersWeight >= med_threshold || totalSignersWeight >= high_threshold) {
            return 'unlocked'
        } else if (totalSignersWeight >= low_threshold) {
            return 'partially locked'
        }
    }
    return 'locked'
}

/**
 * Retrieve balance for a given Horizon account info
 * @param {AccountResponse} account - Account Horizon info
 * @param {{code: String, issuer: String}} asset - Asset or null (for XLM)
 * @returns {{total: Number, available: Number, [asset]: {code: String, issuer: String}}}
 */
export function getAccountBalance(account, asset = null) {
    if (!account.balances) return {asset, total: 0, available: 0}
    const assetBalance = account.balances.find(b => (!asset && b.asset_type === 'native') ||
            (b.asset_issuer === asset.issuer && b.asset_code === asset.code)),
        res = {asset, total: 0, available: 0}

    if (assetBalance) {
        res.total = parseFloat(assetBalance.balance)
        res.available = res.total - parseFloat(assetBalance.selling_liabilities)
        if (!asset) { //for XLM we also need to check reserved amount
            res.available -= (parseInt(account.subentry_count) + 2) * baseReserve
        }
    } else if (asset && asset.issuer === account.address) {
        res.total = res.available = 922337203685
    }

    return res
}



