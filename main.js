/*
 ________________________________________________
(               Audio Visualizer               ()
\-----------------------------------------------\
|                                               |
|   Copyright 2024 ag-sanjjeev                  |
|                                               |
|-----------------------------------------------|
|   The source code is licensed under           |
|   MIT-style License.                          |
|                                               |
|-----------------------------------------------|
|                                               |
|   The usage, permission and condition         |
|   are applicable to this source code          |
|   as per license.                             |
|                                               |
|-----------------------------------------------|
|                                               |
|   That can be found in LICENSE file           |
|   or at https://opensource.org/licenses/MIT.  |
(_______________________________________________(

*/

/* global constants */
const audioInput = document.getElementById('audioInput');
const visualizerType = document.getElementById('visualizerType');
const fftBand = document.getElementById('fftBand');
const canvasWidth = document.getElementById('canvasWidth');
const canvasHeight = document.getElementById('canvasHeight');
const animationScale = document.getElementById('animationScale');
const fps = document.getElementById('fps');
const foregroundColorType = document.getElementById('foregroundColorType');
const foregroundColor = document.getElementById('foregroundColor');
const backgroundColor = document.getElementById('backgroundColor');

const setDeviceWidthButton = document.getElementById('setDeviceWidthButton');
const setDeviceHeightButton = document.getElementById('setDeviceHeightButton');
const playButton = document.getElementById('playButton');
const recordButton = document.getElementById('recordButton');
const fullScreen = document.getElementById('fullScreen');

const audioControl = document.getElementById('audio1');
const canvas = document.getElementById('canvas1'); 

const canvasCTX = canvas.getContext('2d');

let x = 0;
let y = 0;
let redColor;
let greenColor;
let blueColor;
let rgbColor;
let hue;
let saturation;
let lightness;
let hslColor;
let barWidth;
let barHeight;
let factorValue;

/* Class PreferenceHandler */
class PreferenceHandler {
	constructor() {
		this._audio = null;
		this._animationFrameReference = null;
		this._audioConfig = null;
		this._stream = null;
		this._recorder = null;
		this._recorderTimes = [];
		this._videoChunks = [];
	}

	// set and get method for audio property
	set audio(audio) {
		this._audio = audio;
	}

	get audio() {
		return this._audio;
	}

	// set and get method for animationFrameReference property
	set animationFrameReference(ref) {
		this._animationFrameReference = ref;
	}

	get animationFrameReference() {
		return this._animationFrameReference;
	}

	// set and get method for audioConfig property
	set audioConfig(config) {
		this._audioConfig = config;
	}

	get audioConfig() {
		return this._audioConfig;
	}

	// set and get method for stream property
	set setStream(stream) {
		this._stream = stream;
	}

	get getStream() {
		return this._stream;
	}

	// set and get method for recorder property
	set setRecorder(recorder) {
		this._recorder = recorder;
	}

	get getRecorder() {
		return this._recorder;
	}

	// set and get method for recorderTimes property
	set setRecorderTimes(times) {
		this._recorderTimes = times;
	}

	get getRecorderTimes() {
		return this._recorderTimes;
	}

	// set and get method for videoChunks property
	set setVideoChunks(videoChunks) {
		this._videoChunks = videoChunks;
	}

	get getVideoChunks() {
		return this._videoChunks;
	}
}

/* Initiating PreferenceHandler */
const prefObj = new PreferenceHandler();

/* Setting Preferences function*/
function setPreference() {
	visualizerType.value = (getLocalStorage('visualizer.visualizerType') == null) ? visualizerType.options[0].value : getLocalStorage('visualizer.visualizerType'); 
	fftBand.value = (getLocalStorage('visualizer.fftBand') == null) ? fftBand.options[0].value : getLocalStorage('visualizer.fftBand'); 
	canvasWidth.value = (getLocalStorage('visualizer.canvasWidth') == null) ? canvasWidth.value : getLocalStorage('visualizer.canvasWidth'); 
	canvasHeight.value = (getLocalStorage('visualizer.canvasHeight') == null) ? canvasHeight.value : getLocalStorage('visualizer.canvasHeight'); 
	animationScale.value = (getLocalStorage('visualizer.animationScale') == null) ? animationScale.value : getLocalStorage('visualizer.animationScale'); 
	fps.value = (getLocalStorage('visualizer.fps') == null) ? fps.value : getLocalStorage('visualizer.fps'); 
	foregroundColorType.value = (getLocalStorage('visualizer.foregroundColorType') == null) ? foregroundColorType.options[0].value : getLocalStorage('visualizer.foregroundColorType'); 
	foregroundColor.value = (getLocalStorage('visualizer.foregroundColor') == null) ? foregroundColor.value : getLocalStorage('visualizer.foregroundColor'); 
	backgroundColor.value = (getLocalStorage('visualizer.backgroundColor') == null) ? backgroundColor.value : getLocalStorage('visualizer.backgroundColor'); 
}

// set and get function for localStorage
function setLocalStorage(name, value) {
	localStorage.setItem(name, value);
	return;
}

function getLocalStorage(name) {
	return localStorage.getItem(name); 
}

// set function for CanvasSize
function setCanvasSize(width='', height='') {
	canvas.width = (width != '') ? width : canvasWidth.value;
	canvas.height = (height != '') ? height: canvasHeight.value;
}

// set function for CanvasBackground
function setCanvasBackground(color='') {
	if (backgroundColor.value == '#000000' || color == '#000000') {
		canvas.style.backgroundColor = (color != '') ? color : backgroundColor.value;
	} else {
		canvasCTX.fillStyle = (color != '') ? color : backgroundColor.value;	
		canvasCTX.fillRect(0, 0, canvas.width, canvas.height);
	}
}

// start visualizer function
function startVisualizer(prefObj) {

	if (prefObj.audioConfig == null) {
		initAudioConfiguration(prefObj);
	}

	handleVisualizer(0, prefObj);	

}

// stop visualizer function
function stopVisualizer(prefObj) {
	prefObj.audio.pause();
	canvasCTX.clearRect(0,0, canvas.width, canvas.height);
	if (prefObj.animationFrameReference != null) {
		setTimeout(function () {
			window.cancelAnimationFrame(prefObj.animationFrameReference);
		}, 1000);
	}
}

