
//bodyparser
const bodyParser = require('body-parser');
//helmet
const helmet = require('helmet');
//express
var express = require('express');
var app = express();
//io
var server = require('http').Server(app);
var io = require('socket.io')(server);
//SerialPort
//var serialport = require("serialport");
//var serialPort = serialport.SerialPort;
//var portName = process.argb[2];
//helmet
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
//cors
var cors = require('cors');
app.use(cors());
//db
const Database = require('better-sqlite3');
const db = new Database('./db.sqlite');
//Others
const bodyParsser = require('body-parser');

//Lists
var flatIdList = []
//Checks if variable exists or not
function isset(accessor) {
    try {
        return typeof accessor() !== 'undefined';
    }
    catch (e) {
        return false;
    }
}
//SerialPort configuration

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
app.get('/', function (req, res) {
    res.send('HELLO!');
})

app.get('/r', function (req, res) {
    res.send('RED!');
})

app.get('/off', function (req, res) {
    res.send('OFF !');
})

app.get('/home/:version', (req, res) => {
    res.send('HOME! &s', req.params.version);
})

app.get('/db', function (req, res) {
    //REACH DB AND GET DATA
    var textF = "";
    list = db.prepare("SELECT rowid,flatId, info FROM user").all();
    console.log("User id : " + list[list.length - 1].rowid + " - " + list[list.length - 1].flatId + " - " + list[list.length - 1].info);
    //DB CLOSE

res.send(textF);
})

app.get('/list', (req, res) => {
    res.sendFile(__dirname + '/static/index.html')
})

app.get('/list2', (req, res) => {
    res.sendFile(__dirname + '/static/configure.html')
    list = db.prepare("SELECT ledId,flatId, buildingId FROM config").all();
    console.log(list);
})

app.get('/add/building/:buildingId', (req, res) => {
    let find_token = db.prepare('INSERT INTO config VALUES (?,?,1,1)').run(req.param.buildingId, 0);
    if (!isset(() => find_token)) {
        res.status(401).send("UserNotLoggedIn");
    }
    else {
        res.status(200).send("created");
    }
})

//--------------------------------------------------------//
/*var server = app.listen(8484,"127.0.0.1", function (res,req) {
    var host = server.address().address
    var port = server.address().port
    
    console.log("==============================================")
    console.log("SERVER ADDRESS -> http://%s:%s", host, port)
    console.log("==============================================") 
    initDB();
 })
 */
server.listen(8484);
initDB();


// Functions
function initDB() {
    db.prepare("CREATE TABLE if not exists user (ROWID INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,flatId INT, info TEXT)").run();
    db.prepare("CREATE TABLE if not exists config (buildingId TEXT,flatId INT,ledId INTEGER PRIMARY KEY NOT NULL)").run();
    var check;
    var ROWID = null;
    var stmt = db.prepare("INSERT INTO user VALUES (" + ROWID + ",?,?)");
    for (var i = 0; i < 2; i++) {
        var d = new Date();
        var n = d.toLocaleTimeString();
        stmt.run(n, "User" + i);
    }
    var count = db.prepare("SELECT count(*) FROM user").get();
    flatIdList = db.prepare("SELECT rowid,flatId, info FROM user").all();
    console.log("Records found : " + flatIdList.length);
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
/////////////////////////////////////////////////////

//io Socket Connection Between Interface and NodeJS
io.on('connection', function (socket) {

    console.log("connect success");
    socket.emit('dbValues', db.prepare("SELECT ledId,flatId, buildingId FROM config ORDER BY buildingId").all());
    //Send data each second
    /*
    setInterval(function(){
        socket.emit('data',"\noneoneone");
        console.log("ONE SEND");
    },1000)
    */

    //Receive data when button clicked
    socket.on("btn_click", function (data) {
        console.log("NODE DATA");
        console.log(data);
    })

    socket.on("error_msg",function(data){
        //Emits error messages to the frontend
        console.log(data);    
    })

    socket.on("led_add",function(data){
        console.log("Row added : [ buildingId : "+data.buildingId +", flatId : "+ data.flatId +", ledId : "+ data.ledId+" ]");
        db.prepare('INSERT INTO config VALUES (?,?,?)').run(data.buildingId,data.flatId,data.ledId);
    })

    socket.on("led_remove",function(data){
        console.log("Row deleted : [ buildingId : "+data.buildingId +", flatId : "+ data.flatId +", ledId : "+ data.ledId+" ]");
        db.prepare('DELETE FROM config WHERE buildingId=? AND flatId=? AND ledId=?').run(data.buildingId,data.flatId,data.ledId);
    })
})