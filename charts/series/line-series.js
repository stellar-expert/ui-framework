import {pick} from '../core/utilities'
import {revealLeftToRight} from '../core/animate'
import {Series} from './series'

export class LineSeries extends Series {
    render(group) {
        this.group = group
        const renderer = this.chart.renderer
        const color = this.getColor()
        const lineWidth = pick(this.options.lineWidth,
            this.chart.options.plotOptions.series.lineWidth, 2)
        const d = this.linePath()
        if (d) {
            this.graph = renderer.path(d, {'stroke-width': lineWidth, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round'})
                .css({stroke: color})
                .add(group)
            if (this.chart.animateThisRender)
                revealLeftToRight(this.chart, group)
        }
    }
}
