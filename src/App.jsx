import React, { Component } from 'react'

import { DateTime } from 'luxon';

import DiagramsContainer from './components/diagrams/DiagramsContainer'
import ClusterGraph from './components/diagrams/graphs/ClusterGraph'
import NodesGraph from './components/diagrams/graphs/NodesGraph'
import ClusterHistogram from './components/diagrams/histograms/ClusterHistogram'
import SummaryStats from './components/diagrams/stats/SummaryStats'
import ClusterZips from './components/diagrams/maps/ClusterZips'

import FormContainer from './components/form/FormContainer'

import './App.scss'

import { MAX_THRESHOLD, DEFAULT_DATA, LOG, NODE_GRAPH_CANVAS_ID, NODE_GRAPH_BASE_CONFIG, CALCULATE_ASSORT_PY, DIAGRAMS_COUNT, DEFAULT_DIAGRAM_WIDTH, DEFAULT_SLIDER_WIDTH, SLIDER_BOUNDS } from './constants';
import { Graph } from '@cosmograph/cosmos'

export class App extends Component {
	constructor(props) {
		super(props)

		this.state = {
			/** PAIRWISE DISTANCE DATA / STATS */
			data: DEFAULT_DATA,
			/** DIAGRAMS DATA */
			pauseGraphTimeout: undefined,
			diagramWidth: DEFAULT_DIAGRAM_WIDTH * screen.width,
			diagramCounter: 0,
			nodeGraph: undefined,
			zipMap: undefined,
			clusterHistogram: {
				histogramTicks: 0,
				maxHistogramTicks: 0,
			},
			/** PYODIDE */
			pyodide: undefined,
			CALCULATE_STATS_PYTHON_CODE: undefined,
			/** FORM DATA */
			formWidth: (1 - DEFAULT_DIAGRAM_WIDTH) * screen.width - DEFAULT_SLIDER_WIDTH,
			threshold: 0.015,
			thresholdValid: true,
			selectingCluster: false,
			selectedClusterIndex: undefined,
			selectedNodes: [],
			/** GLOBAL STATE */
			alertMessage: {
				messageType: undefined,
				messageText: undefined,
				messageDuration: undefined,
			},
			alertMessageTimeout: undefined,
			adjustingWidth: false,
		}
	}

	async componentDidMount() {
		// add event listeners to cosmograph config 
		const nodeGraphConfig = {
			...NODE_GRAPH_BASE_CONFIG,
			events: {
				// when selecting a cluster, highlight all nodes in the cluster on hover
				onNodeMouseOver: (node, index) => {
					this.highlightClusterListener(node);
				},
				// select a cluster on click 
				onClick: (node, index) => {
					this.selectClusterListener(node);
					this.selectNodeListener(node);
				}
			}
		}

		// initialize cosmograph
		this.setState({ nodeGraph: new Graph(document.getElementById(NODE_GRAPH_CANVAS_ID), nodeGraphConfig) }, this.updateNodesGraph)

		document.addEventListener("mousemove", this.adjustWidthFunction)
		window.addEventListener('blur', () => {
			this.setState({ adjustingWidth: false })
		})

		// this.setState({ pyodide: await window.loadPyodide() }, async () => {
		// 	await this.state.pyodide.loadPackage('networkx');
		// 	await this.state.pyodide.loadPackage("scipy");
		// })

		// load python code for calculating stats
		// this.setState({ CALCULATE_STATS_PYTHON_CODE: await (await fetch(CALCULATE_ASSORT_PY)).text() })
	}

	/**
	 * Set pairwise distance data. 
	 * 
	 * @param {*} newData New data to set (a property of the data object, see constants.js)
	 * @param {*} callback 
	 */
	setData = (newData, callback) => {
		this.setState((prevState) => { return { data: { ...prevState.data, ...newData } } }, callback);
	}

	/**
	 * Set cluster histogram data, corresponding to the Cluster Histogram diagram. 
	 * 
	 * @param {*} newData New data to set (a property of the clusterHistogram object, see component state object above)
	 * @param {*} callback 
	 */
	setClusterHistogramData = (newData, callback) => {
		this.setState((prevState) => { return { clusterHistogram: { ...prevState.clusterHistogram, ...newData } } }, callback);
	}