// handle visualization function
function handleVisualizer(timeStamp=0, prefObj) {	
	// setting canvas resolution
	setCanvasSize();

	// stop visualization if it is not present
	if (!window.hasOwnProperty(visualizerType.value)) {
		console.log('unspecified visualization');
		stopVisualizer(prefObj);
		return;
	}

	// dynamically calling visualization function from select option
	window[visualizerType.value](prefObj);

	// requesting animation frame to run visualization
	prefObj.animationFrameReference = window.requestAnimationFrame(function(timeStamp) {
		handleVisualizer(timeStamp, prefObj);
	});	
}

// Initialize Audio Configuration
function initAudioConfiguration(prefObj) {
	var audioCtx = new AudioContext();		
	// getting audio as media element source
	var audioSourceCtx = audioCtx.createMediaElementSource(prefObj.audio);
	// creating built in special analyser for audio which holds time and frequency data
	var analyser = audioCtx.createAnalyser();
	// connecting to audio source context with analyser node
	audioSourceCtx.connect(analyser);
	// connecting to audio output devices
	analyser.connect(audioCtx.destination);

	// built in analyser property fftsize which mentions that no.of audio samples we want (default 2048) min 32 goes 64, 128 ... to max 32768 of 2 power n
	analyser.fftsize = Number(fftBand.value);

	// read only property of analyser frequencyBinCount which is half of fftsize 
	// used to give no.of visualization bars
	var bufferLength = analyser.frequencyBinCount;

	// unsigned 8 bit integer array in format from frequencyBinCount
	var dataArray = new Uint8Array(bufferLength);

	// setting audio configuration 
	prefObj.audioConfig = {analyser: analyser, bufferLength: bufferLength, dataArray: dataArray};

	return true;
}

/* Bar Visualizers Types */
// barVisualizer function 
function barVisualizer() {

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);

	// fill background
	setCanvasBackground(backgroundColor.value);

	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting bar width
	barWidth = canvas.width / prefObj.audioConfig.bufferLength;
	
	// setting initial x co-ordinate
	x = 0;

	// iterating through all buffers
	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		// setting barHeight by scale factor
		barHeight = prefObj.audioConfig.dataArray[i] * parseFloat(animationScale.value/100);

		// setting rgb color
		redColor = (i * barHeight / 20);
		greenColor = i * 7;
		blueColor = barHeight / 2;

		// static or dynamic color
		if (foregroundColorType.value == 'dynamic') {
			rgbColor = `rgb(${redColor}, ${greenColor}, ${blueColor})`;
		} else {
			rgbColor = foregroundColor.value;
		}

		// setting color
		canvasCTX.fillStyle = rgbColor;
		// to the bottom of screen to start to draw
		canvasCTX.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
		x += Number(barWidth);
	}			
}

// doubleBarVisualizer visualizer
function doubleBarVisualizer() {

	// equally split overall canvas width into total bars by the half of width
	barWidth = (canvas.width/2) / prefObj.audioConfig.bufferLength;
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);

	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);
	
	x = 0;
	
	// first bar
	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			redColor = (i * barHeight / 20);
			greenColor = i * 7;
			blueColor = barHeight / 2;
			rgbColor = `rgb(${redColor}, ${greenColor}, ${blueColor})`;
		} else {
			rgbColor = foregroundColor.value;
		}

		canvasCTX.fillStyle = rgbColor;
		// to the bottom of screen to start to draw
		canvasCTX.fillRect(canvas.width/2 - x, canvas.height - barHeight, barWidth, barHeight);
		x += barWidth;
	}

	// second bar
	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			redColor = (i * barHeight / 20);
			greenColor = i * 7;
			blueColor = barHeight / 2;
			rgbColor = `rgb(${redColor}, ${greenColor}, ${blueColor})`;
		} else {
			rgbColor = foregroundColor.value;
		}

		canvasCTX.fillStyle = rgbColor;
		// to the bottom of screen to start to draw
		canvasCTX.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
		x += barWidth;
	}				
}

// horizonatalBarVisualizer function
function horizonatalBarVisualizer() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;
	// y = 0;
	
	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i + barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;	
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = Number(barWidth);

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.scale(1 + (volume * 1.2), 1);

		canvasCTX.beginPath();		
		canvasCTX.quadraticCurveTo(Math.sin(i) * x, Math.sin(volume) * barHeight, 0, 0);
		canvasCTX.stroke();
		canvasCTX.closePath()

		canvasCTX.restore();

		x += Number(barWidth);
		
	}

}

