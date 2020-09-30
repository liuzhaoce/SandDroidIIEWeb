// ----------------------------- process report information ------------------------
var fileMd5 = '';
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

$(function(){
	fileMd5 = $('#report-th').data('md5');
	
	// add back to top feature
	backToTop();
	
	// prepare edit form
	prepareEditForm(fileMd5);
	
	// get analyzed information
	getAnalyzedInfo(fileMd5);
	
	
});

// back to top
function backToTop(){
    $(window).scroll(function() {
        if($(this).scrollTop() != 0) {
            $('#to-top').fadeIn();  
        } else {
            $('#to-top').fadeOut();
        }
    });
 
    $('#to-top').click(function() {
        $('body,html').animate({scrollTop:0},800);
    });
};

//get application and malware type
function getAppMalType(){
	$.ajax({
			url: '/appmaltype',
			dataType: 'json',
			type: 'POST',
			success: getAppMalTypeSuccess
		});	
};

function getAppMalTypeSuccess(response){
	var data = response.apptype;
	$('#edit-apptype').multiselect('dataprovider', data);
	data = response.maltype;
	$('#edit-maltype').multiselect('dataprovider', data);
	
};

// prepare edit form
function prepareEditForm(fileMd5){
	// get application and malware type
	getAppMalType();
	
	$('#edit-report-btn').bind('click', function(e){
		$('#dialog-edit').modal('show');
	});
	
	// clear btn css
	$('#dialog-edit').bind('hidden', function(e){
		$('#form-edit-btn').removeClass('active').attr('disabled', false);	
	});
	
	$('#form-edit-btn').bind('click', function(e){
		saveEdit(fileMd5);
	});
	
	$('.multiselect').multiselect({
		selectAllText: true
	});
};

// edit form post
var editData = {};
function saveEdit(fileMd5){
	editData.file_md5 = fileMd5;
	editData.remark = $('#form-edit-remark-input').val();
	editData.feature1 = $('#form-edit-feature1-input').val();
	editData.feature2 = $('#form-edit-feature2-input').val();
	editData.feature3 = $('#form-edit-feature3-input').val();
	editData.apptypes = $('#edit-apptype').val();
	editData.maltypes = $('#edit-maltype').val();
	
	// add css
	$('#form-edit-btn').addClass('active').attr('disabled', true);	
	
	$.ajax({
			url: '/reportedit',
			data: {'data': JSON.stringify(editData)},
			dataType: 'json',
			type: 'POST',
			success: saveEditSuccess
		});	
};

function saveEditSuccess(response){
	var update = response.update;
	if (update){
		$('#form-edit-btn').removeClass('active').attr('disabled', false);	
		
		// refresh basic and features
	    $('#basic-table #remark-tr td').eq(1).text(editData.remark);
        $('#features-table #feature1-tr td').eq(1).text(editData.feature1);
        $('#features-table #feature2-tr td').eq(1).text(editData.feature2);
        $('#features-table #feature3-tr td').eq(1).text(editData.feature3);
        $('#basic-table #apptype-tr td').eq(1).text(editData.apptypes.join(','));
        $('#basic-table #maltype-tr td').eq(1).text(editData.maltypes.join(','));
	}
	
}

// get analyzed information
function getAnalyzedInfo(fileMd5){
	$.ajax({
			url: '/detail_report',
			data: {'file_md5': fileMd5},
			dataType: 'json',
			type: 'POST',
			success: getAnalyzedInfoSuccess
			});	
};

function getAnalyzedInfoSuccess(response){
       processStatic(response);
       processDynamic(response);
	
};

// process static analysis information
function processStatic(response){
       processBasic(response);
       processAlias(response);
       processFeatures(response);
       processClassifications(response);
       processCertification(response);
       processCodeFeatures(response);
       processAds(response);
       processComponents(response);
       processPermissions(response);
       processStrs(response);
       
};

// process dynamic analysis information
function processDynamic(response){
    processStartedServices(response);
    processNetOperations(response);
    processFileOperations(response);
    processEncryptions(response);
    processDataleaks(response);
    processCalls(response);
    processTextMsgs(response);
    
};


// --------------------------- static process ------------------------
function isObjectEmpty(obj){
	for (var name in obj) 
    {
        return false;
    }
    return true;
};