	/**
	 * Set the intervals for a given quantitative demographic data category.
	 * @param {*} key Demographic data category to modify, corresponds to name of category as uploaded in the demographic data file. 
	 * @param {*} intervals new intervals to set, a list of objects with keys "interval" and "valid"
	 */
	setIntervals = (key, intervals) => {
		const newCategories = new Map(this.state.data.demographicData.categories)
		const newCategory = JSON.parse(JSON.stringify(newCategories.get(key)))
		newCategory.intervals = intervals;
		newCategories.set(key, newCategory)

		this.setData({ demographicData: { ...this.state.data.demographicData, categories: newCategories } })
	}

	/**
	 * On node hover, highlight all nodes in the cluster that the hovered node belongs to.
	 * Part of node / cluster inspection.
	 * 
	 * @param {*} node node to highlight cluster of
	 */
	highlightClusterListener = (node) => {
		if (!this.state.selectingCluster) {
			return;
		}

		// find the cluster that the node belongs to and highlight all nodes in that cluster 
		for (const clusterObj of this.state.data.clusterData.clusters) {
			if (clusterObj.clusterNodes.has(node.id)) {
				const selectedNodes = [...clusterObj.clusterNodes.values()];
				this.state.nodeGraph.selectNodesByIds(selectedNodes);
			}
		}
	}

	/**
	 * On node click, select the cluster that the clicked node belongs to.
	 * Part of node / cluster inspection.
	 * 
	 * @param {*} node node to select cluster of
	 */
	selectClusterListener = (node) => {
		if (!this.state.selectingCluster || node === undefined) {
			return;
		}

		this.setState({ selectingCluster: false })
		// find the cluster that the node belongs to and set that cluster as the selected cluster 
		for (let i = 0; i < this.state.data.clusterData.clusters.length; i++) {
			const clusterObj = this.state.data.clusterData.clusters[i];
			if (clusterObj.clusterNodes.has(node.id)) {
				this.setSelectedCluster(i);
				break;
			}
		}
	}

	/**
	 * For specific cluster examination, set whether or not the user is currently selecting a cluster.
	 * Part of node / cluster inspection.
	 * 
	 * @param {Boolean} value whether or not the user is currently selecting a cluster  
	 */
	setSelectingCluster = (value) => {
		const diagramCounter = value ? 0 : this.state.diagramCounter;
		value && this.nodeGraphFixFitView();

		// if selecting a cluster, show the node cosmograph
		this.setState({ selectingCluster: value, diagramCounter })
	}

	/**
	 * When the user actually selects a cluster, set the selected cluster index and highlight the nodes in the cluster.
	 * Part of node / cluster inspection.
	 * 
	 * @param {Number} index index of the cluster to select
	 */
	setSelectedCluster = (index, callback) => {
		// cancel cluster selection, do not highlight any nodes
		if (index === undefined) {
			this.state.nodeGraph.unselectNodes();
		} else {
			const selectedNodes = [...this.state.data.clusterData.clusters[index].clusterNodes.values()]
			this.state.nodeGraph.selectNodesByIds(selectedNodes);
			this.state.nodeGraph.fitViewByNodeIds(selectedNodes);
			setTimeout(() => {
				this.state.nodeGraph.setZoomLevel(this.state.nodeGraph.getZoomLevel() * 2, 250)
			}, 300)
		}

		this.setState({ selectedClusterIndex: index }, callback)
	}

	selectNodeListener = (node) => {
		if (node === undefined) {
			return;
		}

		if (this.state.selectedClusterIndex === undefined) {
			return;
		}

		const clusterObj = this.state.data.clusterData.clusters[this.state.selectedClusterIndex];
		if (!clusterObj.clusterNodes.has(node.id)) {
			return;
		}

		this.toggleSelectedNode(node.id);
	}

