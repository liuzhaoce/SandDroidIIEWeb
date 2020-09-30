var md5Invalid = 'Not a valid MD5 value';
var signatureInvalid = 'Not a valid signature value';

// identify search/all
var isSearch = false;

// identify if there is a need to fetch data from server
var searchAllBtnClicked = false;

// tables
var apkTable = null;

var searchData = null;

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
	// jQuery dataTable
	var apkTableConfig = {};
	for(var key in tableConfig){
		apkTableConfig[key] = tableConfig[key];
	}
	apkTableConfig['fnServerData'] = fnDataApkTablePipeline;
	apkTableConfig['sAjaxSource'] = '/apk_table_info';
	apkTable = $('#apk-table').dataTable(apkTableConfig);
			
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
	apkTable.fnDraw();
	
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
	apkTable.fnDraw();
};

function showAllSuccess(){
	searchAllBtnClicked = false;
	
	getAllBtn().removeClass('active');
	getAllBtn().attr('disabled', false);	
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
var oApkTableCache = {
	iCacheLower: -1
};

function fnDataApkTablePipeline ( sSource, aoData, fnCallback ) {
	var iPipe = 5; /* Ajust the pipe size */
	
	var bNeedServer = false;
	var sEcho = fnGetKey(aoData, "sEcho");
	var iRequestStart = fnGetKey(aoData, "iDisplayStart");
	var iRequestLength = fnGetKey(aoData, "iDisplayLength");
	var iRequestEnd = iRequestStart + iRequestLength;
	oApkTableCache.iDisplayStart = iRequestStart;
	
	/* outside pipeline? */
	if ( oApkTableCache.iCacheLower < 0 || 
		iRequestStart < oApkTableCache.iCacheLower || 
		iRequestEnd > oApkTableCache.iCacheUpper || 
		searchAllBtnClicked )
	{
		bNeedServer = true;
	}
	
	/* sorting etc changed? */
	if ( oApkTableCache.lastRequest && !bNeedServer )
	{
		for( var i=0, iLen=aoData.length ; i<iLen ; i++ )
		{
			if ( aoData[i].name != "iDisplayStart" && aoData[i].name != "iDisplayLength" && aoData[i].name != "sEcho" )
			{
				if ( aoData[i].value != oApkTableCache.lastRequest[i].value )
				{
					bNeedServer = true;
					break;
				}
			}
		}
	}
	
	/* Store the request for checking next time around */
	oApkTableCache.lastRequest = aoData.slice();
	
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

		if ( iRequestStart < oApkTableCache.iCacheLower )
		{
			iRequestStart = iRequestStart - (iRequestLength*(iPipe-1));
			if ( iRequestStart < 0 )
			{
				iRequestStart = 0;
			}
		}
		
		oApkTableCache.iCacheLower = iRequestStart;
		oApkTableCache.iCacheUpper = iRequestStart + (iRequestLength * iPipe);
		oApkTableCache.iDisplayLength = fnGetKey( aoData, "iDisplayLength" );
		fnSetKey( aoData, "iDisplayStart", iRequestStart );
		fnSetKey( aoData, "iDisplayLength", iRequestLength*iPipe );
		
		$.post( sSource, aoData, function (json) { 
			/* Callback processing */
			if(isSearch){
				searchSuccess();
			}else{
				showAllSuccess();
			}
			
			oApkTableCache.lastJson = $.extend(true, {}, json);
			
			if ( oApkTableCache.iCacheLower != oApkTableCache.iDisplayStart )
			{
				json.aaData.splice( 0, oApkTableCache.iDisplayStart-oApkTableCache.iCacheLower );
			}
			json.aaData.splice( oApkTableCache.iDisplayLength, json.aaData.length );
			
			fnCallback(json);

		});
	}
	else
	{
		json = $.extend(true, {}, oApkTableCache.lastJson);
		json.sEcho = sEcho; /* Update the echo for each response */
		json.aaData.splice( 0, iRequestStart-oApkTableCache.iCacheLower );
		json.aaData.splice( iRequestLength, json.aaData.length );
		fnCallback(json);
		
		return;
	}
}







