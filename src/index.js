// OVERALL TODO: refactor document.getElementById b/c of runtime?
import { Graph } from '@cosmograph/cosmos'
import * as d3 from "d3";
import './styles/index.scss'

// ----------- GLOBAL VARIABLES ------------
/** READING FILES */
// size of chunks to read from uploaded file
const CHUNK_SIZE = 1024 * 1024 * 10;
// whether or not the pairwise distance file has been reuploaded
let reuploadedPairwise = true;

/** GRAPH DATA */
const data = {
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
}
// record if graph has updated while not in view
let updatedGraph = false;
// current graph / diagram / summary statistic being shown 
let graphCounter = 0;
// graph elements that can be switched between (also diagrams, summary statistics, etc.)
const graphElements = document.getElementsByClassName("graph-element");
// records if computation-heavy diagrams and stats have to be recalculated
let recalculate = true;

/** PAIRWISE DISTANCES (LINKS) */
// Maximum threshold for pairwise distances to be added to map
const MAX_THRESHOLD = 0.05;
// Actual threshold for pairwise distances to be added to map (the user input)
let threshold = 0.015;
// map of all pairwise distances (links), parsed from uploaded file
const ALL_LINKS = new Map();
// map of current pairwise distances (links), not filtered
const unfilteredLinks = new Map();

/** SEQUENCES (NODES) */
// a set of all nodes uploaded from the file, only changes when a new file is uploaded
const ALL_NODES = new Set();
// a set of all current nodes before any filters are applied
let unfilteredNodes = new Set();
// a map of all current nodes in the graph, with their supplementary data (adjacent nodes, color, etc.)
const nodesMap = new Map();
// individual demographic data, mapped by ID
const individualData = new Map();
// a map of individual demographic data categories to their type of value and a set of all possible values
const individualDataCategories = new Map();
// maximum number of node categories to show in the form (a sanity check to make sure the uploaded demographic data is valid)
const MAX_INDIVIDUAL_CATEGORIES = 25;

/** CLUSTERS */
// the type of cluster filtering that's currently being used: show all clusters, show clusters with a minimum number of nodes, or show x largest clusters
let clusterFilterType = "all";
// the minimum number of nodes a cluster must have to be shown
let clusterNodeMin = 0;
// the number of largest clusters to show
let maxClusterCount = 0;

/** CLUSTERS PI GRAPH DATA */
const piData = {
    nodes: [],
    links: [],
};

/** HISTOGRAM VARIABLES */
let histogramBarCount = 0;

/** FORM INTERFACE */
// number of steps in the form
const TOTAL_STEPS = 3;
// current step in the form
let stepCounter = 1;

// --- STEP 2 --- 
// auto zoom to fit view
let autoZoom = true;
// whether or not the threshold input value is valid
let thresholdValid = true;
// whether or not the cluster filter input value is valid
let clusterValid = false;

// --- STEP 3 ---
// key is a view ID, in format "0-0-..." where each number is the index of the value of the selected view for that specific category
const nodeViews = new Map();

// ----------- COSMOGRAPH PARAMETERS ------------
const PAIRWISE_GRAPH_CANVAS = document.getElementById('pairwise-graph');
const PAIRWISE_GRAPH_CONFIG = {
    backgroundColor: "#ffffff",
    nodeColor: (node) => {
        return node.color ?? "#000000";
    },
    nodeSize: 7,
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
        decay: 99999999,
        linkSpring: 0.1,
    }
}

// ----------- GENERAL DATA FUNCTIONS ------------
/**
 * Clears all data from the graph and resets all global variables
 */
// TODO: make sure everything is reset
const resetData = () => {
    // reset graph data
    data.nodes.length = 0;
    data.links.length = 0;
    data.clusters = {};
    data.unfilteredClusters = {};
    updatedGraph = true;

    // reset link data
    ALL_LINKS.clear();

    // reset node data
    ALL_NODES.clear();
    nodesMap.clear();
    individualData.clear();
    individualDataCategories.clear();

    // reset recalculate flag
    recalculate = true;
}

/**
 * Updates the graph's displayed nodes and links based on the current threshold value and cluster filters.
 */