	/**
	 * Update selectedNodes state to reflect the currently selected nodes. 
	 * Part of node / cluster inspection. 
	 * 
	 * @param {*} id 
	 */
	toggleSelectedNode = (id) => {
		const newSelectedNodes = [...this.state.selectedNodes];

		if (newSelectedNodes.includes(id)) {
			newSelectedNodes.splice(newSelectedNodes.indexOf(id), 1);
		} else {
			newSelectedNodes.push(id);
		}

		// update graph data
		// TODO: fix? talk about
		const node = this.state.data.nodes.find(node => node.id === id);
		node.selected = !node.selected;

		this.setState({ selectedNodes: newSelectedNodes })
	}

	/**
	 * For input field, set the threshold value.
	 * @param {*} threshold threshold value to update
	 * @returns whether or not the threshold is valid
	 */
	setThreshold = (threshold) => {
		const thresholdValid = threshold !== "" && threshold >= 0 && threshold <= MAX_THRESHOLD;
		this.setState({ threshold, thresholdValid })

		return thresholdValid;
	}

	setDiagram = (value) => {
		this.setState({ diagramCounter: value })
	}

	incrementDiagramCounter = () => {
		this.setDiagramCounter(Math.min(this.state.diagramCounter + 1, DIAGRAMS_COUNT - 1))
	}

	decrementDiagramCounter = () => {
		this.setDiagramCounter(Math.max(this.state.diagramCounter - 1, 0))
	}

	setDiagramCounter = (value) => {
		if (value === 0) {
			this.nodeGraphFixFitView();
		}

		this.setState({ diagramCounter: value })
	}

	nodeGraphFixFitView = () => {
		if (this.state.nodeGraph.getZoomLevel() < 0.05) {
			setTimeout(() => {
				this.state.nodeGraph.fitView();
			}, 250)
		}
	}

	setZipMap = (value) => {
		this.setState({ zipMap: value })
	}

	/** PAIRWISE DISTANCE DATA FUNCTIONS */
	updateNodesGraph = () => {
		LOG("Setting nodes graph...")
		this.state.nodeGraph.setData(this.state.data.nodes, this.state.data.links);
		setTimeout(() => {
			if (this.state.selectedClusterIndex !== undefined) {
				const selectedNodes = [...this.state.data.clusterData.clusters[this.state.selectedClusterIndex].clusterNodes.values()]
				this.state.nodeGraph.fitViewByNodeIds(selectedNodes);
			} else {
				this.state.nodeGraph.fitView()
			}
		}, 1000)
		setTimeout(() => { this.state.nodeGraph.setZoomLevel(this.state.nodeGraph.getZoomLevel() * 0.8, 250) }, 1500)
		clearTimeout(this.state.pauseGraphTimeout)
		this.setState({
			pauseGraphTimeout: setTimeout(() => { this.state.nodeGraph.pause() }, 15000)
		})
		LOG("Done setting nodes graph.")
	}

	updateDiagrams = () => {
		console.log("\n\n\n-------- UPDATING DATA -------- \n\n\n")
		LOG("Updating data...")

		const linksMap = new Map();
		const nodesMap = new Map();

		const allLinks = [...this.state.data.allLinks.values()];

		for (const link of allLinks) {
			if (link.value < this.state.threshold) {
				this.addLinkToNodesMap(link, nodesMap);
				linksMap.set(link.id, link);
			}
		}

		const nodes = [...nodesMap.values()]
		const links = [...linksMap.values()]
		links.sort((a, b) => a.value - b.value);

		LOG("Setting data...");
		this.setData({ nodes, links, linksMap, nodesMap }, () => {
			this.updateClusterData(this.updateSummaryStats);
			this.updateNodesFromNodeViews();
			LOG("Done setting data.");
		});
	}

	/**
	 * Add the source and target nodes of a link to the nodes map, if they are not already in the map.
	 */
	addLinkToNodesMap = (link, nodesMap) => {
		// source node
		if (!nodesMap.has(link.source)) {
			nodesMap.set(link.source, {
				id: link.source,
				color: "#000000",
				adjacentNodes: new Set([link.target]),
				individualID: link.source.split("|")[1] ?? link.source,
				views: new Set(),
				selected: false
			});
		}

		// target node
		if (!nodesMap.has(link.target)) {
			nodesMap.set(link.target, {
				id: link.target,
				color: "#000000",
				adjacentNodes: new Set([link.source]),
				individualID: link.target.split("|")[1] ?? link.target,
				views: new Set(),
				selected: false
			});
		}

		// update source and target nodes' adjacentNodes set
		nodesMap.get(link.source).adjacentNodes.add(link.target);
		nodesMap.get(link.target).adjacentNodes.add(link.source);
	}

