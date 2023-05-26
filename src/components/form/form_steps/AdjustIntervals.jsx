import React from 'react'

import FormStep from './FormStep'

export class AdjustIntervals extends FormStep {
    constructor(props) {
        super(props)

        this.state = {
            intervals: [],
            intervalElements: [],
        }
    }

    componentDidMount() {
        this.getIntervals(this.renderIntervals)
    }

    // @Override
    checkStepValidity = () => {
        return false;
    }

    selectCategory = () => {
        this.getIntervals(this.renderIntervals)
    }

    // TODO: handle when interval is used in a view, or when interval is out of bounds / not between other intervals
    addInterval = (index) => {
        const intervals = this.state.intervals;
        const newIntervals = [
            [...intervals.slice(0, index + 1)],
            {
                interval: (intervals[index] + intervals[index + 1]) / 2,
                valid: true
            },
            [...intervals.slice(index + 1)]
        ]

        this.setState({ intervals: newIntervals }, this.renderIntervals)
    }

    setInterval = (index, value) => {
        const intervals = this.state.intervals;
        const newIntervals = [...intervals];
        newIntervals[index] = {
            interval: parseFloat(value),
            valid: true
        };

        if (index !== 0 && newIntervals[index].interval <= newIntervals[index - 1].interval) {
            newIntervals[index].valid = false;
        }

        if (index !== newIntervals.length - 1 && newIntervals[index].interval >= newIntervals[index + 1].interval) {
            newIntervals[index].valid = false;
        }

        this.setState({ intervals: newIntervals }, this.renderIntervals)
    }

    deleteInterval = (index) => {
        const intervals = this.state.intervals;
        const newIntervals = [
            [...intervals.slice(0, index)],
            [...intervals.slice(index + 1)]
        ];

        this.setState({ intervals: newIntervals }, this.renderIntervals)
    }

    getIntervals = (callback) => {
        const category = document.getElementById("number-category-intervals-select").value;
        this.setState({
            intervals: this.props.data.demographicData.categories.get(category).intervals.map(interval => {
                return {
                    interval,
                    valid: true
                }
            })
        }, callback);
    }

    renderIntervals = () => {
        const category = document.getElementById("number-category-intervals-select").value;

        if (!category) {
            return;
        }

        const intervals = this.state.intervals;
        
        this.setState({
            intervalElements: intervals.map((intervalsObject, index) => {
                const interval = intervalsObject.interval;
                const valid = intervalsObject.valid;

                return (
                    <div key={index} className="d-flex align-items-center">
                        <input type="number" step="0.01" className={`form-control my-3 ${!valid && 'is-invalid'}`} value={parseFloat(interval.toFixed(2))} onChange={(e) => this.setInterval(index, e.target.value)} />
                        {index !== 0 && index !== intervals.length - 1 ? <button className="btn btn-danger ms-4" onClick={() => this.deleteInterval(index)}><i className="bi bi-trash"></i></button> : null}
                        {index !== intervals.length - 1 ? <button className="btn btn-primary ms-4" onClick={() => this.addInterval(index)}><i className="bi bi-plus"></i></button> : null}
                    </div>
                )
            })
        })
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
                    {this.state.intervalElements}
                </div>
            </div>
        )
    }
}

export default AdjustIntervals