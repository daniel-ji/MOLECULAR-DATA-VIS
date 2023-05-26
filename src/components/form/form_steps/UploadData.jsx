import React from 'react'

import FormStep from './FormStep'

import { MAX_THRESHOLD, MAX_INDIVIDUAL_CATEGORIES, READ_FILE_ASYNC, LOG, CHUNK_SIZE } from '../../../constants'

export class UploadData extends FormStep {
    constructor(props) {
        super(props)

        this.state = {
            thresholdTimeout: undefined,
            uploadSuccess: false,
            uploadLoading: false,
        }
    }

    updateThreshold = (e) => {
        this.props.setThreshold(e.target.value);
        const thresholdValid = e.target.value !== "" && e.target.value >= 0 && e.target.value <= MAX_THRESHOLD;
        this.props.setThresholdValid(thresholdValid);
        if (thresholdValid) {
            clearTimeout(this.state.thresholdTimeout);
            this.setState({
                thresholdTimeout: setTimeout(() => {
                    if (this.props.thresholdValid) {
                        this.props.updateDiagrams();
                        this.props.nodeGraph.fitView();
                    }
                }, 500)
            })
        }
    }

    updatePairwiseFile = (e) => {
        this.setState({ uploadSuccess: false, uploadLoading: false })
        document.getElementById("upload-pairwise-file").value = "";
    }

    updateDataFile = (e) => {
        this.setState({ uploadSuccess: false, uploadLoading: false });
        document.getElementById("upload-data-file").value = "";
    }

    readData = async () => {
        if (!document.getElementById("upload-pairwise-file").files[0]) {
            alert("Please select a pairwise distances file.");
            return;
        }

        // update status
        this.setState({ uploadLoading: true, uploadSuccess: false });

        // reset data, get individual demographic data, and get pairwise distances (actual node / link data)
        this.props.resetData();
        await this.getDemoData();
        await this.getPairwiseDistances(() => {
            this.props.updateDiagrams();
            this.setState({ uploadLoading: false, uploadSuccess: true });
        });

        // update status
        this.setState({ uploadLoading: false, uploadSuccess: true });
    }

    getDemoData = async (callback) => {
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
        const text = await READ_FILE_ASYNC(file, true)
        const delimiter = file.name.endsWith(".csv") ? "," : "\t";

        const lines = text.split("\n")
        // first line is categories
        const categories = lines[0].split(delimiter);
        // edge case to remove empty line at end of file
        if (lines[lines.length - 1] === "") {
            lines.pop();
        }

        const demoCategories = new Map();
        // create new category for each column
        for (let i = 0; i < categories.length; i++) {
            demoCategories.set(categories[i], { type: 'string', elements: new Set() })
        }

        // validation by checking number of data entry columns
        if (this.props.size < 2 || demoCategories.size > MAX_INDIVIDUAL_CATEGORIES) {
            alert("Invalid supplementary data file.")
            return;
        }

        LOG("Parsing node supplementary data...")

        const demoData = new Map();
        // create individual demographic data
        for (let i = 1; i < lines.length; i++) {
            const dataEntry = lines[i].split(delimiter);
            // validation by checking if number of data entry columns matches number of categories
            if (dataEntry.length !== demoCategories.size) {
                alert("Invalid supplementary data file.")
                return;
            }

            // create object for each data entry, corresponds to a node
            const dataEntryObject = {};

            for (let j = 1; j < categories.length; j++) {
                const demoCategory = demoCategories.get(categories[j]);
                if (!isNaN(dataEntry[j])) {
                    demoCategory.type = 'number';
                    demoCategory.intervals = [];
                }

                if (demoCategory.type === 'string') {
                    dataEntryObject[categories[j]] = dataEntry[j];
                    demoCategory.elements.add(dataEntry[j])
                } else {
                    dataEntryObject[categories[j]] = parseFloat(dataEntry[j]);
                    demoCategory.elements.add(parseFloat(dataEntry[j]))
                }
            }

            // add data entry to individual demographic data
            demoData.set(dataEntry[0], dataEntryObject)
        }

        // sort categories
        for (let i = 0; i < categories.length; i++) {
            const sortedElements = [...demoCategories.get(categories[i]).elements.values()]

            if (demoCategories.get(categories[i]).type === 'string') {
                sortedElements.sort()
            } else {
                sortedElements.sort((a, b) => a - b)
            }

            demoCategories.get(categories[i]).elements = new Set(sortedElements)
        }

        // create initial 5 categories for quantitative data
        const demoCategoriesKeys = [...demoCategories.keys()];
        for (let i = 0; i < demoCategoriesKeys.length; i++) {
            if (demoCategories.get(demoCategoriesKeys[i]).type !== 'number') {
                continue;
            }

            const values = [...demoCategories.get(demoCategoriesKeys[i]).elements]
            // create intervals for numerical data (default of 5 even splits)
            const min = values[0];
            const max = values[values.length - 1];
            const step = (max - min) / 5;
            for (let j = min; j < max + step; j += step) {
                demoCategories.get(demoCategoriesKeys[i]).intervals.push(j);
            }

            // delete elements
            demoCategories.get(demoCategoriesKeys[i]).elements = undefined;
        }

        // update state
        this.props.setData({ demographicData: { data: demoData, categories: demoCategories } }, callback);

        // // generate quantitative data intervals
        // generateQuantIntervals();

        LOG("Done parsing node supplementary data...")
    }