	updateClusterData = (callback) => {
		LOG("Generating clusters...")
		// alias
		const nodesMap = this.state.data.nodesMap;
		// list of current nodes on graph, a list of ids (strings) 
		const nodes = new Set(this.state.data.nodesMap.keys());
		// array of clusters, each cluster is a set of ids (strings)
		const clusters = [];
		// array of cluster sizes
		const clusterSizes = [];
		// map of cluster size to number of clusters of that size
		const clusterDistribution = new Map();
		// zip code demographic data
		const zipCodeData = new Map();
		// zip code demographic data key
		const zipCodeDataKey = [...this.state.data.demographicData.categories].filter(category => category[1].type === "zip")?.[0]?.[0];

		// iterate over all nodes, perform BFS
		let nodesIterator = nodes.values();
		while (nodes.size > 0) {
			let clusterID = undefined;
			const clusterNodes = new Set();
			const clusterLinks = new Set();
			// get first node in set (id string)
			const starterNode = nodesIterator.next().value;
			clusterID = starterNode;
			clusterNodes.add(starterNode);
			nodes.delete(starterNode)
			// queue of nodes to visit, which are id strings
			// each key in nodesMap points to a node object, which has an adjacentNodes property that is a list of id strings
			const queue = [...(nodesMap.get(starterNode).adjacentNodes)];
			while (queue.length > 0) {
				const node = queue.pop();
				if (!clusterNodes.has(node)) {
					clusterNodes.add(node);
					nodes.delete(node);
					queue.push(...(nodesMap.get(node).adjacentNodes));
				}
			}

			// iterate over all nodes in cluster, get stats
			let triangleCount = 0;
			let tripleCount = 0;
			let edgeCount = 0;
			const clusterOfNodes = [...clusterNodes.values()];
			for (let i = 0; i < clusterOfNodes.length; i++) {
				const node1 = clusterOfNodes[i];
				const adjacentNodes = nodesMap.get(node1).adjacentNodes;
				const adjacentNodesArray = [...adjacentNodes];
				edgeCount += adjacentNodesArray.length;
				tripleCount += adjacentNodesArray.length * (adjacentNodesArray.length - 1) / 2;

				for (let j = 0; j < adjacentNodesArray.length; j++) {
					const node2 = adjacentNodesArray[j];
					const adjacentNodes2 = [...nodesMap.get(node2).adjacentNodes];
					const min = node1.localeCompare(node2) < 0 ? node1 : node2;
					const max = node1.localeCompare(node2) < 0 ? node2 : node1;
					clusterLinks.add(`${min}-${max}`);

					for (let k = 0; k < adjacentNodes2.length; k++) {
						if (adjacentNodes.has(adjacentNodes2[k])) {
							triangleCount++;
						}
					}
				}
			}

			tripleCount /= 3;
			triangleCount /= 6;
			edgeCount /= 2;

			// checking if zip code data exists in demographic data
			if (zipCodeDataKey) {
				// iterate over all nodes in cluster, update zip code demographic data
				for (const node of clusterNodes) {
					// first get individualID of node
					const individualID = nodesMap.get(node).individualID;
					if (individualID === undefined) {
						continue;
					}
					// then get zip code from individualID
					const zipCode = this.state.data.demographicData.data.get(individualID)?.[zipCodeDataKey];
					if (zipCode === undefined) {
						continue;
					}

					// check if zip code is already in zipCodeData
					if (!zipCodeData.has(zipCode)) {
						zipCodeData.set(zipCode, {
							individualIDs: new Set(),
							clusterIDs: new Map(),
						});
					}

					const zipCodeEntry = zipCodeData.get(zipCode);

					// update zip code data
					zipCodeEntry.individualIDs.add(individualID);
					if (!zipCodeEntry.clusterIDs.has(clusterID)) {
						zipCodeEntry.clusterIDs.set(clusterID, 0);
					}
					zipCodeEntry.clusterIDs.set(clusterID, zipCodeEntry.clusterIDs.get(clusterID) + 1);
				}
			}

			// update cluster data
			clusters.push({
				id: clusterID,
				clusterNodes,
				clusterLinks,
				size: clusterNodes.size,
				triangleCount,
				tripleCount,
				edgeCount,
			});
			clusterSizes.push(clusterNodes.size);
			clusterDistribution.set(clusterNodes.size, (clusterDistribution.get(clusterNodes.size) || 0) + 1);
		}

		// also set histogram bar count variable to largest cluster size 
		const maxHistogramTicks = Math.max(...clusterSizes);
		this.setClusterHistogramData({ histogramTicks: maxHistogramTicks, maxHistogramTicks });

		clusters.sort((a, b) => a.clusterNodes.size - b.clusterNodes.size)
		clusterSizes.sort((a, b) => a - b);
		this.setData({ clusterData: { clusters, clusterSizes, clusterDistribution }, zipCodeData }, callback)
		LOG("Done generating clusters...")
	}

