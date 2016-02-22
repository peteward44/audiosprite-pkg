/*jslint node: true */
'use strict';

// Modified version of audiosprite v0.4.0 tool so we don't have to use the CLI and can use a local version of ffmpeg
var fs = require('fs-extra');
var _ = require('underscore');
var path = require('path');
var async = require('async');
var spawn = require('child_process').spawn;


function safeSpawn( cmd, args, cb ) {
	var proc;
	try {
		proc = spawn(cmd, args);
		proc.on('exit', function(code) {
			if ( cb ) {
				cb( code ? code : null );
			}
		});
		proc.on('error', function(code) {
			if ( cb ) {
				cb( code ? 'Error spawning command [' + cmd + ']' : null );
			}
		});
	}
	catch ( err ) {
		if ( cb ) {
			cb( 'Error spawning command [' + cmd + ']' );
		}
	}
	return proc;
}


function checkFFmpegInPath( ffmpeg, cb ) {
	safeSpawn(ffmpeg, ['-version'], function( err ) {
		cb( err ? 'Could not execute FFMpeg. If the path correct? ' + ffmpeg : null );
	} );
}

  
/** Constructor for AudioSprite object. Accepts an optional options object.
 * @constructor
 * @param {Object=} options Options
 * @param {string} options.ffmpeg Path to FFMpeg installation - defaults to ffmpeg in PATH environment variable
 * @param {number} options.bitRate Bit rate. Works for: ac3, mp3, mp4, m4a, ogg
 * @param {number} options.sampleRate Sample rate. Defaults to 44100
 * @param {number} options.channelCount Number of channels (1=mono, 2=stereo). Defaults to 1
 * @param {number} options.trackGap Silence gap between tracks (in seconds). Defaults to 1
 * @param {number} options.minTrackLength Minimum track duration (in seconds). Defaults to 0
 * @param {number} options.VBR options.VBR [0-9]. Works for: mp3. -1 disables VBR
 * @param {number} options.bufferInitialSize Initial size of storage buffer in bytes. Defaults to 300kb
 * @param {number} options.bufferIncrementSize Incremental growth of storage buffer in bytes. Defaults to 100kb
 * @example
var AudioSprite = require('audiosprite-pkg');

var as = new AudioSprite();
// .inputFile can be called as many times as necessary
as.inputFile( 'inputFile.ogg', function( err ) {
	// .outputFile can also be called many times with different formats
	as.outputFile( 'output.mp3', { format: 'mp3' }, function( err ) {
		// output the final JSON file
		as.outputJsonFile( 'output.json' );
	} );
} );
 */
var AudioSprite = function( options ) {
	this._ffmpegVersionChecked = false;
	this._json = {
		resources: [],
		spritemap: {}
	};
	
	this._options = options || {};
	this._options.ffmpeg = this._options.ffmpeg || 'ffmpeg';
	this._options.sampleRate = isFinite( this._options.sampleRate ) ? this._options.sampleRate : 44100;
	this._options.channelCount = isFinite( this._options.channelCount ) ? this._options.channelCount : 1;
	this._options.bitRate = isFinite( this._options.bitRate ) ? this._options.bitRate : 128;
	this._options.VBR = isFinite( this._options.VBR ) ? this._options.VBR : -1;
	this._options.trackGap = isFinite( this._options.trackGap ) ? this._options.trackGap : 1;
	this._options.minTrackLength = isFinite( this._options.minTrackLength ) ? this._options.minTrackLength : 0;
	this._options.bufferInitialSize = isFinite( this._options.bufferInitialSize ) ? this._options.bufferInitialSize : (300 * 1024);
	this._options.bufferIncrementSize = isFinite( this._options.bufferIncrementSize ) ? this._options.bufferIncrementSize : (100 * 1024);
	
	this._buffer = new Buffer( this._options.bufferInitialSize );
	this._bufferPos = 0;
};


AudioSprite.prototype._getBufferPositionInTime = function() {
	return this._bufferPos / this._options.sampleRate / this._options.channelCount / 2;
};


