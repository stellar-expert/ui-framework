import React from 'react'
import {parseContractMetadata} from '@stellar-expert/contract-wasm-interface-parser'
import {shortenString} from '@stellar-expert/formatter'
import {AccountAddress} from '../account/account-address'
import {AssetLink} from '../asset/asset-link'
import {Tooltip} from '../controls/tooltip'
import {parseScValValue, primitiveTypes, ScVal, ScValStruct} from './sc-val'
import {useContractSource} from './contract-api'
import {sacInterface} from './sac-interface'

export default function InvocationInfoView({contract, func, args, result, sac}) {
    if (typeof args === 'string') {
        args = parseScValValue(args)
        if (args._arm !== 'vec') {
            args = [args]
        } else {
            args = args._value
        }
    }
    return <>
        {!!sac && <><AssetLink asset={sac}/> </>}
        <code>{func}({args.map((arg, i) => <ScValStruct key={i} separate={args.length - i}>
            <ScVal value={arg} nested/>
        </ScValStruct>)})<InvocationResult result={result}/></code>
        <Tooltip trigger={<i className="trigger icon-info"/>} desiredPlace="top" activation="click" maxWidth="Min(60em, 40vw)">
            <ExtendedInvocationInfoView {...{contract, func, args, result, sac}}/>
        </Tooltip>&nbsp;
    </>
}

const InvocationResult = React.memo(function ({result, indent}) {
    if (result === undefined)
        return null
    return <> →&nbsp;{!result ? 'void' : <ScVal value={result} nested indent={indent}/>}</>
})

const ExtendedInvocationInfoView = React.memo(function ({contract, func, args, result, sac}) {
    const source = useContractSource(sac ? undefined : contract)
    if (!source && !sac)
        return <div className="segment blank text-center">
            <div className="loader large"/>
            <div className="text-small">Loading contract...</div>
        </div>
    const meta = sac ? sacInterface : parseContractMetadata(Buffer.from(source))
    const fd = meta.functions[func]
    if (!fd)
        return <div className="error"><i className="icon-warning-circle"/> Failed to parse contract code</div>
    const shouldIndent = args.length > 2 || Object.values(fd.inputs).some(i => !primitiveTypes.has(i.type)) // multi-line display for large argument number or complex types
    const contractInfo = sac ?
        <> from asset <AssetLink asset={sac}/></> :
        <span className="text-tiny dimmed">
            &emsp;SDK v{meta.sdkVersion.split('#')[0]}&emsp;RUST v{shortenString(meta.rustVersion, 12)}
        </span>
    const contractArgNames = Object.keys(fd.inputs)
    //TODO: show contract validation info
    return <div>
        <div>
            Contract <AccountAddress account={contract}/>{contractInfo}
        </div>
        <div className="space">
            <code className="block" style={{padding: '0.4em 0.8em'}}>{func}({args.map((arg, i) =>
                <ScValStruct key={i} separate={args.length - i}>
                    {shouldIndent ? <><br/>&emsp;</> : null}
                    <span className="dimmed">{contractArgNames[i]}: </span>
                    <ScVal value={arg} nested indent={shouldIndent}/>
                </ScValStruct>)})<InvocationResult indent result={result}/></code>
        </div>
        <div className="text-small space">
            {fd.doc ?
                <>{fd.doc.split('\n').filter(v => !!v).map((v, i) => <div key={i}>{v}</div>)}</> :
                <span className="dimmed text-tiny">No function documentation is available in the contract WASM</span>}
        </div>
    </div>
})
