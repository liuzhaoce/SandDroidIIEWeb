// -------------------- nav components ------------
function getLeftNavTabs(){
	return $('#left-nav a');
};

function getNavHome(){
	return $('#nav-home');
};

function getNavSearch(){
	return $('#nav-search');
};

function getNavOverview(){
	return $('#nav-overview');
};

function getNavAbout(){
	return $('#nav-about');
};


// --------------------- events handler --------------------
$(function(){

	// enable form input clear
	enableInputClearOption();
	
	
	// tabs
	getLeftNavTabs().click(function(e){
		$(this).tab('show');
	});
	
	// click login on the nav-bar
	getNavLogin().bind('click', function(e){
		getDialogLogin().modal('show');
	});
	
	getDialogLogin().bind('hidden', function(e){
		clearLoginForm();
	});
	
	
	// click signup on the nav-bar
	getNavSignUp().bind('click', function(e){
		getDialogSignUp().modal('show');
	});
	
	getDialogSignUp().bind('hidden', function(e){
		clearSignUpForm();
	});
	
	
	// click login on the signup header
	getSignUpToLogin().bind('click', function(e){
		getDialogSignUp().modal('hide');
		getDialogLogin().modal('show');
	});
	
	// --------------------------- form validation start -------------------------
	// listen to the blur events of the input box on the form to check the value
	getRegistCodeInput().bind('blur', function(e){
		$(this).next('.help-block').children('ul').remove();
		var registCode = $(this).val();
		if(!isRegistCodeValid(registCode)){
			var errorInfo = strFormat('<ul role="alert"><li>{0}</li></ul>', registCodeInvalid);
			showFormErrEffect(this, errorInfo);
		}else{
			showFormSuccessEffect(this);
		}
	});
	
	getSignUpUserInput().bind('blur', function(e){
		$(this).next('.help-block').children('ul').remove();
		var userName = $(this).val();
		if(!isSignUpUserValid(userName)){
			var errorInfo = strFormat('<ul role="alert"><li>{0}</li></ul>', userNameInvalid)
			showFormErrEffect(this, errorInfo);
		}else{
			showFormSuccessEffect(this);
		}
	});
	
	getSignUpEmailInput().bind('blur', function(e){
		$(this).next('.help-block').children('ul').remove();
		var email = $(this).val();
		if(!isEmailValid(email)){
			var errorInfo = strFormat('<ul role="alert"><li>{0}</li></ul>', emailInvalid)
			showFormErrEffect(this, errorInfo);
		}else{
			showFormSuccessEffect(this);
		}
	});
	
	getSignUpPswdInput().bind('blur', function(e){
		$(this).next('.help-block').children('ul').remove();
		var pswd = $(this).val();
		if(!isPswdValid(pswd)){
			var errorInfo = strFormat('<ul role="alert"><li>{0}</li></ul>', pswdInvalid)
			showFormErrEffect(this, errorInfo);
		}else{
			showFormSuccessEffect(this);
		}
	});
	
	getSignUpPswdConfirmInput().bind('blur', function(e){
		$(this).next('.help-block').children('ul').remove();
		var pswd = getSignUpPswdInput().val();
		if(!pswd){
			getSignUpPswdInput().next('.help-block').children('ul').remove();
			var errorInfo = strFormat('<ul role="alert"><li>{0}</li></ul>', pswdNeed)
			showFormErrEffect(getSignUpPswdInput(), errorInfo);
		}else{
			var pswdToMatch = $(this).val();
			if(pswd !== pswdToMatch){
				var errorInfo = strFormat('<ul role="alert"><li>{0}</li></ul>', pswdNotMatch)
				showFormErrEffect(this, errorInfo);
			}else{
				showFormSuccessEffect(this);
			}
		}
	});
	
	
	getLoginEmailInput().bind('blur', function(e){
		$(this).next('.help-block').children('ul').remove();
		var email = $(this).val();
		if(!isEmailValid(email)){
			var errorInfo = strFormat('<ul role="alert"><li>{0}</li></ul>', emailInvalid)
			showFormErrEffect(this, errorInfo);
		}else{
			showFormSuccessEffect(this);
		}
	});
	
	getLoginPswdInput().bind('blur', function(e){
		$(this).next('.help-block').children('ul').remove();
		var pswd = $(this).val();
		if(!isPswdValid(pswd)){
			var errorInfo = strFormat('<ul role="alert"><li>{0}</li></ul>', pswdInvalid)
			showFormErrEffect(this, errorInfo);
		}else{
			showFormSuccessEffect(this);
		}
	});
	
	// --------------------------------- form validation end ----------------------------
	
	// sign up
	getSignUpBtn().bind('click', function(e){
		var validate = true;
		var registCode = getRegistCodeInput().val();
		if(!isRegistCodeValid(registCode)){
			validate = false;
		}
		var user = getSignUpUserInput().val();
		if(!isSignUpUserValid(user)){
			validate = false;
		}
		
		var email = getSignUpEmailInput().val();
		if(!isEmailValid(email)){
			validate = false;
		}
		var pswd = getSignUpPswdInput().val();
		if(!isPswdValid(pswd)){
			validate = false;
		}
		var pswdConfirm = getSignUpPswdConfirmInput().val();
		if(!getSignUpPswdInput().val()){
			validate = false;
		}else{
			if(getSignUpPswdInput().val() !== pswdConfirm){
				validate = false;	
			}
		}
		
		if(validate){
			signUp();
		}else{
			var formMsg = strFormat('<p>{0}</p>', formComplete);
			getFormSignUpMsg().append(formMsg);
		}
	});
	
	// login
	getLoginBtn().bind('click', function(e){
		var validate = true;
		var email = getLoginEmailInput().val();
		if(!isEmailValid(email)){
			validate = false;
		}
		var pswd = getLoginPswdInput().val();
		if(!isPswdValid(pswd)){
			validate = false;
		}
		if(validate){
			login();
		}else{
			var formMsg = strFormat('<p>{0}</p>', formComplete);
			getFormLoginMsg().append(formMsg);
		}
	});
	
	// logout
	getNavLogout().bind('click', function(e){
		logout();
	});
});


	