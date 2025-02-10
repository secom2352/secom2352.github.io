import { ArrayFilter, isASCII } from "../tool.js";
import { ContextMenu, defaultStyle, Panel, TextInput } from "../ui/base.js";
import { Modal } from "../ui/widget.js";
import { DemoModel, TModel } from "./tmodel.js";

export class TControl extends Panel{
    constructor(parent,mtmodel_class=null,pos=null,size=null,_style=null){
        _style=defaultStyle(_style,{'user-select':'none','min-height':'100px'});
        super(parent,pos,size,_style);
        this.tmodels=[];
        //-----------------------------------------------------------------custextmenu
        this.cm=new ContextMenu(this);
        //-----------------------------------------------------------------tmodel
        if(mtmodel_class==null) mtmodel_class=DemoModel;
        this.mtmodel=new mtmodel_class(this,[0,0],['100%','100%']);
        this.nowtmodel=this.mtmodel;
        this.nowtblock=this.nowtmodel.nowtblock;
        //---------------------------------focus
        this._focuslock=false;
        //-----------------------------------------------------------------滑鼠管控
        function onmouse(event,mouseup=false){
            for(let i=0;i<tcontrol.tmodels.length;i++){
                let tmodel=tcontrol.tmodels[i];
                let apos=tmodel.getAbsPos();
                let relPos=[event.clientX-apos[0],event.clientY-apos[1]];
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
        inp.hide();
        this.inp=inp;
        
    }
    renderData(){                  //顯示畫布
        for(let i=0;i<this.tmodels.length;i++)
            this.tmodels[i].renderData();
    }
    //-----------------------------------------------------管控 tmodel
    addTmodel(tmodel){
        if(!this.tmodels.includes(tmodel)) this.tmodels.push(tmodel);
    }
    removeTmodel(tmodel){
        this.tmodels=ArrayFilter(this.tmodels,tmodel);
    }
    //-----------------------------------------------------focus
    acquirefocus(tblock){
        //console.log('接受請求');
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
    //-----------------------------------------------------custmenu修改
    addMenu(layer,menu_name,paramsList,_style=null){
        this.cm.addMenu(layer,menu_name,paramsList,_style);
    }
    //-----------------------------------------------------輸入內容(系統調用)
    inputTElements(telements){
        this.nowtblock.inputTElements(telements);
    }
    inputText(text){
        this.nowtblock.inputText(text);
    }
    insertImage(src,size=null){
        this.nowtblock.insertImage(src);
    }
    setAlign(align,ratio='align'){
        this.nowtblock.setAlign(align,ratio);
    }
    insertTable(cols,rows){}
    //-----------------------------------------------------
    clear(){
        this.mtmodel.nowtblock.clear();
        this.mtmodel.renderData();
        this.nowtblock=this.mtmodel.nowtblock;
        this.nowtmodel=this.mtmodel;
    }
    saveFile(){
        let code=this.nowtblock.ToTeString();
        let utf8Encode = new TextEncoder();
        const blob = new Blob([utf8Encode.encode(code)], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'save.txt';
        a.click();
        // 釋放 URL 對象
        URL.revokeObjectURL(url);
    }
    loadFile(){
        let tcontrol=this;
        let file=document.createElement('input');
        file.type='file';
        file.addEventListener('change', function(event) {
            const file = event.target.files[0]; // 取得使用者上傳的檔案
            if (file) {
              const reader = new FileReader();
              reader.readAsText(file);
              reader.onload = function(e) {
                const fileContent = e.target.result; // 取得檔案的字串內容
                tcontrol.clear();
                tcontrol.nowtblock.LoadTeString(fileContent);
              };
            }
          });
        file.click();
    }
}