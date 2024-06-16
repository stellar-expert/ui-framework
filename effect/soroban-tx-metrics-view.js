import {formatWithPrecision} from '@stellar-expert/formatter'

export default function SorobanTxMetricsView({metrics}) {
    if (!metrics)
        return null
    return <div className="text-tiny row micro-space text-monospace">
        {Object.entries(parseMetrics(metrics)).map(([key, value])=><div key={key} className="column column-33">
            <span className="dimmed">{key}: </span>{value}
        </div>)}
    </div>
}

function parseMetrics(metrics) {
    const res = {}
    for (const [key, value] of Object.entries(metrics)) {
        switch (key) {
            case 'cpu_insn':
                res['CPU instructions'] = formatWithPrecision(value, 0)
                break
            case  'emit_event':
                if (value > 0) {
                    res['Emitted events'] = value.toString()
                }
                break
            case 'emit_event_byte':
                if (value > 0) {
                    res['Emitted events'] += ' ' + formatBytes(value)
                }
                break
            case 'invoke_time_nsecs':
                res['Invoke time'] = formatWithPrecision(value / 1000, 3) + 'µs'
                break
            case 'mem_byte':
                res['Memory utilization'] = formatBytes(value)
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
                    res['Entries read'] = value
                }
                break
            case 'write_entry':
                if (value > 0) {
                    res['Entries write'] = value
                }
                break
            case 'max_emit_event_byte':
            case 'max_rw_code_byte':
            case 'max_rw_data_byte':
            case 'max_rw_key_byte': //ignore these metrics
                break
            case 'type':
            case 'source':
            case 'contract': //ignore other effect params
                break
            default:
                console.log('Unsupported metric: ' + key)
                break
        }
    }
    return res
}

function formatBytes(value) {
    return formatWithPrecision(value, 3) + 'B'
}