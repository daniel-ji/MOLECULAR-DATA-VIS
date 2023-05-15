import React, { Component } from 'react'

export class CreateViews extends Component {
    constructor(props) {
        super(props)

        this.state = {
            views: [],
            viewSelectColor: "#198754",
        }
    }

    componentDidMount() {
        this.renderViews();
    }

    setViewSelectColor = (e) => {
        this.setState({ viewSelectColor: e.target.value });
    }
    
    setViewColor = (viewID, color) => {
        const nodeViews = new Map(this.props.data.nodeViews);
        nodeViews.get(viewID).color = color;
        this.props.setData({ nodeViews })
    }

    deleteView = (viewID) => {
        const nodeViews = new Map(this.props.data.nodeViews);
        nodeViews.delete(viewID);
        this.props.setData({ nodeViews })
    }

    renderViews = () => {
        const categories = [...this.props.data.demographicData.categories.keys()];

        const views = categories.map((categoryKey, index) => {
            if (index === 0) {
                return;
            }

            const category = this.props.data.demographicData.categories.get(categoryKey);

            let options = [];

            if (category.intervals) {
                options = category.intervals.map((value, index) => {
                    if (index === category.intervals.length - 1) {
                        return;
                    }

                    return <option key={index} value={value}>{value.toFixed(4) + " - " + category.intervals[index + 1].toFixed(4)}</option>
                });
            } else {
                options = [...category.elements.values()].map((value, index) => {
                    return <option key={index} value={value}>{value}</option>
                });
            }

            // add "All" option
            options.unshift(<option key={-1} value="All">All</option>);

            return <div key={index} className="pairwise-view mb-3 w-100">
                <label htmlFor={"view-category-select-" + index} className="form-label w-100 text-center">{"View by " + categoryKey.toLowerCase() + ": "}</label>
                <select id={"view-category-select-" + index} className="form-select view-category-select" category={categoryKey}>
                    {options}
                </select>
            </div>;
        })

        this.setState({ views })
    }

    createView = () => {
        // ID is based on selected categories
        let viewID = "";
        // view name is based on selected categories, excluding "All", user-facing name
        let viewName = "";
        // view values are based on selected categories, used to filter nodes
        let viewData = [];
        // loop through categories and create ID based on selected 
        const viewCategories = document.getElementsByClassName("view-category-select");
        for (let i = 0; i < viewCategories.length; i++) {
            // add selected index to ID
            viewID += viewCategories[i].selectedIndex + (i === viewCategories.length - 1 ? "" : "-");
            // add selected value to view data
            viewData.push(viewCategories[i].value)

            // add selected value to view name if not "All" (index 0)
            if (viewCategories[i].selectedIndex !== 0) {
                // get type of input (intervals or elements)
                const category = this.props.data.demographicData.categories.get(viewCategories[i].getAttribute("category"));
                // if intervals, add interval range to view name
                if (category.intervals) {
                    viewName += viewCategories[i].getAttribute("category") + ": " +
                        category.intervals[viewCategories[i].selectedIndex - 1].toFixed(4) + "-" +
                        category.intervals[viewCategories[i].selectedIndex].toFixed(4) + ", ";
                } else {
                    viewName += viewCategories[i].getAttribute("category") + ": " + viewCategories[i].value + ", ";
                }
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

        this.props.createView(viewID, {
            color: document.getElementById("view-color").value,
            name: viewName,
            values: viewData
        })
    }

    render() {
        return (
            <div id="create-views" className="input-step">
                <h3 className="w-100 text-center mb-5">Step 3: Create Node Views</h3>

                <div id="views-container">{this.state.views}</div>

                <div id="select-view-color" className="w-100 mt-4">
                    <label htmlFor="view-color">Select View Color:</label>
                    <input type="color" className="form-control form-control-color ms-3 border-secondary" id="view-color" value={this.state.viewSelectColor}
                        onChange={this.setViewSelectColor} title="Choose your color" />
                </div>
                <div id="create-view">
                    <button className="btn btn-primary mt-3 w-100" id="create-view-button" onClick={this.createView}>Create View</button>
                </div>

                <h5 className="w-100 mt-5 mb-3 text-center">Created Node Views:</h5>
                <div id="view-entry-container" className="mb-5">{
                    [...this.props.data.nodeViews.keys()].map((viewID, index) => {
                        const viewData = this.props.data.nodeViews.get(viewID);

                        return (
                            <div className="view-entry my-3 w-100" id={`view-entry-${viewID}`} key={viewID}>
                                <div className="view-entry-preview w-100" id={`view-entry-preview-${viewID}`}>
                                    <button className="btn btn-secondary view-entry-button" id={`view-entry-button-${viewID}`}>{viewData.name}</button>
                                    <input type="color" className="view-entry-color form-control form-control-color border-secondary" id={`view-entry-color-${viewID}`} value={viewData.color} 
                                        onChange={(e) => this.setViewColor(viewID, e.target.value)} />
                                    <button className="btn btn-danger view-entry-delete" id={`view-entry-delete-${viewID}`} onClick={() => this.deleteView(viewID)}><i className="bi bi-trash" /></button>
                                </div>
                            </div>);
                    })
                }</div>
            </div>
        )
    }
}

export default CreateViews