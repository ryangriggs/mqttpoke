/* mqttpoke (c) 2024 Ryan Griggs. All rights reserved.
Released under MIT license.
https://github.com/ryangriggs/mqttpoke
*/
$(document).ready(function() {

	$("#uri").val(Cookies.get('uri'));
	$("#topic").val(Cookies.get('topic'));
	$("#username").val(Cookies.get('username'));
	$("#password").val(Cookies.get('password'));

	// Highlight all inputs on click
	$("input[type=text]").on('click', function() {
		this.select();
	});

	// Hotkeys on value boxes:
	$(".item input.value").on('keydown', function(event) {
		// Enter key: publish
		if (event.keyCode == 13)
		{
			$(this).closest('.item').find('.btnItemPublish').click();
		}
	});

	$('#btnConnect').on('click', function() {
		connect();
	});

	$(".btnItemPublish").on('click', function() {
		const item = $(this).closest('.item');
		const topic = item.find('.topic').text();
		const type = item.find('.type .value').val();
		let value = null;
		if (type == 'bool') { value = item.find('.message .bool .value').is(':checked'); }
		else { value = item.find(`.message .${type} .value`).val(); }

		// Convert value to appropriate datatype.
		let typedValue = null; let temp; let buf;
		switch (type)
		{
			case 'bool':
				typedValue = new Uint8Array([ value ? 1 : 0 ]);
				break;
			
			case 'int16s':
				typedValue = new ArrayBuffer(2);
				new DataView(typedValue).setInt16(0, value);
				break;
			
			case 'int32s':
				typedValue = new ArrayBuffer(4);
				new DataView(typedValue).setInt32(0, value);
				break;

			case 'float32':
				typedValue = new ArrayBuffer(4);
				new DataView(typedValue).setFloat32(0, value);			
				break;
			
			case 'text':
				typedValue = new TextEncoder().encode(value);
				break;
				
		}

		client.publish(topic, new Uint8Array(typedValue), { retain: true });
		log(`Published ${topic} = ${value}`);
	});

	$(".btnItemRemove").on('click', function() {
		let el = $(this).closest('.item');
		let topic = el.find('.topic').text();
		client.publish(topic, new Uint8Array(), { retain: true });	// Remove from server by publishing 0-length data.
		el.remove();
	});

	$("#btnSubscribe").on('click', function() {
		const topic = prompt("Enter topic name");
		if (!topic) { return; }
		addItem(topic, "");
		client.subscribe(topic);
	})

});

function formatData(select)
{
	let el = $(select).closest('.item');
	let type = $(select).val();
	let topic = el.find('.topic').text();
	let message = el.prop('message');

	el.find('.message .display').hide();
	el.find(`.message .${type}`).show();

	Cookies.set(`Type: ${topic}`, type, { expires: 365 });

	setValue(el, message);
}

function messageHandler(topic, message)
{
	console.log("Message:", topic, message);

	// Find topic in list
	let result = false;
	$(".data .item").not('.template').each(function() {
		let el = $(this);
		if (el.find('.topic').text() == topic) { result = el; return;}
	});
	if (!result)
	{
		result = addItem(topic, message);
	}
	setValue(result, message);
	formatData(result.find('.type .value')[0]);
}

function addItem(topic, message)
{
	result = $(".data .item.template").clone(true);
	result.removeClass('template');
	$('.data .item').last().after(result);
	result.find('.topic').text(topic);
	result.find('.message .text .value').text(message);
	let type = Cookies.get(`Type: ${topic}`);
	if (type) { result.find('.type .value').val(type); }	// Set saved type
	return result;
}

function setValue(element, message)
{
	const type = element.find('.type .value').val();
	let v; let temp;
	switch (type)
	{
		case 'text':
			v = message.toString();
			break;
		
		case 'bool':
			v =  message[0] == 1;
			element.find('.message .bool .value').prop('checked', v);
			break;
		
		case 'int16s':
			v = message.readInt16BE(0);
			break;
		
		case 'int32s':
			v = message.readInt32BE(0);
			break;
		
		case 'float32':
			v = message.readFloatBE(0);
			break;
	}
	
	element.prop('message', message);
	element.find(`.message .${type} .value`).val(v);	// Sets the text value for all types (invisible for boolean type)
	// let count = parseInt(element.find('.counter').text());
	// count++;
	// element.find('.counter').text(count);
	element.find('.counter').text(new Date().getUTCDate());
}

let client;

function connect()
{
	const uri = $("#uri").val();
	const username = $("#username").val();
	const password = $("#password").val();
	const topic = $("#topic").val();

	// Disconnect any existing connection
	if (client) 
	{
		log("Closing existing MQTT connection...");
		client.end(); 
	}

	
	Cookies.set('uri', uri, { expires: 365 });
	Cookies.set('username', username, { expires: 365 });
	Cookies.set('password', password, { expires: 365 });
	Cookies.set('topic', topic, { expires: 365 });

	log("Connecting to MQTT server...");

	client = mqtt.connect(uri, { username, password });
	client.on('connect', () => {
		log("Connected to server.");
		client.subscribe(topic);
	});

	client.on('error', (err) => {
		log("Connection error:" + err, "error");
	});

	client.on('message', (topic, message) => {
		messageHandler(topic, message)
	});
}

function log(message, severity = "info")
{
	const l = $("#log .entry.template").clone(true);
	l.removeClass('template');
	$("#log .entry").first().before(l);
	l.find('.message').text(message);
	l.addClass(severity);
	l.find('.date').text(moment().format('M/D/YYYY h:mm:ss a'));
}