    getPairwiseDistances = async (callback) => {
        const allLinks = new Map();
        const allNodes = new Map();
        const allNodesArray = [];

        const file = document.getElementById("upload-pairwise-file").files[0];
        console.log("\n\n\n-------- READING FILE -------- \n\n\n")
        LOG("Reading file...")

        const array = await READ_FILE_ASYNC(file);
        LOG("Done reading file...")

        const decoder = new TextDecoder("utf-8");
        // for when the chunk_size split doesn't match a full line
        let splitString = "";

        LOG("Parsing file...")
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
                if (j === lines.length - 1 && lines[j].length > 0 && columns.length < 3) {
                    // set the splitString to the last line
                    splitString = line;
                    continue;
                }

                // skip empty lines / lines with missing data
                if (columns[0] === undefined || columns[0] === "" || columns[1] === undefined || columns[1] === "") {
                    continue;
                }

                // add nodes to set of all nodes
                if (!allNodes.has(columns[0])) {
                    allNodesArray.push(columns[0]);
                    allNodes.set(columns[0], allNodesArray.length - 1);
                }
                if (!allNodes.has(columns[1])) {
                    allNodesArray.push(columns[1]);
                    allNodes.set(columns[1], allNodesArray.length - 1);
                }

                // add to map of all pairwise distances if below threshold
                if (parseFloat(columns[2]) < MAX_THRESHOLD) {
                    const min = columns[0].localeCompare(columns[1]) < 0 ? columns[0] : columns[1];
                    const max = columns[0].localeCompare(columns[1]) < 0 ? columns[1] : columns[0];
                    allLinks.set(min + "-" + max, {
                        id: min + "-" + max,
                        source: columns[0],
                        sourceNumericID: allNodes.get(columns[0]),
                        target: columns[1],
                        targetNumericID: allNodes.get(columns[1]),
                        value: parseFloat(columns[2]),
                    })
                }
            }
        }

        this.props.setData({ allLinks, allNodes }, callback)

        LOG("Done parsing file...")
    }

    render() {
        return (
            <div id="upload-data" className="input-step">
                <h3 className="w-100 text-center mb-5">Step 1: Provide Data</h3>

                <div id="pairwise-threshold" className="mb-3">
                    <label htmlFor="threshold-select" id="threshold-label" className="form-label w-100 text-center">Maximum Pairwise Distance Threshold Level: {this.props.thresholdValid ? parseFloat(this.props.threshold).toFixed(4) : ''}</label>
                    <div className="input-group">
                        <input type="number" className={`form-control ${!this.props.thresholdValid && 'is-invalid'}`} id="threshold-select"
                            aria-describedby="threshold-range-hint" min="0" max="0.05" step="0.0025" value={this.props.threshold} onInput={this.updateThreshold} />
                    </div>
                    <div className="form-text" id="threshold-range-hint">Threshold Range: 0 to {MAX_THRESHOLD}</div>
                </div>

                <label htmlFor="upload-pairwise-file" className="form-label w-100 text-center">Upload pairwise distances
                    file: <i className="bi bi-asterisk text-danger"></i></label>
                <input type="file" className="form-control" id="upload-pairwise-file" onClick={this.updatePairwiseFile} />

                <label htmlFor="upload-data-file" className="form-label w-100 text-center mt-3">Upload supplementary data
                    file:</label>
                <input type="file" className="form-control" id="upload-data-file" onClick={this.updateDataFile} />

                <button id="read-file" className="btn btn-primary mt-3" onClick={this.readData}>Submit</button>
                <p className={`mt-3 text-success text-center ${!this.state.uploadLoading && !this.state.uploadSuccess && 'd-none'}`} id="upload-success">
                    {this.state.uploadLoading && "Loading..."}
                    {this.state.uploadSuccess && "Done!"}
                </p>

                <p className="mt-3"><i className="bi bi-asterisk text-danger"></i> Required</p>
            </div>
        )
    }
}

export default UploadData