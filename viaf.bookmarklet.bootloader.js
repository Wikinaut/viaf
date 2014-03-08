/*
 * This is the unminified bootloader code for the viaf bookmarklet.
 * It includes the minified version for your convenience.
 *
 * ANS jQuery Bookmarklet launcher (v.3.0)
 * loads and executes viaf.bookmarklet.js
 *
 * A navalla suíza (http://idc.anavallasuiza.com/project/bookmarklet/)
 * Released under the Creative Commons Attribution 3.0 Unported License,
 * as defined here: http://creativecommons.org/licenses/by/3.0/
 *
 * Embedded in viaf.bookmarklet.js is viaf.min.js the minified version of viaf.js
 * Locates VIAF, PND and GND numbers in texts and urls on web pages 
 * and fetch available corresponding names from the Toolserver. 
 *
 * Copyright (c) 2011-2012 T. Gries
 *
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 *
 * This is the unminified bootloader code for the viaf bookmarklet.
 * In the following lines you find the minified version of it for your convenience.
 * Created with http://www.minifyjs.com/javascript-compressor/
 *
 * On your web page you can add the minified bootloader code in a link like in this example:
 * <a href="javascript:(function(b){if(window.bookmarklet==undefined||window.bookmarklet.executeMyBookmarklet==undefined){var s=document.createElement('script');s.type='text/javascript';s.src=b+'?'+Math.floor(Math.random()*99999);if(!document.attachEvent){s.onload=function(){window.bookmarklet.executeMyBookmarklet()}}else{s.onreadystatechange=function(){if(s.readyState=='complete'||s.readyState=='loaded'){window.bookmarklet.executeMyBookmarklet();s.onreadystatechange=null}}}document.body.appendChild(s)}else{window.bookmarklet.executeMyBookmarklet()}})('http://svn.wikimedia.org/svnroot/mediawiki/trunk/tools/viaf/viaf.bookmarklet.js');void%200;">VIAF bookmarklet</a>
 *
 * or create a bookmark in your browser with the minified bootloader code:
 * javascript:(function(b){if(window.bookmarklet==undefined||window.bookmarklet.executeMyBookmarklet==undefined){var s=document.createElement('script');s.type='text/javascript';s.src=b+'?'+Math.floor(Math.random()*99999);if(!document.attachEvent){s.onload=function(){window.bookmarklet.executeMyBookmarklet()}}else{s.onreadystatechange=function(){if(s.readyState=='complete'||s.readyState=='loaded'){window.bookmarklet.executeMyBookmarklet();s.onreadystatechange=null}}}document.body.appendChild(s)}else{window.bookmarklet.executeMyBookmarklet()}})('http://svn.wikimedia.org/svnroot/mediawiki/trunk/tools/viaf/viaf.bookmarklet.js');void%200;
 *
 */

javascript:(function (b){
	if (window.bookmarklet == undefined || window.bookmarklet.executeMyBookmarklet == undefined) {
		var s = document.createElement('script');
		s.type = 'text/javascript';
		s.src = b+'?'+Math.floor(Math.random()*99999);
		if (!document.attachEvent) {
			s.onload = function () {
				window.bookmarklet.executeMyBookmarklet();
			}
		} else {
			s.onreadystatechange = function () {
				if (s.readyState == 'complete' || s.readyState == 'loaded') {
					window.bookmarklet.executeMyBookmarklet();
					s.onreadystatechange = null;
				}
			}
		}
		document.body.appendChild(s);
	} else {
		window.bookmarklet.executeMyBookmarklet();
	}
}('http://svn.wikimedia.org/svnroot/mediawiki/trunk/tools/viaf/viaf.bookmarklet.js');
void 0;
