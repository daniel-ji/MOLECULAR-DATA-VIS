import React, { Component } from 'react'

import UploadData from './form_steps/UploadData'
import AdjustIntervals from './form_steps/AdjustIntervals'
import CreateViews from './form_steps/CreateViews'

import { FORM_STEPS } from '../../constants'

import './formContainer.scss';

export class FormContainer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            formCounter: 0,
            stepValid: true,
            checkStepValidFlag: false,
        }
    }

    incrementCounter = () => {
        this.checkStepValidity()
        this.setState({ formCounter: Math.min(this.state.formCounter + 1, FORM_STEPS - 1) })
        // if (this.checkStepValidity()) {
        //     this.setState({ formCounter: Math.min(this.state.formCounter + 1, FORM_STEPS - 1) })
        // }
    }

    decrementCounter = () => {
        this.checkStepValidity()
        this.setState({ formCounter: Math.max(this.state.formCounter - 1, 0) })
        // if (this.checkStepValidity()) {
        //     this.setState({ formCounter: Math.max(this.state.formCounter - 1, 0) })
        // }
    }

    checkStepValidity = () => {
        this.setState({ checkStepValidFlag: true })
    }

    setStepValid = (valid) => {
        this.setState({ stepValid: valid, checkStepValidFlag: false })
    }

    render() {
        return (
            <div id="form-container">
                <h1 className="mt-4 mb-5">Pairwise Distance Graph Visualization</h1>
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
                            setThresholdValid={this.props.setThresholdValid}
                            resetData={this.props.resetData}
                            setData={this.props.setData}
                            updateDiagrams={this.props.updateDiagrams}
                        />,
                        <AdjustIntervals
                            checkStepValidFlag={this.state.checkStepValidFlag}
                            setStepValid={this.setStepValid}
                            data={this.props.data}
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
                        />
                    ][this.state.formCounter]}
                </div>

                <div id="step-action"
                    className={`my-4 ${this.state.formCounter === 0 && 'justify-content-end'} ${this.state.formCounter === FORM_STEPS - 1 && 'justify-content-start'}`}
                >
                    {this.state.formCounter > 0 && <button id="step-back" className="btn btn-primary" onClick={this.decrementCounter}>Back</button>}
                    {this.state.formCounter < FORM_STEPS - 1 && <button id="step-next" className="btn btn-primary" onClick={this.incrementCounter}>Next</button>}
                </div>
            </div>
        )
    }
}

export default FormContainer