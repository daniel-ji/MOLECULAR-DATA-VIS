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

    renderIntervals = () => {
        const category = document.getElementById("number-category-intervals-select").value;

        if (!category) {
            return;
        }

        const intervals = this.props.data.demographicData.categories.get(category).intervals;
        console.log(intervals);

        this.setState({
            intervals: intervals.map((interval, index) => {
                return (
                    <div key={index} className="d-flex align-items-center">
                        <input type="number" step="0.01" className="form-control my-3" value={interval.toFixed(2)} />
                        {index !== 0 && index !== intervals.length - 1 ? <button className="btn btn-danger ms-4"><i className="bi bi-trash"></i></button> : null}
                        {index !== intervals.length - 1 ? <button className="btn btn-primary ms-4"><i className="bi bi-plus"></i></button> : null}
                    </div>
                )
            })
        })

        // TODO: implement
        // deleteButton.addEventListener("click", (e) => {
        //     inputContainer.remove();
        //     intervals.splice(j, 1);
        //     updateNodeView(categoryIndex);
        // })

        // addButton.addEventListener("click", (e) => {
        //     intervals.splice(j + 1, 0, (intervals[j] + intervals[j + 1]) / 2);
        //     updateNodeView(categoryIndex);
        //     generateQuantIntervalsList(listContainer, category, categoryIndex)
        // })

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