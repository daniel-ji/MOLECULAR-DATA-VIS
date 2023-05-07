import React, { Component } from 'react'

export class ClusterHistogram extends Component {
    render() {
        return (
            <div className="graph-element" id="cluster-histogram">
                <h1 className="graph-title">Cluster Size Distribution</h1>
                <div id="cluster-pi-graph"></div>
            </div>
        )
    }
}

export default ClusterHistogram