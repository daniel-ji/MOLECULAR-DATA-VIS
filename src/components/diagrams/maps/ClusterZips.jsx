import React, { Component } from 'react'

// TODO: bug with zip vs zcta
// TODO: talk? measure the variety of clusters in a zip? (consider dominance of clusters as well)
// TODO: auto-coloring, auto-sizing to main zip codes
export class ClusterZips extends Component {
	componentDidUpdate(prevProps, prevState) {
		if (this.props.data.zipCodeData.size === 0 && this.props.zipMap) {
			this.props.zipMap?.remove();
			this.props.setZipMap(undefined);
		} else {
			if (prevProps.data.zipCodeData.size !== this.props.data.zipCodeData.size &&
				JSON.stringify([...prevProps.data.zipCodeData]) !== JSON.stringify([...this.props.data.zipCodeData])) {
				this.renderZipMap();
			}

			// re-render map when it becomes visible
			if (this.props.zipMap
				&& document.getElementById('cluster-zip-map')?.offsetParent !== null) {
				this.props.zipMap.invalidateSize();
			}
		}


	}

	renderZipMap = async () => {
		this.props.zipMap?.remove();

		if (this.props.data.zipCodeData.size === 0) {
			return;
		}

		const zipMap = L.map('cluster-zip-map').setView([32.878902, -117.243891], 13);
		// potential other map: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png'
		L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
			maxZoom: 20
		}).addTo(zipMap);

		zipMap.createPane('labels');
		zipMap.getPane('labels').style.zIndex = 650;
		zipMap.getPane('labels').style.pointerEvents = 'none';

		L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
			pane: 'labels',
			maxZoom: 20
		}).addTo(zipMap);

		const zipCodeData = [...this.props.data.zipCodeData];

		// TODO: don't actually hard code in numbers
		const getZipCodeColor = (zipCodeData) => {
			const individuals = zipCodeData.individualIDs.size;
			return (
				individuals > 20 ? '#08519c' :
					individuals > 15 ? '#3182bd' :
						individuals > 10 ? '#6baed6' :
							individuals > 5 ? '#9ecae1' :
								individuals > 1 ? '#c6dbef'
									: '#eff3ff'
			);
		}

		for (let i = 0; i < zipCodeData.length; i++) {
			const zipCode = zipCodeData[i][0];
			const zipCodeClusters = [...zipCodeData[i][1].clusterIDs];
			const zipCodeDominantClusters = zipCodeClusters.map(cluster => cluster[0]).join(', ');

			fetch(import.meta.env.BASE_URL + 'zipcodes/' + zipCode + '.json').then(res => res.json()).then(data => {
				const geoJSON = L.geoJSON(data, {
					style: {
						fillColor: getZipCodeColor(zipCodeData[i][1]),
						weight: 2,
						opacity: 1,
						color: 'white',
						dashArray: '3',
						fillOpacity: 0.7				
					}
				}).addTo(zipMap);
				geoJSON.eachLayer(layer => {
					layer.bindPopup('Zip Code: ' + zipCode + '<br>Total Individuals:' + zipCodeData[i][1].individualIDs.size + '<br> Clusters: ' + zipCodeDominantClusters);
				});
			}).catch(err => { });
		}

		this.props.setZipMap(zipMap);
	}


	render() {
		return (
			<div id="cluster-zips" className="diagram-element">
				<h4 className="graph-title">Clusters Distribution By Zip Code (ZCTA)</h4>
				{
					this.props.data.zipCodeData.size === 0 ?
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