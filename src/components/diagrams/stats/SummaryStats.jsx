import React, { Component } from 'react'

export class SummaryStats extends Component {
    constructor(props) {
        super(props)

        this.state = {
			edgeCount: undefined,
            clusterLinks: undefined,
            assortativity: undefined,
            transitivity: undefined,
            meanPairwiseDistance: undefined,
            medianPairwiseDistance: undefined,
			meanNodeDegree: undefined,
			medianNodeDegree: undefined,
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // update cluster stats if the selected cluster changes
        if (JSON.stringify(prevProps.inspectionNodes) !== JSON.stringify(this.props.inspectionNodes)) {
            const data = this.props.data;
            let clusterLinks = undefined;
            let assortativity = undefined;
            let transitivity = undefined;
            let meanPairwiseDistance = undefined;
            let medianPairwiseDistance = undefined;
			let meanNodeDegree = undefined;
			let medianNodeDegree = undefined;

            // only calculate cluster stats if a cluster is selected
            if (this.props.inspectionNodes.length > 0) {
				clusterLinks = this.props.inspectionNodes.map(node => {
					const adjacentNodes = [...this.props.data.nodesMap.get(node).adjacentNodes];
					return adjacentNodes.map(adjacentNode => {
						return this.props.data.linksMap.get(node + "-" + adjacentNode) ?? this.props.data.linksMap.get(adjacentNode + "-" + node);
					});
				})
				clusterLinks = clusterLinks.flat();

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
                // transitivity = selectedCluster.triangleCount / selectedCluster.tripleCount;

                // calculate mean and median pairwise distance
                const pairiwseDistance = clusterLinks.map(link => link.value);
                pairiwseDistance.sort((a, b) => a - b);
                meanPairwiseDistance = pairiwseDistance.reduce((a, b) => a + b, 0) / pairiwseDistance.length;
                medianPairwiseDistance = pairiwseDistance[Math.floor(pairiwseDistance.length / 2)];

				// calculate mean and median node degree
				const nodeDegrees = this.props.inspectionNodes.map(node => {
					return data.nodesMap.get(node).adjacentNodes.size;
				})
				nodeDegrees.sort((a, b) => a - b);
				meanNodeDegree = nodeDegrees.reduce((a, b) => a + b, 0) / nodeDegrees.length;
				medianNodeDegree = nodeDegrees[Math.floor(nodeDegrees.length / 2)];
            }

            this.setState({ clusterLinks, assortativity, transitivity, meanPairwiseDistance, medianPairwiseDistance, meanNodeDegree, medianNodeDegree });
        }
    }

    render() {
        return (
            <div className="diagram-element" id="summary-stats">
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
                            <td id="cluster-summary-node-count">{this.props.inspectionNodes.length}</td>
                        </tr>
                        <tr>
                            <td>Singletons:</td>
                            <td id="summary-singleton-count">{this.props.data.allNodes.size - this.props.data.nodes.length}</td>
                            <td id="cluster-summary-singleton-count">N/A</td>
                        </tr>
                        <tr>
                            <td>Edge Count:</td>
                            <td id="summary-edge-count">{this.props.data.links.length}</td>
                            <td id="cluster-summary-edge-count">{this.state.clusterLinks?.length ?? 0}</td>
                        </tr>
                        <tr>
                            <td>Assortativity:</td>
                            <td id="summary-assortativity">{this.props.data.stats.assortativity?.toFixed(6)}</td>
                            <td id="cluster-summary-assortativity">{this.state.assortativity?.toFixed(6) ?? 0}</td>
                        </tr>
                        <tr>
                            <td>Transitivity:</td>
                            <td id="summary-transitivity">{this.props.data.stats.transitivity?.toFixed(6)}</td>
							{/* TODO: FIX */}
                            <td id="cluster-summary-transitivity">WIP</td>
                        </tr>
                        <tr>
                            <td>Triangle Count:</td>
                            <td id="summary-triangle-count">{this.props.data.stats.triangleCount}</td>
							{/* TODO: FIX */}
                            <td id="cluster-summary-triangle-count">WIP</td>
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
						<tr>
							<td>Mean Node Degree:</td>
							<td id="summary-mean-degree">{this.props.data.stats.meanNodeDegree?.toFixed(2)}</td>
							<td id="cluster-summary-mean-degree">{this.state.meanNodeDegree?.toFixed(2) ?? 0}</td>
						</tr>
						<tr>
							<td>Median Node Degree:</td>
							<td id="summary-median-degree">{this.props.data.stats.medianNodeDegree?.toFixed(2)}</td>
							<td id="cluster-summary-median-degree">{this.state.medianNodeDegree?.toFixed(2) ?? 0}</td>
						</tr>
                    </tbody>
                </table>
            </div>
        )
    }
}

export default SummaryStats