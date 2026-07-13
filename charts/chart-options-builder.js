//Normalizes per-chart options before they reach the engine: applies grouping/range/legend flags and
//registers optional engine modules. Uses the engine's own merge (no deepmerge dependency).
import {merge} from './core/utilities'
import {ChartEngine} from './chart-default-options'

const rangeSelectorOptions = {
    //the in-house range selector renders span controls styled via chart.scss (.chart-zoom-btn);
    //only the button definitions are consumed by the engine
    buttons: [
        {type: 'month', count: 1, text: '1m'},
        {type: 'month', count: 3, text: '3m'},
        {type: 'month', count: 6, text: '6m'},
        {type: 'year', count: 1, text: '1y'},
        {type: 'all', text: 'All'}
    ]
}

const groupingUnits = [
    ['day', [1, 3]],
    ['week', [1, 2]],
    ['month', [1, 2, 6]]
]

const groupedPlotOptions = {
    series: {
        dataGrouping: {
            units: groupingUnits,
            groupPixelWidth: 16
        }
    }
}

const activeModules = new Set()

function extendWithModules(modules) {
    if (!modules)
        return
    for (const module of modules)
        if (!activeModules.has(module)) {
            module(ChartEngine)
            activeModules.add(module)
        }
}

export function prepareChartOptions(externalOptions, {modules, noLegend, grouped, range, inline}) {
    extendWithModules(modules)
    const extraOptions = {}
    extraOptions.legend = {enabled: !noLegend}
    //inline sparklines have no axis margins, so give both axes a little fractional padding: vertical keeps
    //the line stroke off the top/bottom edges, horizontal insets the line so it isn't flush against the
    //surrounding label/edges (deep-merged, so per-chart axis settings are preserved)
    if (inline) {
        extraOptions.xAxis = {minPadding: 0.1, maxPadding: 0.05}
        extraOptions.yAxis = {minPadding: 0.12, maxPadding: 0.12}
    }
    if (grouped) {
        extraOptions.plotOptions = groupedPlotOptions
    }
    if (range) {
        extraOptions.rangeSelector = rangeSelectorOptions
        if (typeof range === 'string') {
            const now = new Date()
            const period = new Date(now.valueOf())
            switch (range) {
                case 'year':
                    period.setUTCFullYear(period.getUTCFullYear() - 1)
                    extraOptions.xAxis = {range: now - period}
                    break
                case 'month':
                    period.setUTCMonth(period.getUTCMonth() - 1)
                    extraOptions.xAxis = {range: now - period}
                    break
                default:
                    throw new TypeError('Invalid date range for a chart: ' + range)
            }
        }
    }
    return merge(externalOptions, extraOptions)
}
