function main() {
  var o = {
    stringify: stringify,
    parse: parse
  };
  return o;
}


function stringify() {
  return JSON.stringify;
}

function parse() {
  return JSON.parse;
}


$( document ).ready(function() {
	console.log(main().stringify()({test: 'that'}));
	$( "p" ).append( "<strong>Hello</strong>" );
	
	$( "h3" ).append( "<strong>Hello</strong>" );
	
});