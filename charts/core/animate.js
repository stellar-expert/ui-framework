//Load/draw animations for the initial chart render (a per-series-type entrance).
//Only runs once, on first paint — redraws (zoom, legend toggle, resize) skip it.
import {uniqueId} from './utilities'

export const DEFAULT_DURATION = 1500

//easeOutCubic — fast start, gentle settle
function easeOut(t) {
    return 1 - Math.pow(1 - t, 3)
}

const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb => setTimeout(() => cb(now()), 16))
const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : new Date().getTime())

/**
 * Drive a 0→1 eased progress value over `duration` ms.
 * @param {number} duration
 * @param {(progress: number) => void} onStep called each frame with eased progress in [0,1]
 * @param {() => void} [onDone]
 */
export function animate(duration, onStep, onDone) {
    const start = now()
    onStep(0)
    function frame() {
        let t = (now() - start) / duration
        if (t > 1) t = 1
        onStep(easeOut(t))
        if (t < 1)
            raf(frame)
        else if (onDone)
            onDone()
    }
    raf(frame)
}

/**
 * Fill columns from the chart baseline as a single rising level. For a stacked column the whole stack
 * grows from 0: the lower segment reaches its final size first and stops, the upper one keeps rising.
 * @param {{el: import('./svg-renderer').SvgElement, topY: number, botY: number, baselineY: number, colTopY: number}[]} bars
 *   topY/botY = this segment's final top/bottom pixel; colTopY = the whole column's top pixel (stack total)
 */
export function animateColumns(bars, duration = DEFAULT_DURATION) {
    if (!bars.length)
        return
    animate(duration, k => {
        for (const b of bars) {
            //the fill level rises from the baseline up to the full column top
            const levelY = b.baselineY - (b.baselineY - b.colTopY) * k
            //clamp it into this segment's own [topY, botY] band
            const visibleTop = Math.min(b.botY, Math.max(b.topY, levelY))
            b.el.attr({y: visibleTop, height: Math.max(0, b.botY - visibleTop)})
        }
    })
}

/**
 * Reveal a series group left→right by growing a clip rectangle (used for line/area "drawing").
 * @param {import('./chart').Chart} chart
 * @param {import('./svg-renderer').SvgElement} group
 */
export function revealLeftToRight(chart, group, duration = DEFAULT_DURATION) {
    const r = chart.renderer
    const id = uniqueId('anim-clip')
    const clip = r.element('clipPath').attr('id', id)
    const rect = r.rect(chart.plotLeft, chart.plotTop - 4, 0, chart.plotHeight + 8)
    rect.add(clip)
    clip.add(r.defs)
    group.attr('clip-path', `url(#${id})`)
    animate(duration, k => rect.attr('width', chart.plotWidth * k))
}

/**
 * Draw a line path on left→right by animating its stroke dash offset (used by the navigator overview).
 * @param {import('./svg-renderer').SvgElement} pathEl
 */
export function animateLineDraw(pathEl, duration = DEFAULT_DURATION) {
    let len
    try {
        len = pathEl.element.getTotalLength()
    } catch (e) {
        return
    }
    if (!len)
        return
    pathEl.attr({'stroke-dasharray': len, 'stroke-dashoffset': len})
    animate(duration, k => pathEl.attr('stroke-dashoffset', len * (1 - k)),
        () => pathEl.attr({'stroke-dasharray': 'none', 'stroke-dashoffset': 0}))
}

/**
 * Grow a group out from a centre point (radar/polar entrance).
 */
export function animateFromCenter(group, cx, cy, duration = DEFAULT_DURATION) {
    animate(duration, k => {
        const s = Math.max(0.0001, k)
        group.attr('transform', `translate(${cx * (1 - s)} ${cy * (1 - s)}) scale(${s})`)
    }, () => group.attr('transform', ''))
}

