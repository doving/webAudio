function MusicVisualizer(size, endcallback){
	this.source = null;
	this.audioContext = new window.AudioContext();
	this.analyser = this.audioContext.createAnalyser();
	this.analyser.fftSize = size;
	this.jsnode = this.audioContext.createScriptProcessor();
	this.analyser.connect(this.audioContext.destination);
	this.jsnode.connect(this.audioContext.destination);
	this.endFun = endcallback;
	this.forceStop = false;
}

MusicVisualizer.isFunction = function(fun){
	return Object.prototype.toString.call(fun) == "[object Function]";
}

MusicVisualizer.prototype.decode = function(arraybuffer){
	var self = this;
	this.audioContext.decodeAudioData(arraybuffer, function(buffer){
		var bufferSourceNode = self.audioContext.createBufferSource();
		bufferSourceNode.buffer = buffer; 
		bufferSourceNode.start(0);
		self.source = bufferSourceNode;
		self.source.connect(self.analyser);
		if(self.endFun && MusicVisualizer.isFunction(self.endFun)){
			self.source.onended = function(fun){
				/*console.log(self.source);*/
				console.log(self.forceStop);

				if(self.forceStop){
					self.forceStop = false;
					/*console.log(self.forceStop,"inner");*/
					return;
				}
				self.endFun();
			}
		}
		this.isdecoding = false;
	},function(err){
		console.log(err);
		this.isdecoding = false;
	});
}
MusicVisualizer.prototype.play = function(path){
	if(this.source){
		this.source.stop(0);
		this.source = null;
		this.forceStop = true;
	}
	if(path instanceof ArrayBuffer){
		this.decode(path);
	}
	if(typeof(path) == 'string'){		
		var xhr = new window.XMLHttpRequest();
		xhr.open("GET", path, true);
		xhr.responseType = "arraybuffer";
		var self = this;
		xhr.onload = function(){
			self.decode(xhr.response);
		}
		xhr.send();
	}	
}

MusicVisualizer.prototype.visualize = function(fun){
	var arr = new Uint8Array(this.analyser.frequencyBinCount);
	var self = this;

	this.jsnode.onaudioprocess = function(){
		self.analyser.getByteFrequencyData(arr);
		MusicVisualizer.isFunction(fun) && fun.call(arr);
	}
}