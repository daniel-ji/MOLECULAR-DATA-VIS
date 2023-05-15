import React, { Component } from 'react'

export class AdjustIntervals extends Component {
    constructor(props) {
        super(props)

        this.state = {
            intervals: [],
        }
    }

    componentDidMount() {
        this.renderIntervals();
    }

    selectCategory = (e) => {
        this.renderIntervals();
    }

    // TODO: handle when interval is used in a view, or when interval is out of bounds / not between other intervals
    addInterval = (index) => {
        const intervals = this.getIntervals();
        intervals.splice(index + 1, 0, (intervals[index] + intervals[index + 1]) / 2);
        this.renderIntervals();
        this.props.setDemoData({ categories: new Map(this.props.data.demographicData.categories) })
    }

    setInterval = (index, value) => {
        const intervals = this.getIntervals();
        intervals[index] = parseFloat(value);
        this.renderIntervals();
        this.props.setDemoData({ categories: new Map(this.props.data.demographicData.categories) })
    }

    deleteInterval = (index) => {
        const intervals = this.getIntervals();
        intervals.splice(index, 1);
        this.renderIntervals();
        this.props.setDemoData({ categories: new Map(this.props.data.demographicData.categories) })
    }

    getIntervals = () => {
        const category = document.getElementById("number-category-intervals-select").value;
        return this.props.data.demographicData.categories.get(category).intervals;
    }

    renderIntervals = () => {
        const category = document.getElementById("number-category-intervals-select").value;

        if (!category) {
            return;
        }

        const intervals = this.props.data.demographicData.categories.get(category).intervals;

        this.setState({
            intervals: intervals.map((interval, index) => {
                return (
                    <div key={index} className="d-flex align-items-center">
                        <input type="number" step="0.01" className="form-control my-3" value={parseFloat(interval.toFixed(2))} onChange={(e) => this.setInterval(index, e.target.value)} />
                        {index !== 0 && index !== intervals.length - 1 ? <button className="btn btn-danger ms-4" onClick={() => this.deleteInterval(index)}><i className="bi bi-trash"></i></button> : null}
                        {index !== intervals.length - 1 ? <button className="btn btn-primary ms-4" onClick={() => this.addInterval(index)}><i className="bi bi-plus"></i></button> : null}
                    </div>
                )
            })
        })

        // add event listener to update intervals
        // input.addEventListener("input", (e) => {
        //     const value = parseFloat(e.target.value);
        //     if (value <= intervals[j - 1] || value >= intervals[j + 1]) {
        //         // error, add red border
        //         input.classList.add("border-danger");
        //         return;
        //     }

        //     // remove red border if any
        //     input.classList.remove("border-danger");
        //     intervals[j] = parseFloat(e.target.value);
        //     updateNodeView(categoryIndex);
        // })
    }

    render() {
        return (
            <div id="adjust-intervals" className="input-step">
                <h3 className="w-100 text-center mb-5">Step 2: Adjust Quantitative Demographic Data Intervals</h3>

                <h4 className="text-center">Quantitative Categories</h4>
                <select id="number-category-intervals-select" className="form-select mt-3 mb-5" onChange={this.selectCategory}>{
                    [...this.props.data.demographicData.categories.keys()].map((category) => {
                        if (this.props.data.demographicData.categories.get(category).type !== "number") {
                            return;
                        }

                        return <option key={category} value={category}>{category}</option>
                    })
                }</select>

                <div id="number-category-list-container" className="mb-5">
                    <h4 className="text-center">Intervals</h4>
                    {this.state.intervals}
                </div>
            </div>
        )
    }
}

export default AdjustIntervals