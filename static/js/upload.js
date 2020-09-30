// ------------------ upload -----------------------
function getUploadBtn(){
	return $('#upload-btn');
};

$(function(){
	var dataObj = null;
	var maxFileSize = 50 * 1000 * 1000;
    var acceptFileTypes = /(\.)(apk|zip|tar(\.gz)?)$/i;
    
	getUploadBtn().bind('click', function(event){
		if(dataObj){
			dataObj.submit();
		}
		$(this).addClass('active').attr('disabled', true);
	});
	
	$("#fileupload").fileupload( {
	 	url:"/upload",
	 	
	 	dataType: 'json',

	    add: function (e, data) {
	    	var file = data.files[0];
	    	var fileSize = file.size;
	    	var fileName = file.name;
	    	var uploadInfo = '';
	    	
	    	// remove css
	    	$('#upload-info .alert').remove();
	    	$('#upload-progress #upload-bar').css(
	            'width',
	   			0
	        );
	        
	    	if(fileSize > maxFileSize){
	    		uploadInfo = strFormat('{0} exceeds max file size!', fileName);
        		$('#upload-info').append(strFormat('<div class="alert alert-danger">{0}</div>', uploadInfo));
	    	}else if(!acceptFileTypes.test(fileName)){
	    		uploadInfo = strFormat('{0} file type invalid!', fileName);
        		$('#upload-info').append(strFormat('<div class="alert alert-danger">{0}</div>', uploadInfo));
	    	}else{
	    		getUploadBtn().removeClass('active').attr('disabled', false);
	    		dataObj = data;
	    	}
	    	console.log(data);
        },
        
        done: function (e, data) {
        	$('#upload-btn').removeClass('active');
        	
        	var fileName = data.files[0].name;
        	var responseJson = data.jqXHR.responseJSON;
        	
        	var uploadInfo = '';
        	var success = responseJson.success;
        	if(success){
        		uploadInfo = strFormat('{0} uploaded!', fileName);
        		$('#upload-info').append(strFormat('<div class="alert alert-success">{0}</div>', uploadInfo));
        	}else{
        		uploadInfo = strFormat('{0} fail to upload! {1}!', fileName, responseJson.msg);
        		$('#upload-info').append(strFormat('<div class="alert alert-danger">{0}</div>', uploadInfo));
        	}
        },
        
	    progressall: function (e, data) {
	        var progress = parseInt(data.loaded / data.total * 100, 10);
	        $('#upload-progress #upload-bar').css(
	            'width',
	   			progress + '%'
	        );
    	}
	 });
	
});
