import React, { Component } from 'react'

import { NODE_GRAPH_CANVAS_ID } from '../../../constants';

import zoomToFitImg from '../../../assets/images/zoom-to-fit.png'
import downloadImg from '../../../assets/images/download.svg'

export class NodesGraph extends Component {
	downloadGraph = () => {
		if (this.props.data.nodes.length === 0) {
			return;
		}

		const canvas = document.getElementById(NODE_GRAPH_CANVAS_ID);
		const canvasImage = canvas.toDataURL("image/png");
		const a = document.createElement('a');
		a.href = canvasImage;
		a.download = 'molecular-cluster-graph.png';
		a.click();
	}

	render() {
		return (
			<div className="diagram-element" id="node-graph-container">
				<h4 className="graph-title">Molecular Cluster Graph</h4>
				<img src={zoomToFitImg} id="zoom-to-fit" title="Zoom to Fit" onClick={() => { this.props.nodeGraph.fitView() }} />
				<img src={downloadImg} id="download-node-graph" title="Download Graph" onClick={this.downloadGraph} />
				<canvas id="node-graph"></canvas>
			</div>
		)
	}
}

export default NodesGraph