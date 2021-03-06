/* global $, jQuery, dragula, location */
var TOC = [];
var columns = 2;
var gist;
var toggle_html='<span class="toggle">-</span>';

jQuery(document).ready(function() {
    
    // get url parameters
    // from http://stackoverflow.com/questions/11582512/how-to-get-url-parameters-with-javascript/11582513#11582513
    function getURLParameter(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
    }

    // let user select section heading and header tags
    var header = getURLParameter('header');
    if (!header) header = 'h1';
    var heading = getURLParameter('heading');
    if (!heading) heading = 'h2';
    
    var showonly = getURLParameter('showonly');
    if (!showonly) showonly = '';
    var columns = getURLParameter('columns');
    if (!columns) columns = 2;
    var fontsize = getURLParameter('fontsize');
    if ( fontsize ) {
        $('#wrapper').css('font-size', fontsize + '%');
    }
    var gist = getURLParameter('gist');
    var filename = getURLParameter('filename');
    if (!gist) gist = '2a06603706fd7c2eb5c93f34ed316354';
    $.ajax({
        url: 'https://api.github.com/gists/' + gist,
        type: 'GET',
        dataType: 'jsonp'
    }).success(function(gistdata) {
        var objects = [];
        if (!filename) {
            for (var file in gistdata.data.files) {
                if (gistdata.data.files.hasOwnProperty(file)) {
                    var o = gistdata.data.files[file].content;
                    if (o) {
                        objects.push(o);
                    }
                }
            }
        }
        else {
            objects.push(gistdata.data.files[filename].content);
        }
        render(objects[0]);
        render_sections();
        render_info();
        if (gist === '2a06603706fd7c2eb5c93f34ed316354') $('#header h1').attr('id', 'alexa-cheats');
    }).error(function(e) {
        console.log('Error on ajax return.');
    });

    function render(content) {
        var md = window.markdownit();
        $('#wrapper').html( md.render(content) );
        
        // handle variations, display first item
        var $html = '';
        $('li strong').each(function(){
            var items = $(this).text().split('/');
            $.each( items, function( key, value ) {
                if (key == 0){
                    $html = '<span class="variation current">' + value + '</span>';
                } else {
                    $html += '<span class="variation">' + value + '</span>';
                }
            });
            $(this).html($html);
        });
        
        // make variations clickable
        $('li strong').click(function() {
            var current = $(this).find('.variation.current');
            $(current).removeClass('current');
            if ($(current).next('.variation').length) {
                $(current).next('.variation').addClass('current');
            } else {
                $(this).find('.variation').first().addClass('current');
            }
        });
    }
    
    function columnize(columns) {
        // begin by wrapping all sections in first column
        $('#commands .section').wrapAll('<div class="column column1of' + columns + '" id="column1"/>');
        if( columns < 2 || columns > 4 ) {
            return;
        }
        for (var i=2; i <= columns; i++) {
            $('#commands').append('<div class="column column1of' + columns + '" id="column' + i + '"/>');
        }
        
        var column_counter = 1;
        
        // iterate sections
        $('#commands .section').each(function() {
            if( column_counter > 1 ) {
                // move this section to next column
                $(this).detach().appendTo('#column' + column_counter);
            }
            column_counter += 1;
            if( column_counter > columns ) {
                column_counter = 1;
            }
        });
    }
    
    function render_sections() {
        
        // header section
        $('#wrapper ' + header).each(function() {
            $(this).nextUntil(heading).andSelf().wrapAll('<section id="header"/>');
            $(this).wrapInner('<a name="header"/>');
        });
        
        // command sections
        $('#wrapper ' + heading).each(function() {
            // get content of h2
            var name = $(this).text().toLowerCase().replace(/\s/g, "-");
            name = name.replace(',', '');
            // add anchor link
            $(this).wrapInner('<a class="handle" name="' + name + '"/>');
            $(this).nextUntil(heading).andSelf().wrapAll('<div class="section" id="' + name + '"/>');
        });
        
        // wrap all command sections in new section
        $('#header').siblings().wrapAll('<section id="commands"/>');
        
        columnize(columns);
        
        // hide all other sections if showonly has been specified
        if(showonly != '') {
            $('#' + showonly).siblings().hide();
        }
        
        // make sections draggable
        dragula( $('.column').toArray(),  {
            moves: function (el, container, handle) {
                return handle.className === 'handle';
            }
        }).on('drop', function (el) {
            // update toc
            $('#toc').html( render_toc_html() );
        });
  
    }
    
    function render_info() {
        
        // render TOC
        render_toc_html();
        
        // command count
        var command_count = $('li').length;
        $('#command-count').html('Total commands: ' + command_count);
        
        // hide info
        $('#hide').click(function() {
            $('#info').toggle();
        });
        
        var url = 'https://gist.github.com/' + gist;
        $('#gist-url').html('<a href="' + url + '">' + gist + '</a>');
        
        // Add keypress to toggle info on '?' or 'h'
        $(document).keypress(function(e) {
            if(e.which == 104 || e.which == 63 || e.which == 72 || e.which == 47) {
                $('#info').toggle();
            }
        });
    }
    
    function render_toc_html() {
        var html = '';
        // iterate section classes and get id name to compose TOC
        $( '#commands .section' ).each(function() {
            var name = $( this ).attr( 'id' );
            var toggle_hidden = '';
            if ( $('#' + name).is(':hidden') ){
                toggle_hidden ='class="hidden"';
            }
            html += '<a href="#' + name + '" ' + toggle_hidden + '>';
            html += name;
            html += toggle_html;
            html += '</a>';
        });
        $('#toc').html( html );
        
        // add click event to items
        $( "#toc .toggle" ).click(function() {
            var name = $(this).parent().attr('href');
            console.log("parent name: " + name);
            console.log("parent hasclass hidden: " + $(this).parent().hasClass('hidden')  );
            // toggle hidden status
            if( $(this).parent().hasClass('hidden') ) {
                $(name).show();
                $(this).parent().removeClass('hidden');
            } else {
                $(name).hide();
            }
            render_toc_html();
        });
    }

});