function processBasic(response){
	var basicInfo = response.basic;
	var repackaged = response.repackaged;
	var threats = response.threats;
	var downloadFiles = response.download;
	if(basicInfo.length > 1){
		$('#basic-loading-img').hide();
		$('#basic-table').show();
		$.each(basicInfo, function(index, info){
			var tdInfo = strFormat('<td>{0}</td>', info);
			$($('#basic-table tbody tr')[index]).append(tdInfo);
			if(index === 6){
				// remark
				$('#form-edit-remark-input').val(info)
			}else if(index === 7){
				// malware types
				var maltype_arr = info.split(',');
				$('#edit-maltype').multiselect('select', maltype_arr);
			}else if(index === 8){
				// application types
				var apptype_arr = info.split(',');
				$('#edit-apptype').multiselect('select', apptype_arr);
			}
		});
		
		if(repackaged){
		    $('#basic-table #repackage-tr').append('<td><i class="icon-ok-sign"></i></td>');
		}else{
		    $('#basic-table #repackage-tr').append('<td><i class="icon-remove-sign"></i></td>');
		}
		
		if(threats.length > 0){
		    var threatTd = '';
			$.each(threats, function(index, threat){
    			if(threat === threatType.MAY_SEND_SMS){
                    threatTd += '<i class="icon-envelope threat-icon" title="May Send SMS"></i> &nbsp&nbsp';
                }else if(threat === threatType.SEND_SMS){
                    threatTd += '<font color="red"><i class="icon-envelope threat-icon" title="Send SMS"></i></font> &nbsp&nbsp';
                }else if(threat === threatType.C2DM){
                    threatTd += '<i class="icon-signin threat-icon" title="C2DM Service"></i> &nbsp&nbsp';
                }else if(threat === threatType.INTERNET){
                    threatTd += '<i class="icon-upload-alt threat-icon" title="Send/Get Data via Internet"></i> &nbsp&nbsp';
                }else if(threat === threatType.REPACKAGED){
                    threatTd += '<i class="icon-inbox threat-icon" title="Repackaged"></i> &nbsp&nbsp';
                }else if(threat == threatType.DATA_LEAK){
                    threatTd += '<font color="red"><i class="icon-random threat-icon" title="Data Leaks"></i></font> &nbsp&nbsp';
                }else if(threat == threatType.REBOOT){
                    threatTd += '<i class="icon-repeat threat-icon" title="Data Leaks"></i> &nbsp&nbsp';
                }
    		});
    		threatTd = strFormat('<td>{0}</td>', threatTd);
            $('#basic-table #threat-tr').append(threatTd);
		}else{
			$('#basic-table #threat-tr').append('<td><i class="icon-remove-sign"></i></td>');
		}
		
		if(downloadFiles.pcap || downloadFiles.gexf){
			console.log('hello');
			$('#basic-table tbody').append('<tr id="download"><td> Download Files</td></tr>');
		}
		var downloadPath = '';
		if(downloadFiles.pcap){
			var pcapPath = strFormat('/download?file_md5={0}&file_type=pcap', fileMd5);
			downloadPath = strFormat('{0}<a href="{1}" target="_blank">\
									 	<img class="download-img" src="static/images/pcap.png">',
									 downloadPath, pcapPath);	
		}
		if(downloadFiles.gexf){
			var gexfPath = strFormat('/download?file_md5={0}&file_type=gexf', fileMd5);
			downloadPath = strFormat('{0}<a href="{1}" target="_blank">\
									 	<img class="download-img" src="static/images/gexf.png">',
									 downloadPath, gexfPath);	
		}
		$('#basic-table #download').append(strFormat('<td> {0} </td>', downloadPath));
	}
};

// process alias by szhao
function processAlias(response){
	$('#alias-loading-img').hide();
    $('#alias-table').show();
    var antiyVir = response.antivir;
    $('#alias-table #antiyvir-tr').append(strFormat('<td> {0} </td>', antiyVir));
	var kaspersky = response.kaspersky;
    $('#alias-table #kaspersky-tr').append(strFormat('<td> {0} </td>', kaspersky));
	var nod32 = response.nod32;
    $('#alias-table #nod32-tr').append(strFormat('<td> {0} </td>', nod32));
	var avg = response.avg;
    $('#alias-table #avg-tr').append(strFormat('<td> {0} </td>', avg));
	var symantec = response.symantec;
    $('#alias-table #symantec-tr').append(strFormat('<td> {0} </td>', symantec));      
}

