import React, { Component } from 'react'

import DiagramsContainer from './components/diagrams/DiagramsContainer'
import ClusterGraph from './components/diagrams/graphs/ClusterGraph'
import NodesGraph from './components/diagrams/graphs/NodesGraph'
import ClusterHistogram from './components/diagrams/histograms/ClusterHistogram'
import SummaryStats from './components/diagrams/stats/SummaryStats'

import FormContainer from './components/form/FormContainer'
import UploadData from './components/form/form_steps/UploadData'
import AdjustIntervals from './components/form/form_steps/AdjustIntervals'
import CreateViews from './components/form/form_steps/CreateViews'

import './App.scss'

import { DEFAULT_DATA, LOG, NODE_GRAPH_CANVAS_ID, NODE_GRAPH_CONFIG } from './constants';
import { Graph } from '@cosmograph/cosmos'

export class App extends Component {
	constructor(props) {
		super(props)

		this.state = {
			/** GRAPH DATA */
			data: DEFAULT_DATA,
			nodesGraph: undefined,
			threshold: 0.015,
			thresholdValid: true,
		}
	}

	componentDidMount() {
		this.setState({ nodesGraph: new Graph(document.getElementById(NODE_GRAPH_CANVAS_ID), NODE_GRAPH_CONFIG) }, () => {
			this.setNodesGraph([], [])
		})
	}

	setThreshold = (threshold) => {
		this.setState({ threshold })
	}

	setThresholdValid = (thresholdValid) => {
		this.setState({ thresholdValid })
	}

	setData = (newData, callback) => {
		this.setState((prevState) => { return { data: { ...prevState.data, ...newData } } }, callback);
	}

	setDemoData = (demoData, callback) => {
		this.setState((prevState) => { return { data: { ...prevState.data, demographicData: { ...prevState.data.demographicData, ...demoData } } } }, callback);
	}

	addToNodeMapFromLink = (link, nodesMap) => {
		// source node
		const sourceIndividualID = link.source.split("|")[1];
		if (!nodesMap.has(link.source)) {
			nodesMap.set(link.source, {
				adjacentNodes: new Set([link.target]),
				individualID: sourceIndividualID,
				views: new Set()
			});
		}

		// target node
		const targetIndividualID = link.target.split("|")[1];
		if (!nodesMap.has(link.target)) {
			nodesMap.set(link.target, {
				adjacentNodes: new Set([link.source]),
				individualID: targetIndividualID,
				views: new Set()
			});
		}

		// update source and target nodes' adjacentNodes set
		nodesMap.get(link.source).adjacentNodes.add(link.target);
		nodesMap.get(link.target).adjacentNodes.add(link.source);
	}

	updateDiagrams = () => {
		console.log("\n\n\n-------- UPDATING DATA -------- \n\n\n")
		LOG("Updating data...", true)

		const links = [];
		const unfilteredLinks = new Map();
		const nodesMap = new Map();

		const allLinks = [...this.state.data.allLinks.values()];

		for (const link of allLinks) {
			if (link.value < this.state.threshold) {
				this.addToNodeMapFromLink(link, nodesMap);
				links.push(link);
				unfilteredLinks.set(link.id, link);
			}
		}

		const nodes = [...nodesMap.keys()];
		const unfilteredNodes = new Set(nodes);

		// TODO: continue reimplementation here
		LOG("Setting data...");
		this.setData({ nodes: nodes.map(node => { return { id: node } }), links }, () => {
			this.setNodesGraph();
			LOG("DONE setting data.");
		});
	}

	setNodesGraph = () => {
		this.state.nodesGraph.setData(this.state.data.nodes, this.state.data.links);
		setTimeout(() => {
			this.state.nodesGraph.fitView();
		}, 1500)
	}

	// TODO: update
	resetData = () => {
		this.setState({ data: DEFAULT_DATA })
	}

	render() {
		return (
			<>
				<DiagramsContainer>
					{/** each of the following components is a diagram **/}
					<NodesGraph 
						nodesGraph={this.state.nodesGraph}
					/>
					<ClusterGraph />
					<ClusterHistogram />
					<SummaryStats />
				</DiagramsContainer>
				<FormContainer>
					{/** each of the following components is a step in the form **/}
					<UploadData
						threshold={this.state.threshold}
						thresholdValid={this.state.thresholdValid}
						nodesGraph={this.state.nodesGraph}
						setThreshold={this.setThreshold}
						setThresholdValid={this.setThresholdValid}
						resetData={this.resetData}
						setData={this.setData}
						setDemoData={this.setDemoData}
						updateDiagrams={this.updateDiagrams}
					/>
					<AdjustIntervals />
					<CreateViews />
				</FormContainer>
			</>
		)
	}
}

export default App