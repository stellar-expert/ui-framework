import React from 'react'
import {formatWithAutoPrecision, formatWithPrecision} from '@stellar-expert/formatter'
import './soroban-tx-metrics.scss'

export default function SorobanTxMetricsView({metrics}) {
    if (!metrics)
        return null
    const parsedMetrics = parseMetrics(metrics)
    return <div className="soroban-tx-metrics-info row micro-space text-tiny text-monospace condensed">
        {Object.entries(parsedMetrics).map(([key, value]) => <div key={key} className="column column-25">
            <span className="dimmed">{key}: </span><MetricValue value={value}/>
        </div>)}
        {!!metrics.fee && <div className="column micro-space">
            <span className="dimmed">Fees: </span>
            {formatWithPrecision(metrics.fee.refundable, 0)} <span className="dimmed">refundable, </span>
            {formatWithPrecision(metrics.fee.nonrefundable, 0)} <span className="dimmed">non-refundable, </span>
            {formatWithPrecision(metrics.fee.rent, 0)} <span className="dimmed">rent</span>
        </div>}
    </div>
}

const MetricValue = React.memo(function ({value}) {
    const match = /\D+$/.exec(value)
    if (match)
        return <>{value.substring(0, match.index)}<span className="dimmed value-suffix">{value.substring(match.index)}</span></>
    return <>{value}</>
})

//TODO: add descriptions (see https://github.com/stellar/stellar-core/blob/master/docs/metrics.md)

function parseMetrics(metrics) {
    const res = {}
    for (const [key, value] of Object.entries(metrics)) {
        switch (key) {
            case 'cpu_insn':
                res['Instructions'] = formatWithPrecision(value, 0)
                break
            case  'emit_event':
                if (value > 0) {
                    res['Emitted events'] = `${value.toString()} (${formatBytes(metrics.emit_event_byte)})`
                }
                break
            case 'invoke_time_nsecs':
                res['Invoke time'] = formatWithAutoPrecision(value / 1000) + 'µs'
                break
            case 'mem_byte':
                res['Memory usage'] = formatBytes(value)
                break
            case 'read_code_byte':
                if (value > 0) {
                    res['Code read'] = formatBytes(value)
                }
                break
            case 'write_code_byte':
                if (value > 0) {
                    res['Code write'] = formatBytes(value)
                }
                break
            case 'ledger_read_byte':
                if (value > 0) {
                    res['Ledger read'] = formatBytes(value)
                }
                break
            case 'ledger_write_byte':
                if (value > 0) {
                    res['Ledger write'] = formatBytes(value)
                }
                break
            case 'read_data_byte':
                if (value > 0) {
                    res['Data read'] = formatBytes(value)
                }
                break
            case 'write_data_byte':
                if (value > 0) {
                    res['Data write'] = formatBytes(value)
                }
                break
            case 'read_key_byte':
                if (value > 0) {
                    res['Key read'] = formatBytes(value)
                }
                break
            case 'write_key_byte':
                if (value > 0) {
                    res['Key write'] = formatBytes(value)
                }
                break
            case 'read_entry':
                if (value > 0) {
                    res['Entries read'] = value.toString()
                }
                break
            case 'write_entry':
                if (value > 0) {
                    res['Entries write'] = value.toString()
                }
                break
            case 'emit_event_byte': //ignore these metrics
            case 'max_emit_event_byte':
            case 'max_rw_code_byte':
            case 'max_rw_data_byte':
            case 'max_rw_key_byte':
            case 'type': //ignore common effect props
            case 'source':
            case 'contract':
                break
            default:
                console.log('Unsupported metric: ' + key)
                break
        }
    }
    return res
}

function formatBytes(value) {
    return formatWithPrecision(value, 0) + 'B'
}