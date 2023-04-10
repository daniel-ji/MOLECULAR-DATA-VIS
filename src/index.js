import { Graph } from '@cosmograph/cosmos'
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
    linkColor: "#a3a3a3",
    linkArrows: false,
    linkWidth: 0.2,
    linkVisibilityMinTransparency: 1,
    randomSeed: 0,
    events: {
        onClick: () => {
            autoZoom = false;
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
    PAIRWISE_GRAPH.setData(data.nodes, data.links)
    PAIRWISE_GRAPH_CANVAS.style.display = "block";
    // PAIRWISE_GRAPH.setData(data.nodes, getClusters());

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
const getClusters = () => {
    log("Generating clusters...")
    const nodes = new Set(data.nodes);
    const clusters = [];
    const clusterLinks = [];

    while (nodes.size > 0) {
        const cluster = new Set();
        const starterNode = nodes.values().next().value;
        let previousNode = starterNode;
        cluster.add(starterNode);
        nodes.delete(starterNode)
        const queue = PAIRWISE_GRAPH.getAdjacentNodes(starterNode.id);
        while (queue.length > 0) {
            const node = queue.pop();
            if (!cluster.has(node)) {
                cluster.add(node);
                clusterLinks.push({
                    source: previousNode.id,
                    target: starterNode.id,
                })
                previousNode = node;
                nodes.delete(node);
                queue.push(...PAIRWISE_GRAPH.getAdjacentNodes(node.id));
            }
        }
        clusters.push(cluster);
    }

    log("Done generating clusters...")
    return clusterLinks;
}

// ----------- THRESHOLD SLIDER HANDLING ------------

// timeout for updating graph after threshold slider is adjusted (effectively a throttle)
let adjustingTimeout = null;
// auto zoom to fit view
let autoZoom = true;

document.getElementById("threshold-select").addEventListener("input", (e) => {
    threshold = parseFloat(e.target.value);
    document.getElementById("threshold-label").innerHTML = "Threshold Level: " + threshold.toFixed(4);
        
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
                data.nodes.push({id: link.source});
            }

            if (!sequences.has(link.target)) {
                sequences.add(link.target);
                data.nodes.push({id: link.target});
            }

            return true;
        }

        return false;
    });
    // data.nodes = data.nodes.filter((node) => data.links.some((link) => link.source === node.id || link.target === node.id));
    PAIRWISE_GRAPH.setData(data.nodes, data.links)
    setTimeout(() => {
        autoZoom && PAIRWISE_GRAPH.fitView()
    }, 1500)
    log("Done updating graph...")
}

// ----------- GENERAL HELPER FUNCTIONS ------------ 
// for logging time elapsed
let previousTime = performance.now();

const log = (message, showElapsed=true) => {
    console.log(message);
    showElapsed && console.log("Time elapsed: " + (performance.now() - previousTime) + "ms")
    previousTime = performance.now();
}