/*global describe:false, it:false */

'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var AudioSprite = require('../');
var assert = require('assert');
var ffmpegPath;
try {
	ffmpegPath = require('ffmpeg-static').path;
}
catch ( err ) {
	ffmpegPath = 'ffmpeg';
}

var g_fixturesPath = path.join( __dirname, 'fixtures' );
var g_outputDir = 'out';


function simpleOutputFormatTest( format, done ) {
	var outputFile = path.join( g_outputDir, 'output.' + format );
	var outputJsonFile = path.join( g_outputDir, 'output_' + format + '.json' );
	
	var as = new AudioSprite( { ffmpeg: ffmpegPath } );
	async.waterfall( [
			function( cb ) {
				as.inputFile( path.join( g_fixturesPath, 'ogg/FireBallWhoosh0.ogg' ), cb );
			},
			function( cb ) {
				as.inputFile( path.join( g_fixturesPath, 'ogg/ReelStop.ogg' ), cb );
			},
			function( cb ) {
				as.inputFile( path.join( g_fixturesPath, 'ogg/Symbol0.ogg' ), cb );
			},
			function( cb ) {
				as.outputFile( outputFile, cb );
			},
			function( cb ) {
				as.outputJsonFile( outputJsonFile );
				cb();
			}
		],
		function( err ) {
			assert.equal( !err, true, 'Error occurred' );
			assert.equal( fs.existsSync( outputFile ), true, 'Output file exists' );
			assert.equal( fs.existsSync( outputJsonFile ), true, 'Output JSON file exists' );
			done();
		}
	);
}


describe('audiosprite-pkg', function() {
	this.timeout(10 * 60 * 1000 * 1000);
	describe('different output formats individually', function() {
		it( 'ogg', function( done ) {
			simpleOutputFormatTest( 'ogg', done );
		});
		it( 'mp3', function( done ) {
			simpleOutputFormatTest( 'mp3', done );
		});
		it( 'mp4', function( done ) {
			simpleOutputFormatTest( 'mp4', done );
		});
		it( 'm4a', function( done ) {
			simpleOutputFormatTest( 'mp4', done );
		});
		it( 'wav', function( done ) {
			simpleOutputFormatTest( 'wav', done );
		});
		it( 'ac3', function( done ) {
			simpleOutputFormatTest( 'ac3', done );
		});	
		it( 'aiff', function( done ) {
			simpleOutputFormatTest( 'aiff', done );
		});
		it( 'caf', function( done ) {
			simpleOutputFormatTest( 'caf', done );
		});
	});
});