const updateData = () => {
    console.log("\n\n\n-------- UPDATING DATA -------- \n\n\n")
    log("Updating data...", true)
    updatedGraph = true;
    // clears currently shown nodes and links
    data.nodes = [];
    data.links = [];
    unfilteredLinks.clear();
    nodesMap.clear();
    const allLinksKeys = [...ALL_LINKS.keys()];
    // loops through all uploaded pairwise distances and adds links to data if below threshold
    for (let i = 0; i < allLinksKeys.length; i++) {
        const link = ALL_LINKS.get(allLinksKeys[i]);
        if (link.value < threshold) {
            addLinkToData(link);

            // add link to data
            data.links.push(link)
            unfilteredLinks.set(link.id, link);
        }
    };

    // set nodes
    getClusterData();

    data.unfilteredClusters = data.clusters;
    data.nodes = [...nodesMap.keys()];
    unfilteredNodes = new Set(data.nodes);

    if (clusterFilterType === "all") {
        setNodeDataFromMap();
        // do no filtering
    } else if (clusterFilterType === "clusterNodeMin" || clusterFilterType === "maxClusterCount") {
        log("Filtering clusters...")
        const filteredNodes = [];
        let filteredNodesSet = new Set();

        // filter out clusters with less than clusterNodeMin nodes
        if (clusterFilterType === "clusterNodeMin") {
            for (let i = 0; i < data.clusters.clusterStats.length; i++) {
                if (data.clusters.clusterStats[i].cluster.size >= clusterNodeMin) {
                    filteredNodes.push(...data.clusters.clusterStats[i].cluster)
                }
            }
            // only keep the largest maxClusterCount clusters
        } else {
            for (let i = 0; i < maxClusterCount; i++) {
                filteredNodes.push(...data.clusters.clusterStats[i].cluster)
            }
        }

        filteredNodesSet = new Set(filteredNodes);

        // filter out links that do not connect to filtered nodes
        const filteredLinks = []
        for (let i = 0; i < data.links.length; i++) {
            const link = data.links[i];
            if (filteredNodesSet.has(link.source) && filteredNodesSet.has(link.target)) {
                filteredLinks.push(link)
            }
        }

        // set data to filtered nodes and links
        data.links = filteredLinks;

        // update nodesMap
        nodesMap.clear();
        for (let i = 0; i < data.links.length; i++) {
            addLinkToData(data.links[i])
        }
        setNodeDataFromMap();

        log("Done filtering clusters...")
        getClusterData();
    }

    let views = [...nodeViews.keys()];
    for (let i = 0; i < views.length; i++) {
        addView(views[i])
    }
    log("Setting graph data...")
    PAIRWISE_GRAPH.setData(data.nodes, data.links)
    log("Done setting graph data...")
    // auto zoom after a delay (wait for nodes to finish rendering)
    setTimeout(() => {
        autoZoom && PAIRWISE_GRAPH.fitView()
    }, 1500)

    // generate other diagrams
    if (recalculate) {
        log("Recalculating data...")
        generateSummaryStatistics()
        generateHistogram()
        recalculate = false;
    }
    generateClusterGraph()
    log("Done generating other diagrams (done updating data)...")
}


// ----------- FILE UPLOAD EVENT HANDLERS ------------
document.getElementById("upload-pairwise-file").addEventListener("click", () => {
    reuploadedPairwise = true;
    document.getElementById("upload-pairwise-file").value = "";
    document.getElementById("upload-success").classList.add("d-none");
})

document.getElementById("upload-data-file").addEventListener("click", () => {
    reuploadedDemo = true;
    document.getElementById("upload-data-file").value = "";
    document.getElementById("upload-success").classList.add("d-none");
})

document.getElementById("upload-pairwise-file").addEventListener("change", () => {
    document.getElementById("upload-success").innerHTML = "";
})

document.getElementById("upload-data-file").addEventListener("change", () => {
    document.getElementById("upload-success").innerHTML = "";
})

// Submit button for uploading data file
document.getElementById("read-file").addEventListener("click", async () => {
    if (!document.getElementById("upload-pairwise-file").files[0]) {
        alert("Please select a file.");
        return;
    }

    // update status
    document.getElementById("upload-success").classList.remove("d-none");
    document.getElementById("upload-success").innerHTML = "Loading...";

    // reset data, get individual demographic data, and get pairwise distances (actual node / link data)
    resetData();
    await getIndividualDemoData();
    if (reuploadedPairwise) {
        await getPairwiseDistances();
        reuploadedPairwise = false;
    }

    // update graph after getting data
    updateData();
    PAIRWISE_GRAPH_CANVAS.style.display = "block";

    // update status
    document.getElementById("upload-success").style.display = "block";
    document.getElementById("upload-success").innerHTML = "Done!"
})

// ----------- SEQUENCE (nodes) AND PAIRWISE DISTANCE (links) PARSING ------------
/**
 * Reads the uploaded data file and updates global variables with the node and link node data (not demographic data, but actual data)
 */
const getPairwiseDistances = async () => {
    const file = document.getElementById("upload-pairwise-file").files[0];
    console.log("\n\n\n-------- READING FILE -------- \n\n\n")
    log("Reading file...", true)

    const array = await readFileAsync(file);
    log("Done reading file...")

    const decoder = new TextDecoder("utf-8");
    // for when the chunk_size split doesn't match a full line
    let splitString = "";

    log("Parsing file...", true)
    // iterate over the file in chunks, readAsText can't read the entire file 
    for (let i = 0; i < array.byteLength; i += CHUNK_SIZE) {
        // get chunk and decode it
        const text = decoder.decode(array.slice(i, i + CHUNK_SIZE));
        const lines = text.split("\n")
        for (let j = 0; j < lines.length; ++j) {
            // line represents a single pairwise distance entry
            let line = lines[j];
            // split line into data entry columns
            let columns = line.split("\t");

            // edge case: very first line of file (header line)
            if (i === 0 && j === 0) {
                continue;
            }

            // edge case: first line is split (part of the line is in the previous chunk)
            if (j === 0 && columns.length < 3) {
                // add it to the splitString and reset split string
                line = splitString + line;
                splitString = "";
                columns = line.split("\t")
            }

            // edge case: last line is split (part of the line is in the next chunk)
            if (j === lines.length - 1 && lines[j].length > 0) {
                // set the splitString to the last line
                splitString = line;
                continue;
            }

            // add to map of all pairwise distances if below threshold
            if (parseFloat(columns[2]) < MAX_THRESHOLD) {
                const min = columns[0].localeCompare(columns[1]) < 0 ? columns[0] : columns[1];
                const max = columns[0].localeCompare(columns[1]) < 0 ? columns[1] : columns[0];
                ALL_LINKS.set(min + "-" + max, {
                    id: min + "-" + max,
                    source: columns[0],
                    target: columns[1],
                    value: parseFloat(columns[2]),
                })
            }

            // skip empty lines / lines with missing data
            if (columns[0] === undefined || columns[0] === "" || columns[1] === undefined || columns[1] === "") {
                continue;
            }

            // add nodes to set of all nodes
            ALL_NODES.add(columns[0]);
            ALL_NODES.add(columns[1]);
        }
    }

    log("Done parsing file...")
}

