// dynamic update malware numbers
var curSampleNumber = 0;

function time_start() 
{
	var timeDate = new Date;
	var year = timeDate.getFullYear();
	var month = timeDate.getMonth() + 1;
	var day = timeDate.getDate();
	var hours = showFilled(timeDate.getHours());
	var minutes = showFilled(timeDate.getMinutes());
	var seconds = showFilled(timeDate.getSeconds());
	
	var showTime = strFormat('{0}-{1}-{2} {3}:{4}:{5}', year, month, day, hours, minutes, seconds);
	$('#overall #time').text(showTime);
	setTimeout('time_start()',1000);
};

function showFilled(value) 
{
	return (value > 9) ? "" + value : "0" + value;
};

function getSampleNumber(){
	$.ajax({
		url: '/sample_number',
		type: 'POST',
		dataType: 'json',
		success: showSampleNumber
		});
};

function showSampleNumber(response){
	var number = response.number;
	curSampleNumber = number;
	$('#overall #mal-number').text(number);
	
};

// -------------------- websocket get sample numbers ------------------
function updateSampleNumber(){
	var WebSocket = window.WebSocket || window.MozWebSocket;
	var socket = null;
	
    if (WebSocket) {
        try {
        	var socket = new WebSocket('ws://localhost:8080/sample_number_socket');
        	} catch (e) {
        }
    }
    if(socket){
    	if(socket.readyState == 1){
	    	socket.send(curSampleNumber);
		 }else{
		    socket.onopen = function(event){
		        socket.send(curSampleNumber);
		    }
		}
		socket.onmessage = function(event) {
	        curSampleNumber = event.data;
	        console.log(curSampleNumber);
			$('#overall #mal-number').text(curSampleNumber);
			socket.send(curSampleNumber);
	   	};	
    }
};


$(function(){
	time_start();
	getSampleNumber();
	//updateSampleNumber();
	
	
});
