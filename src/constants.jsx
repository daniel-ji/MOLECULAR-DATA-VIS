export const CHUNK_SIZE = 1024 * 1024 * 10;
export const MAX_THRESHOLD = 0.05;
export const MAX_INDIVIDUAL_CATEGORIES = 255;
export const CALCULATE_ASSORT_PY = "./python/calculate_stats.py";
export const FORM_STEPS = 4;
export const DIAGRAMS_COUNT = 4;

export const DEFAULT_DATA = {
    nodes: [],
    nodesMap: new Map(),
    allNodes: new Map(),
    nodeViews: new Map(),
    links: [],
    linksMap: new Map(),
    allLinks: new Map(),
    clusterData: {
        clusterDistribution: new Map(),
        clusters: [],
        clusterSizes: [],
    },
    stats: {
        clusterMedian: 0,
        clusterMean: 0,
        assortativity: 0,
        transitivity: 0,
        triangleCount: 0,
        meanPairwiseDistance: 0,
        medianPairwiseDistance: 0,
    },
    demographicData: {
        categories: new Map(), 
        data: new Map(),
    }
};

export const NODE_GRAPH_CANVAS_ID = "node-graph";
export const NODE_GRAPH_BASE_CONFIG = {
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
    simulation: {
        repulsion: 2,
        repulsionFromMouse: 0,
        linkDistRandomVariationRange: [1, 1],
        scaleNodesOnZoom: true,
        friction: 1,
        linkDistance: 50,
        gravity: 0.12,
        decay: 99999999,
        linkSpring: 0.1,
    },
}

export const READ_FILE_ASYNC = async (file, asText = false) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        reader.onerror = reject;
        asText ? reader.readAsText(file) : reader.readAsArrayBuffer(file);
    })
}

let basetime = performance.now();
export const LOG = (message) => {
    if (performance.now() - basetime > 10000) {
        basetime = performance.now();
    }

    console.log(message + "\n" + "Time: " + (performance.now() - basetime) + "ms");
}