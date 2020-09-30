var md5Invalid = 'Not a valid MD5 value';
var signatureInvalid = 'Not a valid signature value';

// identify search/all
var isSearch = false;

// identify if there is a need to fetch data from server
var searchAllBtnClicked = false;

// tables
var apkAnalyzedTable = null;
var apkUnanalyzedTable = null;

// charts
var permChart = null;
var codeChart = null;
var riskscoreChart = null;
var maltypeChart = null;

var searchData = null;


// chart config
var barChartOptions = {
		title: {
			style: {
				fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
				fontWeight: 'bold'
			}
		},
		yAxis: {
		    title: {
		    	text: 'Number of APK',
		    	style: {
					fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
				}
		    }
		},
		xAxis: {
			categories: []
		},
		legend: {
			enabled: false
		},
		plotOptions: {
                column: {
                    dataLabels: {
                    	enabled: true
                    }
                }
        },
		series: [
			{
				data:[],
				name: 'Used by '
			}
		]
	};
	
	
var pieChartOptions = {
	title: {
			style: {
				fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
				fontWeight: 'bold'
			}
		},
	plotOptions: {
		pie:{
				allowPointSelect: true,
	            cursor: 'pointer',
	            dataLabels: {
		                        enabled: true,
		                        color: '#000000'
		                    },
		        showInLegend: true
	       } 
        },
	series: [
			{
				type: 'pie',
				data:[],
				name: 'Percentage'
			}
		]
};

// store the md5 value when click 'view detail'
var md5Value = null;


// ---------- search form component --------------
function getSearchForm(){
	return $('#form-search');
};

function getSearchMd5Input(){
	return $('#form-search-md5-input');
};

function getSearchPkgInput(){
	return $('#form-search-pkg-input');
};

function getSearchMalInput(){
	return $('#form-search-mal-input');
};

function getSearchSignatureInput(){
	return $('#form-search-signature-input');
};


function getFormSearchMsg(){
	return $('#form-search-msg');
};

function getSearchBtn(){
	return $('#form-search-btn');
};

function getAllBtn(){
	return $('#form-all-btn');
};


function getApkTable(){
	return $('#apk-table');
};


// clear the search form
function clearSearchForm(){
	$(':input', '#form-search')
	.val('')
	.next('.help-block').children('ul').remove();
	
	$(':input', '#form-search')
	.parent('.form-group').removeClass('has-error has-success');
	
	getFormSearchMsg().children('.alert').remove();
	
	getSearchBtn().removeClass('active');
	getSearchBtn().attr('disabled', false);	
};

// validation check
function isMd5Valid(md5){
	md5 = $.trim(md5); 
	var md5Reg = /^[\w]{1,32}$/;
	return md5Reg.test(md5);
};

function isSignatureValid(signature){
	signature = $.trim(signature); 
	var signatureReg = /^[\w]{40}$/;
	return signatureReg.test(signature);
};

// ------------------------------ detail modal ---------------------
function getDialogDetail(){
	return $('#dialog-detail');
};


