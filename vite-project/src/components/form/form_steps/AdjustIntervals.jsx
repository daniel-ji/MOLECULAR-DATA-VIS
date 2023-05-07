import React, { Component } from 'react'

export class AdjustIntervals extends Component {
    render() {
        return (
            <div id="adjust-intervals" className="input-step">
                <h3 className="w-100 text-center mb-5">Step 2: Adjust Quantitative Demographic Data Intervals</h3>

                <h4 className="text-center">Quantitative Categories</h4>
                <select id="number-category-intervals-select" className="form-select mt-3 mb-5">    
                </select>

                <div id="number-category-list-container">
                    <h4 className="text-center">Intervals</h4>
                </div>
            </div>
        )
    }
}

export default AdjustIntervals