	/** NODE VIEWS & COLOR FUNCTIONS */
	createViews = (viewDataArray, callback = () => { }) => {
		const nodeViews = new Map(this.state.data.nodeViews);
		for (let i = 0; i < viewDataArray.length; i++) {
			nodeViews.set(viewDataArray[i].viewID, viewDataArray[i]);
		}

		this.setData({ nodeViews }, () => this.updateNodesFromNodeViews(callback));
	}

	updateNodesFromNodeViews = (callback = () => { }) => {
		LOG("Updating node views...")
		const nodeViews = new Map(this.state.data.nodeViews);
		const nodesMap = new Map(this.state.data.nodesMap);

		const viewDataArray = [...nodeViews.keys()];
		const viewNodeCount = Array(nodeViews.size).fill(0);

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

			// initially clear all views for node
			nodesMap.get(node).views = new Set();

			// check if sequence's corresponding individual matches view
			for (let i = 0; i < viewDataArray.length; i++) {
				let add = true;
				const viewIDKey = viewDataArray[i];
				const viewData = nodeViews.get(viewIDKey);

				for (let j = 0; j < individualDemoKeys.length; j++) {
					if (viewData.values[j] === "All") {
						continue;
					}

					const categoryType = this.state.data.demographicData.categories.get(individualDemoKeys[j]).type;
					if (categoryType === 'number') {
						const range = viewData.values[j].split(" - ");
						if (!(individualDemoValues[j] >= parseFloat(range[0]) && individualDemoValues[j] <= parseFloat(range[1]))) {
							add = false;
							break;
						}
					} else if (categoryType === 'date') {
						const range = viewData.values[j].split (" to ");
						const individualDate = DateTime.fromISO(individualDemoValues[j]).toMillis();
						const startDate = DateTime.fromISO(range[0]).toMillis();
						const endDate = DateTime.fromISO(range[1]).toMillis();
						if (!(individualDate >= startDate && individualDate <= endDate)) {
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
					viewNodeCount[i]++;
				}
			}

			// set node color
			nodesMap.get(node).color = this.getNodeColor(node);
		}

		// remove unused views
		let unusedViews = "";
		for (let i = 0; i < viewNodeCount.length; i++) {
			if (viewNodeCount[i] === 0) {
				unusedViews += `\n${viewDataArray[i]}`;
			}

			nodeViews.get(viewDataArray[i]).nodeCount = viewNodeCount[i];
		}

		if (unusedViews.length > 0) {
			unusedViews = "The following views have no nodes:" + unusedViews;
			this.setAlertMessage({
				messageType: "warning",
				messageText: unusedViews,
			})
		}

		this.setData({ nodeViews, nodesMap, nodes: [...nodesMap.values()] }, () => {
			this.updateNodesGraph();
			LOG("Done updating node views.")
			callback();
		});
	}

	updateNodesColor = () => {
		const nodesMap = new Map(this.state.data.nodesMap);
		const nodeKeys = [...nodesMap.keys()];

		for (const node of nodeKeys) {
			nodesMap.get(node).color = this.getNodeColor(node);
		}

		this.setData({ nodesMap, nodes: [...nodesMap.values()] }, () => {
			this.updateNodesGraph();
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
			this.updateNodesGraph();
			LOG("Done deleting node view from nodes.")
		});
	}

	getNodeColor = (node) => {
		const view = [...this.state.data.nodesMap.get(node).views.keys()]
		if (view.length > 0) {
			return this.state.data.nodeViews.get(view[0]).color
		}
	}

	updateSummaryStats = () => {
		// alias
		const data = this.state.data;

		if (data.links.length === 0) {
			this.setData({ stats: { clusterMedian: 0, clusterMean: 0, transitivity: 0, triangleCount: 0, meanPairwiseDistance: 0, medianPairwiseDistance: 0, assortativity: 0 } })
			return;
		}

		const clusterMedian = data.clusterData.clusterSizes[Math.floor(data.clusterData.clusterSizes.length / 2)];
		const clusterMean = (data.clusterData.clusterSizes.reduce((a, b) => a + b, 0) / data.clusterData.clusterSizes.length);

		// calculate assortativity
		let sourceAverage = 0;
		let targetAverage = 0;
		for (const link of data.links) {
			sourceAverage += data.nodesMap.get(link.source).adjacentNodes.size;
			targetAverage += data.nodesMap.get(link.target).adjacentNodes.size;
		}

		sourceAverage /= data.links.length;
		targetAverage /= data.links.length;

		let assortNumerator = 0; // similar to covariance
		let sourceVariance = 0;
		let targetVariance = 0;

		for (const link of data.links) {
			assortNumerator += (data.nodesMap.get(link.source).adjacentNodes.size - sourceAverage) * (data.nodesMap.get(link.target).adjacentNodes.size - targetAverage);
			sourceVariance += Math.pow(data.nodesMap.get(link.source).adjacentNodes.size - sourceAverage, 2);
			targetVariance += Math.pow(data.nodesMap.get(link.target).adjacentNodes.size - targetAverage, 2);
		}

		const assortativity = (assortNumerator / Math.sqrt(sourceVariance * targetVariance));

		// get triple and triangle count
		let triangleCount = 0;
		let tripleCount = 0;
		for (let i = 0; i < data.clusterData.clusters.length; i++) {
			triangleCount += data.clusterData.clusters[i].triangleCount;
			tripleCount += data.clusterData.clusters[i].tripleCount;
		}

		// calculate transitivity
		const transitivity = (triangleCount / tripleCount);

		// this.state.pyodide.globals.set("G", this.state.pyodide.toPy(data.links.map(link => [link.sourceNumericID, link.targetNumericID])));
		// this.state.pyodide.runPython(this.state.CALCULATE_STATS_PYTHON_CODE);
		// const assortativity = this.state.pyodide.globals.get("assortativity");
		// const transitivity = this.state.pyodide.globals.get("transitivity");
		// const triangleCount = this.state.pyodide.globals.get("triangle_count");

		// calculate mean pairwise distance
		let sum = 0;
		for (const link of data.links) {
			sum += link.value;
		}
		const meanPairwiseDistance = (sum / data.links.length);
		// calculate median pairwise distance
		const medianPairwiseDistance = data.links[Math.floor(data.links.length / 2)].value;

		// calculate mean degree
		const degrees = [];
		let sumDegree = 0;
		for (const node of data.nodes) {
			sumDegree += node.adjacentNodes.size;
			degrees.push(node.adjacentNodes.size);
		}
		const meanNodeDegree = (sumDegree / data.nodes.length);
		// calculate median degree
		degrees.sort((a, b) => a - b);
		const medianNodeDegree = degrees[Math.floor(degrees.length / 2)];

		this.setData({ stats: { clusterMedian, clusterMean, assortativity, transitivity, triangleCount, meanPairwiseDistance, medianPairwiseDistance, meanNodeDegree, medianNodeDegree } })
	}

	resetData = () => {
		this.setState({ data: DEFAULT_DATA, selectedClusterIndex: undefined, selectingCluster: false })
	}

	/**
	 * Set notificaiton message.
	 * 
	 * @param {Object} message Must include a messageType, messageText, and messageDuration property.
	 * @param {String} message.messageType Must be one of the following: "success", "info", "warning", "danger".
	 * @param {String} message.messageText The text to display in the alert.
	 * @param {Number} message.messageDuration The duration in milliseconds to display the alert, 
	 * 		if undefined, the alert will be displayed indefinitely until clicked
	 */
	setAlertMessage = (message) => {
		clearTimeout(this.state.alertMessageTimeout);
		this.setState({
			alertMessage: message, alertMessageTimeout:
				setTimeout(() => {
					this.setState({ alertMessage: undefined });
				}, message?.messageDuration ?? 9999999)
		});
	}

	startAdjustWidth = (e) => {
		this.setState({ adjustingWidth: true })
	}

	endAdjustWidth = (e) => {
		this.setState({ adjustingWidth: false })
	}

	adjustWidthFunction = (e) => {
		if (!this.state.adjustingWidth) {
			return;
		}

		if (e.clientX < SLIDER_BOUNDS[0] * screen.width || e.clientX > SLIDER_BOUNDS[1] * screen.width) {
			return;
		}

		this.setState({
			diagramWidth: e.clientX,
			formWidth: screen.width - e.clientX - DEFAULT_SLIDER_WIDTH,
		})
	}

	render() {
		return (
			<div id="app" className={`${this.state.adjustingWidth && `disable-select`}`} onMouseUp={this.endAdjustWidth}>
				<DiagramsContainer
					diagramWidth={this.state.diagramWidth}
					nodeGraphFixFitView={this.nodeGraphFixFitView}
					diagramCounter={this.state.diagramCounter}
					incrementDiagramCounter={this.incrementDiagramCounter}
					decrementDiagramCounter={this.decrementDiagramCounter}
					setDiagramCounter={this.setDiagramCounter}
				>
					{/** each of the following components is a diagram **/}
					<NodesGraph
						nodeGraph={this.state.nodeGraph}
					/>
					<SummaryStats
						data={this.state.data}
						selectedClusterIndex={this.state.selectedClusterIndex}
					/>
					<ClusterZips
						data={this.state.data}
						diagramCounter={this.state.diagramCounter}
						zipMap={this.state.zipMap}
						setZipMap={this.setZipMap}
					/>
					<ClusterHistogram
						histogramTicks={this.state.clusterHistogram.histogramTicks}
						maxHistogramTicks={this.state.clusterHistogram.maxHistogramTicks}
						setClusterHistogramData={this.setClusterHistogramData}
						data={this.state.data}
					/>
					<ClusterGraph />
				</DiagramsContainer>
				<div
					id="width-adjust-slider"
					onMouseDown={this.startAdjustWidth}
					style={{ left: this.state.diagramWidth }}
				/>
				<FormContainer
					data={this.state.data}
					setData={this.setData}
					resetData={this.resetData}
					threshold={this.state.threshold}
					thresholdValid={this.state.thresholdValid}
					nodeGraph={this.state.nodeGraph}
					setThreshold={this.setThreshold}
					setIntervals={this.setIntervals}
					updateDiagrams={this.updateDiagrams}
					createViews={this.createViews}
					updateNodesFromNodeViews={this.updateNodesFromNodeViews}
					updateNodesColor={this.updateNodesColor}
					deleteNodeViewFromNodes={this.deleteNodeViewFromNodes}
					selectedClusterIndex={this.state.selectedClusterIndex}
					setSelectedCluster={this.setSelectedCluster}
					selectingCluster={this.state.selectingCluster}
					setSelectingCluster={this.setSelectingCluster}
					selectedNodes={this.state.selectedNodes}
					toggleSelectedNode={this.toggleSelectedNode}
					setDiagram={this.setDiagram}
					alertMessage={this.state.alertMessage}
					setAlertMessage={this.setAlertMessage}
					formWidth={this.state.formWidth}
				/>
				{this.state.alertMessage?.messageText !== undefined &&
					<div id="alert-message" className={`text-center alert alert-${this.state.alertMessage.messageType} my-3`} role="alert" onClick={() => this.setAlertMessage(undefined)}>
						<i className="bi bi-x-lg me-3"></i>
						{this.state.alertMessage.messageText}
					</div>
				}
			</div>
		)
	}
}

export default App