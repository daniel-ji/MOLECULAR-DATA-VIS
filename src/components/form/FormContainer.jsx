import React, { Component } from 'react'

import UploadData from './form_steps/UploadData'
import AdjustIntervals from './form_steps/AdjustIntervals'
import CreateViews from './form_steps/CreateViews'
import ClusterInspection from './form_steps/ClusterInspection'

import { FORM_STEPS } from '../../constants'

import './formContainer.scss';

export class FormContainer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            formCounter: 0, // counter to keep track of which step of the form the user is on
            stepValid: undefined, // flag to check if step is valid, will be set to true or false by child components
            checkStepValidFlag: false, // flag to check if step is valid, will trigger componentDidUpdate in child components
            formDecrementOnValid: false, // flag to decrement formCounter when step is valid, if false, increment formCounter
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.stepValid === undefined && this.state.stepValid) {
            if (this.state.formDecrementOnValid) {
                this.setState({ formCounter: Math.max(this.state.formCounter - 1, 0), checkStepValidFlag: false, stepValid: undefined })
            } else {
                this.setState({ formCounter: Math.min(this.state.formCounter + 1, FORM_STEPS - 1), checkStepValidFlag: false, stepValid: undefined })
            }
        }
    }

    incrementDiagramCounter = () => {
        this.setState({ stepValid: undefined, formDecrementOnValid: false, checkStepValidFlag: true})
    }

    decrementDiagramCounter = () => {
        this.setState({ stepValid: undefined, formDecrementOnValid: true, checkStepValidFlag: true})
    }

    setStepValid = (valid) => {
        this.setState({ stepValid: valid, checkStepValidFlag: false })
    }

    render() {
        return (
            <div id="form-container">
                <h2 className="text-center mt-4 mb-4">Pairwise Distance Graph Visualization</h2>
                <div id="input-form-content">
                    {/** each of the following components is a step in the form **/}
                    {[
                        <UploadData
                            checkStepValidFlag={this.state.checkStepValidFlag}
                            setStepValid={this.setStepValid}
                            threshold={this.props.threshold}
                            thresholdValid={this.props.thresholdValid}
                            nodeGraph={this.props.nodeGraph}
                            setThreshold={this.props.setThreshold}
                            resetData={this.props.resetData}
                            data={this.props.data}
                            setData={this.props.setData}
                            updateDiagrams={this.props.updateDiagrams}
                        />,
                        <AdjustIntervals
                            checkStepValidFlag={this.state.checkStepValidFlag}
                            setStepValid={this.setStepValid}
                            data={this.props.data}
                            setIntervals={this.props.setIntervals}
                        />,
                        <CreateViews
                            checkStepValidFlag={this.state.checkStepValidFlag}
                            setStepValid={this.setStepValid}
                            data={this.props.data}
                            setData={this.props.setData}
                            createView={this.props.createView}
                            updateNodesFromNodeViews={this.props.updateNodesFromNodeViews}
                            updateNodesColor={this.props.updateNodesColor}
                            deleteNodeViewFromNodes={this.props.deleteNodeViewFromNodes}
                        />,
                        <ClusterInspection 
                            checkStepValidFlag={this.state.checkStepValidFlag}
                            setStepValid={this.setStepValid}
                            selectedClusterIndex={this.props.selectedClusterIndex}
                            setSelectedCluster={this.props.setSelectedCluster}
                            selectingCluster={this.props.selectingCluster}
                            setSelectingCluster={this.props.setSelectingCluster}
                            setDiagram={this.props.setDiagram}
                        />
                    ][this.state.formCounter]}
                </div>

                <div id="step-action"
                    className={`my-4 ${this.state.formCounter === 0 && 'justify-content-end'} ${this.state.formCounter === FORM_STEPS - 1 && 'justify-content-start'}`}
                >
                    {this.state.formCounter > 0 && <button id="step-back" className="btn btn-primary" onClick={this.decrementDiagramCounter}>Back</button>}
                    {this.state.formCounter < FORM_STEPS - 1 && <button id="step-next" className="btn btn-primary" onClick={this.incrementDiagramCounter}>Next</button>}
                </div>
            </div>
        )
    }
}

export default FormContainer