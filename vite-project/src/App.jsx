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

export class App extends Component {
	constructor(props) {
		super(props)

		this.state = {
			/** GRAPH DATA */
			data: {
				nodes: [],
				links: [],
				clusters: {
					clusterStats: [],
					clusterDistribution: new Map(),
				},
				unfilteredClusters: {
					clusterStats: [],
					clusterDistribution: new Map(),
				},
				stats: {
					recalculate: true,
					clusterMedian: 0,
					clusterMean: 0,
					assortativity: 0,
					transitivity: 0,
					triangleCount: 0,
					meanPairwiseDistance: 0,
					medianPairwiseDistance: 0,
				}
			},

			threshold: 0.015,
			thresholdValid: true,
		}
	}

	setThreshold = (threshold) => {
		this.setState({ threshold })
	}

	setThresholdValid = (thresholdValid) => {
		this.setState({ thresholdValid })
	}

	render() {
		return (
			<>
				<DiagramsContainer>
					{/** each of the following components is a diagram **/}
					<NodesGraph />
					<ClusterGraph />
					<ClusterHistogram />
					<SummaryStats />
				</DiagramsContainer>
				<FormContainer>
					{/** each of the following components is a step in the form **/}
					<UploadData
						threshold={this.state.threshold}
						thresholdValid={this.state.thresholdValid}
						setThreshold={this.setThreshold}
						setThresholdValid={this.setThresholdValid}
					/>
					<AdjustIntervals />
					<CreateViews />
				</FormContainer>
			</>
		)
	}
}

export default App