# audiosprite-pkg

***This project is no longer maintained***

Based on the audiosprite module (https://github.com/tonistiigi/audiosprite), takes the same functionality but exposes it as a node module instead of command line.

This allows better integration with grunt / gulp and other build systems.

Uses buffer streams to prevent creation of temporary files like the original.

v2.0.0 of audiosprite-pkg now returns promises for each API call, making the callbacks entirely optional.

```
npm install audiosprite-pkg
```

**Example**  
```
var AudioSprite = require('audiosprite-pkg');

var as = new AudioSprite();
// .inputFile can be called as many times as necessary
as.inputFile( 'inputFile.ogg', function( err ) {
	// .outputFile can also be called many times with different formats
	as.outputFile( 'output.mp3', { format: 'mp3' }, function( err ) {
		// output the final JSON file - this should be called once all other operations have completed
		as.outputJsonFile( 'output.json', function( err ) {
			// all done!
		} );
	} );
} );
```

**Example using Promise API introduced in v2.0.0**
```
	const as = new AudioSprite();
	
	return as.inputFile( 'input1.wav' )
		.then( function() {
			return as.inputFile( 'input2.wav' );
		} )
		.then( function() {
			return as.inputFile( [ 'input3.wav', 'input4.wav' ] );
		} )
		.then( function() {
			return as.outputFile( 'output.wav' );
		} )
		.then( function() {
			return as.outputJsonFile( 'output.json' );
		} );
```

**Comprehensive example using async.js**
```
var AudioSprite = require('audiosprite-pkg');

var as = new AudioSprite( { ffmpeg: '/my/path/to/ffmpeg', sampleRate: 96000, channelCount: 2, trackGap: 3 } );
async.waterfall( [
		function( cb ) {
			as.inputFile( 'sound.mp3', cb );
		},
		function( cb ) {
			as.inputFile( 'sound2.ogg', { name: 'json tag', loop: true }, cb );
		},
		function( cb ) {
			// input method can accept input directly from a stream
			// accepts the same options as inputFile() does
			var stream = fs.createReadStream( 'sound3.wav' );
			as.input( stream, cb );
		},
		function( cb ) {
			// Output final sprite
			as.outputFile( 'mysprite.mp3', { format: 'mp3' }, cb );
		},
		function( cb ) {
			// Output can be called as many times as necessary to generate different formats,
			as.outputFile( 'mySprite.ac3', { format: 'ac3' }, cb );
		},
		function( cb ) {
			// Output JSON manifest file
			as.outputJsonFile( 'mysprite.json', cb );
		}
		function( cb ) {
			// You can also call outputJson() to just get the manifest object without writing it to file.
			var myManifest = as.outputJson();
			console.log( myManifest );
			cb();
		}
	],
	function( err ) {
		if ( err ) {
			console.log( "An error occurred!", err );
		}
	}
);
```

<a name="AudioSprite"></a>
## AudioSprite
**Kind**: global class  

* [AudioSprite](#AudioSprite)
  * [new AudioSprite([options])](#new_AudioSprite_new)
  * [.inputSilence(duration, [options], [callback])](#AudioSprite#inputSilence)
  * [.input(stream, [options], [callback])](#AudioSprite#input)
  * [.inputFile(file, [options], [callback])](#AudioSprite#inputFile)
  * [.outputFile(file, [options], [callback])](#AudioSprite#outputFile)
  * [.outputJson(format)](#AudioSprite#outputJson) ? <code>Object</code>
  * [.outputJsonFile(file, format)](#AudioSprite#outputJsonFile) ? <code>Object</code>

<a name="new_AudioSprite_new"></a>
### new AudioSprite([options])
Constructor for AudioSprite object. Accepts an optional options object.


| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>Object</code> | Options |
| options.ffmpeg | <code>string</code> | Path to FFMpeg installation - defaults to ffmpeg in PATH environment variable |
| options.bitRate | <code>number</code> | Bit rate. Works for: ac3, mp3, mp4, m4a, ogg |
| options.sampleRate | <code>number</code> | Sample rate. Defaults to 44100 |
| options.channelCount | <code>number</code> | Number of channels (1=mono, 2=stereo). Defaults to 1 |
| options.trackGap | <code>number</code> | Silence gap between tracks (in seconds). Defaults to 1 |
| options.minTrackLength | <code>number</code> | Minimum track duration (in seconds). Defaults to 0 |
| options.VBR | <code>number</code> | options.VBR [0-9]. Works for: mp3. -1 disables VBR |
| options.bufferInitialSize | <code>number</code> | Initial size of storage buffer in bytes. Defaults to 300kb |
| options.bufferIncrementSize | <code>number</code> | Incremental growth of storage buffer in bytes. Defaults to 100kb |


<a name="AudioSprite#inputSilence"></a>
### audioSprite.inputSilence(duration, [options], [callback])
Input a silent track into the sprite.

**Kind**: instance method of <code>[AudioSprite](#AudioSprite)</code>  

| Param | Type | Description |
| --- | --- | --- |
| duration | <code>number</code> | Length in seconds |
| [options] | <code>Object</code> | Options object |
| options.name | <code>string</code> | Name to use in the output JSON for the track |
| options.autoplay | <code>boolean</code> | Whether this should be marked to autoplay in the output JSON |
| [callback] | <code>function</code> | Complete callback |

<a name="AudioSprite#input"></a>
### audioSprite.input(stream, [options], [callback])
Input a track from a stream into the sprite.

**Kind**: instance method of <code>[AudioSprite](#AudioSprite)</code>  

| Param | Type | Description |
| --- | --- | --- |
| stream | <code>Object</code> | Input stream |
| [options] | <code>Object</code> | Options object |
| options.name | <code>string</code> | Name to use in the output JSON for the track |
| options.autoplay | <code>boolean</code> | Whether this should be marked to autoplay in the output JSON |
| options.loop | <code>boolean</code> | Whether this should be marked to loop in the output JSON |
| [callback] | <code>function</code> | Complete callback |

<a name="AudioSprite#inputFile"></a>
### audioSprite.inputFile(file, [options], [callback])
Input a track from a file into the sprite.

**Kind**: instance method of <code>[AudioSprite](#AudioSprite)</code>  

| Param | Type | Description |
| --- | --- | --- |
| file | <code>string|Array</code> | Input file or array of input files |
| [options] | <code>Object</code> | Options object |
| options.name | <code>string</code> | Name to use in the output JSON for the track |
| options.autoplay | <code>boolean</code> | Whether this should be marked to autoplay in the output JSON |
| options.loop | <code>boolean</code> | Whether this should be marked to loop in the output JSON |
| [callback] | <code>function</code> | Complete callback |

<a name="AudioSprite#outputFile"></a>
### audioSprite.outputFile(file, [options], [callback])
Outputs the sprite to a file.

**Kind**: instance method of <code>[AudioSprite](#AudioSprite)</code>  

| Param | Type | Description |
| --- | --- | --- |
| file | <code>string|Array</code> | Output file or array of output files |
| [options] | <code>Object</code> | Options object |
| options.name | <code>string</code> | Name to use in the output JSON for the sprite |
| options.format | <code>string</code> | What format the file should be outputted as, supports: aiff,caf,wav,ac3,mp3,mp4,m4a,ogg. Defaults to 'ogg' |
| [callback] | <code>function</code> | Complete callback |

<a name="AudioSprite#outputJson"></a>
### audioSprite.outputJson(format) ? <code>Object</code>
Outputs the JSON mainfest in the given format

**Kind**: instance method of <code>[AudioSprite](#AudioSprite)</code>  
**Returns**: <code>Object</code> - JSON manifest  

| Param | Type | Description |
| --- | --- | --- |
| format | <code>string</code> | Format of the output JSON file (jukebox, howler, howler2, createjs). Defaults to jukebox |

<a name="AudioSprite#outputJsonFile"></a>
### audioSprite.outputJsonFile(file, format, [callback]) ? <code>Object</code>
Outputs the JSON manifest to file

**Kind**: instance method of <code>[AudioSprite](#AudioSprite)</code>  
**Returns**: <code>Object</code> - JSON manifest  

| Param | Type | Description |
| --- | --- | --- |
| file | <code>Object</code> | Output file |
| format | <code>string</code> | Format of the output JSON file (jukebox, howler, howler2, createjs). Defaults to jukebox |
| [callback] | <code>function</code> | Complete callback |

