window.vcvAddElement(
  {"name":{"type":"string","access":"protected","value":"Column"},"category":{"type":"string","access":"protected","value":"Content"},"meta_intro":{"type":"textarea","access":"protected","value":"Short intro"},"meta_description":{"type":"textarea","access":"protected","value":"Long description"},"meta_preview_description":{"type":"textarea","access":"protected","value":"Medium preview description"},"meta_preview":{"type":"attachimage","access":"protected","value":"preview.png"},"meta_thumbnail":{"type":"attachimage","access":"protected","value":"thumbnail.png"},"meta_icon":{"type":"attachimage","access":"protected","value":"icon.png"},"background":{"type":"color","access":"public","value":"","options":{"label":"Background color"}},"size":{"type":"dropdown","access":"public","value":"auto","options":{"label":"Column width","values":[{"label":"Auto","value":"auto"},{"label":"1 : 12","value":"1-12"},{"label":"2 : 12","value":"2-12"},{"label":"3 : 12","value":"3-12"},{"label":"4 : 12","value":"4-12"},{"label":"5 : 12","value":"5-12"},{"label":"6 : 12","value":"6-12"},{"label":"7 : 12","value":"7-12"},{"label":"8 : 12","value":"8-12"},{"label":"9 : 12","value":"9-12"},{"label":"10 : 12","value":"10-12"},{"label":"11 : 12","value":"11-12"},{"label":"12 : 12","value":"12-12"}]}},"editFormTab1":{"type":"group","access":"protected","value":["background","size"],"options":{"label":"Options"}},"editFormTabs":{"type":"group","access":"protected","value":["editFormTab1"]},"containerFor":{"type":"group","access":"protected","value":["General"]},"relatedTo":{"type":"group","access":"protected","value":["Column"]},"tag":{"access":"protected","type":"string","value":"column"},"type":{"access":"protected","type":"string","value":"container"}},
  // Component callback
  function(component) {
	require( './styles.css' )
    component.add(React.createClass({
      render: function() {
        // import variables
        var {id, content, atts, editor} = this.props
var {background, size} = atts

        // import template js
        var inlineStyle = {};
if (!!background) {
  inlineStyle = {
    backgroundColor: background
  };
}

var columnClasses = 'vce-col' + ' vce-col-' + size;


        // import template
        return (<div className={columnClasses} data-vcv-dropzone="true" style={inlineStyle} {...editor}>
  {content}
</div>
);
      }
    }));
  },
  // css settings // css for element
  {},
  // javascript callback
  function(){},
  // editor js
  null
);
