export function copy_dict(_dict,exclude=[]){
    let sdict={};
    for(const [key, value] of Object.entries(_dict)){
        if(!exclude.includes(key))
            sdict[key]=value;
    }
    return sdict;
}
export function bdict_to_TeString(bdict,length_items=null){
    if(length_items==null) length_items=['char','text'];  //裡面可能有非法字元
    let box=[];
    for(const [key, value] of Object.entries(bdict)){
        if(length_items.includes(key)) box.push(`${key}@${value.length}=${value}`);
        else box.push(`${key}=${value}`);      //value 只有純 int,string,或 '123,456,...'  之類的字串
    }
    return box.join(';');
}
export function TeString_to_bdict(TeString){
    let _dict={};
    let k=0;
    let n=TeString.length;
    while (k<n){
        let p=k;
        let key=null;
        let vlength=null;
        let value=null;
        while (k<n){
            if(TeString[k]=='@'){
                key=TeString.substring(p,k);
                p=k+1;
                while (k<n && TeString[k]!='=') k++;
                vlength=parseInt(TeString.substring(p,k));
                break;
            }
            if(TeString[k]=='='){
                key=TeString.substring(p,k);
                break;
            }
            k++;
        }
        p=k+1;
        if(vlength==null){
            while (k<n && TeString[k]!=';') k++;
        }else k=p+vlength;
        value=TeString.substring(p,k);
        if (key=='fontSize'){                       //將數值轉換
            value=parseInt(value);
        }else if('BIUS'.includes(key))
            value=parseInt(value);
        _dict[key]=value;
        k++;
    }
    return _dict;
}
export function List_to_LString(list){
    let box=[];
    for(let i=0;i<list.length;i++){
        box.push(`${list[i].length}*${list[i]}`);
    }
    return box.join('');
}
export function LString_to_List(LString){
    let k=0;let n=LString.length;
    let box=[];
    while (k<n){
        let p=k;
        k=LString.indexOf('*',p);
        let slength=parseInt(LString.substring(p,k));
        p=k+1;
        k=p+slength;
        box.push(LString.substring(p,k));
    }
    return box;
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
export function HtmlElement(tagName,style,innerHTML=''){
    let doc=document.createElement(tagName);
    if(style!='')
        doc.style=style;
    doc.innerHTML=innerHTML;
    return doc;
}
export function VoidElement(length){
    return HtmlElement('span',"display:inline-block;width:"+length);
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

export function vrotate(pos,angle){
    return [Math.cos(angle)*pos[0]-Math.sin(angle)*pos[1],Math.sin(angle)*pos[0]+Math.cos(angle)*pos[1]];
  }