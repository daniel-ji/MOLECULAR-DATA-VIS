import React, { Component } from 'react'

import DiagramsContainer from './components/diagrams/DiagramsContainer'
import ClusterGraph from './components/diagrams/graphs/ClusterGraph'
import NodesGraph from './components/diagrams/graphs/NodesGraph'
import ClusterHistogram from './components/diagrams/histograms/ClusterHistogram'
import SummaryStats from './components/diagrams/stats/SummaryStats'

import FormContainer from './components/form/FormContainer'

import './App.scss'

import { DEFAULT_DATA, LOG, NODE_GRAPH_CANVAS_ID, NODE_GRAPH_CONFIG, CALCULATE_ASSORT_PY } from './constants';
import { Graph } from '@cosmograph/cosmos'

export class App extends Component {
	constructor(props) {
		super(props)

		this.state = {
			/** GRAPH DATA */
			data: DEFAULT_DATA,
			nodeGraph: undefined,
			/** UI DATA */
			clusterHistogram: {
				histogramTicks: 0,
				maxHistogramTicks: 0,
			},
			threshold: 0.015,
			thresholdValid: true,
			pyodide: undefined,
		}
	}

	async componentDidMount() {
		this.setState({ nodeGraph: new Graph(document.getElementById(NODE_GRAPH_CANVAS_ID), NODE_GRAPH_CONFIG) }, this.setNodesGraph)
		this.setState({ pyodide: await window.loadPyodide() }, async () => {
			await this.state.pyodide.loadPackage('networkx');
			await this.state.pyodide.loadPackage("scipy");
		})
	}

	setData = (newData, callback) => {
		this.setState((prevState) => { return { data: { ...prevState.data, ...newData } } }, callback);
	}

	setNodesGraph = () => {
		LOG("Setting nodes graph...")
		this.state.nodeGraph.setData(this.state.data.nodes, this.state.data.links);
		setTimeout(() => {
			this.state.nodeGraph.fitView();
		}, 750)
		LOG("Done setting nodes graph.")
	}

	setThreshold = (threshold) => {
		this.setState({ threshold })
	}

	setThresholdValid = (thresholdValid) => {
		this.setState({ thresholdValid })
	}

	setClusterHistogramData = (newData, callback) => {
		this.setState((prevState) => { return { clusterHistogram: { ...prevState.clusterHistogram, ...newData } } }, callback);
	}

	addToNodeMapFromLink = (link, nodesMap) => {
		// source node
		if (!nodesMap.has(link.source)) {
			nodesMap.set(link.source, {
				id: link.source,
				color: "#000000",
				adjacentNodes: new Set([link.target]),
				individualID: link.source.split("|")[1] ?? link.source,
				views: new Set()
			});
		}

		// target node
		if (!nodesMap.has(link.target)) {
			nodesMap.set(link.target, {
				id: link.target,
				color: "#000000",
				adjacentNodes: new Set([link.source]),
				individualID: link.target.split("|")[1] ?? link.target,
				views: new Set()
			});
		}

		// update source and target nodes' adjacentNodes set
		nodesMap.get(link.source).adjacentNodes.add(link.target);
		nodesMap.get(link.target).adjacentNodes.add(link.source);
	}

	updateDiagrams = () => {
		console.log("\n\n\n-------- UPDATING DATA -------- \n\n\n")
		LOG("Updating data...")

		const linksMap = new Map();
		const nodesMap = new Map();

		const allLinks = [...this.state.data.allLinks.values()];

		for (const link of allLinks) {
			if (link.value < this.state.threshold) {
				this.addToNodeMapFromLink(link, nodesMap);
				linksMap.set(link.id, link);
			}
		}

		const nodes = [...nodesMap.values()]
		const links = [...linksMap.values()]

		LOG("Setting data...");
		this.setData({ nodes, links, nodesMap }, () => {
			this.updateClusterData(this.updateSummaryStats);
			this.updateNodesFromNodeViews();
			LOG("Done setting data.");
		});
	}

