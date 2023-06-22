// read zipcodes.tsv file
import fs from 'fs';

const uniqueZipCodes = {};

fs.readFile('zipcodes.tsv', 'utf8', (err, data) => {
	if (err) throw err;

	// split data into lines
	const lines = data.split('\n');
	for (const line of lines) {
		if (uniqueZipCodes[line]) {
			uniqueZipCodes[line] += 1;
		} else {
			uniqueZipCodes[line] = 1;
		}
	}

	delete uniqueZipCodes[''];
	delete uniqueZipCodes['NA'];

	const zipCodes = Object.entries(uniqueZipCodes);
	zipCodes.sort((a, b) => b[1] - a[1])
	const zipCodeText = zipCodes.map(entry => `${entry[0]}\t${entry[1]}`).join('\n');
	fs.writeFile('zipcodescount.tsv', zipCodeText, (err) => {
		if (err) throw err;
		console.log('The file has been saved!');
	});
})
