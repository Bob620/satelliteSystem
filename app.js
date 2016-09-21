"use strict"

var readline = require('readline');

var prompt = "> ";
var input = prompt;

function BakaQuery() {

	readline.emitKeypressEvents(process.stdin);

	if (process.stdin.isTTY) {
		process.stdin.setRawMode(true);
	}

	process.title = "BakaQuery Test";

	process.stdin.on('keypress', function(key) {

		if (key) {
			switch(key.charCodeAt()) {
				case 13: // Enter
					writeText(input, true);
					testForCommand(input);
					input = prompt;
					break;
				case 27: // Return
					writeText(input, true);
					testForCommand(input);
					input = prompt;
					break;
				case 8: // Backspace
					if (input.length > prompt.length) {
						input = input.slice(0, -1);
					}
					break;
				case 3: // Ctrl+C
					process.exit();
					break;
				default:
					input = input+key;
					break;
			}

			writeText(input);
		}
	});
}

function testForCommand(text) {
	switch (text.slice(prompt.length).toLowerCase()) {
		case "startdata":
			startData();
			break;
		case "flooddata":
			floodData();
			break;
	}
}

function writeText(text, newLine) {
	readline.clearLine(process.stdout, 0);
	readline.cursorTo(process.stdout, 0);
	if (newLine) {
		process.stdout.write(text+'\r\n');
	} else {
		process.stdout.write(text);
	}
}

function log(text) {
	writeText(text, true);
	writeText(input);
}

BakaQuery();

log('CTRL+C to close');
writeText(input);

var satellites = [];

function writeSatelliteStatus() {
	for (var i = 0; satellites.length > i; i++) {
		log(satellites[i].id +' -- '+satellites[i].status);
	}
}

function createSatellite(id, x, y, target) {
	var sat = {};
	sat.id = id;
	sat.status = 'open';
	sat.receive = processData;
	sat.sendTo = processDataTo;
	sat.x = x;
	sat.y = y;
	sat.range = 10;
	sat.target = '';

	if (target) {
		sat.target = target;
	}
	
	var createSat = true;

	if (satellites.length > 0) {
		for (var i = 0; satellites.length > i; i++) {
			var satellite = satellites[i];
			if (sat.x == satellite.x) {
				if (sat.y == satellite.y) {
					createSat = false;
				}
			}
		}
	}
	if (createSat) {
		satellites.push(sat);
	}
}

function processData(data, sat, previousId) {
	sat.status = 'processing from '+previousId;
	setTimeout(function() {
		sendData(data, sat, previousId);
	}, 2000);
}

function processDataTo(data, sat, previousId, targetPath) {
	sat.status = 'processing from '+previousId;
	setTimeout(function() {
		sendDataTo(data, sat, previousId, targetPath);
	}, 2000);
}

function sendData(data, sat, previousId) {
	if (sat.target == "" || previousId == sat.target) {
		for (var i = 0; satellites.length > i; i++) {
			var satellite = satellites[i];
			if (satellite.id != previousId) {
				var distance = Math.sqrt(Math.pow((satellite.x - sat.x), 2) + Math.pow((satellite.y - sat.y), 2));
				if (distance <= sat.range) {
					if (satellite.status == 'open') {
						satellite.receive(data, satellite, sat.id);
					}
				}
			}
		}
		sat.status = 'open';
	} else {
		var target;

		for (var i = 0; satellites.length > i; i++) {
			if (satellites[i].id == sat.target) {
				target = satellites[i];
				break;
			}
		}

		if (target) {

			if (target.status == 'open') {

				target.status = 'Reciving from '+sat.id;
				sat.status = 'Beaming to '+target.id;
				setTimeout(function() {

					target.receive(data, target, sat.id);
					sat.status = 'Recharging';
					setTimeout(function() {
						sat.status = 'open';
					}, 10000);
				}, 5000);

			} else {
				sat.status = 'Target Busy, resetting'
				setTimeout(function() {
					sat.status = 'open';
				}, 5000);
			}
		} else {
			sat.status = 'Unable to locate target, resetting'
			setTimeout(function() {
				sat.status = 'open';
			}, 5000);
		}
	}
}

function sendDataTo(data, sat, previousId, targetPath) {

	var nextIndex = targetPath.indexOf(sat.id)+1;

	if (nextIndex > targetPath.length) {
		if (previousSat) {
			if (previousSat.status == 'open') {
				sat.status = 'Sending to '+previousSat.id;
				targetPath.reverse()
				previousSat.sendTo('Success', previousSat, sat.id, targetPath);
			} else {
				sat.status = 'Target Busy, resetting';
			}
		}
	} else {
		var nextTargetId = targetPath[nextIndex];
		var target;

		for (var i = 0; satellites.length > i; i++) {
			if (satellites[i].id == nextTargetId) {
				target = satellites[i];
				break;
			}
		}

		if (target) {
			if (target.status == 'open') {
				sat.status = 'Sending to '+target.id;
				target.sendTo(data, target, sat.id, targetPath);
			} else {
				sat.status = 'Target Busy, resetting';
			}
		} else {
			var previousSat;
			for (var i = 0; satellites.length > i; i++) {
				if (satellites[i].id == previousId) {
					previousSat = satellites[i];
					break;
				}
			}
			if (previousSat) {
				if (previousSat.status == 'open') {
					sat.status = 'Sending to '+previousSat.id;
					previousSat.sendTo('failure', previousSat, sat.id, targetPath.reverse());
				} else {
					sat.status = 'Target Busy, resetting';
				}
			}
		}
	}
	setTimeout(function() {
		sat.status = 'open';
	}, 1000);
}

function startData() {
	satellites[10].status = 'Sending Data';
	sendDataTo('Baka', satellites[10], 'test', ['groundStation', 'satRelay', 'testSatRelay1', 'testSatFour', 'testSatOne']);
}

function floodData() {
	satellites[10].status = 'Sending Data';
	sendData('Baka', satellites[10], 'groundStation');
}

createSatellite('testSatOne', 0, 0);
createSatellite('testSatTwo', 5, 5);
createSatellite('testSatThree', 11, 10);
createSatellite('testSatFour', 7, 8);
createSatellite('testSatFive', 1, 2);
createSatellite('testSatSix', -5, 4);
createSatellite('testSatRelay1', 15, 15, 'satRelay');
createSatellite('satRelay', 100, 100, 'testSatRelay1');
createSatellite('satOne', 101, 100);
createSatellite('satTwo', 101, 105);
createSatellite('groundStation', 106, 105);

setInterval(function() {
	readline.cursorTo(process.stdout, 0, 0);
	readline.clearScreenDown(process.stdout);
	writeSatelliteStatus();
	writeText(input);
}, 500);