// helper function to promise-fy file read and make it awaitable 
const readFileAsync = async (file, asText = false) => {
    console.log(file.slice(0, 100))

    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        reader.onerror = reject;
        asText ? reader.readAsText(file) : reader.readAsArrayBuffer(file);
    })
}

/**
 * Updates graph nodes' colors / views with given viewID. 
 * 
 */
const addView = (viewID) => {
    log("Adding view: " + viewID + " ...", true)
    const nodesKeys = [...nodesMap.keys()]
    const viewValues = nodeViews.get(viewID).values;
    // loop through current nodes
    for (let i = 0; i < nodesKeys.length; i++) {
        // get sequence's corresponding individual, return if not found
        const correspondingIndividual = individualData.get(nodesKeys[i].split("|")[1]);
        if (correspondingIndividual === undefined) {
            continue;
        }

        // get individual's (demographic) data
        const individualDemoKeys = Object.keys(correspondingIndividual);
        const individualDemoValues = Object.values(correspondingIndividual);
        let add = true;

        // check if sequence's corresponding individual matches view
        for (let j = 0; j < individualDemoKeys.length; j++) {
            if (viewValues[j] === "All") {
                continue;
            }

            if (individualDataCategories.get(individualDemoKeys[j]).type === 'number') {
                const range = viewValues[j].split(" - ");
                if (!(individualDemoValues[j] >= parseFloat(range[0]) && individualDemoValues[j] <= parseFloat(range[1]))) {
                    add = false;
                    break;
                }
            } else {
                if (individualDemoValues[j] !== viewValues[j]) {
                    add = false;
                    break;
                }
            }
        }

        if (add) {
            nodesMap.get(nodesKeys[i]).views.add(viewID)
        }
    }

    log("Updating node (color) data...")
    setNodeDataFromMap();
}

const deleteView = (viewID) => {
    const nodesKeys = [...nodesMap.keys()]
    for (let i = 0; i < nodesKeys.length; i++) {
        nodesMap.get(nodesKeys[i]).views.delete(viewID)
    }

    setNodeDataFromMap();
}

const setNodeDataFromMap = (filteredNodes = undefined) => {
    const getColor = (node) => {
        let color;
        const view = [...nodesMap.get(node).views.keys()]
        if (view.length > 0) {
            color = nodeViews.get([...nodesMap.get(node).views.keys()][0]).color
        }
        return color;
    }

    if (filteredNodes) {
        data.nodes = filteredNodes.map(node => { return { id: node, color: getColor(node) } })
    } else {
        data.nodes = [...nodesMap.keys()].map(node => { return { id: node, color: getColor(node) } })
    }
}

