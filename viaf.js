/***
 *  Locate VIAF, PND and GND numbers in texts and urls on web pages 
 *  and fetch available corresponding names from the Toolserver. 
 ***/

var VERSION = "1.22 201205280815"; // bookmarklet version tested with Firefox 12, IE8.0, Chrome

/***
 * Copyright (c) 2011-2012 T. Gries
 *
 * licensed under the MIT and GPL and CC-BY licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * 
 * The software and documentation is licensed under
 *
 * Creative Commons Attribution 3.0 Unported License
 * CC-BY http://creativecommons.org/licenses/by/3.0/
 * MIT/X11 http://www.opensource.org/licenses/mit-license.php
 * GPL http://www.gnu.org/licenses/gpl.html
 *
 * Copyright 2011-2012
 * VIAF scripts (c) Thomas Gries
 * ANS jQuery Bookmarklet launcher (c) A Navalla Suíza 
 * (http://idc.anavallasuiza.com/project/bookmarklet/)
 *
 * 20110806	Initial version; detecting VIAF in texts
 * 20110811	color marking of VIAF number; detecting VIAF in Urls
 * 		creation of three additional links with VIAF numbers as arguments
 * 20110813	summary: an alert box shows detected distinct and sorted VIAF numbers
 * 20110814	more language specific urls; use jquery 1.6.2 from google
 *		alert box shows up to maxVIAFNumbers
 * 20110816     wrapped into a closure
 * 20110817     disabled the built-in update checker; it has set 1-day cookie
 * 		"update" for every page by mistake.
 * 20110823     changed viaf.org link composition
 * 20110824     added google link
 *              imported as a new project to svn.wikimedia.org;
 *              updated the require paths to pull required javascripts from there
 *              detection of VIAF, VIAF2 .. VIAF9
 * 20110901     moved <span> inside <a> tag to fix the non-colouring problem
 *		in span class=plainlinks; added blank spans left and right
 *              of addedlinks for LTR/RTL pages
 * 20110903     less blanks between added links
 * 20110907     calling a database to fetch names for detected VIAF numbers
 *              http://www.oclc.org/developer/ may be of help (API calls)
 *              "The OCLC Developer Network is a community of developers
 *              collaborating to propose, discuss and test OCLC Web Services.
 *              This open source, code-sharing infrastructure improves the
 *              value of OCLC data for all users by encouraging new OCLC
 *              Web Service uses."
 * 20110908     calling toolserver API to fetch all avaliable names for a VIAF
 *		the first name from the server is shown on magenta background
 *		debug parameter 0 (no debug info) .. 3 (max)
 * 20110909	POST instead of GET avoids server
 *		"Error 414: Request-URI too large" for long queries
 *		when many VIAF are found on a page
 *		debug parameter bitwise
 * 20110920	removed parent() and add the new links close after the place
 *		where the VIAF was found; jQuery 1.6.4
 * 20110924     detecting and linking PND and GND numbers as well
 *              Toolserver API adapted: names now returned for VIAF, PND, GND
 *              numbers; detected GND numbers are treated as PND
 * 20110925     summary shows VIAF, and PDN/GND numbers in a single alert box
 * 20120426	bookmarklet version 0.403
 *              also detecting relative links ../123456 This may be too greedy,
 * 20120428     but let's try that "Person als Relation"
 *              names from toolserver become links to it; 
 *              array looping problem fixed
 * 20120429     version 1.00
 *              added json2.js library because IE8 doesn't have JSON support
 *              using &thinsp; as separator; adding a check to avoid multiple
 *              runs of the script
 *              changed additional links; added pipe symbol as number separator
 * 20120501     1.06 added detection of url with "woe="
 *              1.07 using die() to unload the script after use and using attr
 *              instead of data, because data is lost when unloading jQuery
 * 20120502     1.08 removed code which eated title attribute in span tags
 * 20120503     pipe symbol may also be coded as %7C; added trigger pnd.pl?
 * 20120504     normdaten name links are now forwarded to Wikipedia-de article
 * 20120506     1.15 +title attributes in links
 * 20120508     new url BVB, new links GWP site search wikipedia
 * 20120515     bugtracker component "VIAF" created under products "Tools"
 *              https://bugzilla.wikimedia.org/enter_bug.cgi?product=Tools&component=VIAF
 * 20120517     1.17 fix bug36879
 *		1.18 fix bug36877
 *              1.19 fix bug36887
 * 20120520     1.20 fix bug36888
 *              1.21 fix bug36984
 * 20120528     1.22 fix bug36879
 ***/

