import { body, defaultStyle } from "../ui/base.js";
import { TControl } from "./tcontrol.js";
import { InputBox, SingleLineModel } from "./tmodel.js";


let tctrl=new TControl(body,null,[100,100],[600,800]);
//tctrl.inputText('這是一段文字');
tctrl.inputText('這是預設內容，ofemfo\n第二行內容!!');

class VarName extends SingleLineModel{
    constructor(tcontrol,pos,size,_style=null){
        _style=defaultStyle(_style,{'background-color':'yellow'});
        super(tcontrol,pos,size,_style);
    }
}

tctrl.inputTElements(new InputBox(tctrl.nowtblock));