AudioSprite.prototype._growBuffer = function( additional ) {
	var spaceAvailable = this._buffer.length - this._bufferPos;
	if ( additional > spaceAvailable ) {
		var extraRequired = additional - spaceAvailable;
		var chunksRequired = Math.floor( extraRequired / this._options.bufferIncrementSize ) + 1;
		var newSize = ( this._buffer ? this._buffer.length : 0 ) + ( chunksRequired * this._options.bufferIncrementSize );
		var newBuffer = new Buffer( newSize );
		if ( this._buffer ) {
			this._buffer.copy( newBuffer, 0, 0, this._bufferPos );
		}
		this._buffer = newBuffer;
	}
};


AudioSprite.prototype._appendToBuffer = function( data ) {
	var len;
	if( Buffer.isBuffer( data ) ) {
		len = data.length;
		this._growBuffer( len );
		data.copy( this._buffer, this._bufferPos, 0 );
	} else {
		data = data + "";
		len = Buffer.byteLength( data );
		this._growBuffer( len );
		this._buffer.write( data, this._bufferPos, "utf8");
	}
	this._bufferPos += data.length;
	return len;
};


AudioSprite.prototype._appendSilence = function(duration, cb) {
	var size = Math.round(this._options.sampleRate * 2 * this._options.channelCount * duration);
	this._growBuffer( size );
	this._buffer.fill( 0, this._bufferPos, this._bufferPos + size );
	this._bufferPos += size;
	cb();
};


AudioSprite.prototype._getFormatArgs = function( format ) {
	var formats = {
		aiff: ['-ar', this._options.sampleRate, '-ac', this._options.channelCount, '-f', 'aiff'],
		caf: ['-ar', this._options.sampleRate, '-ac', this._options.channelCount, '-f', 'caf'],
		wav: ['-ar', this._options.sampleRate, '-ac', this._options.channelCount, '-f', 'wav'],
		ac3: ['-acodec', 'ac3', '-ab', this._options.bitRate + 'k', '-f', 'ac3' ],
		mp3: ['-ar', this._options.sampleRate, '-f', 'mp3'],
		mp4: ['-ab', this._options.bitRate + 'k', '-f', 'mpegts' ],
		m4a: ['-ab', this._options.bitRate + 'k', '-f', 'mpegts' ],
		ogg: ['-acodec', 'libvorbis', '-f', 'ogg', '-ab', this._options.bitRate + 'k']
	};
	if (this._options.VBR >= 0 && this._options.VBR <= 9) {
		formats.mp3 = formats.mp3.concat(['-aq', this._options.VBR]);
	} else {
		formats.mp3 = formats.mp3.concat(['-ab', this._options.bitRate + 'k']);
	}
	var args = formats[ format ];
	return args;
};


/** Input a silent track into the sprite.
 * @param {number} duration Length in seconds
 * @param {Object=} options Options object
 * @param {string} options.name Name to use in the output JSON for the track
 * @param {boolean} options.autoplay Whether this should be marked to autoplay in the output JSON
 * @param {function=} callback Complete callback
 */
AudioSprite.prototype.inputSilence = function( duration, options, callback ) {
	if ( typeof options === 'function' ) {
		callback = options;
		options = {};
	}
	options = options || {};
	options.name = options.name || 'silence';
	this._json.spritemap[ options.name ] = {
		start: this._getBufferPositionInTime(),
		end: this._getBufferPositionInTime() + duration,
		loop: true
	};
	if (!options.autoplay) {
		this._json.autoplay = options.name;
	}
	this._appendSilence(duration + this._options.trackGap, callback);
};

/** Input a track from a stream into the sprite.
 * @param {Object} stream Input stream
 * @param {Object=} options Options object
 * @param {string} options.name Name to use in the output JSON for the track
 * @param {boolean} options.autoplay Whether this should be marked to autoplay in the output JSON
 * @param {boolean} options.loop Whether this should be marked to loop in the output JSON
 * @param {function=} callback Complete callback
 */