// -------------------------- document ready -----------------------
$(function(){
    
	// jQuery dataTable -- analyzed table
	var apkAnalyzedTableConfig = {};
	for(var key in tableConfig){
		apkAnalyzedTableConfig[key] = tableConfig[key];
	}
	apkAnalyzedTableConfig['fnServerData'] = fnDataApkAnalyzedTablePipeline;
	apkAnalyzedTableConfig['sAjaxSource'] = '/apk_analyzed_info';
	apkAnalyzedTable = $('#apk-analyzed-table').dataTable(apkAnalyzedTableConfig);
	
	// jQuery dataTable -- unanalyzed table
	var apkUnanalyzedTableConfig = {};
	for(var key in tableConfig){
		apkUnanalyzedTableConfig[key] = tableConfig[key];
	}
	apkUnanalyzedTableConfig['fnServerData'] = fnDataApkUnanalyzedTablePipeline;
	apkUnanalyzedTableConfig['sAjaxSource'] = '/apk_unanalyzed_info';
	apkUnanalyzedTable = $('#apk-unanalyzed-table').dataTable(apkUnanalyzedTableConfig);
			
	// Highcharts
	sendChartData();
	
	// form events handler			
	getSearchMd5Input().bind('blur', function(e){
		$(this).next('.help-block').children('ul').remove();
		$(this).parent('.form-group').removeClass('has-error has-success');
		var md5 = $(this).val();
		if(md5){
			if(!isMd5Valid(md5)){
				var errorInfo = strFormat('<ul role="alert"><li>{0}</li></ul>', md5Invalid);
				showFormErrEffect(this, errorInfo);	
			}else{
				showFormSuccessEffect(this);
			}
		}
	});
	
	getSearchSignatureInput().bind('blur', function(e){
		$(this).next('.help-block').children('ul').remove();
		$(this).parent('.form-group').removeClass('has-error has-success');
		var signature = $(this).val();
		if(signature){
			if(!isSignatureValid(signature)){
				var errorInfo = strFormat('<ul role="alert"><li>{0}</li></ul>', signatureInvalid);
				showFormErrEffect(this, errorInfo);
			}else{
				showFormSuccessEffect(this);
			}
		}
	});
	
	$('#form-search input')
		.not('#form-search-signature-input')
		.not('#form-search-md5-input').bind('blur', function(e){
			$(this).next('.help-block').children('ul').remove();
			$(this).parent('.form-group').removeClass('has-error has-success');
			var value = $(this).val();
			if(value){
				showFormSuccessEffect(this);
			}
	});
	
	// search
	getSearchBtn().bind('click', function(e){
		var searchInput = $('#form-search input');
		// check input has value
		var hasValue = false;
		$.each(searchInput, function(index, component){
			var value = $(component).val();
			if(value){
				if($(component).attr('id') == 'form-search-md5-input'){
					if(isMd5Valid(value)){
						hasValue = true;
					}
				}else if($(component).attr('id') == 'form-search-signature-input'){
					if(isSignatureValid(value)){
						hasValue = true;
					}
				}else{
					hasValue = true;
				}
			}
		});
		
		if(hasValue){
			search();
		}else{
			getFormSearchMsg().children('.alert').remove();
			var formMsg = strFormat('<div class="alert alert-danger"> {0}</div>', formComplete);
			getFormSearchMsg().append(formMsg);
		}
	});
	
	// show all
	getAllBtn().bind('click', function(e){
		showAll();
	});
});


// -------------------------- search ----------------------
function search(){
	getFormSearchMsg().children('.alert').remove();

	getSearchBtn().addClass('active');
	getSearchBtn().attr('disabled', true);	
	
	isSearch = true;
	searchAllBtnClicked = true;
	searchData = getSearchForm().serialize();
	// table draw
	apkAnalyzedTable.fnDraw();
	// chart draw
	sendChartData();
	
};

function searchSuccess(){
	searchAllBtnClicked = false;
		
	getSearchBtn().removeClass('active');
	getSearchBtn().attr('disabled', false);	
};

//-------------------------- show all ---------------------
function showAll(){
	getAllBtn().addClass('active');
	getAllBtn().attr('disabled', true);	
	
	isSearch = false;
	searchData = '';
	searchAllBtnClicked = true;
	// table draw
	apkAnalyzedTable.fnDraw();
	// chart draw
	sendChartData();
};

function showAllSuccess(){
	searchAllBtnClicked = false;
	
	getAllBtn().removeClass('active');
	getAllBtn().attr('disabled', false);	
};

// ------------------------- Highcharts ----------------------
function sendChartData(){
	var dataJson = {};
	dataJson['is_search'] = isSearch;
	
	if(permChart && codeChart){
		permChart.showLoading();
		codeChart.showLoading();
	}
		
	if(isSearch){
		var searchDataArr = searchData.split('&');
		$.each(searchDataArr, function(index, valuePair){
			var key = valuePair.split('=')[0];
			var value = valuePair.split('=')[1];
			dataJson[key] = value;
		});
	}
	// ajax json
	// chart permission
	$.ajax({
			url: '/apk_charts',
			type: 'POST',
			data: dataJson,
			dataType: 'json',
			success: processCharts
			});
};

