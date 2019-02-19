
const utils = require('../utils/index');

let rword = /[^, ]+/g;
let builtInStr =
    'div,list,list-item,popup,refresh,richtext,stack,swiper,tab,tab-bar,tab-context,'+
    'a,text,span,image,progress,rating,'+
    'input,option,picker,select,slider,switch,textarea,'+
    'video,canvas,web,map'; 
//label行为很怪异
let builtIn = {};
builtInStr.replace(rword, function(el) {
    builtIn[el] = el;
});


let map = Object.assign({}, builtIn);
'p,div,h1,h2,h3,h4,h5,h6,quoteblock,label'.replace(rword, function(el) {
    map[el] = 'div';
});
'b,s,code,quote,cite'.replace(rword, function(el) {
    map[el] = 'text';
});
map.button = 'input';
map['web-view'] = 'web';
module.exports = utils.createNodeName(map, 'div');