
var $ = function(s){return document.querySelector(s);}
var box = $("#canvas");
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
box.appendChild(canvas);

var height,//canvas高
	width;//canvs 宽

var size = 128;//音乐片段数

var arr = [];//该数组保存canvas中各图形的x,y坐标以及他们的颜色

//初始化heigth，width以及canvas的宽高
function init(){
	height = box.clientHeight,
	width = box.clientWidth;
	canvas.height = height;
	canvas.width = width;
	getArr();
}

init();
/*
 *  获取[min ,max]之间的随机数
 *  若无参数则min = 0，max = 1
 *	max < min 则返回 0
*/
function random(min, max){
	min = min || 0;
	max = max || 1;
	return max >= min ? Math.round(Math.random()*(max - min) + min) : 0;
}

function getArr(){
	arr = [];
	for(var i = 0;i < size; i++){
		arr.push({
			x: random(50, width - 50),
			y: random(50, height - 50),
			color: 'rgb('+random(100, 250)+','+random(50, 250)+','+random(50, 100)+')',
			dx: random(1, 4),
			dy: random(1, 5)
		});
	}
}

//窗口resize则重新计算heigth，width以及canvas的宽高
window.onresize = init;

var endFun = function(){
	if($(".play")){
		$(".play").nextElementSibling ? $(".play").nextElementSibling.click() : lis[0].click();
	}else{
		lis[0].click();
	}
}

var visualizer = new MusicVisualizer(size*2,endFun);

visualizer.visualize(function(){
	ctx.clearRect(0, 0, width, height);
	for(var i = 0; i < size; i++){		
		var x = arr[i].x;
			y = arr[i].y,
			r = Math.round(this[i]/16)*3+10;

		arr[i].x += /*Math.round(this[i]/10) + */arr[i].dx;
		arr[i].x > width - 50 && (arr[i].x = 50);

		//开始路径，绘画圆
	    ctx.beginPath();
	    ctx.arc(x, y, r, 0, Math.PI*2, true);

	    //渐变填充
	    var gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
	    var yellow = 'rgb(255,255,'+Math.round(this[i]/1.1)+')';
	    gradient.addColorStop(0, yellow);
	    gradient.addColorStop(this[i]/280, arr[i].color);
	    gradient.addColorStop(1, '#000');
	    ctx.fillStyle = gradient;
	    ctx.fill();
	}
})

var lis = document.querySelectorAll(".music-list li");
!function(){
	
	for(var i = 0; i < lis.length; i++){
		lis[i].onclick = function(){
			visualizer.play('/media/'+this.title);
			for(var j = 0; j < lis.length; j++){
				lis[j].className = "";
			}
			this.className = "play";
		}
	}
	lis[0].click();
}()

$("#add").onclick = function(){
	$("#upload").click();
}

$("#upload").onchange = function(){
	var file = this.files[0];
	var fr = new FileReader();

	fr.onload = function(e){
		visualizer.play(e.target.result);
	}
	fr.readAsArrayBuffer(file);
	$(".play") && ($(".play").className = "");
};