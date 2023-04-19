import { Graph } from '@cosmograph/cosmos'
import * as d3 from "d3";
import './styles/index.scss'

// ----------- GLOBAL VARIABLES ------------
// size of chunks to read from uploaded file
const CHUNK_SIZE = 1024 * 1024 * 10;
// Maximum threshold for pairwise distances to be added to map
const MAX_THRESHOLD = 0.05;
// threshold for pairwise distances to be added to map
let threshold = 0.015;
// set of all sequences (nodes)
let sequences = new Set();
// array of all pairwise distances (links)
const pairwiseDistances = [];

// ----------- INITIALIZATION ------------
const PAIRWISE_GRAPH_CANVAS = document.getElementById('pairwise-graph');
const PAIRWISE_GRAPH_CONFIG = {
    backgroundColor: "#ffffff",
    nodeColor: "#000000",
    nodeSize: 6,
    linkColor: "#a3a3a3",
    linkArrows: false,
    linkWidth: 0.2,
    linkVisibilityMinTransparency: 1,
    randomSeed: 0,
    events: {
        onClick: () => {
            autoZoom = false;
        },
        onZoomStart: (event, userDriven) => {
            if (userDriven) {
                autoZoom = false;
            }
        }
    },
    simulation: {
        repulsion: 2,
        repulsionFromMouse: 0,
        linkDistRandomVariationRange: [1, 1],
        scaleNodesOnZoom: true,
        friction: 1,
        linkDistance: 50,
        gravity: 0.2,
        decay: 10000,
        linkSpring: 0.1,
    }
}

const data = {
    nodes: [],
    links: [],
}

const PAIRWISE_GRAPH = new Graph(PAIRWISE_GRAPH_CANVAS, PAIRWISE_GRAPH_CONFIG);
PAIRWISE_GRAPH_CANVAS.style.display = "none";

document.getElementById("upload-success").style.display = "none";
document.getElementById("threshold-label").innerHTML = "Threshold Level: " + threshold.toFixed(4) + " (Use slider to adjust)";

// ----------- TOGGLE GRAPH ------------
let graphCounter = 0;
const graphElements = document.getElementsByClassName("graph-element");

document.getElementById('graph-element-0').classList.remove('d-none')

document.getElementById("arrow-left").addEventListener("click", () => {
    // change graph
    graphCounter = (graphCounter - 1) % graphElements.length;
    if (graphCounter < 0) {
        graphCounter = graphElements.length - 1;
    }
    for (let i = 0; i < graphElements.length; i++) {
        graphElements[i].classList.add('d-none')
    }
    graphElements[graphCounter].classList.remove('d-none')

    updateFooterLabel();
})

document.getElementById("arrow-right").addEventListener("click", () => {
    // change graph
    graphCounter = (graphCounter + 1) % graphElements.length;
    for (let i = 0; i < graphElements.length; i++) {
        graphElements[i].classList.add('d-none')
    }
    graphElements[graphCounter].classList.remove('d-none')

    updateFooterLabel();
})

const updateFooterLabel = () => {
    document.getElementById('footer-label').innerHTML = 'Figure ' + (graphCounter + 1) + ' of ' + graphElements.length;
}
updateFooterLabel();

// ----------- PAIRWISE DISTANCE MAP GENERATION ------------
document.getElementById("upload-file").addEventListener("click", () => {
    document.getElementById("upload-file").value = "";
})

document.getElementById("upload-file").addEventListener("change", () => {
    document.getElementById("read-file").style.display = "block";
    document.getElementById("upload-success").innerHTML = "";
})

document.getElementById("read-file").addEventListener("click", async () => {
    if (!document.getElementById("upload-file").files[0]) {
        alert("Please select a file");
        return;
    }

    document.getElementById("read-file").style.display = "none";
    document.getElementById("upload-success").style.display = "block";
    document.getElementById("upload-success").innerHTML = "Loading...";


    await getPairwiseDistances();

    updateGraphThreshold();
    PAIRWISE_GRAPH_CANVAS.style.display = "block";

    document.getElementById("upload-success").style.display = "block";
    document.getElementById("upload-success").innerHTML = "Done!"
})

const getPairwiseDistances = async () => {
    const file = document.getElementById("upload-file").files[0];
    log("Reading file...", false)

    const array = await readFileAsync(file);
    log("Done reading file...")

    const decoder = new TextDecoder("utf-8");
    // for when the chunk_size split doesn't match a full line
    let splitString = "";

    // iterate over the file in chunks, readAsText can't read the entire file 
    for (let i = 0; i < array.byteLength; i += CHUNK_SIZE) {
        // get individual pairwise distances
        const text = decoder.decode(array.slice(i, i + CHUNK_SIZE));
        const lines = text.split("\n")
        for (let j = 0; j < lines.length; ++j) {
            // line represents a single pairwise distance entry
            let line = lines[j];
            let columns = line.split("\t");

            // edge case: very first line of file
            if (i === 0 && j === 0) {
                continue;
            }

            // edge case: first line is split
            if (j === 0 && columns.length < 3) {

                line = splitString + line;
                splitString = "";
                columns = line.split("\t")
            }

            // edge case: last line is split
            if (j === lines.length - 1 && lines[j].length > 0) {
                splitString = line;
                continue;
            }

            // add to map of all pairwise distances if below threshold
            if (parseFloat(columns[2]) < MAX_THRESHOLD) {
                pairwiseDistances.push({
                    source: columns[0],
                    target: columns[1],
                    value: parseFloat(columns[2]),
                })
            }
        }
    }
    log("Done parsing file...")
}

