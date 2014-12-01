function MusicVisualizer(options){
	//播放过的bufferSource的buffer对象
	this.buffer = [];
	//当前正在播放的bufferSource
	this.source = null;
	//当前准备播放的资源的path
	this.path = "";
	//当前正在播放的资源的path
	this.currentPath = "";
	//播完后的回调
	this.onended = options.onended;
	//unit8Array的长度
	this.size = options.size;
	//可视化调用的绘图函数
	this.visualizer = options.visualizer;
	MusicVisualizer.visualize(this);
}

//保存一个实例化的audioContext对象
MusicVisualizer.audioContext = new (window.AudioContext ||window.webkitAudioContext || window.mozAudioContext)();
MusicVisualizer.analyser = MusicVisualizer.audioContext.createAnalyser();
MusicVisualizer.analyser.connect(MusicVisualizer.audioContext.destination);

//检测是否为function
MusicVisualizer.isFunction = function(fun){
	return Object.prototype.toString.call(fun) == "[object Function]";
}

/*从指定的路径加载音频资源
 *@param path string,音频资源路径
 *@param fun function,decode成功后的回调函数，将arraybuffer作为this
*/
MusicVisualizer.load = function(path, fun){
	var xhr = new window.XMLHttpRequest();
	xhr.open("GET", path, true);
	xhr.responseType = "arraybuffer";

	xhr.onload = function(){
		MusicVisualizer.isFunction(fun) && fun.call(xhr.response);
	}
	xhr.send();
}

//将arraybuffer数据decode得到buffer
//成功后将buffer作为fun回调的this
MusicVisualizer.decode = function(arraybuffer, fun){
	MusicVisualizer.audioContext.decodeAudioData(arraybuffer, function(buffer){
		MusicVisualizer.isFunction(fun) && fun.call(buffer);
	}, function(err){
		console.log(err);
	})
}

//播放buffere,fun为播放结束后的回调
MusicVisualizer.play = function(bufferSource, onended){
	bufferSource.connect(MusicVisualizer.analyser);
	//兼容较老的API
	bufferSource.start = bufferSource.start || bufferSource.noteOn;
	bufferSource.start(0);
	//为该bufferSource绑定onended事件
	MusicVisualizer.isFunction(onended) && (bufferSource.onended = onended);
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
	MusicVisualizer.analyser.fftSize = mv.size * 2;
	var arr = new Uint8Array(MusicVisualizer.analyser.frequencyBinCount);
	var requestAnimationFrame = window.requestAnimationFrame || 
								window.webkitRequestAnimationFrame || 
								window.msRequestAnimationFrame || 
								window.mzRequestAnimationFrame;
	function v(){
		MusicVisualizer.analyser.getByteFrequencyData(arr);
		mv.visualizer.call(arr);
		requestAnimationFrame(v);
	}
	MusicVisualizer.isFunction(mv.visualizer) && requestAnimationFrame(v);
}

MusicVisualizer.prototype.decode = function(arraybuffer, fun){
	var self = this;
	MusicVisualizer.decode(arraybuffer, function(){
		var bufferSourceNode = MusicVisualizer.audioContext.createBufferSource();
		bufferSourceNode.buffer = this;
		fun.call(bufferSourceNode);
	})
}

MusicVisualizer.prototype.play = function(path){
	var self = this;
	self.path = path;	
	self.source && MusicVisualizer.stop(self.source);

	if(path instanceof ArrayBuffer){
		self.decode(path, function(){
			self.source = this;
			MusicVisualizer.play(this, self.onended);
		});
	}
	if(typeof(path) === 'string'){
		if(path in self.buffer){
			MusicVisualizer.stop(self.source);

			var bufferSource = MusicVisualizer.audioContext.createBufferSource();
			bufferSource.buffer = self.buffer[path];	

			MusicVisualizer.play(bufferSource, self.onended);
			self.source = bufferSource;
		}else{
			MusicVisualizer.load(path, function(){
				self.decode(this, function(){
					//将decode好的buffer缓存起来
					self.buffer[path] = this.buffer;

					if(self.path != path)return;
					self.source = this;
					MusicVisualizer.play(this, self.onended);
				});
			})
		}
	}
}