function processCharts(response){
    chartPermission(response);
    chartMaltype(response);
    chartCode(response);
    chartRiskscore(response);
};

function chartPermission(response){
	// permission chart
	if(!permChart){
		var permChartOptions = {};
		for(var key in barChartOptions){
			permChartOptions[key] = barChartOptions[key];
		}
		permChartOptions['xAxis'].labels = {
			rotation: -45,
	        align: 'right',
	        style: {
	            fontSize: '12px',
	            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
	        }
	    };
	    permChartOptions['chart'] = {
			renderTo: 'permission-chart',
			type: 'column'
		},
		permChartOptions['title'].text = 'Top 20 Used Permissions';

		permChartOptions.series[0].data = response.permissions;
		
		permChart = new Highcharts.Chart(permChartOptions);
	}else{
		permChart.hideLoading();
		permChart.series[0].setData(response.permissions);
	}
};

function chartMaltype(response){
	// malware type chart
	if(!maltypeChart){
		var maltypeChartOptions = {};
		for(var key in barChartOptions){
			maltypeChartOptions[key] = barChartOptions[key];
		}
		maltypeChartOptions['xAxis'].labels = {
			rotation: -45,
	        align: 'right',
	        style: {
	            fontSize: '12px',
	            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
	        }
	    };
	    maltypeChartOptions['chart'] = {
			renderTo: 'maltype-chart',
			type: 'column'
		},
		maltypeChartOptions['title'].text = 'Malware Types';
		maltypeChartOptions.series[0].color = '#006699';
		maltypeChartOptions.series[0].data = response.maltypes;
		
		maltypeChart = new Highcharts.Chart(maltypeChartOptions);
	}else{
		maltypeChart.hideLoading();
		maltypeChart.series[0].setData(response.maltypes);
	}
};


function chartCode(response){
	// code feature chart
	if(!codeChart){
		var codeChartOptions = {};
		for(var key in barChartOptions){
			codeChartOptions[key] = barChartOptions[key];
		}
		codeChartOptions['xAxis'].labels = {
	        style: {
	            fontSize: '12px',
	            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
	        }
	    };
	    codeChartOptions['chart'] = {
			renderTo: 'code-chart',
			type: 'column'
		},
		codeChartOptions['title'].text = 'Code Features';


		codeChartOptions.series[0].data = response.code;
		codeChartOptions.series[0].color = '#003366';
		codeChart = new Highcharts.Chart(codeChartOptions);
	}else{
		codeChart.hideLoading();
		codeChart.series[0].setData(response.code);
	}
};

function chartRiskscore(response){
	// risk score chart
	if(!riskscoreChart){
		var riskscoreChartOptions = {};
		for(var key in pieChartOptions){
			riskscoreChartOptions[key] = pieChartOptions[key];
		}
	    riskscoreChartOptions['chart'] = {
			renderTo: 'riskscore-chart',
			plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false
		};
		riskscoreChartOptions['title'].text = 'Risk Score Distribution';

		riskscoreChartOptions.series[0].data = response.risk_score;
		riskscoreChart = new Highcharts.Chart(riskscoreChartOptions);
	}else{
		riskscoreChart.hideLoading();
		riskscoreChart.series[0].setData(response.risk_score);
	}
	
};

//-------------------------- jQuery dataTable ------------------
// ------------------- pipeline ---------------------
function fnSetKey( aoData, sKey, mValue )
{
	for ( var i=0, iLen=aoData.length ; i<iLen ; i++ )
	{
		if ( aoData[i].name == sKey )
		{
			aoData[i].value = mValue;
		}
	}
};

