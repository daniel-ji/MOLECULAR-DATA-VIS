**Molecular Cluster Graph Visualization**: A web app (in heavy development) built to generate molecular cluster visualizations and summary statistics provided a pairwise distance file of sequences and an optional demographic data file. Built by Daniel Ji as part of the TRIUMPH-SD team, under the help and guidance of Niema Moshiri, Natasha Martin, Ravi Goyal, and Gabe Barrero.

This app was built using React and has the following visualizations:
1. Molecular Cluster Graph: A graph that shows the clusters of sequences given that they have a pairwise distance less than the user-provided threshold. The graph is generated using [cosmograph](https://github.com/cosmograph-org/cosmos). 
2. Cluster Size Histogram: A histogram that shows the distribution of cluster sizes, built using [d3](https://github.com/d3/d3).
3. Clusters By Zip: A map that shows the distribution of clusters by zip code, built using [leaflet](https://github.com/Leaflet/Leaflet).
4. And more to come...

It also includes overall summary statistics for the sequences and clusters, as well as cluster-specific summary statistics.

Example data to use with this app can be found in the `example_data` folder.

Deployed at: https://daniel-ji.github.io/FAVITES-WEB-VIS/