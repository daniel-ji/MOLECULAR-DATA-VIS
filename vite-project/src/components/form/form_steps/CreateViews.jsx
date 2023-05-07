import React, { Component } from 'react'

export class CreateViews extends Component {
    render() {
        return (
            <div id="create-views" className="input-step">
                <h3 className="w-100 text-center mb-5">Step 3: Create Node Views</h3>

                <div id="views-container">
                </div>
                <div id="select-view-color" className="w-100 mt-4">
                    <label htmlFor="view-color">Select View Color:</label>
                    <input type="color" className="form-control form-control-color ms-3 border-secondary" id="view-color" value="#198754"
                        title="Choose your color" />
                </div>
                <div id="create-view">
                    <button className="btn btn-primary mt-3 w-100" id="create-view-button">Create View</button>
                </div>

                <h5 className="w-100 mt-5 mb-3 text-center">Created Node Views:</h5>
                <div id="view-entry-container" className="mb-5">
                </div>
            </div>
        )
    }
}

export default CreateViews