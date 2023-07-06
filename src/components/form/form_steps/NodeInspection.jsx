import { React, Component, Fragment } from 'react'

import { DEFAULT_CLUSTER_INSPECT_ICON } from '../../../constants'

/**
 * Component for selecting and inspecting individual clusters.
 * 
 * STEP VALID CONDITION: None
 */
export class NodeInspection extends Component {
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

		if (JSON.stringify(prevProps.inspectionNodes) !== JSON.stringify(this.props.inspectionNodes)) {
			this.renderClusterTableData();
		}

		if (prevProps.selectedNode !== this.props.selectedNode) {
			this.updateHighlightedNodes();
		}
	}

	renderClusterTableData = () => {
		const clusterTableData = this.props.inspectionNodes.map((node, index) => {
			const nodeData = this.props.data.nodesMap.get(node);

			const individualData = this.props.data.demographicData.data.get(nodeData.individualID);

			return {
				node: node,
				individualID: nodeData.individualID,
				individualData: individualData === undefined ? [] : Object.values(individualData),
				highlighted: this.props.selectedNode === node,
				degree: nodeData.adjacentNodes.size,
			}
		})

		this.setState({ clusterTableData });
	}

	/**
	 * Adds selected node to the selected nodes list.
	 */
	addSelectedNode = () => {
		this.props.setInspectionSelectionState(this.props.inspectionSelectionState === 'ADD-NODE' ? undefined : 'ADD-NODE');
	}

	/**
	 * Removes selected node from the selected nodes list.
	 */
	removeSelectedNode = () => {
		this.props.setInspectionSelectionState(this.props.inspectionSelectionState === 'REMOVE-NODE' ? undefined : 'REMOVE-NODE');
	}

	/**
	 * Adds selected cluster's nodes to the selected nodes list.
	 */
	addSelectedCluster = () => {
		this.props.setInspectionSelectionState(this.props.inspectionSelectionState === 'ADD-CLUSTER' ? undefined : 'ADD-CLUSTER');
	}

	/**
	 * Removes selected cluster's nodes from the selected nodes list.
	 */
	removeSelectedCluster = () => {
		this.props.setInspectionSelectionState(this.props.inspectionSelectionState === 'REMOVE-CLUSTER' ? undefined : 'REMOVE-CLUSTER');
	}

	/**
	 * Clears the selected cluster, resetting the selectedClusterIndex to undefined. 
	 */
	confirmClearInspectionNodes = () => {
		this.props.clearInspectionNodes(undefined, this.renderClusterTableData);
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

		for (let i = 0; i < newClusterTableData.length; i++) {
			if (i === index) {
				newClusterTableData[i].highlighted = true;
			} else {
				newClusterTableData[i].highlighted = false;
			}
		}

		this.props.setSelectedNode(newClusterTableData[index].node);

		this.setState({ clusterTableData: newClusterTableData });
	}

	updateHighlightedNodes = () => {
		const newClusterTableData = [...this.state.clusterTableData];

		for (const entry of newClusterTableData) {
			if (this.props.selectedNode === entry.node) {
				entry.highlighted = true;
			} else {
				entry.highlighted = false;
			}
		}

		this.setState({ clusterTableData: newClusterTableData });
	}


	render() {
		const selectionState = this.props.inspectionSelectionState;
		const noSelectionState = selectionState === undefined;

		return (
			<div id="inspect-nodes" className="input-step">
				<h3 className="w-100 text-center mb-5">Step 4: Inspect Specific Nodes</h3>
				<div className="node-inspect-modify-selected-row">
					<button className={`btn btn-primary mb-3 ${(!noSelectionState && selectionState !== 'ADD-NODE') && 'disabled'}`} onClick={this.addSelectedNode}>{selectionState === 'ADD-NODE' ? 'Cancel ' : ''}Add Node</button>
					<button className={`btn btn-primary mb-3 ${(!noSelectionState && selectionState !== 'ADD-CLUSTER') && 'disabled'}`} onClick={this.addSelectedCluster}>{selectionState === 'ADD-CLUSTER' ? 'Cancel ' : ''}Add Cluster</button>
				</div>
				<div className="node-inspect-modify-selected-row">
					<button className={`btn btn-danger mb-3 ${(!noSelectionState && selectionState !== 'REMOVE-NODE') && 'disabled'}`} onClick={this.removeSelectedNode}>{selectionState === 'REMOVE-NODE' ? 'Cancel ' : ''}Remove Node</button>
					<button className={`btn btn-danger mb-3 ${(!noSelectionState && selectionState !== 'REMOVE-CLUSTER') && 'disabled'}`} onClick={this.removeSelectedCluster}>{selectionState === 'REMOVE-CLUSTER' ? 'Cancel ' : ''}Remove Cluster</button>
				</div>
				<button className={`btn btn-success mb-3`} disabled={this.props.inspectionNodes.length === 0} onClick={() => this.props.setDiagram(1)}>View Summary Stats</button>
				<button className={`btn btn-danger mb-5`} disabled={this.props.inspectionNodes.length === 0} onClick={this.confirmClearInspectionNodes}>Clear Selection</button>
				<h5 className="w-100 text-center mb-3">Selected Cluster Nodes ({this.state.clusterTableData.length} nodes)</h5>
				<div id="node-inspect-table-container">
					<table className="table table-bordered">
						<thead>
							<tr>
								<th
									className={`node-inspect-view-sort ${this.state.sortStates[0] !== DEFAULT_CLUSTER_INSPECT_ICON && 'node-inspect-view-sort-selected'}`}
									onClick={() => this.sortClusterBy(0)}
								>
									id <i className={`bi ${this.state.sortStates[0]}`} />
								</th>
								{[...this.props.data.demographicData.categories.keys()].map((categoryKey, index) => {
									return (
										<th key={index}
											className={`node-inspect-view-sort ${this.state.sortStates[index] !== DEFAULT_CLUSTER_INSPECT_ICON && 'node-inspect-view-sort-selected'}`}
											onClick={() => this.sortClusterBy(index)}
										>
											{categoryKey} <i className={`bi ${this.state.sortStates[index]}`} />
										</th>
									)
								})}
								<th
									className={`node-inspect-view-sort ${this.state.sortStates[this.state.sortStates.length - 1] !== DEFAULT_CLUSTER_INSPECT_ICON && 'node-inspect-view-sort-selected'}`}
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
										<tr key={index} className={`node-inspect-view-entry ${entry.highlighted && 'node-inspect-view-entry-highlighted'}`}
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
			</div>
		)
	}
}

export default NodeInspection