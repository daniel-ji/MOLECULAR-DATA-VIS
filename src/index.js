import { Graph } from '@cosmograph/cosmos'
import './styles/index.scss'

// ----------- GLOBAL VARIABLES ------------
// size of chunks to read from uploaded file
const CHUNK_SIZE = 1024 * 1024 * 10;
// threshold for pairwise distances to be added to map
const threshold = 0.015;
// set of all sequences (nodes)
const sequences = new Set(); 
// for logging time elapsed
let previousTime = performance.now();

// ----------- INITIALIZATION ------------
const PAIRWISE_GRAPH_CANVAS = document.getElementById('pairwise-graph');
const PAIRWISE_GRAPH_CONFIG = {
    backgroundColor: "#ffffff",
    nodeColor: "#000000",
    linkColor: "#7a7a7a",
    linkArrows: false,
    randomSeed: 0,
    simulation: {
        repulsion: 2,
        repulsionFromMouse: 0,
        linkDistRandomVariationRange: [0.5, 2],
        friction: 1,
        linkDistance: 50,
        gravity: 0.1,
    }
}

const data = {
    nodes: [],
    links: [],
}

const PAIRWISE_GRAPH = new Graph(PAIRWISE_GRAPH_CANVAS, PAIRWISE_GRAPH_CONFIG);
PAIRWISE_GRAPH_CANVAS.style.display = "none";

document.getElementById("read-file").addEventListener("click", async () => {
    if (!document.getElementById("upload-file").files[0]) {
        alert("Please select a file");
        return;
    }

    await getPairwiseDistances();
    PAIRWISE_GRAPH_CANVAS.style.display = "block";
})


// ----------- PAIRWISE DISTANCE MAP GENERATION ------------

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

            // add to set of all sequences
            if (!sequences.has(columns[0])) {
                sequences.add(columns[0]);
                data.nodes.push({id: columns[0]});
            }

            if (!sequences.has(columns[1])) {
                sequences.add(columns[1]);
                data.nodes.push({id: columns[1]});
            }

            // add to map of all pairwise distances if below threshold
            if (parseFloat(columns[2]) < threshold) {
                data.links.push({
                    source: columns[0],
                    target: columns[1],
                    value: parseFloat(columns[2]),
                })
            }
        }
    }
    log("Done parsing file...")
    PAIRWISE_GRAPH.setData(data.nodes, data.links)
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

// ----------- GENERAL HELPER FUNCTIONS ------------ 

const log = (message, showElapsed=true) => {
    console.log(message);
    showElapsed && console.log("Time elapsed: " + (performance.now() - previousTime) + "ms")
    previousTime = performance.now();
}