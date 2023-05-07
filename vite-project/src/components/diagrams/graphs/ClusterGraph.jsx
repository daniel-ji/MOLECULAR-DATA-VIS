import React, { Component } from 'react'

export class ClusterGraph extends Component {
    render() {
        return (
            <div className="graph-element" id="cluster-graph">
                <h1 className="graph-title">Cluster Size Histogram</h1>
                <div id="cluster-histogram"></div>
                <div id="cluster-histogram-controls">
                    <h5 className="mb-3">Bar Tick Intervals Count:</h5>
                    <input className="form-control w-50" type="number" id="cluster-histogram-bar-count" min="1" value="10" />
                    <div className="form-text" id="cluster-histogram-bar-hint">Default (Intervals of 1): </div>
                </div>
            </div>
        )
    }
}

export default ClusterGraph