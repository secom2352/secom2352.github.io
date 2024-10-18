export function copy_dict(_dict){
    let sdict={};
    for(const [key, value] of Object.entries(_dict)){
        sdict[key]=value;
    }
    return sdict;
}
var convert_dict={' ':'&ensp;','\n':'<br/>','<':'&lt;','>':'&gt;'};
export function convert_c(c){            //特殊文字轉換
    if(c in convert_dict)
        return convert_dict[c];
    return c;
}
export function convert_string(string){
    let box=[];
    for (let i=0;i<string.length;i++){
        box.push(convert_c(string[i]));
    }
    return box.join('');
}
var convertb_dict={};                        //這不是convert_dict的逆字典，只是要提取innerhtml用
for (let key in convert_dict){
    let v_obj=document.createElement('span');
    v_obj.innerHTML=convert_dict[key]
    convertb_dict[v_obj.innerHTML]=convert_dict[key];     //特殊文字轉正常文字
}
function convert_bc(c){
    if(c in convertb_dict)
        return convertb_dict[c];
    return c;
}

export function add_css(css_text){
    let style = document.createElement('style');
    if (style.styleSheet) {
        style.styleSheet.cssText = css_text;
    } else {
        style.appendChild(document.createTextNode(css_text));
    }
    document.getElementsByTagName('head')[0].appendChild(style);
}
let single_tag=['area','base','br','col','embed','hr',
    'img','input','link','meta','param','source','track','wbr']
export function HtmlElement(tagName,firstline,innerHTML=''){
    let doc=document.createElement('div');
    if(single_tag.includes(tagName))
        doc.innerHTML='<'+tagName+' '+firstline+' >';
    else doc.innerHTML='<'+tagName+' '+firstline+' >'+innerHTML+'</'+tagName+'>';
    return doc.firstChild;
}
export function VoidElement(length){
    return HtmlElement('span','style="display:inline-block;width:'+length+'"');
}



export function add_script(src){
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
    };
    document.head.appendChild(script);
}
export function isASCII(str) {
    return str.charCodeAt(0)<255;
}