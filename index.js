//bodyparser
const bodyParser = require('body-parser');
//helmet
const helmet = require('helmet');
//express
var express = require('express');
var app = express();
//app.use('/static', express.static(path.join(__dirname, 'public')))
//io
var server = require('http').Server(app);
var io = require('socket.io')(server);
//SerialPort
var isSerialPortOpen = false;
//0 : Not Connected | 1 : Connected | 2 : Error | 3: Init started | 4 : Init Completed | 5 : Waiting for Response
var arduinoState = 0;
var arduinoStateMessage = "";
const SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyACM0', {
    baudRate: 115200
}, () => {
    console.log('SerialPort is opening....');
    if (port.isOpen) {
        isSerialPortOpen = true;
        arduinoState = 1;
        arduinoStateMessage = "Arduino is connected";
        console.log('Arduino is connected !');
    } else {
        isSerialPortOpen = false;
        arduinoStateMessage = "Arduino is not connected";
        console.log('Arduino is not connected !');
    }
});
const parsers = SerialPort.parsers;
const parser = new parsers.Readline({
    delimiter: '\n'

});
port.pipe(parser);
//helmet
app.use(helmet());
app.use(bodyParser.urlencoded({
    extended: false
}));
//cors
var cors = require('cors');
app.use(cors());
//db
const Database = require('better-sqlite3');
const db = new Database('./db.sqlite');
//Others
const bodyParsser = require('body-parser');

//Lists
var flatIdList = [];
var databaseCache;
var saleList = [];
var flatList = [];

