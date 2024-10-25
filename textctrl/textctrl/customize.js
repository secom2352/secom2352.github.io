import { TElement } from "./telement.js";
import { ExTModel } from "./extmodel.js";
import { isASCII,copy_dict,convert_c} from "./tool.js";

class EpCode extends TElement{
    constructor(tmodel,bdict){
        bdict['type']='epcode';
        let innerHTML=`<span>${convert_c(bdict['text'])}</span>`;
        super(tmodel,bdict,innerHTML);
        this.type='text';
    }
    transformup(){
        let rect=this.get_rect();
        let unit=this.tmodel.ep_unit;
        let w=Math.min(Math.round(rect[2]*2/unit)/2,6);
        let h=Math.min(Math.round(rect[3]/unit),6);
        if(!isASCII(this.bdict['epcode']))
            w=Math.round(w);
        this.transform('scale',[w*unit,h*4/3*unit]);
    }
}


export class CTModel extends ExTModel{
    constructor(tcontrol,element_obj){
        super(tcontrol,element_obj);
        Object.assign(this.TElementRegistry,{'epcode':EpCode});
        //this.input_funcs['epcode']=this.insert_epcode;     //將輸入的字串經過自身的模組轉入
        //this.input_mode='epcode';
        element_obj.style.width='800px';
        this.ep_unit=50;
        this.text_dict['fontSize']=this.ep_unit;
        this.input_funcs['epcode']=this.insert_epcodes;
        this.input_mode='epcode';
    }
    insert_epcodes(epcodes,mdict=null){
        let bdict=this.inherit_dict('epcode');
        if(bdict==null) bdict={'fontSize':this.ep_unit,'fontFamily':"新細明體"};
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
    to_eps_middle(){
        let format=`
        一般文字  :_字
        拉縮文字  :tw,h,字[空]
        對齊      :[l,c,r]
        變數(一般):kw,h,[id][空]
            (條碼):bw,h,[id][空]
            (QR碼):qw,h,[id][空]
        換行      :n
        圖片      :i,w,h,[url][空]    #w,h為"相對於"寬度的變形比例
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
                    code_box.push('k'+Math.round(w*2)+','+h+','+_dict['key']+' ');
                }else{
                    if(!isASCII(_dict['text'])){
                        w=Math.round(w);
                        if(w==1 && h==1){
                            code_box.push('_'+_dict['text']);
                        }else code_box.push('t'+w+','+h+','+_dict['text']+' ');
                    }else{
                        if(w==0.5 && h==1){
                            code_box.push('_'+_dict['text']);
                        }else code_box.push('t'+Math.round(w*2)+','+h+','+_dict['text']+' ');
                    }
                }
            }
            if(_dict['type']=='align'){
                code_box.push(_dict['align'][0]);
            }
            if(_dict['type']=='image'){
                if(_dict['va'])
                    code_box.push('i'+_dict['key']+'_');
                else{
                    let line_width=this.displayer.offsetWidth-this.padding[0]*2;
                    
                    //let x=(rect[0]-this.padding[0])/line_width;
                    let w=rect[2]/line_width;
                    let h=rect[3]/line_width;
                    code_box.push('i'+w+','+h+','+telement.bdict['src']+' ');
                }
            }
            if(_dict['type']=='br'){
                code_box.push('n');
                bottom=0;
            }
        }
        return code_box.join('');
    }
}