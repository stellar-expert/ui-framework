import React, {useEffect, useState} from 'react'
import {Button} from '../controls/button'
import {Dialog} from './dialog'

const defaultConfirmCaption = 'Confirm'
const defaultCancelCaption = 'Cancel'

const defaultAlertTitle = 'Info'
const defaultConfirmTitle = 'Confirmation'

/**
 * Replaces the built-in alert() and confirm() dialogs with prettier versions
 * @return {JSX.Element|null}
 * @constructor
 */
export const SystemDialog = React.memo(function SystemDialog() {
    const [buttons, setButtons] = useState([])
    const [content, setContent] = useState()

    useEffect(() => {
        window.alert = function (content, options = {title: defaultAlertTitle, icon: 'info'}) {
            setContent(<>
                <h2>
                    <i className={'inline-block icon-' + (options.icon || 'info')} style={{marginLeft: '-0.2em'}}/>{' '}
                    {options.title || defaultAlertTitle}
                </h2>
                <div className="space">{content}</div>
            </>)
            setButtons([null, <Button block autoFocus onClick={() => setContent(undefined)}>Ok</Button>])
        }
        window.confirm = function (content, options = {
            title: defaultConfirmTitle,
            icon: 'help',
            confirmTitle: defaultConfirmCaption,
            cancelTitle: defaultCancelCaption
        }) {
            return new Promise((resolve, reject) => {
                function setResult(result) {
                    setContent(undefined)
                    resolve(result)
                }

                setContent(<>
                    <h2>
                        <i className={'inline-block icon-' + (options.icon || 'help')} style={{marginLeft: '-0.2em'}}/>{' '}
                        {options.title || defaultConfirmTitle}</h2>
                    <div className="space">{content}</div>
                </>)
                setButtons([
                    <Button block autoFocus onClick={() => setResult(true)}>{options.confirmTitle || defaultConfirmCaption}</Button>,
                    <Button block outline onClick={() => setResult(false)}>{options.cancelTitle || defaultCancelCaption}</Button>
                ])
            })
        }
    }, [])
    if (!content)
        return null
    return <Dialog dialogOpen>
        <div style={{minHeight: '6em'}}>{content}</div>
        <hr/>
        <div className="row space">
            {buttons.map((button, index) => <div key={index} className="column column-50">{button}</div>)}
        </div>
    </Dialog>
})