	updateClusterData = (callback) => {
		LOG("Generating clusters...")
		// alias
		const nodesMap = this.state.data.nodesMap;
		// list of current nodes on graph, a list of ids (strings) 
		const nodes = new Set(this.state.data.nodesMap.keys());
		// array of clusters, each cluster is a set of ids (strings)
		const clusterNodes = [];
		// array of cluster sizes
		const clusterSizes = [];
		// map of cluster size to number of clusters of that size
		const clusterDistribution = new Map();

		// iterate over all nodes, perform BFS
		let nodesIterator = nodes.values();
		while (nodes.size > 0) {
			const cluster = new Set();
			// get first node in set (id string)
			const starterNode = nodesIterator.next().value;
			cluster.add(starterNode);
			nodes.delete(starterNode)
			// queue of nodes to visit, which are id strings
			// each key in nodesMap points to a node object, which has an adjacentNodes property that is a list of id strings
			const queue = [...(nodesMap.get(starterNode).adjacentNodes)];
			while (queue.length > 0) {
				const node = queue.pop();
				if (!cluster.has(node)) {
					cluster.add(node);
					nodes.delete(node);
					queue.push(...(nodesMap.get(node).adjacentNodes));
				}
			}

			// iterate over all nodes in cluster, get triangle count
			let triangleCount = 0;
			const clusterOfNodes = [...cluster.values()];
			for (let i = 0; i < clusterOfNodes.length; i++) {
				const node1 = clusterOfNodes[i];
				const adjacentNodes = nodesMap.get(node1).adjacentNodes;
				const adjacentNodesArray = [...adjacentNodes];
				for (let j = 0; j < adjacentNodesArray.length; j++) {
					const node2 = adjacentNodesArray[j];
					const adjacentNodes2 = [...nodesMap.get(node2).adjacentNodes];

					for (let k = 0; k < adjacentNodes2.length; k++) {
						if (adjacentNodes.has(adjacentNodes2[k])) {
							triangleCount++;
						}
					}
				}
			}

			// update cluster data
			clusterNodes.push({
				cluster,
				size: cluster.size,
				triangleCount: triangleCount / 6,
			});
			clusterSizes.push(cluster.size);
			clusterDistribution.set(cluster.size, (clusterDistribution.get(cluster.size) || 0) + 1);
		}

		// also set histogram bar count variable to largest cluster size 
		const maxHistogramTicks = Math.max(...clusterSizes);
		this.setClusterHistogramData({ histogramTicks: maxHistogramTicks, maxHistogramTicks });

		clusterNodes.sort((a, b) => a.cluster.size - b.cluster.size)
		clusterSizes.sort((a, b) => a - b);
		this.setData({ cluster: { clusterNodes, clusterSizes, clusterDistribution } }, callback)
		LOG("Done generating clusters...")
	}

	updateSummaryStats = () => {
		// alias
		const data = this.state.data;

		if (data.links.length === 0) {
			this.setData({ stats: { clusterMedian: 0, clusterMean: 0, transitivity: 0, triangleCount: 0, meanPairwiseDistance: 0, medianPairwiseDistance: 0, assortativity: 0 } })
			return;
		}

		const clusterMedian = data.cluster.clusterSizes[Math.floor(data.cluster.clusterSizes.length / 2)];
		const clusterMean = (data.cluster.clusterSizes.reduce((a, b) => a + b, 0) / data.cluster.clusterSizes.length).toFixed(2);

		// calculate mean pairwise distance
		let sum = 0;
		for (const link of data.links) {
			sum += link.value;
		}
		const meanPairwiseDistance = (sum / data.links.length).toFixed(6);
		// calculate median pairwise distance
		data.links.sort((a, b) => a.value - b.value);
		const medianPairwiseDistance = data.links[Math.floor(data.links.length / 2)].value.toFixed(6);

		// // get triangle count
		// let triangleCount = 0;
		// for (let i = 0; i < data.cluster.clusterNodes.length; i++) {
		// 	triangleCount += data.cluster.clusterNodes[i].triangleCount;
		// }

		// // get number of possible connected triples
		// let triples = 0;
		// for (const node of data.nodes) {
		// 	const adjacentNodeCount = node.adjacentNodes.size;
		// 	triples += adjacentNodeCount * (adjacentNodeCount - 1) / 2;
		// }
		// triples /= 3;

		// // calculate transitivity
		// const transitivity = (triangleCount / triples).toFixed(6);

		// // calculate assortativity
		// let sourceAverage = 0;
		// let targetAverage = 0;
		// for (const link of data.links) {
		// 	sourceAverage += data.nodesMap.get(link.source).adjacentNodes.size;
		// 	targetAverage += data.nodesMap.get(link.target).adjacentNodes.size;
		// }

		// sourceAverage /= data.links.length;
		// targetAverage /= data.links.length;


		// let assortNumerator = 0; // similar to covariance
		// let sourceVariance = 0;
		// let targetVariance = 0;

		// for (const link of data.links) {
		// 	assortNumerator += (data.nodesMap.get(link.source).adjacentNodes.size - sourceAverage) * (data.nodesMap.get(link.target).adjacentNodes.size - targetAverage);
		// 	sourceVariance += Math.pow(data.nodesMap.get(link.source).adjacentNodes.size - sourceAverage, 2);
		// 	targetVariance += Math.pow(data.nodesMap.get(link.target).adjacentNodes.size - targetAverage, 2);
		// }

		// const assortativity = (assortNumerator / Math.sqrt(sourceVariance * targetVariance)).toFixed(6);

		this.state.pyodide.globals.set("G", this.state.pyodide.toPy(data.links.map(link => [link.sourceNumericID, link.targetNumericID])));
		this.state.pyodide.runPython(CALCULATE_ASSORT_PY);
		const assortativity = this.state.pyodide.globals.get("assortativity");
		const transitivity = this.state.pyodide.globals.get("transitivity");
		const triangleCount = this.state.pyodide.globals.get("triangle_count");

		this.setData({ stats: { clusterMedian, clusterMean, transitivity, triangleCount, meanPairwiseDistance, medianPairwiseDistance, assortativity } })
	}

