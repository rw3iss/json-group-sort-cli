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
            const sorted = groupSortJson(json, o);
            const result = stringify(sorted, null, o.spaces || 4);
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
        json = parse(rawJson);
    } catch (e) {
        console.log(`Error parsing JSON file "${file}": ${getInnerError(e)} at line: ${e.line}, column: ${e.column}`);
        throw e;
    }

    return json;
}

// groups and sorts the given json, breaks apart the keys (if opted), and return a the sorted object
const groupSortJson = (json, opts) => {
    // pull in custom sorting of keys if given
    let sortKeys = typeof opts.sortKeys == 'string' ? opts.sortKeys.split(',').map(k => k.trim()) :
        Array.isArray(opts.sortKeys) ? opts.sortKeys : [];

    const sorted = assign({}, json, Object.keys(json).sort((a, b) => {
        let ia = sortKeys.indexOf(a);
        let ib = sortKeys.indexOf(b);

        // use initial part of key for sort compare (until this feature is more complete)
        if (opts.keyDelimeter) {
            let kd = opts.keyDelimeter;
            if (a.indexOf(kd) >= 0) {
                ia = sortKeys.indexOf(a.split(kd)[0]);
                //console.log(`split key:`, a, a.split(kd)[0], ia)
            }
            if (b.indexOf(kd) >= 0) ib = sortKeys.indexOf(b.split(kd)[0]);
        }

        // sort by custom key order index, if present
        if (ia >= 0 && ib >= 0) {
            return ia === ib ? 0 : (ia < ib ? -1 : 1);
        } else if (ia >= 0) {
            return -1;
        } else if (ib >= 0) {
            return 1;
        }

        // otherwise resort to native alphanumeric ort:
        return a.localeCompare(b);
    }));

    return sorted;
}

module.exports = {
    groupSort
}
