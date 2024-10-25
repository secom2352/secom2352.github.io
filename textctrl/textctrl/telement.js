import {convert_c, convert_string,HtmlElement,isASCII,bdict_to_TeString, copy_dict,vrotate} from "./tool.js";

export class TElement{
    constructor(tmodel,bdict,innerHTML='',tag='span'){
        this.tmodel=tmodel;
        this.bdict=bdict;
        this.type=bdict['type'];
        let container=document.createElement(tag);
        if(innerHTML!=''){
            container.innerHTML=innerHTML;
            this.element=container.firstChild;
            this.element.style.position='relative';
            this.element.style.display='inline-block';
        }
        container.style="display:inline-block;position:relative;vertical-align:bottom;";
        //this.tmodel.displayer.appendChild(container);
        this.container=container;
        //---------------------------------------------------通用屬性
        //-------------------背景顏色
        if(bdict['bgcolor']==undefined)
            bdict['bgcolor']='transparent';
        //------------------上底線,中橫線,下底線
        this.textDecoration=[0,0,0];
        //---------------------------------------------------更新
        //this.update(bdict);    //tmodel插入元素後呼叫
        this.overlay=null;
    }
    debug(){                                               //----------------------------------偵錯模式
        this.container.style.border='1px green solid';
    }
    update(ndict=null){                                         //----------------------------------更新屬性
        if(ndict==null) ndict=this.bdict;
        if(this.element==undefined) return;
        for(let [key, value] of Object.entries(ndict)){
            let set_textDecoration=false;
            //let update_key=true;
            switch(key){
                case 'scale':
                    let scale=value.split(',');
                    this.transform('scale',[parseFloat(scale[0]),parseFloat(scale[1])]);
                    value=scale[0]+','+scale[1];
                    break;
                case 'rotate':
                    this.transform('rotate',parseInt(value));
                    break;
                case 'fontFamily':
                    this.element.style.fontFamily=value;
                    break;
                case 'B':
                    if(value) this.element.style.fontWeight='bold';
                    else this.element.style.fontWeight='normal';
                    break;
                case 'I':
                    if(value) this.element.style.fontStyle='italic';
                    else this.element.style.fontStyle='normal';
                    break;
                case 'U':
                    set_textDecoration=true;
                    if(value) this.textDecoration[2]=1;
                    else this.textDecoration[2]=0;
                    break;
                case 'S':
                    set_textDecoration=true;
                    if(value) this.textDecoration[1]=1;
                    else this.textDecoration[1]=0;
                    break;
                case 'fontSize':
                    this.element.style.fontSize=value+'px';
                    break;
                case 'color':
                    this.element.style.color=value;
                    break;
                case 'bgcolor':
                    this.element.style.backgroundColor=value;
                    if(this.overlay==null && value!='transparent') this.overlay=HtmlElement('div','position:absolute;background-color:#ADD8E6A0;top:0px;');;
                    break;
                //強制修改
                    //default:                   //不是需要的key就跳過不設定
                  //  update_key=false;
            }
            if (set_textDecoration){
                let box=[];
                for(let i=0;i<3;i++){
                    if(this.textDecoration[i]==1)
                        box.push(['overline','line-through','underline'][i]);
                }
                if(box.length==0)
                    this.element.style.textDecoration='none';
                else this.element.style.textDecoration=box.join(' ');
            }
            //if(update_key)
            this.bdict[key]=value;
        }
    }
    select(is_select){
        if(this.overlay==null && this.type!='text')
            this.overlay=HtmlElement('div','position:absolute;background-color:#ADD8E6A0;top:0px;');       //被選擇時的疊層
        if(this.overlay!=null){
            if(is_select){
                if(!this.container.contains(this.overlay))
                    this.container.appendChild(this.overlay);
                this.overlay.style.width=this.container.offsetWidth+'px';
                this.overlay.style.height=this.container.offsetHeight+'px';
            }
            else{
                if(this.container.contains(this.overlay))
                    this.container.removeChild(this.overlay);
            }
        }
        if(is_select)
            this.container.style.backgroundColor='lightblue';
        else this.container.style.backgroundColor=this.bdict['bgcolor'];
    }
    get_rect(){
        let c=this.container;
        //let rect=this.container.getBoundingClientRect();
        //let scrollTop =0;//document.documentElement.scrollTop;
        //let scrollLeft =window.pageXOffset || document.documentElement.scrollLeft;
        //console.log('座標:'+[rect.left,rect.top+scrollTop,c.offsetWidth,c.offsetHeight]);
        //return [rect.left,rect.top+scrollTop,c.offsetWidth,c.offsetHeight];
        return [c.offsetLeft,c.offsetTop,c.offsetWidth,c.offsetHeight];
    }
    get_abs_rect(){
        let rect=this.container.getBoundingClientRect();
        let scrollTop =window.pageYOffset || document.documentElement.scrollTop;
        return [rect.left,rect.top+scrollTop,this.container.offsetWidth,this.container.offsetHeight];
    }
    transform(key,value){
        //this.bdict[key]=value;
        if(key=='scale'){
            this.bdict['scale']=value[0]+','+value[1];
        }
        if(key=='rotate'){
            this.bdict['rotate']=value+'';
        }
        if(this.bdict['osize']==undefined)
            this.bdict['osize']=this.container.offsetWidth+','+this.container.offsetHeight;
        if(this.bdict['scale']==undefined)
            this.bdict['scale']=this.bdict['osize'];
        if(this.bdict['rotate']==undefined)
            this.bdict['rotate']='0';
        let osize=this.bdict['osize'].split(',');osize=[parseInt(osize[0]),parseInt(osize[1])];
        let nowsize=this.bdict['scale'].split(',');nowsize=[parseInt(nowsize[0]),parseInt(nowsize[1])];
        let max_width=this.tmodel.max_width;
        let w=nowsize[0]/osize[0];
        let h=nowsize[1]/osize[1];
        if (osize[0]*w>max_width){
            h*=max_width/osize[0];
            w=max_width/osize[0];
        }
        let r=parseInt(this.bdict['rotate']);
        let inner_obj=this.element;
        let container=this.container;
        //---------------------------------------------開始運算
        inner_obj.style.transform=`scale(${w},${h}) rotate(${r}deg)`;
        r*=-Math.PI/180;
        let pos1=[-inner_obj.offsetWidth/2,inner_obj.offsetHeight/2];
        let pos2=[-inner_obj.offsetWidth/2,-inner_obj.offsetHeight/2];
        let rpos1=vrotate(pos1,r);
        let rpos2=vrotate(pos2,r);
        let size=[Math.max(Math.abs(rpos1[0]),Math.abs(rpos2[0]))*2,Math.max(Math.abs(rpos1[1]),Math.abs(rpos2[1]))*2];
        inner_obj.style.left=(size[0]*w-inner_obj.offsetWidth)/2+'px';
        inner_obj.style.top=(size[1]*h-inner_obj.offsetHeight)/2+'px';
        container.style.width=size[0]*w+'px';
        container.style.height=size[1]*h+'px';
    }
    transformup(){}
    get_dict(){
        return this.bdict;
    }
    copy(){
        return new this.constructor(this.tmodel,copy_dict(this.bdict));
    }
    ToString(){
        return bdict_to_TeString(this.bdict);
    }
}
export class Br extends TElement{                //------------------------------------換行
    constructor(tmodel,bdict=null){
        super(tmodel,{'type':'br'},'','br');
    }
}
export class Link_space extends TElement{        //-------------------------------------行距
    constructor(tmodel,bdict){
        bdict['type']='link_space';
        super(tmodel,bdict,'<span>&ensp;</span>');
        this.container.style.width='0px';
    }
    get_rect(){
        let rect=super.get_rect();
        return [0,rect[1],5,rect[3]];
    }
}
export class Char extends TElement{           //-----------------------------------------單個文字
    constructor(tmodel,bdict){
        bdict['type']='char';
        let innerHTML=`<span>${convert_c(bdict['text'])}</span>`;
        super(tmodel,bdict,innerHTML);
        this.type='text';    //!!!bdict['type'] 與 元素type不同
        
    }
}
export class Align extends TElement{
    constructor(tmodel,bdict){
        bdict['type']='align';
        super(tmodel,bdict,'<span>&ensp;</span>');
        //this.transform('scale',[0,1]);
    }
}
//------------------------------------------------------------------------------------------------build_code參考
var text_dict={                    //--------------------------------------------文字屬性
      'type':'text',
      'fontFamily': '"Times New Roman", Times, serif',    //字型
      'fontSize':'16px',                                  //字大小
      'color':'#000000',                                  //顏色
      'bgcolor':'transparent',                                  //背景顏色
      'char':'c',                                        //文字
};
var img_dict={                    //--------------------------------------------圖片屬性
    'type':'img',
    'src':''
}
var table_dict={
    'type':'table',
    'ranks':[2,2],        //行列
    'objs':[['code1','code2'],['code1','code2']]
}
