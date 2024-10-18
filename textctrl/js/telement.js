import {convert_c, convert_string,HtmlElement,isASCII} from "./tool.js";

var class_text=['text','link','message','eps'];
export class TElement{
    constructor(tmodel,build_dict){
        this.tmodel=tmodel;
        this.bdict=build_dict;
        let tag='span';
        if(build_dict['type']=='br')
            tag='br';
        //---------------------------------------------------------------------------------------------------------包裝元素element
        let element=HtmlElement(tag,'style="display:inline-block;position:relative;"');
        //element.style.border='1px green solid';
        //---------------------------------------------------------------------------------------------------------分型態定義
        this.type=build_dict['type'];
        let telement=this;
        //if(fast_resize.includes(this.type)){
        //    element.ondblclick=function (event){
        //        tmodel.resizer.resize(telement);
        //    }
        //}
        if(this.type=='text'){
            element.innerHTML=convert_c(build_dict['char']);
            element.style.fontSize=build_dict['fontSize']+'px';
        }
        if(this.type=='eps'){
            element.innerHTML=convert_c(build_dict['char']);
            element.style.fontSize=build_dict['fontSize']+'px';
            element.style.fontFamily="新細明體";
        }
        if(this.type=='message'){
            //element.innerHTML='<div white-space="nowrap">'+convert_string(build_dict['text'])+'</div>';
            element.innerHTML=convert_string(build_dict['text']);
            element.style.fontSize=build_dict['fontSize']+'px';
            element.style.whiteSpace='nowrap';
            //element.style.textOverflow='ellipsis';
            //element.style.verticalAlign="middle";
            //element.style.overflow='hidden';
            
        }
        if(this.type=='link'){
            element.type='button';
            element.style.cursor='pointer';
            element.onclick=function (event){
                location.href=build_dict['href'];
            }
            element.innerHTML=convert_string(build_dict['linkname']);
            element.style.fontSize=build_dict['fontSize']+'px';
        }
        if(this.type=='html'){
            element.innerHTML=build_dict['code'];
            //element.style.border='1px solid';
        }
        if(this.type=='table'){
            let table=document.createElement('table');
            table.style.position='relative';
            //table.style.fontWeight='normal';
            //table.onmousedown=function (event){event.stopPropagation();}
            //table.onmousemove=function (event){event.stopPropagation();}
            //table.onmouseup=function (event){event.stopPropagation();}
            table.style.border='1px solid';
            let row=build_dict['tsize'][0];
            let col=build_dict['tsize'][1];
            this.contents=[];
            for(let i=0;i<row;i++){
                let tr=document.createElement('tr');
                tr.style.border='1px solid';
                tr.style.position='relative';
                let tr_contents=[];
                for(let j=0;j<col;j++){
                    let _th=document.createElement('th');
                    _th.style="border:1px solid;font-weight:300;position:relative;";
                    tr.appendChild(_th);
                    tr_contents.push(tmodel.new_tmodel(_th));
                }
                table.appendChild(tr);
                this.contents.push(tr_contents);
            }
            this.table=table;
            element.appendChild(table);
        }
        if(this.type=='br_space'){
            element.innerHTML='&ensp;';
            element.style.width='0px';
            element.style.fontSize=build_dict['fontSize']+'px';
            //element.style.height=Math.round(build_dict['fontSize']*4/3)+'px';
        }
        if(this.type=='image'){
            let img=document.createElement('img');
            this.src=build_dict['src'];
            img.src=build_dict['src'];
            //img.style.width=build_dict['width']+'px';
            //img.style.height=build_dict['height']+'px';
            img.style.cursor='pointer';
            element.appendChild(img);
            //element.style.verticalAlign='top';
            this.overlay=document.createElement('div');
            this.overlay.style.position='absolute';
            this.overlay.style.backgroundColor='#ADD8E6A0';
            this.overlay.style.top='0px';
        }
        //---------------------------------------------------------------------------通用屬性 <button>123</button>
        this.scale=[1,1];                                  //左右、上下拉縮
        this.deg=0;                                         //旋轉
        this.textDecoration=[0,0,0];     //上底線,中橫線,下底線
        if(this.bdict['bgcolor']==undefined)
            this.bdict['bgcolor']='transparent';

        //if(this.bdict['resize']==undefined)
        //---------------------------------------------------------------------------------------------------------
        this.element=element;
        this.mask_w=false;     //拉縮寬
        //---------------------------------------------------------------------------載入
        this.update(build_dict);
    }
    update(ndict){
        for(const [key, value] of Object.entries(ndict)){
            if(key=='scale'){
                if(this.ratio==undefined){
                    this.tmodel.element_obj.appendChild(this.element);
                    this.ratio=this.element.offsetWidth/this.element.offsetHeight;
                    this.tmodel.element_obj.removeChild(this.element);
                }
                this.resize(value.split(','));
            }
            if(class_text.includes(this.type)){
                let set_textDecoration=false;
                switch(key){
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
                        if(this.mask_w){
                            let rate=value/this.bdict['fontSize'];
                            let rect=this.get_rect();
                            this.resize([rect[2]*rate,rect[3]*rate]);
                        }
                        break;
                    case 'color':
                        this.element.style.color=value;
                        break;
                    case 'bgcolor':
                        this.element.style.backgroundColor=value;
                        if(this.mask_w){
                            let offset_x=Math.round((this.element.offsetWidth-this.mask_w)/2);
                            this.element.style.background=`linear-gradient(to right,transparent 0px,transparent ${offset_x}px,
                            ${value} ${offset_x}px,${value} ${offset_x+this.mask_w}px,transparent ${offset_x+this.mask_w}px)`;
                        }else this.element.style.backgroundColor=value;
                        break;
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
            }
            this.bdict[key]=value;
        }
    }
    select(is_select){
        if(this.type=='image'){
            if(is_select){
                if(!this.element.contains(this.overlay))
                    this.element.appendChild(this.overlay);
                this.overlay.style.width=this.element.firstChild.offsetWidth+'px';
                this.overlay.style.height=this.element.firstChild.offsetHeight+'px';
            }
            else{
                if(this.element.contains(this.overlay))
                    this.element.removeChild(this.overlay);
                //this.element.firstChild.style.filter = "grayscale(0%)";
            }
        }else if(this.type!='align'){
            if(is_select){
                if(this.mask_w){
                    let offset_x=Math.round((this.element.offsetWidth-this.mask_w)/2);
                    this.element.style.background=`linear-gradient(to right,transparent 0px,transparent ${offset_x}px,
                    lightblue ${offset_x}px,lightblue ${offset_x+this.mask_w}px,transparent ${offset_x+this.mask_w}px)`
                }else this.element.style.backgroundColor='lightblue';
                //this.element.style.border='1px #000000 solid';
            }else{
                if(this.mask_w){
                    let value=this.bdict['bgcolor'];
                    let offset_x=Math.round((this.element.offsetWidth-this.mask_w)/2);
                    this.element.style.background=`linear-gradient(to right,transparent 0px,transparent ${offset_x}px,
                    ${value} ${offset_x}px,${value} ${offset_x+this.mask_w}px,transparent ${offset_x+this.mask_w}px)`;
                }else this.element.style.backgroundColor=this.bdict['bgcolor'];
                //this.element.style.border='0px';
            }
        }
        
    }
    get_rect(){
        let c=this.element;
        if(this.type=='br_space'){
            let offset=this.bdict['fontSize']/12
            return [0,c.offsetTop,5,c.offsetHeight];
        }else if(this.type=='image'){
            let img=c.firstChild;
            return [c.offsetLeft,c.offsetTop,img.offsetWidth,img.offsetHeight];
        }else if(this.bdict['scale']){
            let scale=this.bdict['scale'].split(',');
            return [c.offsetLeft,c.offsetTop,parseInt(scale[0]),parseInt(scale[1])];
        }
        return [c.offsetLeft,c.offsetTop,c.offsetWidth,c.offsetHeight];
    }
    rotate(deg){
        this.deg=deg;
        this.element.style.transformOrigin='center';
        this.element.style.rotate=deg+'deg';
    }
    resize(size){
        let element=this.element;
        size[0]=parseInt(size[0]);
        size[1]=parseInt(size[1]);
        if(['image'].includes(this.type)){
            element=element.firstChild;
        }else if(class_text.includes(this.type)){
            if(this.ratio==undefined){
                this.ratio=element.offsetWidth/element.offsetHeight;
            }
            if(this.type=='message'){
                if(size[0]!=this.element.offsetWidth){
                    size[1]=size[0]/this.ratio;
                }else{
                    size[0]=size[1]*this.ratio;
                }
                    
            }
            element.style.textAlign = "center";
            //element.style.verticalAlign="middle";
            let fontSize=Math.round(size[1]*3/4);
            this.bdict['fontSize']=fontSize;
            element.style.fontSize=fontSize+'px';
            let new_width=size[1]*this.ratio;
            this.scale[0]=size[0]/new_width;
            //element.style.transform=`scale(${this.scale[0]},1)`;
            element.style.transform='scale('+this.scale[0]+',1)';
            //element.style.backgroundAttachment = "fixed";
            //element.style.transformOrigin = "0 0";
            this.mask_w=new_width+1;
            //--------------------------------------
            let value=this.bdict['bgcolor'];
            let offset_x=Math.round((this.element.offsetWidth-this.mask_w)/2);
            this.element.style.background=`linear-gradient(to right,transparent 0px,transparent ${offset_x}px,
            ${value} ${offset_x}px,${value} ${offset_x+this.mask_w}px,transparent ${offset_x+this.mask_w}px)`;
            //element.style.background='linear-gradient(to right, lightblue 0px, lightblue '+new_width+'px, transparent '+new_width+'px)';
            //element.style.overflow ='hidden';
        }
        element.style.width=size[0]+'px';
        element.style.height=size[1]+'px';
        this.bdict['scale']=size.join(',');
    }
    resizeup(){
        if(this.type=='eps'){
            let unit=this.tmodel.input_mode[1];
            let rect=this.get_rect();
            let w=Math.min(Math.round(rect[2]*2/unit)/2,6);
            let h=Math.min(Math.round(rect[3]/unit),6);
            if(!isASCII(this.bdict['char']))
                w=Math.round(w);
            this.resize([w*unit,h*4/3*unit]);
        }
    }
    get_dict(){
        return this.bdict;
    }
    copy(){

    }
    ToString(){
        
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
