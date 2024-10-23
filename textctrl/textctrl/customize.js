import { TElement } from "./telement.js";
import { ExTModel } from "./extmodel.js";
import { isASCII,copy_dict,convert_c} from "./tool.js";

class EpCode extends TElement{
    constructor(tmodel,bdict){
        bdict['type']='epcode';
        let innerHTML=`<span>${convert_c(bdict['epcode'])}</span>`;
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
                build_dict['epcode']=c;
                let fontSize=build_dict['fontSize'];
                let telement=new EpCode(this,build_dict);
                this.insert_telement(telement);
                if(isASCII(c))
                    telement.transform('scale',[fontSize/2,fontSize*4/3]);
                else telement.transform('scale',[fontSize,fontSize*4/3]);
            }
        }
    }
}