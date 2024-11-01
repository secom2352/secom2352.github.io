import { TElement,Image} from "./telement.js";
import { TModel } from "./tmodel.js";
import { isASCII,copy_dict, convert_string} from "./tool.js";

class EpCode extends TElement{
    constructor(tmodel,bdict){
        bdict['type']='epcode';
        let innerHTML=`<span>${convert_string(bdict['text'])}</span>`;
        super(tmodel,bdict,innerHTML);
        this.type='text';
    }
    transform(key,value){
        super.transform(key,value);
        //校正文字
        let osize=this.bdict['osize'].split(',');osize=[parseInt(osize[0]),parseInt(osize[1])];
        let nowsize=this.bdict['scale'].split(',');nowsize=[parseInt(nowsize[0]),parseInt(nowsize[1])];
        let w=nowsize[0]/osize[0];
        let h=nowsize[1]/osize[1];
        let r=parseInt(this.bdict['rotate']);
        if(w>h){
            w=h;
            this.element.style.transform=`scale(${w},${h}) rotate(${r}deg)`;
        }
    }
    transformup(){
        console.log('transform');
        let rect=this.get_rect();
        let unit=this.tmodel.ep_unit;
        let w=Math.min(Math.round(rect[2]*2/unit)/2,6);
        let h=Math.min(Math.round(rect[3]/unit),6);
        if(!isASCII(this.bdict['text']))
            w=Math.round(w);
        this.transform('scale',[w*unit,h*4/3*unit]);
    }
}
class VarImage extends Image{
    constructor(tmodel,bdict){
        super(tmodel,bdict);
        this.bdict['type']='varimage';
        this.type='varimage';
    }
    onload(){
        super.onload();
        this.element.insertAdjacentHTML('beforeend',
        `<span style="position:absolute;top:0px;left:0px;background-color:yellow;font-size:70px;">${this.bdict['key']}</span>`);
    }
}

export class CTModel extends TModel{
    constructor(tcontrol,element_obj){
        super(tcontrol,element_obj);
        Object.assign(this.TElementRegistry,{'epcode':EpCode,'varimage':VarImage});
        //this.input_funcs['epcode']=this.insert_epcode;     //將輸入的字串經過自身的模組轉入
        //this.input_mode='epcode';
        element_obj.style.width='800px';
        this.ep_unit=50;
        this.text_dict['fontSize']=this.ep_unit;
        this.input_funcs['epcode']=this.insert_epcodes;
        this.input_mode='epcode';
        this._inp.style.fontFamily="新細明體";
    }
    insert_varimage(bdict){
        let telement=new VarImage(this,bdict);
        this.insert_telement(telement);
    }
    insert_epcodes(epcodes,mdict=null){
        let bdict=this.inherit_text_dict();
        if(bdict['type']!='epcode') bdict={'fontSize':this.ep_unit,'fontFamily':"新細明體"};
        bdict=copy_dict(bdict,['scale','osize']);
        if(mdict!=null) Object.assign(bdict,mdict);
        for (let i=0;i<epcodes.length;i++){
            let build_dict=copy_dict(bdict);
            let c=epcodes[i];
            if (c=='\n')
                this.change_line();
            else{
                build_dict['text']=c;
                let fontSize=build_dict['fontSize'];
                let telement=new EpCode(this,build_dict);
                this.insert_telement(telement);
                if(isASCII(c))
                    telement.transform('scale',[fontSize/2,fontSize*4/3]);
                else telement.transform('scale',[fontSize,fontSize*4/3]);
            }
        }
    }
    insert_variable(key,mdict){
        let bdict={'fontSize':this.ep_unit,'fontFamily':"新細明體",'text':key};
        if(mdict!=null) Object.assign(bdict,mdict);
        let telement=new EpCode(this,bdict);
        this.insert_telement(telement);
        telement.transform('scale',[this.ep_unit/2*bdict['text'].length,this.ep_unit*4/3]);
    }
    to_eps_middle(){
        let format=`
        一般文字  :字
        特殊:加入[空]
            拉縮文字  :tw,h 字[空]
            對齊      :[l,c,r]
            變數(一般):kw,h [id][空]
                (條碼):bw,h [id][空]
                (QR碼):qs [id][空]
            換行      :n
            圖片      :i,w,h [url][空]    #w,h為"相對於"model寬度的變形比例
            表格      :Trow,col,bline,w1,...,wn 欄位1長 欄位1內容|欄位2長 欄位2內容[空]
        `;
        let unit=this.ep_unit;
        //--------------------
        let code_box=[];
        let bottom=0;
        for(let i=0;i<this.telements.length;i++){
            let telement=this.telements[i];
            let rect=telement.get_rect();
            //let bottom2=rect[1]+rect[3];
            //if(bottom2>bottom && bottom>0){
            //    code_box.push('n');
            //    bottom=0;
            //}else
            //bottom=bottom2;
            let _dict=telement.get_dict();
            if(_dict['type']=='epcode'){
                let rect=telement.get_rect();
                let w=Math.round(rect[2]*2/unit)/2;
                let h=Math.round(rect[3]*0.75/unit);
                if(_dict['key']!=undefined){
                    code_box.push(' k'+Math.round(w*2/_dict['text'].length)+','+h+' '+_dict['key']+' ');
                }else{
                    if(!isASCII(_dict['text'])){
                        w=Math.round(w);
                        if(w==1 && h==1){
                            if(_dict['text']!=' ')
                                code_box.push(_dict['text']);
                            else code_box.push(' '+_dict['text']);
                        }else code_box.push(' t'+w+','+h+' '+_dict['text']+' ');
                    }else{
                        if(w==0.5 && h==1){
                            if(_dict['text']!=' ')
                                code_box.push(_dict['text']);
                            else code_box.push(' '+_dict['text']);
                        }else code_box.push(' t'+Math.round(w*2)+','+h+' '+_dict['text']+' ');
                    }
                }
            }
            if(_dict['type']=='align'){
                code_box.push(' '+_dict['align'][0]);
            }
            if(['image','varimage'].includes(_dict['type'])){
                let line_width=this.displayer.offsetWidth-this.padding[0]*2;
                let w=rect[2]/line_width;
                let h=rect[3]/line_width;
                if(_dict['dsrc']==undefined) _dict['dsrc']=_dict['src'];
                if(_dict['key']!=undefined){
                    if(_dict['dtype']=='barcode')
                        code_box.push(' b'+w+','+h+' '+_dict['key']+' ');
                    else if(_dict['dtype']=='QR code')
                        code_box.push(' q'+w+','+h+' '+_dict['key']+' ');
                }else{
                    code_box.push(' i'+w+','+h+' '+_dict['dsrc']+' ');
                }
            }
            if(_dict['type']=='table'){
                code_box.push(' T'+_dict['ranks']+','+_dict['bline']);
                let ranks=_dict['ranks'].split(',');
                let col=parseInt(ranks[1]);
                for(let ck=0;ck<col;ck++){
                    let tmodel=telement.tmodels[ck];
                    code_box.push(','+(tmodel.element_obj.offsetWidth)/telement.tmodel.displayer.offsetWidth);
                }
                code_box.push(' ');
                for(let tk=0;tk<telement.tmodels.length;tk++){
                    let tcode=telement.tmodels[tk].to_eps_middle();
                    code_box.push(tcode.length+' '+tcode);
                }
                code_box.push(' ');
            }
            if(_dict['type']=='br'){
                code_box.push(' n');
                bottom=0;
            }
        }
        return code_box.join('');
    }
}
`
\T3,2,1,0.4825,0.48125 0 0 3 1230 0 0  
`