function fnGetKey( aoData, sKey )
{
	for ( var i=0, iLen=aoData.length ; i<iLen ; i++ )
	{
		if ( aoData[i].name == sKey )
		{
			return aoData[i].value;
		}
	}
	return null;
};

//--------------- apk table -----------------------------------
var oApkAnalyzedTableCache = {
	iCacheLower: -1
};

function fnDataApkAnalyzedTablePipeline ( sSource, aoData, fnCallback ) {
	var iPipe = 5; /* Ajust the pipe size */
	
	var bNeedServer = false;
	var sEcho = fnGetKey(aoData, "sEcho");
	var iRequestStart = fnGetKey(aoData, "iDisplayStart");
	var iRequestLength = fnGetKey(aoData, "iDisplayLength");
	var iRequestEnd = iRequestStart + iRequestLength;
	oApkAnalyzedTableCache.iDisplayStart = iRequestStart;
	
	/* outside pipeline? */
	if ( oApkAnalyzedTableCache.iCacheLower < 0 || 
		iRequestStart < oApkAnalyzedTableCache.iCacheLower || 
		iRequestEnd > oApkAnalyzedTableCache.iCacheUpper || 
		searchAllBtnClicked )
	{
		bNeedServer = true;
	}
	
	/* sorting etc changed? */
	if ( oApkAnalyzedTableCache.lastRequest && !bNeedServer )
	{
		for( var i=0, iLen=aoData.length ; i<iLen ; i++ )
		{
			if ( aoData[i].name != "iDisplayStart" && aoData[i].name != "iDisplayLength" && aoData[i].name != "sEcho" )
			{
				if ( aoData[i].value != oApkAnalyzedTableCache.lastRequest[i].value )
				{
					bNeedServer = true;
					break;
				}
			}
		}
	}
	
	/* Store the request for checking next time around */
	oApkAnalyzedTableCache.lastRequest = aoData.slice();
	
	if ( bNeedServer )
	{
		aoData.push( {"name": "is_search", "value": isSearch} );
		if(isSearch){
			var searchDataArr = searchData.split('&');
			$.each(searchDataArr, function(index, valuePair){
				var key = valuePair.split('=')[0];
				var value = valuePair.split('=')[1];
				aoData.push( {"name": key, "value": value} );
			});
		}

		if ( iRequestStart < oApkAnalyzedTableCache.iCacheLower )
		{
			iRequestStart = iRequestStart - (iRequestLength*(iPipe-1));
			if ( iRequestStart < 0 )
			{
				iRequestStart = 0;
			}
		}
		
		oApkAnalyzedTableCache.iCacheLower = iRequestStart;
		oApkAnalyzedTableCache.iCacheUpper = iRequestStart + (iRequestLength * iPipe);
		oApkAnalyzedTableCache.iDisplayLength = fnGetKey( aoData, "iDisplayLength" );
		fnSetKey( aoData, "iDisplayStart", iRequestStart );
		fnSetKey( aoData, "iDisplayLength", iRequestLength*iPipe );
		
		$.post( sSource, aoData, function (json) { 
			/* Callback processing */
			if(isSearch){
				searchSuccess();
			}else{
				showAllSuccess();
			}
			
			oApkAnalyzedTableCache.lastJson = $.extend(true, {}, json);
			
			if ( oApkAnalyzedTableCache.iCacheLower != oApkAnalyzedTableCache.iDisplayStart )
			{
				json.aaData.splice( 0, oApkAnalyzedTableCache.iDisplayStart-oApkAnalyzedTableCache.iCacheLower );
			}
			json.aaData.splice( oApkAnalyzedTableCache.iDisplayLength, json.aaData.length );
			
			fnCallback(json);

		});
	}
	else
	{
		json = $.extend(true, {}, oApkAnalyzedTableCache.lastJson);
		json.sEcho = sEcho; /* Update the echo for each response */
		json.aaData.splice( 0, iRequestStart-oApkAnalyzedTableCache.iCacheLower );
		json.aaData.splice( iRequestLength, json.aaData.length );
		fnCallback(json);
		
		return;
	}
};


