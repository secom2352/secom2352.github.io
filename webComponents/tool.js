//===============================================================================================字典操作
export function copyDict(_dict,exclude=[]){
    let sdict={};
    for(const [key, value] of Object.entries(_dict)){
        if(!exclude.includes(key))
            sdict[key]=value;
    }
    return sdict;
}
export function defaultDict(dict=null,default_dict=null){  //當dict!=null時，進去和出來的字典不同
  if(dict==null) dict={};
  if(default_dict==null) default_dict={};
  Object.assign(default_dict,dict);
  return default_dict;
}
export function fillMissingKeys(dict=null,keyDict=null){           //將 dict 沒有但 keyDict 有的補足
    if(dict==null) dict={};
    if(keyDict==null) keyDict={};
    for (const key in keyDict) {
        if (dict[key]==undefined) dict[key] = keyDict[key];
    }
    return dict;
}
export function fetchDict(sourceDict,keyArray){
    let _dict={};
    for(let i=0;i<keyArray.length;i++) _dict[keyArray[i]]=sourceDict[keyArray[i]];
    return _dict;
}
//===============================================================================================儲存格式轉換
//--------------------------------------------------------------- 陣列 & 字串
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
//--------------------------------------------------------------- 字典 & 字串
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
//===============================================================================================陣列操作
export function ArrayRemove(array,obj){
    let aindex=array.indexOf(obj);
    array.splice(aindex,1);
}
export function ArrayFilter(array,obj){
    return array.filter(item => item !== obj);
}
export function ArrayEqual(array1,array2){
    for(let i=0;i<array1.length;i++)
        if(array1[i]!=array2[i]) return false;
    return array1.length==array2.length;
}
export function RangeArray(start,end){
    let box=[];
    for(let i=start;i<end;i++) box.push(i);
    return box;
}
export function NumberArray(numberArrayString){   // 將 '1,2,3.5' 之類的轉為 [1,2,3.5]
    return numberArrayString.split(',').map(Number);
}
//=============================================================================================== 數學運算
export function vrotate(pos,angle){
    return [Math.cos(angle)*pos[0]-Math.sin(angle)*pos[1],Math.sin(angle)*pos[0]+Math.cos(angle)*pos[1]];
}
export function round(num, decimals=0) {
    let factor = Math.pow(10, decimals);
    return Math.round(parseFloat(num) * factor) / factor;
}

export function moreThan(a,b){
    return (b!=null && a>b);
}
export function void_function(...args){}
//=============================================================================================== 字串操作
export function styleString(style_dict){
    let style=[];
    for(const [key, value] of Object.entries(style_dict)) style.push(key+':'+value+';');
    return style.join('');
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
//=============================================================================================== html
//---------------------------------------------------------------字符轉換
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
export function isASCII(str) {
    return str.charCodeAt(0)<255;
}
//---------------------------------------------------------------header
export function add_css(css_text){
    let style = document.createElement('style');
    if (style.styleSheet) {
        style.styleSheet.cssText = css_text;
    } else {
        style.appendChild(document.createTextNode(css_text));
    }
    document.getElementsByTagName('head')[0].appendChild(style);
}
export function add_script(src){
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
    };
    document.head.appendChild(script);
}
//--------------------------------------------------------------- html元素
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
export function exitFullScreen(){
    document.exitFullscreen();
}
//--------------------------------------------------------------- html元素屬性
export function getabsrect(htmlElement){
    let rect=htmlElement.getBoundingClientRect();
    //const computedStyle = window.getComputedStyle(htmlElement);
    return [rect.left,rect.top,htmlElement.offsetWidth,htmlElement.offsetHeight];
}
export function inRect(rect,Rect){
    return rect[0]+rect[2]>Rect[0] && Rect[0]+Rect[2]>rect[0] && rect[1]+rect[3]>Rect[1] && Rect[1]+Rect[3]>rect[1];
}
//---------------------------------------------------------------檔案處理
var utf8Encode = new TextEncoder();
export function utf8encode(text){
    return utf8Encode.encode(text);
}
export function uploadFile(callback,acceptlist=null){
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
  export function uploadFolder(callback){
    let finput=document.createElement('input');
    finput.type='file';
    finput.webkitdirectory=true;
    finput.addEventListener('change', function(event) {
      callback(event.target.files);
    });
    finput.click();
  }
  export function saveFile(filename,content,ctype='bytes'){
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
