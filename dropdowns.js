/**
 * Multi select script by Hakan Havutcuoglu 
 * http://www.havutcuoglu.com/ or http://www.havutcuoglu.de/
 * https://codepen.io/havutcuoglu/pen/vYNWwyZ
 * This notice MUST stay intact in JS files and SCRIPT tags for free and legal usege.
 */

$(document).ready(function(){
	var msClass = '.multi-select';
	var mcsClass = '.multi-checkbox-select';
	
	$('#sel_1').wrap('<div class="multi-checkbox-select" id="sel_1"></div>');
	$('#sel_2').wrap('<div class="multi-checkbox-select" id="sel_2"></div>');
	$('#sel_3').wrap('<div class="multi-checkbox-select" id="sel_3"></div>');
	$('#sel_4').wrap('<div class="multi-checkbox-select" id="sel_4"></div>');
	$('#sel_5').wrap('<div class="multi-checkbox-select" id="sel_5"></div>');
	$('<div class="widget-checkbox"><fieldset class="checkbox_container"><div class="options"></div></fieldset></div>').appendTo(mcsClass);
	
	// generate checkboxes
	$(msClass).find('option').each(function() {
		var isSlctd = '';
		if($(this).is(':selected')) { isSlctd = 'checked';}
		$(this).closest(mcsClass).find('fieldset .options').append('<span><input id="opt_'+$(this).attr('value')+'" type="checkbox" value="'+$(this).attr('value')+'"'+isSlctd+'><label for="opt_'+$(this).attr('value')+'">'+$(this).html()+'</label></span>');
	});
	
	// set label as legend
	$(msClass).each(function() {
		$(this).closest(mcsClass).find('fieldset').prepend('<legend>'+$(this).find('label').html()+'</legend>');
		// hide original select menu
		$(this).hide();
	});
	
	// set checked checkboxes to multi select menu equivalent
	$(mcsClass).find('.widget-checkbox input').click(function(){
		selection = $(this).attr('value');
		el = $(this).closest(mcsClass).find('select option[value="'+selection+'"]');
		console.log($(this).attr('value'));
		if(el.is(':selected')) {
			el.prop('selected',false);
		}
		else {
			el.prop('selected',true);
		}
	});
	
	// set height for checkbox equal to legend equivalent
	$(mcsClass).find('.widget-checkbox').each(function(){
		var legHight = $(this).find('legend').outerHeight();
		$(this).find('fieldset').css({
			'height': legHight
			,'min-height': legHight 
		})
		// set active class
		$(this).find('fieldset').on('mouseenter mouseleave',function(){
			$(this).toggleClass('active');
		});
	});
});