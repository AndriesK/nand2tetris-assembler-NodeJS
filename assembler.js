var myArgs = process.argv.slice(2);
const readline = require('readline');
const fs = require('fs');
let labelCount = 0;

compTable = {
	0: { 	// a = 0
		'0': '101010',
		'1': '111111',
		'-1': '111010',
		'D': '001100',
		'A': '110000',
		'!D': '001101',
		'!A': '110001',
		'-D': '001111',
		'-A': '110011',
		'D+1': '011111',
		'A+1': '110111',
		'D-1': '001110',
		'A-1': '001110',
		'D+A': '000010',
		'D-A': '010011',
		'A-D': '000111',
		'D&A': '000000',
		'D|A': '010101'
	},
	1: {    // a = 1
		'M': '110000',
		'!M': '110001',
		'-M': '110011',
		'M+1': '110111',
		'M-1': '110010',
		'D+M': '000010',
		'D-M': '010011',
		'M-D': '000111',
		'D&M': '000000',
		'D|M': '010101'
	}
};

destTable = {
	'null': '000',
	'M': '001',
	'D': '010',
	'MD': '011',
	'A': '100',
	'AM': '101',
	'AD': '110',
	'AMD': '111'
};

jumpTable = {
	'null': '000',
	'JGT': '001',
	'JEQ': '010',
	'JGE': '011',
	'JLT': '100',
	'JNE': '101',
	'JLE': '110',
	'JMP': '111'
};

var isNumber = new RegExp(/^[^a-z][0-9]*/gi);

var varDictionary = {

}

var i = 16;
var j = 0;

function parseLabels(fileName) {
	let lineNumber = 0;
	const rl = readline.createInterface({
		input: fs.createReadStream(fileName),
		crlfDelay: Infinity
	});

	rl.on('line', (line) => {
		if (typeof line === 'string' && line.length > 1) {
			lineNumber++;
			line = line.substr(line.lastIndexOf(' ')+1, line.length-line.lastIndexOf(' '));
			findLabel(line);
		}
	});

	function findLabel(line) {
		if (/^\(([A-Z])+\)$/gi.test(line)) {
			labelCount += 1;
			line = line.substr(1,line.length-2);
			varDictionary[line] = lineNumber - labelCount;
			console.log(line, varDictionary[line]);
		}
	}

	rl.on('close', () => {
		Assembler(fileName);
	});

}