var oApkUnanalyzedTableCache = {
	iCacheLower: -1
};

function fnDataApkUnanalyzedTablePipeline ( sSource, aoData, fnCallback ) {
	var iPipe = 5; /* Ajust the pipe size */
	
	var bNeedServer = false;
	var sEcho = fnGetKey(aoData, "sEcho");
	var iRequestStart = fnGetKey(aoData, "iDisplayStart");
	var iRequestLength = fnGetKey(aoData, "iDisplayLength");
	var iRequestEnd = iRequestStart + iRequestLength;
	oApkUnanalyzedTableCache.iDisplayStart = iRequestStart;
	
	/* outside pipeline? */
	if ( oApkUnanalyzedTableCache.iCacheLower < 0 || 
		iRequestStart < oApkUnanalyzedTableCache.iCacheLower || 
		iRequestEnd > oApkUnanalyzedTableCache.iCacheUpper || 
		searchAllBtnClicked )
	{
		bNeedServer = true;
	}
	
	/* sorting etc changed? */
	if ( oApkUnanalyzedTableCache.lastRequest && !bNeedServer )
	{
		for( var i=0, iLen=aoData.length ; i<iLen ; i++ )
		{
			if ( aoData[i].name != "iDisplayStart" && aoData[i].name != "iDisplayLength" && aoData[i].name != "sEcho" )
			{
				if ( aoData[i].value != oApkUnanalyzedTableCache.lastRequest[i].value )
				{
					bNeedServer = true;
					break;
				}
			}
		}
	}
	
	/* Store the request for checking next time around */
	oApkUnanalyzedTableCache.lastRequest = aoData.slice();
	
	if ( bNeedServer )
	{
		aoData.push( {"name": "is_search", "value": isSearch} );
		if(isSearch){
			var searchDataArr = searchData.split('&');
			$.each(searchDataArr, function(index, valuePair){
				var key = valuePair.split('=')[0];
				var value = valuePair.split('=')[1];
				aoData.push( {"name": key, "value": value} );
			});
		}

		if ( iRequestStart < oApkUnanalyzedTableCache.iCacheLower )
		{
			iRequestStart = iRequestStart - (iRequestLength*(iPipe-1));
			if ( iRequestStart < 0 )
			{
				iRequestStart = 0;
			}
		}
		
		oApkUnanalyzedTableCache.iCacheLower = iRequestStart;
		oApkUnanalyzedTableCache.iCacheUpper = iRequestStart + (iRequestLength * iPipe);
		oApkUnanalyzedTableCache.iDisplayLength = fnGetKey( aoData, "iDisplayLength" );
		fnSetKey( aoData, "iDisplayStart", iRequestStart );
		fnSetKey( aoData, "iDisplayLength", iRequestLength*iPipe );
		
		$.post( sSource, aoData, function (json) { 
			/* Callback processing */
			if(isSearch){
				searchSuccess();
			}else{
				showAllSuccess();
			}
			
			oApkUnanalyzedTableCache.lastJson = $.extend(true, {}, json);
			
			if ( oApkUnanalyzedTableCache.iCacheLower != oApkUnanalyzedTableCache.iDisplayStart )
			{
				json.aaData.splice( 0, oApkUnanalyzedTableCache.iDisplayStart-oApkUnanalyzedTableCache.iCacheLower );
			}
			json.aaData.splice( oApkUnanalyzedTableCache.iDisplayLength, json.aaData.length );
			
			fnCallback(json);

		});
	}
	else
	{
		json = $.extend(true, {}, oApkUnanalyzedTableCache.lastJson);
		json.sEcho = sEcho; /* Update the echo for each response */
		json.aaData.splice( 0, iRequestStart-oApkUnanalyzedTableCache.iCacheLower );
		json.aaData.splice( iRequestLength, json.aaData.length );
		fnCallback(json);
		
		return;
	}
}
//dynamic update malware numbers
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






