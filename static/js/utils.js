var threatType = {
	MAY_SEND_SMS : 'may_send_sms',
	SEND_SMS : 'send_sms',
	INTERNET : 'data_internet',
	REPACKAGED : 'repackaged',
	REBOOT : 'reboot',
	C2DM : 'c2dm',
	DATA_LEAK : 'data_leak'
};

// table config
var tableConfig = {
	'bProcessing' : true,
	'bFilter' : false,
	'bStateSave' : true,
	'bAutoWidth' : false,
	'sScrollY' : '270px',
	'bScrollCollapse' : true,
	'bPaginate' : true,
	'iDisplayLength' : 10,
	'sPaginationType' : 'full_numbers',
	'bServerSide' : true,
	'sServerMethod' : 'POST',
	'aoColumnDefs' : [ {
		'fnRender' : function(oObj) {
			return md5ColumnRender(oObj);
		},
		'aTargets' : [ 0 ]
	}, {
		'fnRender' : function(oObj) {
			return riskColumnRender(oObj);
		},
		'aTargets' : [ 2 ]
	}, {
		'fnRender' : function(oObj) {
			return reviewColumnRender(oObj);
		},
		'aTargets' : [ 3 ]
	}, {
		'fnRender' : function(oObj) {
			return checkTimeColumnRender(oObj);
		},
		'aTargets' : [ 4 ]
	} ],
	"aoColumns" : [ {
		"sWidth" : "25%"
	},
	// { "sWidth": "20%"},
	{
		"sWidth" : "25%"
	}, {
		"sWidth" : "15%"
	}, {
		"sWidth" : "15%"
	}, {
		"sWidth" : "20%"
	}, ]
};

function strFormat() {
	var s = arguments[0];
	for (var i = 0; i < arguments.length - 1; i++) {
		var reg = new RegExp("\\{" + i + "\\}", "gm");
		s = s.replace(reg, arguments[i + 1]);
	}

	return s;
};

/* added by songalee at 20170725 */
function checkTimeColumnRender(oObj) {
	var check_time = oObj.aData[4];
	return check_time;
}

function md5ColumnRender(oObj) {
	var threats = oObj.aData[5];
	var threatTd = '';
	$
			.each(
					threats,
					function(index, threat) {
						if (threat === threatType.MAY_SEND_SMS) {
							threatTd += '<i class="icon-envelope threat-icon pull-right" title="May Send SMS"></i> &nbsp&nbsp';
						} else if (threat === threatType.SEND_SMS) {
							threatTd += '<font color="red"><i class="icon-envelope threat-icon pull-right" title="Send SMS"></i></font> &nbsp&nbsp';
						} else if (threat === threatType.C2DM) {
							threatTd += '<i class="icon-signin threat-icon pull-right" title="C2DM Service"></i> &nbsp&nbsp';
						} else if (threat === threatType.INTERNET) {
							threatTd += '<i class="icon-upload-alt threat-icon pull-right" title="Send/Get Data via Internet"></i> &nbsp&nbsp';
						} else if (threat === threatType.REPACKAGED) {
							threatTd += '<i class="icon-inbox threat-icon pull-right" title="Repackaged"></i> &nbsp&nbsp';
						} else if (threat == threatType.DATA_LEAK) {
							threatTd += '<font color="red"><i class="icon-random threat-icon pull-right" title="Data Leaks"></i></font> &nbsp&nbsp';
						} else if (threat == threatType.REBOOT) {
							threatTd += '<i class="icon-repeat threat-icon pull-right" title="Data Leaks"></i> &nbsp&nbsp';
						}
					});

	var renderRes = strFormat(
			'<span><a href="/report?file_md5={0}" target="_blank">{0}</a>{1}</span>',
			oObj.aData[0], threatTd);
	return renderRes;
};

function riskColumnRender(oObj) {
	var riskScore = oObj.aData[2];

	var renderRes = strFormat('<img src="../static/images/level{0}.gif" />',
			parseInt(riskScore / 10));

	return renderRes;

};

// render the review column
function reviewColumnRender(oObj) {
	var renderRes = '';
	if (oObj.aData[5]) {
		renderRes = '<span>\
                        <i class="icon-ok-sign" title="Reviewed"></i> \
                     </span>';
	} else {
		renderRes = '<span>\
                        <i class="icon-remove-sign" title="Need review"></i> \
                     </span>';
	}

	return renderRes;
};
