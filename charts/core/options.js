import {merge} from './utilities'

//Engine baseline defaults. The explorer theme (applied via setOptions in chart-default-options.js)
//deep-merges on top of this, and per-chart options on top of that.
const defaultOptions = {
    chart: {
        width: null,
        height: null,
        spacing: [10, 10, 15, 10],
        backgroundColor: null,
        style: {fontFamily: 'sans-serif'}
    },
    colors: ['#f5a04f', '#08B5E5', '#46c266', '#a25fb0', '#0ee0e0', '#a6664f'],
    title: {text: '', style: {fontSize: '17px'}},
    xAxis: {type: 'linear', gridLineWidth: 1, tickLength: 5},
    yAxis: {gridLineWidth: 1, tickLength: 0},
    tooltip: {enabled: true, shared: true, split: false},
    legend: {enabled: true, symbolWidth: 12, itemDistance: 20},
    plotOptions: {
        series: {lineWidth: 2, marker: {enabled: false, radius: 3}},
        line: {},
        spline: {},
        area: {},
        column: {pointPadding: 0.1, groupPadding: 0.1, borderWidth: 0}
    },
    series: []
}

let globalOptions = merge(defaultOptions)

export function getOptions() {
    return globalOptions
}

export function setOptions(options) {
    globalOptions = merge(globalOptions, options)
    return globalOptions
}

export {defaultOptions}