/* Circle Visualizers Types */
// circleVisualizer1 function
function circleVisualizer1() {
		
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting bar width
	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i + Math.PI * 2 / prefObj.audioConfig.bufferLength);

		hue = i * 0.693;
		saturation = `${barHeight * 1.112}%`;
		lightness = `${i * 0.3}%`;
		if (foregroundColorType.value == 'dynamic') {
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.fillStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.fillRect(0, 0, barWidth, barHeight);

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

// circleVisualizer2 function
function circleVisualizer2() {

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// Setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * 4.5);
		
		if (foregroundColorType.value == 'dynamic') {
			
			hue = i + 30 * 0.05;
			saturation = `${barHeight}%`;
			lightness = `${barHeight / 3}%`;

			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.fillStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.beginPath();

		factorValue = 4;
		
		canvasCTX.arc(0, barHeight / 2, barHeight / 2, 0, Math.PI / factorValue);
		canvasCTX.fill();
		canvasCTX.stroke();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

// circleVisualizer3 function
function circleVisualizer3() {

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// Setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * 4.5);
		
		if (foregroundColorType.value == 'dynamic') {
			
			hue = i + 30 * 0.05;
			saturation = `${barHeight}%`;
			lightness = `${barHeight / 3}%`;

			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.fillStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.beginPath();

		factorValue = 2.776;
		
		canvasCTX.arc(0, i / 1.115, barHeight / 3.112, 0, Math.PI / factorValue);
		canvasCTX.fill();
		canvasCTX.stroke();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();

		x += barWidth;
	}				
}

// circleVisualizer4 function
function circleVisualizer4() {

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// Setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * 4.5);
		
		if (foregroundColorType.value == 'dynamic') {
			
			hue = i + 30 * 0.15;
			saturation = `${barHeight}%`;
			lightness = `${barHeight / 1.112}%`;

			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.fillStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.beginPath();

		factorValue = 3.776;
		
		canvasCTX.arc(0, barHeight / 1.115, i / 3.112, 0, Math.PI / factorValue);
		canvasCTX.fill();
		canvasCTX.stroke();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();

		x += barWidth;
	}				
}

// circleVisualizer5 function
function circleVisualizer5() {

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// Setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * 4.5);
		
		if (foregroundColorType.value == 'dynamic') {
			
			hue = i + 30 * 0.15;
			saturation = `${barHeight}%`;
			lightness = `${barHeight / 1.112}%`;

			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.fillStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.beginPath();

		factorValue = 3.776;
		
		canvasCTX.arc(0, barHeight / 1.115, i / 0.789, 0, Math.PI / factorValue);
		canvasCTX.fill();
		canvasCTX.stroke();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();

		x += barWidth;
	}				
}

// circleVisualizer6 function
function circleVisualizer6() {

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// Setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * 4.5);
		
		if (foregroundColorType.value == 'dynamic') {
			
			hue = i + 30 * 0.15;
			saturation = `${barHeight}%`;
			lightness = `${barHeight / 1.112}%`;

			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.fillStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.beginPath();

		factorValue = 5.776;
		
		canvasCTX.arc(0, barHeight / 1.115, i * 0.6, 0, Math.PI / factorValue);
		canvasCTX.fill();
		canvasCTX.stroke();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

// circleVisualizer7 function
function circleVisualizer7() {
	
	// equally split overall canvas width into total bars
	barWidth = (canvas.width / prefObj.audioConfig.bufferLength) * 3;

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * prefObj.audioConfig.bufferLength * 4);

		if (foregroundColorType.value == 'dynamic') {
			hue = i + 30 * 0.05;
			saturation = '100%';
			lightness = `${barHeight / 3}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.fillStyle = hslColor;
		
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.fillRect(0, 0, barWidth, barHeight);

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

// circleVisualizer8 function
function circleVisualizer8() {
	
	// equally split overall canvas width into total bars
	barWidth = (canvas.width / prefObj.audioConfig.bufferLength) * 3;

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * prefObj.audioConfig.bufferLength);

		if (foregroundColorType.value == 'dynamic') {
			hue = i + 30 * 0.05;
			saturation = '100%';
			lightness = `${barHeight}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.fillStyle = hslColor;
		
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.fillRect(0, i, barWidth, barHeight);

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

// circleVisualizer9 function
function circleVisualizer9() {
	
	// equally split overall canvas width into total bars
	barWidth = (canvas.width / prefObj.audioConfig.bufferLength) * 3;

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * prefObj.audioConfig.bufferLength * Math.sin(i));

		if (foregroundColorType.value == 'dynamic') {
			hue = i + 30 * 0.112;
			saturation = `${i}%`;
			lightness = `${barHeight}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.fillStyle = hslColor;
		
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.fillRect(0, i, x, barHeight * 0.789);

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

// circleVisualizer10 function
function circleVisualizer10() {
	
	// equally split overall canvas width into total bars
	barWidth = (canvas.width / prefObj.audioConfig.bufferLength) * 3;

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * prefObj.audioConfig.bufferLength * Math.sin(i) * Math.cos(x));

		if (foregroundColorType.value == 'dynamic') {
			hue = i + 30 * 0.112;
			saturation = `${i * 2.65}%`;
			lightness = `${barHeight * 0.623}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.fillStyle = hslColor;
		
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.fillRect(0, x, barWidth, barHeight * Math.sin(i));

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

// circleVisualizer11 function
function circleVisualizer11() {	

	// equally split overall canvas width into total bars
	barWidth = (canvas.width / prefObj.audioConfig.bufferLength) * 3;

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * prefObj.audioConfig.bufferLength * 4);

		if (foregroundColorType.value == 'dynamic') {
			hue = i + 30 * 0.05;
			saturation = '100%';
			lightness = `${barHeight / 3}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.fillStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.beginPath();

		factorValue = 4;
		
		canvasCTX.arc(0, barHeight, barHeight * 0.1, 0, Math.PI * factorValue);		

		canvasCTX.fill();
		canvasCTX.stroke();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

// circleVisualizer12 function
function circleVisualizer12() {	

	// equally split overall canvas width into total bars
	barWidth = (canvas.width / prefObj.audioConfig.bufferLength) * 3;

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * prefObj.audioConfig.bufferLength * 4);

		if (foregroundColorType.value == 'dynamic') {
			hue = i + 30 * 0.05;
			saturation = '100%';
			lightness = `${barHeight / 3}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.fillStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.beginPath();

		factorValue = 1.112;
		
		canvasCTX.arc(x, i, barHeight * 0.2115, 0, Math.PI * factorValue);		

		canvasCTX.fill();
		canvasCTX.stroke();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

// circleVisualizer13 function
function circleVisualizer13() {	

	// equally split overall canvas width into total bars
	barWidth = (canvas.width / prefObj.audioConfig.bufferLength) * 3;

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * parseFloat(animationScale.value/100);

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * prefObj.audioConfig.bufferLength * 2);

		if (foregroundColorType.value == 'dynamic') {
			hue = i + 30 * 0.05;
			saturation = '100%';
			lightness = `${barHeight / 3}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.fillStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.beginPath();

		factorValue = 2.112;
		canvasCTX.arc(x, i, barHeight * 0.156, 0, Math.PI * factorValue);
		canvasCTX.fill();
		canvasCTX.stroke();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();

		x += barWidth;
	}				
}

// circleVisualizer14 function
function circleVisualizer14() {	

	// equally split overall canvas width into total bars
	barWidth = (canvas.width / prefObj.audioConfig.bufferLength) * 3;

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * prefObj.audioConfig.bufferLength * 3.123);

		if (foregroundColorType.value == 'dynamic') {
			hue = i + 30 * 0.05;
			saturation = '100%';
			lightness = `${barHeight / 3}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.fillStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.beginPath();

		factorValue = 3.112;
		
		canvasCTX.arc(x, i * 1.115, barHeight * 0.115, i * 0.015, Math.PI * factorValue);
		canvasCTX.arc(x * 1.675, i * 1.715, barHeight * 0.215, i * 0.112, Math.PI * factorValue);			

		canvasCTX.fill();
		canvasCTX.stroke();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

// circleVisualizer15 function
function circleVisualizer15() {	

	// equally split overall canvas width into total bars
	barWidth = (canvas.width / prefObj.audioConfig.bufferLength) * 3;

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * parseFloat(animationScale.value/100);

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * prefObj.audioConfig.bufferLength * Math.sin(i) * 2);

		if (foregroundColorType.value == 'dynamic') {
			hue = i + 30 * 0.05;
			saturation = '100%';
			lightness = `${barHeight / 3}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.fillStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.beginPath();

		factorValue = 2.112;
		
		canvasCTX.arc(x, i, barHeight * 0.156, 0, Math.PI * factorValue);		

		canvasCTX.fill();
		canvasCTX.stroke();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

// circleVisualizer16 function
function circleVisualizer16() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * (Number(animationScale.value/100));			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * prefObj.audioConfig.bufferLength * 0.15);

		if (foregroundColorType.value == 'dynamic') {
			hue = i + 30 * 0.05;
			saturation = '100%';
			lightness = `${barHeight / 3}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.lineWidth = barHeight / 20;
		canvasCTX.strokeStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.beginPath();
		canvasCTX.moveTo(0, barHeight *  0.127 * Math.sin(i * 25));
		canvasCTX.lineTo(barHeight * 0.5, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();

		x += barWidth;
	}				
}

// circleVisualizer17 function
function circleVisualizer17() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * (Number(animationScale.value/100));			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * prefObj.audioConfig.bufferLength * 0.15);

		if (foregroundColorType.value == 'dynamic') {
			hue = i + 30 * 0.05;
			saturation = '100%';
			lightness = `${barHeight / 3}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.lineWidth = barHeight / 20;
		canvasCTX.strokeStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.beginPath();
		canvasCTX.moveTo(0, barHeight *  0.127 * Math.sin(i * 25));
		canvasCTX.lineTo(i * Math.sin(i * 25), i * 0.015);
		canvasCTX.stroke();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();

		x += barWidth;
	}				
}

// circleVisualizer18 function
function circleVisualizer18() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * (Number(animationScale.value/100));			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * prefObj.audioConfig.bufferLength * 0.15);

		if (foregroundColorType.value == 'dynamic') {
			hue = i + 30 * 0.05;
			saturation = '100%';
			lightness = `${barHeight / 3}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.lineWidth = barHeight / 20;
		canvasCTX.strokeStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.beginPath();
		canvasCTX.moveTo(0, barHeight *  0.627 * Math.sin(i * 1.112));
		canvasCTX.lineTo(i * Math.sin(i * 36), i * Math.cos(i * 5.112));
		canvasCTX.stroke();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();

		x += barWidth;
	}				
}

// circleVisualizer19 function
function circleVisualizer19() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.015;
			saturation = `${barHeight * 1.15}%`;
			lightness = `${barHeight * 0.42}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;			
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i);
		canvasCTX.beginPath();
		canvasCTX.moveTo(100, 100);
		canvasCTX.lineTo(0, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth;
	}
}

// circleVisualizer20 function
function circleVisualizer20() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i);
		canvasCTX.beginPath();
		canvasCTX.moveTo(0, 0);
		canvasCTX.lineTo(10, i * barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth;
	}
}

// circleVisualizer21 function
function circleVisualizer21() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;
	
	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i + barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.fillStyle = hslColor;
		canvasCTX.lineWidth = Number(barWidth);

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.scale(1 + (volume * 1.2), 1);
		canvasCTX.beginPath();		
		canvasCTX.arc(barHeight, barWidth, i, x, Math.PI * 2);
		canvasCTX.fill();
		canvasCTX.closePath()
		canvasCTX.restore();

		x += Number(barWidth);
		
	}
}

// circleVisualizer22 function
function circleVisualizer22() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;
	
	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i + barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.fillStyle = hslColor;
		canvasCTX.lineWidth = Number(barWidth);

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.scale(1 + (volume * 1.2), 1);
		canvasCTX.beginPath();		
		canvasCTX.arc(0, 0, Math.abs(barHeight), Math.PI, Math.PI * 2);
		canvasCTX.fill();
		canvasCTX.closePath()
		canvasCTX.restore();

		x += Number(barWidth);
		
	}
}

// circleVisualizer23 function
function circleVisualizer23() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;
	
	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i + barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;	
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.fillStyle = hslColor;
		canvasCTX.lineWidth = Number(barWidth);
		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.scale(1 + (volume * 1.2), 1);
		canvasCTX.beginPath();		
		canvasCTX.arc(0, 0, Math.abs(barHeight), 0, Math.PI * 2);
		canvasCTX.fill();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += Number(barWidth);
		
	}
}

/* Wave Visualizers Types */
// waveVisualizer1 function
function waveVisualizer1() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {

		barHeight = (i % 10 == 0) ? prefObj.audioConfig.dataArray[i] * 1.1 : prefObj.audioConfig.dataArray[i] * -1.1;
		barHeight *= Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.055;
			saturation = `${i * 0.589}%`;
			lightness = `${Math.abs(barHeight) * 0.789}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.fillStyle = hslColor;		
		canvasCTX.fillRect(x, canvas.height/2, barWidth, barHeight);

		x += barWidth;
	}
}

// waveVisualizer2 function
function waveVisualizer2() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {

		barHeight = Math.sin(i * 25) * prefObj.audioConfig.dataArray[i] * -1.125 * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.05;
			saturation = '100%';
			lightness = `${Math.abs(barHeight) / 3}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.fillStyle = hslColor;
		canvasCTX.fillRect(x * 2, canvas.height/2, barWidth * 2, barHeight);	
		
		x += barWidth;

	}
}

// waveVisualizer3 function
function waveVisualizer3() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {

		barHeight = Math.sin(i * 25) * prefObj.audioConfig.dataArray[i] * -0.659 * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.05;
			saturation = '100%';
			lightness = `${Math.abs(barHeight) / 3}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.fillStyle = hslColor;
		canvasCTX.fillRect(x * 2, canvas.height/2, i * 0.325, barHeight);	
		
		x += barWidth;

	}
}

// waveVisualizer4 function
function waveVisualizer4() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {

		barHeight = Math.sin(i * 25) * prefObj.audioConfig.dataArray[i] * -1.125 * Number(animationScale.value / 100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.05;
			saturation = '100%';
			lightness = `${Math.abs(barHeight) / 3}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;		
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(Math.sin(i) * Math.cos(i));
		canvasCTX.beginPath();
		canvasCTX.moveTo(0, 0);
		canvasCTX.lineTo(barWidth * 0.2, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth
	}
}

// waveVisualizer5 function
function waveVisualizer5() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {

		barHeight = Math.sin(i * 36) * prefObj.audioConfig.dataArray[i] * -1.125 * Number(animationScale.value / 100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.05;
			saturation = `${i * 0.356}%`;
			lightness = `${Math.abs(barHeight) * 0.656}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;		
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(Math.sin(i) * Math.cos(i * 2.115));
		canvasCTX.beginPath();
		canvasCTX.moveTo(0, i);
		canvasCTX.lineTo(x, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth
	}
}

// waveVisualizer6 function
function waveVisualizer6() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {

		barHeight = Math.sin(i * 36) * prefObj.audioConfig.dataArray[i] * -1.125 * Number(animationScale.value / 100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.05;
			saturation = `${i * 0.356}%`;
			lightness = `${Math.abs(barHeight) * 0.656}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;		
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(Math.sin(i) * Math.cos(i * 2.115));
		canvasCTX.beginPath();
		canvasCTX.moveTo(0, 0);
		canvasCTX.lineTo(i - canvas.width, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.beginPath();
		canvasCTX.moveTo(0, 0);
		canvasCTX.lineTo(canvas.width - i, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth
	}
}

// waveVisualizer7 function
function waveVisualizer7() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {

		barHeight = Math.sin(i * 36) * prefObj.audioConfig.dataArray[i] * -1.125 * Number(animationScale.value / 100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.05;
			saturation = `${i * 0.356}%`;
			lightness = `${Math.abs(barHeight) * 0.656}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;		
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(Math.sin(i) * Math.cos(i * 2.115));
		canvasCTX.beginPath();
		canvasCTX.moveTo(x, 0);
		canvasCTX.lineTo(i - canvas.width, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.beginPath();
		canvasCTX.moveTo(0, 0);
		canvasCTX.lineTo(canvas.width - i, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth
	}
}

// waveVisualizer8 function
function waveVisualizer8() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {

		barHeight = prefObj.audioConfig.dataArray[i] * Math.sin(i * 10) * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.05;
			saturation = `${barHeight * 2.15}%`;
			lightness = `${barHeight * 1.12}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;
		
		x += 0.5;
		y += 0.6;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(Math.sin(i) * 3);
		canvasCTX.beginPath();
		canvasCTX.moveTo(0, 0);
		canvasCTX.quadraticCurveTo((i * 1.12) - barHeight * 0.51 , barHeight - (i * 0.3), Math.sin(x*0.2), Math.cos(y * i * 0.6));
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();
			
	}
}

// waveVisualizer9 function
function waveVisualizer9() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);
	
	// setting barWidth
	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x & y co-ordinates
	x = 0;
	y = 0;

	canvasCTX.beginPath();		

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
	  barHeight = (prefObj.audioConfig.dataArray[i] / 128) * Number(animationScale.value/100);
	  y = barHeight * (canvas.height / 2);

		if (foregroundColorType.value == 'dynamic') {
			hue = Math.sqrt(y) * 300;
			saturation = `${y * 0.312}%`;
			lightness = `${y * 0.12}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;	
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.lineWidth = 2;
		canvasCTX.strokeStyle = hslColor;
		
	  if (i === 0) {
	    canvasCTX.moveTo(x, y);
	  } else {
	    canvasCTX.lineTo(x, y);
	  }
	  x += barWidth;
	}	

	canvasCTX.lineTo(canvas.width, canvas.height / 2);
	canvasCTX.stroke();		
	canvasCTX.closePath();
}

// waveVisualizer10 function
function waveVisualizer10() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)	

	// setting initial x & y co-ordinates
	x = 0;
	y = 0;

	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);
	const moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);

	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	// setting barWidth
	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = Math.sin(moreSamples[i]) * volume * 128;// * Math.atan(moreSamples[i]);
		const y = barHeight * (canvas.height / 2);

		if (foregroundColorType.value == 'dynamic') {
			hue = volume * 300;
			saturation = `${Math.abs(barHeight) * 3.15}%`;
			lightness = `${Math.abs(barHeight) * 3.56}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.fillStyle = hslColor;
		canvasCTX.fillRect(i, canvas.height/2, barWidth, barHeight * 2.15);

		x += barWidth;
	}
}

// waveVisualizer11 function
function waveVisualizer11() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;

		canvasCTX.fillStyle = hslColor;
		canvasCTX.fillRect(x, canvas.height/2, barWidth, barHeight * 100);

		x += barWidth;
	}
}

// waveVisualizer12 function
function waveVisualizer12() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i * barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		// ease effect
		let soundLevel = barHeight;
		if (soundLevel > 20) {
			y = soundLevel;
		} else {
			y -= y * 0.00021; 
		}
		
		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i * 0.0612);
		canvasCTX.beginPath();
		canvasCTX.moveTo(0, 0);
		canvasCTX.lineTo(0, y);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth;
		
	}
}

// waveVisualizer13 function
function waveVisualizer13() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i * barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;	
		} else {
			hslColor = foregroundColor.value;
		}

		// ease effect
		let soundLevel = barHeight;
		if (soundLevel > 20) {
			y = soundLevel;
		} else {
			y -= y * 0.00021; 
		}
		
		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i * 9.364);
		canvasCTX.beginPath();
		canvasCTX.moveTo(x * 0.01, i);
		canvasCTX.lineTo(100, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth;
		
	}
}

// waveVisualizer14 function
function waveVisualizer14() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i * barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		// ease effect
		let soundLevel = barHeight;
		if (soundLevel > 30) {
			y = soundLevel;
		} else {
			y -= y * 0.00021; 
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i * 7.369);
		canvasCTX.beginPath();
		canvasCTX.moveTo(x * 0.01, i);
		canvasCTX.lineTo(y, 100);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth;
		
	}
}

// waveVisualizer15 function
function waveVisualizer15() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i * barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		// ease effect
		let soundLevel = barHeight;
		if (soundLevel > 30) {
			y = soundLevel;
		} else {
			y -= y * 0.00021; 
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i * 3.369);
		canvasCTX.beginPath();
		canvasCTX.moveTo(x * 0.01, x * 0.25);
		canvasCTX.lineTo(y, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth;
		
	}
}

// waveVisualizer16 function
function waveVisualizer16() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * (Number(animationScale.value/100) - 0.3);			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * prefObj.audioConfig.bufferLength / 1.5);

		if (foregroundColorType.value == 'dynamic') {
			hue = i + 30 * 0.05;
			saturation = '100%';
			lightness = `${barHeight / 3}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.lineWidth = barHeight / 20;
		canvasCTX.strokeStyle = hslColor;
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.beginPath();
		canvasCTX.moveTo(0, barHeight / 2.7 * Math.sin(i * barHeight));
		canvasCTX.lineTo(barHeight * 0.5, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

/* Rotation Visualizers Types */
// rotationVisualizer1 function
function rotationVisualizer1() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / moreSamples.length;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i * barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;	
		} else {
			hslColor = foregroundColor.value;
		}

		// ease effect
		let soundLevel = barHeight;
		if (soundLevel > 30) {
			y = soundLevel;
		} else {
			y -= y * 0.00021; 
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = Number(barWidth) * 1.23;
		
		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i * 3.369);
		canvasCTX.beginPath();
		canvasCTX.moveTo(x, y);
		canvasCTX.lineTo(x, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += Number(barWidth);
		
	}
}

// rotationVisualizer2 function
function rotationVisualizer2() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / moreSamples.length;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i + barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;	
		} else {
			hslColor = foregroundColor.value;
		}

		// ease effect
		let soundLevel = barHeight;
		if (soundLevel > 30) {
			y = soundLevel;
		} else {
			y -= y * 0.00021; 
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = Number(barWidth) + Number(i) * 0.321;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i * 3.369);
		canvasCTX.beginPath();
		canvasCTX.moveTo(x, y);
		canvasCTX.lineTo(x, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += Number(barWidth) - Number(i * 0.015);
		
	}
}

// rotationVisualizer3 function
function rotationVisualizer3() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / moreSamples.length;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i + barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		// ease effect
		let soundLevel = barHeight;
		if (soundLevel > 30) {
			y = soundLevel;
		} else {
			y -= y * 0.00021; 
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = Number(barWidth) + Number(i) * 0.321;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i * 1.369);
		canvasCTX.beginPath();
		canvasCTX.moveTo(x, y);
		canvasCTX.lineTo(barHeight, i);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += Number(barWidth) - Number(i * 0.015);
		
	}
}