function Assembler(fileName) {
	if (!fileName) {
		throw new Error('Wrong syntax, use: $ node assembler.js PATH/TO/FILE/file.asm');
	}
	let lineNumber = 0;
	let path = fileName;

	let temp = fileName;
	let path2 = __dirname;
	while (fileName.includes('../')) {
		fileName = fileName.substr(fileName.indexOf('/')+1, fileName.length - fileName.indexOf('/')+1);
		path2 = path2.substr(0, path2.lastIndexOf('\\'));
	}
	const C_And_A_Instruction_Array_String = [];

	const rl = readline.createInterface({
		input: fs.createReadStream(fileName),
		crlfDelay: Infinity
	});

	rl.on('line', (line) => {
		line = line.substr(line.lastIndexOf(' ')+1, line.length-line.lastIndexOf(' '));
		if (typeof line === 'string' && line.length > 0 && /^\(([A-Z])+\)$/gi.test(line) === false) {
			lineNumber++;
			interpretLine(line);
		}
	});

	rl.on('close', () => {
		// console.log(varDictionary);
		// console.log(C_And_A_Instruction_Array_String);
		writeAssembly(C_And_A_Instruction_Array_String);
	});

	function interpretLine(line) {
		if (line[0] === '@') {
			/* An "@" can be used in two ways, in either way the string is used to point to a location of memory
			*  if the succeeding string is a number, then it points directly to that ram location, ie: RAM[number]
			*  otherwise, "@" can be used to specify a variable, where the variable points to an open location of RAM,
			*  the hack computer appoints variables from RAM[16] -> onwards until a null RAM value is found
			*/
			var lineVar = '';
			lineVar = line.substr(1,line.length-1);
			if (isNumber.test(lineVar) === true) {
				var address = null;
				try {
					address = parseInt(lineVar);
				/* Hack Computer is a 16-bit computer using 2's complement
					* As such, only 2^15-1 amount of 16-bit registers exist,
					* 0-16K for programs
					* 16K-24K for screen memory map
					* 24K+1 for keyboard memory map
					* 24K+2-32K for 
					* Only the upper 16K+8K+1 words of the Memory chip are used. 
					* Access to address>0x6000 is invalid. Access to any address in 
					* the range 0x4000-0x5FFF results in accessing the screen memory 
					* map. Access to address 0x6000 results in accessing the keyboard 
					* memory map
				*/
					if (address > 24576) {
						throw new Error('Address out of bounds');
					}
					//console.log('Address before bin:', address);
					address = address.toString(2);
					//console.log('Address after bin:', address);
					while (address.length < 16) {
						address = '0' + address;
					}
					//console.log('Address after padding 0\'s:', address);
					C_And_A_Instruction_Array_String.push(address);
				}
				catch(error) {
					console.log(error);
				}
			}	
			else if (/^([a-z]*)[a-z]$/gi.test(lineVar)) {
				if (!varDictionary[lineVar]) {
					if (lineVar.toUpperCase() === 'KBD') {
						let temp = 24576;
						temp = temp.toString(2);
						while (temp.length < 16) {
							temp = '0' + temp;
						}
						C_And_A_Instruction_Array_String.push(temp)
					}
					else if (lineVar.toUpperCase() === 'SCREEN') {
						let temp = 16384;
						temp = temp.toString(2);
						while (temp.length < 16) {
							temp = '0' + temp;
						}
						C_And_A_Instruction_Array_String.push(temp)
					}
					else {
						//console.log(lineVar);
						varDictionary[lineVar] = i;
						let temp = i;
						temp = temp.toString(2)
						while (temp.length < 16) {
							temp = '0' + temp;
						}
						C_And_A_Instruction_Array_String.push(temp)
						i++;
					}
				}
				else if (varDictionary[lineVar]) {
					// varDictionary[lineVar] = i;
					// 	let temp = i;
					// 	temp = temp.toString(2)
					// 	while (temp.length < 16) {
					// 		temp = '0' + temp;
					// 	}
					// 	C_And_A_Instruction_Array_String.push(temp)
					// 	i++;
					//console.log(lineVar, varDictionary[lineVar]);
					let temp = varDictionary[lineVar];
					temp = temp.toString(2);
					while (temp.length < 16) {
						temp = '0' + temp;
					}
					C_And_A_Instruction_Array_String.push(temp);
				}
			}
			else if (/R[0-9]/gi.test(lineVar)) {
				varDictionary[lineVar] = j;
				if (!varDictionary[lineVar]) {
					let temp = j;
					temp = temp.toString(2)
					while (temp.length < 16) {
						temp = '0' + temp;
					}
					C_And_A_Instruction_Array_String.push(temp)
				}
				j++
			} 
		}
		// else if (/^\(([A-Z])+\)$/gi.test(line)) {
		// 	line = line.substr(1,line.length-2);
		// 	if (!varDictionary[line]) {
		// 		varDictionary[line] = lineNumber+1;
		// 		let temp = lineNumber;
		// 		temp = temp.toString(2)
		// 		while (temp.length < 16) {
		// 			temp = '0' + temp;
		// 		}
		// 	}
		// }
		else if (/^[a-z]|0[a-z]?[a-z]?/gi.test(line)) {
			/* How to deal with C-Instruction parts 
				* MD=D+1;JMP                                                           // Example C-Instruction
				* temp = string;
				* part1 = temp.substring(0,temp.indexOf('='));
				**************
				* Part 1: MD *
				**************
				* temp = temp.substring(temp.indexOf('='), temp.length-part1.length);
				*****************
				* Temp: D+1;JMP *
				*****************
				* part2 = temp.substring(0,temp.indexOf(operator)+1);
				***************
				* Part 2: D+1 *
				***************
				* temp = temp.substring(temp.indexOf(';'), temp.length-part2.length);
				* part3 = temp;
				***************
				* Part 3: JMP *
				***************
			*/
			if (line.indexOf('=') > -1) {
				let temp = line;
				let part1 = temp.substr(0,temp.indexOf('='));
				temp = temp.substr(temp.indexOf('=')+1, temp.length-part1.length+1);
				let part2;
				let part3 = null;
				if (temp.indexOf(';') > -1) {
					part2 = temp.substr(0, temp.indexOf(';'));
					temp = temp.substr(temp.indexOf(';')+1, temp.length-part2.length+1);
					part3 = temp;
				}
				else {
					part2 = temp.substr(0, temp.length);
				}
				const compRegExp = new RegExp(/^(0|!|-|A|M|D)+|((\+|-|&|!|\|)(?=|1|A|M|D)(1|A|M|D))$/);
				const compOperator = compRegExp.exec(temp);
				if (compRegExp.test(part2)) {
					define_C_Instruction(part1, part2, part3);
				}
				else {
					throw new Error('not valid comp');
				}
			}
			else {
				let temp = line;
				if (temp.indexOf(';') < 0) {
					throw new Error('Invalid C-Instruction');
				}
				let part2 = temp.substr(0, temp.indexOf(';'));
				temp = temp.substr(temp.indexOf(';')+1, temp.length-temp.indexOf(';'));
				let part3 = temp;
				console.log(part2);
				console.log(part3);
				define_C_Instruction(null, part2, part3);
			}
		}
	}

	function define_C_Instruction(dest, comp, jump) {
		let computationString = '111'
		let a;
		if (compTable[0][comp]) {
			a = 0
		}
		else {
			a = 1;
		}
		computationString += a + compTable[a][comp];

		if (dest) {
			computationString += destTable[dest];
		}
		else {
			computationString += destTable['null'];
		}

		if (jump) {
			computationString += jumpTable[jump];
		}
		else {
			computationString += jumpTable['null'];
		}

		C_And_A_Instruction_Array_String.push(computationString);
	}

	function writeAssembly(array) {
		for (var l = 0; l < array.length; l++) {
			fs.appendFileSync(fileName.substr(0,fileName.indexOf('.')) + '.hack',array[l] + "\n");
		}
	}
}

parseLabels(myArgs[0]);