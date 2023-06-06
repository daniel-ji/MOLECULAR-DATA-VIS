import React, { Component } from 'react'

import './diagramsContainer.scss'
import arrowLeft from '../../assets/images/arrow-left.svg'
import arrowRight from '../../assets/images/arrow-right.svg'

export class DiagramsContainer extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div id="diagrams-container" style={{width: `${this.props.diagramWidth}px`}}>
                {this.props.children.map((child, index) => {
                    return (
                    <div key={index} className={`${this.props.diagramCounter !== index && 'd-none'}`}>
                        {child}
                    </div>);
                })}
                <img src={arrowLeft} id="graph-arrow-left" title="Previous Diagram" onClick={this.props.decrementDiagramCounter} />
                <img src={arrowRight} id="graph-arrow-right" title="Next Diagram" onClick={this.props.incrementDiagramCounter} />
                <h5 id="footer-label">Diagram {this.props.diagramCounter + 1} of {this.props.children.length}</h5>
            </div>
        )
    }
}

export default DiagramsContainer