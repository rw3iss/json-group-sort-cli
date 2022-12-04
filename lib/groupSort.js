const fs = require('fs');
const { parse, assign, stringify } = require('comment-json')
const path = require('path');
const { getInnerError } = require('./utils');

// takes in GroupSort options and does the darn thing.
const groupSort = async (o) => {
    if (!o) throw "No options given to groupSort()";

    // file results with json
    const results = [];
    const _processFile = (input) => {
        let json = getFileJson(input);
        if (json) {
            let r = groupSortJson(json, o);
            const result = stringify(json, null, o.spaces || 4);
            results.push({ input, result });
        }
    }

    if (Array.isArray(o.input)) {
        o.input.forEach(f => _processFile(f));
    } else if (typeof o.input == 'string') {
        _processFile(o.input);
    } else {
        throw "Unknown input type.";
    }

    return results;
}

// reads in the file contents, parses to json (retains comments)
const getFileJson = (file) => {
    if (!file) return undefined;
    let json = undefined;
    const filePath = path.resolve(file);
    const rawJson = fs.readFileSync(filePath).toString();

    try {
        const parsed = parse(rawJson);

        // Copy the properties including comments from `parsed` to the new object `{}` according to the sequence of the given keys
        json = assign(
            {},
            parsed,
            // You could also use your custom sorting function
            Object.keys(parsed).sort()
        );

    } catch (e) {
        console.log(`Error parsing JSON file "${file}": ${getInnerError(e)} at line: ${e.line}, column: ${e.column}`);
        throw e;
    }

    return json;
}

// groups and sorts the given json, breaks apart the keys (if opted), and return a the sorted object
const groupSortJson = (json, opts) => {
    if (!json) return undefined;
    return json;
}

module.exports = {
    groupSort
}