	createView = (viewID, viewData, callback) => {
		const nodeViews = new Map(this.state.data.nodeViews);
		nodeViews.set(viewID, viewData);

		this.setData({ nodeViews }, () => this.updateNodesFromNodeViews(viewID, callback));
	}

	getNodeColor = (node) => {
		const view = [...this.state.data.nodesMap.get(node).views.keys()]
		if (view.length > 0) {
			return this.state.data.nodeViews.get(view[0]).color
		}
	}

	updateNodesFromNodeViews = (viewID, callback) => {
		LOG("Updating node views...")
		const nodeViews = this.state.data.nodeViews;
		const nodesMap = new Map(this.state.data.nodesMap);

		let viewDataArray;

		if (viewID === undefined) {
			viewDataArray = [...nodeViews.keys()];
		} else {
			viewDataArray = [viewID];
		}

		const nodeKeys = [...nodesMap.keys()];

		for (const node of nodeKeys) {
			// get sequence's corresponding individual, continue if not found
			const correspondingIndividual = this.state.data.demographicData.data.get(node.split("|")[1]);
			if (correspondingIndividual === undefined) {
				continue;
			}

			// get individual's (demographic) data
			const individualDemoKeys = Object.keys(correspondingIndividual);
			const individualDemoValues = Object.values(correspondingIndividual);
			let add = true;

			// check if sequence's corresponding individual matches view
			for (const viewIDKey of viewDataArray) {
				const viewData = nodeViews.get(viewIDKey);

				for (let j = 0; j < individualDemoKeys.length; j++) {
					if (viewData.values[j] === "All") {
						continue;
					}

					if (this.state.data.demographicData.categories.get(individualDemoKeys[j]).type === 'number') {
						const range = viewData.values[j].split(" - ");
						if (!(individualDemoValues[j] >= parseFloat(range[0]) && individualDemoValues[j] <= parseFloat(range[1]))) {
							add = false;
							break;
						}
					} else {
						if (individualDemoValues[j] !== viewData.values[j]) {
							add = false;
							break;
						}
					}
				}

				if (add) {
					nodesMap.get(node).views.add(viewIDKey)
				}
			}

			// set node color
			nodesMap.get(node).color = this.getNodeColor(node);
		}

		this.setData({ nodesMap, nodes: [...nodesMap.values()] }, () => {
			this.setNodesGraph();
			LOG("Done updating node views.")
			if (callback) {
				callback();
			}
		});
	}

	updateNodesColor = () => {
		const nodesMap = new Map(this.state.data.nodesMap);
		const nodeKeys = [...nodesMap.keys()];

		for (const node of nodeKeys) {
			nodesMap.get(node).color = this.getNodeColor(node);
		}

		this.setData({ nodesMap, nodes: [...nodesMap.values()] }, () => {
			this.setNodesGraph();
		});
	}

	deleteNodeViewFromNodes = (viewID) => {
		LOG("Deleting node view from nodes...")
		const nodesMap = new Map(this.state.data.nodesMap);
		const nodeKeys = [...nodesMap.keys()];

		for (const node of nodeKeys) {
			nodesMap.get(node).views.delete(viewID);
			nodesMap.get(node).color = this.getNodeColor(node);
		}

		this.setData({ nodesMap, nodes: [...nodesMap.values()] }, () => {
			this.setNodesGraph();
			LOG("Done deleting node view from nodes.")
		});
	}

	resetData = () => {
		this.setState({ data: DEFAULT_DATA })
	}

	nodeGraphFitView = () => {
		setTimeout(() => {
			this.state.nodeGraph.fitView();
		}, 250)
	}

	render() {
		return (
			<>
				<DiagramsContainer
					nodeGraphFitView={this.nodeGraphFitView}
				>
					{/** each of the following components is a diagram **/}
					<NodesGraph
						nodeGraph={this.state.nodeGraph}
					/>
					<ClusterGraph />
					<ClusterHistogram
						histogramTicks={this.state.clusterHistogram.histogramTicks}
						maxHistogramTicks={this.state.clusterHistogram.maxHistogramTicks}
						setClusterHistogramData={this.setClusterHistogramData}
						data={this.state.data}
					/>
					<SummaryStats
						data={this.state.data}
					/>
				</DiagramsContainer>
				<FormContainer
					data={this.state.data}
					setData={this.setData}
					resetData={this.resetData}
					threshold={this.state.threshold}
					thresholdValid={this.state.thresholdValid}
					nodeGraph={this.state.nodeGraph}
					setThreshold={this.setThreshold}
					setThresholdValid={this.setThresholdValid}
					updateDiagrams={this.updateDiagrams}
					createView={this.createView}
					updateNodesFromNodeViews={this.updateNodesFromNodeViews}
					updateNodesColor={this.updateNodesColor}
					deleteNodeViewFromNodes={this.deleteNodeViewFromNodes}
				/>
			</>
		)
	}
}

export default App