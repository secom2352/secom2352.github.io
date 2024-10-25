//import { ExTModel } from "./extmodel.js";
import { CTModel } from "./customize.js";
import { Resizer,CustomMenu,SelectionBox} from "./auxiliary.js";


export class TControl{
    constructor(element_obj,model_class){
        this.model_class=model_class;                         //---------預設模型類別
        this.element_obj=element_obj;
        this.reset(new model_class(this,this.element_obj));
        //--------------------------------------被複製的物件
        this.copy_tmstring='';
        this.copy_string='';
        this.zoom_rate=1;
        //--------------------------------------
        this.resizer=new Resizer(this);
        this.customMenu=new CustomMenu(this);
        this.selectionbox=new SelectionBox(this);
    }
    reset(tmodel){
        this.tmodel=tmodel;        //目前focus的tmodel
        this.focuslock=true;          //當一個物件被點擊後，鎖定
        this.mtmodel=this.tmodel;
    }
    debug(){
        this.tmodel.debug();
    }
    zoom(zoom){         //--------------------------------縮放
        this.mtmodel.element_obj.style.transform=`scale(${zoom},${zoom})`;
        this.zoom_rate=zoom;
    }
    NewTModel(element_obj){
        return new this.model_class(this,element_obj);
    }
    focus(tmodel){
        if(!this.focuslock){
            this.tmodel.unfocus();
            this.resizer.close();
            this.customMenu.hide();
            this.selectionbox.hide();
            this.tmodel=tmodel;
            this.focuslock=true;
            return true;
        }
        return false;
    }
    ToString(){
        return this.mtmodel.ToString();
    }
    LoadString(TcString){
        let tmodel=this.NewTModel(this.element_obj);
        tmodel.LoadString(TcString);
        this.reset(tmodel);
    }
    //------------------------------------------------------
    input(dtype,data,...args){
        switch(dtype){
            case 'text':
                this.tmodel.input(data,args[0]);
                break;
            case 'image':
                this.tmodel.insert_image(data,args[0]);
                break;
        }
    }
    set_align(align){
        this.tmodel.set_align(align);
    }
}
let doc=document.getElementById('textctrl');
//let tdoc=new TControl(doc,ExTModel);
export let tctrl=new TControl(doc,CTModel);
//
document.body.style="background-color:#555555;";

//tdoc.debug();
//let bar=document.createElement('input');
//bar.type="range";
//bar.min=0.1;
//bar.step=0.05;
//bar.max=1;
//bar.value=1;
//bar.addEventListener('input',function(event){
//    tctrl.zoom(bar.value);
//})
//document.body.appendChild(bar);
//tctrl.tmodel.insert_chars('自動');
//`fontSize=30;fontFamily=新細明體;epcode=1;type=epcode;bgcolor=transparent;scale=15,40;osize=14,36;rotate=0|fontSize=30;fontFamily=新細明體;epcode=2;type=epcode;bgcolor=transparent;rotate=0;osize=14,36;scale=15,40|fontSize=30;fontFamily=新細明體;epcode=3;type=epcode;bgcolor=transparent;rotate=0;osize=14,36;scale=15,40`
