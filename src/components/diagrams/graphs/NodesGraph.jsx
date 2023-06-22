import React, { Component } from 'react'

import zoomToFit from '../../../assets/images/zoom-to-fit.png'

export class NodesGraph extends Component {
	render() {
		return (
			<div className="diagram-element" id="node-graph-container">
				<h4 className="graph-title">Molecular Cluster Graph</h4>
				<img src={zoomToFit} id="zoom-to-fit" title="Zoom to Fit" onClick={() => {this.props.nodeGraph.fitView()}} />
				<canvas id="node-graph"></canvas>
			</div>
		)
	}
}

export default NodesGraph