// rotationVisualizer4 function
function rotationVisualizer4() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / moreSamples.length;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i + barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		// ease effect
		let soundLevel = barHeight;
		if (soundLevel > 30) {
			y = soundLevel;
		} else {
			y -= y * 0.00021; 
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = Number(barWidth) + Number(i) * 0.321;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(x + (y * 0.09));
		canvasCTX.beginPath();
		canvasCTX.moveTo(x, y);
		canvasCTX.lineTo(x, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += Number(barWidth) - Number(i * 0.0215);
		
	}
}

// rotationVisualizer5 function
function rotationVisualizer5() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / moreSamples.length;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i + barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;			
		} else {
			hslColor = foregroundColor.value;
		}

		// ease effect
		let soundLevel = barHeight;
		if (soundLevel > 30) {
			y = soundLevel;
		} else {
			y -= y * 0.00021; 
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = Number(barWidth);

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(x + (y * 0.09));
		canvasCTX.beginPath();
		canvasCTX.moveTo(x, i * 1.5);
		canvasCTX.lineTo(barWidth, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += Number(barWidth);
		
	}
}

// rotationVisualizer6 function
function rotationVisualizer6() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i + barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;			
		} else {
			hslColor = foregroundColor.value;
		}

		// ease effect
		let soundLevel = barHeight;
		if (soundLevel > 30) {
			y = soundLevel;
		} else {
			y -= y * 0.00021; 
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = Number(barWidth);

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i * 1.15 + + (y * 0.09));
		canvasCTX.beginPath();
		canvasCTX.moveTo(i * 5, x * 2.312);
		canvasCTX.lineTo(x, y * 0.912);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += Number(barWidth);
		
	}
}

