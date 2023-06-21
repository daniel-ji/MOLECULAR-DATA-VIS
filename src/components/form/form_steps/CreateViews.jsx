import { React, Component, Fragment } from 'react'
import { DEFAULT_VIEW_COLORS, INTERVAL_DECIMAL_PRECISION } from '../../../constants';

/**
 * Component for creating views.
 * 
 * STEP VALID CONDITION: None.
 */
export class CreateViews extends Component {
	constructor(props) {
		super(props)

		this.state = {
			categoryChecked: [],
			categoryCheckboxes: [],
			views: [],
			viewSelectColor: DEFAULT_VIEW_COLORS[0],
			viewTimeout: undefined, // Throttle view color updates
		}
	}

	// Load in view creation form
	componentDidMount() {
		this.renderCategorySelect();
		this.renderViews();
	}

	componentDidUpdate(prevProps, prevState) {
		if (!prevProps.checkStepValidFlag && this.props.checkStepValidFlag) {
			this.props.setStepValid(true);
		}
	}

	// Set view color when color picker is changed (for creating new views)
	setViewSelectColor = (e) => {
		this.setState({ viewSelectColor: e.target.value });
	}

	// Set view color when color picker is changed (for editing existing views)
	setViewColor = (viewID, color) => {
		const nodeViews = new Map(this.props.data.nodeViews);
		nodeViews.get(viewID).color = color;
		this.props.setData({ nodeViews })
		clearTimeout(this.state.viewTimeout);
		this.setState({
			viewTimeout: setTimeout(this.props.updateNodesColor, 500)
		})
	}

	// Create new view
	createView = () => {
		// ID and name are based on selected categories
		let viewID = "";
		let viewName = "";
		// view values are based on selected categories, used to filter nodes
		let viewData = [];
		// loop through categories and create ID based on selected 
		const viewCategories = document.getElementsByClassName("view-category-select");
		for (let i = 0; i < viewCategories.length; i++) {
			// add selected value to view data
			viewData.push(viewCategories[i].value)
		}

		viewID = viewData.join(", ");
		viewName = viewData.filter((value) => value !== "All").join(", ");

		if (viewName === "") {
			viewName = "All";
		}

		// check if view element exists
		if (document.getElementById("view-entry-" + viewID) !== null) {
			this.props.setAlertMessage({
				messageType: "danger",
				messageText: "View already exists."
			})
			return;
		}

		this.props.createViews([{
			viewID,
			color: document.getElementById("view-color").value,
			name: viewName,
			values: viewData
		}])
	}

	// Create multiple views, one for each value of the permutations of selected categories
	createCategoryView = () => {
		const categories = [...this.props.data.demographicData.categories.keys()];
		const selectedCategories = this.state.categoryChecked.map((checked, index) => {
			if (checked) {
				return categories[index];
			} else {
				return 'All';
			}
		})

		const selectedCategoriesValues = selectedCategories.map((entry) => {
			if (entry === 'All') {
				return ['All'];
			}

			const category = this.props.data.demographicData.categories.get(entry);
			if (category.type !== 'number') {
				return [...category.elements.values()];
			}

			const result = [];
			for (let i = 0; i < category.intervals.length - 1; i++) {
				result.push(category.intervals[i].interval.toFixed(INTERVAL_DECIMAL_PRECISION) + " - " + category.intervals[i + 1].interval.toFixed(INTERVAL_DECIMAL_PRECISION));
			}
			return result;
		})

		let categoryPermutations = [[]];
		for (let i = 0; i < selectedCategoriesValues.length; i++) {
			const newPermutations = [];
			for (let j = 0; j < selectedCategoriesValues[i].length; j++) {
				for (let k = 0; k < categoryPermutations.length; k++) {
					newPermutations.push([...categoryPermutations[k], selectedCategoriesValues[i][j]]);
				}
			}
			categoryPermutations = newPermutations;
		}

		if (categoryPermutations.length < DEFAULT_VIEW_COLORS.length) {
			const newViewsData = [];

			for (let i = 0; i < categoryPermutations.length; i++) {
				const categoryPermutation = categoryPermutations[i];
				const viewID = categoryPermutation.join(", ");
				let viewName = categoryPermutation.filter((value) => value !== "All").join(", ");

				if (viewName === "") {
					viewName = "All";
				}

				newViewsData.push({
					viewID,
					color: DEFAULT_VIEW_COLORS[i],
					name: viewName,
					values: categoryPermutation
				});
			}

			this.props.createViews(newViewsData);
		} else {
			this.props.setAlertMessage({
				messageType: "danger",
				messageText: "Too many views to create (" + categoryPermutations.length + "). Please select fewer categories."
			})
		}
	}

