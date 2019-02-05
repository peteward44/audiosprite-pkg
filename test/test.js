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


function simpleOutputFormatTest( format, done, outputArgs, outputName ) {
	outputName = outputName || 'output';
	var outputFile = path.join( g_outputDir, outputName + '.' + format );
	var outputJsonFile = path.join( g_outputDir, outputName + '_' + format + '.json' );
	
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
				as.inputFile( [ path.join( g_fixturesPath, 'ogg/ReelStop.ogg' ), path.join( g_fixturesPath, 'ogg/Symbol0.ogg' ) ], cb );
			},
			function( cb ) {
				as.outputFile( outputFile, outputArgs, cb );
			},
			function( cb ) {
				as.outputFile( [ path.join( g_outputDir, outputName + '1.' + format ), path.join( g_outputDir, outputName + '2.' + format )], outputArgs, cb );
			},
			function( cb ) {
				as.outputJsonFile( outputJsonFile, cb );
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


function simpleOutputFormatTestPromise( format, outputArgs, outputName ) {
	outputName = outputName || 'output';
	var outputFile = path.join( g_outputDir, outputName + '.' + format );
	var outputJsonFile = path.join( g_outputDir, outputName + '_' + format + '.json' );
	
	var as = new AudioSprite( { ffmpeg: ffmpegPath } );
	
	return as.inputFile( path.join( g_fixturesPath, 'ogg/FireBallWhoosh0.ogg' ) )
		.then( function() {
			return as.inputFile( path.join( g_fixturesPath, 'ogg/ReelStop.ogg' ) );
		} )
		.then( function() {
			return as.inputFile( path.join( g_fixturesPath, 'ogg/Symbol0.ogg' ) );
		} )
		.then( function() {
			return as.inputFile( [ path.join( g_fixturesPath, 'ogg/ReelStop.ogg' ), path.join( g_fixturesPath, 'ogg/Symbol0.ogg' ) ] );
		} )
		.then( function() {
			return as.outputFile( outputFile, outputArgs );
		} )
		.then( function() {
			return as.outputFile( [ path.join( g_outputDir, outputName + '1.' + format ), path.join( g_outputDir, outputName + '2.' + format )], outputArgs );
		} )
		.then( function() {
			return as.outputJsonFile( outputJsonFile );
		} )
		.then( function() {
			assert.equal( fs.existsSync( outputFile ), true, 'Output file exists' );
			assert.equal( fs.existsSync( outputJsonFile ), true, 'Output JSON file exists' );
		} );
}


var formatsToTest = [
	'ogg', 'mp3', 'mp4', 'm4a', 'wav', 'ac3', 'aiff', 'caf'
];


describe('audiosprite-pkg', function() {
	this.timeout(10 * 60 * 1000 * 1000);
	describe('different output formats individually', function() {
		
		for ( var i=0; i<formatsToTest.length; ++i ) {
			var format = formatsToTest[i];
			it( format + ' callback API', function( done ) {
				simpleOutputFormatTest( format, done );
			});
			
			it( format + ' promise API', function() {
				return simpleOutputFormatTestPromise( format );
			});
		}

		it( 'mp3 - using rawArguments option to specify custom behaviour', function( done ) {
			simpleOutputFormatTest( 'mp3', done, { rawArguments: [ '-ar', 44100, '-ac', 1, '-f', 's16le' ] }, 'custommp3' );
		});
		
		it( 'specify bitRate option to replicate issue #2', function( done ) {
			var asOpt = {
				bitRate : 240,
				ffmpeg: ffmpegPath
			},
			asInOpt = {
			},
			asOutOpt = {
			},
			files = [
				path.join( g_fixturesPath, 'ogg/FireBallWhoosh0.ogg' ),
				path.join( g_fixturesPath, 'ogg/Symbol0.ogg' )
			],
			as = new AudioSprite(asOpt);
			as.inputFile(files, asInOpt, function(err) {
				if(err) {
					console.error(err);
					return done( err );
				}
				console.log( path.join( g_outputDir, 'test.ogg' ) )
				as.outputFile( path.join( g_outputDir, 'test.ogg' ), asOutOpt, function(err) {
					if(err) {
						console.error(err);
						return done( err );
					}
					as.outputJsonFile( path.join( g_outputDir, 'test.json' ), "jukebox", done );
				})
			});
		});
		
	});
});

