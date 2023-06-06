import { React, Component, Fragment } from 'react'

/**
 * Component for selecting and inspecting individual clusters.
 * 
 * STEP VALID CONDITION: None
 */
export class ClusterInspection extends Component {
    constructor(props) {
        super(props)

        this.state = {
        }
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

    componentDidUpdate(prevProps, prevState) {
        if (!prevProps.checkStepValidFlag && this.props.checkStepValidFlag) {
            this.props.setStepValid(true);
        }
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
                                    <th>{categoryKey}</th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.props.selectedClusterIndex !== undefined &&
                            [...this.props.data.clusterData.clusters[this.props.selectedClusterIndex].clusterNodes].map((node, index) => {
                                const nodeData = this.props.data.nodesMap.get(node);
                                const individualData = this.props.data.demographicData.data.get(nodeData.individualID);

                                return (
                                    <tr>
                                        <td>{nodeData.individualID}</td>
                                        {Object.values(individualData).map((value, index) => {
                                            return (
                                                <td>{value}</td>
                                            )
                                        })}
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