AudioSprite.prototype.input = function( stream, options, callback ) {
	if ( typeof options === 'function' ) {
		callback = options;
		options = {};
	}
	options = options || {};
	options.name = options.name || 'default';
	var that = this;
	var startTime = this._getBufferPositionInTime();
	async.waterfall( [
			function( cb ) {
				if ( !that._ffmpegVersionChecked ) {
					checkFFmpegInPath( that._options.ffmpeg, cb );
					that._ffmpegVersionChecked = true;
				} else {
					cb();
				}
			},
			function( cb ) {
				var length = 0;
				var wavArgs = ['-ar', that._options.sampleRate, '-ac', that._options.channelCount, '-f', 's16le'];
				var ffmpeg = safeSpawn(that._options.ffmpeg, [ '-i', 'pipe:0' ].concat(wavArgs).concat('pipe:'));
				//ffmpeg.stderr.pipe( process.stdout );
				stream.pipe( ffmpeg.stdin );
				ffmpeg.stdout.on( 'data', function( data ) {
					length += that._appendToBuffer( data );
				} );
				ffmpeg.on('exit', function(code, signal) {
					if (code) {
						cb( { msg: 'File could not be added', file: options.name, retcode: code, signal: signal }, length );
					} else {
						cb( null, length );
					}
				});
			},
			function( bytesWritten, cb ) {
				if (!options.autoplay) {
					that._json.autoplay = options.name;
				}

				var currentTime = that._getBufferPositionInTime();
				var originalDuration = currentTime - startTime;
				var extraDuration = Math.max(0, that._options.minTrackLength - originalDuration);
				var duration = originalDuration + extraDuration;
				that._json.spritemap[options.name] = {
					start: startTime,
					end: startTime + duration,
					loop: options.autoplay || options.loop || false
				};
				that._appendSilence(extraDuration + Math.ceil(currentTime) - currentTime + that._options.trackGap, cb);
			}
		],
		callback
	);
};


/** Input a track from a file into the sprite.
 * @param {string|Array} file Input file or array of input files
 * @param {Object=} options Options object
 * @param {string} options.name Name to use in the output JSON for the track
 * @param {boolean} options.autoplay Whether this should be marked to autoplay in the output JSON
 * @param {boolean} options.loop Whether this should be marked to loop in the output JSON
 * @param {function=} callback Complete callback
 */
AudioSprite.prototype.inputFile = function( file, options, callback ) {
	if ( typeof options === 'function' ) {
		callback = options;
		options = {};
	}
	var that = this;
	options = options || {};
	if ( Array.isArray( file ) ) {
		return async.eachSeries(
			file,
			function( sfile, cb ) {
				that._inputFile( sfile, _.extend( {}, options ), cb );
			},
			callback
		);
	} else {
		return this._inputFile( file, options, callback );
	}
};


AudioSprite.prototype._inputFile = function( file, options, callback ) {
	options.name = options.name || path.basename( file, path.extname( file ) );
	if ( !fs.existsSync(file) ) {
		return callback({ msg: 'File does not exist', file: file } );
	}
	return this.input( fs.createReadStream( file ), options, callback );
};


/** Outputs the sprite to a stream.
 * @param {Object} stream Output stream
 * @param {Object=} options Options object
 * @param {string} options.name Name to use in the output JSON for the sprite
 * @param {string} options.format What format the file should be outputted as, supports: aiff,caf,wav,ac3,mp3,mp4,m4a,ogg. Defaults to 'ogg'
 * @param {Array} options.rawArguments Raw arguments to pass to FFMpeg. Use with warning: You must specify the same sampleRate and channelCount passed into the constructor's options for the input parameters, you must specify -i pipe:0 as the input stream and pipe: for the output. Remember for FFMpeg the order the arguments are specified matters. So for example { rawArguments: [ '-y', '-ar', sampleRate, '-ac', channelCount, '-f', 's16le', '-i', 'pipe:0', '-ar', sampleRate, '-f', 'mp3', 'pipe:' ] }
 * @param {function=} callback Complete callback
 */
