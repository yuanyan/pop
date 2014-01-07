/* ========================================================================
 * Bootstrap: transition.js v3.0.3
 * http://getbootstrap.com/javascript/#transitions
 * ========================================================================
 * Copyright 2013 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


(function ($) { 'use strict';

    // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
    // ============================================================

    function transitionEnd() {
        var el = document.createElement('pop')

        var transEndEventNames = {
            'WebkitTransition' : 'webkitTransitionEnd',
            'transition'       : 'transitionend'
        }

        for (var name in transEndEventNames) {
            if (el.style[name] !== undefined) {
                return { end: transEndEventNames[name] }
            }
        }

        return false // explicit for ie8 (  ._.)
    }

    // http://blog.alexmaccaw.com/css-transitions
    $.fn.emulateTransitionEnd = function (duration) {
        var called = false, $el = this
        $(this).one($.support.transition.end, function () { called = true })
        var callback = function () { if (!called) $($el).trigger($.support.transition.end) }
        setTimeout(callback, duration)
        return this
    }

    $(function () {
        $.support.transition = transitionEnd()
    })

})($);

(function ($) {
    'use strict';

    var Pop = function (element, options) {
        this.options   = options
        this.$element  = $(element)
        this.$backdrop =
        this.isShown   = null

        if (this.options.remote) this.$element.find('.pop-content').load(this.options.remote, $.proxy(function () {
            this.$element.trigger('loaded.pop')
        }, this))
    }

    Pop.DEFAULTS = {
        backdrop: true,
        keyboard: true,
        show: true
    }

    Pop.prototype.toggle = function (_relatedTarget) {
        return this[!this.isShown ? 'show' : 'hide'](_relatedTarget)
    }

    Pop.prototype.show = function (_relatedTarget) {
        var that = this
        var e    = $.Event('show.pop', { relatedTarget: _relatedTarget })

        this.$element.trigger(e)

        if (this.isShown || e.isDefaultPrevented()) return

        this.isShown = true

        this.escape()

        this.$element.on('click.dismiss.pop', '[data-dismiss="pop"]', $.proxy(this.hide, this))

        this.backdrop(function () {
            var transition = $.support.transition && that.options.effect

            if (!that.$element.parent().length) {
                that.$element.appendTo(document.body) // don't move pops dom position
            }

            that.$element.show()

            if (transition) {
                $(document.documentElement).addClass('pop-effect-' + that.options.effect)
                that.$element[0].offsetWidth // force reflow
            }

            that.$element
                .addClass('pop-show')
                .attr('aria-hidden', false)

            that.enforceFocus()

            var e = $.Event('shown.pop', { relatedTarget: _relatedTarget })

            transition ?
                that.$element.find('.pop-content') // wait for pop to slide in
                    .one($.support.transition.end, function () {
                        that.$element.focus().trigger(e)
                    })
                    .emulateTransitionEnd(300) :
                that.$element.focus().trigger(e)
        })
    }

    Pop.prototype.hide = function (e) {
        if (e && e.preventDefault) e.preventDefault()

        e = $.Event('hide.pop')

        this.$element.trigger(e)

        if (!this.isShown || e.isDefaultPrevented()) return

        this.isShown = false

        this.escape()

        $(document).off('focusin.pop')

        this.$element
            .removeClass('pop-show')
            .attr('aria-hidden', true)
            .off('click.dismiss.pop')

        $.support.transition && (this.options.effect) ?
            this.$element
                .one($.support.transition.end, $.proxy(this.hidePop, this))
                .emulateTransitionEnd(300) :
            this.hidePop()
    }

    Pop.prototype.enforceFocus = function () {
        $(document)
            .off('focusin.pop') // guard against infinite focus loop
            .on('focusin.pop', $.proxy(function (e) {
                if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
                    this.$element.focus()
                }
            }, this))
    }

    Pop.prototype.escape = function () {
        if (this.isShown && this.options.keyboard) {
            $(document).on('keyup.dismiss.pop', $.proxy(function (e) {
                e.which == 27 && this.hide()
            }, this))
        } else if (!this.isShown) {
            $(document).off('keyup.dismiss.pop')
        }
    }

    Pop.prototype.hidePop = function () {
        var that = this
        this.$element.hide()
        this.backdrop(function () {
            that.removeBackdrop()
            $(document.documentElement).removeClass('pop-effect-' + that.options.effect)
            that.$element.trigger('hidden.pop')
        })
    }

    Pop.prototype.removeBackdrop = function () {
        this.$backdrop && this.$backdrop.remove()
        this.$backdrop = null
    }

    Pop.prototype.backdrop = function (callback) {
        var animate = this.options.effect ? 'pop-effect-fade' : ''

        if (this.isShown && this.options.backdrop) {
            var doAnimate = $.support.transition && animate

            this.$backdrop = $('<div class="pop-backdrop ' + animate + '" />')
                .appendTo(document.body)

            this.$element.on('click.dismiss.pop', $.proxy(function (e) {
                if (e.target !== e.currentTarget) return
                this.options.backdrop == 'static'
                    ? this.$element[0].focus.call(this.$element[0])
                    : this.hide.call(this)
            }, this))

            if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

            this.$backdrop.addClass('pop-show')

            if (!callback) return

            doAnimate ?
                this.$backdrop
                    .one($.support.transition.end, callback)
                    .emulateTransitionEnd(150) :
                callback()

        } else if (!this.isShown && this.$backdrop) {
            this.$backdrop.removeClass('pop-show')

            $.support.transition && this.options.effect ?
                this.$backdrop
                    .one($.support.transition.end, callback)
                    .emulateTransitionEnd(150) :
                callback()

        } else if (callback) {
            callback()
        }
    }


    // MODAL PLUGIN DEFINITION
    // =======================

    var old = $.fn.pop

    $.fn.pop = function (option, _relatedTarget) {
        return this.each(function () {
            var $this   = $(this)
            var data    = $this.data('pop')
            var options = $.extend({}, Pop.DEFAULTS, $this.data(), typeof option == 'object' && option)

            if (!data) data = new Pop(this, options)
            if (options.cache) $this.data('pop', data)
            if (typeof option == 'string') data[option](_relatedTarget)
            else if (options.show) data.show(_relatedTarget)
        })
    }

    $.fn.pop.Constructor = Pop


    // MODAL NO CONFLICT
    // =================

    $.fn.pop.noConflict = function () {
        $.fn.pop = old
        return this
    }


    // POP DATA-API
    // ==============

    $(document).on('click.pop.data-api', '[data-toggle="pop"]', function (e) {
        var $this   = $(this)
        var href    = $this.attr('href')
        var $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) //strip for ie7
        var option  = $target.data('pop') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data())

        if ($this.is('a')) e.preventDefault()

        $target
            .pop(option, this)
            .one('hide', function () {
                $this.is(':visible') && $this.focus()
            })
    })

    $(document)
        .on('show.pop',  '.pop', function () {
            // killing the scroll on body
            $(document.documentElement).addClass('pop-open')
            $(document.body).on('touchmove.pop', function(e){
                e.preventDefault();
            })
        })
        .on('hidden.pop', '.pop', function () {
            $(document.documentElement).removeClass('pop-open')
            $(document.body).off('touchmove.pop')
        })

})($);
