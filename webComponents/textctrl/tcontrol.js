import { ArrayFilter, Dict_to_DString, DString_to_Dict, isASCII,saveFile,uploadFile } from "../tool.js";
import { ContextMenu, defaultStyle, getRelPos, Panel, TextInput, TransFormer } from "../ui/base.js";
import { Modal } from "../ui/widget.js";
import { SbControl } from "./auxiliary.js";
import { DemoModel, TModel } from "./tmodel.js";

class TeTransFormer extends TransFormer{
    constructor(tcontrol){
        super(tcontrol.parent);
        this.tcontrol=tcontrol;
        //----------------------------- 轉換
        this.nowTElement=null;
        let tetfr=this;
        this.addEvent('transformup',()=>{
            if(tetfr.nowTElement!=null){
                tetfr.nowTElement.transformup();
                this.tcontrol.nowtblock.arrange();
            }
        });

    }
    transformTElement(telement){
        this.nowTElement=telement;
        this.speed=1/this.tcontrol.zoomRate;
        this.transform(telement,(transformDict)=>{
            telement.transform(transformDict);
            this.tcontrol.nowtblock.arrange();
        });

    }
    hide(){
        console.log('被隱藏');
        super.hide();
        this.nowTElement=null;
    }
}

export class TControl extends Panel{
    constructor(parent,mtmodel_class=null,mdict=null,pos=null,size=null,_style=null){
        _style=defaultStyle(_style,{'user-select':'none','min-height':'200px'});
        super(parent,pos,size,_style);
        //----------------------------------------------------------------- 基本參數
        this.tmodels=[];
        this.zoomRate=1;
        this.renderTime=performance.now();
        //----------------------------------------------------------------- 輔助工具
        this.cm=new ContextMenu(parent);
        this.tetfr=new TeTransFormer(this);
        this.sbc=new SbControl(this);
        //----------------------------------------------------------------- 主要 tmodel
        if(mtmodel_class==null) mtmodel_class=DemoModel;
        this.mtmodel=new mtmodel_class(this,mdict,[0,0],[this.size[0],this.size[1]]);
        this.nowtmodel=this.mtmodel;
        this.nowtblock=this.nowtmodel.nowtblock;
        //---------------------------------focus
        this._focuslock=false;
        //-----------------------------------------------------------------滑鼠管控
        function onmouse(event,mouseup=false){
            for(let i=0;i<tcontrol.tmodels.length;i++){
                let tmodel=tcontrol.tmodels[i];
                let apos=tmodel.getScreenPos();
                let relPos=[(event.clientX-apos[0])/tcontrol.zoomRate,(event.clientY-apos[1])/tcontrol.zoomRate];
                for(let j=0;j<tmodel.tblocks.length;j++){
                    let tblock=tmodel.tblocks[j];
                    if(mouseup) tblock.onmouseup(relPos,event);
                    else tblock.onmousemove(relPos,event);
                }
            }
            if(mouseup) tcontrol.releasefocus();
        }
        let tcontrol=this;
        let frame=this.getFrame();
        frame.addEvent('onmousemove',function (event){onmouse(event)});
        frame.addEvent('onmouseup',function (event){onmouse(event,true);});
        frame.addEvent('scroll',function (event){tcontrol.renderData()});
        //-----------------------------------------------------------------鍵盤輸入
        let inp=new TextInput(this,(event)=>{tcontrol.nowtblock.input(event);},null,[1,10],{
            'background-color':'transparent','outline':'none','border':'transparent','z-index':'1'});
        inp.addEvent('paste',function (event){
            event.preventDefault();
            const pastedData = (event.clipboardData || window.clipboardData).getData('text');
            tcontrol.nowtblock.paste(pastedData);
        });
        inp.addEvent('keydown',function (event){tcontrol.nowtblock.keydown(event);});
        inp.addEvent('keyup',function (event){tcontrol.nowtblock.keyup(event);});
        inp.addEvent('contextmenu',function(event){event.preventDefault();tcontrol.nowtmodel.trigger_event('contextmenu',event)});
        inp.hide();
        //-----------------------------------------------------------------基本參數
        this.inp=inp;
        
    }
    //-------------------------------------------縮放
    zoom(zoomRate){
        this.setScale([zoomRate,zoomRate]);
        this.zoomRate=zoomRate;
        this.mtmodel.nowtblock.arrange();
        this.mtmodel.renderData();
        //for(let i=0;i<this.tmodels;i++)
          //  this.tmodels[i].renderData();
    }
    getAbsPosAfterZoom(obj){  //取得 telement 或 tmodel 的縮放後絕對座標
        let apos=this.getAbsPos();  // tmodel 的 parent 是自己
        let zoomRate=this.zoomRate;
        let pos=[apos[0]+obj.pos[0]*zoomRate,apos[1]+obj.pos[1]*zoomRate];
        if(obj.bdict){  //代表是 telement
            let tmodel=obj.tmodel;
            return [pos[0]+tmodel.pos[0]*zoomRate,pos[1]+tmodel.pos[1]*zoomRate];
        }
        return pos;
    }
    //================================================================================= 輔助工具
    hideAuxiliary(){
        this.cm.hide();
        this.tetfr.hide();
        this.sbc.hide();
    }
    newSelectionBox(sbName,dealTypesArray,describeList,size,_style=null){
        return this.sbc.newSelectionBox(sbName,dealTypesArray,describeList,size,_style);
    }
    showSelectionBox(dealType,telement){
        this.sbc.showSelectionBox(dealType,telement);
    }
    //-----------------------------------------------------custmenu修改
    addMenu(layer,menu_name,paramsList,_style=null){
        this.cm.addMenu(layer,menu_name,paramsList,_style);
    }
    //================================================================================= 顯示畫布(不排列)
    renderData(){
        console.log('滾動了');
        let t=performance.now();
        let mtmodel=this.mtmodel;
        if(mtmodel && t>this.renderTime){
            //this.hideAuxiliary();
            //console.log('tcontrol 呼叫渲染');
            mtmodel.renderData();
            setTimeout(()=>{
                mtmodel.renderData();
            },200);
            //console.log('該次渲染時間:',performance.now()-t);
            this.renderTime=performance.now()+220;
        }
    }
    //================================================================================= 管控 tmodel
    addTmodel(tmodel){
        if(!this.tmodels.includes(tmodel)) this.tmodels.push(tmodel);
    }
    removeTmodel(tmodel){
        this.tmodels=ArrayFilter(this.tmodels,tmodel);
    }
    //================================================================================= focus
    acquirefocus(tblock){
        if(!this._focuslock){
            //if(this.nowtblock!=tblock) this.nowtblock.unfocus();
            //tblock.focus();
            this.nowtblock=tblock;
            this.nowtmodel=tblock.tmodel;
            this._focuslock=true;
            return true;
        }
        return false;
    }
    releasefocus(){
        this._focuslock=false;
    }
    //=================================================================================外接操作(視為真實操作)
    //----------------------------------------------------- 輸入內容
    inputTElements(telement_bdicts){
        //console.log('插入前:',this.nowtblock.relObjs.slice());
        this.nowtblock.inputTElements(telement_bdicts);
        this.nowtblock.arrange();
        //console.log('插入後:',this.nowtblock.relObjs);
    }
    inputText(text){
        this.nowtblock.inputText(text);
        this.nowtblock.arrange();
    }
    insertImage(src,_dict=null){
        this.nowtblock.insertImage(src,_dict);
        this.nowtblock.arrange();
    }
    setAlign(align,ratio='align'){
        this.nowtblock.setAlign(align,ratio);
        this.nowtblock.arrange();
    }
    setHrLine(lineHeight){
        this.nowtblock.setHrLine(lineHeight);
        this.nowtblock.arrange();
    }
    insertRectIBox(){
        this.nowtblock.insertRectIBox();
        this.nowtblock.arrange();
    }
    insertTable(cols,rows){}
    //----------------------------------------------------- 清空內容
    clear(){
        this.mtmodel.nowtblock.clear();
        this.mtmodel.renderData();
        this.nowtblock=this.mtmodel.nowtblock;
        this.nowtmodel=this.mtmodel;
    }
    //----------------------------------------------------- 儲存格式
    getDict(){
        let tcDict={'mtmodel':this.mtmodel.ToTmString()};
        return tcDict;
    }
    loadDict(tcDict){
        this.clear();
        this.mtmodel.LoadTmString(tcDict['mtmodel']);
    }
    ToTcString(){
        return Dict_to_DString(this.getDict());
    }
    LoadTcString(tcString){
        let tcDict=DString_to_Dict(tcString);
        this.loadDict(tcDict);
    }
    //----------------------------------------------------- 載入與儲存
    saveFile(fileName='save.txt'){
        saveFile(fileName,this.ToTcString(),'text');
    }
    loadFile(){
        let tcontrol=this;
        uploadFile((file)=>{
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function(e) {
              const fileContent = e.target.result; // 取得檔案的字串內容
              tcontrol.LoadTcString(fileContent);
              //tcontrol.zoom(1.5);
              //tcontrol.nowtblock.arrange();
              //tcontrol.renderData();
            };
        });
    }
}