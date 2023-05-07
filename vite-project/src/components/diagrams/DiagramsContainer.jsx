import React, { Component } from 'react'

import './diagramsContainer.scss'
import arrowLeft from '../../assets/images/arrow-left.svg'
import arrowRight from '../../assets/images/arrow-right.svg'

export class DiagramsContainer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            diagramCounter: 0,
        }
    }

    incrementCounter = () => {
        this.setState({ diagramCounter: Math.min(this.state.diagramCounter + 1, this.props.children.length - 1) })
    }

    decrementCounter = () => {
        this.setState({ diagramCounter: Math.max(this.state.diagramCounter - 1, 0) })
    }

    render() {
        return (
            <div id="diagrams-container">
                {this.props.children[this.state.diagramCounter]}
                <img src={arrowLeft} id="graph-arrow-left" title="Previous Diagram" onClick={this.decrementCounter} />
                <img src={arrowRight} id="graph-arrow-right" title="Next Diagram" onClick={this.incrementCounter} />
                <h5 id="footer-label">Diagram {this.state.diagramCounter + 1} of {this.props.children.length}</h5>
            </div>
        )
    }
}

export default DiagramsContainer