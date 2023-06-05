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
                <button className={`btn btn-warning `} disabled={!this.props.selectedClusterIndex} onClick={this.clearSelectedCluster}>Clear Selection</button>
            </div>
        )
    }
}

export default ClusterInspection