// process code features
function processFeatures(response){
	var featureInfo = response.features;
	if(featureInfo.length > 0){
		$('#features-loading-img').hide();
		$('#features-table').show();

		$.each(featureInfo, function(index, info){
			var tdInfo = strFormat('<td>{0}</td>', info);
			$($('#features-table tbody tr')[index]).append(tdInfo);
			
			var input = strFormat('#form-edit-feature{0}-input', index+1);
			$(input).val(info);
		});	
	}else{
		$('#features-container').hide();
	}
	
}

// process classifications information
function processClassifications(response){
	var classifications = response.classifications;
	var classificationChartOptions = {};
	for(var key in pieChartOptions){
		classificationChartOptions[key] = pieChartOptions[key];
	}
    classificationChartOptions['chart'] = {
		plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false
	}
	$.each(classifications, function(classificationName, values){
		classificationChartOptions['title'].text = classificationName;
		classificationChartOptions['chart'].renderTo = strFormat('{0}-chart', classificationName).toLowerCase();
		classificationChartOptions.series[0].data = values;
		console.log(classificationChartOptions);
		var classificationChart = new Highcharts.Chart(classificationChartOptions);
	});
}

// process certification
function processCertification(response){
    var certification = response.certification;
    if(certification.length > 0){
        $('#certificate-loading-img').hide();
        $('#certificate-table').show();
        $.each(certification, function(index, info){
            info = strFormat('<td>{0}</td>', info);
            $('#certificate-table tbody tr').eq(index).append(info);
        });
        
    }else{
        $('#certificate-container').hide();
    }
	
}

// process code features
function processCodeFeatures(response){
    var codeFeatures = response.code;
    if(codeFeatures.length > 0){
        $('#code-loading-img').hide();
        $('#code-table').show();
        $.each(codeFeatures, function(index, info){
            if(!info){
                info = '<td><i class="icon-remove-sign"></i></td>';
            }else{
                info = '<td><i class="icon-ok-sign"></i></td>';
                $('#code-table tbody tr').eq(index).addClass('danger');
            }
            $('#code-table tbody tr').eq(index).append(info);
        });
        
    }else{
        $('#code-container').hide();
    }
	
};


// process ads
function processAds(response){
	var ads = response.ads;
	if(ads.length > 0){
		$('#ad-loading-img').hide();
		$('#ad-table').show();
		$.each(ads, function(index, info){
			var name = info[0];
			var link = info[1];
			var row = strFormat('<tr><td class="ad-td"><a href="{0}">{1} \
			                     <i class="icon-external-link"></i></a></td><tr>', link, name);
			$('#ad-table tbody').append(row);
		});
	}else{
		$('#ad-container').hide();
	}
};