const addLinkToData = (link) => {
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

// ----------- TOGGLE GRAPH ELEMENTS (switch between different diagrams) ------------
// NOTE: 0-indexed

// go back and forth between different graph elements
document.getElementById("graph-arrow-left").addEventListener("click", () => {
    graphCounter = (graphCounter - 1 + graphElements.length) % graphElements.length;
    updateGraphElement();
})
document.getElementById("graph-arrow-right").addEventListener("click", () => {
    graphCounter = (graphCounter + 1) % graphElements.length;
    updateGraphElement();
})

/**
 * Helper function to update the graph element being shown
 */
const updateGraphElement = () => {
    // hide all graph elements and show the current one
    for (let i = 0; i < graphElements.length; i++) {
        graphElements[i].classList.add('d-none')
    }
    graphElements[graphCounter].classList.remove('d-none')

    // update cluster graph if necessary
    if (updatedGraph && graphCounter === 0) {
        setTimeout(() => {
            PAIRWISE_GRAPH.fitView()
            updatedGraph = false;
        }, 250)
    }

    if (graphCounter === 2) {
        clusterPiGraph.centerAt(0.65 * window.innerWidth / 2, window.innerHeight / 2)
    }

    // update label
    document.getElementById('footer-label').innerHTML = 'Figure ' + (graphCounter + 1) + ' of ' + graphElements.length;
}

// ----------- FORM BACK AND FORTH BUTTONS ------------
// NOTE: 1-indexed
document.getElementById("step-back").addEventListener("click", () => {
    if (stepCounter === 1) {
        return;
    }
    stepCounter--;
    updateForm();
})

document.getElementById("step-next").addEventListener("click", () => {
    if (stepCounter === TOTAL_STEPS) {
        return;
    }
    stepCounter++;
    updateForm();
})

/**
 * Helper function to update the form step being shown
 */
const updateForm = () => {
    // hide all form steps and show the current one
    for (let i = 1; i <= TOTAL_STEPS; i++) {
        document.getElementById("input-step-" + i).classList.add("d-none");
    }
    document.getElementById("input-step-" + stepCounter).classList.remove("d-none");

    // update back and forth buttons' display based on current step
    if (stepCounter === 1) {
        document.getElementById("step-back").classList.add("invisible");
    } else {
        document.getElementById("step-back").classList.remove("invisible");
    }
    if (stepCounter === TOTAL_STEPS) {
        document.getElementById("step-next").classList.add("invisible");
    } else {
        document.getElementById("step-next").classList.remove("invisible");
    }
}

// ----------- CLUSTER GENERATION ------------
/**
 * Creates cluster data from the pairwise distance data by using a BFS to find all nodes within a cluster
 */
const getClusterData = () => {
    log("Generating clusters...")
    // list of current nodes on graph, a list of ids (strings) 
    const nodes = new Set(nodesMap.keys());
    // array of clusters, each cluster is a set of ids (strings)
    const clusterStats = [];
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
        const clusterNodes = [...cluster.values()];
        for (let i = 0; i < clusterNodes.length; i++) {
            const node1 = clusterNodes[i];
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
        clusterStats.push({
            id: starterNode,
            cluster,
            size: cluster.size,
            triangleCount
        });
        clusterSizes.push(cluster.size);
        clusterDistribution.set(cluster.size, (clusterDistribution.get(cluster.size) || 0) + 1);
    }

    // also set histogram bar count variable to largest cluster size 
    histogramBarCount = Math.max(...clusterSizes);
    document.getElementById("cluster-histogram-bar-count").value = histogramBarCount;
    document.getElementById("cluster-histogram-bar-hint").innerHTML = "Default (Intervals of 1): " + histogramBarCount;

    clusterStats.sort((a, b) => a.cluster.size - b.cluster.size)
    data.clusters = { clusterStats, clusterSizes, clusterDistribution };
    log("Done generating clusters...")
}

// ----------- CLUSTER GRAPH GENERATION ------------
const generateClusterGraph = () => {
    piData.nodes.length = 0;
    for (let i = data.clusters.clusterStats.length - 1; i >= 0; i--) {
        piData.nodes.push({ id: i, val: Math.sqrt(data.clusters.clusterStats[i].cluster.size) * 2, count: data.clusters.clusterStats[i].cluster.size });
    }

    clusterPiGraph.graphData(piData);
    clusterPiGraph.centerAt(0.65 * window.innerWidth / 2, window.innerHeight / 2)
}

// ----------- HISTOGRAM GENERATION ------------
document.getElementById("cluster-histogram-bar-count").addEventListener("input", (e) => {
    // validation
    if (isNaN(e.target.value) || parseInt(e.target.value) < 0) {
        return;
    }

    histogramBarCount = parseInt(e.target.value);
    log("Updating histogram...", true)
    generateHistogram();
    log("Done updating histogram...")
})

const generateHistogram = () => {
    if (data.clusters.clusterSizes.length === 0) {
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
        .domain([0, Math.max(...data.clusters.clusterSizes) * 1.05])
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
        .thresholds(x.ticks(histogramBarCount)); // then the numbers of bins

    // And apply this function to data to get the bins
    const bins = histogram(data.clusters.clusterSizes);

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

// ---------- SUMMARY STATISTICS GENERATION ------------
const generateSummaryStatistics = () => {
    // sort cluster sizes to get median
    data.unfilteredClusters.clusterSizes.sort((a, b) => a - b);
    data.stats.median = data.unfilteredClusters.clusterSizes[Math.floor(data.unfilteredClusters.clusterSizes.length / 2)];

    // get mean 
    data.stats.mean = (data.unfilteredClusters.clusterSizes.reduce((a, b) => a + b, 0) / data.unfilteredClusters.clusterSizes.length).toFixed(2);

    // get triangle count
    let triangleCount = 0;
    for (let i = 0; i < data.unfilteredClusters.clusterStats.length; i++) {
        triangleCount += data.unfilteredClusters.clusterStats[i].triangleCount;
    }

    // get number of possible connected triples
    let triples = 0;
    const unfilteredNodesArray = [];
    unfilteredNodes.forEach(node => unfilteredNodesArray.push(node));
    for (let i = 0; i < unfilteredNodesArray.length; i++) {
        const adjacentNodeCount = nodesMap.get(unfilteredNodesArray[i]).adjacentNodes.size;
        triples += adjacentNodeCount * (adjacentNodeCount - 1) / 2;
    }

    triples /= 3;

    // calculate transitivity
    data.stats.transitivity = (triangleCount / triples).toFixed(2);

    data.stats.triangleCount = triangleCount;

    // calculate mean pairwise distance
    let sum = 0;
    const unfilteredLinksArray = [];
    unfilteredLinks.forEach(link => unfilteredLinksArray.push(link));
    unfilteredLinksArray.sort((a, b) => a.value - b.value);
    for (let i = 0; i < unfilteredLinksArray.length; i++) {
        sum += unfilteredLinksArray[i].value;
    }
    data.stats.meanPairwiseDistance = (sum / unfilteredLinksArray.length).toFixed(6);

    // calculate median pairwise distance
    data.stats.medianPairwiseDistance = unfilteredLinksArray[Math.floor(unfilteredLinksArray.length / 2)].value.toFixed(6);

    document.getElementById("summary-node-count").innerHTML = unfilteredNodes.size;
    document.getElementById("summary-singleton-count").innerHTML = ALL_NODES.size - unfilteredNodes.size;
    document.getElementById("summary-edge-count").innerHTML = unfilteredLinks.size;
    document.getElementById("summary-cluster-count").innerHTML = data.unfilteredClusters.clusterStats.length;
    document.getElementById("summary-cluster-mean").innerHTML = data.stats.mean;
    document.getElementById("summary-cluster-median").innerHTML = data.stats.median;
    document.getElementById("summary-triangle-count").innerHTML = data.stats.triangleCount;
    document.getElementById("summary-transitivity").innerHTML = data.stats.transitivity;
    document.getElementById("summary-pairwise-mean").innerHTML = data.stats.meanPairwiseDistance;
    document.getElementById("summary-pairwise-median").innerHTML = data.stats.medianPairwiseDistance;
}

// ----------- GET INDIVIDUAL DEMOGRAPHIC (SUPPLEMENTARY) DATA ------------
const getIndividualDemoData = async () => {
    const file = document.getElementById("upload-data-file").files[0];

    // validation
    if (!file) {
        return;
    }
    if (!(file.name.endsWith(".tsv") || file.name.endsWith(".csv"))) {
        alert("Invalid supplementary data file.")
        return;
    }

    // read file and define delimiter 
    const text = await readFileAsync(file, true)
    const delimiter = file.name.endsWith(".csv") ? "," : "\t";

    const lines = text.split("\n")
    // first line is categories
    const categories = lines[0].split(delimiter);
    // create new category for each column
    for (let i = 0; i < categories.length; i++) {
        individualDataCategories.set(categories[i], { type: 'string', elements: new Set() })
    }

    // edge case to remove empty line at end of file
    if (lines[lines.length - 1] === "") {
        lines.pop();
    }

    // validation by checking number of data entry columns
    if (individualDataCategories.size < 2 || individualDataCategories.size > MAX_INDIVIDUAL_CATEGORIES) {
        alert("Invalid supplementary data file.")
        return;
    }

    log("Parsing node supplementary data...", true)

    // create individual demographic data
    for (let i = 1; i < lines.length; i++) {
        const dataEntry = lines[i].split(delimiter);
        // validation by checking if number of data entry columns matches number of categories
        if (dataEntry.length !== individualDataCategories.size) {
            alert("Invalid supplementary data file.")
            return;
        }

        // create object for each data entry, corresponds to a node
        const dataEntryObject = {};

        for (let j = 1; j < categories.length; j++) {
            if (!isNaN(dataEntry[j])) {
                individualDataCategories.get(categories[j]).type = 'number';
                individualDataCategories.get(categories[j]).intervals = [];
            }

            if (individualDataCategories.get(categories[j]).type === 'string') {
                dataEntryObject[categories[j]] = dataEntry[j];
                individualDataCategories.get(categories[j]).elements.add(dataEntry[j])
            } else {
                dataEntryObject[categories[j]] = parseFloat(dataEntry[j]);
                individualDataCategories.get(categories[j]).elements.add(parseFloat(dataEntry[j]))
            }
        }

        // add data entry to individual demographic data
        individualData.set(dataEntry[0], dataEntryObject)
    }

    // sort categories
    for (let i = 0; i < categories.length; i++) {
        const sortedElements = [...individualDataCategories.get(categories[i]).elements.values()]

        if (individualDataCategories.get(categories[i]).type === 'string') {
            sortedElements.sort()
        } else {
            sortedElements.sort((a, b) => a - b)
        }

        // add in "All" option
        individualDataCategories.get(categories[i]).elements = new Set(["All", ...sortedElements])
    }

    // create initial 5 categories for quantitative data
    const individualDataCategoriesKeys = [...individualDataCategories.keys()];
    for (let i = 0; i < individualDataCategoriesKeys.length; i++) {
        if (individualDataCategories.get(individualDataCategoriesKeys[i]).type !== 'number') {
            continue;
        }

        const values = [...individualDataCategories.get(individualDataCategoriesKeys[i]).elements]

        // create intervals for numerical data (default of 5 even splits)
        const min = values[1];
        const max = values[values.length - 1];
        const step = (max - min) / 5;
        for (let j = min; j <= max; j += step) {
            individualDataCategories.get(individualDataCategoriesKeys[i]).intervals.push(j);
        }
    }

    // generate quantitative data intervals
    generateQuantIntervals();

    // generate HTML elements for views
    generateNodeViews();

    log("Done parsing node supplementary data...")
}

// ----------- NODE VIEW QUANTITATIVE DATA INTERVALS ADJUSTMENT ------------
document.getElementById("number-category-intervals-select").addEventListener("change", (e) => {
    showQuantIntervals(e.target.value)
})

const showQuantIntervals = (category) => {
    // hide all containers
    const containers = document.getElementsByClassName("number-category-intervals-list");
    for (let i = 0; i < containers.length; i++) {
        containers[i].classList.add("d-none");
    }

    // show selected container
    const selectedContainer = document.getElementById("number-category-intervals-list-" + category);
    selectedContainer.classList.remove("d-none");
}

const generateQuantIntervals = () => {
    const individualDataCategoriesKeys = [...individualDataCategories.keys()];
    const select = document.getElementById("number-category-intervals-select");
    const intervalsContainer = document.getElementById("number-category-list-container");
    let firstContainer = -1;

    for (let i = 1; i < individualDataCategoriesKeys.length; i++) {
        if (individualDataCategories.get(individualDataCategoriesKeys[i]).type === 'number') {
            if (firstContainer === -1) {
                firstContainer = i;
            }

            // create option
            const option = document.createElement("option");
            option.value = individualDataCategoriesKeys[i];
            option.innerHTML = individualDataCategoriesKeys[i];

            select.appendChild(option)

            // create div to hold all inputs for each category
            const list = document.createElement("div");
            list.classList.add("number-category-intervals-list", "d-none");
            list.id = "number-category-intervals-list-" + individualDataCategoriesKeys[i];

            generateQuantIntervalsList(list, individualDataCategoriesKeys[i], i);
            intervalsContainer.appendChild(list);

            if (firstContainer !== -1) {
                showQuantIntervals(individualDataCategoriesKeys[firstContainer]);
            }
        }
    }
}

const generateQuantIntervalsList = (listContainer, category, categoryIndex) => {
    // clear container 
    listContainer.innerHTML = "";

    const intervals = individualDataCategories.get(category).intervals;
    for (let j = 0; j < intervals.length; j++) {
        const inputContainer = document.createElement("div");
        inputContainer.classList.add("d-flex", "align-items-center");

        // create input for each interval
        const input = document.createElement("input");
        input.type = "number";
        input.step = 0.01;
        input.classList.add("form-control", "my-3");
        input.value = intervals[j].toFixed(2);
        inputContainer.appendChild(input);

        // first and last intervals are fixed
        if (j === 0 || j === intervals.length - 1) {
            // do nothing
        } else {
            // add delete button
            const deleteButton = document.createElement("button");
            deleteButton.classList.add("btn", "btn-danger", "ms-4");

            const deleteIcon = document.createElement("i");
            deleteIcon.classList.add("bi", "bi-trash");
            deleteButton.appendChild(deleteIcon);

            deleteButton.addEventListener("click", (e) => {
                inputContainer.remove();
                intervals.splice(j, 1);
                updateNodeView(categoryIndex);
            })

            inputContainer.appendChild(deleteButton)

        }

        // add event listener to update intervals
        input.addEventListener("input", (e) => {
            const value = parseFloat(e.target.value);
            if (value <= intervals[j - 1] || value >= intervals[j + 1]) {
                // error, add red border
                input.classList.add("border-danger");
                return;
            }

            // remove red border if any
            input.classList.remove("border-danger");
            intervals[j] = parseFloat(e.target.value);
            updateNodeView(categoryIndex);
        })

        listContainer.appendChild(inputContainer);

        // create add interval button
        if (j !== intervals.length - 1) {
            const addButton = document.createElement("button");
            addButton.classList.add("btn", "btn-primary", "ms-4");

            const addIcon = document.createElement("i");
            addIcon.classList.add("bi", "bi-plus");
            addButton.appendChild(addIcon);

            addButton.addEventListener("click", (e) => {
                intervals.splice(j + 1, 0, (intervals[j] + intervals[j + 1]) / 2);
                updateNodeView(categoryIndex);
                generateQuantIntervalsList(listContainer, category, categoryIndex)
            })

            inputContainer.appendChild(addButton)
        }
    }
}

// ----------- NODE VIEW CREATION ------------
/**
 * Generates HTML elements for node views, one per category.
 */
const generateNodeViews = () => {
    const categories = [...individualDataCategories.keys()];
    const container = document.getElementById("views-container");
    container.innerHTML = "";
    // loop through each category
    for (let i = 1; i < categories.length; i++) {
        const view = document.createElement("div");
        view.classList.add("pairwise-view", "mb-3", "w-100");

        // create label
        const label = document.createElement("label");
        label.htmlFor = "view-select-" + i;
        label.classList.add("form-label", "w-100", "text-center");
        label.innerHTML = "View by " + categories[i].toLowerCase() + ": ";

        // create select input
        const select = document.createElement("select");
        select.id = "view-select-" + i;
        select.classList.add("form-select", "view-select");
        select.setAttribute("category", categories[i]);

        // add options for each possible value
        const values = [...individualDataCategories.get(categories[i]).elements]
        if (individualDataCategories.get(categories[i]).type === 'number') {
            // create "All" option
            const allOption = document.createElement("option");
            allOption.innerHTML = "All";
            allOption.value = "All";
            select.appendChild(allOption);

            const intervals = individualDataCategories.get(categories[i]).intervals;
            for (let j = 0; j < intervals.length - 1; j++) {
                const startInterval = intervals[j];
                const endInterval = intervals[j + 1];
                const option = document.createElement("option");
                option.innerHTML = startInterval.toFixed(2) + " - " + endInterval.toFixed(2);
                option.value = startInterval.toFixed(2) + " - " + endInterval.toFixed(2);
                select.appendChild(option);
            }
        } else {
            // make "other" last value
            const otherIndex = values.map(string => string.toLowerCase()).indexOf("other");
            if (otherIndex !== -1) {
                individualDataCategories.get(categories[i]).elements.delete(values[otherIndex])
                individualDataCategories.get(categories[i]).elements.add(values[otherIndex])
                const otherText = values.splice(otherIndex, 1);
                values.push(otherText);
            }

            for (let j = 0; j < values.length; j++) {
                const option = document.createElement("option");
                option.innerHTML = values[j];
                option.value = values[j];
                select.appendChild(option);
            }
        }

        // append everything
        view.appendChild(label);
        view.appendChild(select);
        container.appendChild(view);

    }
}

/**
 * Updates a node view, specified by its index in the individualDataCategories array.
 * 
 * @param {number} index index of the node view to update
 */
const updateNodeView = (index) => {
    const select = document.getElementById("view-select-" + index);
    select.innerHTML = "";

    const individualDataCategoriesKeys = [...individualDataCategories.keys()];

    // add options for each possible value
    if (individualDataCategories.get(individualDataCategoriesKeys[index]).type === 'number') {
        // create "All" option
        const allOption = document.createElement("option");
        allOption.innerHTML = "All";
        allOption.value = "All";
        select.appendChild(allOption);

        const intervals = individualDataCategories.get(individualDataCategoriesKeys[index]).intervals;
        for (let j = 0; j < intervals.length - 1; j++) {
            const startInterval = intervals[j];
            const endInterval = intervals[j + 1];
            const option = document.createElement("option");
            option.innerHTML = startInterval.toFixed(2) + " - " + endInterval.toFixed(2);
            option.value = startInterval.toFixed(2) + " - " + endInterval.toFixed(2);
            select.appendChild(option);
        }
    }
}

document.getElementById("create-view-button").addEventListener("click", (e) => {
    // TODO: add validation
    // create view ID and add to map
    let viewID = "";
    let viewName = "";
    let viewValues = [];
    const viewElements = document.getElementsByClassName("view-select");
    for (let i = 0; i < viewElements.length; i++) {
        viewID += viewElements[i].selectedIndex + (i === viewElements.length - 1 ? "" : "-");
        viewValues.push(viewElements[i].value)

        if (viewElements[i].selectedIndex !== 0) {
            viewName += viewElements[i].getAttribute("category") + "-" + viewElements[i].value + ", ";
        }
    }

    // check if view element exists
    if (document.getElementById("view-entry-" + viewID) !== null) {
        alert("View already exists.");
        return;
    }

    if (viewName === "") {
        viewName = "All";
    } else {
        // slice off last comma and space
        viewName = viewName.slice(0, -2);
    }

    nodeViews.set(viewID, {
        color: document.getElementById("view-color").value,
        name: viewName,
        values: viewValues
    })

    addView(viewID);

    PAIRWISE_GRAPH.setData(data.nodes, data.links)

    // create view element
    const viewEntryElement = document.createElement("div");
    viewEntryElement.classList.add("view-entry", "my-3", "w-100");
    viewEntryElement.id = "view-entry-" + viewID;

    const viewPreview = document.createElement("div");
    viewPreview.classList.add("view-entry-preview", "w-100");
    viewPreview.id = "view-entry-preview-" + viewID;
    viewEntryElement.appendChild(viewPreview);

    const viewButton = document.createElement("button");
    viewButton.classList.add("btn", "btn-secondary", "view-entry-button");
    viewButton.id = "view-entry-button-" + viewID;
    viewButton.innerHTML = "View: " + viewName;
    viewPreview.appendChild(viewButton);

    const viewColor = document.createElement("input");
    viewColor.type = "color";
    viewColor.value = document.getElementById("view-color").value;
    viewColor.classList.add("view-entry-color", "form-control", "form-control-color", "border-secondary");
    viewColor.id = "view-entry-color-" + viewID;
    viewPreview.appendChild(viewColor);
    viewColor.addEventListener("input", (e) => {
        nodeViews.get(viewID).color = e.target.value;
        setNodeDataFromMap();
        PAIRWISE_GRAPH.setData(data.nodes, data.links)
    })

    const viewDelete = document.createElement("button");
    viewDelete.classList.add("btn", "btn-danger", "view-entry-delete");
    viewDelete.id = "view-entry-delete-" + viewID;
    viewDelete.addEventListener("click", () => {
        document.getElementById("view-entry-" + viewID).remove();
        nodeViews.delete(viewID);
        deleteView(viewID);
        PAIRWISE_GRAPH.setData(data.nodes, data.links)
    })
    viewPreview.appendChild(viewDelete);

    const viewDeleteIcon = document.createElement("i");
    viewDeleteIcon.classList.add("bi", "bi-trash");
    viewDelete.appendChild(viewDeleteIcon);

    document.getElementById("view-entry-container").appendChild(viewEntryElement);
})

// ----------- THRESHOLD INPUT HANDLING ------------
let thresholdTimeout = undefined;

// threshold input handling, checks if input is valid and updates threshold if so
document.getElementById("threshold-select").addEventListener("input", (e) => {
    threshold = parseFloat(e.target.value);
    thresholdValid = !isNaN(threshold) && threshold >= 0 && threshold <= MAX_THRESHOLD;
    if (thresholdValid) {
        document.getElementById("threshold-select").classList.remove('is-invalid')
        updateThresholdLabel();

        clearTimeout(thresholdTimeout);

        thresholdTimeout = setTimeout(() => {
            if (thresholdValid) {
                recalculate = true;
                updateData();
            }
        }, 500)
    } else {
        document.getElementById("threshold-select").classList.add('is-invalid')
    }
})

const updateThresholdLabel = () => {
    document.getElementById("threshold-label").innerHTML = "Maximum Pairwise Distance Threshold Level: " + threshold.toFixed(4);
}

// // ----------- CLUSTER FILTERS ------------
// // cluster filter type select input handling
// document.getElementById("cluster-filter-select").addEventListener("change", () => {
//     clusterFilterType = document.getElementById("cluster-filter-select").value;
//     if (clusterFilterType === "clusterNodeMin") {
//         document.getElementById("cluster-filter-value").classList.remove("d-none");
//         document.getElementById("cluster-filter-value").value = "";
//         // TODO: Singletons not getting shown so...
//         clusterNodeMin = 0;
//     } else if (clusterFilterType === "maxClusterCount") {
//         document.getElementById("cluster-filter-value").classList.remove("d-none");
//         document.getElementById("cluster-filter-value").value = "";
//         maxClusterCount = 0;
//     } else {
//         document.getElementById("cluster-filter-value").classList.add("d-none");
//     }
// })

// // cluster filter value input handling
// document.getElementById("cluster-filter-value").addEventListener("input", () => {
//     // check if value is valid and returns if invalid
//     checkClusterValueValid()
//     if (!clusterValid) {
//         return;
//     }

//     // update cluster filter value
//     const value = document.getElementById("cluster-filter-value").value;
//     if (clusterFilterType === "clusterNodeMin") {
//         clusterNodeMin = value;
//     } else if (clusterFilterType === "maxClusterCount") {
//         maxClusterCount = value;
//     }
// })

// /**
//  * Checks if the cluster filter value is valid and updates the clusterValid variable and DOM.
//  */
// const checkClusterValueValid = () => {
//     if (clusterFilterType === "all") {
//         clusterValid = true;
//     } else {
//         const value = document.getElementById("cluster-filter-value").value;
//         if (isNaN(value) || value < 0 || !Number.isInteger(parseInt(value))) {
//             document.getElementById("cluster-filter-value").classList.add("is-invalid");
//             clusterValid = false;
//         } else if (value === "") {
//             // do nothing
//             clusterValid = false;
//         } else {
//             document.getElementById("cluster-filter-value").classList.remove("is-invalid");
//             clusterValid = true;
//         }
//     }
// }

// // ----------- UPDATE BUTTON ------------
// // timeout to clear status message
// let filterStatusTimeout;

// // update button click handling, checks if inputs are valid and updates graph if so
// document.getElementById("filter-update").addEventListener("click", () => {
//     checkClusterValueValid();
//     if (!clusterValid) {
//         document.getElementById("cluster-filter-value").classList.add("is-invalid");
//     } else {
//         document.getElementById("cluster-filter-value").classList.remove("is-invalid");
//     }

//     if (clusterValid) {
//         document.getElementById("filter-update-status").classList.remove("d-none");
//         document.getElementById("filter-update-status").innerHTML = "Graph updated!";
//         updateData();
//         clearTimeout(filterStatusTimeout)
//         filterStatusTimeout = setTimeout(() => {
//             document.getElementById("filter-update-status").classList.add("d-none");
//         }, 5000)
//     }
// })


// ----------- GRAPH INTERACTION  ------------
document.getElementById("zoom-to-fit").addEventListener("click", () => {
    PAIRWISE_GRAPH.fitView();
})

// ----------- PERFORMANCE LOGGING ------------ 
let basetime = performance.now();

const log = (message, reset = false) => {
    if (reset) {
        basetime = performance.now();
    }
    console.log(message + "\n" + "Time: " + (performance.now() - basetime) + "ms");
}

// ----------- INITIALIZATION ------------
// create new graph and hide it until user uploads a file
const PAIRWISE_GRAPH = new Graph(PAIRWISE_GRAPH_CANVAS, PAIRWISE_GRAPH_CONFIG);
PAIRWISE_GRAPH_CANVAS.style.display = "none";
// show first graph element
document.getElementById('graph-element-0').classList.remove('d-none')
updateGraphElement();
// update form step
updateForm();
updateThresholdLabel();

const clusterPiGraph = ForceGraph();
clusterPiGraph(document.getElementById("cluster-pi-graph"))
    .width(0.65 * window.innerWidth)
    .d3Force('charge', d3.forceManyBody().strength(0.5))
    .d3Force('collide', d3.forceCollide(node => node.val * 1.3))
    .d3Force('center', d3.forceCenter(0.65 * window.innerWidth / 2, window.innerHeight / 2))
    .enableNodeDrag(false)
    .nodeCanvasObject((node, ctx, globalScale) => {
        ctx.fillStyle = "#a3a3a3"
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI);
        ctx.fill();
        // set font color to white
        ctx.fillStyle = "#ffffff"
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // adjust font size to node size
        ctx.font = `${Math.round(node.val / 2)}px monospace`;
        // create label of node.count
        ctx.fillText(node.count, node.x, node.y);
    })

clusterPiGraph.centerAt(0.65 * window.innerWidth / 2, window.innerHeight / 2)