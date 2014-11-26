
var $ = function(s){return document.querySelector(s);}
var box = $("#canvas");
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
box.appendChild(canvas);

var HEIGHT,//canvas高
	WIDTH;//canvs 宽

var SIZE = 64;//音乐片段数

var ARR = [];//该数组保存canvas中各图形的x,y坐标以及他们的颜色

    


//初始化heigth，width以及canvas的宽高
function init(){
	HEIGHT = box.clientHeight,
	WIDTH = box.clientWidth;
	canvas.height = HEIGHT;
	canvas.width = WIDTH;
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
	//创建线性渐变对象，以便绘制柱状图使用
	ARR = [];
	ARR.gradient = ctx.createLinearGradient(0, HEIGHT, 0, 0);
	ARR.gradient.addColorStop(0, '#ff0');
	ARR.gradient.addColorStop(1, '#f00');

	for(var i = 0;i < SIZE; i++){
		ARR.push({
			x: random(WIDTH*0.04, WIDTH*0.96),
			y: random(HEIGHT*0.04, HEIGHT*0.96),
			color: 'rgb('+random(100, 250)+','+random(50, 250)+','+random(50, 100)+')',
			dx: random(1, 4),
			dy: random(1, 5),
		});
	}
}

//窗口resize则重新计算heigth，width以及canvas的宽高
window.onresize = init;

function Render(){	
	var o = null;	
	return function(){
		ctx.fillStyle = ARR.gradient;
		var w = Math.round(WIDTH / SIZE),
		cgap = Math.round(w*0.3);
		cw = w - cgap;
		ctx.clearRect(0, 0, WIDTH, HEIGHT);
		for(var i = 0; i < SIZE; i++){		
			o = ARR[i];
			if(Render.type == 'Dot'){
				var x = o.x;
				y = o.y,
				r = Math.round((this[i]/4+10)*(HEIGHT > WIDTH ? WIDTH : HEIGHT)/800);

				o.x += o.dx;
				o.x > WIDTH - 50 && (o.x = 50);

				//开始路径，绘画圆
			    ctx.beginPath();
			    ctx.arc(x, y, r, 0, Math.PI*2, true);

			    //渐变填充
			    var gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
			    gradient.addColorStop(0, '#fff');
			    gradient.addColorStop(this[i]/280, o.color);
			    gradient.addColorStop(1, '#000');
			    ctx.fillStyle = gradient;
			    ctx.fill();
			}
			if(Render.type == 'Column'){
				var h = this[i] / 280 * HEIGHT;
				ctx.fillRect(w * i, HEIGHT - h, cw, h);
			}
			
		}
	}
}

Render.type = "Dot";

var visualizer = new MusicVisualizer(SIZE * 2, function(){
	if($(".play")){
		$(".play").nextElementSibling ? $(".play").nextElementSibling.click() : lis[0].click();
	}else{
		lis[0].click();
	}
});

visualizer.visualize(Render())

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

var types = document.querySelectorAll(".type li");

!function(){
	for(var i = 0; i < types.length; i++){
		types[i].onclick = function(){
			for(var j = 0; j < types.length; j++){
				types[j].className = "";
			}
			this.className = "selected"
			Render.type = this.innerHTML;
		}
	}
}()