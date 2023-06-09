import React, { Component } from 'react'

import * as d3 from 'd3';

import { LOG } from '../../../constants';

export class ClusterHistogram extends Component {
    setIntervals = (e) => {
        this.props.setClusterHistogramData({ histogramTicks: e.target.value });
    }

    componentDidUpdate(prevProps) {
        // validation
        if (isNaN(this.props.histogramTicks) || parseInt(this.props.histogramTicks) < 0) {
            return;
        }

        if (prevProps.histogramTicks !== this.props.histogramTicks) {
            LOG("Updating histogram...")
            this.generateHistogram();
            LOG("Done updating histogram...")
        }
    }

    generateHistogram = () => {
        const data = this.props.data;

        if (data.clusterData.clusterSizes.length === 0) {
            return;
        }

        // set the dimensions and margins of the graph
        const graphWidth = document.body.clientWidth * 0.65;
        const graphHeight = document.body.clientHeight;
        const margin = { top: graphHeight * 0.15, right: graphWidth * 0.1, bottom: graphHeight * 0.15, left: graphWidth * 0.15 }
        const width = document.body.clientWidth * 0.65 - margin.left - margin.right;
        const height = graphHeight - margin.top - margin.bottom;

        // remove old svg
        document.getElementById("cluster-histogram").innerHTML = "";

        // append the svg object to the body of the page
        const svg = d3.select("#cluster-histogram")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                `translate(${margin.left},${margin.top})`);

        // X axis: scale and draw:
        const x = d3.scaleLinear()
            .domain([0, Math.max(...data.clusterData.clusterSizes) * 1.05])
            .range([0, width]);
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        // X axis label:
        svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .text("Cluster size");

        // set the parameters for the histogram
        const histogram = d3.bin()
            .domain(x.domain())  // then the domain of the graphic
            .thresholds(x.ticks(this.props.histogramTicks)); // then the numbers of bins

        // And apply this function to data to get the bins
        const bins = histogram(data.clusterData.clusterSizes);

        // Y axis: scale and draw:
        const y = d3.scaleLinear()
            .range([height, 0]);
        y.domain([0, d3.max(bins, function (d) { return d.length; }) * 1.1]);
        svg.append("g")
            .call(d3.axisLeft(y));

        // Y axis label
        svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "middle")
            .attr("y", -50)
            .attr("x", -height / 2)
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text("Frequency");

        // append the bar rectangles to the svg element
        svg.selectAll("rect")
            .data(bins)
            .join("rect")
            .attr("x", 1)
            .attr("transform", function (d) { return `translate(${x(d.x0)} , ${y(d.length)})` })
            .attr("width", function (d) { return x(d.x1) - x(d.x0) < 1 ? 0 : x(d.x1) - x(d.x0) - 2 })
            .attr("height", function (d) { return height - y(d.length); })
            .style("fill", "#0D6EFD")

        svg.selectAll(".text")
            .data(bins)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("x", (function (d) { return (x(d.x1) + x(d.x0)) / 2 }))
            .attr("y", function (d) { return y(d.length) - 12; })
            .text(d => d.length > 0 ? d.length : null);
    }

    render() {
        return (
            <div className="graph-element" id="cluster-graph-container">
                <h4 className="graph-title">Cluster Size Histogram</h4>
                <div id="cluster-histogram"></div>
                <div id="cluster-histogram-controls">
                    <h5 className="mb-3">Bar Tick Intervals Count:</h5>
                    <input className="form-control w-50" type="number" id="cluster-histogram-bar-count" min="1" value={this.props.histogramTicks} onChange={this.setIntervals} />
                    <div className="form-text" id="cluster-histogram-bar-hint">Max: {this.props.maxHistogramTicks}</div>
                </div>
            </div>
        )
    }
}

export default ClusterHistogram