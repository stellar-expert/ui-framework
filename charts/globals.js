//The engine namespace exposed to consumers and to the theme/options-builder — the small public
//surface (chart constructors, options, Color, Axis, merge) that views and modules touch.
import {Chart} from './core/chart'
import {getOptions, setOptions} from './core/options'
import {Color} from './core/color'
import {Axis} from './axis/axis'
import {merge} from './core/utilities'

function ChartCtor(renderTo, options) {
    return new Chart(renderTo, options, 'Chart')
}

function StockChartCtor(renderTo, options) {
    return new Chart(renderTo, options, 'StockChart')
}

const ChartEngine = {
    Chart: ChartCtor,
    StockChart: StockChartCtor,
    chart: (renderTo, options) => new Chart(renderTo, options, 'Chart'),
    stockChart: (renderTo, options) => new Chart(renderTo, options, 'StockChart'),
    setOptions,
    getOptions,
    Color: input => new Color(input),
    Axis,
    merge,
    //module-extension hook — a module is a `module(engine)` function that augments this namespace
    win: typeof window !== 'undefined' ? window : undefined
}

export {ChartEngine}
export default ChartEngine
