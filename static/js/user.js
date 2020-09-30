var emailInvalid = 'Not a valid email address';
var registCodeInvalid = 'Not a valid registration code';
var userNameInvalid = 'Only letters, numbers and period can be used. Length between 4-32';
var pswdInvalid = 'Must be at least 8 characters';
var pswdNeed = 'Password need';
var pswdNotMatch = "Passwords don't match";

var formComplete = "Please complete the form";

var ajaxFormError = "Something wrong. Try again?";

var navManageNode = '<li> \
	    				<a href="/manage" target="_blank" id="nav-manage"><i class="icon-edit"></i> Manage</a> \
	    		  	 </li>';
var navLoginNode = '<li class="active" id="nav-login"> \
	    				<a href="#" data-toggle="tab" ><i class="icon-signin"></i> Login</a> \
	    			</li>';
var navSignUpNode =	'<li id="nav-signup" > \
						<a href="#" data-toggle="tab"><i class="icon-user-md"></i> Sign up</a> \
					</li>';
var navUserNode = '<li class="active" id="nav-user" > \
						<a href="#" data-toggle="tab"><i class="icon-android"></i> {0}</a> \
				   </li>';
var navLogoutNode = '<li id="nav-logout" > \
						<a href="#" data-toggle="tab"><i class="icon-signout"></i> Logout</a> \
				    </li>';
				    

var signUpFormValidate = 0x00000;
var signUpFormValidatePass = 0x11111;
var loginFormValidate = 0x00;
var loginFormValidatePass = 0x11;

var emailValidate = 0x00001;
var pswdValidate = 0x00010;
var registCodeValidate = 0x00100;
var userValidate = 0x01000;
var pswdConfirmValidate = 0x10000;

function getNavManage(){
	return $('#nav-manage');
};

function getNavLogin(){
	return $('#nav-login');
};

function getNavSignUp(){
	return $('#nav-signup');
};

function getNavUser(){
	return $('#nav-user');
};

function getNavLogout(){
	return $('#nav-logout');
};

function getDialogLogin(){
	return $('#dialog-login');
};

function getSignUpToLogin(){
	return $('#signup-to-login');
};

function getDialogSignUp(){
	return $('#dialog-signup');
};

// ----------- sign up form components --------------------
function getSignUpForm(){
	return $('#form-signup');
};

function getRegistCodeInput(){
	return $('#form-signup-regist-code-input');
};

function getSignUpUserInput(){
	return $('#form-signup-username-input');
};

function getSignUpEmailInput(){
	return $('#form-signup-email-input');
};

function getSignUpPswdInput(){
	return $('#form-signup-password-input');
};

function getSignUpPswdConfirmInput(){
	return $('#form-signup-password-confirm-input');
};

function getFormSignUpMsg(){
	return $('#form-signup-msg');
};

function getSignUpBtn(){
	return $('#form-signup-btn');
};

// ----------- login form components --------------------
function getLoginForm(){
	return $('#form-login');
};


function getLoginEmailInput(){
	return $('#form-login-email-input');
};

function getLoginPswdInput(){
	return $('#form-login-password-input');
};

function getFormLoginMsg(){
	return $('#form-login-msg');
};

function getLoginBtn(){
	return $('#form-login-btn');
};

// clear the login/signup form
function clearLoginForm(){
	$(':input', '#form-login')
	.val('')
	.removeAttr('checked')
	.next('.help-block').children('ul').remove();
	
	$(':input', '#form-login')
	.parent('.form-group').removeClass('has-error has-success');
	
	getFormLoginMsg().children('.alert').remove();
	
	getLoginBtn().removeClass('active');
	getLoginBtn().attr('disabled', false);	
}

function clearSignUpForm(){
	$(':input', '#form-signup')
	.val('')
	.removeAttr('checked')
	.next('.help-block').children('ul').remove();
	
	$(':input', '#form-signup')
	.parent('.form-group').removeClass('has-error has-success');
	
	getFormSignUpMsg().children('.alert').remove();
	getSignUpBtn().removeClass('active');
	getSignUpBtn().attr('disabled', false);	
}


// ------------- form input validation check start --------------------

function isSignUpUserValid(userName){
	userName = $.trim(userName); 
	var nameReg = /^[\w\.]{4,32}$/;
	return nameReg.test(userName);
};

function isRegistCodeValid(registCode){
	registCode = $.trim(registCode);
	var registCodeReg = /^[\w]{16}$/;
	return registCodeReg.test(registCode);
};


function isEmailValid(email){
	email = $.trim(email);
	var emailReg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	return emailReg.test(email);
	
};

function isPswdValid(pswd){
	pswd = $.trim(pswd);
	var pswdReg = /^.{8,}$/;
	return pswdReg.test(pswd);
	
};

function isPswdMatch(pswd, pswdToMatch){
	pswd = $.trim(pswd);
	pswdToMatch = $.trim(pswdToMatch);
	if(pswd === pswdToMatch){
		return true;
	}else{
		return false;
	}
};

// ------------- form input validation check end --------------------

