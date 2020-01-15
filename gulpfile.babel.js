'use strict';
let gulp     = require( 'gulp' );
let plugins  = require( 'gulp-load-plugins' );
let yargs    = require( 'yargs' );
let rimraf   = require( 'rimraf' );
let yaml     = require( 'js-yaml' );
let fs       = require( 'fs' );
let through2 = require( 'through2' );

// Load all Gulp plugins into one variable
const $ = plugins();

let PRODUCTION   = !!( yargs.argv.production ); // Check for --production flag
let VERSION_BUMP = yargs.argv.release;          // Check for --release (x.x.x semver version number)

// Load settings from settings.yml
const {COMPATIBILITY, PORT, UNCSS_OPTIONS, PATHS, LOCAL_PATH, BANNERS } = loadConfig();

let sassConfig = {
	mode: (PRODUCTION ? true : false)
};

// Define default webpack object
let webpackConfig = {
	mode: (PRODUCTION ? 'production' : 'development'),
	module: {
		rules: [
			{
				test: /\.js$/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ["@babel/preset-env"],
						compact: false
					}
				}
			}
		]
	},
	externals: {
		jquery: 'jQuery',
	},
	devtool: !PRODUCTION && 'source-map'
};

/**
 * Load in additional config files
 */
function loadConfig() {
	let ymlFile = fs.readFileSync('config.yml', 'utf8');
	return yaml.load(ymlFile);
}

/**
 * Set production mode during the build process
 *
 * @param done
 */
function setProductionMode(done) {
	PRODUCTION            = false;
	webpackConfig.mode    = 'production';
	webpackConfig.devtool = false;
	sassConfig.production = true;
	done();
}

// Build the "dist" folder by running all of the below tasks
// Sass must be run later so UnCSS can search for used classes in the others assets.
gulp.task(
	'build:release',
	gulp.series(
		setProductionMode,
		bumpPluginFile,
		bumpPackageJson,
		bumpReadmeStableTag,
		bumpComposerJson,
		readme,
		addWrappers
	)
);

// Generate the changelog.md from the readme.txt
gulp.task(
	'readme',
	gulp.series(
		readme,
		addWrappers
	)
);

// Build the site, run the server, and watch for file changes
gulp.task(
	'default',
	gulp.series(
		gulp.parallel( watch )
	)
);

/**
 * Create a README.MD file for github from the WordPress.org readme
 *
 * @since 1.0
 */
function readme( done ) {
	return gulp.src( ['readme.txt'] )
		.pipe( $.readmeToMarkdown( {
			details: false,
			screenshot_ext: ['jpg', 'jpg', 'png'],
			extract: {
				'changelog': 'CHANGELOG',
				'Frequently Asked Questions': 'FAQ'
			}
		} ) )
		.pipe(
			gulp.dest('./')
		);
}

function addWrappers( done ) {

	let intro = [
		'<%= BANNERS.plugin %>\n\n',
		'<%= BANNERS.build_status %> ',
		'<%= BANNERS.maintain %>\n\n',
		''].join('');

	let outro = [
		'<%= BANNERS.linchpin %>\n',
		''].join('');

	return gulp.src( ['README.md'] )
		.pipe( $.header( intro, { BANNERS : BANNERS } ) )
		.pipe( $.footer( outro, { BANNERS : BANNERS } ) )
		.pipe( through2.obj( function( file, enc, cb ) {
			let date        = new Date();
			file.stat.atime = date;
			file.stat.mtime = date;
			cb( null, file );
		}) )
		.pipe( gulp.dest('./') )
}

/**
 * Bump the version number within the define method of our plugin file
 * PHP Constant: example `define( 'COURIER_PRO_VERSION', '1.0.0' );`
 *
 * Bump the version number within our meta data of the plugin file
 *
 * Update the release date with today's date
 *
 * @since 1.3
 *
 * @return {*}
 */
function bumpPluginFile( done ) {

	let constant        = 'TOGGLE_WPAUTOP_VERSION';
	let define_bump_obj = {
		key: constant,
		regex: new RegExp('([<|\'|"]?(' + constant + ')[>|\'|"]?[ ]*[:=,]?[ ]*[\'|"]?[a-z]?)(\\d+.\\d+.\\d+)(-[0-9A-Za-z.-]+)?(\\+[0-9A-Za-z\\.-]+)?([\'|"|<]?)', 'ig' )
	};

	let bump_obj = {
		key: 'Version',
	};

	if ( VERSION_BUMP ) {
		bump_obj.version        = VERSION_BUMP;
		define_bump_obj.version = VERSION_BUMP;
	}

	let today = getReleaseDate();

	return gulp.src( './toggle-wpautop.php' )
		.pipe( $.bump( bump_obj ) )
		.pipe( $.bump( define_bump_obj ) )
		.pipe( $.replace( /(((0)[0-9])|((1)[0-2]))(\/)([0-2][0-9]|(3)[0-1])(\/)\d{4}/ig, today ) )
		.pipe( through2.obj( function( file, enc, cb ) {
			let date        = new Date();
			file.stat.atime = date;
			file.stat.mtime = date;
			cb( null, file );
		}) )
		.pipe( gulp.dest( './' ) );
}

/**
 * Update the what's new template with the date of the release instead of having to manually update it every release
 *
 * @since 1.3.0
 *
 * @return {*}
 */
function getReleaseDate() {
	let today = new Date();
	let dd    = String( today.getDate() ).padStart( 2, '0' );
	let mm    = String( today.getMonth() + 1 ).padStart( 2, '0' );
	let yyyy  = today.getFullYear();

	today = mm + '/' + dd + '/' + yyyy;

	return today;
}

/**
 * Bump the composer.json
 *
 * @since 1.3.0
 *
 * @return {*}
 */
function bumpComposerJson() {

	let bump_obj = {
		key:'version'
	};

	if ( VERSION_BUMP ) {
		bump_obj.version = VERSION_BUMP;
	}

	return gulp.src( './composer.json' )
		.pipe( $.bump( bump_obj ) )
		.pipe( through2.obj( function( file, enc, cb ) {
			let date        = new Date();
			file.stat.atime = date;
			file.stat.mtime = date;
			cb( null, file );
		}) )
		.pipe( gulp.dest( '.' ) );
}

/**
 * bump readme file stable tag to our latest version
 *
 * @since 1.3.0
 *
 * @return {*}
 */
function bumpReadmeStableTag() {

	let bump_obj = { key: "Stable tag" };

	if ( VERSION_BUMP ) {
		bump_obj.version = VERSION_BUMP;
	}

	return gulp.src( './readme.txt' )
		.pipe( $.bump( bump_obj ) )
		.pipe( through2.obj( function( file, enc, cb ) {
			let date        = new Date();
			file.stat.atime = date;
			file.stat.mtime = date;
			cb( null, file );
		}) )
		.pipe( gulp.dest( './' ) );
}

/**
 * Bump the package.json
 *
 * @since 1.3.0
 *
 * @return {*}
 */
function bumpPackageJson() {

	let bump_obj = {
		key: 'version'
	};

	if (VERSION_BUMP) {
		bump_obj.version = VERSION_BUMP;
	}

	return gulp.src( './package.json' )
		.pipe( $.bump( bump_obj ) )
		.pipe( through2.obj( function( file, enc, cb ) {
			let date        = new Date();
			file.stat.atime = date;
			file.stat.mtime = date;
			cb( null, file );
		}) )
		.pipe( gulp.dest( '.' ) );
}

/**
 * Watch for changes to static assets
 * readme.txt
 *
 * @since 1.3
 */
function watch() {
	gulp.watch( 'readme.txt', readme );
}
