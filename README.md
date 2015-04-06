# audiosprite-pkg
Based on the audiosprite module (https://github.com/tonistiigi/audiosprite), takes the same functionality but exposes it as a node module instead of command line.
Uses buffer streams to prevent creation of temporary files like the original.

```
npm install audiosprite-pkg
```

<a name="AudioSprite"></a>
## AudioSprite
**Kind**: global class  

* [AudioSprite](#AudioSprite)
  * [new AudioSprite([options])](#new_AudioSprite_new)
  * [.inputSilence(duration, [options], [callback])](#AudioSprite#inputSilence)
  * [.input(stream, [options], [callback])](#AudioSprite#input)
  * [.inputFile(file, [options], [callback])](#AudioSprite#inputFile)
  * [.output(stream, [options], [callback])](#AudioSprite#output)
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

**Example**  
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
| file | <code>Object</code> | Input file |
| [options] | <code>Object</code> | Options object |
| options.name | <code>string</code> | Name to use in the output JSON for the track |
| options.autoplay | <code>boolean</code> | Whether this should be marked to autoplay in the output JSON |
| options.loop | <code>boolean</code> | Whether this should be marked to loop in the output JSON |
| [callback] | <code>function</code> | Complete callback |

<a name="AudioSprite#output"></a>
### audioSprite.output(stream, [options], [callback])
Outputs the sprite to a stream.

**Kind**: instance method of <code>[AudioSprite](#AudioSprite)</code>  

| Param | Type | Description |
| --- | --- | --- |
| stream | <code>Object</code> | Output stream |
| [options] | <code>Object</code> | Options object |
| options.name | <code>string</code> | Name to use in the output JSON for the sprite |
| options.format | <code>string</code> | What format the file should be outputted as, supports: aiff,caf,wav,ac3,mp3,mp4,m4a,ogg. Defaults to 'ogg' |
| [callback] | <code>function</code> | Complete callback |

<a name="AudioSprite#outputFile"></a>
### audioSprite.outputFile(file, [options], [callback])
Outputs the sprite to a file.

**Kind**: instance method of <code>[AudioSprite](#AudioSprite)</code>  

| Param | Type | Description |
| --- | --- | --- |
| file | <code>Object</code> | Output file |
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
| format | <code>string</code> | Format of the output JSON file (jukebox, howler, createjs). Defaults to jukebox |

<a name="AudioSprite#outputJsonFile"></a>
### audioSprite.outputJsonFile(file, format) ? <code>Object</code>
Outputs the JSON manifest to file

**Kind**: instance method of <code>[AudioSprite](#AudioSprite)</code>  
**Returns**: <code>Object</code> - JSON manifest  

| Param | Type | Description |
| --- | --- | --- |
| file | <code>Object</code> | Output file |
| format | <code>string</code> | Format of the output JSON file (jukebox, howler, createjs). Defaults to jukebox |