	// Delete view
	deleteView = (viewID) => {
		const nodeViews = new Map(this.props.data.nodeViews);
		nodeViews.delete(viewID);
		this.props.setData({ nodeViews }, () => this.props.deleteNodeViewFromNodes(viewID))
	}

	// Set category checked state
	setCategoryChecked = (e, index) => {
		const categoryChecked = [...this.state.categoryChecked];
		categoryChecked[index] = e.target.checked;
		this.setState({ categoryChecked });
	}

	// Render category select creation form
	renderCategorySelect = () => {
		const categories = [...this.props.data.demographicData.categories.keys()];

		const categoryChecked = new Array(categories.length).fill(false);
		const categoryCheckboxes = categories.map((categoryKey, index) => {
			return (
				<div className="form-check mb-2" key={index}>
					<input className="form-check-input" type="checkbox" value={this.state.categoryChecked[index]} id={`create-view-category-checkbox-${index}`} onChange={(e) => this.setCategoryChecked(e, index)} />
					<label className="form-check-label" htmlFor={`create-view-category-checkbox-${index}`}>
						{categoryKey}
					</label>
				</div>
			)
		});

		this.setState({ categoryCheckboxes, categoryChecked });
	}

	// Render manual view creation form
	renderViews = () => {
		const categories = [...this.props.data.demographicData.categories.keys()];

		const views = categories.map((categoryKey, index) => {
			const category = this.props.data.demographicData.categories.get(categoryKey);

			let options = [];

			if (category.type === 'number') {
				options = category.intervals.map((value, index) => {
					if (index === category.intervals.length - 1) {
						return;
					}

					const intervalValue = value.interval.toFixed(INTERVAL_DECIMAL_PRECISION) + " - " + category.intervals[index + 1].interval.toFixed(INTERVAL_DECIMAL_PRECISION);

					return <option key={index} value={intervalValue}>{intervalValue}</option>
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

	render() {
		return (
			<div id="create-views" className="input-step">
				<h3 className="w-100 text-center mb-5">Step 3: Create Node Views</h3>

				{this.state.views.length === 0 ?
					<p className="text-warning text-center"> No supplementary data has been uploaded.</p> :
					<Fragment>
						<h5 className="w-100 mb-3 text-center">Generate By Categories:</h5>
						<div id="category-select-container">{this.state.categoryCheckboxes}</div>
						<button className="btn btn-primary mt-3 mb-3 w-100" id="create-category-view-button" onClick={this.createCategoryView}>Create Views By Categories</button>

						<h5 className="w-100 mt-5 mb-3 text-center">Manually Create Views:</h5>
						<div id="views-container">{this.state.views}</div>

						<div id="select-view-color" className="w-100 mt-4">
							<label htmlFor="view-color">Select View Color:</label>
							<input type="color" className="form-control form-control-color ms-3 border-secondary" id="view-color" value={this.state.viewSelectColor}
								onChange={this.setViewSelectColor} title="Choose your color" />
						</div>
						<div id="create-view">
							<button className="btn btn-primary mt-3 w-100" id="create-view-button" onClick={this.createView}>Create Manual View</button>
						</div>

						<h5 className="w-100 mt-5 mb-3 text-center">Created Node Views:</h5>
						<div id="view-entry-container" className="mb-5">{
							[...this.props.data.nodeViews.keys()].map((viewID, index) => {
								const viewData = this.props.data.nodeViews.get(viewID);
								
								// map views to view entries visible on the page
								return (
									<div className="view-entry my-3 w-100" id={`view-entry-${viewID}`} key={viewID}>
										<div className="view-entry-preview w-100" id={`view-entry-preview-${viewID}`}>
											<button className={`btn btn-${viewData.nodeCount === 0 ? 'warning' : 'success'} view-entry-button`} id={`view-entry-button-${viewID}`}>{viewData.name}</button>
											<input type="color" className="view-entry-color form-control form-control-color border-secondary" id={`view-entry-color-${viewID}`} value={viewData.color}
												onChange={(e) => this.setViewColor(viewID, e.target.value)} />
											<button className="btn btn-danger view-entry-delete" id={`view-entry-delete-${viewID}`} onClick={() => this.deleteView(viewID)}><i className="bi bi-trash" /></button>
										</div>
										<div className={`form-text text-${viewData.nodeCount === 0 ? 'warning' : 'success'}`} id={`view-entry-help-${viewID}`}>Views' applied nodes: {viewData.nodeCount} ({(viewData.nodeCount / this.props.data.nodes.length * 100).toFixed(2)}%)</div>
									</div>);
							})
						}</div>
					</Fragment>
				}

			</div>
		)
	}
}

export default CreateViews