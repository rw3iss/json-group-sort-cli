#!/usr/bin/env node

const prog = require('caporal');
const { groupSort } = require('./lib/groupSort');
const { tryParseBoolean, getDefaultOptions, exception, ensureDirectory, loadConfig, writeOutputFileResult } = require('./lib/utils');
const pjson = require(__dirname + '/package.json');

let version = pjson ? pjson.version : '<unknown version>';

prog
    .version(version)

    .option('-i', 'List of input file names to sort (required). You can pass this multiple times for multiple files.')
    .option('-c', 'Config file (default is tsconfig.json, or otherwise falls back to package.json if "json-group-sort" options are present).')
    .option('-s', '(true|false). Sort the results by key. Default is true.')
    .option('-g', '(true|false). Group the results by key. Default is true.')
    .option('-o', 'Output file or folder name. If a prefix is not given, a folder is created with that name. Default is file <name>-sorted.json.')
    .option('-k', 'Comma-delimeted list of keys to use for sorting order, ie: "keyd,keya,keyc". Any others keys in the file will be sorted alphabetically below it, which is the default.')
    .option('-d', 'Key delimeter, if breaking keys up by some pattern, ie. using "." will break up "key.prop.subprop" into { "key": { "prop": { "subprop": {} } } (default is undefined, keys will not be broken up).')
    .option('-t', 'Number of spaces to use for json indentation. Default is 4.')
    .option('-h', 'Show help.')

    .action(async (args, o, logger) => {
        try {
            console.log(`Running json-group-sort v${version}...`)

            ///////////////////////////////////////////////
            // load in options/config:

            // first see if there's a configuration file available, and start with that (using o.c -c parameter config file as potential override)
            const config = loadConfig(o.c);

            // gather the default options with these overrides
            const opts = getDefaultOptions(config);
            console.log(`Options:`, opts)

            // now take the cli params as final preference:
            if (o.c) opts.config = o.c;
            if (o.i) opts.input = o.i;
            if (o.g) opts.group = tryParseBoolean(o.g, true);
            if (o.s) opts.sort = tryParseBoolean(o.s, true);
            if (o.o) opts.output = o.o;
            if (o.k) opts.keySorts = o.k;
            if (o.d) opts.keyDelimeter = o.d;
            if (o.t) opts.spaces = o.t;

            if (!opts.input) throw `Input file(s) required. Use the -i parameter, or -h for help.`;

            ///////////////////////////////////////////////

            let inputResults = await groupSort(opts);

            // write results to output:
            if (inputResults.length) {
                ensureDirectory(opts.output || './');
                inputResults.forEach(r => writeOutputFileResult(opts.output, r));
            }
        } catch (e) {
            const error = exception(e, '', null, e);
            //console.log(`⚠️ Exception: ${error}`, e);
        }
    });

prog.parse(process.argv);

