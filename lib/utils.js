const fs = require('fs');
const path = require('path');

// todo: look into parent directories if not found?
const loadConfig = (filePathOverride) => {
    let config;
    let configFilePath;

    function _readFile(filePath) {
        if (fs.existsSync(filePath)) {
            let _config = require(filePath);
            if (_config['json-group-sort']) {
                configFilePath = filePath;
                return _config['json-group-sort'];
            }
        }
    }

    if (filePathOverride) {
        console.log(`config override:`, filePathOverride)
        config = _readFile(filePathOverride);
    }

    if (!config) {
        const fallbackFiles = [
            './tsconfig.app.json',
            './tsconfig.json',
            './package.json'
        ];

        for (const f of fallbackFiles) {
            //console.log(`read fallback: `, f)
            config = _readFile(path.resolve(f));
            if (config) break;
        };
    }

    return { configFilePath, config };
}

const getDefaultOptions = (overrideOpts) => {
    let opts = {
        config: "tsconfig.json",
        input: undefined,
        group: true,
        sort: true,
        output: undefined,
        keySorts: undefined,
        keyDelimeter: undefined,
        spaces: 4
    };
    opts = Object.assign(opts, overrideOpts || {});
    return pickProps(opts, Object.keys(opts));
}

const ensureDirectory = (dir) => {
    if (!dir) return;
    let output = path.resolve(dir);
    if (!fs.existsSync(output)) {
        fs.mkdirSync(output, { recursive: true });
    }
}

const writeOutputFileResult = (outputPath, r) => {
    let fileName = path.basename(r.input);
    let filePath = path.resolve(outputPath, fileName);//r.input);
    let folderPath = path.dirname(filePath);
    ensureDirectory(folderPath);
    writeFile(filePath, r.result);
    console.log(`File saved: ${filePath}`)
}

const writeFile = (filePath, contents) => {
    const fp = path.resolve(filePath);
    fs.writeFileSync(fp, contents);
    return true;
}

const tryParseBoolean = (bool, def = undefined) => {
    if (typeof bool === 'boolean') return bool;
    else if (bool === 'true') return true;
    else if (bool === 'false') return false;
    if (def !== undefined) return def;
    throw `Could not parse boolean "${bool}", and no default value was given.`;
}

const pickProps = (o, pick) => {
    if (!o || typeof o != 'object') return {};
    const r = {};
    pick.forEach(p => { if (typeof o[p] != undefined) r[p] = o[p]; });
    return r;
}


///////////////////////////////////////////////////////
// Some helpful error utilities:

// Finds the inner most error
const getInnerError = (e) => {
    if (!e) return undefined;
    if (typeof e == 'string') return e;
    if (Array.isArray(e)) return e.map(_e => getInnerError(_e)).join(', ');
    // leave these separate so it recursesq through to each to always ensure a message can be found.
    return getInnerError(e.error) ||
        getInnerError(e.errors) ||
        getInnerError(e.data) ||
        getInnerError(e.response) ||
        getInnerError(e.message) ||
        getInnerError(e.result) ||
        getInnerError(e.reason) ||
        'Unknown error.';
}

// where = location: can be file, class, method, method... any identifier.
// log = if passed, it expects a logger to talk to.
const exception = (e, where, log, other) => {
    const error = getInnerError(e);
    const msg = `⚠️ Exception${where ? ` in ${where}` : ``}: ${error} ::`;
    if (log) {
        if (other) log(msg, other);
        else log(msg);
    } else {
        if (other) console.log(msg, other);
        else console.log(msg);
    }
    return error;
}


module.exports = {
    loadConfig,
    getDefaultOptions,

    ensureDirectory,
    writeFile,
    writeOutputFileResult,

    tryParseBoolean,
    pickProps,

    getInnerError,
    exception
}