// rotationVisualizer7 function
function rotationVisualizer7() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i + barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		// ease effect
		let soundLevel = barHeight;
		if (soundLevel > 30) {
			y = soundLevel;
		} else {
			y -= y * 0.00021; 
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = Number(barWidth);

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(x + (y * 0.09));
		canvasCTX.beginPath();
		canvasCTX.moveTo(i * 5, x * 2.312);
		canvasCTX.lineTo(x, Number(i) + Number(y * 3.115));
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += Number(barWidth);
		
	}
}

/* Spiral Visualizers Types */

// spiralVisualizer1 function
function spiralVisualizer1() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;
	
	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i + barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.strokeStyle = hslColor;

		canvasCTX.lineWidth = Number(barWidth);

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i * 0.03);	
		canvasCTX.beginPath();
		canvasCTX.moveTo(i + barWidth, 0);
		canvasCTX.lineTo(i + barWidth, barHeight + barWidth);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

	}
}

// spiralVisualizer2 function
function spiralVisualizer2() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;
	
	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i + barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;	
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = Number(barWidth);

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate((i + volume * 100) * 0.04);
		canvasCTX.beginPath();
		canvasCTX.moveTo(i + barWidth, 0);
		canvasCTX.lineTo(i + barWidth, barHeight + barWidth);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += Number(barWidth);		
		
	}
}