//Checks if variable exists or not
function isset(accessor) {
    try {
        return typeof accessor() !== 'undefined';
    } catch (e) {
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
setTimeout(initArduino, 2500);

function initArduino() {
    if (port.isOpen) {
        if (arduinoState == 1) {
            port.write("I", function (err, data) {
                if (err) {
                    setTimeout(initArduino, 2000);
                    console.log("Error while arduino initialization");
                } else {
                    arduinoState = 5;
                    arduinoStateMessage = "START_INIT SENT TO ARDUINO";
                    console.log("ARDUINO_START_INIT_CMD");
                }
            });
        }
    } else {
        console.log("Connection failed with Arduino...Retrying in 4seconds !");
        setTimeout(openArduinoPort, 1500);
        setTimeout(initArduino, 4000);
    }

}

function openArduinoPort() {
    port = new SerialPort('/dev/ttyACM0', {
        baudRate: 115200
    }, () => {
        console.log('SerialPort is opening....');
        if (port.isOpen) {
            isSerialPortOpen = true;
            arduinoState = 1;
            arduinoStateMessage = "Arduino is connected";
            console.log('Arduino connected !');
            setTimeout(showAllOff, 4000);
        } else {
            isSerialPortOpen = false;
            arduinoState = 0;
            arduinoStateMessage = "Arduino is not connected";
            console.log('Arduino is not detected !');
        }
    });
}

parser.on("data", arduinoMessageHandler);
//-------------------------------------------------------//
app.get('/home/:version', (req, res) => {
    res.send('HOME! ' + req.params.version);
})

app.get('/db', function (req, res) {
    //REACH DB AND GET DATA
    var textF = "";
    list = db.prepare("SELECT rowid,flatId, info FROM user").all();
    console.log("User id : " + list[list.length - 1].rowid + " - " + list[list.length - 1].flatId + " - " + list[list.length - 1].info);
    //DB CLOSE

    res.send(textF);
})

/*app.get('/list', (req, res) => {
    res.sendFile(__dirname + '/static/index.html')
})*/

app.get('/configure', (req, res) => {
    res.sendFile(__dirname + '/static/configure.html')
    list = db.prepare("SELECT buildingId,flatId,ledId,isSold  FROM modelData").all();
    console.log(list);
})

app.get('/add/building/:buildingId', (req, res) => {
    let find_token = db.prepare('INSERT INTO modelData VALUES (?,?,1,1)').run(req.param.buildingId, 0);
    if (!isset(() => find_token)) {
        res.status(401).send("UserNotLoggedIn");
    } else {
        res.status(200).send("created");
    }
})


// ALL ON
app.get('/api/allon', (req, res) => {
    //Send 6
    showAllOn();
    res.status(200).send("allon");
})

// ALL OFF
app.get('/api/alloff', (req, res) => {
    showAllOff();
    res.status(200).send("alloff");
})

// SHOW ONSALE
app.get('/api/show/onsale', (req, res) => {
    showOnSale();
    res.status(200).send("onSale");
})

// EFFECT
app.get('/api/show/effect', (req, res) => {
    showEffect();
    res.status(200).send("effect");
})

// FLAT ON-OFF-SELL-ONSALE
app.get('/api/flat/:flatId/:status', (req, res) => {
    var flatId = req.params.flatId.split("_");

    if (req.params.status == "on") {
        flatStatus(flatId, "1")
    } else if (req.params.status == "off") {
        flatStatus(flatId, "2")
    } else if (req.params.status == "sell") {
        databaseCache.forEach(element => {
            if (element.buildingId.includes(flatId[0]) && element.flatId == flatId[1]) {
                db.prepare('UPDATE modelData SET isSold=1 Where ledId=?').run(element.ledId);
                databaseCache = db.prepare("SELECT buildingId,flatId,ledId,isSold FROM modelData").all();
            }
        });

        flatStatus(flatId, "3")
    } else if (req.params.status == "onsale") {
        databaseCache.forEach(element => {
            if (element.buildingId.includes(flatId[0]) && element.flatId == flatId[1]) {
                db.prepare('UPDATE modelData SET isSold=0 Where ledId=?').run(element.ledId);
                databaseCache = db.prepare("SELECT buildingId,flatId,ledId,isSold FROM modelData").all();
            }
        });
        flatStatus(flatId, "4")
    }
    res.status(200).send(flatId[0] + " - " + flatId[1] + " -> " + req.params.status);

})

// BUILDING ON-OFF
app.get('/api/building/flat/:flatId/:status', (req, res) => {
    //F, C, 1+1, 3+1, Entrance1, Entrance2
    var flatId = req.params.flatId.split("_");

    if (req.params.status == "on") {
        buildingStatus(flatId, "1")
    } else if (req.params.status == "off") {
        buildingStatus(flatId, "2")
    }
    res.status(200).send(flatId[0] + " -> " + req.params.status);
})

// COMMMERCIAL ON-OFF-SELL-ONSALE
app.get('/api/commercial/:commercialId/:status', (req, res) => {
    //req.param.commercialId
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
function arduinoMessageHandler(data) {
    console.log("Data Received : " + data);
    if (arduinoState != 3 && data == "sendLedCount") {
        console.log("Sending led count");
        var cache = String(databaseCache.length) + ".";
        console.log("Cache : "+cache);
        port.write(cache, function (err, data) {
            if (err) {
                console.log("Error while sending led count");
            } else {
                arduinoStateMessage = "LED_COUNT_SENT_TO_ARDUINO";
                console.log("LED_COUNT_SENT_TO_ARDUINO");
                arduinoState = 3;
            }
        });
    } else if (arduinoState == 3 && data != "INIT_OK") {
        //Init data request handler
        var row = db.prepare("SELECT buildingId,flatId,isSold FROM modelData Where ledId=?").get(Integer(data) + 1);
        data2Send = row.isSold + ".";
        port.write(String(data2Send), function (err, data) {
            if (err) {
                console.log("Error while sending led count");
            } else {
                console.log(data2Send + " Sent");
            }
        });
    } else if (arduinoState==3 && data == "INIT_OK") {
        arduinoState=4;
        console.log("Arduino Initialized");
    }
}

function showAllOff() {
    port.write("7,.", function (err, data) {
        if (err) {
            console.log("Error");
        } else {
            arduinoState = 1;
            arduinoStateMessage = "Arduino : ALL OFF";
            console.log("CMD : ALL OFF");
        }
    });
}

function flatStatus(flatIdentity, flatStatus) {
    port.write(flatStatus, function (err, data) {

        if (err) {
            console.log("Error");
        } else {
            arduinoState = 1;
            arduinoStateMessage = "Arduino : FLAT STATUS CHANGE";
        }
    });


    databaseCache.forEach(element => {
        if (element.buildingId.includes(flatIdentity[0]) && element.flatId == flatIdentity[1]) {
            port.write(element.ledId - 1 + ",", function (err, data) {

                if (err) {
                    console.log("Error");
                }
            });
        }
    });

    port.write(".", function (err, data) {

        if (err) {
            console.log("Error");
        } else {
            arduinoState = 1;
            arduinoStateMessage = "Arduino : FLAT STATUS CHANGE";
            console.log("CMD : FLAT STATUS UPDATE");
        }
    });
}

function buildingStatus(flatIdentity, flatStatus) {
    port.write(flatStatus, function (err, data) {

        if (err) {
            console.log("Error");
        } else {
            arduinoState = 1;
            arduinoStateMessage = "Arduino : GROUP STATUS CHANGE";
        }
    });


    databaseCache.forEach(element => {
        //console.log(element.buildingId + " - " +flatIdentity[0]);
        if (element.buildingId.includes(flatIdentity[0])) {
            //console.log(element.ledId-1);
            port.write(element.ledId - 1 + ",", function (err, data) {
                if (err) {
                    console.log("Error");
                }
            });
        }
    });

    port.write(".", function (err, data) {

        if (err) {
            console.log("Error");
        } else {
            arduinoState = 1;
            arduinoStateMessage = "Arduino : GROUP STATUS CHANGE";
            console.log("CMD : GROUP STATUS UPDATE");
        }
    });
}

function showAllOn() {
    port.write("6,.", function (err, data) {

        if (err) {
            console.log("Error");
        } else {
            arduinoState = 1;
            arduinoStateMessage = "Arduino : ALL ON";
            console.log("CMD : ALL ON");
        }
    });
}

function showEffect() {
    port.write("0,.", function (err, data) {

        if (err) {
            console.log("Error");
        } else {
            arduinoState = 1;
            arduinoStateMessage = "Arduino : EFFECT";
            console.log("CMD : EFFECT");
        }
    });
}

function showOnSale() {
    port.write("5,.", function (err, data) {

        if (err) {
            console.log("Error");
        } else {
            arduinoState = 1;
            arduinoStateMessage = "Arduino : SHOW ONSALE";
        }
    });
}


function initDB() {
    db.prepare("CREATE TABLE if not exists user (ROWID INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,flatId INT, info TEXT)").run();
    db.prepare("CREATE TABLE if not exists modelData (buildingId TEXT,flatId INT,ledId INTEGER PRIMARY KEY NOT NULL, isSold INTEGER DEFAULT 0)").run();
    var check;
    var ROWID = null;
    var stmt = db.prepare("INSERT INTO user VALUES (" + ROWID + ",?,?)");
    /*for (var i = 0; i < 2; i++) {
        var d = new Date();
        var n = d.toLocaleTimeString();
        stmt.run(n, "User" + i);
    }
    */
    //var count = db.prepare("SELECT count(*) FROM user").get();
    databaseCache = db.prepare("SELECT buildingId,flatId,ledId,isSold FROM modelData").all();
    console.log("Records found : " + databaseCache.length);
    console.log("Database initialized");
    console.log("-----------------------------------------------------------");
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

    console.log("Connect Success");
    socket.emit('dbValues', databaseCache);
    //Read DB insteadOf cache
    //socket.emit('dbValues', db.prepare("SELECT ledId,flatId, buildingId FROM modelData ORDER BY buildingId").all());

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

    socket.on("led_test_on", function (data) {
        port.write("1", function (err, data) {

            if (err) {
                console.log("Error");
            } else {
                arduinoState = 1;
                arduinoStateMessage = "Arduino : FLAT STATUS CHANGE";
                console.log("CMD : FLAT STATUS UPDATE");
            }
        });
        try {
            port.write(String(parseInt(data - 1)), function (err, data) {

                if (err) {
                    console.log("Error");
                }
            });
        } catch (error) {
            //do nothing
        }
        port.write(",.", function (err, data) {

            if (err) {
                console.log("Error");
            } else {
                arduinoState = 1;
                arduinoStateMessage = "Arduino : FLAT STATUS CHANGE";
                console.log("CMD : FLAT STATUS UPDATE");
            }
        });


    })

    socket.on("led_test_off", function (data) {
        port.write("2", function (err, data) {

            if (err) {
                console.log("Error");
            } else {
                arduinoState = 1;
                arduinoStateMessage = "Arduino : FLAT STATUS CHANGE";
                console.log("CMD : FLAT STATUS UPDATE");
            }
        });
        try {
            port.write(String(parseInt(data - 1)), function (err, data) {

                if (err) {
                    console.log("Error");
                }
            });
        } catch (error) {
            //do nothing
        }
        port.write(",.", function (err, data) {

            if (err) {
                console.log("Error");
            } else {
                arduinoState = 1;
                arduinoStateMessage = "Arduino : FLAT STATUS CHANGE";
                console.log("CMD : FLAT STATUS UPDATE");
            }
        });
    })

    socket.on("error_msg", function (data) {
        //Emits error messages to the frontend
        console.log(data);
    })

    socket.on("led_edit", function (data) {
        db.prepare('UPDATE modelData SET buildingId=?,flatId=? Where ledId=?').run(data.buildingId, data.flatId, data.ledId);
        databaseCache = db.prepare("SELECT buildingId,flatId,ledId,isSold FROM modelData").all();
    })

    socket.on("led_add", function (data) {
        try {
            console.log("Led Add Received : [ buildingId : " + data.buildingId + ", flatId : " + data.flatId + ", ledId : " + data.ledId + " ]");
            db.prepare('INSERT INTO modelData VALUES (?,?,?,?)').run(data.buildingId, data.flatId, data.ledId, 0);
            databaseCache = db.prepare("SELECT buildingId,flatId,ledId,isSold FROM modelData").all();
            socket.emit('add_led_success');
            console.log("Led Added Successfully");
        } catch (error) {
            socket.emit('error_led_id_exists_or_not_int', db.prepare("SELECT buildingId,flatId FROM modelData Where ledId=?").get(data.ledId));
            console.log("(!)Led Id Exists or value incorrect");
        }
    })

    socket.on("led_remove", function (data) {
        console.log("Row deleted : [ buildingId : " + data.buildingId + ", flatId : " + data.flatId + ", ledId : " + data.ledId + " ]");
        db.prepare('DELETE FROM modelData WHERE buildingId=? AND flatId=? AND ledId=?').run(data.buildingId, data.flatId, data.ledId);
        databaseCache = db.prepare("SELECT buildingId,flatId,ledId,isSold FROM modelData").all();
    })
})