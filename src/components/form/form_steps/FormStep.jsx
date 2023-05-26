import React, { Component } from 'react'

export class FormStep extends Component {
    componentDidUpdate(prevProps, prevState) {
        if (this.props.checkStepValidFlag) {
            console.log(this.checkStepValidity)
            this.props.setStepValid(this.checkStepValidity())
        }
    }

    checkStepValidity = () => {
        console.log('hit')
        return true;
    }
}

export default FormStep