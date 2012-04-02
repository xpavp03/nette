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
			var valid = true;
			$(':input:enabled:not(:hidden, :submit, :image, :reset, [readonly])', form).each(function(){
				if (!$.nette.validateControl(this)) {
					return valid = false;
				}
			});
			return valid;
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
			$(':input', form).each(function() {
				$.nette.toggleControl(this);
			});
		},


		toggleControl: function(elem, rules) {
			rules = rules || eval('[' + ($(elem).attr('data-nette-rules') || '') + ']');
			var has = false, __hasProp = Object.prototype.hasOwnProperty;

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

				if ($.nette.toggleControl(elem, rule.rules) || rule.toggle) {
					has = true;
					for (var id2 in rule.toggle || []) {
						if (__hasProp.call(rule.toggle, id2)) {
							$('#' + id2).toggle(success ? rule.toggle[id2] : !rule.toggle[id2]);
						}
					}
				}
			}
			return has;
		}
	};


	$(document).on('submit.nette', 'form', function() {
		return $.nette.validateForm(this);
	});

	$(document).on('click.nette', ':submit, :image', function() {
		this.form && $(this.form).data('nette-submittedBy', this);
	});

	$(document).on('click.nette', 'input, textarea, button', function() {
		this.form && $.nette.toggleForm(this.form);
	});

	$(document).on('change.nette', 'select', function() {
		this.form && $.nette.toggleForm(this.form);
	});

	if ($.browser.msie) { // prevents accidental change in IE < 8
		$(document).on('mousewheel.nette', 'select', false);
	}

	$(function() {
		$('form').each(function() {
			this.noValidate = true; // disable HTML 5 validation
			$.nette.toggleForm(this);
		});
	});

})(jQuery);
