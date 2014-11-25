var express = require("express");
var router = express.Router();
var mediaPath = 'public/media'
router.get('/', function(req, res){
	var fs = require("fs");
	fs.readdir(mediaPath, function(err, files){
		if(err){
			console.log(err);
		}else{
			res.render('index', {title: 'passionate music', music: files});
		}
	});
	
});

module.exports = router;