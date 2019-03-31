const express = require('express');
const querystring = require('querystring');
const app = express();
const fs = require('fs');
const port = 8080;
const mysql = require('mysql');
const account = require('./account_config.json');

var connection = mysql.createConnection({
	host: account.host,
	user: account.user,
	password: account.password,
	database: account.database
})

connection.connect();

function pad(num){
	num = num +"";
	return num.length <2 ? '0'+num:num;
}

function insert_sensor(device,ip,temperature){
	obj = {};
	obj.device = device;
	obj.ip = ip.replace(/^.*:/, '');
	obj.temperature = temperature;

	var query = connection.query('insert into sensors set ?', obj, function(err,row,cols){
		if(err) throw err;
		console.log("database insertion ok = %j", obj);
	});
}

app.get('/log',function(req,res){
	r = req.query;
	console.log("GET %j",req.query)

	insert_sensor(r.device,req.connection.remoteAddress,r.temperature);
	res.write('hello world');
	res.end(querystring.stringify(req.query));
})

app.get('/graph', function (req, res) {
	console.log('got app.get(graph)');

	var html = fs.readFile('./graph.html', function (err, html) {
		html = " "+ html
		console.log('read file');

		var qstr = 'select * from sensors';
		connection.query(qstr, function(err, rows, cols) {
			if (err) throw err;

			var data = "";
			var comma = "";
			var start_time ="'";
			var finish_time="'";
			for (var i=0; i< rows.length; i++) {
				r = rows[i].time;
				v = rows[i].temperature;
				
				if(i==0){
					start_time += r.getFullYear() + '-'+pad( r.getMonth()+1) + '-' + pad(r.getDate()) + ' ' + pad(r.getHours()) + ':' + pad(r.getMinutes()) + ':' + pad(r.getSeconds()) +"'";
				}
				if(i==rows.length-1){
					finish_time += r.getFullYear() + '-'+pad( r.getMonth()+1) + '-' + pad(r.getDate()) + ' ' + pad(r.getHours()) + ':' + pad(r.getMinutes()) + ':' + pad(r.getSeconds()) +"'";
				}

				data += comma + "[new Date("+r.getFullYear()+","+r.getMonth()+','+r.getDate()+','+r.getHours()+','+r.getMinutes()+','+r.getSeconds()+"),"+ v +"]";
				comma = ",";
			}

			var header = "data.addColumn('date', 'Date/Time');"
			header += "data.addColumn('number', 'Temperature');"

			html = html.replace("<%HEADER%>", header);
			html = html.replace("<%DATA%>", data);
			html = html.replace("<%start_time%>", start_time);
			html = html.replace("<%finish_time%>", finish_time)

			res.writeHeader(200, {"Content-Type": "text/html"});
			res.write(html);
			res.end();

		});
	});
})

app.listen(port,function(err){
	console.log('Connected port' + port);
	if(err){
		return console.log('Found error',err);
	}
});
