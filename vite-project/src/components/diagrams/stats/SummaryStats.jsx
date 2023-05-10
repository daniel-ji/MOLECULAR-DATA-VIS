import React, { Component } from 'react'

export class SummaryStats extends Component {
    render() {
        return (
            <div className="graph-element" id="summary-stats">
                <h1 className="graph-title">Cluster Summary Statistics</h1>
                <h3>Global Statistics</h3>
                <table className="table table-bordered mt-4" id="summary-table">
                    <tbody>
                        <tr>
                            <td>Node Count:</td>
                            <td id="summary-node-count">{this.props.data.nodes.length}</td>
                        </tr>
                        <tr>
                            <td>Singletons:</td>
                            <td id="summary-singleton-count">{this.props.data.allNodes.size - this.props.data.nodes.length}</td>
                        </tr>
                        <tr>
                            <td>Edge Count:</td>
                            <td id="summary-edge-count">{this.props.data.links.length}</td>
                        </tr>
                        <tr>
                            <td>Assortativity:</td>
                            <td id="summary-assortativity">{this.props.data.stats.assortativity}</td>
                        </tr>
                        <tr>
                            <td>Transitivity:</td>
                            <td id="summary-transitivity">{this.props.data.stats.transitivity}</td>
                        </tr>
                        <tr>
                            <td>Triangle Count:</td>
                            <td id="summary-triangle-count">{this.props.data.stats.triangleCount}</td>
                        </tr>
                        <tr>
                            <td>Cluster Count:</td>
                            <td id="summary-cluster-count">{this.props.data.cluster.clusterSizes.length}</td>
                        </tr>
                        <tr>
                            <td>Mean Cluster Size:</td>
                            <td id="summary-cluster-mean">{this.props.data.stats.clusterMean}</td>
                        </tr>
                        <tr>
                            <td>Median Cluster Size:</td>
                            <td id="summary-cluster-median">{this.props.data.stats.clusterMedian}</td>
                        </tr>
                        <tr>
                            <td>Mean Pairwise Distance:</td>
                            <td id="summary-pairwise-mean">{this.props.data.stats.meanPairwiseDistance}</td>
                        </tr>
                        <tr>
                            <td>Median Pairwise Distance:</td>
                            <td id="summary-pairwise-median">{this.props.data.stats.medianPairwiseDistance}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }
}

export default SummaryStats