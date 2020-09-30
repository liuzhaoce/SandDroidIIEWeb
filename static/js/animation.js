// ----------------------------- Animation --------------------
$(function(e){
	$('.navbar-nav > li > a').bind('mouseenter', function(e){
		$(this).animate({top: '-5px'}, 'normal');
	});
	
	$('.navbar-nav > li  > a').bind('mouseleave', function(e){
		$(this).animate({top: '0px'}, 'normal');
	});
});

