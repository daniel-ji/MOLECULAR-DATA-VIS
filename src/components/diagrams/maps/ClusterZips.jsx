import React, { Component } from 'react'

export class ClusterZips extends Component {
	constructor(props) {
		super(props)

		this.state = {
			// TODO: probably move to App state
			zipMap: undefined,
		}
	}

	componentDidMount() {
		this.renderZipMap();
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.data.zipCodeData.size !== this.props.data.zipCodeData.size &&
			JSON.stringify(prevProps.data.zipCodeData) !== JSON.stringify(this.props.data.zipCodeData)) {
			this.renderZipMap();
		}

		// re-render map when it becomes visible
		if (this.state.zipMap 
			&& document.getElementById('cluster-zip-map').offsetParent !== null) {
			this.state.zipMap.invalidateSize();
		}
	}

	renderZipMap = () => {
		const zipMap = L.map('cluster-zip-map').setView([51.505, -0.09], 13);
		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(zipMap);

		this.setState({ zipMap });
	}


	render() {
		return (
			<div id="cluster-zips" className="diagram-element">
				<h4 className="graph-title">Clusters Distribution By Zip Code (ZCTA)</h4>
				{
					this.props.data.zipCodeData.size === 0 && false ?
						<h5 id="no-zip-data-warning" className="mt-4 w-100 text-center text-warning">
							No detected zip code data uploaded!
						</h5>
						:
						<div id="cluster-zip-map">

						</div>
				}
			</div>
		)
	}
}

export default ClusterZips