// spiralVisualizer3 function
function spiralVisualizer3() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;
	
	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i + barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.strokeStyle = hslColor;

		canvasCTX.lineWidth = Number(barWidth);

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate((i + volume * 10) * 0.04);
		canvasCTX.fillStyle = hslColor;
		canvasCTX.fillRect(i + barWidth, 0, 1, barHeight * volume * 10);
		canvasCTX.restore();

		x += Number(barWidth);
		
	}
}

// spiralVisualizer4 function
function spiralVisualizer4() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;
	
	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100) * 100;

		if (foregroundColorType.value == 'dynamic') {
			hue = i + barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;		
		} else {
			hslColor = foregroundColor.value;
		}

		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = Number(barWidth);

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate((i * 1.15 + (barHeight * 0.09)) * 0.0565);
		canvasCTX.scale(1 + (volume * 1.2), 1);
		canvasCTX.beginPath();
		canvasCTX.moveTo(i + barWidth, 0);
		canvasCTX.lineTo(i + barWidth, barHeight + barWidth);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += Number(barWidth);
		
	}
}

// spiralVisualizer5 function
function spiralVisualizer5() {
	
	// equally split overall canvas width into total bars
	barWidth = (canvas.width / prefObj.audioConfig.bufferLength) * 5;

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();

	// setting initial x co-ordinates
	x = 0;

	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * parseFloat(animationScale.value/100);			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * Math.PI * 4 / prefObj.audioConfig.bufferLength);

		hue = barHeight * i;
		saturation = '100%';
		lightness = '50%';			
		if (foregroundColorType.value == 'dynamic') {
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.fillStyle = hslColor;
		canvasCTX.fillRect(0, 0, barWidth, barHeight);
		canvasCTX.beginPath();		
		canvasCTX.fillStyle = hslColor;
		canvasCTX.arc(0, barHeight, barWidth, 0, Math.PI * 2);
		canvasCTX.fill();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

// spiralVisualizer6 function
function spiralVisualizer6() {
	
	// equally split overall canvas width into total bars
	barWidth = (canvas.width / prefObj.audioConfig.bufferLength) * 5;

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();

	// setting initial x co-ordinates
	x = 0;

	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * parseFloat(animationScale.value/100);			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * Math.PI * 4 / prefObj.audioConfig.bufferLength);

		hue = barHeight;
		saturation = '100%';
		lightness = '50%';			
		if (foregroundColorType.value == 'dynamic') {
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.fillStyle = foregroundColor.value;
		canvasCTX.fillRect(0, 0, barWidth, barHeight);
		canvasCTX.beginPath();		
		canvasCTX.fillStyle = hslColor;
		canvasCTX.arc(0, barHeight, barWidth, 0, Math.PI * 2);
		canvasCTX.fill();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

// spiralVisualizer7 function
function spiralVisualizer7() {
	
	// equally split overall canvas width into total bars
	barWidth = (canvas.width / prefObj.audioConfig.bufferLength) * 5;

	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();

	// setting initial x co-ordinates
	x = 0;

	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {
		barHeight = prefObj.audioConfig.dataArray[i] * parseFloat(animationScale.value/100);			

		// saving context setting
		canvasCTX.save()
		// translate to center of canvas
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		// rotate by the bufferLength
		canvasCTX.rotate(i * Math.PI * 4 / prefObj.audioConfig.bufferLength);

		hue = barHeight * i;
		saturation = '100%';
		lightness = '50%';			
		if (foregroundColorType.value == 'dynamic') {
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		// due to translate to center need to set co-ordinates to 0, 0
		canvasCTX.fillStyle = foregroundColor.value;
		canvasCTX.fillRect(0, 0, barWidth, barHeight);
		canvasCTX.beginPath();		
		canvasCTX.fillStyle = hslColor;
		canvasCTX.arc(0, barHeight, barWidth, 0, Math.PI * 2);
		canvasCTX.fill();
		canvasCTX.closePath();

		// restore the old setting from save
		canvasCTX.restore();
		
		x += barWidth;
	}				
}

// spiralVisualizer8 function
function spiralVisualizer8() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {

		barHeight = prefObj.audioConfig.dataArray[i] * Math.sin(i * 10) * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.05;
			saturation = `${barHeight * 2.15}%`;
			lightness = `${barHeight * 1.12}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;		
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i);
		canvasCTX.beginPath();
		canvasCTX.moveTo(x, 0);
		canvasCTX.quadraticCurveTo(x * 1.56, canvas.height/2, x, barHeight);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth;
	}
}

// spiralVisualizer9 function
function spiralVisualizer9() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {

		barHeight = prefObj.audioConfig.dataArray[i] * Math.sin(i * 10) * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.05;
			saturation = `${barHeight * 2.15}%`;
			lightness = `${barHeight * 1.12}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;	
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i);
		canvasCTX.beginPath();
		canvasCTX.moveTo(x, 0);
		canvasCTX.quadraticCurveTo(i, barHeight, Math.sin(x) * 1.12, canvas.height/2);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth;
	}
}

// spiralVisualizer10 function
function spiralVisualizer10() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {

		barHeight = prefObj.audioConfig.dataArray[i] * Math.sin(i * 10) * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.05;
			saturation = `${barHeight * 2.15}%`;
			lightness = `${barHeight * 1.12}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i);
		canvasCTX.beginPath();
		canvasCTX.moveTo(i, 0);
		canvasCTX.quadraticCurveTo(barWidth, x, Math.sin(x) * 1.12, canvas.height/2);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth;
	}
}

// spiralVisualizer11 function
function spiralVisualizer11() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {

		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.05;
			saturation = `${barHeight * 2.15}%`;
			lightness = `${barHeight * 1.12}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i * 0.112);
		canvasCTX.beginPath();
		canvasCTX.moveTo(i, 0);
		canvasCTX.quadraticCurveTo(2, 3, barHeight * 0.112, x);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth;
	}
}