// helper function to promise-fy file read  
const readFileAsync = async (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    })
}

// ----------- CLUSTER GENERATION ------------
const getClusterData = () => {
    log("Generating clusters...")
    const nodes = new Set(data.nodes);
    const clusters = [];
    const clusterSizes = [];
    const clusterDistribution = new Map();

    while (nodes.size > 0) {
        const cluster = new Set();
        const starterNode = nodes.values().next().value;
        cluster.add(starterNode);
        nodes.delete(starterNode)
        const queue = PAIRWISE_GRAPH.getAdjacentNodes(starterNode.id);
        while (queue.length > 0) {
            const node = queue.pop();
            if (!cluster.has(node)) {
                cluster.add(node);
                previousNode = node;
                nodes.delete(node);
                queue.push(...PAIRWISE_GRAPH.getAdjacentNodes(node.id));
            }
        }
        clusters.push(cluster);
        clusterSizes.push(cluster.size);
        clusterDistribution.set(cluster.size, (clusterDistribution.get(cluster.size) || 0) + 1);
    }

    log("Done generating clusters...")
    return { clusters, clusterSizes, clusterDistribution };
}

// ----------- HISTOGRAM GENERATION ------------
const generateHistogram = (data) => {
    // set the dimensions and margins of the graph
    const graphWidth = document.body.clientWidth * 0.7;
    const graphHeight = document.body.clientHeight;
    const margin = { top: graphHeight * 0.15, right: graphWidth * 0.15, bottom: graphHeight * 0.15, left: graphWidth * 0.2 }
    const width = document.body.clientWidth * 0.7 - margin.left - margin.right;
    const height = graphHeight - margin.top - margin.bottom;

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
        .domain([0, Math.max(...data) * 1.05])
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    // set the parameters for the histogram
    const histogram = d3.bin()
        .domain(x.domain())  // then the domain of the graphic
        .thresholds(x.ticks(70)); // then the numbers of bins

    // And apply this function to data to get the bins
    const bins = histogram(data);

    // Y axis: scale and draw:
    const y = d3.scaleLinear()
        .range([height, 0]);
    y.domain([0, d3.max(bins, function (d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    svg.append("g")
        .call(d3.axisLeft(y));

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
        .attr("font-size", "12px")
        .attr("x", (function (d) { return (x(d.x1) + x(d.x0)) / 2 }))
        .attr("y", function (d) { return y(d.length) - 12; })
        .text(d => d.length > 0 ? d.length : null);
}

// ----------- THRESHOLD SLIDER HANDLING ------------

// timeout for updating graph after threshold slider is adjusted (effectively a throttle)
let adjustingTimeout = null;
// auto zoom to fit view
let autoZoom = true;

document.getElementById("threshold-select").addEventListener("input", (e) => {
    threshold = parseFloat(e.target.value);
    document.getElementById("threshold-label").innerHTML = "Threshold Level: " + threshold.toFixed(4) + " (Use slider to adjust)";

    clearTimeout(adjustingTimeout);
    adjustingTimeout = setTimeout(() => {
        updateGraphThreshold();
    }, 500)
})

const updateGraphThreshold = () => {
    log("Updating graph...")
    data.nodes = []
    sequences = new Set();
    data.links = pairwiseDistances.filter((link) => {
        if (link.value < threshold) {
            // add to set of all sequences
            if (!sequences.has(link.source)) {
                sequences.add(link.source);
                data.nodes.push({ id: link.source });
            }

            if (!sequences.has(link.target)) {
                sequences.add(link.target);
                data.nodes.push({ id: link.target });
            }

            return true;
        }

        return false;
    });

    PAIRWISE_GRAPH.setData(data.nodes, data.links)
    const clusterData = getClusterData();
    console.log('Nodes: ' + data.nodes.length)
    console.log('Links: ' + data.links.length)
    console.log(clusterData)
    generateHistogram(clusterData.clusterSizes)
    setTimeout(() => {
        autoZoom && PAIRWISE_GRAPH.fitView()
    }, 1500)
    log("Done updating graph...")
}

// ----------- GRAPH INTERACTION  ------------
document.getElementById("zoom-to-fit").addEventListener("click", () => {
    PAIRWISE_GRAPH.fitView();
})

// ----------- GENERAL HELPER FUNCTIONS ------------ 
// for logging time elapsed
let previousTime = performance.now();

const log = (message, showElapsed = true) => {
    console.log(message);
    showElapsed && console.log("Time elapsed: " + (performance.now() - previousTime) + "ms")
    previousTime = performance.now();
}