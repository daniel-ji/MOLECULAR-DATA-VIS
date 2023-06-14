import { React, Component, Fragment } from 'react'

import { INTERVAL_DECIMAL_PRECISION, INVALID_INTERVALS_TEXT } from '../../../constants';

/**
 * Component for adjusting intervals for quantitative demographic data categories.
 * 
 * STEP VALID CONDITION: All intervals must be valid.
 */
export class AdjustIntervals extends Component {
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

    /**
     * When the checkStepValidFlag is set to true, check if all intervals are valid,
     * to see if user can move on to previous / next step.
     */
    componentDidUpdate(prevProps, prevState) {
        if (!prevProps.checkStepValidFlag && this.props.checkStepValidFlag) {
            const valid = this.getAllIntervalsValid();
            this.props.setStepValid(valid);
            if (valid) {
                if (this.props.alertMessage?.messageText === INVALID_INTERVALS_TEXT) {
                    this.props.setAlertMessage(undefined);
                }
            } else {
                this.props.setAlertMessage({
                    messageText: INVALID_INTERVALS_TEXT,
                    messageType: "danger",
                });
            }
        }
    }

    /**
     * Select a quantatitve demographic data category from the dropdown menu.
     */
    selectCategory = () => {
        if (!this.getAllIntervalsValid()) {
            return;
        }

        this.getIntervals(this.renderIntervals)
    }

    /**
     * Add interval after provided index.
     */
    addInterval = (index) => {
        const intervals = this.state.intervals;

        const newIntervals = [
            ...intervals.slice(0, index + 1),
            {
                interval: '',
                valid: false
            },
            ...intervals.slice(index + 1)
        ]

        this.setState({ intervals: newIntervals }, this.renderIntervals)
    }

    /**
     * Get intervals for the selected demographic data category.
     */
    getIntervals = (callback) => {
        if (this.props.data.demographicData.categories.size === 0) {
            return;
        }

        const category = document.getElementById("number-category-intervals-select").value;
        this.setState({ intervals: this.props.data.demographicData.categories.get(category).intervals }, callback);
    }

    /**
     * Set provided interval. 
     * @param {*} index Index of interval to set
     * @param {Number} value Value to set interval to
     */
    setInterval = (index, value) => {
        const intervals = this.state.intervals;
        const newIntervals = [...intervals];
        newIntervals[index] = {
            interval: isNaN(value) ? '' : parseFloat(value),
            valid: true
        };

        this.setState({ intervals: newIntervals }, () => {
            this.updateIntervalsValid(() => {
                if (this.getAllIntervalsValid() && this.props.alertMessage?.messageText === INVALID_INTERVALS_TEXT) {
                    this.props.setAlertMessage(undefined);
                }
                this.props.setIntervals(document.getElementById("number-category-intervals-select").value, this.state.intervals)
                this.renderIntervals();
            });
        })
    }

    /**
     * Delete interval at provided index.
     * @param {*} index Index of interval to delete
    */
    deleteInterval = (index) => {
        const intervals = this.state.intervals;
        const newIntervals = [
            ...intervals.slice(0, index),
            ...intervals.slice(index + 1)
        ];

        this.props.setIntervals(document.getElementById("number-category-intervals-select").value, newIntervals)
        this.setState({ intervals: newIntervals }, () => {
            if (this.getAllIntervalsValid() && this.props.alertMessage?.messageText === INVALID_INTERVALS_TEXT) {
                this.props.setAlertMessage(undefined);
            }
            this.renderIntervals();
        })
    }

    /**
     * Render intervals.
    */
    renderIntervals = () => {
        // only render if category exists / is selected
        const category = document.getElementById("number-category-intervals-select").value;

        if (!category) {
            return;
        }

        const intervals = this.state.intervals;

        this.setState({
            intervalElements: intervals.map((intervalsObject, index) => {
                const interval = intervalsObject.interval;
                const intervalValue = interval === '' ? '' : parseFloat(intervalsObject.interval.toFixed(INTERVAL_DECIMAL_PRECISION));
                const valid = intervalsObject.valid;

                return (
                    <div key={index} className="d-flex align-items-center">
                        <input type="number" step="0.01" className={`form-control my-3 ${!valid && 'is-invalid'}`} value={intervalValue} onChange={(e) => this.setInterval(index, e.target.value)} />
                        {index !== 0 && index !== intervals.length - 1 ? <button className="btn btn-danger ms-4" onClick={() => this.deleteInterval(index)}><i className="bi bi-trash"></i></button> : null}
                        {index !== intervals.length - 1 ? <button className="btn btn-primary ms-4" onClick={() => this.addInterval(index)}><i className="bi bi-plus"></i></button> : null}
                    </div>
                )
            })
        })
    }

    /**
    * @returns Whether or not all intervals are valid
    */
    getAllIntervalsValid = () => {
        return (this.state.intervals.reduce((acc, interval) => acc && interval.valid, true))
    }

    /**
     * Updates intervals' validity.
     */
    updateIntervalsValid = (callback) => {
        const intervals = this.state.intervals;
        const newIntervals = intervals.map((intervalObject, index) => {
            let valid = true;
            let value = intervalObject.interval;

            // empty interval is invalid
            if (value === "") {
                valid = false;
            }

            // check if interval is between other intervals, given that the other intervals are not empty
            if (index !== 0 && intervals[index - 1].interval !== '' && value <= intervals[index - 1].interval) {
                valid = false;
            }
            if (index !== intervals.length - 1 && intervals[index + 1].interval !== '' && value >= intervals[index + 1].interval) {
                valid = false;
            }

            return {
                ...intervalObject,
                valid
            }
        })

        this.setState({ intervals: newIntervals }, callback)
    }

    render() {
        return (
            <div id="adjust-intervals" className="input-step">
                <h3 className="w-100 text-center mb-5">Step 2: Adjust Quantitative Demographic Data Intervals</h3>

                {this.state.intervals.length === 0 && <p className="text-warning text-center">No quantitative categories found.</p>}

                <div className={`${this.state.intervals.length === 0 && "d-none"}`}>
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
            </div>
        )
    }
}

export default AdjustIntervals