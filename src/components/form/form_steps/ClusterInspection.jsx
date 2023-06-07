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
            sortStates: Array(this.props.data.demographicData.categories.size).fill(DEFAULT_CLUSTER_INSPECT_ICON),
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
    }

    renderClusterTableData = () => {
        if (this.props.selectedClusterIndex === undefined) {
            return;
        }

        const clusterTableData = [...this.props.data.clusterData.clusters[this.props.selectedClusterIndex].clusterNodes].map((node, index) => {
            const nodeData = this.props.data.nodesMap.get(node);
            const individualData = this.props.data.demographicData.data.get(nodeData.individualID);

            return {
                node: node,
                individualID: nodeData.individualID,
                individualData: Object.values(individualData),
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

    render() {
        return (
            <div id="inspect-clusters" className="input-step">
                <h3 className="w-100 text-center mb-5">Step 4: Inspect Specific Clusters</h3>
                <button className={`btn btn-primary mb-3`} onClick={this.selectCluster}>{this.props.selectingCluster ? 'Cancel ' : ''}Select Cluster</button>
                <button className={`btn btn-success mb-3`} disabled={!this.props.selectedClusterIndex} onClick={() => this.props.setDiagram(3)}>View Summary Stats</button>
                <button className={`btn btn-warning mb-5`} disabled={!this.props.selectedClusterIndex} onClick={this.clearSelectedCluster}>Clear Selection</button>
                <h5 className="w-100 text-center mb-3">Selected Cluster Nodes</h5>
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            {[...this.props.data.demographicData.categories.keys()].map((categoryKey, index) => {
                                return (
                                    <th key={index}
                                        className={`cluster-view-sort ${this.state.sortStates[index] !== DEFAULT_CLUSTER_INSPECT_ICON && 'cluster-view-sort-selected'}`}
                                        onClick={() => this.sortClusterBy(index)}
                                    >
                                        {categoryKey} <i className={`bi ${this.state.sortStates[index]}`} />
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.state.clusterTableData.map((entry, index) => {
                                return (
                                    <tr key={index}>
                                        <td>{entry.individualID}</td>
                                        {entry.individualData.map((value, index) => <td key={index}>{value}</td>)}
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