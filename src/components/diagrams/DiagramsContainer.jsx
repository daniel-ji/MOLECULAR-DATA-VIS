import React, { Component } from 'react'

import DiagramTabs from './DiagramTabs'

import './diagramsContainer.scss'

export class DiagramsContainer extends Component {
	constructor(props) {
		super(props)
	}

	render() {
		return (
			<div id="diagrams-container" style={{ width: `${this.props.diagramWidth}px` }}>
				<DiagramTabs
					diagramCounter={this.props.diagramCounter}
					setDiagramCounter={this.props.setDiagramCounter}
					diagramChildren={this.props.children}
				/>
				<div id="diagrams-content">
					{this.props.children.map((child, index) => {
						return (
							<div key={index} className={`${this.props.diagramCounter !== index && 'd-none'}`}>
								{child}
							</div>);
					})}
				</div>
			</div>
		)
	}
}

export default DiagramsContainer