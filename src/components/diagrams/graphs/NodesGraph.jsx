import React, { Component } from 'react'

import { NODE_GRAPH_CANVAS_ID } from '../../../constants';

import zoomToFitImg from '../../../assets/images/zoom-to-fit.png'
import downloadImg from '../../../assets/images/download.svg'
import exportTSVImg from '../../../assets/images/export-icon.png';

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
		a.remove();
	}

	exportTSVGraph = () => {
		if (this.props.data.links.length === 0) {
			return;
		}

		let tsvData = "SOURCE\tTARGET\tDISTANCE\n";

		for (const link of this.props.data.links) {
			tsvData += `${link.source}\t${link.target}\t${+link.value}\n`;
		}

		const a = document.createElement('a');
		a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(tsvData);
		a.download = `molecular-cluster-data-${this.props.threshold}.tsv`;
		a.click();
		a.remove();
	}

	render() {
		return (
			<div className="diagram-element" id="node-graph-container">
				<h4 className="graph-title">Molecular Cluster Graph</h4>
				<div id="node-graph-actions">
					<img src={zoomToFitImg} id="zoom-to-fit" title="Zoom to Fit" onClick={() => { this.props.nodeGraph.fitView() }} />
					<img src={exportTSVImg} id="export-tsv-node-graph" title="Export Current Data as TSV" onClick={this.exportTSVGraph} />
					<img src={downloadImg} id="download-node-graph" title="Download Graph" onClick={this.downloadGraph} />
				</div>
				<canvas id="node-graph"></canvas>
			</div>
		)
	}
}

export default NodesGraph