function showFormErrEffect(component, errorInfo){
	$(component).parent('.form-group').removeClass('has-error has-success');
	$(component).parent('.form-group').addClass('has-error');
	$(component).next('.help-block').append(errorInfo);
};

function showFormSuccessEffect(component){
	$(component).parent('.form-group').removeClass('has-error has-success');
	$(component).parent('.form-group').addClass('has-success');
};

// ------------- change the right nav  ---------
function changeRightNavToSign(){
	getNavUser().remove();
	getNavLogout().remove();
	
	$('#right-nav').append(navLoginNode);
	$('#right-nav').append(navSignUpNode);
	
	getNavLogin().bind('click', function(e){
		getDialogLogin().modal('show');
	});
	
	getNavSignUp().bind('click', function(e){
		getDialogSignUp().modal('show');
	});
	
	$('#right-nav > li > a').bind('mouseenter', function(e){
		$(this).animate({top: '-5px'}, 'normal');
	});
	
	$('#right-nav > li  > a').bind('mouseleave', function(e){
		$(this).animate({top: '0px'}, 'normal');
	});
};

function changeRightNavToUser(userName){
	getNavLogin().remove();
	getNavSignUp().remove();
	
	navUserNode = strFormat(navUserNode, userName);
	$('#right-nav').append(navUserNode);
	$('#right-nav').append(navLogoutNode);
	
	getNavLogout().bind('click', function(e){
		logout();
	});
	
	$('#right-nav > li > a').bind('mouseenter', function(e){
		$(this).animate({top: '-5px'}, 'normal');
	});
	
	$('#right-nav > li  > a').bind('mouseleave', function(e){
		$(this).animate({top: '0px'}, 'normal');
	});
};

// ------------ show/hide the manage nav on after user login or signup -------------
function showManage(){
	$('#left-nav').append(navManageNode);
	getNavManage().bind('click', function(e){
		openManage();
	});
	
	$('#nav-manage').bind('mouseenter', function(e){
		$(this).animate({top: '-5px'}, 'normal');
	});
	
	$('#nav-manage').bind('mouseleave', function(e){
		$(this).animate({top: '0px'}, 'normal');
	});
	
	
};

function hideManage(){
	getNavManage().parent().remove();
};


// -------------- login process start ----------------------------
// login
function login(){
	getFormLoginMsg().children('.alert').remove();

	getLoginBtn().addClass('active');
	getLoginBtn().attr('disabled', true);	
	loginPost();
	
};

function loginPost(){
	$.ajax({
				url: '/auth/login',
				data: getLoginForm().serialize(),
				dataType: 'json',
				type: 'POST',
				success: loginSuccess,
				fail: loginFail
			});	
};

function loginSuccess(response){
	if(response.validated){
		getDialogLogin().modal('hide');
		var userName = response.name;
		
		changeRightNavToUser(userName);
		showManage();
		
	}else{
		var formMsg = strFormat('<div class="alert alert-danger"> {0}</div>', response.errmsg);
		getFormLoginMsg().append(formMsg);
		
		getLoginBtn().removeClass('active');
		getLoginBtn().attr('disabled', false);	
	}
};

function loginFail(response){
	var formMsg = strFormat('<div class="alert alert-danger"> {0}</div>', ajaxFormError);
	getFormLoginMsg().append(formMsg);
	
	getLoginBtn().removeClass('active');
	getLoginBtn().attr('disabled', false);	
};

//---------------- login process end ---------------------------

// -------------- sign up process start ----------------------------
function signUp(){
	getFormSignUpMsg().children('.alert').remove();

	getSignUpBtn().addClass('active');
	getSignUpBtn().attr('disabled', true);	
	signUpPost();
};

function signUpPost(){
	$.ajax({
				url: '/auth/signup',
				data: getSignUpForm().serialize(),
				dataType: 'json',
				type: 'POST',
				success: signUpSuccess,
				fail: signUpFail
			});	
};

function signUpSuccess(response){
	if(response.validated){
		getDialogSignUp().modal('hide');
		
		var userName = response.name;
		changeRightNavToUser(userName);
		showManage();
		
	}else{
		var formMsg = strFormat('<div class="alert alert-danger"> {0}</div>', response.errmsg);
		getFormSignUpMsg().append(formMsg);
		
		getSignUpBtn().removeClass('active');
		getSignUpBtn().attr('disabled', false);	
	}
};

function signUpFail(response){
	var formMsg = strFormat('<div class="alert alert-danger"> {0}</div>', ajaxFormError);
	getFormSignUpMsg().append(formMsg);
	
	getSignUpBtn().removeClass('active');
	getSignUpBtn().attr('disabled', false);
};

//---------------- signup process end ---------------------------

// ---------------- logout process start --------------------------
function logout(){
	console.log('logout');
	$.ajax({
			url: '/auth/logout',
			dataType: 'json',
			type: 'POST',
			success: logoutSuccess
		});	
};

function logoutSuccess(){
	changeRightNavToSign();
	hideManage();
}

// ---------------- logout process end ----------------------------

