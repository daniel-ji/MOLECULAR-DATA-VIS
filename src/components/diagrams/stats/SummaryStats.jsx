import React, { Component } from 'react'

// TODO: add degree?
export class SummaryStats extends Component {
    constructor(props) {
        super(props)

        this.state = {
            selectedCluster: undefined,
            clusterLinks: undefined,
            assortativity: undefined,
            transitivity: undefined,
            meanPairwiseDistance: undefined,
            medianPairwiseDistance: undefined,
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // update cluster stats if the selected cluster changes
        if (prevProps.selectedClusterIndex !== this.props.selectedClusterIndex) {
            const data = this.props.data;
            const selectedCluster = this.props.selectedClusterIndex ?
                this.props.data.clusterData.clusters[this.props.selectedClusterIndex] : undefined;
            let clusterLinks = undefined;
            let assortativity = undefined;
            let transitivity = undefined;
            let meanPairwiseDistance = undefined;
            let medianPairwiseDistance = undefined;

            // only calculate cluster stats if a cluster is selected
            if (selectedCluster !== undefined) {
                clusterLinks = [...selectedCluster.clusterLinks.values()].map((link) => {
                    return this.props.data.linksMap.get(link);
                });

                // calcluate assortativity
                let sourceAverage = 0;
                let targetAverage = 0;
                for (const link of clusterLinks) {
                    sourceAverage += data.nodesMap.get(link.source).adjacentNodes.size;
                    targetAverage += data.nodesMap.get(link.target).adjacentNodes.size;
                }

                sourceAverage /= clusterLinks.length;
                targetAverage /= clusterLinks.length;

                let assortNumerator = 0; // similar to covariance
                let sourceVariance = 0;
                let targetVariance = 0;

                for (const link of clusterLinks) {
                    assortNumerator += (data.nodesMap.get(link.source).adjacentNodes.size - sourceAverage) * (data.nodesMap.get(link.target).adjacentNodes.size - targetAverage);
                    sourceVariance += Math.pow(data.nodesMap.get(link.source).adjacentNodes.size - sourceAverage, 2);
                    targetVariance += Math.pow(data.nodesMap.get(link.target).adjacentNodes.size - targetAverage, 2);
                }

                assortativity = (assortNumerator / Math.sqrt(sourceVariance * targetVariance));

                // calculate transitivity
                transitivity = selectedCluster.triangleCount / selectedCluster.tripleCount;

                // calculate mean and median pairwise distance{
                const pairiwseDistance = clusterLinks.map(link => link.value);
                pairiwseDistance.sort((a, b) => a - b);
                meanPairwiseDistance = pairiwseDistance.reduce((a, b) => a + b, 0) / pairiwseDistance.length;
                medianPairwiseDistance = pairiwseDistance[Math.floor(pairiwseDistance.length / 2)];
            }

            this.setState({ selectedCluster, clusterLinks, assortativity, transitivity, meanPairwiseDistance, medianPairwiseDistance });
        }
    }

    render() {
        const selectedCluster = this.props.selectedClusterIndex ? this.props.data.clusterData.clusters[this.props.selectedClusterIndex] : undefined;

        return (
            <div className="graph-element" id="summary-stats">
                <h4 className="graph-title">Cluster Summary Statistics</h4>
                <table className="table table-bordered mt-4" id="summary-table">
                    <thead>
                        <tr>
                            <th>Statistic</th>
                            <th>Global Value</th>
                            <th>Selected Cluster Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Node Count:</td>
                            <td id="summary-node-count">{this.props.data.nodes.length}</td>
                            <td id="cluster-summary-node-count">{selectedCluster?.size ?? 0}</td>
                        </tr>
                        <tr>
                            <td>Singletons:</td>
                            <td id="summary-singleton-count">{this.props.data.allNodes.size - this.props.data.nodes.length}</td>
                            <td id="cluster-summary-singleton-count">N/A</td>
                        </tr>
                        <tr>
                            <td>Edge Count:</td>
                            <td id="summary-edge-count">{this.props.data.links.length}</td>
                            <td id="cluster-summary-edge-count">{selectedCluster?.edgeCount ?? 0}</td>
                        </tr>
                        <tr>
                            <td>Assortativity:</td>
                            <td id="summary-assortativity">{this.props.data.stats.assortativity?.toFixed(6)}</td>
                            <td id="cluster-summary-assortativity">{this.state.assortativity?.toFixed(6) ?? 0}</td>
                        </tr>
                        <tr>
                            <td>Transitivity:</td>
                            <td id="summary-transitivity">{this.props.data.stats.transitivity?.toFixed(6)}</td>
                            <td id="cluster-summary-transitivity">{this.state.transitivity?.toFixed(6) ?? 0}</td>
                        </tr>
                        <tr>
                            <td>Triangle Count:</td>
                            <td id="summary-triangle-count">{this.props.data.stats.triangleCount}</td>
                            <td id="cluster-summary-triangle-count">{selectedCluster?.triangleCount ?? 0}</td>
                        </tr>
                        <tr>
                            <td>Cluster Count:</td>
                            <td id="summary-cluster-count">{this.props.data.clusterData.clusterSizes.length}</td>
                            <td id="cluster-summary-cluster-count">N/A</td>
                        </tr>
                        <tr>
                            <td>Mean Cluster Size:</td>
                            <td id="summary-cluster-mean">{this.props.data.stats.clusterMean?.toFixed(2)}</td>
                            <td id="cluster-summary-cluster-mean">N/A</td>
                        </tr>
                        <tr>
                            <td>Median Cluster Size:</td>
                            <td id="summary-cluster-median">{this.props.data.stats.clusterMedian?.toFixed(2)}</td>
                            <td id="cluster-summary-cluster-median">N/A</td>
                        </tr>
                        <tr>
                            <td>Mean Pairwise Distance:</td>
                            <td id="summary-pairwise-mean">{this.props.data.stats.meanPairwiseDistance?.toFixed(6)}</td>
                            <td id="cluster-summary-pairwise-mean">{this.state.meanPairwiseDistance?.toFixed(6) ?? 0}</td>
                        </tr>
                        <tr>
                            <td>Median Pairwise Distance:</td>
                            <td id="summary-pairwise-median">{this.props.data.stats.medianPairwiseDistance?.toFixed(6)}</td>
                            <td id="cluster-summary-pairwise-median">{this.state.medianPairwiseDistance?.toFixed(6) ?? 0}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }
}

export default SummaryStats