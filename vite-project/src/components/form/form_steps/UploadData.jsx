import React, { Component } from 'react'

import { MAX_THRESHOLD } from '../../constants'

export class UploadData extends Component {
    constructor(props) {
        super(props)

        this.state = {
            thresholdTimeout: undefined,
            reuploadedPairwise: true,
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
                        // TODO: change
                        recalculate = true;
                        updateData();
                    }
                }, 500)
            })
        }
    }

    updatePairwiseFile = (e) => {
        this.setState({ reuploadedPairwise: true, uploadSuccess: false, uploadLoading: false })
        document.getElementById("upload-pairwise-file").value = "";
    }

    updateDataFile = (e) => {
        this.setState({ uploadSuccess: false, uploadLoading: false });
        document.getElementById("upload-data-file").value = "";
    }

    readData = async () => {
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
    }

    render() {
        return (
            <div id="upload-data" className="input-step">
                <h3 className="w-100 text-center mb-5">Step 1: Provide Data</h3>

                <div id="pairwise-threshold" className="mb-3">
                    <label htmlFor="threshold-select" id="threshold-label" className="form-label w-100 text-center">Maximum Pairwise Distance Threshold Level: {this.props.threshold}</label>
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

                <button id="read-file" className="btn btn-primary mt-3">Submit</button>
                <p className={`mt-3 text-success text-center ${!this.state.uploadLoading && !this.state.uploadSuccess && 'd-none'}`} id="upload-success">Done!</p>

                <p className="mt-3"><i className="bi bi-asterisk text-danger"></i> Required</p>
            </div>
        )
    }
}

export default UploadData