// process components
function processComponents(response){
	var activities = response.activities;
	var services = response.services;
	var receivers = response.receivers;
	var providers = response.providers;

	if(activities.length > 0){
		$('#activity-loading-img').hide();
		$('#activity-table').show();
		$.each(activities, function(index, info){
			var name = strFormat('<td>{0}</td>', info[0]);
			var main = info[1];
			if(main){
				var mainActivity = '<td><i class="icon-ok-sign"></i></td>';
			}else{
				var mainActivity = '<td><i class="icon-remove-sign"></i></td>';
			}
			var exposed = info[2];
			if(exposed){
				var exposedIcon = '<td><i class="icon-ok-sign"></i></td>';
			}else{
				var exposedIcon = '<td><i class="icon-remove-sign"></i></td>';
			}
			if(main || exposed){
			    var row = strFormat('<tr class="danger">{0}{1}{2}</tr>', name, mainActivity, exposedIcon);
			}else{
			    var row = strFormat('<tr>{0}{1}{2}</tr>', name, mainActivity, exposedIcon);
			}
			
			$('#activity-table tbody').append(row);
		});
	}else{
		$('#activity-container').hide();
	}
	
	if(services.length > 0){
		$('#service-loading-img').hide();
		$('#service-table').show();
		$.each(services, function(index, info){
			var name = strFormat('<td>{0}</td>', info[0]);
			var exposed = info[1];
			if(exposed){
				var exposedIcon = '<td><i class="icon-ok-sign"></i></td>';
				var row = strFormat('<tr class="danger">{0}{1}</tr>', name, exposedIcon);
			}else{
				var exposedIcon = '<td><i class="icon-remove-sign"></i></td>';
				var row = strFormat('<tr>{0}{1}</tr>', name, exposedIcon);
			}
			
			$('#service-table tbody').append(row);
		});
	}else{
		$('#service-container').hide();
	}
	
	if(receivers.length > 0){
		$('#receiver-loading-img').hide();
		$('#receiver-table').show();
		$.each(receivers, function(index, info){
			var name = strFormat('<td>{0}</td>', info[0]);
			var exposed = info[1];
			if(exposed){
				var exposedIcon = '<td><i class="icon-ok-sign"></i></td>';
				var row = strFormat('<tr class="danger">{0}{1}</tr>', name, exposedIcon);
			}else{
				var exposedIcon = '<td><i class="icon-remove-sign"></i></td>';
				var row = strFormat('<tr>{0}{1}</tr>', name, exposedIcon);
			}
			$('#receiver-table tbody').append(row);
		});
	}else{
		$('#receiver-container').hide();
	}
	
	if(providers.length > 0){
		$('#provider-loading-img').hide();
		$('#provider-table').show();
		$.each(providers, function(index, info){
			var name = strFormat('<td>{0}</td>', info[0]);
			var exposed = info[1];
			if(exposed){
				var exposedIcon = '<td><i class="icon-ok-sign"></i></td>';
				var row = strFormat('<tr class="danger">{0}{1}</tr>', name, exposedIcon);
			}else{
				var exposedIcon = '<td><i class="icon-remove-sign"></i></td>';
				var row = strFormat('<tr>{0}{1}</tr>', name, exposedIcon);
			}
			$('#provider-table tbody').append(row);
		});
	}else{
		$('#provider-container').hide();
	}
};

// process permissions
function processPermissions(response){
	var permissions = response.permissions;
	
	if(permissions.length > 0){
		$('#permission-loading-img').hide();
		$('#permission-table').show();
		$.each(permissions, function(index, info){
			var name = strFormat('<td>{0}</td>', info[0]);
			var threat = strFormat('<td><img src="../static/images/level{0}.gif" /></td>', info[1]);
			var desc = strFormat('<td>{0}</td>', info[2]);
            if(info[1] >= 7){
                var row = strFormat('<tr class="danger">{0}{1}{2}</tr>', name, threat, desc);
            }else{
                var row = strFormat('<tr>{0}{1}{2}</tr>', name, threat, desc);
            }
			
			
			$('#permission-table tbody').append(row);
		});
	}else{
		$('#permission-container').hide();
	}
};
	
// get interesting strings
function processStrs(response){
	var strs = response.strs;
	var apis = response.apis;
	var urls = response.urls;

	if(strs.length > 0){
		$('#str-loading-img').hide();
		$('#str-table').show();
		$.each(strs, function(index, info){
			var name = strFormat('<td>{0}</td>', info[0]);
			var desc = strFormat('<td>{0}</td>', info[1]);

			var row = strFormat('<tr>{0}{1}</tr>', name, desc);
			
			$('#str-table tbody').append(row);
		});
	}else{
		$('#str-container').hide();
	}
	
	if(apis.length > 0){
		$('#api-loading-img').hide();
		$('#api-table').show();
		$.each(apis, function(index, info){
			var name = strFormat('<td>{0}</td>', info[0]);
			var desc = strFormat('<td>{0}</td>', info[1]);
			var row = strFormat('<tr>{0}{1}</tr>', name, desc);
			
			$('#api-table tbody').append(row);
		});
	}else{
		$('#api-container').hide();
	}
	
	if(urls.length > 0){
		$('#url-loading-img').hide();
		$('#url-table').show();
		$.each(urls, function(index, info){
			var name = strFormat('<td>{0}</td>', info);
			var row = strFormat('<tr>{0}</tr>', name);
			
			$('#url-table tbody').append(row);
		});
	}else{
		$('#url-container').hide();
	}
};

// ------------------------------------ dynamic process ----------------------------
// process started services
function processStartedServices(response){
	var startedServices = response.started_services;

	if(startedServices.length > 0){
		$('#started-service-loading-img').hide();
		$('#started-service-table').show();
		$.each(startedServices, function(index, info){
			var name = strFormat('<td>{0}</td>', info);

			var row = strFormat('<tr>{0}</tr>', name);
			
			$('#started-service-table tbody').append(row);
		});
	}else{
		$('#started-service-container').hide();
	}
};


