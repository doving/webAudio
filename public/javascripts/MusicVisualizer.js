function MusicVisualizer(options){
	//播放过的bufferSource的对象
	this.buffer = {};

	//当前正在播放的bufferSource
	this.source = null;

	//选择过的资源数的累计值
	this.count = 0;

	//播完后的回调
	this.onended = options.onended;

	//unit8Array的长度
	this.size = options.size;

	//可视化调用的绘图函数
	this.visualizer = options.visualizer;

	//初次加载第一首音乐成功时回调函数，针对苹果禁止自动播放用
	this.initCallback = null;

	//控制音量的GainNode
	this.gainNode = MusicVisualizer.ac[MusicVisualizer.ac.createGain ? "createGain" : "createGainNode"]();

	//音频分析对象
	this.analyser = MusicVisualizer.ac.createAnalyser();

	this.analyser.connect(this.gainNode);

	this.gainNode.connect(MusicVisualizer.ac.destination);

	//xhr对象
	this.xhr = new window.XMLHttpRequest();

	MusicVisualizer.visualize(this);
}

MusicVisualizer.ac = new (window.AudioContext ||window.webkitAudioContext || window.mozAudioContext)();

//检测是否为function
MusicVisualizer.isFunction = function(fun){
	return Object.prototype.toString.call(fun) == "[object Function]";
}

/*从指定的路径加载音频资源
 *@param xhr XMLHttpRequest
 *@param path string,音频资源路径
 *@param fun function,decode成功后的回调函数，将arraybuffer作为this
*/
MusicVisualizer.load = function(xhr, path, fun){
	xhr.abort();
	xhr.open("GET", path, true);
	xhr.responseType = "arraybuffer";

	xhr.onload = function(){
		MusicVisualizer.isFunction(fun) && fun.call(xhr.response);
	}
	xhr.send();
}

//播放buffere,fun为播放结束后的回调
MusicVisualizer.play = function(bufferSource, mv){
	bufferSource.connect(mv.analyser);

	//兼容较老的API
	bufferSource.start = bufferSource.start || bufferSource.noteOn;
	bufferSource.start(0);

	//为该bufferSource绑定onended事件
	MusicVisualizer.isFunction(mv.onended) && (bufferSource.onended = mv.onended);
}

//停止bufferSource
MusicVisualizer.stop = function(bufferSource){

	//兼容较老的API
	bufferSource.stop = bufferSource.stop || bufferSource.noteOff;
	bufferSource.stop(0);

	//停止后移除之前为该bufferSource绑定的onended事件
	bufferSource.onended = window.undefined;
}

/*可视化当前正在播放的音频
 *@param mv MusicVisualizer,MusicVisualizer的实例对象
*/
MusicVisualizer.visualize = function(mv){
	mv.analyser.fftSize = mv.size * 2;
	var arr = new Uint8Array(mv.analyser.frequencyBinCount);

	var requestAnimationFrame = window.requestAnimationFrame || 
								window.webkitRequestAnimationFrame || 
								window.oRequestAnimationFrame || 
								window.mzRequestAnimationFrame;
	function v(){
		mv.analyser.getByteFrequencyData(arr);
		mv.visualizer.call(arr);
		requestAnimationFrame(v);
	}

	MusicVisualizer.isFunction(mv.visualizer) && requestAnimationFrame(v);
}

//将arraybuffer数据decode得到buffer
//成功后将bufferSourceNode作为fun回调的this
MusicVisualizer.prototype.decode = function(arraybuffer, fun){
	var self = this;
	MusicVisualizer.ac.decodeAudioData(arraybuffer, function(buffer){
		var bufferSourceNode = MusicVisualizer.ac.createBufferSource();
		bufferSourceNode.buffer = buffer;
		fun.call(bufferSourceNode);
	},function(err){
		console.log(err);
	})
}

MusicVisualizer.prototype.play = function(path){
	var self = this;
	var count = ++self.count;

	self.source && MusicVisualizer.stop(self.source);

	if(path instanceof ArrayBuffer){
		self.decode(path, function(){
			self.source = this;
			MusicVisualizer.play(this, self);
		});
	}
	if(typeof(path) === 'string'){
		if(path in self.buffer){
			MusicVisualizer.stop(self.source);

			var bufferSource = MusicVisualizer.ac.createBufferSource();
			bufferSource.buffer = self.buffer[path];	

			MusicVisualizer.play(bufferSource, self);
			self.source = bufferSource;
		}else{
			MusicVisualizer.load(self.xhr, path, function(){

				if(count != self.count)return;

				self.decode(this, function(){

					if(count != self.count)return;

					//将decode好的buffer缓存起来
					//self.buffer[path] = this.buffer;

					MusicVisualizer.play(this, self);

					self.initCallback && !self.source && MusicVisualizer.isFunction(self.initCallback) && self.initCallback();

					self.source = this;
				});
			})
		}
	}
}

MusicVisualizer.prototype.addinit = function(fun){
	this.initCallback = fun;
}
MusicVisualizer.prototype.changeVolume = function(rate){
	this.gainNode.gain.value = rate * rate;
}
