import { React, Component, Fragment } from 'react'

import { DEFAULT_CLUSTER_INSPECT_ICON } from '../../../constants'

/**
 * Component for selecting and inspecting individual clusters.
 * 
 * STEP VALID CONDITION: None
 */
export class ClusterInspection extends Component {
	constructor(props) {
		super(props)

		this.state = {
			// + 1 for id, + 1 for degree, if categories.size is 0, then don't subtract 1
			sortStates: Array(1 + Math.max(this.props.data.demographicData.categories.size - 1, 0) + 1).fill(DEFAULT_CLUSTER_INSPECT_ICON),
			clusterTableData: [],
		}
	}

	componentDidMount() {
		this.renderClusterTableData();
	}

	componentDidUpdate(prevProps, prevState) {
		if (!prevProps.checkStepValidFlag && this.props.checkStepValidFlag) {
			this.props.setStepValid(true);
		}

		if (prevProps.selectedClusterIndex !== this.props.selectedClusterIndex && this.props.selectedClusterIndex !== undefined) {
			this.renderClusterTableData();
		}

		if (JSON.stringify(prevProps.selectedNodes) !== JSON.stringify(this.props.selectedNodes)) {
			this.updateHighlightedNodes();
		}
	}

	renderClusterTableData = () => {
		if (this.props.selectedClusterIndex === undefined) {
			return;
		}

		const clusterTableData = [...this.props.data.clusterData.clusters[this.props.selectedClusterIndex].clusterNodes].map((node, index) => {
			const nodeData = this.props.data.nodesMap.get(node);

			const individualData = this.props.data.demographicData.data.get(nodeData.individualID);

			console.log(individualData);

			return {
				node: node,
				individualID: nodeData.individualID,
				individualData: individualData === undefined ? [] : Object.values(individualData),
				highlighted: this.props.selectedNodes.includes(node),
				degree: nodeData.adjacentNodes.size,
			}
		})

		this.setState({ clusterTableData });
	}

	/**
	 * Toggles the selectingCluster flag, selects a cluster if the flag is true
	 */
	selectCluster = () => {
		if (this.props.selectingCluster) {
			this.props.setSelectedCluster(this.props.selectedClusterIndex);
		}

		this.props.setSelectingCluster(!this.props.selectingCluster);
	}

	/**
	 * Clears the selected cluster, resetting the selectedClusterIndex to undefined. 
	 */
	clearSelectedCluster = () => {
		this.props.setSelectedCluster(undefined);
	}

	sortClusterBy = (index) => {
		const icon = this.state.sortStates[index];
		const newSortStates = Array(this.state.sortStates.length).fill(DEFAULT_CLUSTER_INSPECT_ICON);
		if (icon === 'bi-arrow-down-up') {
			newSortStates[index] = 'bi-arrow-up';
		} else if (icon === 'bi-arrow-up') {
			newSortStates[index] = 'bi-arrow-down';
		} else {
			newSortStates[index] = 'bi-arrow-down-up';
		}

		const newClusterTableData = [...this.state.clusterTableData];
		newClusterTableData.sort((a, b) => {
			if (icon === 'bi-arrow-down-up') {
				let temp = a;
				a = b;
				b = temp;
			}

			if (index === 0) {
				return parseFloat(a.individualID) - parseFloat(b.individualID);
			} else if (index === this.state.sortStates.length - 1) {
				return parseFloat(a.degree) - parseFloat(b.degree);
			} else {
				if (isNaN(a.individualData[index - 1])) {
					return a.individualData[index - 1].localeCompare(b.individualData[index - 1]);
				} else {
					return parseFloat(a.individualData[index - 1]) - parseFloat(b.individualData[index - 1]);
				}
			}
		});

		this.setState({ sortStates: newSortStates, clusterTableData: newClusterTableData });
	}

	highlightClusterEntry = (index) => {
		const newClusterTableData = [...this.state.clusterTableData];

		newClusterTableData[index].highlighted = !newClusterTableData[index].highlighted;

		this.props.toggleSelectedNode(newClusterTableData[index].node);

		this.setState({ clusterTableData: newClusterTableData });
	}

	updateHighlightedNodes = () => {
		const newClusterTableData = [...this.state.clusterTableData];

		for (const entry of newClusterTableData) {
			if (this.props.selectedNodes.includes(entry.node)) {
				entry.highlighted = true;
			} else {
				entry.highlighted = false;
			}
		}

		this.setState({ clusterTableData: newClusterTableData });
	}


	render() {
		return (
			<div id="inspect-clusters" className="input-step">
				<h3 className="w-100 text-center mb-5">Step 4: Inspect Specific Clusters</h3>
				<button className={`btn btn-primary mb-3`} onClick={this.selectCluster}>{this.props.selectingCluster ? 'Cancel ' : ''}Select Cluster</button>
				<button className={`btn btn-success mb-3`} disabled={!this.props.selectedClusterIndex} onClick={() => this.props.setDiagram(3)}>View Summary Stats</button>
				<button className={`btn btn-warning mb-5`} disabled={!this.props.selectedClusterIndex} onClick={this.clearSelectedCluster}>Clear Selection</button>
				<h5 className="w-100 text-center mb-3">Selected Cluster Nodes ({this.state.clusterTableData.length} nodes)</h5>
				<table className="table table-bordered">
					<thead>
						<tr>
							<th
								className={`cluster-view-sort ${this.state.sortStates[0] !== DEFAULT_CLUSTER_INSPECT_ICON && 'cluster-view-sort-selected'}`}
								onClick={() => this.sortClusterBy(0)}
							>
								id <i className={`bi ${this.state.sortStates[0]}`} />
							</th>
							{[...this.props.data.demographicData.categories.keys()].map((categoryKey, index) => {
								// dont render id column for tr, already rendered
								if (index === 0) {
									return;
								}
								return (
									<th key={index}
										className={`cluster-view-sort ${this.state.sortStates[index] !== DEFAULT_CLUSTER_INSPECT_ICON && 'cluster-view-sort-selected'}`}
										onClick={() => this.sortClusterBy(index)}
									>
										{categoryKey} <i className={`bi ${this.state.sortStates[index]}`} />
									</th>
								)
							})}
							<th
								className={`cluster-view-sort ${this.state.sortStates[this.state.sortStates.length - 1] !== DEFAULT_CLUSTER_INSPECT_ICON && 'cluster-view-sort-selected'}`}
								onClick={() => this.sortClusterBy(this.state.sortStates.length - 1)}
							>
								node degree <i className={`bi ${this.state.sortStates[this.state.sortStates.length - 1]}`} />
							</th>
						</tr>
					</thead>
					<tbody>
						{
							this.state.clusterTableData.map((entry, index) => {
								return (
									<tr key={index} className={`cluster-view-entry ${entry.highlighted && 'cluster-view-entry-highlighted'}`}
										onClick={() => this.highlightClusterEntry(index)}>
										<td>{entry.individualID}</td>
										{entry.individualData.map((value, index) => <td key={index}>{value}</td>)}
										<td>{entry.degree}</td>
									</tr>
								)
							})
						}
					</tbody>
				</table>
			</div>
		)
	}
}

export default ClusterInspection