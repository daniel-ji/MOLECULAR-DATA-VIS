import React, { Component } from 'react'

import './formContainer.scss';

export class FormContainer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            formCounter: 0,
        }
    }

    incrementCounter = () => {
        this.setState({ formCounter: Math.min(this.state.formCounter + 1, this.props.children.length - 1) })
    }

    decrementCounter = () => {
        this.setState({ formCounter: Math.max(this.state.formCounter - 1, 0) })
    }

    render() {
        return (
            <div id="form-container">
                <h1 className="mt-4 mb-5">Pairwise Distance Graph Visualization</h1>
                <div id="input-form-content">
                    {this.props.children[this.state.formCounter]}
                </div>

                <div id="step-action"
                    className={`my-4 ${this.state.formCounter === 0 && 'justify-content-end'} ${this.state.formCounter === this.props.children.length - 1 && 'justify-content-start'}`}
                >
                    {this.state.formCounter > 0 && <button id="step-back" className="btn btn-primary" onClick={this.decrementCounter}>Back</button>}
                    {this.state.formCounter < this.props.children.length - 1 && <button id="step-next" className="btn btn-primary" onClick={this.incrementCounter}>Next</button>}
                </div>
            </div>
        )
    }
}

export default FormContainer