// wrapper -- see http://www.mediawiki.org/wiki/JQuery
// to avoid possible conflicts with other scripts on the current page

var debug = 0;

( function ( $ ) {

/***
 *       	0	off
 *      bit0:	1	show what has been sent to server
 *      bit1:	2	show what has been received as server response
 *      bit2:	4       dump the response in a readible form
 *      bit3:	8       list the names space-separated
 *
 ***/

// whether a summary box is shown at the end
// which shows all distinct VIAF, PND/GND numbers of the current web page
// TODO user interface to enable/disable this box per cookie or other method
var showSummaryBox = false;

var showAllNames = false;

var markUrlDetectedItems = true; // if detected items in Urls will be marked
var markUrlDetectedItemsCSS = { "borderBottom" : "1px orangered dotted" };
var markNamesFromServer  = { "background":"magenta", "color":"white", "font-weight":"bold" };

// cumulative maximum of VIAF, PND, or GND numbers which are shown in the summary box
var maxNumbers = 30;

// utility functions

// our own sort order
function numSort( a, b ) {
	return (a-b);
};

/**
 *
 * function : dump( array, depth )
 *
 * source:
 * http://www.openjs.com/scripts/others/dump_function_php_print_r.php
 *
 * arguments: 	the data - array,hash(associative array),object
 *		the depth - OPTIONAL
 *
 * returns: 	the textual representation of the array
 *
 * This function was inspired by the PHP print_r function.
 *
 * This will accept some data as the argument and returns a text
 * that will be a more readable version of the array/hash/object that is given.
 *
 **/
function dump( arr, depth ) {
	var cr = "\n";
	// var cr = "<br/>";
	var dumped_text = "";
	if( !depth ) depth = 0;

	// The padding pattern given at the beginning of the line
	var depth_padding = "";
	
	for ( var j=0; j < depth+1; j++ ) {
		depth_padding += "    ";
	}

	if ( typeof( arr ) == 'object' ) { //Array/Hashes/Objects
		for ( var item in arr ) {
			var value = arr[item];

			if ( typeof( value ) == 'object' ) { //If it is an array,
				dumped_text += depth_padding + "'" + item + "' ..."+cr;
				dumped_text += dump( value, depth+1 );
			} else {
				dumped_text += depth_padding + "'" + item + "' => \"" + value + "\""+cr;
			}
		}
	} else { //Strings/Chars/Numbers etc.
		dumped_text = "===>"+arr+"<===(" + typeof( arr ) + ")";
	}
	if ( dumped_text == '' ) {
		dumped_text = "no results";
	}
	return dumped_text;
}

var viaf = Array();
var pnd = Array();
var out_js = Array();
var output = '';
var nbsp = "<span>&nbsp</span>";

// an animated "AJAX" loading wheel is shown and cleared in getPage2 when that page is processed
// for online loader spinner image generation
// http://www.google.com/search?hl=en&q=generate+animated+loading&btnG=Google+Search&aq=f&oq=
// http://www.ajaxload.info/
// http://preloaders.net/
// for base64 online encoder http://www.motobit.com/util/base64-decoder-encoder.asp
// for inline images http://www.elf.org/essay/inline-image.html

function numberToNames( items ) {

	if ( items.length == 0 ) return;

	// viaf-spinner-rotating-arrows-cyan-80px
	var $spinner = $( '<img src="data:image/x-icon;base64,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">' );

	$( $spinner )
		.css( {
			"position":"fixed",
			"top":"50%",
			"left":"50%",
			"display":"none"
		} )
		.attr( "id", "spinner" );

	$( "body" ).append( $spinner );
	$( "#spinner" ).fadeIn(1000);

	var items_str = JSON.stringify( items );
	if ( debug & 1 ) output = "sent to server:\n"+items_str;

	/***
	 *      get names via Greasemonkey_xmlhttpRequest across domain borders
	 *
	 *      example usages using "GET" requests
	 *
	 *      example 1 request shows several viaf numbers for the same persons
	 *      http://toolserver.org/~apper/pd/x.php?format=json&data=name&for=[{"viaf":["15571981"]},{"viaf":["79410188"]},{"viaf":["2878675"]},{"viaf":["122255788"]}]
	 *
	 *      example 2 request and response shows mixed viaf and pnd number for one person
	 *      http://toolserver.org/~apper/pd/x.php?format=json&data=name&for=[{"viaf":["30359946"]},{"pnd":["120155567"]}]
	 *
	 *      example 2 JSON response:
	 *      [{"viaf":["30359946"],"names":[{"lang":"de","name":"Sabine Ludwig"}]},{"pnd":["120155567"],"names":[{"lang":"de","name":"Sabine Ludwig"}]}]
	 *
	 *      example 2 response in array notation as produced by the enclosed dump() function:
	 *      '0' ...
	 *         'viaf' ...
	 *            '0' => "30359946"
	 *         'names' ...
	 *            '0' ...
	 *               'lang' => "de"
	 *               'name' => "Sabine Ludwig"
	 *      '1' ...
	 *         'pnd' ...
	 *            '0' => "120155567"
	 *         'names' ...
	 *            '0' ...
	 *               'lang' => "de"
	 *               'name' => "Sabine Ludwig"
	 *
	 ***/

       	$.ajax({
 		type: "GET",
		url: "//toolserver.org/~apper/pd/x.php",
     		data: "callback=?&format=json&data=name&for="+items_str,
		dataType: "jsonp",
     		success: function(data, textStatus, xhr) {
			$( "#spinner" ).hide();
                       	cb_updateFromServer(data);
		}
	});

}

// callback function
function cb_updateFromServer( data_js ){
	if ( debug & 2 ) output += "\n\nreceived from server:\n"+ data;
	// var data_js = JSON.parse( data );
	if ( debug & 4 ) output += dump( data_js );

	var names,numType,number;

	// for all returned viaf and pnd numbers do
	for ( record_nr in data_js ) {
	
		// get the first viaf or pnd number per record,
		// as this was the one which was found on the web page.
		//
		// All occurences in the web page are already
		// marked as class "viaf-<viafnr>" or "pnd-<pndnr>"
		// when coming back here.
		//
		// The server may return more numbers for a person than were
		// sent, because there are authors which have more than
		// one viaf or pnd number in the database (i.e. doublures).

		switch ( true ) {
	        case ( typeof data_js[record_nr]['viaf'] != "undefined" ):
			numType = "viaf";
			number = data_js[record_nr]['viaf'][0];
			break;
		case ( typeof data_js[record_nr]['pnd'] != "undefined" ):
			numType = "pnd";
			number = data_js[record_nr]['pnd'][0];
			break;
		default:
			numType = "";
			number = -1;
		}

		names = "";
		if ( typeof data_js[record_nr]['names'] != "undefined" ) {

			// for all available names for that number do
			for ( name_j in data_js[record_nr]['names'] ) {
		        	names += data_js[record_nr]['names'][name_j]['name']+" ";
			}

			// replace the class "viaf-<viafnr>" or "pnd-<pndnr>"
			// with all names string or with the first name only
			var nameString = ( showAllNames ) ? names : data_js[record_nr]['names'][0]['name'];

			$("."+numType+"-" + number )
				.text( " " + nameString + " " )
				.css( markNamesFromServer )
				.after( nbsp )
				.before( nbsp )
				.wrap( '<a href="//toolserver.org/~apper/pd/person/'+numType+'-redirect/de/'+number+'#normdaten" title="de.Wikipedia Normdaten"></a>' );
		
 		}

	}

	if ( ( debug & 8 ) && ( names.length > 0 ) ) {
		output += "\n\n" + names;
	}
	if ( debug & (8+2+1) ) {
		alert( output );
	}

}


function doAnyOtherBusiness( numberType, number ) {

	// add the element only if it does not exist in list
	if ( numberType == "viaf" ) {
		if ( viaf.indexOf( number ) == -1 ) {
			viaf.push( number );
			out_js.push( { "viaf" : [number] } );
		}
	} else {
		if ( pnd.indexOf( number ) == -1 ) {
			pnd.push( number );
			out_js.push( { "pnd" : [number] } );
		}
	}
}

// PASS 0
// check, if page was previously modified in another run and return early
if ( $(document).attr("viaf-done") == VERSION ) {
	alert("VIAF script version "+VERSION+":\n\nINFO -- Nothing to do. This page has already been processed.");
	return;
} else {
	$(document).attr("viaf-done",VERSION);
}

// PASS 1
// try to retrieve as much viaf numbers from text as possible
// but don't look in an active textareas like mediawiki input textarea

// http://stackoverflow.com/questions/3629183/why-doesnt-indexof-work-on-an-array-ie8
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(elt /*, from*/) {
    var len = this.length >>> 0;
    var from = Number(arguments[1]) || 0;
    from = (from < 0) ? Math.ceil(from) : Math.floor(from);
    if (from < 0) {
      from += len;
    }

    for (; from < len; from++) {
      if (from in this && this[from] === elt) {
        return from;
      }
    }
    return -1;
  };
}

$("body,*:not(textarea)")
	.replaceText( /(viaf[1-9]?)\s*(-|%2D|:|\/|%2B|%3A|%2F|\s|ID:|=|%3D|\||%7C)+\s*(\d{5,})/gi, "<span class='viaf viaf-in-text' viaf='$3'>$1$2$3</span>" )
	.replaceText( /([pg]nd[1-9x-]?|dnb)\s*(-|%2D|:|\/|%2B|%3A|%2F|\s|ID:|=|%3D|\||%7C)+\s*([0-9-]{5,}x?)/gi, function( s0, s1, s2, s3 ){
		s3 = s3.toUpperCase();
		return "<span class='pnd pnd-in-text' pnd='" + s3 + "'>" + s1 + s2 + s3 + "</span>";
	});


// PASS 2
// try to retrieve viaf or pnd or gnd numbers from urls
	
$("a").each(function(){
	var $this = $(this);
	if ( $this.find(".viaf").length != 0 ) return; // in PASS 2, skip all entries which have this attribute from PASS 1
	if ( $this.find(".pnd").length != 0 ) return; // in PASS 2, skip all entries which have this attribute from PASS 1
	var url = $this.attr("href");
	/* VIAF */
	var magicUrlRegExp = new RegExp( /(\.\.[\/-]\d{5,}|http:\/\/viaf\.org\/(viaf\/)?(\d{5,})|http:\/\/.+\.librarything.de\/commonknowledge\/search.php?f=13&exact=1&q=VIAF%3A\d{5,}|identities\/viaf-\d{5,})/gi);
	if ( typeof url != "undefined" && url.match( magicUrlRegExp ) ) {
	        if ( markUrlDetectedItems ) $this.css( markUrlDetectedItemsCSS );
	        var viaf = RegExp.$1.match( /\d{5,}/i );
		$this.after( $("<span class='viaf viaf-in-url' viaf='"+viaf+"'>&nbsp;"+viaf+"</span>") );
	};

	/* PND, GND */
	// var magicUrlRegExp = new RegExp( /(http:\/\/d-nb.info\/([gp]nd\/)?[\dx-]+|pnd=[\dx-]+|pnd\/[\dx-]+)/gi );
	var magicUrlRegExp = new RegExp( /(([gp]nd.{0,30}|woe)(-|%2D|\?|:|=|\/|%7C|%2B|%3A|%2F|\s|%3D|\||id:|id=|)[\dx-]{5,})/gi );
	if ( typeof url != "undefined" && url.match( magicUrlRegExp ) ) {
	        if ( markUrlDetectedItems ) $this.css( markUrlDetectedItemsCSS );
	        var pnd = RegExp.$1.match( /\d+[\dx-]{4,}/i );
		$this.after( $("<span class='pnd pnd-in-url' pnd='"+pnd+"'>&nbsp;"+pnd+"</span>") );
	};

});

// PASS 3
// add additional predefined target links
// after the place where VIAF numbers were detected

$(".viaf").each(function(){
	var $this = $(this);

	var viaf = $this.attr( "viaf" );
    	var newLink = new Array();
	newLink.unshift( $( "<span>&thinsp;</span><a href='http://viaf.org/viaf/"+viaf+"/#VIAF' title='VIAF.org'><span class='addedlink viaf' viaf='"+viaf+"#VIAF'>VIAF</span></a>" ) );
    	newLink.unshift( $( "<span>&thinsp;</span><a href='http://www.librarything.de/commonknowledge/search.php?f=13&exact=0&q=%3A"+viaf+"#VIAF' title='LibraryThing (Deutsch)'><span class='addedlink viaf' viaf='"+viaf+"'>LT de</span></a>" ) );
	newLink.unshift( $( "<span>&thinsp;</span><a href='http://www.librarything.com/commonknowledge/search.php?f=13&exact=0&q=%3A"+viaf+"#VIAF' title='LibraryThing (English)'><span class='addedlink viaf' viaf='"+viaf+"'>en</span></a>" ) );
	newLink.unshift( $( "<span>&thinsp;</span><a href='http://ru.librarything.com/commonknowledge/search.php?f=13&exact=0&q=%3A"+viaf+"#VIAF' title='LibraryThing (по русский)'><span class='addedlink viaf' viaf='"+viaf+"'>ru</span></a>" ) );
	newLink.unshift( $( "<span>&thinsp;</span><a href='http://epo.librarything.com/commonknowledge/search.php?f=13&exact=0&q=%3A"+viaf+"#VIAF' title='LibraryThing-o (esperantlingve)'><span class='addedlink viaf' viaf='"+viaf+"'>epo</span></a>" ) );
	newLink.unshift( $( "<span>&thinsp;</span><a href='http://orlabs.oclc.org/identities/viaf-"+viaf+"#VIAF' title='orlabs candidate'><span class='addedlink viaf' viaf='"+viaf+"'>orlabs</span></a>" ) );
	newLink.unshift( $( "<span>&thinsp;</span><a href='//toolserver.org/%7Eapper/pd/person/viaf/"+viaf+"#VIAF' title='toolserver.org VIAF link'><span class='addedlink viaf' viaf='"+viaf+"'>TS</span></a>" ) );
	newLink.unshift( $( "<span>&thinsp;</span><a href='https://encrypted.google.com/search?ie=utf-8&oe=utf-8&num=100&lt=1&q=vIAf+AND+\""+viaf+"\"&spell=0' title='Google VIAF search'><span class='addedlink viaf' viaf='"+viaf+"'>G</span></a>" ) );
	newLink.unshift( $( "<span>&thinsp;</span><a href='https://encrypted.google.com/search?ie=utf-8&oe=utf-8&num=100&lt=1&q=site:wikipedia.org+vIAf+AND+\""+viaf+"\"&spell=0' title='Google VIAF search'><span class='addedlink viaf' viaf='"+viaf+"'>GWP</span></a>" ) );
	// newLink.unshift( $( "<span>&thinsp;</span><label class='show-summary'><input type='checkbox' class='show-summary-checkbox' checked='checked'><span id='show-summary-text'></span></label>" ) );

	// add a placeholder and a class for this specific viaf for the name texts
	// which come per xhr callback handler cb_updateFromServer
	newLink.unshift( $( "<span class='viaf-"+viaf+"'></span>" ) );
	for ( var i = 0; i < newLink.length; i += 1 ) {
		$this.after( newLink[i] );
	}

    	doAnyOtherBusiness( "viaf", viaf );
});

$(".pnd").each(function(){
	var $this = $(this);

	var pnd = $this.attr( "pnd" );
    	var newLink = new Array();
	newLink.unshift( $( "<span>&thinsp;</span><a href='http://d-nb.info/gnd/"+pnd+"/#PND' title='Deutsche Nationalbibliothek'><span class='addedlink pnd' pnd='"+pnd+"#PND'>DNB</span></a>" ) );
	newLink.unshift( $( "<span>&thinsp;</span><a href='https://opacplus.bib-bvb.de/TouchPoint_touchpoint/search.do?methodToCall=quickSearch&Kateg=100&Content=\""+pnd+"\"#PND' title='Bibliotheksverbund Bayern'><span class='addedlink pnd' pnd='"+pnd+"'>BVB</span></a>" ) );
    	newLink.unshift( $( "<span>&thinsp;</span><a href='http://www.librarything.de/commonknowledge/search.php?f=13&exact=0&q=%3A"+pnd+"#PND' title='LibraryThing (Deutsch)'><span class='addedlink pnd' pnd='"+pnd+"'>LT de</span></a>" ) );
	newLink.unshift( $( "<span>&thinsp;</span><a href='http://www.librarything.com/commonknowledge/search.php?f=13&exact=0&q=%3A"+pnd+"#PND' title='LibraryThing (English)'><span class='addedlink pnd' pnd='"+pnd+"'>en</span></a>" ) );
	newLink.unshift( $( "<span>&thinsp;</span><a href='http://ru.librarything.com/commonknowledge/search.php?f=13&exact=0&q=%3A"+pnd+"#PND' title='LibraryThing (по русский)'><span class='addedlink pnd' pnd='"+pnd+"'>ru</span></a>" ) );
	newLink.unshift( $( "<span>&thinsp;</span><a href='http://epo.librarything.com/commonknowledge/search.php?f=13&exact=0&q=%3A"+pnd+"#PND' title='LibraryThing-o (esperantlingve)'><span class='addedlink pnd' pnd='"+pnd+"'>epo</span></a>" ) );
	newLink.unshift( $( "<span>&thinsp;</span><a href='//toolserver.org/~apper/pd/person/pnd/"+pnd+"#PND' title='toolserver.org PND/GND link'><span class='addedlink pnd' pnd='"+pnd+"'>TS</span></a>" ) );
	newLink.unshift( $( "<span>&thinsp;</span><a href='https://encrypted.google.com/search?ie=utf-8&oe=utf-8&num=100&lt=1&q=(gNd+OR+pNd+OR+gKd+OR+sWd)+AND+\""+pnd+"\"&spell=0' title='Google PND/GND search'><span class='addedlink pnd' pnd='"+viaf+"'>G</span></a>" ) );
	newLink.unshift( $( "<span>&thinsp;</span><a href='https://encrypted.google.com/search?ie=utf-8&oe=utf-8&num=100&lt=1&q=site:wikipedia.org+(gNd+OR+pNd+OR+gKd+OR+sWd)+AND+\""+pnd+"\"&spell=0' title='Google PND/GND search'><span class='addedlink pnd' pnd='"+viaf+"'>GWP</span></a>" ) );
	// newLink.unshift( $( "<span>&thinsp;</span><label class='show-summary'><input type='checkbox' class='show-summary-checkbox' checked='checked'><span id='show-summary-text'></span></label>" ) );

	// add a placeholder and a class for this specific pnd for the name texts
	// which come per xhr callback handler cb_updateFromServer
	newLink.unshift( $( "<span class='pnd-"+pnd+"'></span>" ) );
	for ( var i = 0; i < newLink.length; i += 1 ) {
		$this.after( newLink[i] );
	}

    	doAnyOtherBusiness( "pnd", pnd );
});

// style all detected numbers
$( ".viaf" ).css( { "background":"cyan", "color":"black" } );
$( ".pnd" ).css( { "background":"cyan", "color":"black" } );

// style all detected numbers in urls
$( ".viaf-in-url" ).css( "border-bottom", "1px dotted black" );
$( ".pnd-in-url" ).css( "border-bottom", "1px dotted black" );

// style all checkboxes
$( ".show-summary-checkbox" )
	.click(function(e){
	        $this=$(this);
	        if ( $this.attr("checked")=='checked' ) {
   			$( ".show-summary-checkbox" ).attr("checked", true);
		} else {
   			$( ".show-summary-checkbox" ).removeAttr("checked");
		}
	});

// style all added links
$( ".addedlink" ).css( { "background":"yellow" , "color":"black" } );

numberToNames( out_js );

// show a summary of the collected numbers
if ( viaf.length > 0 ) {

	viaf.sort( numSort );
	var x = "";
	for ( var i=0; i < Math.min( viaf.length, maxNumbers ) ; i++ ) {
		x += viaf[i]+"\n";
	}

	if ( viaf.length > maxNumbers ) x += "...\n("+maxNumbers+" of "+viaf.length+" distinct numbers are shown.)";
	var pluralS = ( viaf.length > 1 ) ? "s" : "";
        var viafSummary = "The present page contains "+viaf.length+" distinct VIAF number"+pluralS+" in text or links.\nModify the script if you want to remove the alert box permanently.\n\n"+x ;

	// comment the following line if you don't want to see the summary (alert) box
	// if ( showSummaryBox ) {
	//	alert( viafSummary );
	// }

}
// show a summary of the collected numbers
if ( pnd.length > 0 ) {

	pnd.sort( numSort );
	var x = "";
	for ( var i=0; i < Math.min( pnd.length, maxNumbers ) ; i++ ) {
		x += pnd[i]+"\n";
	}

	if ( pnd.length > maxNumbers ) x += "...\n("+maxNumbers+" of "+pnd.length+" distinct numbers are shown.)";
	var pluralS = ( pnd.length > 1 ) ? "s" : "";
	var pndSummary = "The present page contains "+pnd.length+" distinct PND number"+pluralS+" in text or links.\n\n"+x;

	// comment the following line if you don't want to see the summary (alert) box
	if ( showSummaryBox ) {
		alert( viafSummary + "\n" + pndSummary );
	}

}

}) ( jQuery );
