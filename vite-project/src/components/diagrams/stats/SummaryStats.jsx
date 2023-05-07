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
                            <td id="summary-node-count"></td>
                        </tr>
                        <tr>
                            <td>Singletons:</td>
                            <td id="summary-singleton-count"></td>
                        </tr>
                        <tr>
                            <td>Edge Count:</td>
                            <td id="summary-edge-count"></td>
                        </tr>
                        <tr>
                            <td>Assortativity:</td>
                            <td id="summary-assortativity"></td>
                        </tr>
                        <tr>
                            <td>Transitivity:</td>
                            <td id="summary-transitivity"></td>
                        </tr>
                        <tr>
                            <td>Triangle Count:</td>
                            <td id="summary-triangle-count"></td>
                        </tr>
                        <tr>
                            <td>Cluster Count:</td>
                            <td id="summary-cluster-count"></td>
                        </tr>
                        <tr>
                            <td>Mean Cluster Size:</td>
                            <td id="summary-cluster-mean"></td>
                        </tr>
                        <tr>
                            <td>Median Cluster Size:</td>
                            <td id="summary-cluster-median"></td>
                        </tr>
                        <tr>
                            <td>Mean Pairwise Distance:</td>
                            <td id="summary-pairwise-mean"></td>
                        </tr>
                        <tr>
                            <td>Median Pairwise Distance:</td>
                            <td id="summary-pairwise-median"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }
}

export default SummaryStats