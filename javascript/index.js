/*global $ */

var json, html = "", filestoload = {};

var addToArray = function(content, item){
    
    filestoload[item] = filestoload[item] || {};
    
    for(var i in content){
        if(content.hasOwnProperty(i) && i.indexOf("." + item) > -1){

            filestoload[item][i] = filestoload[item][i] || {};
            filestoload[item][i].content = content[i].content;
        }
    }  
};

var parseJSON = function(){
    for(var i in json){
        if(json.hasOwnProperty(i)){
            
            // TODO make this more dynamic and look at the jcr:mimeType
            if(i.indexOf(".html") > -1){
                html = json[i].content;
            }
            else if(i === "css"){
                addToArray(json[i], "css");
            }
            else if(i === "javascript"){
                addToArray(json[i], "js");
            }
        }
    }
};

/**
 * Locate a tag and remove it from the content
 * @param {String} content The complete content of a file (e.g. <div>...)
 * @param {String} tagname The name of the tag you want to remove (link/script)
 * @param {String} URLIdentifier The part that identifies the URL (href/src)
 */
var locateTagAndRemove = function(content, tagname, URLIdentifier){
    var returnObject = {
        URL : [],
        content : content
    };
    var regexp;
    if (tagname === "script") {
        regexp = new RegExp('<'+tagname+'.*?'+URLIdentifier+'\\s?=\\s?["|'+'\''+']([^"]*)["|'+'\''+']>.*?</'+ tagname +'>', "gi");
    }
    else if (tagname === "link") {
        regexp = new RegExp('<'+tagname+'.*?'+URLIdentifier+'\\s?=\\s?["|'+'\''+']([^"]*)["|'+'\''+'].*/.*?/>', "gi");
    }
    var regexp_match_result = regexp.exec(content);
    while (regexp_match_result !== null) {
        returnObject.URL[returnObject.URL.length] = regexp_match_result[1]; // value of URLIdentifier attrib
        returnObject.content = returnObject.content.replace(regexp_match_result[0],""); // whole tag
        regexp_match_result = regexp.exec(content);
    }
    return returnObject;
};

var removeScriptLink = function(){
    html = locateTagAndRemove(html, "script", "src").content;
    html = locateTagAndRemove(html, "link", "href").content;
};

var getBody = function(){
    var regexp = new RegExp('<body>(.*?)<\/body>', "gim");
    var regexp_match_result = regexp.exec(html);
    if(regexp_match_result !== null){
        html = regexp_match_result[1];
    }
};

var addToContainer = function(){
    $("#loaded_container").html(html);
};


var insertTag = function(tagname, attributes, content){
    
    if(tagname === "script"){
        $.globalEval(content);
    }else{
        var head = document.getElementsByTagName('head').item(0);
        var tag = $("<" + tagname + "/>");
        tag.attr(attributes);
        if(tagname === "style" && tag[0].styleSheet){
            tag[0].styleSheet.cssText = content;
        }else{
            tag.text(content);
        }
        head.appendChild(tag[0]);
    }
};

var loadJSCSS = function(){
    for(var i in filestoload){
        if(filestoload.hasOwnProperty(i)){
            for(var j in filestoload[i]){
                if(i === "css"){
                    insertTag("style", {"type" : "text/css"}, filestoload[i][j].content);
                }
                else if (i === "js"){
                    insertTag("script", {"type" : "text/javascript"}, filestoload[i][j].content);
                }
            }
        }
    }
};

/**
 * Initialisation function `
 */
var init = function(){

    $.ajax({
        url: "json/widget.json",
        success: function(data) {
            json = $.parseJSON(data);
            
            // Parse the json structure we receive from the server into an easier to use structure
            parseJSON();

            // Remove script and link tags from the html string
            removeScriptLink();

            // Get everything in the body tag of the html
            getBody();

            // Add the html to the container
            addToContainer();

            // Load JS and CSS
            loadJSCSS();
        }
    });

    
};

init();