// spiralVisualizer12 function
function spiralVisualizer12() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {

		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.05;
			saturation = `${barHeight * 2.15}%`;
			lightness = `${barHeight * 1.12}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i * 0.312);
		canvasCTX.beginPath();
		canvasCTX.moveTo(i, 0);
		canvasCTX.quadraticCurveTo(x * 0.01, i * 0.12, barHeight * 0.112, x);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth;
	}
}

// spiralVisualizer13 function
function spiralVisualizer13() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteFrequencyData(prefObj.audioConfig.dataArray);

	barWidth = canvas.width / prefObj.audioConfig.bufferLength;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < prefObj.audioConfig.bufferLength; i++) {

		barHeight = prefObj.audioConfig.dataArray[i] * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * 30 * 0.15;
			saturation = `${barHeight * 2.15}%`;
			lightness = `${barHeight * 1.12}%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i * 0.012);
		canvasCTX.beginPath();
		canvasCTX.moveTo(x, i);
		canvasCTX.quadraticCurveTo(i * 0.512, i, barHeight * 2.712, x * 0.5112);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth;
	}
}

// spiralVisualizer14 function
function spiralVisualizer14() {
	
	// clear everything in canvas drawing context
	canvasCTX.clearRect(0, 0, canvas.width, canvas.height);
	
	// fill background
	setCanvasBackground();
	
	// which has decibel value of frequency (0-255)
	prefObj.audioConfig.analyser.getByteTimeDomainData(prefObj.audioConfig.dataArray);

	let moreSamples = [...prefObj.audioConfig.dataArray].map(e => e/128 - 1);
	let sum = 0;
	for (let j = 0; j < moreSamples.length; j++) {
		sum += moreSamples[j] * moreSamples[j];
	}
	let volume = Math.sqrt(sum / moreSamples.length);		

	barWidth = canvas.width / 256;

	// setting initial x co-ordinates
	x = 0;

	for (let i = 0; i < 256; i++) {

		barHeight = moreSamples[i] * Number(animationScale.value/100);

		if (foregroundColorType.value == 'dynamic') {
			hue = i * barWidth;
			saturation = `100%`;
			lightness = `50%`;
			hslColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		} else {
			hslColor = foregroundColor.value;
		}
		canvasCTX.strokeStyle = hslColor;
		canvasCTX.lineWidth = barWidth;

		canvasCTX.save();
		canvasCTX.translate(canvas.width/2, canvas.height/2);
		canvasCTX.rotate(i);
		canvasCTX.beginPath();
		canvasCTX.moveTo(x, canvas.height);
		canvasCTX.lineTo(x * 0.651, i * barHeight * 0.5);
		canvasCTX.stroke();
		canvasCTX.closePath();
		canvasCTX.restore();

		x += barWidth;
	}
}