// process net operations
function processNetOperations(response){
	var netOperations = response.net_operations;

	if(netOperations.length > 0){
		$('#net-loading-img').hide();
		$('#net-table').show();
		$.each(netOperations, function(index, info){
			var type = strFormat('<td>{0}</td>', info[0]);
			var host = strFormat('<td>{0}</td>', info[1]);
			var port = strFormat('<td>{0}</td>', info[2]);
			var row = strFormat('<tr>{0}{1}{2}</tr>', type, host, port);
			$('#net-table tbody').append(row);
			if(info[3]){
				var data = strFormat('<td rowspan="1" colspan="3">{0}</td>', escape(info[3]));
				var row = strFormat('<tr>{0}</tr>', data);
				$('#net-table tbody').append(row);
			}
		});
	}else{
		$('#net-container').hide();
	}
};

// get file operations
function processFileOperations(response){
	var fileOperations = response.file_operations;

	if(fileOperations.length > 0){
		$('#file-loading-img').hide();
		$('#file-table').show();
		$.each(fileOperations, function(index, info){
			var type = strFormat('<td>{0}</td>', info[0]);
			var path = strFormat('<td>{0}</td>', info[1]);
			var row = strFormat('<tr>{0}{1}</tr>', type, path);
			$('#file-table tbody').append(row);
			if(info[2]){
				var data = strFormat('<td rowspan="1" colspan="2">{0}</td>', info[2]);
				var row = strFormat('<tr>{0}</tr>', data);
				$('#file-table tbody').append(row);
			}
		});
	}else{
		$('#file-container').hide();
	}
};

// process encryptions
function processEncryptions(response){
	var encryptions = response.encryptions;

	if(encryptions.length > 0){
		$('#encryption-loading-img').hide();
		$('#encryption-table').show();
		$.each(encryptions, function(index, info){
			var key = strFormat('<td>{0}</td>', info[0]);
			var algo = strFormat('<td>{0}</td>', info[1]);
			var type = strFormat('<td>{0}</td>', info[2]);
			var row = strFormat('<tr>{0}{1}{2}</tr>', key, algo, type);
			$('#encryption-table tbody').append(row);
			if(info[3]){
				var data = strFormat('<td rowspan="1" colspan="3">{0}</td>', info[3]);
				var row = strFormat('<tr>{0}</tr>', data);
				$('#encryption-table tbody').append(row);
			}
		});
	}else{
		$('#encryption-container').hide();
	}
};


// process data leaks
function processDataleaks(response){
	var dataleaks = response.dataleaks;

	if(dataleaks.length > 0){
		$('#dataleak-loading-img').hide();
		$('#dataleak-table').show();
		$.each(dataleaks, function(index, info){
			var type = strFormat('<td>{0}</td>', info[0]);
			var tag = strFormat('<td>{0}</td>', info[1]);
			var destination = strFormat('<td>{0}</td>', info[2]);
			var row = strFormat('<tr>{0}{1}{2}</tr>', type, tag, destination);
			$('#dataleak-table tbody').append(row);
			if(info[3]){
				var data = strFormat('<td rowspan="1" colspan="3">{0}</td>', escape(info[3]));
				var row = strFormat('<tr>{0}</tr>', data);
				$('#dataleak-table tbody').append(row);
			}
		});
	}else{
		$('#dataleak-container').hide();
	}
};


// process calls
function processCalls(response){
	var calls = response.calls;

	if(calls.length > 0){
		$('#call-loading-img').hide();
		$('#call-table').show();
		$.each(calls, function(index, info){
			var number = strFormat('<td>{0}</td>', info[0]);
			var row = strFormat('<tr>{0}</tr>', number);
			$('#call-table tbody').append(row);
		});
	}else{
		$('#call-container').hide();
	}
};

// process sms
function processTextMsgs(response){
	var textMsgs = response.textmsgs;

	if(textMsgs.length > 0){
		$('#sms-loading-img').hide();
		$('#sms-table').show();
		$.each(textMsgs, function(index, info){
			var number = strFormat('<td>{0}</td>', info[0]);
			var msg = strFormat('<td>{0}</td>', info[1]);
			var row = strFormat('<tr>{0}{1}</tr>', number, msg);
			$('#sms-table tbody').append(row);
		});
	}else{
		$('#sms-container').hide();
	}
};
