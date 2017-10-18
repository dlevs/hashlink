#!/usr/bin/env node

// Dependencies
//------------------------------------
const {promisify} = require('util');
const fs = require('fs-extra');
const path = require('path');
const glob = promisify(require('glob'));
const pathType = require('path-type');
const revHash = require('rev-hash');
const program = require('commander');
const {version, name, description} = require('./package');


// Functions
//------------------------------------
/**
 * Executes core module functionality from commandline arguments.
 *
 * @return {Promise.<void>}
 */
const initFromCommandline = async () => {
	const {args, silent, ...options} = parseCommandlineArgs();

	try {
		const manifest = await createRevSymlinks({
			patterns: args,
			...options
		});
		if (!silent) {
			process.stdout.write(
				JSON.stringify(manifest, null, '\t') + '\n'
			);
		}
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

/**
 * Parse arguments from the commandline.
 *
 * @return {Object}
 */
const parseCommandlineArgs = () => {
	program
		.version(version)
		.description(description + ' Prints a manifest JSON to stdout, mapping the original filenames to their new symbolic link counterparts.')
		.usage('<pattern ...>')
		.option('-r, --relative [path]', 'filepath to make all values in the manifest relative to')
		.option('-q, --quiet', 'suppress stdout')
		.option('-s, --slash', 'prepend paths in manifest with a forward slash')
		.on('--help', function () {
			console.log();
			console.log('  Examples:');
			console.log();
			console.log(`    $ ${name} -s --relative dist 'dist/**/*.+(js|css)' > manifest.json`);
			console.log();
		})
		.parse(process.argv);

	if (!program.args.length) program.help();

	return program;
};

/**
 * Creates symbolic links for all files that match the patterns provided.
 *
 * Returns an object mapping the original filepaths to the symbolic link paths.
 *
 * @param {Object} options
 * @param {Array} options.patterns
 * @param {String} options.relative
 * @param {Boolean} options.slash
 * @return {Promise.<Object>}
 */
const createRevSymlinks = async ({
	patterns,
	relative,
	slash = false
}) => {
	const manifest = {};
	const processPath = (filepath) => {
		const relativePath = relative
			? path.relative(relative, filepath)
			: filepath;
		const prepend = slash ? '/' : '';

		return prepend + relativePath;
	};

	let p = patterns.length;
	while (p--) {
		const filepaths = await glob(patterns[p]);
		let f = filepaths.length;

		while (f--) {
			const originalPath = filepaths[f];
			const isSymLink = await pathType.symlink(originalPath);

			if (!isSymLink) {
				const revPath = await getRevFilepath(originalPath);
				await fs.ensureSymlink(originalPath, revPath);
				manifest[processPath(originalPath)] = processPath(revPath);
			}
		}
	}

	return manifest;
};

/**
 * For a given filepath, return a version that includes a hash of the file in
 * the name.
 *
 * @param {String} filepath
 * @return {Promise.<String>}
 */
const getRevFilepath = async (filepath) => {
	const file = await fs.readFile(filepath);
	const hash = revHash(file);
	const {dir, name, ext} = path.parse(filepath);

	return path.format({dir, ext, name: `${name}-${hash}`})
};


// Exports / init
//------------------------------------
module.eports = createRevSymlinks;

if (!module.parent) {
	initFromCommandline();
}