/* event listeners */
// audioInput change event listener
audioInput.addEventListener('change', function(e) {

	// check for any file uploaded 
	if (audioInput.files.length == 0) {
		alert('Please select audio file');
		return false;
	}

	// setting audio file src to audio control
	audioControl.src = URL.createObjectURL(audioInput.files[0]);
	
	// loading audio control
	audioControl.load();
	audioControl.play();

	// setting audio control for visualizer initialization
	prefObj.audio = audioControl;

});

// playButton click event listener
playButton.addEventListener('click', function(e) {
	// getting current state from button text
	let state = playButton.innerText.toLowerCase();

	// check for any audio file exist for play
	if (prefObj.audio == null) {
		alert('Please upload audio file');
		return;
	}

	// if it is paused state then change button text as Pause and play the audio
	if (state == 'play') {
		playButton.innerText = 'Pause';
		prefObj.audio.play();
		return;
	}

	// if it is play state then change button text as Play and pause the audio
	playButton.innerText = 'Play';	
	prefObj.audio.pause();

});

// recordButton click event listener
recordButton.addEventListener('click', function(e) {
	// getting current state from button text
	let state = recordButton.innerText.toLowerCase();

	// check for any audio file exist for record visualization
	if (prefObj.audio == null) {
		alert('Please upload audio file');
		return;
	}

	// if it is stopped stage then start capturing and change the button text as stop record
	if (state == 'start record') {
		// creating and setting stream captureStream with given fps value
		prefObj.stream = canvas.captureStream(fps.value);
		// creating and setting MediaRecorder with created stream input
		prefObj.recorder = new MediaRecorder(prefObj.stream);
		// initialize with empty value for recording
		prefObj.videoChunks = [];
		prefObj.recorderTimes = [];
		// setting events to store video chunks
		prefObj.recorder.ondataavailable = (e) => prefObj.videoChunks.push(e.data);
		// setting events to stop
		prefObj.recorder.onstop = () => {
			// creating and setting new Blob from chunks with supported video file type
			const videoBlob = new Blob(prefObj.videoChunks, { type: 'video/webm' });
			// creating and setting objectURL for download 
			const videoUrl = URL.createObjectURL(videoBlob);

			// initialize variables for file name with audio time
			let hh = 0;
			let mm = 0;
			let ss = 0;
			let ms = 0;
			
			// getting startTime in the format hh_mm_ss_ms
			let startTime = prefObj.recorderTimes[0];
			hh = Math.floor(startTime / (60 * 60));
			mm = Math.floor((startTime / 60) % 60);
			ss = Math.floor(startTime % 60);
			ms = Math.floor(((startTime % 60) - ss) * 100);
			startTime = `${hh}_${mm}_${ss}_${ms}`;
			
			// getting endTime in the format hh_mm_ss_ms
			let endTime = prefObj.recorderTimes[1];
			hh = Math.floor(endTime / (60 * 60));
			mm = Math.floor((endTime / 60) % 60);
			ss = Math.floor(endTime % 60);
			ms = Math.floor(((endTime % 60) - ss) * 100);			
			endTime = `${hh}_${mm}_${ss}_${ms}`;

			// Create a downloadable link
			const link = document.createElement('a');
			link.href = videoUrl;
			link.download = `canvas_video-T${startTime}-${endTime}.webm`;
			link.click();

			// Revoke object URL to avoid memory leaks
			URL.revokeObjectURL(videoUrl);

		};

		// setting startTime into recorderTimes array
		prefObj.recorderTimes.push(audioControl.currentTime);
		// starting recorder
		prefObj.recorder.start();
		// setting button text as stop record
		recordButton.innerText = 'Stop Record';	

	} else if (state == 'stop record'){ // if it is recording stage then stop capturing and change the button text as start record
		// setting endTime into recorderTimes array
		prefObj.recorderTimes.push(audioControl.currentTime);
		// stopping recorder
		prefObj.recorder.stop();
		// setting button text as start record
		recordButton.innerText = 'Start Record';
	}

});

// audioControl playing event listener
audioControl.addEventListener('playing', function(e) {
	playButton.innerText = 'Pause';
	startVisualizer(prefObj);
});

// audioControl pause event listener
audioControl.addEventListener('pause', function(e) {
	playButton.innerText = 'Play';
	stopVisualizer(prefObj);
});

// audioControl ended event listener
audioControl.addEventListener('ended', function(e) { 
	playButton.innerText = 'Play';
	stopVisualizer(prefObj);
});

// visualizerType change event listener
visualizerType.addEventListener('change', function(e) {
	setLocalStorage('visualizer.visualizerType', visualizerType.value);
});

// fftBand change event listener
fftBand.addEventListener('change', function(e) {
	setLocalStorage('visualizer.fftBand', fftBand.value);
});

// canvasWidth input event listener
canvasWidth.addEventListener('input', function(e) {
	setLocalStorage('visualizer.canvasWidth', canvasWidth.value);
});

// setDeviceWidthButton click event listener 
setDeviceWidthButton.addEventListener('click', function(e) {
	canvasWidth.value = window.outerWidth;
});

// canvasHeight input event listener
canvasHeight.addEventListener('input', function(e) {
	setLocalStorage('visualizer.canvasHeight', canvasHeight.value);
});

// setDeviceHeightButton click event listener 
setDeviceHeightButton.addEventListener('click', function(e) {
	canvasHeight.value = window.outerHeight;
});

// animationScale input event listener
animationScale.addEventListener('input', function(e) {
	setLocalStorage('visualizer.animationScale', animationScale.value);
});

// fps input event listener
fps.addEventListener('input', function(e) {
	setLocalStorage('visualizer.fps', fps.value);
});

// foregroundColorType change event listener
foregroundColorType.addEventListener('change', function(e) {
	setLocalStorage('visualizer.foregroundColorType', foregroundColorType.value);
});

// foregroundColor change event listener
foregroundColor.addEventListener('change', function(e) {
	setLocalStorage('visualizer.foregroundColor', foregroundColor.value);
});

// backgroundColor change event listener
backgroundColor.addEventListener('change', function(e) {
	setLocalStorage('visualizer.backgroundColor', backgroundColor.value);
});

// fullScreen click event listener
fullScreen.addEventListener('click', function(e) {
	canvas.requestFullscreen();
});

/* onload event listener */
window.addEventListener('load', function() {
	// setting old preference from localStorage
	setPreference();
	// setting CanvasSize
	setCanvasSize();
	// setting CanvasBackground
	setCanvasBackground();

}, false);