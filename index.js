
//bodyparser
const bodyParser = require('body-parser');
//helmet
const helmet = require('helmet');
//express
var express = require('express');
var app = express();
app.use(helmet());
app.use(bodyParser.urlencoded({extended:false}));
//db
const Database = require('better-sqlite3');
const db = new Database('./db.sqlite');

//Others
const bodyParsser=require('body-parser');

//Checks if variable exists or not
function isset(accessor){
	try{
		return typeof accessor() !== 'undefined';
	}
	catch (e){
		return false;
	}
}
//-----------------------------------------------------------//

/*
for (var i = 0; i < count['count(*)']; i++) {
    k=i+1;
    list = db.prepare("SELECT flatId, info FROM user Limit "+k +",1").get();
    console.log(list.flatId + " : " + list.info);
}
*/
pixel = require("node-pixel");
five = require("johnny-five");

var board = new five.Board(opts);
var strip = null;

board.on("ready", function() {

    strip = new pixel.Strip({
        board: this,
        controller: "FIRMATA",
        strips: [ {pin: 18, length: 60}, ], // this is preferred form for definition
        gamma: 2.8, // set to a gamma that works nicely for WS2812
    });

    strip.on("ready", function() {
        // do stuff with the strip here.
    });
});
//--------------------------------------------------------//
app.get('/',function(req,res){
    res.send('HELLO!');
    strip.colour("teal"); // sets strip to a blue-green color using a named colour
    strip.show();
})

app.get('/r',function(req,res){
    res.send('RED!');
    strip.colour("rgb(0, 255, 0)"); // sets strip to a blue-green color using a named colour
    strip.show();
})

app.get('/off',function(req,res){
    res.send('OFF TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT!');
    sstrip.off(); 
})


app.get('/home/:version',(req,res)=>{
    res.send('HOME! &s',req.params.version);
})

app.get('/db',function(req,res){
    //REACH DB AND GET DATA
    var textF="";
    list = db.prepare("SELECT rowid,flatId, info FROM user").all();
    console.log("User id : "+list.rowid+" - "+list.flatId+" - "+list.info);  
     //DB CLOSE

    res.send(textF); 
})

app.get('/list',(req,res)=>{
    res.sendFile(__dirname+'/static/index.html')
})

app.get('/add/building/:buildingId',(erq,res)=>{


})
//--------------------------------------------------------//
var server = app.listen(8081,"127.0.0.1", function (res,req) {
    var host = server.address().address
    var port = server.address().port
    
    console.log("Server listening at http://%s:%s", host, port)
    initDB();
 })
 

 function initDB(){
    db.prepare("CREATE TABLE if not exists user (ROWID INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,flatId INT, info TEXT)").run();
    var check;
    var ROWID=null;
    var stmt = db.prepare("INSERT INTO user VALUES ("+ROWID+",?,?)");
    for (var i = 0; i < 50; i++) {
        var d = new Date();
        var n = d.toLocaleTimeString();
        stmt.run(n,"User"+i);
    }
    var count = db.prepare("SELECT count(*) FROM user").get(); 
    var list;
    list = db.prepare("SELECT flatId, info FROM user").all();
    console.log("Records found : "+list.length);
    console.log(list[0]);

    console.log("Database initialized");
}

 function closeDb() {
    db.close((err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Database connection closed!');
    });
}