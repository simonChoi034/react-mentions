import React, {Children, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {defaultStyle, isNumber, iterateMentionsMarkup, mapPlainTextIndex, readConfigFromChildren} from './utils'

const _generateComponentKey = (usedKeys, id) => {
    if (!usedKeys.hasOwnProperty(id)) {
        usedKeys[id] = 0
    } else {
        usedKeys[id]++
    }
    return id + '_' + usedKeys[id]
}

function Highlighter({
                         selectionStart,
                         selectionEnd,
                         value = '',
                         onCaretPositionChange,
                         containerRef,
                         children,
                         singleLine,
                         style,
                     }) {
    const [position, setPosition] = useState({left: undefined, top: undefined})
    const [caretElement, setCaretElement] = useState()

    useEffect(() => {
        notifyCaretPosition()
    }, [caretElement])

    const notifyCaretPosition = () => {
        if (!caretElement) {
            return
        }

        const {offsetLeft, offsetTop} = caretElement

        if (position.left === offsetLeft && position.top === offsetTop) {
            return
        }

        const newPosition = {left: offsetLeft, top: offsetTop}
        setPosition(newPosition)

        onCaretPositionChange(newPosition)
    }

    const config = readConfigFromChildren(children)
    let caretPositionInMarkup

    if (selectionEnd === selectionStart) {
        caretPositionInMarkup = mapPlainTextIndex(value, config, selectionStart, 'START')
    }

    const resultComponents = []
    const componentKeys = {}
    let components = resultComponents
    let substringComponentKey = 0

    const textIteratee = (substr, index, indexInPlainText) => {
        // check whether the caret element has to be inserted inside the current plain substring
        if (isNumber(caretPositionInMarkup) && caretPositionInMarkup >= index && caretPositionInMarkup <= index + substr.length) {
            // if yes, split substr at the caret position and insert the caret component
            const splitIndex = caretPositionInMarkup - index
            components.push(renderSubstring(substr.substring(0, splitIndex), substringComponentKey))
            // add all following substrings and mention components as children of the caret component
            components = [renderSubstring(substr.substring(splitIndex), substringComponentKey),]
        } else {
            components.push(renderSubstring(substr, substringComponentKey))
        }

        substringComponentKey++
    }

    const mentionIteratee = (markup, index, indexInPlainText, id, display, mentionChildIndex, lastMentionEndIndex) => {
        const key = _generateComponentKey(componentKeys, id)
        components.push(getMentionComponentForMatch(id, display, mentionChildIndex, key))
    }

    const renderSubstring = (string, key) => {
        // set substring span to hidden, so that Emojis are not shown double in Mobile Safari
        return (<span {...style('substring')} key={key}>
        {string}
      </span>)
    }

    const getMentionComponentForMatch = (id, display, mentionChildIndex, key) => {
        const props = {id, display, key}
        const child = Children.toArray(children)[mentionChildIndex]
        return React.cloneElement(child, props)
    }

    const renderHighlighterCaret = (children) => {
        return (<span {...style('caret')} ref={setCaretElement} key="caret">
        {children}
      </span>)
    }

    iterateMentionsMarkup(value, config, mentionIteratee, textIteratee)

    // append a span containing a space, to ensure the last text line has the correct height
    components.push(' ')

    if (components !== resultComponents) {
        // if a caret component is to be rendered, add all components that followed as its children
        resultComponents.push(renderHighlighterCaret(components))
    }

    return (<div {...style} ref={containerRef}>
            {resultComponents}
        </div>)
}

Highlighter.propTypes = {
    selectionStart: PropTypes.number,
    selectionEnd: PropTypes.number,
    value: PropTypes.string.isRequired,
    onCaretPositionChange: PropTypes.func.isRequired,
    containerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({
        current: typeof Element === 'undefined' ? PropTypes.any : PropTypes.instanceOf(Element),
    }),]),
    children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element),]).isRequired,
}

const styled = defaultStyle({
    position: 'absolute',
    boxSizing: 'border-box',
    width: '100%',
    height: '100%',
    color: 'transparent',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    textAlign: 'start',
    padding: '16.5px 14px !important',

    // Styles for MUI TextField
    fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: '1.4375em',
    letterSpacing: '0.00938em',

    '&singleLine': {
        whiteSpace: 'pre', wordWrap: null,
    },

    substring: {
        visibility: 'hidden',
    },

}, (props) => ({
    '&singleLine': props.singleLine,
}))

export default styled(Highlighter)
