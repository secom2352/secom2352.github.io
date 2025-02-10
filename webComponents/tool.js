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
export function Dict_to_DString(Dict){
    let box=[];
    for(const [key, value] of Object.entries(Dict)){
        box.push(key);box.push(value);
    }
    return List_to_LString(box);
}
export function DString_to_Dict(DString){
    let box=LString_to_List(DString);
    let _dict={};
    let k=0;
    while (k<box.length){
        _dict[box[k]]=box[k+1];
        k+=2;
    }
    return _dict;
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
export function HtmlElement(tagName,style='',innerHTML=''){
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
var utf8Encode = new TextEncoder();
export function utf8encode(text){
    return utf8Encode.encode(text);
}
export function ArrayEqual(array1,array2){
    for(let i=0;i<array1.length;i++)
        if(array1[i]!=array2[i]) return false;
    return array1.length==array2.length;
}

export class Path{
    constructor(path){
        this.path=path;
        let path_list=path.replace('\\','/').split('/');
        this.path_list=path_list;
        this.length=path_list.length;
        this.parent=this.get_range(0,this.length-1);
    }
    get(index){
        if(index<0) index+=this.length;
        return this.path_list[index];
    }
    get_range(index1,index2=null){
        if(index2==null) index2=this.length;
        if(index1<0) index1+=this.length;
        if(index2<0) index2+=this.length;
        return this.path_list.slice(index1,index2).join('/');
    }
}

export function void_function(...args){}

class MyDictory{
    constructor(_dict=null){
        if(_dict!=null) this._dict=_dict;
        else this._dict={};
    }
    update(_dict){
        Object.assign(this._dict,_dict);
    }
    toString(){
        return this._dict.toString();
    }
}

export function Dictory(_dict=null){
    let md=new MyDictory(_dict);
    return new Proxy(md,{
        get: (target, key,receiver) => {
            if(key in target._dict)
                return target._dict[key];
            return target[key];
          },
        set(target, prop, value) {
            target._dict[prop]=value;
          return true;
        }
    })
}

export function styleString(style_dict){
    let style=[];
    for(const [key, value] of Object.entries(style_dict)) style.push(key+':'+value+';');
    return style.join('');
}

export function ArrayRemove(array,obj){
    let aindex=array.indexOf(obj);
    array.splice(aindex,1);
}
export function ArrayFilter(array,obj){
    return array.filter(item => item !== obj);
}

export function upload_file(callback,acceptlist=null){
    //let tcontrol=this;
    let finput=document.createElement('input');
    finput.type='file';
    //--------------------accept
    if(acceptlist!=null){
      let box=[];
      for(let i=0;i<acceptlist.length;i++) box.push('.'+acceptlist[i]);
      finput.accept=box.join(',');
    }
    finput.addEventListener('change', function(event) {
        const file = event.target.files[0]; // 取得使用者上傳的檔案
        if (file) callback(file);
      });
      finput.click();
  }
  export function upload_folder(callback){
    let finput=document.createElement('input');
    finput.type='file';
    finput.webkitdirectory=true;
    finput.addEventListener('change', function(event) {
      callback(event.target.files);
    });
    finput.click();
  }
  export function save_file(filename,content,ctype='bytes'){
    if(ctype=='text'){
      let utf8Encode = new TextEncoder();
      content=utf8Encode.encode(content);
    }
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    // 釋放 URL 對象
    URL.revokeObjectURL(url);
  }
  export function html_img(src,size=null){
    let src2=src+'.png';
    if(size==null) return `<img src="./image/${src2}" draggable="false">`;
    if(size[0]==null){
      let img=document.createElement('img');
      img.src="./image/"+src2;
      document.body.appendChild(img);
      size[0]=size[1]*img.offsetWidth/img.offsetHeight;
      document.body.removeChild(img);
    }
    return `<img src="./image/${src2}" style='width:${size[0]}px;height:${size[1]}px' draggable="false">`;
  }

  export function defaultDict(dict=null,default_dict=null){
    if(dict==null) dict={};
    if(default_dict==null) default_dict={};
    Object.assign(default_dict,dict);
    return default_dict;
}

export class NowTime{
    constructor(){
        const now=new Date();
        this.year = now.getFullYear();
        this.month = String(now.getMonth() + 1).padStart(2, '0');
        this.day = String(now.getDate()).padStart(2, '0');
        this.hours = String(now.getHours()).padStart(2, '0');
        this.minutes = String(now.getMinutes()).padStart(2, '0');
        this.seconds = String(now.getSeconds()).padStart(2, '0');
    }
}

export function RangeArray(start,end){
    let box=[];
    for(let i=start;i<end;i++) box.push(i);
    return box;
}

export function exitFullScreen(){
    document.exitFullscreen();
}
export function getabsrect(htmlElement){
    let rect=htmlElement.getBoundingClientRect();
    //const computedStyle = window.getComputedStyle(htmlElement);
    return [rect.left,rect.top,htmlElement.offsetWidth,htmlElement.offsetHeight];
}

export function round(num, decimals) {
    let factor = Math.pow(10, decimals);
    return Math.round(parseFloat(num) * factor) / factor;
}

export function inRect(rect,Rect){
    return rect[0]+rect[2]>Rect[0] && Rect[0]+Rect[2]>rect[0] && rect[1]+rect[3]>Rect[1] && Rect[1]+Rect[3]>rect[1];
}
export function NumberList(numberListString){   // 將 '1,2,3' 之類的轉為 [1,2,3]
    return numberListString.split(',').map(Number);
}