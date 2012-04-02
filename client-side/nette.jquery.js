/**
 * Client side of Nette Framework.
 *
 * Requires jQuery 1.7.0 or later.
 *
 * Copyright (c) 2004, 2012 David Grudl (http://davidgrudl.com)
 */

(function($, undefined) {

	$.nette = {
		getValue: function(elem) {
			if (!elem) {
				return undefined;

			} else if (!elem.nodeName) { // radio set
				return $(elem).filter(':checked').val();

			} else if (elem.nodeName.toLowerCase() === 'select') {
				return $(elem).val();

			} else if (elem.type === 'checkbox') {
				return elem.checked;

			} else if (elem.type === 'radio') {
				return $(elem.form.elements[elem.name]).filter(':checked').val();

			} else {
				return $.trim($(elem).val());
			}
		},


		validateControl: function(elem, rules, onlyCheck) {
			rules = rules || eval('[' + ($(elem).attr('data-nette-rules') || '') + ']');
			for (var id = 0, len = rules.length; id < len; id++) {
				var rule = rules[id], op = rule.op.match(/(~)?([^?]+)/);
				rule.neg = op[1];
				rule.op = op[2];
				rule.condition = !!rule.rules;
				var el = rule.control ? elem.form.elements[rule.control] : elem;

				var success = $.nette.validateRule(el, rule.op, rule.arg);
				if (success === null) { continue; }
				if (rule.neg) { success = !success; }

				if (rule.condition && success) {
					if (!$.nette.validateControl(elem, rule.rules, onlyCheck)) {
						return false;
					}
				} else if (!rule.condition && !success) {
					if (el.disabled) { continue; }
					if (!onlyCheck) {
						$.nette.addError(el, rule.msg.replace('%value', $.nette.getValue(el)));
					}
					return false;
				}
			}
			return true;
		},


		validateForm: function(sender) {
			var form = sender.form || sender;
			if ($(form).data('nette-submittedBy') && $($(form).data('nette-submittedBy')).prop('formnovalidate')) {
				return true;
			}
			for (var i = 0; i < form.elements.length; i++) {
				var elem = form.elements[i];
				if (!(elem.nodeName.toLowerCase() in {input:1, select:1, textarea:1}) || (elem.type in {hidden:1, submit:1, image:1, reset: 1}) || elem.disabled || elem.readonly) {
					continue;
				}
				if (!$.nette.validateControl(elem)) {
					return false;
				}
			}
			return true;
		},


		addError: function(elem, message) {
			if (elem.focus) {
				elem.focus();
			}
			if (message) {
				alert(message);
			}
		},


		validateRule: function(elem, op, arg) {
			var val = $.nette.getValue(elem);

			if (val === $(elem).attr('data-nette-empty-value')) { val = ''; }

			if (op.charAt(0) === ':') {
				op = op.substr(1);
			}
			op = op.replace('::', '_');
			op = op.replace('\\', '');
			return $.nette.validators[op] ? $.nette.validators[op](elem, arg, val) : null;
		},


		validators: {
			filled: function(elem, arg, val) {
				return val !== '' && val !== false && val !== null && val !== undefined;
			},

			valid: function(elem, arg, val) {
				return $.nette.validateControl(elem, null, true);
			},

			equal: function(elem, arg, val) {
				if (arg === undefined) {
					return null;
				}
				arg = $.isArray(arg) ? arg : [arg];
				for (var i = 0, len = arg.length; i < len; i++) {
					if (val == (arg[i].control ? $.nette.getValue(elem.form.elements[arg[i].control]) : arg[i])) {
						return true;
					}
				}
				return false;
			},

			minLength: function(elem, arg, val) {
				return val.length >= arg;
			},

			maxLength: function(elem, arg, val) {
				return val.length <= arg;
			},

			length: function(elem, arg, val) {
				arg = $.isArray(arg) ? arg : [arg, arg];
				return (arg[0] === null || val.length >= arg[0]) && (arg[1] === null || val.length <= arg[1]);
			},

			email: function(elem, arg, val) {
				return (/^[^@\s]+@[^@\s]+\.[a-z]{2,10}$/i).test(val);
			},

			url: function(elem, arg, val) {
				return (/^.+\.[a-z]{2,6}(\/.*)?$/i).test(val);
			},

			regexp: function(elem, arg, val) {
				var parts = typeof arg === 'string' ? arg.match(/^\/(.*)\/([imu]*)$/) : false;
				if (parts) { try {
					return (new RegExp(parts[1], parts[2].replace('u', ''))).test(val);
				} catch (e) {} }
			},

			pattern: function(elem, arg, val) {
				try {
					return typeof arg === 'string' ? (new RegExp('^(' + arg + ')$')).test(val) : null;
				} catch (e) {}
			},

			integer: function(elem, arg, val) {
				return (/^-?[0-9]+$/).test(val);
			},

			float: function(elem, arg, val) {
				return (/^-?[0-9]*[.,]?[0-9]+$/).test(val);
			},

			range: function(elem, arg, val) {
				return $.isArray(arg) ? ((arg[0] === null || parseFloat(val) >= arg[0]) && (arg[1] === null || parseFloat(val) <= arg[1])) : null;
			},

			submitted: function(elem, arg, val) {
				return $(elem.form).data('nette-submittedBy') === elem;
			}
		},


		toggleForm: function(form) {
			for (var i = 0; i < form.elements.length; i++) {
				if (form.elements[i].nodeName.toLowerCase() in {input:1, select:1, textarea:1, button:1}) {
					$.nette.toggleControl(form.elements[i]);
				}
			}
		},


		toggleControl: function(elem, rules, firsttime) {
			rules = rules || eval('[' + ($(elem).attr('data-nette-rules') || '') + ']');
			var has = false, __hasProp = Object.prototype.hasOwnProperty, handler = function() { $.nette.toggleForm(elem.form); };

			for (var id = 0, len = rules.length; id < len; id++) {
				var rule = rules[id], op = rule.op.match(/(~)?([^?]+)/);
				rule.neg = op[1];
				rule.op = op[2];
				rule.condition = !!rule.rules;
				if (!rule.condition) { continue; }

				var el = rule.control ? elem.form.elements[rule.control] : elem;
				var success = $.nette.validateRule(el, rule.op, rule.arg);
				if (success === null) { continue; }
				if (rule.neg) { success = !success; }

				if ($.nette.toggleControl(elem, rule.rules, firsttime) || rule.toggle) {
					has = true;
					if (firsttime) {
						if (!el.nodeName) { // radio
							for (var i = 0; i < el.length; i++) {
								$(el[i]).on('click.nette', handler);
							}
						} else if (el.nodeName.toLowerCase() === 'select') {
							$(el).on('change.nette', handler);
						} else {
							$(el).on('click.nette', handler);
						}
					}
					for (var id2 in rule.toggle || []) {
						if (__hasProp.call(rule.toggle, id2)) {
							$('#' + id2).toggle(success ? rule.toggle[id2] : !rule.toggle[id2]);
						}
					}
				}
			}
			return has;
		},


		initForm: function(form) {
			form.noValidate = true;

			$(form).on('submit.nette', function() {
				return $.nette.validateForm(form);
			});

			$(form).on('click.nette', function(e) {
				e = e || event;
				var target = e.target || e.srcElement;
				$(form).data('nette-submittedBy', (target.type in {submit:1, image:1}) ? target : null);
			});

			for (var i = 0; i < form.elements.length; i++) {
				$.nette.toggleControl(form.elements[i], null, true);
			}

			if ($.browser.msie) {
				var labels = {},
					wheelHandler = function() { return false; },
					clickHandler = function() { document.getElementById(this.htmlFor).focus(); return false; };

				for (i = 0, elms = form.getElementsByTagName('label'); i < elms.length; i++) {
					labels[elms[i].htmlFor] = elms[i];
				}

				for (i = 0, elms = form.getElementsByTagName('select'); i < elms.length; i++) {
					$(elms[i]).on('mousewheel.nette', wheelHandler); // prevents accidental change in IE
					if (labels[elms[i].htmlId]) {
						$(labels[elms[i].htmlId]).on('click.nette', clickHandler); // prevents deselect in IE 5 - 6
					}
				}
			}
		}
	};


	$(function() {
		for (var i = 0; i < document.forms.length; i++) {
			$.nette.initForm(document.forms[i]);
		}
	});

})(jQuery);
