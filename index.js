
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

//Lists
var flatIdList=[]
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
/* DB MAP

|-- BuildingID --|-- BuildingName --|-- FlatId --|-- LedId --|-- SaleStatus --|
|------ 2A1 -----|------- A2 -------|----- 5 ----|---- 34 ---|----  onsale ---|

*/
//-----------------------------------------------------------//

/*
for (var i = 0; i < count['count(*)']; i++) {
    k=i+1;
    list = db.prepare("SELECT flatId, info FROM user Limit "+k +",1").get();
    console.log(list.flatId + " : " + list.info);
}
*/

//--------------------------------------------------------//
app.get('/',function(req,res){
    res.send('HELLO!');
})

app.get('/r',function(req,res){
    res.send('RED!');
})

app.get('/off',function(req,res){
    res.send('OFF !');
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
    res.sendFile(__dirname+'/index.html')
})

app.get('/add/building/:buildingId',(req,res)=>{
    let find_token = DB.prepare('INSERT INTO building VALUES (?,?)').get(req.param.buildingId,0);
    if(!isset(()=>find_token))
    {
        res.status(401).send("UserNotLoggedIn");
    }
    else
    {
        res.status(200).send("created");
    }
})

app.get('/createdb',(erq,res)=>{
    db.prepare("CREATE TABLE if not exists building (ROWID INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,flatCount INT, buildingName TEXT)").run();
})

//--------------------------------------------------------//
var server = app.listen(12356,"127.0.0.1", function (res,req) {
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
    for (var i = 0; i < 2; i++) {
        var d = new Date();
        var n = d.toLocaleTimeString();
        stmt.run(n,"User"+i);
    }
    var count = db.prepare("SELECT count(*) FROM user").get(); 
    flatIdList = db.prepare("SELECT rowid,flatId, info FROM user").all();
    console.log("Records found : "+flatIdList.length);
    console.log(flatIdList[0]);
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