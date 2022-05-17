import {fetchTransferServerInfo} from './transfer-server-info'
import {fetchDirectPaymentServerInfo} from './direct-payment-server-info'

/**
 * Retrieve interoperabilit info from TOML data records
 * @return {Promise<Object.<String, Object>>}
 */
export function loadTomlInteropInfo({transfer_server, transfer_server_sep0024, kyc_server, direct_payment_server}) {
    const infoQueue = [],
        interopInfo = {}
    if (transfer_server) {
        infoQueue.push(fetchTransferServerInfo(transfer_server)
            .then(data => {
                interopInfo.sep6 = data
            })
            .catch(() => null))
    }
    if (transfer_server_sep0024) {
        infoQueue.push(fetchTransferServerInfo(transfer_server_sep0024)
            .then(data => {
                interopInfo.sep24 = data
            })
            .catch(() => null))
    }
    if (direct_payment_server) {
        infoQueue.push(fetchDirectPaymentServerInfo(direct_payment_server)
            .then(data => {
                interopInfo.sep31 = data
            })
            .catch(() => null))
    }
    if (kyc_server) {
        interopInfo.kycServer = kyc_server
    }
    return Promise.all(infoQueue)
        .then(() => interopInfo)
}