AudioSprite.prototype.output = function( stream, options, callback ) {
	if ( typeof options === 'function' ) {
		callback = options;
		options = {};
	}
	options = options || {};
	options.name = options.name || 'default';
	var format = options.format || 'ogg';
	var that = this;
	var opt = this._getFormatArgs( format );
	if ( !opt ) {
		throw new Error( "Unsupported output format '" + format + "'" );
	}
	var args;
	if ( !Array.isArray( options.rawArguments ) ) {
		args = ['-y', '-ar', this._options.sampleRate, '-ac', this._options.channelCount, '-f', 's16le', '-i', 'pipe:0'].concat(opt).concat('pipe:');
	} else {
		// raw custom FFMpeg arguments passed in - user must make sure this contains -i pipe:0 and pipe: to define input and output pipes!
		var containsInputArgs = ( options.rawArguments.indexOf( '-i' ) >= 0 && options.rawArguments.indexOf( 'pipe:0' ) >= 0 ) || options.rawArguments.indexOf( '-i pipe:0' ) >= 0;
		if ( !containsInputArgs || options.rawArguments.indexOf( 'pipe:' ) < 0 ) {
			throw new Error( 'Invalid rawArguments option: Always include "-i pipe:0" and "pipe:" arguments for audiosprite-pkg to work correctly! (See README.md for more information)' );
		}
		args = options.rawArguments;
	}
	var proc = safeSpawn( this._options.ffmpeg, args );
	proc.stdout.pipe( stream );
//		proc.stderr.pipe( process.stdout );
	proc.stdin.end( this._buffer );
	proc.on('exit', function(code, signal) {
		if (code) {
			return callback({ msg: 'Error exporting file', format: format, retcode: code, signal: signal });
		}
		that._json.resources.push( options.name );
		callback();
	});
};


/** Outputs the sprite to a file.
 * @param {string|Array} file Output file or array of output files
 * @param {Object=} options Options object
 * @param {string} options.name Name to use in the output JSON for the sprite
 * @param {string} options.format What format the file should be outputted as, supports: aiff,caf,wav,ac3,mp3,mp4,m4a,ogg. Defaults to 'ogg'
 * @param {function=} callback Complete callback
 */
AudioSprite.prototype.outputFile = function( file, options, callback ) {
	if ( typeof options === 'function' ) {
		callback = options;
		options = {};
	}
	var that = this;
	options = options || {};
	if ( Array.isArray( file ) ) {
		return async.eachSeries(
			file,
			function( sfile, cb ) {
				that._outputFile( sfile, _.extend( {}, options ), cb );
			},
			callback
		);
	} else {
		return this._outputFile( file, options, callback );
	}
};


AudioSprite.prototype._outputFile = function( file, options, callback ) {

	options.name = options.name || path.basename( file );
	if ( !options.format ) {
		// try to determine format from file extension
		var testFormat = path.extname( file ).replace( /\./g, '' ).toLowerCase();
		if ( this._getFormatArgs( testFormat ) ) {
			options.format = testFormat;
		}
	}
	fs.ensureDir( path.dirname( file ) );
	return this.output( fs.createWriteStream( file ), options, callback );
};


/** Outputs the JSON mainfest in the given format
 * @param {string} format Format of the output JSON file (jukebox, howler, createjs). Defaults to jukebox
 * @returns {Object} JSON manifest
 */
AudioSprite.prototype.outputJson = function( format ) {
	var sn, spriteInfo;
	var finalJson = {};
	switch (format) {
		case 'howler':
			finalJson.urls = [].concat(this._json.resources);
			finalJson.sprite = {};
			for (sn in this._json.spritemap) {
				spriteInfo = this._json.spritemap[sn];
				finalJson.sprite[sn] = [spriteInfo.start * 1000, (spriteInfo.end - spriteInfo.start) * 1000];
				if (spriteInfo.loop) {
					finalJson.sprite[sn].push(true);
				}
			}
		break;
		case 'createjs':
			finalJson.src = this._json.resources[0];
			finalJson.data = {audioSprite: []};
			for (sn in this._json.spritemap) {
				spriteInfo = this._json.spritemap[sn];
				finalJson.data.audioSprite.push({
					id: sn,
					startTime: spriteInfo.start * 1000,
					duration: (spriteInfo.end - spriteInfo.start) * 1000
				});
			}
		break;
		default:
			finalJson = this._json;
		break;
	}
	return finalJson;
};


/** Outputs the JSON manifest to file
 * @param {Object} file Output file
 * @param {string} format Format of the output JSON file (jukebox, howler, createjs). Defaults to jukebox
 * @returns {Object} JSON manifest
 */
AudioSprite.prototype.outputJsonFile = function( file, format ) {
	var obj = this.outputJson( format );
	fs.writeFileSync( file, JSON.stringify( obj, null, '\t' ) );
	return obj;
};


module.exports = AudioSprite;
