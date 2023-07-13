export const CHUNK_SIZE = 1024 * 1024 * 10;
export const MAX_THRESHOLD = 1;
export const MAX_INDIVIDUAL_CATEGORIES = 255;
export const CALCULATE_ASSORT_PY = "./python/calculate_stats.py";
export const FORM_STEPS = 4;
export const DIAGRAMS_COUNT = 5;

export const DEFAULT_DIAGRAM_WIDTH = 0.6;
export const DEFAULT_SLIDER_WIDTH = 24;
export const SLIDER_BOUNDS = [0.3, 0.7];

export const INVALID_INTERVALS_TEXT = "Please enter valid intervals.";
export const INVALID_PAIRWISE_FILE_TEXT = "Please upload and submit a valid pairwise distance file.";
export const INVALID_DEMOGRAPHIC_FILE_TEXT = "Please upload and submit a valid demographic file.";

export const DATE_NA_VALUE = "0000-00-00";
export const NUMBER_NA_VALUE = -1;
export const STRING_NA_VALUE = "NA";

export const DEFAULT_CLUSTER_INSPECT_ICON = "bi-arrow-down-up";

export const INTERVAL_DECIMAL_PRECISION = 4;

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
	zipCodeData: new Map(), // zip code -> {individualIDs: new Set(individual IDs), clusterIDs: new Map(clusterID -> count)} 
	stats: {
		clusterMedian: 0,
		clusterMean: 0,
		assortativity: 0,
		transitivity: 0,
		triangleCount: 0,
		meanPairwiseDistance: 0,
		medianPairwiseDistance: 0,
		meanNodeDegree: 0,
		medianNodeDegree: 0,
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
	nodeSize: (node) => {
		return node.selected ? 12 : (node.color ? 9 : 7);
	},
	linkColor: "#dedede",
	linkArrows: false,
	linkWidth: 0.2,
	linkVisibilityMinTransparency: 1,
	highlightedNodeRingColor: "#0257c7",
	randomSeed: 0,
	simulation: {
		repulsion: 4,
		repulsionFromMouse: 0,
		linkDistRandomVariationRange: [1, 1],
		scaleNodesOnZoom: true,
		friction: 2,
		linkDistance: 50,
		gravity: 0.12,
		decay: 99999999,
		linkSpring: 0.1,
	},
}

export const DEFAULT_VIEW_COLORS = [
	"#5073cc",
	"#b1e632",
	"#270fe2",
	"#fcd107",
	"#fd8f2f",
	"#1eacc9",
	"#fe2b1c",
	"#658114",
	"#846dff",
	"#a27f27",
	"#40655e",
	"#df2a69",
	"#0df38f",
	"#e03cc2",
	"#51f310",
	"#761e7e",
	"#aae3a4",
	"#943112",
	"#21a645",
	"#eca2d5"
];

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

export const GET_INDIVIDUAL_ID = (id) => {
	if (id === undefined) return undefined;

	if (id.includes("_")) {
		return id.split("_")[0];
	}

	if (id.includes('|')) {
		return id.split('|')[1];
	}

	return id;
}

let basetime = performance.now();
export const LOG = (message) => {
	if (performance.now() - basetime > 10000) {
		basetime = performance.now();
	}

	console.log(message + "\n" + "Time: " + (performance.now() - basetime) + "ms");
}